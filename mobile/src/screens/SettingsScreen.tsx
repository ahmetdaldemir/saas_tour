import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { printerService, PrinterDevice } from '../services/printer.service';
import { uploadQueueService } from '../services/upload-queue.service';
import { theme } from '../styles/theme';

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
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Ayarlar
        </Text>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color={theme.colors.primary} />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Kullanıcı Bilgileri
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="account" size={20} color={theme.colors.textSecondary} />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.infoLabel}>Ad Soyad</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.name}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="email" size={20} color={theme.colors.textSecondary} />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.infoLabel}>Email</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="shield-account" size={20} color={theme.colors.textSecondary} />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.infoLabel}>Rol</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.role}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="office-building" size={20} color={theme.colors.textSecondary} />
            <View style={styles.infoText}>
              <Text variant="bodySmall" style={styles.infoLabel}>Şirket</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{tenant?.name}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="printer" size={24} color={theme.colors.primary} />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Yazıcı Ayarları
            </Text>
          </View>
          <Divider style={styles.divider} />
          {connectedPrinter ? (
            <>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: theme.colors.success }]} />
                <View style={styles.statusText}>
                  <Text variant="bodyMedium" style={styles.statusTitle}>Bağlı</Text>
                  <Text variant="bodySmall" style={styles.statusSubtitle}>{connectedPrinter.name}</Text>
                </View>
              </View>
              <Button
                mode="outlined"
                onPress={handleDisconnectPrinter}
                style={styles.button}
                icon="link-off"
                textColor={theme.colors.error}
              >
                Bağlantıyı Kes
              </Button>
            </>
          ) : (
            <>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: theme.colors.textTertiary }]} />
                <Text variant="bodyMedium" style={styles.statusTitle}>Yazıcı bağlı değil</Text>
              </View>
              <Button
                mode="contained"
                onPress={handleScanPrinters}
                icon="printer"
                style={styles.button}
                buttonColor={theme.colors.primary}
                contentStyle={styles.buttonContent}
              >
                Yazıcı Ara ve Bağlan
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cloud-upload" size={24} color={theme.colors.primary} />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Yükleme Kuyruğu
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.queueContainer}>
            <View style={styles.queueInfo}>
              <MaterialCommunityIcons
                name={pendingUploads > 0 ? "clock-alert" : "check-circle"}
                size={24}
                color={pendingUploads > 0 ? theme.colors.warning : theme.colors.success}
              />
              <View style={styles.queueText}>
                <Text variant="bodyMedium" style={styles.queueTitle}>
                  Bekleyen Yüklemeler
                </Text>
                <Text variant="headlineSmall" style={styles.queueCount}>
                  {pendingUploads}
                </Text>
              </View>
            </View>
            {pendingUploads > 0 && (
              <Button
                mode="contained"
                onPress={() => uploadQueueService.processQueue()}
                style={styles.button}
                buttonColor={theme.colors.secondary}
                contentStyle={styles.buttonContent}
                icon="play"
              >
                Kuyruğu İşle
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="logout" size={24} color={theme.colors.error} />
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.error }]}>
              Çıkış
            </Text>
          </View>
          <Divider style={styles.divider} />
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor={theme.colors.error}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="logout"
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
  },
  card: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.elevation.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    color: theme.colors.textSecondary,
  },
  queueContainer: {
    gap: theme.spacing.md,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
  },
  queueText: {
    flex: 1,
  },
  queueTitle: {
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  queueCount: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  button: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.xs,
  },
});

