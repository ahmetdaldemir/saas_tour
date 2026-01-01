import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { printerService, PrinterDevice } from '../services/printer.service';
import { uploadQueueService } from '../services/upload-queue.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, tenant, logout } = useAuthStore();
  const [connectedPrinter, setConnectedPrinter] = useState<PrinterDevice | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);

  useEffect(() => {
    setConnectedPrinter(printerService.getConnectedDevice());
    setPendingUploads(uploadQueueService.getPendingCount());

    const unsubscribe = uploadQueueService.subscribe((queue) => {
      setPendingUploads(queue.filter((item) => item.status === 'pending' || item.status === 'failed').length);
    });

    return unsubscribe;
  }, []);

  const handleScanPrinters = async () => {
    try {
      const devices = await printerService.scanDevices();
      if (devices.length === 0) {
        Alert.alert('Bilgi', 'Yazıcı bulunamadı');
        return;
      }

      // Simple selection - in production, show a picker
      const device = devices[0];
      const connected = await printerService.connect(device);
      if (connected) {
        setConnectedPrinter(device);
        Alert.alert('Başarılı', 'Yazıcı bağlandı');
      } else {
        Alert.alert('Hata', 'Yazıcı bağlanamadı');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Yazıcı taraması başarısız');
    }
  };

  const handleDisconnectPrinter = async () => {
    await printerService.disconnect();
    setConnectedPrinter(null);
    Alert.alert('Başarılı', 'Yazıcı bağlantısı kesildi');
  };

  const handleLogout = async () => {
    Alert.alert('Çıkış', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Kullanıcı Bilgileri
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium">Ad: {user?.name}</Text>
          <Text variant="bodyMedium">Email: {user?.email}</Text>
          <Text variant="bodyMedium">Rol: {user?.role}</Text>
          <Text variant="bodyMedium">Tenant: {tenant?.name}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Yazıcı Ayarları
          </Text>
          <Divider style={styles.divider} />
          {connectedPrinter ? (
            <>
              <Text variant="bodyMedium">Bağlı Yazıcı: {connectedPrinter.name}</Text>
              <Button
                mode="outlined"
                onPress={handleDisconnectPrinter}
                style={styles.button}
              >
                Bağlantıyı Kes
              </Button>
            </>
          ) : (
            <>
              <Text variant="bodyMedium">Yazıcı bağlı değil</Text>
              <Button
                mode="contained"
                onPress={handleScanPrinters}
                icon={() => <Icon name="printer" size={24} />}
                style={styles.button}
              >
                Yazıcı Ara ve Bağlan
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Yükleme Kuyruğu
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium">Bekleyen Yüklemeler: {pendingUploads}</Text>
          {pendingUploads > 0 && (
            <Button
              mode="outlined"
              onPress={() => uploadQueueService.processQueue()}
              style={styles.button}
            >
              Kuyruğu İşle
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Çıkış
          </Text>
          <Divider style={styles.divider} />
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor="#d32f2f"
            style={styles.button}
          >
            Çıkış Yap
          </Button>
        </Card.Content>
      </Card>
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
  sectionTitle: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  button: {
    marginTop: 8,
  },
});

