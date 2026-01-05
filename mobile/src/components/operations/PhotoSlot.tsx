/**
 * Photo Slot Component
 * Displays a single photo slot (1-8) with capture/replace functionality
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';

interface PhotoSlotProps {
  slotIndex: number; // 1-8
  photoUri?: string;
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'failed';
  onCapture: (slotIndex: number, uri: string) => void;
  onReplace?: (slotIndex: number) => void;
  disabled?: boolean;
}

export function PhotoSlot({
  slotIndex,
  photoUri,
  uploadStatus,
  onCapture,
  onReplace,
  disabled,
}: PhotoSlotProps) {
  const handlePress = async () => {
    if (photoUri && onReplace) {
      // Replace existing photo
      Alert.alert('Fotoğraf Değiştir', 'Mevcut fotoğrafı değiştirmek istiyor musunuz?', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tekrar Çek',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              onCapture(slotIndex, result.assets[0].uri);
            }
          },
        },
      ]);
    } else {
      // Capture new photo
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
        onCapture(slotIndex, result.assets[0].uri);
      }
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <MaterialCommunityIcons name="cloud-upload" size={16} color={theme.colors.primary} />;
      case 'uploaded':
        return <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.success} />;
      case 'failed':
        return <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.error} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {photoUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: photoUri }} style={styles.image} />
          {uploadStatus && (
            <View style={styles.statusBadge}>
              {getStatusIcon()}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptySlot}>
          <MaterialCommunityIcons name="camera-plus" size={32} color={theme.colors.textTertiary} />
          <Text variant="bodySmall" style={styles.slotNumber}>
            {slotIndex}
          </Text>
        </View>
      )}
      {photoUri && (
        <View style={styles.overlay}>
          <Text variant="bodySmall" style={styles.replaceText}>
            Değiştir
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  emptySlot: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotNumber: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replaceText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 10,
  },
});

