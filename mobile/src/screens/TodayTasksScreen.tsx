import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../store/tasks.store';
import { OpsTask, OpsTaskType } from '../services/ops.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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

  const renderTask = ({ item }: { item: OpsTask }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item.id } as never)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium">{item.reservation.reference}</Text>
          <Chip
            icon={() => <Icon name="car" size={16} />}
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {item.status}
          </Chip>
        </View>
        <Divider style={styles.divider} />
        <Text variant="bodyLarge" style={styles.customerName}>
          {item.reservation.customerName}
        </Text>
        {item.vehicle && (
          <Text variant="bodyMedium" style={styles.vehicleInfo}>
            {item.vehicle.brand} {item.vehicle.model} - {item.vehicle.plateNumber}
          </Text>
        )}
        <Text variant="bodySmall" style={styles.date}>
          {item.reservation.checkIn
            ? new Date(item.reservation.checkIn).toLocaleDateString('tr-TR')
            : 'Tarih belirtilmemiş'}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item.id } as never)}
        >
          Detay
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Button
          mode={selectedTab === 'checkout' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('checkout')}
          style={styles.tabButton}
        >
          Çıkış ({filteredTasks.filter((t) => t.type === OpsTaskType.CHECKOUT).length})
        </Button>
        <Button
          mode={selectedTab === 'return' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('return')}
          style={styles.tabButton}
        >
          Dönüş ({filteredTasks.filter((t) => t.type === OpsTaskType.RETURN).length})
        </Button>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">Görev bulunamadı</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 8,
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleInfo: {
    color: '#666',
    marginBottom: 4,
  },
  date: {
    color: '#999',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
});

