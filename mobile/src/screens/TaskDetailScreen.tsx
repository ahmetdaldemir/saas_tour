import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTasksStore } from '../store/tasks.store';
import { OpsTaskType } from '../services/ops.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
      <View style={styles.container}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  const handleStartCheckout = () => {
    navigation.navigate('CheckoutFlow' as never, { taskId: selectedTask.id } as never);
  };

  const handleStartReturn = () => {
    navigation.navigate('ReturnFlow' as never, { taskId: selectedTask.id } as never);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Rezervasyon Detayı
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>
              Referans:
            </Text>
            <Text variant="bodyLarge">{selectedTask.reservation.reference}</Text>
          </View>

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>
              Müşteri:
            </Text>
            <Text variant="bodyLarge" style={styles.customerName}>
              {selectedTask.reservation.customerName}
            </Text>
          </View>

          {selectedTask.vehicle && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Araç Bilgileri
              </Text>
              <View style={styles.row}>
                <Text variant="bodyMedium" style={styles.label}>
                  Plaka:
                </Text>
                <Text variant="bodyLarge">{selectedTask.vehicle.plateNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text variant="bodyMedium" style={styles.label}>
                  Marka/Model:
                </Text>
                <Text variant="bodyLarge">
                  {selectedTask.vehicle.brand} {selectedTask.vehicle.model}
                </Text>
              </View>
              {selectedTask.vehicle.year && (
                <View style={styles.row}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Yıl:
                  </Text>
                  <Text variant="bodyLarge">{selectedTask.vehicle.year}</Text>
                </View>
              )}
            </>
          )}

          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Tarih Bilgileri
          </Text>
          {selectedTask.reservation.checkIn && (
            <View style={styles.row}>
              <Text variant="bodyMedium" style={styles.label}>
                Çıkış:
              </Text>
              <Text variant="bodyLarge">
                {new Date(selectedTask.reservation.checkIn).toLocaleString('tr-TR')}
              </Text>
            </View>
          )}
          {selectedTask.reservation.checkOut && (
            <View style={styles.row}>
              <Text variant="bodyMedium" style={styles.label}>
                Dönüş:
              </Text>
              <Text variant="bodyLarge">
                {new Date(selectedTask.reservation.checkOut).toLocaleString('tr-TR')}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        {selectedTask.type === OpsTaskType.CHECKOUT && selectedTask.status === 'pending' && (
          <Button
            mode="contained"
            onPress={handleStartCheckout}
            icon={() => <Icon name="car-outline" size={24} />}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Araç Çıkışı Başlat
          </Button>
        )}

        {selectedTask.type === OpsTaskType.RETURN && selectedTask.status === 'pending' && (
          <Button
            mode="contained"
            onPress={handleStartReturn}
            icon={() => <Icon name="car-return" size={24} />}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: '#666',
  },
  customerName: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
  },
  actions: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
});

