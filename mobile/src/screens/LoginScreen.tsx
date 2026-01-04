import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { theme } from '../styles/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email ve şifre gereklidir');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[LoginScreen] Attempting login with email:', email);
      await login(email, password);
      console.log('[LoginScreen] Login successful');
    } catch (err: any) {
      console.error('[LoginScreen] Login error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Giriş başarısız';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="car-sports" size={64} color={theme.colors.primary} />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            SaaS Tour Operations
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Araç Çıkış/Dönüş Yönetimi
          </Text>
        </View>

        <Surface style={styles.surface} elevation={2}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            contentStyle={styles.inputContent}
          />

          <TextInput
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            left={<TextInput.Icon icon="lock-outline" />}
            style={styles.input}
            contentStyle={styles.inputContent}
          />

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.primary}
          >
            Giriş Yap
          </Button>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  surface: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  inputContent: {
    fontSize: 16,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  error: {
    color: theme.colors.error,
    fontSize: 14,
    flex: 1,
  },
});

