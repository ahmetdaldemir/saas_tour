/**
 * Operations Home Screen
 * Lists today's pickups and returns with date switcher
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, SegmentedButtons, Button, Banner } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useOperationsStore } from '../store/operations.store';
import { theme } from '../styles/theme';
import type { OperationType } from '../types/operations';

export default function OperationsHomeScreen() {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<'pickups' | 'returns'>('pickups');
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    selectedDate,
    setSelectedDate,
    pickups,
    returns,
    loading,
    error,
    loadOperations,
    refreshOperations,
  } = useOperationsStore();

  useEffect(() => {
    loadOperations();
    
    // Check network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Reload when date changes
    loadOperations(selectedDate);
  }, [selectedDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOperations();
    setRefreshing(false);
  };

  const handleDateChange = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) {
      return 'Bugün';
    }
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Yarın';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetDate.getTime() === yesterday.getTime()) {
      return 'Dün';
    }

    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const operations = selectedTab === 'pickups' ? pickups : returns;
  const count = operations.length;

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {!isOnline && (
        <Banner
          visible={true}
          icon="wifi-off"
          style={styles.banner}
        >
          Offline — işlemler kaydediliyor, bağlantı gelince gönderilecek.
        </Banner>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => handleDateChange(-1)}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={() => {
              // Could open date picker here
            }}
          >
            <Text variant="titleMedium" style={styles.dateText}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => handleDateChange(1)}
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Count Badge */}
        <View style={styles.countBadge}>
          <Text variant="headlineSmall" style={styles.countText}>
            {count}
          </Text>
          <Text variant="bodySmall" style={styles.countLabel}>
            {selectedTab === 'pickups' ? 'Çıkış' : 'Dönüş'}
          </Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as 'pickups' | 'returns')}
          buttons={[
            {
              value: 'pickups',
              label: 'Çıkışlar',
              icon: 'arrow-up-circle',
            },
            {
              value: 'returns',
              label: 'Dönüşler',
              icon: 'arrow-down-circle',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Operations List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {loading && operations.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="bodyLarge">Yükleniyor...</Text>
          </View>
        ) : operations.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name={selectedTab === 'pickups' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {selectedTab === 'pickups' ? 'Çıkış' : 'Dönüş'} bulunamadı
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {formatDate(selectedDate)} tarihi için {selectedTab === 'pickups' ? 'çıkış' : 'dönüş'} görevi bulunmuyor.
            </Text>
          </View>
        ) : (
          operations.map((item) => (
            <Card
              key={item.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('OperationDetail' as never, {
                  rentalId: item.rentalId,
                  type: item.type,
                } as never)
              }
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Chip
                      icon={item.type === 'pickup' ? 'arrow-up-circle' : 'arrow-down-circle'}
                      style={[
                        styles.typeChip,
                        item.type === 'pickup' ? styles.pickupChip : styles.returnChip,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {item.type === 'pickup' ? 'ÇIKIŞ' : 'DÖNÜŞ'}
                    </Chip>
                    <Text variant="titleMedium" style={styles.reservationCode}>
                      {item.reservationCode}
                    </Text>
                  </View>
                  <Chip
                    style={[
                      styles.statusChip,
                      item.status === 'completed' && styles.completedChip,
                      item.syncStatus === 'pending' && styles.pendingChip,
                    ]}
                    textStyle={styles.statusText}
                  >
                    {item.status === 'completed'
                      ? 'Tamamlandı'
                      : item.syncStatus === 'pending'
                      ? 'Beklemede'
                      : item.syncStatus === 'uploading'
                      ? 'Gönderiliyor'
                      : 'Bekliyor'}
                  </Chip>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="license" size={18} color={theme.colors.textSecondary} />
                    <Text variant="bodyMedium" style={styles.plateNumber}>
                      {item.plateNumber}
                    </Text>
                  </View>
                  {item.scheduledTime && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.textSecondary} />
                      <Text variant="bodySmall" style={styles.time}>
                        {new Date(item.scheduledTime).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}
                  {item.location && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.textSecondary} />
                      <Text variant="bodySmall" style={styles.location}>
                        {item.location}
                      </Text>
                    </View>
                  )}
                </View>

                {item.hasLocalDraft && (
                  <View style={styles.draftBadge}>
                    <MaterialCommunityIcons name="content-save" size={16} color={theme.colors.warning} />
                    <Text variant="bodySmall" style={styles.draftText}>
                      Taslak kaydedildi
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    backgroundColor: theme.colors.warning + '20',
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateButton: {
    padding: theme.spacing.xs,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  dateText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minWidth: 80,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontWeight: '700',
  },
  countLabel: {
    color: '#fff',
    opacity: 0.9,
  },
  tabContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  typeChip: {
    height: 28,
  },
  pickupChip: {
    backgroundColor: theme.colors.primary + '20',
  },
  returnChip: {
    backgroundColor: theme.colors.secondary + '20',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reservationCode: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusChip: {
    height: 28,
    backgroundColor: theme.colors.surfaceVariant,
  },
  completedChip: {
    backgroundColor: theme.colors.success + '20',
  },
  pendingChip: {
    backgroundColor: theme.colors.warning + '20',
  },
  statusText: {
    fontSize: 11,
  },
  cardDetails: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  plateNumber: {
    fontWeight: '600',
    letterSpacing: 1,
    color: theme.colors.text,
  },
  time: {
    color: theme.colors.textSecondary,
  },
  location: {
    color: theme.colors.textSecondary,
    flex: 1,
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  draftText: {
    color: theme.colors.warning,
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
});

