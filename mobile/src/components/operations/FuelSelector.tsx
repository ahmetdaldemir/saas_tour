/**
 * Fuel Level Selector Component
 * Quick buttons for one-hand use
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { FuelLevel } from '../../types/operations';
import { theme } from '../../styles/theme';

interface FuelSelectorProps {
  value?: FuelLevel;
  onChange: (level: FuelLevel) => void;
  disabled?: boolean;
}

const FUEL_OPTIONS: Array<{ level: FuelLevel; label: string; icon: string }> = [
  { level: 'FULL', label: 'Dolu', icon: 'fuel' },
  { level: 'THREE_QUARTERS', label: '3/4', icon: 'fuel' },
  { level: 'HALF', label: 'Yarım', icon: 'fuel' },
  { level: 'QUARTER', label: '1/4', icon: 'fuel' },
  { level: 'EMPTY', icon: 'fuel' },
];

export function FuelSelector({ value, onChange, disabled }: FuelSelectorProps) {
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Yakıt Seviyesi *
      </Text>
      <View style={styles.buttonRow}>
        {FUEL_OPTIONS.map((option) => {
          const isSelected = value === option.level;
          return (
            <TouchableOpacity
              key={option.level}
              style={[styles.button, isSelected && styles.buttonSelected, disabled && styles.buttonDisabled]}
              onPress={() => !disabled && onChange(option.level)}
              disabled={disabled}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={24}
                color={isSelected ? '#fff' : theme.colors.textSecondary}
              />
              {option.label && (
                <Text
                  variant="bodySmall"
                  style={[styles.buttonText, isSelected && styles.buttonTextSelected]}
                >
                  {option.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 60,
    aspectRatio: 1,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  buttonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

