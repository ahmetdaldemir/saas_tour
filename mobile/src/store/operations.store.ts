/**
 * Operations Store (Zustand)
 * Manages operations state and draft data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OperationItem, OperationType, FuelLevel } from '../types/operations';
import { operationsApi } from '../api/operations.api';
import { DraftRepository, DraftPhotoRepository } from '../storage/database';
import { useAuthStore } from './auth.store';
import { v4 as uuidv4 } from 'uuid';

interface OperationsState {
  // Current date
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Operations data
  pickups: OperationItem[];
  returns: OperationItem[];
  loading: boolean;
  error: string | null;

  // Actions
  loadOperations: (date?: string) => Promise<void>;
  refreshOperations: () => Promise<void>;

  // Draft management
  getDraft: (rentalId: string, type: OperationType) => Promise<any | null>;
  saveDraft: (
    rentalId: string,
    type: OperationType,
    data: { km?: number; fuelLevel?: FuelLevel; photos?: Array<{ slotIndex: number; uri: string }> }
  ) => Promise<void>;
  savePhoto: (
    rentalId: string,
    type: OperationType,
    slotIndex: number,
    uri: string
  ) => Promise<void>;
  removePhoto: (rentalId: string, type: OperationType, slotIndex: number) => Promise<void>;
  getPhotos: (rentalId: string, type: OperationType) => Promise<any[]>;
  canComplete: (rentalId: string, type: OperationType) => Promise<boolean>;
}

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set, get) => ({
      selectedDate: new Date().toISOString().split('T')[0],
      pickups: [],
      returns: [],
      loading: false,
      error: null,

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
        get().loadOperations(date);
      },

      loadOperations: async (date?: string) => {
        const { selectedDate, tenantId } = get();
        const targetDate = date || selectedDate;
        const authState = useAuthStore.getState();

        if (!authState.tenantId) {
          set({ error: 'No tenant ID' });
          return;
        }

        set({ loading: true, error: null });

        try {
          const data = await operationsApi.getOperations(targetDate);

          // Enrich with local draft status
          const enrichedPickups = await Promise.all(
            data.pickups.map(async (item) => {
              const draft = await DraftRepository.findByRental(authState.tenantId!, item.rentalId, 'pickup');
              return {
                ...item,
                hasLocalDraft: !!draft,
                syncStatus: draft?.server_synced_at ? 'synced' : draft ? 'pending' : undefined,
              };
            })
          );

          const enrichedReturns = await Promise.all(
            data.returns.map(async (item) => {
              const draft = await DraftRepository.findByRental(authState.tenantId!, item.rentalId, 'return');
              return {
                ...item,
                hasLocalDraft: !!draft,
                syncStatus: draft?.server_synced_at ? 'synced' : draft ? 'pending' : undefined,
              };
            })
          );

          set({
            pickups: enrichedPickups,
            returns: enrichedReturns,
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to load operations',
            loading: false,
          });
        }
      },

      refreshOperations: async () => {
        await get().loadOperations();
      },

      getDraft: async (rentalId: string, type: OperationType) => {
        const authState = useAuthStore.getState();
        if (!authState.tenantId) return null;

        return await DraftRepository.findByRental(authState.tenantId, rentalId, type);
      },

      saveDraft: async (
        rentalId: string,
        type: OperationType,
        data: { km?: number; fuelLevel?: FuelLevel; photos?: Array<{ slotIndex: number; uri: string }> }
      ) => {
        const authState = useAuthStore.getState();
        if (!authState.tenantId) throw new Error('No tenant ID');

        // Get or create draft
        let draft = await DraftRepository.findByRental(authState.tenantId, rentalId, type);
        const draftId = draft?.id || uuidv4();

        if (!draft) {
          await DraftRepository.save({
            id: draftId,
            tenantId: authState.tenantId,
            rentalId,
            type,
            km: data.km,
            fuelLevel: data.fuelLevel,
            status: 'draft',
          });
        } else {
          await DraftRepository.save({
            id: draftId,
            tenantId: authState.tenantId,
            rentalId,
            type,
            km: data.km ?? draft.km,
            fuelLevel: data.fuelLevel ?? draft.fuel_level,
            status: draft.status,
          });
        }

        // Save photos
        if (data.photos) {
          for (const photo of data.photos) {
            await DraftPhotoRepository.save({
              id: uuidv4(),
              draftId,
              slotIndex: photo.slotIndex,
              localUri: photo.uri,
              uploadStatus: 'pending',
            });
          }
        }

        // Queue sync job (if online)
        const { UploadJobRepository } = await import('../storage/database');
        const { isOnline } = await import('../queue/upload-queue');
        if (await isOnline()) {
          const photos = await DraftPhotoRepository.findByDraft(draftId);
          const photoMediaIds = photos
            .sort((a, b) => a.slot_index - b.slot_index)
            .map((p) => p.server_media_id)
            .filter(Boolean) as string[];

          await UploadJobRepository.create({
            id: uuidv4(),
            tenantId: authState.tenantId,
            kind: 'SYNC_DRAFT',
            rentalId,
            draftId,
            payloadJson: {
              rentalId,
              type,
              km: data.km,
              fuelLevel: data.fuelLevel,
              photoMediaIds,
            },
          });
        }
      },

      savePhoto: async (rentalId: string, type: OperationType, slotIndex: number, uri: string) => {
        const authState = useAuthStore.getState();
        if (!authState.tenantId) throw new Error('No tenant ID');

        // Get or create draft
        let draft = await DraftRepository.findByRental(authState.tenantId, rentalId, type);
        const draftId = draft?.id || uuidv4();

        if (!draft) {
          await DraftRepository.save({
            id: draftId,
            tenantId: authState.tenantId,
            rentalId,
            type,
            status: 'draft',
          });
        }

        // Save photo
        await DraftPhotoRepository.save({
          id: uuidv4(),
          draftId,
          slotIndex,
          localUri: uri,
          uploadStatus: 'pending',
        });

        // Queue upload job
        const { UploadJobRepository } = await import('../storage/database');
        await UploadJobRepository.create({
          id: uuidv4(),
          tenantId: authState.tenantId,
          kind: 'UPLOAD_PHOTO',
          rentalId,
          draftId,
          payloadJson: {
            photoId: uuidv4(),
            localUri: uri,
            rentalId,
            slotIndex,
          },
        });
      },

      removePhoto: async (rentalId: string, type: OperationType, slotIndex: number) => {
        const authState = useAuthStore.getState();
        if (!authState.tenantId) return;

        const draft = await DraftRepository.findByRental(authState.tenantId, rentalId, type);
        if (!draft) return;

        const photos = await DraftPhotoRepository.findByDraft(draft.id);
        const photo = photos.find((p) => p.slot_index === slotIndex);
        if (photo) {
          // Delete from database (cascade will handle it, but we can be explicit)
          const db = await import('../storage/database').then((m) => m.getDatabase());
          await db.transaction(async (tx) => {
            await tx.executeSqlAsync(`DELETE FROM draft_photos WHERE id = ?`, [photo.id]);
          });
        }
      },

      getPhotos: async (rentalId: string, type: OperationType) => {
        const authState = useAuthStore.getState();
        if (!authState.tenantId) return [];

        const draft = await DraftRepository.findByRental(authState.tenantId, rentalId, type);
        if (!draft) return [];

        return await DraftPhotoRepository.findByDraft(draft.id);
      },

      canComplete: async (rentalId: string, type: OperationType) => {
        const authState = useAuthStore.getState();
        if (!authState.tenantId) return false;

        const draft = await DraftRepository.findByRental(authState.tenantId, rentalId, type);
        if (!draft) return false;

        if (!draft.km || !draft.fuel_level) return false;

        const photos = await DraftPhotoRepository.findByDraft(draft.id);
        if (photos.length < 8) return false;

        // Check all photos are uploaded or at least queued
        const allUploaded = photos.every(
          (p) => p.upload_status === 'uploaded' || p.upload_status === 'uploading'
        );
        return allUploaded;
      },
    }),
    {
      name: 'operations-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selectedDate: state.selectedDate }),
    }
  )
);

