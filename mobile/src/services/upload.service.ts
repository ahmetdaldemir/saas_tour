import { apiClient } from './api';
import { API_ENDPOINTS, buildEndpoint } from './api-endpoints';
import * as FileSystem from 'expo-file-system';

export interface UploadResponse {
  success: boolean;
  url: string;
  fullUrl: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

class UploadService {
  async uploadFile(uri: string, type: 'image' | 'video'): Promise<UploadResponse> {
    const filename = uri.split('/').pop() || 'file';
    const fileType = type === 'image' ? 'image/jpeg' : 'video/mp4';
    
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type: fileType,
    } as any);

    const response = await apiClient.instance.post<UploadResponse>(
      buildEndpoint(API_ENDPOINTS.settings.upload),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async uploadMultipleFiles(uris: string[], type: 'image' | 'video'): Promise<UploadResponse[]> {
    const uploads = uris.map((uri) => this.uploadFile(uri, type));
    return Promise.all(uploads);
  }
}

export const uploadService = new UploadService();

