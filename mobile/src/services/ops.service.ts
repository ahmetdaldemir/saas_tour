import { apiClient } from './api';
import { API_ENDPOINTS, buildEndpoint } from './api-endpoints';

export enum OpsTaskType {
  CHECKOUT = 'checkout',
  RETURN = 'return',
}

export enum OpsTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface OpsTask {
  id: string;
  type: OpsTaskType;
  status: OpsTaskStatus;
  reservation: {
    id: string;
    reference: string;
    customerName: string;
    checkIn?: Date | null;
    checkOut?: Date | null;
  };
  vehicle?: {
    plateNumber?: string;
    brand?: string;
    model?: string;
    year?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  reservationId: string;
  type: OpsTaskType;
}

export interface UpdateMediaInput {
  mediaIds: string[];
}

export interface VerifyDocsInput {
  licenseVerified: boolean;
  licenseMediaIds?: string[];
  passportVerified: boolean;
  passportMediaIds?: string[];
}

export interface FinalizeReturnInput {
  fuelLevel?: number;
  mileage?: number;
  damageNotes?: string;
  damageMediaIds?: string[];
}

export interface PrintPayload {
  lines: Array<{
    text: string;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    size?: number;
  }>;
  reservationId: string;
  reference: string;
}

class OpsService {
  async getTasks(filters?: {
    type?: OpsTaskType;
    status?: OpsTaskStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<OpsTask[]> {
    const params: any = {};
    if (filters?.type) params.type = filters.type;
    if (filters?.status) params.status = filters.status;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
    if (filters?.dateTo) params.dateTo = filters.dateTo.toISOString();

    const response = await apiClient.instance.get<OpsTask[]>(
      buildEndpoint(API_ENDPOINTS.ops.tasks.list),
      { params }
    );
    return response.data;
  }

  async getTask(id: string): Promise<OpsTask> {
    const response = await apiClient.instance.get<OpsTask>(
      buildEndpoint(API_ENDPOINTS.ops.tasks.getById, id)
    );
    return response.data;
  }

  async createOrGetTask(input: CreateTaskInput): Promise<{ id: string; type: OpsTaskType; status: OpsTaskStatus }> {
    const response = await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.create),
      input
    );
    return response.data;
  }

  async updateMedia(taskId: string, input: UpdateMediaInput): Promise<{ id: string; mediaIds: string[] }> {
    const response = await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.updateMedia, taskId),
      input
    );
    return response.data;
  }

  async verifyDocs(taskId: string, input: VerifyDocsInput): Promise<{
    id: string;
    licenseVerified: boolean;
    passportVerified: boolean;
  }> {
    const response = await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.verifyDocs, taskId),
      input
    );
    return response.data;
  }

  async finalizeCheckout(taskId: string): Promise<{ printPayload: PrintPayload; pdfUrl?: string }> {
    const response = await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.finalize, taskId)
    );
    return response.data;
  }

  async finalizeReturn(taskId: string, input: FinalizeReturnInput): Promise<void> {
    await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.finalizeReturn, taskId),
      input
    );
  }

  async getPrintPayload(taskId: string): Promise<PrintPayload> {
    const response = await apiClient.instance.get<PrintPayload>(
      buildEndpoint(API_ENDPOINTS.ops.tasks.print, taskId)
    );
    return response.data;
  }

  // Performance tracking methods
  async startTask(taskId: string): Promise<void> {
    await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.start, taskId)
    );
  }

  async updateChecklist(taskId: string, itemsTotal: number, itemsCompleted: number): Promise<void> {
    await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.updateChecklist, taskId),
      { itemsTotal, itemsCompleted }
    );
  }

  async updateMediaCounts(
    taskId: string,
    counts: {
      requiredPhotos?: number;
      uploadedPhotos?: number;
      requiredVideos?: number;
      uploadedVideos?: number;
    }
  ): Promise<void> {
    await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.updateMediaCounts, taskId),
      counts
    );
  }

  async recordError(taskId: string, errorType: 'dataEntry' | 'verification' | 'other', description?: string): Promise<void> {
    await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.tasks.recordError, taskId),
      { errorType, description }
    );
  }
}

export const opsService = new OpsService();

