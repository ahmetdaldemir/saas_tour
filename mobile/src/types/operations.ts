/**
 * Operations Module Type Definitions
 */

export type OperationType = 'pickup' | 'return';

export type OperationStatus = 'pending' | 'completed' | 'draft';

export type FuelLevel = 'FULL' | 'THREE_QUARTERS' | 'HALF' | 'QUARTER' | 'EMPTY';

export type UploadJobKind = 'UPLOAD_PHOTO' | 'SYNC_DRAFT' | 'COMPLETE_PICKUP' | 'COMPLETE_RETURN';

export type UploadJobStatus = 'queued' | 'running' | 'failed' | 'done';

export type PhotoUploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface OperationItem {
  id: string;
  rentalId: string;
  type: OperationType;
  status: OperationStatus;
  reservationCode: string;
  plateNumber: string;
  scheduledTime: string;
  location?: string;
  customerName?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    year?: number;
  };
  // Local sync status
  syncStatus?: 'synced' | 'pending' | 'uploading' | 'error';
  hasLocalDraft?: boolean;
}

export interface OperationsResponse {
  pickups: OperationItem[];
  returns: OperationItem[];
  date: string;
}

export interface Draft {
  id: string;
  tenantId: string;
  rentalId: string;
  type: OperationType;
  km?: number;
  fuelLevel?: FuelLevel;
  status: 'draft' | 'pending_complete' | 'completed';
  lastSavedAt: string;
  serverSyncedAt?: string;
  payloadJson?: Record<string, any>;
}

export interface DraftPhoto {
  id: string;
  draftId: string;
  slotIndex: number; // 1-8
  localUri: string;
  serverMediaId?: string;
  serverUrl?: string;
  uploadStatus: PhotoUploadStatus;
  errorMessage?: string;
  createdAt: string;
}

export interface UploadJob {
  id: string;
  tenantId: string;
  kind: UploadJobKind;
  rentalId: string;
  draftId?: string;
  attemptCount: number;
  nextRetryAt?: string;
  status: UploadJobStatus;
  payloadJson: Record<string, any>;
  createdAt: string;
  errorMessage?: string;
}

export interface CompletionWarnings {
  kmDifference?: number;
  fuelMismatch?: boolean;
  damageDetected?: boolean;
  messages: string[];
}

export interface CompleteOperationRequest {
  km: number;
  fuelLevel: FuelLevel;
  photoMediaIds: string[]; // Ordered 1-8
  acknowledgedWarnings?: boolean;
}

export interface CompleteOperationResponse {
  success: boolean;
  warnings?: CompletionWarnings;
  requiresAcknowledgment?: boolean;
}

export interface DamageCompareResponse {
  pickupPhotos: Array<{ slotIndex: number; url: string }>;
  returnPhotos: Array<{ slotIndex: number; url: string }>;
  differences?: Array<{ slotIndex: number; description: string }>;
}

