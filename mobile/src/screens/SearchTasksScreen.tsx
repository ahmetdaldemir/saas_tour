import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { TextInput, Button, Card, Text, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../store/tasks.store';
import { OpsTask, OpsTaskType } from '../services/ops.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SearchTasksScreen() {
  const navigation = useNavigation();
  const { tasks, fetchTasks, isLoading } = useTasksStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<OpsTaskType | 'all'>('all');

  const handleSearch = () => {
    const filters: any = {};
    if (selectedType !== 'all') {
      filters.type = selectedType;
    }
    // Add date range or other filters as needed
    fetchTasks(filters);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesType = selectedType === 'all' || task.type === selectedType;
    const matchesSearch =
      !searchQuery ||
      task.reservation.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.vehicle?.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const renderTask = ({ item }: { item: OpsTask }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item.id } as never)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium">{item.reservation.reference}</Text>
          <Chip icon={() => <Icon name="car" size={16} />} style={styles.chip}>
            {item.status}
          </Chip>
        </View>
        <Text variant="bodyLarge" style={styles.customerName}>
          {item.reservation.customerName}
        </Text>
        {item.vehicle && (
          <Text variant="bodyMedium" style={styles.vehicleInfo}>
            {item.vehicle.plateNumber}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          label="Ara (Referans, Müşteri, Plaka)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
        />
        <Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
          Ara
        </Button>
      </View>

      <View style={styles.filters}>
        <Button
          mode={selectedType === 'all' ? 'contained' : 'outlined'}
          onPress={() => setSelectedType('all')}
          style={styles.filterButton}
        >
          Tümü
        </Button>
        <Button
          mode={selectedType === OpsTaskType.CHECKOUT ? 'contained' : 'outlined'}
          onPress={() => setSelectedType(OpsTaskType.CHECKOUT)}
          style={styles.filterButton}
        >
          Çıkış
        </Button>
        <Button
          mode={selectedType === OpsTaskType.RETURN ? 'contained' : 'outlined'}
          onPress={() => setSelectedType(OpsTaskType.RETURN)}
          style={styles.filterButton}
        >
          Dönüş
        </Button>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">Sonuç bulunamadı</Text>
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
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
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
  customerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleInfo: {
    color: '#666',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
});

