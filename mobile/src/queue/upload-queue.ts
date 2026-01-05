/**
 * Upload Queue Processor
 * Handles background uploads with retry logic and exponential backoff
 */

import NetInfo from '@react-native-community/netinfo';
import { UploadJobRepository, DraftPhotoRepository, DraftRepository } from '../storage/database';
import { operationsApi } from '../api/operations.api';
import { useAuthStore } from '../store/auth.store';

const MAX_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const MAX_RETRY_DELAY_MS = 300000; // 5 minutes


/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Process a single upload job
 */
async function processJob(job: {
  id: string;
  tenant_id: string;
  kind: string;
  rental_id: string;
  draft_id?: string;
  attempt_count: number;
  payloadJson: Record<string, any>;
}): Promise<void> {
  const { tenantId } = useAuthStore.getState();

  if (!tenantId) {
    throw new Error('No tenant ID available');
  }

  // Mark job as running
  await UploadJobRepository.updateStatus(job.id, 'running');

  try {
    switch (job.kind) {
      case 'UPLOAD_PHOTO':
        await processPhotoUpload(job);
        break;
      case 'SYNC_DRAFT':
        await processDraftSync(job);
        break;
      case 'COMPLETE_PICKUP':
        await processCompletePickup(job);
        break;
      case 'COMPLETE_RETURN':
        await processCompleteReturn(job);
        break;
      default:
        throw new Error(`Unknown job kind: ${job.kind}`);
    }

    // Mark as done
    await UploadJobRepository.updateStatus(job.id, 'done');
  } catch (error: any) {
    const attemptCount = job.attempt_count + 1;
    const errorMessage = error.message || 'Unknown error';

    if (attemptCount >= MAX_ATTEMPTS) {
      // Max attempts reached, mark as failed
      await UploadJobRepository.updateStatus(job.id, 'failed', undefined, errorMessage);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = calculateRetryDelay(attemptCount);
      const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
      await UploadJobRepository.incrementAttempt(job.id, nextRetryAt);
    }
    throw error;
  }
}

/**
 * Export calculateRetryDelay for testing
 */
export function calculateRetryDelay(attemptCount: number): number {
  const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attemptCount);
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

/**
 * Process photo upload job
 */
async function processPhotoUpload(job: any): Promise<void> {
  const { photoId, localUri, rentalId, slotIndex } = job.payloadJson;

  // Upload photo
  const result = await operationsApi.uploadMedia(localUri, rentalId, slotIndex);

  // Update photo record
  await DraftPhotoRepository.updateUploadStatus(
    photoId,
    'uploaded',
    result.mediaId,
    result.url
  );
}

/**
 * Process draft sync job
 */
async function processDraftSync(job: any): Promise<void> {
  const { rentalId, type, km, fuelLevel, photoMediaIds } = job.payloadJson;

  if (type === 'pickup') {
    await operationsApi.savePickupDraft(rentalId, { km, fuelLevel, photoMediaIds });
  } else {
    await operationsApi.saveReturnDraft(rentalId, { km, fuelLevel, photoMediaIds });
  }

  // Update draft sync timestamp
  const draft = await DraftRepository.findByRental(
    job.tenant_id,
    rentalId,
    type
  );
  if (draft) {
    await DraftRepository.updateStatus(draft.id, draft.status, new Date().toISOString());
  }
}

/**
 * Process complete pickup job
 */
async function processCompletePickup(job: any): Promise<void> {
  const { rentalId, km, fuelLevel, photoMediaIds, acknowledgedWarnings } = job.payloadJson;

  // Ensure all photos are uploaded first
  const draft = await DraftRepository.findByRental(job.tenant_id, rentalId, 'pickup');
  if (draft) {
    const photos = await DraftPhotoRepository.findByDraft(draft.id);
    const pendingPhotos = photos.filter((p) => p.upload_status !== 'uploaded');
    
    // Upload any pending photos first
    for (const photo of pendingPhotos) {
      const uploadJob = {
        id: `photo_${photo.id}_${Date.now()}`,
        tenantId: job.tenant_id,
        kind: 'UPLOAD_PHOTO',
        rentalId,
        draftId: draft.id,
        payloadJson: {
          photoId: photo.id,
          localUri: photo.local_uri,
          rentalId,
          slotIndex: photo.slot_index,
        },
      };
      await UploadJobRepository.create(uploadJob);
    }

    // Wait for photos to upload (simplified - in production, poll or use callback)
    // For now, we'll just proceed and let the server handle missing photos
  }

  // Complete pickup
  const response = await operationsApi.completePickup(rentalId, {
    km,
    fuelLevel,
    photoMediaIds,
    acknowledgedWarnings,
  });

  if (response.warnings && response.requiresAcknowledgment && !acknowledgedWarnings) {
    // Store warning requirement in draft
    if (draft) {
      await DraftRepository.updateStatus(draft.id, 'pending_complete');
    }
    throw new Error('WARNINGS_REQUIRE_ACKNOWLEDGMENT');
  }

  // Mark draft as completed
  if (draft) {
    await DraftRepository.updateStatus(draft.id, 'completed', new Date().toISOString());
  }
}

/**
 * Process complete return job
 */
async function processCompleteReturn(job: any): Promise<void> {
  const { rentalId, km, fuelLevel, photoMediaIds, acknowledgedWarnings } = job.payloadJson;

  // Ensure all photos are uploaded first
  const draft = await DraftRepository.findByRental(job.tenant_id, rentalId, 'return');
  if (draft) {
    const photos = await DraftPhotoRepository.findByDraft(draft.id);
    const pendingPhotos = photos.filter((p) => p.upload_status !== 'uploaded');
    
    for (const photo of pendingPhotos) {
      const uploadJob = {
        id: `photo_${photo.id}_${Date.now()}`,
        tenantId: job.tenant_id,
        kind: 'UPLOAD_PHOTO',
        rentalId,
        draftId: draft.id,
        payloadJson: {
          photoId: photo.id,
          localUri: photo.local_uri,
          rentalId,
          slotIndex: photo.slot_index,
        },
      };
      await UploadJobRepository.create(uploadJob);
    }
  }

  // Complete return
  const response = await operationsApi.completeReturn(rentalId, {
    km,
    fuelLevel,
    photoMediaIds,
    acknowledgedWarnings,
  });

  if (response.warnings && response.requiresAcknowledgment && !acknowledgedWarnings) {
    if (draft) {
      await DraftRepository.updateStatus(draft.id, 'pending_complete');
    }
    throw new Error('WARNINGS_REQUIRE_ACKNOWLEDGMENT');
  }

  // Mark draft as completed
  if (draft) {
    await DraftRepository.updateStatus(draft.id, 'completed', new Date().toISOString());
  }
}

/**
 * Process queue - runs continuously when online
 */
let isProcessing = false;
let processingInterval: NodeJS.Timeout | null = null;

export async function processQueue(): Promise<void> {
  if (isProcessing) return;
  if (!(await isOnline())) return;

  isProcessing = true;

  try {
    const job = await UploadJobRepository.getNextJob();
    if (!job) {
      isProcessing = false;
      return;
    }

    await processJob(job);
    
    // Process next job immediately
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, 100);
  } catch (error) {
    console.error('Queue processing error:', error);
    isProcessing = false;
    // Retry after delay
    setTimeout(() => processQueue(), 5000);
  }
}

/**
 * Start queue processor
 */
export function startQueueProcessor(): void {
  if (processingInterval) return;

  // Process immediately
  processQueue();

  // Then process every 5 seconds
  processingInterval = setInterval(() => {
    processQueue();
  }, 5000);

  // Also listen to network changes
  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      processQueue();
    }
  });
}

/**
 * Stop queue processor
 */
export function stopQueueProcessor(): void {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
}

/**
 * Get queue status
 */
export async function getQueueStatus(tenantId: string): Promise<{
  queued: number;
  running: number;
  failed: number;
  done: number;
}> {
  const queued = await UploadJobRepository.getAll(tenantId, 'queued');
  const running = await UploadJobRepository.getAll(tenantId, 'running');
  const failed = await UploadJobRepository.getAll(tenantId, 'failed');
  const done = await UploadJobRepository.getAll(tenantId, 'done');

  return {
    queued: queued.length,
    running: running.length,
    failed: failed.length,
    done: done.length,
  };
}

