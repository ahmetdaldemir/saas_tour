import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../store/tasks.store';
import { OpsTask, OpsTaskType } from '../services/ops.service';
import { theme } from '../styles/theme';

export default function TodayTasksScreen() {
  const navigation = useNavigation();
  const { tasks, isLoading, fetchTasks, refresh } = useTasksStore();
  const [selectedTab, setSelectedTab] = useState<'checkout' | 'return'>('checkout');

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    fetchTasks({
      type: selectedTab === 'checkout' ? OpsTaskType.CHECKOUT : OpsTaskType.RETURN,
      dateFrom: today,
      dateTo: tomorrow,
    });
  }, [selectedTab]);

  const filteredTasks = tasks.filter(
    (task) => task.type === (selectedTab === 'checkout' ? OpsTaskType.CHECKOUT : OpsTaskType.RETURN)
  );

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in_progress':
        return 'clock-outline';
      case 'pending':
        return 'clock-alert-outline';
      default:
        return 'help-circle';
    }
  };

  const renderTask = ({ item }: { item: OpsTask }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item.id } as never)}
      mode="elevated"
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.referenceContainer}>
            <MaterialCommunityIcons 
              name={item.type === OpsTaskType.CHECKOUT ? 'arrow-up-circle' : 'arrow-down-circle'} 
              size={24} 
              color={item.type === OpsTaskType.CHECKOUT ? theme.colors.primary : theme.colors.secondary} 
            />
            <View style={styles.referenceText}>
              <Text variant="titleMedium" style={styles.reference}>
                {item.reservation.reference}
              </Text>
              <Text variant="bodySmall" style={styles.taskType}>
                {item.type === OpsTaskType.CHECKOUT ? 'Çıkış' : 'Dönüş'}
              </Text>
            </View>
          </View>
          <Chip
            icon={() => (
              <MaterialCommunityIcons 
                name={getStatusIcon(item.status)} 
                size={14} 
                color={getStatusColor(item.status)} 
              />
            )}
            style={[styles.chip, { backgroundColor: `${getStatusColor(item.status)}20` }]}
            textStyle={[styles.chipText, { color: getStatusColor(item.status) }]}
          >
            {item.status === 'pending' ? 'Beklemede' : item.status === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'}
          </Chip>
        </View>
        
        <View style={styles.customerSection}>
          <View style={styles.customerRow}>
            <MaterialCommunityIcons name="account" size={20} color={theme.colors.textSecondary} />
            <Text variant="bodyLarge" style={styles.customerName}>
              {item.reservation.customerName}
            </Text>
          </View>
        </View>

        {item.vehicle && (
          <View style={styles.vehicleSection}>
            <View style={styles.vehicleRow}>
              <MaterialCommunityIcons name="car" size={20} color={theme.colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.vehicleInfo}>
                {item.vehicle.brand} {item.vehicle.model}
              </Text>
            </View>
            <View style={styles.plateRow}>
              <MaterialCommunityIcons name="license" size={18} color={theme.colors.textSecondary} />
              <Text variant="bodySmall" style={styles.plateNumber}>
                {item.vehicle.plateNumber}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar" size={18} color={theme.colors.textTertiary} />
          <Text variant="bodySmall" style={styles.date}>
            {item.reservation.checkIn
              ? new Date(item.reservation.checkIn).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Tarih belirtilmemiş'}
          </Text>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item.id } as never)}
          style={styles.detailButton}
          buttonColor={theme.colors.primary}
          contentStyle={styles.buttonContent}
        >
          Detayları Gör
        </Button>
      </Card.Actions>
    </Card>
  );

  const checkoutCount = filteredTasks.filter((t) => t.type === OpsTaskType.CHECKOUT).length;
  const returnCount = filteredTasks.filter((t) => t.type === OpsTaskType.RETURN).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Bugünün Görevleri
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <View style={styles.tabs}>
        <Button
          mode={selectedTab === 'checkout' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('checkout')}
          style={[
            styles.tabButton,
            selectedTab === 'checkout' && styles.tabButtonActive,
          ]}
          buttonColor={selectedTab === 'checkout' ? theme.colors.primary : undefined}
          icon={() => (
            <MaterialCommunityIcons
              name="arrow-up-circle"
              size={20}
              color={selectedTab === 'checkout' ? '#fff' : theme.colors.primary}
            />
          )}
        >
          Çıkış ({checkoutCount})
        </Button>
        <Button
          mode={selectedTab === 'return' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('return')}
          style={[
            styles.tabButton,
            selectedTab === 'return' && styles.tabButtonActive,
          ]}
          buttonColor={selectedTab === 'return' ? theme.colors.secondary : undefined}
          icon={() => (
            <MaterialCommunityIcons
              name="arrow-down-circle"
              size={20}
              color={selectedTab === 'return' ? '#fff' : theme.colors.secondary}
            />
          )}
        >
          Dönüş ({returnCount})
        </Button>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Görev bulunamadı
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Bugün için {selectedTab === 'checkout' ? 'çıkış' : 'dönüş'} görevi bulunmuyor.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
  },
  tabButtonActive: {
    ...theme.elevation.sm,
  },
  list: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.elevation.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  referenceText: {
    flex: 1,
  },
  reference: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  taskType: {
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chip: {
    height: 32,
    borderRadius: theme.borderRadius.sm,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerSection: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  customerName: {
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  vehicleSection: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  vehicleInfo: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginLeft: 28,
  },
  plateNumber: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  date: {
    color: theme.colors.textTertiary,
  },
  cardActions: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  detailButton: {
    borderRadius: theme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.xs,
  },
  empty: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyTitle: {
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

