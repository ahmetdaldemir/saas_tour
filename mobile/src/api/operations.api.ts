/**
 * Operations API Client
 * Handles all API calls for operations module
 */

import { apiClient } from './api';
import { buildEndpoint, API_ENDPOINTS } from '../services/api-endpoints';
import type {
  OperationsResponse,
  CompleteOperationRequest,
  CompleteOperationResponse,
  DamageCompareResponse,
} from '../types/operations';

export const operationsApi = {
  /**
   * Get operations for a specific date
   */
  async getOperations(date: string): Promise<OperationsResponse> {
    const response = await apiClient.instance.get<OperationsResponse>(
      buildEndpoint(API_ENDPOINTS.ops.operations.list),
      { params: { date } }
    );
    return response.data;
  },

  /**
   * Get pickup draft/completed data
   */
  async getPickup(rentalId: string): Promise<any> {
    const response = await apiClient.instance.get(
      buildEndpoint(API_ENDPOINTS.ops.operations.getPickup, rentalId)
    );
    return response.data;
  },

  /**
   * Save pickup draft
   */
  async savePickupDraft(rentalId: string, data: {
    km?: number;
    fuelLevel?: string;
    photoMediaIds?: string[];
  }): Promise<void> {
    await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.operations.savePickupDraft, rentalId),
      data
    );
  },

  /**
   * Complete pickup
   */
  async completePickup(rentalId: string, data: CompleteOperationRequest): Promise<CompleteOperationResponse> {
    const response = await apiClient.instance.post<CompleteOperationResponse>(
      buildEndpoint(API_ENDPOINTS.ops.operations.completePickup, rentalId),
      data
    );
    return response.data;
  },

  /**
   * Get return draft/completed data
   */
  async getReturn(rentalId: string): Promise<any> {
    const response = await apiClient.instance.get(
      buildEndpoint(API_ENDPOINTS.ops.operations.getReturn, rentalId)
    );
    return response.data;
  },

  /**
   * Save return draft
   */
  async saveReturnDraft(rentalId: string, data: {
    km?: number;
    fuelLevel?: string;
    photoMediaIds?: string[];
  }): Promise<void> {
    await apiClient.instance.post(
      buildEndpoint(API_ENDPOINTS.ops.operations.saveReturnDraft, rentalId),
      data
    );
  },

  /**
   * Complete return
   */
  async completeReturn(rentalId: string, data: CompleteOperationRequest): Promise<CompleteOperationResponse> {
    const response = await apiClient.instance.post<CompleteOperationResponse>(
      buildEndpoint(API_ENDPOINTS.ops.operations.completeReturn, rentalId),
      data
    );
    return response.data;
  },

  /**
   * Get damage comparison
   */
  async getDamageCompare(rentalId: string): Promise<DamageCompareResponse> {
    const response = await apiClient.instance.get<DamageCompareResponse>(
      buildEndpoint(API_ENDPOINTS.ops.operations.getDamageCompare, rentalId)
    );
    return response.data;
  },

  /**
   * Upload media file
   */
  async uploadMedia(fileUri: string, rentalId: string, slotIndex: number): Promise<{ mediaId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg',
      name: `photo_${slotIndex}.jpg`,
    } as any);
    formData.append('rentalId', rentalId);
    formData.append('slotIndex', slotIndex.toString());

    const response = await apiClient.instance.post<{ mediaId: string; url: string }>(
      buildEndpoint(API_ENDPOINTS.ops.operations.uploadMedia),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

