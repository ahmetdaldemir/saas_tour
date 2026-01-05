/**
 * Photo Grid Component
 * 2x4 grid of 8 photo slots with auto-fill functionality
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { PhotoSlot } from './PhotoSlot';
import { theme } from '../../styles/theme';

interface PhotoGridProps {
  photos: Array<{ slotIndex: number; uri: string; uploadStatus?: string }>;
  onPhotoCapture: (slotIndex: number, uri: string) => void;
  onPhotoReplace?: (slotIndex: number) => void;
  disabled?: boolean;
  onQuickCapture?: (slotIndex: number) => void;
}

export function PhotoGrid({ photos, onPhotoCapture, onPhotoReplace, disabled, onQuickCapture }: PhotoGridProps) {
  const [nextEmptySlot, setNextEmptySlot] = useState<number | null>(null);

  useEffect(() => {
    // Find next empty slot (1-8)
    const filledSlots = photos.map((p) => p.slotIndex);
    for (let i = 1; i <= 8; i++) {
      if (!filledSlots.includes(i)) {
        setNextEmptySlot(i);
        return;
      }
    }
    setNextEmptySlot(null);
  }, [photos]);

  const handleQuickCapture = async () => {
    if (nextEmptySlot) {
      // Trigger capture for next empty slot
      const { PhotoSlot } = await import('./PhotoSlot');
      // This will be handled by the PhotoSlot component's onPress
      // We'll use a ref or callback to trigger it
      // For now, we'll just show which slot will be filled
    }
  };

  const getPhotoForSlot = (slotIndex: number) => {
    return photos.find((p) => p.slotIndex === slotIndex);
  };

  const filledCount = photos.length;
  const allFilled = filledCount === 8;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="labelLarge" style={styles.label}>
          Fotoğraflar * (8 adet zorunlu)
        </Text>
        <Text variant="bodySmall" style={styles.count}>
          {filledCount}/8
        </Text>
      </View>

      {!allFilled && nextEmptySlot && onQuickCapture && (
        <Button
          mode="contained"
          icon="camera"
          onPress={() => onQuickCapture(nextEmptySlot)}
          style={styles.quickCaptureButton}
          disabled={disabled}
        >
          Foto Çek (Slot {nextEmptySlot})
        </Button>
      )}

      <View style={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((slotIndex) => {
          const photo = getPhotoForSlot(slotIndex);
          return (
            <PhotoSlot
              key={slotIndex}
              slotIndex={slotIndex}
              photoUri={photo?.uri}
              uploadStatus={photo?.uploadStatus as any}
              onCapture={onPhotoCapture}
              onReplace={onPhotoReplace}
              disabled={disabled}
            />
          );
        })}
      </View>

      {!allFilled && (
        <Text variant="bodySmall" style={styles.hint}>
          Eksik slotlar: {[1, 2, 3, 4, 5, 6, 7, 8]
            .filter((i) => !getPhotoForSlot(i))
            .join(', ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  count: {
    color: theme.colors.textSecondary,
  },
  quickCaptureButton: {
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  hint: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
});

