/**
 * Upload Center Screen
 * Monitor and manage upload queue
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Button, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UploadJobRepository, getDatabase } from '../storage/database';
import { processQueue, getQueueStatus } from '../queue/upload-queue';
import { useAuthStore } from '../store/auth.store';
import { theme } from '../styles/theme';
import type { UploadJob } from '../types/operations';

export default function UploadCenterScreen() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [status, setStatus] = useState({ queued: 0, running: 0, failed: 0, done: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { tenantId } = useAuthStore();

  useEffect(() => {
    loadJobs();
    loadStatus();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadJobs();
      loadStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [tenantId]);

  const loadJobs = async () => {
    if (!tenantId) return;

    try {
      const allJobs = await UploadJobRepository.getAll(tenantId);
      setJobs(allJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadStatus = async () => {
    if (!tenantId) return;

    try {
      const queueStatus = await getQueueStatus(tenantId);
      setStatus(queueStatus);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    await loadStatus();
    setRefreshing(false);
  };

  const handleRetryAll = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const failedJobs = await UploadJobRepository.getAll(tenantId, 'failed');
      for (const job of failedJobs) {
        await UploadJobRepository.updateStatus(job.id, 'queued', undefined, undefined);
      }
      await loadJobs();
      await loadStatus();
      processQueue();
    } catch (error) {
      console.error('Failed to retry all:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryOne = async (jobId: string) => {
    setLoading(true);
    try {
      await UploadJobRepository.updateStatus(jobId, 'queued', undefined, undefined);
      await loadJobs();
      await loadStatus();
      processQueue();
    } catch (error) {
      console.error('Failed to retry job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await UploadJobRepository.delete(jobId);
      await loadJobs();
      await loadStatus();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const getJobIcon = (kind: string) => {
    switch (kind) {
      case 'UPLOAD_PHOTO':
        return 'image';
      case 'SYNC_DRAFT':
        return 'cloud-sync';
      case 'COMPLETE_PICKUP':
        return 'arrow-up-circle';
      case 'COMPLETE_RETURN':
        return 'arrow-down-circle';
      default:
        return 'file';
    }
  };

  const getJobLabel = (kind: string) => {
    switch (kind) {
      case 'UPLOAD_PHOTO':
        return 'Fotoğraf Yükleme';
      case 'SYNC_DRAFT':
        return 'Taslak Senkronizasyonu';
      case 'COMPLETE_PICKUP':
        return 'Çıkış Tamamlama';
      case 'COMPLETE_RETURN':
        return 'Dönüş Tamamlama';
      default:
        return kind;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return theme.colors.textSecondary;
      case 'running':
        return theme.colors.primary;
      case 'failed':
        return theme.colors.error;
      case 'done':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Beklemede';
      case 'running':
        return 'Gönderiliyor';
      case 'failed':
        return 'Başarısız';
      case 'done':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  const filteredJobs = jobs.filter((j) => j.status !== 'done');

  return (
    <View style={styles.container}>
      {/* Status Cards */}
      <View style={styles.statusCards}>
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Beklemede
            </Text>
            <Text variant="headlineMedium" style={styles.statusValue}>
              {status.queued}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Gönderiliyor
            </Text>
            <Text variant="headlineMedium" style={[styles.statusValue, { color: theme.colors.primary }]}>
              {status.running}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Başarısız
            </Text>
            <Text variant="headlineMedium" style={[styles.statusValue, { color: theme.colors.error }]}>
              {status.failed}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Actions */}
      {status.failed > 0 && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleRetryAll}
            loading={loading}
            icon="refresh"
            buttonColor={theme.colors.secondary}
          >
            Tümünü Yeniden Dene ({status.failed})
          </Button>
        </View>
      )}

      {/* Jobs List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.success} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Tüm işlemler tamamlandı
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Bekleyen veya başarısız işlem bulunmuyor.
            </Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} style={styles.jobCard}>
              <Card.Content>
                <View style={styles.jobHeader}>
                  <View style={styles.jobHeaderLeft}>
                    <MaterialCommunityIcons
                      name={getJobIcon(job.kind)}
                      size={24}
                      color={getStatusColor(job.status)}
                    />
                    <View style={styles.jobInfo}>
                      <Text variant="titleSmall" style={styles.jobTitle}>
                        {getJobLabel(job.kind)}
                      </Text>
                      <Text variant="bodySmall" style={styles.jobSubtitle}>
                        Rezervasyon: {job.rentalId.slice(0, 8)}...
                      </Text>
                    </View>
                  </View>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(job.status) + '20' }]}
                    textStyle={{ color: getStatusColor(job.status) }}
                  >
                    {getStatusLabel(job.status)}
                  </Chip>
                </View>

                {job.attemptCount > 0 && (
                  <Text variant="bodySmall" style={styles.attemptText}>
                    Deneme: {job.attemptCount}/{5}
                  </Text>
                )}

                {job.errorMessage && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.error} />
                    <Text variant="bodySmall" style={styles.errorText}>
                      {job.errorMessage}
                    </Text>
                  </View>
                )}

                {job.nextRetryAt && (
                  <Text variant="bodySmall" style={styles.retryText}>
                    Sonraki deneme: {new Date(job.nextRetryAt).toLocaleString('tr-TR')}
                  </Text>
                )}

                <View style={styles.jobActions}>
                  {job.status === 'failed' && (
                    <>
                      <Button
                        mode="outlined"
                        onPress={() => handleRetryOne(job.id)}
                        style={styles.actionButton}
                        icon="refresh"
                      >
                        Yeniden Dene
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => handleDelete(job.id)}
                        textColor={theme.colors.error}
                        icon="delete"
                      >
                        Sil
                      </Button>
                    </>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB to trigger queue */}
      <FAB
        icon="play"
        style={styles.fab}
        onPress={() => {
          processQueue();
          handleRefresh();
        }}
        label="İşle"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statusCards: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statusCard: {
    flex: 1,
    ...theme.elevation.sm,
  },
  statusLabel: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statusValue: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  actions: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  jobCard: {
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  jobSubtitle: {
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    height: 28,
  },
  attemptText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.borderRadius.sm,
  },
  errorText: {
    flex: 1,
    color: theme.colors.error,
  },
  retryText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionButton: {
    marginRight: theme.spacing.xs,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
    minHeight: 300,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

