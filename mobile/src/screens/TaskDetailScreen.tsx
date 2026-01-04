import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button, Card, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTasksStore } from '../store/tasks.store';
import { OpsTaskType } from '../services/ops.service';
import { theme } from '../styles/theme';

export default function TaskDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };
  const { selectedTask, fetchTask, isLoading } = useTasksStore();

  useEffect(() => {
    fetchTask(taskId);
  }, [taskId]);

  if (isLoading || !selectedTask) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  const handleStartCheckout = () => {
    navigation.navigate('CheckoutFlow' as never, { taskId: selectedTask.id } as never);
  };

  const handleStartReturn = () => {
    navigation.navigate('ReturnFlow' as never, { taskId: selectedTask.id } as never);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.primary;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name={selectedTask.type === OpsTaskType.CHECKOUT ? 'arrow-up-circle' : 'arrow-down-circle'}
            size={32}
            color={selectedTask.type === OpsTaskType.CHECKOUT ? theme.colors.primary : theme.colors.secondary}
          />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              {selectedTask.type === OpsTaskType.CHECKOUT ? 'Araç Çıkışı' : 'Araç Dönüşü'}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {selectedTask.reservation.reference}
            </Text>
          </View>
        </View>
        <Chip
          icon={() => (
            <MaterialCommunityIcons
              name={selectedTask.status === 'completed' ? 'check-circle' : selectedTask.status === 'in_progress' ? 'clock-outline' : 'clock-alert-outline'}
              size={14}
              color={getStatusColor(selectedTask.status)}
            />
          )}
          style={[styles.statusChip, { backgroundColor: `${getStatusColor(selectedTask.status)}20` }]}
          textStyle={{ color: getStatusColor(selectedTask.status), fontWeight: '600' }}
        >
          {selectedTask.status === 'pending' ? 'Beklemede' : selectedTask.status === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'}
        </Chip>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Müşteri Bilgileri
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="bodySmall" style={styles.infoLabel}>Ad Soyad</Text>
              <Text variant="bodyLarge" style={styles.infoValue}>
                {selectedTask.reservation.customerName}
              </Text>
            </View>
          </View>

          {selectedTask.vehicle && (
            <View style={styles.section}>
              <Divider style={styles.divider} />
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="car" size={20} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Araç Bilgileri
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={styles.infoLabel}>Plaka</Text>
                <Text variant="bodyLarge" style={[styles.infoValue, styles.plateNumber]}>
                  {selectedTask.vehicle.plateNumber}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={styles.infoLabel}>Marka / Model</Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {selectedTask.vehicle.brand} {selectedTask.vehicle.model}
                </Text>
              </View>
              {selectedTask.vehicle.year && (
                <View style={styles.infoItem}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Yıl</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>
                    {selectedTask.vehicle.year}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Divider style={styles.divider} />
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Tarih Bilgileri
              </Text>
            </View>
            {selectedTask.reservation.checkIn && (
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={styles.infoLabel}>Çıkış Tarihi</Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {new Date(selectedTask.reservation.checkIn).toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
            {selectedTask.reservation.checkOut && (
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={styles.infoLabel}>Dönüş Tarihi</Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {new Date(selectedTask.reservation.checkOut).toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        {selectedTask.type === OpsTaskType.CHECKOUT && selectedTask.status === 'pending' && (
          <Button
            mode="contained"
            onPress={handleStartCheckout}
            icon="arrow-up-circle"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            buttonColor={theme.colors.primary}
          >
            Araç Çıkışı Başlat
          </Button>
        )}

        {selectedTask.type === OpsTaskType.RETURN && selectedTask.status === 'pending' && (
          <Button
            mode="contained"
            onPress={handleStartReturn}
            icon="arrow-down-circle"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            buttonColor={theme.colors.secondary}
          >
            Araç Dönüşü Başlat
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textSecondary,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    height: 32,
    borderRadius: theme.borderRadius.sm,
  },
  card: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.elevation.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  divider: {
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.divider,
  },
  infoItem: {
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  plateNumber: {
    letterSpacing: 2,
    fontWeight: '700',
    fontSize: 18,
  },
  actions: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.sm,
  },
  actionButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
});

