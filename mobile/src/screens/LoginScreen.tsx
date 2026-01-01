import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useAuthStore } from '../store/auth.store';

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
      <Surface style={styles.surface}>
        <Text variant="headlineMedium" style={styles.title}>
          SaaS Tour Operations
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Araç Çıkış/Dönüş Yönetimi
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Giriş Yap
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 24,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
});

