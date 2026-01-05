/**
 * Operation Detail Screen
 * Handles both pickup and return completion with offline-first support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Modal, Portal, Checkbox } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { useOperationsStore } from '../store/operations.store';
import { FuelSelector } from '../components/operations/FuelSelector';
import { PhotoGrid } from '../components/operations/PhotoGrid';
import { operationsApi } from '../api/operations.api';
import { DraftRepository, DraftPhotoRepository, UploadJobRepository } from '../storage/database';
import { processQueue } from '../queue/upload-queue';
import { useAuthStore } from '../store/auth.store';
import { theme } from '../styles/theme';
import type { OperationType, FuelLevel, CompletionWarnings } from '../types/operations';
import { v4 as uuidv4 } from 'uuid';

export default function OperationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { rentalId, type } = route.params as { rentalId: string; type: OperationType };

  const [km, setKm] = useState<string>('');
  const [fuelLevel, setFuelLevel] = useState<FuelLevel | undefined>();
  const [photos, setPhotos] = useState<Array<{ slotIndex: number; uri: string; uploadStatus?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [warnings, setWarnings] = useState<CompletionWarnings | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  const { getDraft, saveDraft, savePhoto, getPhotos, canComplete: checkCanComplete } = useOperationsStore();
  const { tenantId } = useAuthStore();

  useEffect(() => {
    loadDraftData();

    // Check network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    return unsubscribe;
  }, [rentalId, type]);

  useEffect(() => {
    // Auto-save draft on any change (debounced)
    const timer = setTimeout(() => {
      if (km || fuelLevel || photos.length > 0) {
        saveDraftLocally();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [km, fuelLevel, photos]);

  useEffect(() => {
    // Check if can complete
    checkCompletionEligibility();
  }, [km, fuelLevel, photos]);

  const loadDraftData = async () => {
    try {
      const draft = await getDraft(rentalId, type);
      if (draft) {
        setKm(draft.km?.toString() || '');
        setFuelLevel(draft.fuel_level as FuelLevel);
      }

      const draftPhotos = await getPhotos(rentalId, type);
      setPhotos(
        draftPhotos.map((p) => ({
          slotIndex: p.slot_index,
          uri: p.local_uri,
          uploadStatus: p.upload_status,
        }))
      );
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const saveDraftLocally = async () => {
    try {
      await saveDraft(rentalId, type, {
        km: km ? parseFloat(km) : undefined,
        fuelLevel,
        photos: photos.map((p) => ({ slotIndex: p.slotIndex, uri: p.uri })),
      });

      // Try to sync if online
      if (isOnline) {
        const draftPhotos = await getPhotos(rentalId, type);
        const photoMediaIds = draftPhotos
          .sort((a, b) => a.slot_index - b.slot_index)
          .map((p) => p.server_media_id)
          .filter(Boolean) as string[];

        try {
          if (type === 'pickup') {
            await operationsApi.savePickupDraft(rentalId, {
              km: km ? parseFloat(km) : undefined,
              fuelLevel,
              photoMediaIds,
            });
          } else {
            await operationsApi.saveReturnDraft(rentalId, {
              km: km ? parseFloat(km) : undefined,
              fuelLevel,
              photoMediaIds,
            });
          }
        } catch (error) {
          // Silent fail - will retry via queue
          console.log('Draft sync failed, will retry:', error);
        }
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const checkCompletionEligibility = async () => {
    const eligible = await checkCanComplete(rentalId, type);
    setCanComplete(eligible);
  };

  const handlePhotoCapture = async (slotIndex: number, uri: string) => {
    // Save photo locally
    await savePhoto(rentalId, type, slotIndex, uri);

    // Update local state
    const updatedPhotos = [...photos];
    const existingIndex = updatedPhotos.findIndex((p) => p.slotIndex === slotIndex);
    if (existingIndex >= 0) {
      updatedPhotos[existingIndex] = { slotIndex, uri, uploadStatus: 'pending' };
    } else {
      updatedPhotos.push({ slotIndex, uri, uploadStatus: 'pending' });
    }
    setPhotos(updatedPhotos);

    // Queue upload job
    if (tenantId) {
      const draft = await DraftRepository.findByRental(tenantId, rentalId, type);
      if (draft) {
        const photo = (await DraftPhotoRepository.findByDraft(draft.id)).find(
          (p) => p.slot_index === slotIndex
        );
        if (photo) {
          await UploadJobRepository.create({
            id: uuidv4(),
            tenantId,
            kind: 'UPLOAD_PHOTO',
            rentalId,
            draftId: draft.id,
            payloadJson: {
              photoId: photo.id,
              localUri: uri,
              rentalId,
              slotIndex,
            },
          });
        }
      }
    }

    // Trigger queue processing
    processQueue();
  };

  const handleComplete = async () => {
    if (!canComplete) {
      Alert.alert('Eksik Bilgi', 'KM, yakıt seviyesi ve 8 fotoğraf zorunludur.');
      return;
    }

    setLoading(true);

    try {
      // Ensure all photos are uploaded
      const draft = await DraftRepository.findByRental(tenantId!, rentalId, type);
      if (draft) {
        const draftPhotos = await DraftPhotoRepository.findByDraft(draft.id);
        const pendingPhotos = draftPhotos.filter((p) => p.upload_status !== 'uploaded');

        // Upload pending photos first
        for (const photo of pendingPhotos) {
          await UploadJobRepository.create({
            id: uuidv4(),
            tenantId: tenantId!,
            kind: 'UPLOAD_PHOTO',
            rentalId,
            draftId: draft.id,
            payloadJson: {
              photoId: photo.id,
              localUri: photo.local_uri,
              rentalId,
              slotIndex: photo.slot_index,
            },
          });
        }

        // Get uploaded photo media IDs in order
        const uploadedPhotos = draftPhotos
          .sort((a, b) => a.slot_index - b.slot_index)
          .map((p) => p.server_media_id)
          .filter(Boolean) as string[];

        if (uploadedPhotos.length < 8) {
          Alert.alert('Fotoğraflar Yükleniyor', 'Tüm fotoğraflar yüklenene kadar bekleyin.');
          setLoading(false);
          return;
        }

        if (isOnline) {
          // Complete online
          const response =
            type === 'pickup'
              ? await operationsApi.completePickup(rentalId, {
                  km: parseFloat(km),
                  fuelLevel: fuelLevel!,
                  photoMediaIds: uploadedPhotos,
                  acknowledgedWarnings: acknowledgedWarnings,
                })
              : await operationsApi.completeReturn(rentalId, {
                  km: parseFloat(km),
                  fuelLevel: fuelLevel!,
                  photoMediaIds: uploadedPhotos,
                  acknowledgedWarnings: acknowledgedWarnings,
                });

          if (response.warnings && response.requiresAcknowledgment && !acknowledgedWarnings) {
            setWarnings(response.warnings);
            setShowWarningModal(true);
            setLoading(false);
            return;
          }

          // Mark as completed
          await DraftRepository.updateStatus(draft.id, 'completed', new Date().toISOString());

          Alert.alert('Başarılı', `${type === 'pickup' ? 'Çıkış' : 'Dönüş'} tamamlandı.`, [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          // Queue completion job
          await UploadJobRepository.create({
            id: uuidv4(),
            tenantId: tenantId!,
            kind: type === 'pickup' ? 'COMPLETE_PICKUP' : 'COMPLETE_RETURN',
            rentalId,
            draftId: draft.id,
            payloadJson: {
              rentalId,
              km: parseFloat(km),
              fuelLevel: fuelLevel!,
              photoMediaIds: uploadedPhotos,
              acknowledgedWarnings: false,
            },
          });

          await DraftRepository.updateStatus(draft.id, 'pending_complete');

          Alert.alert(
            'Kuyruğa Eklendi',
            `${type === 'pickup' ? 'Çıkış' : 'Dönüş'} tamamlanacak. Bağlantı gelince otomatik gönderilecek.`,
            [
              {
                text: 'Tamam',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'İşlem başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeWarnings = () => {
    setAcknowledgedWarnings(true);
    setShowWarningModal(false);
    handleComplete();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            {type === 'pickup' ? 'Araç Çıkışı' : 'Araç Dönüşü'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Rezervasyon: {rentalId}
          </Text>
        </View>

        {/* KM Input */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Kilometre *
          </Text>
          <TextInput
            mode="outlined"
            value={km}
            onChangeText={setKm}
            keyboardType="numeric"
            placeholder="Örn: 15000"
            style={styles.input}
            left={<TextInput.Icon icon="speedometer" />}
          />
        </View>

        {/* Fuel Selector */}
        <FuelSelector value={fuelLevel} onChange={setFuelLevel} />

        {/* Photo Grid */}
        <PhotoGrid
          photos={photos}
          onPhotoCapture={handlePhotoCapture}
          onPhotoReplace={(slotIndex) => {
            // Remove and recapture
            const updated = photos.filter((p) => p.slotIndex !== slotIndex);
            setPhotos(updated);
          }}
          onQuickCapture={async (slotIndex) => {
            // Quick capture for next empty slot
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('İzin Gerekli', 'Kamera erişimi gereklidir');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              await handlePhotoCapture(slotIndex, result.assets[0].uri);
            }
          }}
        />

        {/* Offline Notice */}
        {!isOnline && (
          <View style={styles.offlineNotice}>
            <MaterialCommunityIcons name="wifi-off" size={20} color={theme.colors.warning} />
            <Text variant="bodySmall" style={styles.offlineText}>
              Offline modda. Değişiklikler kaydedildi, bağlantı gelince gönderilecek.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <Button
          mode="outlined"
          onPress={() => {
            saveDraftLocally();
            Alert.alert('Taslak Kaydedildi', 'Değişiklikler kaydedildi.');
          }}
          style={styles.draftButton}
          icon="content-save"
        >
          Taslak
        </Button>
        <Button
          mode="contained"
          onPress={handleComplete}
          disabled={!canComplete || loading}
          loading={loading}
          style={styles.completeButton}
          buttonColor={theme.colors.primary}
          icon="check-circle"
        >
          Tamamla
        </Button>
      </View>

      {/* Warning Modal */}
      <Portal>
        <Modal
          visible={showWarningModal}
          onDismiss={() => setShowWarningModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons name="alert" size={32} color={theme.colors.warning} />
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Uyarılar
            </Text>
          </View>

          {warnings && (
            <View style={styles.warningsList}>
              {warnings.messages.map((msg, index) => (
                <Text key={index} variant="bodyMedium" style={styles.warningText}>
                  • {msg}
                </Text>
              ))}
              {warnings.kmDifference && (
                <Text variant="bodyMedium" style={styles.warningText}>
                  • KM farkı: {warnings.kmDifference} km
                </Text>
              )}
              {warnings.fuelMismatch && (
                <Text variant="bodyMedium" style={styles.warningText}>
                  • Yakıt seviyesi uyuşmuyor
                </Text>
              )}
            </View>
          )}

          <View style={styles.modalActions}>
            <Checkbox
              status={acknowledgedWarnings ? 'checked' : 'unchecked'}
              onPress={() => setAcknowledgedWarnings(!acknowledgedWarnings)}
            />
            <Text variant="bodyMedium" style={styles.checkboxLabel}>
              Uyarıları anladım ve onaylıyorum
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleAcknowledgeWarnings}
            disabled={!acknowledgedWarnings}
            style={styles.modalButton}
          >
            Devam Et
          </Button>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 100, // Space for action bar
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.warning + '20',
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  offlineText: {
    flex: 1,
    color: theme.colors.warning,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
    ...theme.elevation.lg,
  },
  draftButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    marginTop: theme.spacing.sm,
    fontWeight: '700',
  },
  warningsList: {
    marginBottom: theme.spacing.lg,
  },
  warningText: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  modalButton: {
    marginTop: theme.spacing.sm,
  },
});

