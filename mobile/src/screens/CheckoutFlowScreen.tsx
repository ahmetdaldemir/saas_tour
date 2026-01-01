import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Button, Stepper, Card, Checkbox, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { opsService } from '../services/ops.service';
import { uploadQueueService } from '../services/upload-queue.service';
import { printerService } from '../services/printer.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const REQUIRED_PHOTOS = 8;

export default function CheckoutFlowScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [licenseFront, setLicenseFront] = useState<string | null>(null);
  const [licenseBack, setLicenseBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [passportVerified, setPassportVerified] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCapturePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
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
      if (photos.length < REQUIRED_PHOTOS) {
        setPhotos([...photos, result.assets[0].uri]);
      } else {
        Alert.alert('Limit', `${REQUIRED_PHOTOS} fotoğraf yeterlidir`);
      }
    }
  };

  const handleCaptureVideo = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
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

  const handleCaptureLicense = async (side: 'front' | 'back') => {
    const { status } = await Camera.requestCameraPermissionsAsync();
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
      if (side === 'front') {
        setLicenseFront(result.assets[0].uri);
      } else {
        setLicenseBack(result.assets[0].uri);
      }
    }
  };

  const handleCapturePassport = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
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
      setPassport(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (photos.length < REQUIRED_PHOTOS) {
        Alert.alert('Eksik Fotoğraf', `En az ${REQUIRED_PHOTOS} fotoğraf gereklidir`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!licenseVerified) {
        Alert.alert('Doğrulama Gerekli', 'Ehliyet doğrulanmalıdır');
        return;
      }
      setStep(3);
    }
  };

  const handleFinalize = async () => {
    setUploading(true);
    try {
      // Upload all media
      const mediaIds: string[] = [];

      // Upload photos
      for (const photoUri of photos) {
        const uploadId = await uploadQueueService.add(photoUri, 'image', taskId);
        // Wait for upload to complete (simplified - in production, use proper queue monitoring)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Upload video if exists
      if (video) {
        await uploadQueueService.add(video, 'video', taskId);
      }

      // Upload license images
      const licenseMediaIds: string[] = [];
      if (licenseFront) {
        const id = await uploadQueueService.add(licenseFront, 'image', taskId);
        licenseMediaIds.push(id);
      }
      if (licenseBack) {
        const id = await uploadQueueService.add(licenseBack, 'image', taskId);
        licenseMediaIds.push(id);
      }

      // Upload passport if exists
      const passportMediaIds: string[] = [];
      if (passport) {
        const id = await uploadQueueService.add(passport, 'image', taskId);
        passportMediaIds.push(id);
      }

      // Get uploaded media IDs from queue results
      const queue = uploadQueueService.getQueue();
      const completedUploads = queue.filter((item) => item.status === 'completed' && item.result);
      const uploadedMediaIds = completedUploads.map((item) => item.result!.url);

      // Update task media
      await opsService.updateMedia(taskId, { mediaIds: uploadedMediaIds });

      // Verify documents
      await opsService.verifyDocs(taskId, {
        licenseVerified,
        licenseMediaIds: licenseMediaIds.filter((id) => id),
        passportVerified,
        passportMediaIds: passportMediaIds.filter((id) => id),
      });

      // Finalize checkout
      const result = await opsService.finalizeCheckout(taskId);

      // Print contract
      try {
        await printerService.print(result.printPayload);
        Alert.alert('Başarılı', 'İşlem tamamlandı ve sözleşme yazdırıldı');
      } catch (printError) {
        Alert.alert('Uyarı', 'İşlem tamamlandı ancak yazdırma başarısız oldu');
      }

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
        labels={['Fotoğraflar', 'Belgeler', 'Özet']}
      />

      {step === 1 && (
        <View style={styles.stepContent}>
          <Text variant="titleLarge" style={styles.stepTitle}>
            Araç Fotoğrafları
          </Text>
          <Text variant="bodyMedium" style={styles.stepDescription}>
            En az {REQUIRED_PHOTOS} fotoğraf çekin ({photos.length}/{REQUIRED_PHOTOS})
          </Text>

          <View style={styles.photoGrid}>
            {photos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.photoThumbnail} />
            ))}
            {photos.length < REQUIRED_PHOTOS && (
              <Button
                mode="outlined"
                onPress={handleCapturePhoto}
                icon={() => <Icon name="camera" size={24} />}
                style={styles.captureButton}
              >
                Fotoğraf Çek
              </Button>
            )}
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
            Belge Doğrulama
          </Text>

          <Card style={styles.docCard}>
            <Card.Content>
              <Text variant="titleMedium">Ehliyet</Text>
              <View style={styles.docImages}>
                {licenseFront && (
                  <Image source={{ uri: licenseFront }} style={styles.docImage} />
                )}
                {licenseBack && (
                  <Image source={{ uri: licenseBack }} style={styles.docImage} />
                )}
              </View>
              <Button
                mode="outlined"
                onPress={() => handleCaptureLicense('front')}
                style={styles.docButton}
              >
                Ön Yüz
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleCaptureLicense('back')}
                style={styles.docButton}
              >
                Arka Yüz
              </Button>
              <Checkbox
                status={licenseVerified ? 'checked' : 'unchecked'}
                onPress={() => setLicenseVerified(!licenseVerified)}
              />
              <Text>Ehliyet doğrulandı</Text>
            </Card.Content>
          </Card>

          <Card style={styles.docCard}>
            <Card.Content>
              <Text variant="titleMedium">Pasaport (Opsiyonel)</Text>
              {passport && <Image source={{ uri: passport }} style={styles.docImage} />}
              <Button
                mode="outlined"
                onPress={handleCapturePassport}
                style={styles.docButton}
              >
                Pasaport Fotoğrafı
              </Button>
              <Checkbox
                status={passportVerified ? 'checked' : 'unchecked'}
                onPress={() => setPassportVerified(!passportVerified)}
              />
              <Text>Pasaport doğrulandı</Text>
            </Card.Content>
          </Card>

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
              <Text variant="bodyLarge">Ehliyet: {licenseVerified ? 'Doğrulandı' : 'Doğrulanmadı'}</Text>
              <Text variant="bodyLarge">Pasaport: {passportVerified ? 'Doğrulandı' : 'Yok'}</Text>
            </Card.Content>
          </Card>

          {uploading && (
            <View style={styles.uploadProgress}>
              <ProgressBar progress={uploadProgress} />
              <Text>Yükleniyor...</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleFinalize}
            loading={uploading}
            disabled={uploading}
            icon={() => <Icon name="printer" size={24} />}
            style={styles.finalizeButton}
          >
            İşlemi Bitir ve Yazdır
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
  stepDescription: {
    marginBottom: 16,
    color: '#666',
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
  docCard: {
    marginBottom: 16,
  },
  docImages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  docImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  docButton: {
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

