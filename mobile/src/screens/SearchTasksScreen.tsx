import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { TextInput, Button, Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../store/tasks.store';
import { OpsTask, OpsTaskType } from '../services/ops.service';
import { theme } from '../styles/theme';

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
            <View>
              <Text variant="titleMedium" style={styles.reference}>
                {item.reservation.reference}
              </Text>
              <Text variant="bodySmall" style={styles.taskType}>
                {item.type === OpsTaskType.CHECKOUT ? 'Çıkış' : 'Dönüş'}
              </Text>
            </View>
          </View>
          <Chip
            icon={() => <MaterialCommunityIcons name="car" size={14} color={theme.colors.textSecondary} />}
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {item.status}
          </Chip>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={18} color={theme.colors.textSecondary} />
          <Text variant="bodyMedium" style={styles.customerName}>
            {item.reservation.customerName}
          </Text>
        </View>
        {item.vehicle && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="license" size={18} color={theme.colors.textSecondary} />
            <Text variant="bodySmall" style={styles.vehicleInfo}>
              {item.vehicle.plateNumber}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Görev Ara
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          Referans, müşteri adı veya plaka ile arayın
        </Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          label="Ara"
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
          right={
            searchQuery ? (
              <TextInput.Icon
                icon="close-circle"
                onPress={() => setSearchQuery('')}
              />
            ) : undefined
          }
          placeholder="Referans, müşteri, plaka..."
        />
        <Button
          mode="contained"
          onPress={handleSearch}
          style={styles.searchButton}
          buttonColor={theme.colors.primary}
          contentStyle={styles.buttonContent}
          icon="magnify"
        >
          Ara
        </Button>
      </View>

      <View style={styles.filters}>
        <Button
          mode={selectedType === 'all' ? 'contained' : 'outlined'}
          onPress={() => setSelectedType('all')}
          style={[styles.filterButton, selectedType === 'all' && styles.filterButtonActive]}
          buttonColor={selectedType === 'all' ? theme.colors.primary : undefined}
          icon="format-list-bulleted"
        >
          Tümü
        </Button>
        <Button
          mode={selectedType === OpsTaskType.CHECKOUT ? 'contained' : 'outlined'}
          onPress={() => setSelectedType(OpsTaskType.CHECKOUT)}
          style={[styles.filterButton, selectedType === OpsTaskType.CHECKOUT && styles.filterButtonActive]}
          buttonColor={selectedType === OpsTaskType.CHECKOUT ? theme.colors.primary : undefined}
          icon="arrow-up-circle"
        >
          Çıkış
        </Button>
        <Button
          mode={selectedType === OpsTaskType.RETURN ? 'contained' : 'outlined'}
          onPress={() => setSelectedType(OpsTaskType.RETURN)}
          style={[styles.filterButton, selectedType === OpsTaskType.RETURN && styles.filterButtonActive]}
          buttonColor={selectedType === OpsTaskType.RETURN ? theme.colors.secondary : undefined}
          icon="arrow-down-circle"
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
            <MaterialCommunityIcons
              name="magnify"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Sonuç bulunamadı
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Arama kriterlerinize uygun görev bulunamadı.
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
  searchSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
  },
  searchButton: {
    borderRadius: theme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.xs,
  },
  filters: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
  },
  filterButtonActive: {
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
  reference: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  taskType: {
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chip: {
    height: 28,
    borderRadius: theme.borderRadius.sm,
  },
  chipText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  customerName: {
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  vehicleInfo: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
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

