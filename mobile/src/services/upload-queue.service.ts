import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadService, UploadResponse } from './upload.service';
import * as Network from 'expo-network';

const QUEUE_KEY = 'upload_queue';

export interface QueuedUpload {
  id: string;
  uri: string;
  type: 'image' | 'video';
  taskId?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: UploadResponse;
  retryCount: number;
  createdAt: number;
}

class UploadQueueService {
  private queue: QueuedUpload[] = [];
  private isProcessing = false;
  private listeners: Set<(queue: QueuedUpload[]) => void> = new Set();

  constructor() {
    this.loadQueue();
  }

  subscribe(listener: (queue: QueuedUpload[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.queue]));
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.notify();
      }
    } catch (error) {
      console.error('Failed to load upload queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save upload queue:', error);
    }
  }

  async add(uri: string, type: 'image' | 'video', taskId?: string): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item: QueuedUpload = {
      id,
      uri,
      type,
      taskId,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      createdAt: Date.now(),
    };

    this.queue.push(item);
    await this.saveQueue();
    this.notify();
    this.processQueue();

    return id;
  }

  async remove(id: string) {
    this.queue = this.queue.filter((item) => item.id !== id);
    await this.saveQueue();
    this.notify();
  }

  getQueue(): QueuedUpload[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.filter((item) => item.status === 'pending' || item.status === 'failed').length;
  }

  private async processQueue() {
    if (this.isProcessing) return;

    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      console.log('No network connection, skipping upload queue processing');
      return;
    }

    this.isProcessing = true;

    try {
      const pending = this.queue.filter(
        (item) => (item.status === 'pending' || item.status === 'failed') && item.retryCount < 3
      );

      for (const item of pending) {
        try {
          item.status = 'uploading';
          item.progress = 0;
          this.notify();
          await this.saveQueue();

          const result = await uploadService.uploadFile(item.uri, item.type);
          
          item.status = 'completed';
          item.progress = 100;
          item.result = result;
          item.error = undefined;
          this.notify();
          await this.saveQueue();
        } catch (error: any) {
          item.status = 'failed';
          item.error = error.message || 'Upload failed';
          item.retryCount += 1;
          this.notify();
          await this.saveQueue();

          // If retry count exceeded, keep it in queue for manual retry
          if (item.retryCount >= 3) {
            console.error(`Upload ${item.id} failed after 3 retries`);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async retry(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.status = 'pending';
      item.retryCount = 0;
      item.error = undefined;
      await this.saveQueue();
      this.notify();
      this.processQueue();
    }
  }

  async clearCompleted() {
    this.queue = this.queue.filter((item) => item.status !== 'completed');
    await this.saveQueue();
    this.notify();
  }
}

export const uploadQueueService = new UploadQueueService();

