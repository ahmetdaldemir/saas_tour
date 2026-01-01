import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Stepper, Card, TextInput, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { opsService } from '../services/ops.service';
import { uploadQueueService } from '../services/upload-queue.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ReturnFlowScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [fuelLevel, setFuelLevel] = useState('');
  const [mileage, setMileage] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi gereklidir');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (step === 1) {
        setPhotos([...photos, result.assets[0].uri]);
      } else {
        setDamagePhotos([...damagePhotos, result.assets[0].uri]);
      }
    }
  };

  const handleCaptureVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi gereklidir');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setVideo(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinalize = async () => {
    setUploading(true);
    try {
      // Upload return photos
      const mediaIds: string[] = [];
      for (const photoUri of photos) {
        await uploadQueueService.add(photoUri, 'image', taskId);
      }

      if (video) {
        await uploadQueueService.add(video, 'video', taskId);
      }

      // Upload damage photos
      const damageMediaIds: string[] = [];
      for (const photoUri of damagePhotos) {
        const id = await uploadQueueService.add(photoUri, 'image', taskId);
        damageMediaIds.push(id);
      }

      // Get uploaded media IDs
      const queue = uploadQueueService.getQueue();
      const completedUploads = queue.filter((item) => item.status === 'completed' && item.result);
      const uploadedMediaIds = completedUploads.map((item) => item.result!.url);

      // Finalize return
      await opsService.finalizeReturn(taskId, {
        fuelLevel: fuelLevel ? parseFloat(fuelLevel) : undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
        damageNotes: damageNotes || undefined,
        damageMediaIds: damageMediaIds.filter((id) => id),
      });

      Alert.alert('Başarılı', 'Araç dönüşü tamamlandı');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'İşlem başarısız oldu');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stepper
        steps={3}
        currentStep={step - 1}
        labels={['Fotoğraflar', 'Bilgiler', 'Özet']}
      />

      {step === 1 && (
        <View style={styles.stepContent}>
          <Text variant="titleLarge" style={styles.stepTitle}>
            Dönüş Fotoğrafları
          </Text>

          <View style={styles.photoGrid}>
            {photos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.photoThumbnail} />
            ))}
            <Button
              mode="outlined"
              onPress={handleCapturePhoto}
              icon={() => <Icon name="camera" size={24} />}
              style={styles.captureButton}
            >
              Fotoğraf Çek
            </Button>
          </View>

          {video ? (
            <Card style={styles.videoCard}>
              <Card.Content>
                <Text>Video kaydedildi</Text>
              </Card.Content>
            </Card>
          ) : (
            <Button
              mode="outlined"
              onPress={handleCaptureVideo}
              icon={() => <Icon name="video" size={24} />}
              style={styles.captureButton}
            >
              Video Çek (Opsiyonel)
            </Button>
          )}

          <Button mode="contained" onPress={handleNext} style={styles.nextButton}>
            İleri
          </Button>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContent}>
          <Text variant="titleLarge" style={styles.stepTitle}>
            Araç Durumu
          </Text>

          <TextInput
            label="Yakıt Seviyesi (%)"
            value={fuelLevel}
            onChangeText={setFuelLevel}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Kilometre"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Hasar Notları (Opsiyonel)"
            value={damageNotes}
            onChangeText={setDamageNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Hasar Fotoğrafları (Opsiyonel)
          </Text>
          <View style={styles.photoGrid}>
            {damagePhotos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.photoThumbnail} />
            ))}
            <Button
              mode="outlined"
              onPress={handleCapturePhoto}
              icon={() => <Icon name="camera" size={24} />}
              style={styles.captureButton}
            >
              Hasar Fotoğrafı
            </Button>
          </View>

          <Button mode="contained" onPress={handleNext} style={styles.nextButton}>
            İleri
          </Button>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContent}>
          <Text variant="titleLarge" style={styles.stepTitle}>
            Özet ve Finalizasyon
          </Text>

          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="bodyLarge">Fotoğraflar: {photos.length}</Text>
              <Text variant="bodyLarge">Video: {video ? 'Var' : 'Yok'}</Text>
              <Text variant="bodyLarge">Yakıt: {fuelLevel || 'Belirtilmedi'}%</Text>
              <Text variant="bodyLarge">Kilometre: {mileage || 'Belirtilmedi'}</Text>
              {damageNotes && (
                <Text variant="bodyLarge">Hasar Notları: {damageNotes}</Text>
              )}
              {damagePhotos.length > 0 && (
                <Text variant="bodyLarge">Hasar Fotoğrafları: {damagePhotos.length}</Text>
              )}
            </Card.Content>
          </Card>

          {uploading && (
            <View style={styles.uploadProgress}>
              <ProgressBar indeterminate />
              <Text>Yükleniyor...</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleFinalize}
            loading={uploading}
            disabled={uploading}
            style={styles.finalizeButton}
          >
            Dönüşü Tamamla
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  captureButton: {
    marginBottom: 8,
  },
  videoCard: {
    marginBottom: 16,
  },
  nextButton: {
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  uploadProgress: {
    marginBottom: 16,
  },
  finalizeButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

