<template>
  <v-app>
    <v-main class="auth-main d-flex align-center justify-center">
      <v-container class="auth-container" max-width="420">
        <v-card elevation="8" class="pa-6">
          <v-card-title class="text-h5 font-weight-bold mb-2">Admin Panel</v-card-title>
          <v-card-subtitle class="mb-6">Sistem yöneticisi girişi</v-card-subtitle>

          <v-form @submit.prevent="handleSubmit" ref="formRef" v-model="isValid">
            <v-text-field
              v-model="username"
              label="Kullanıcı Adı"
              variant="outlined"
              prepend-inner-icon="mdi-account"
              :rules="usernameRules"
              required
            />

            <v-text-field
              v-model="password"
              label="Şifre"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :rules="passwordRules"
              required
            />

            <v-btn
              color="primary"
              class="mt-4"
              size="large"
              type="submit"
              block
              :loading="adminAuth.loading"
            >
              Giriş Yap
            </v-btn>

            <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
              {{ errorMessage }}
            </v-alert>
          </v-form>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminAuthStore } from '../stores/admin-auth';

const adminAuth = useAdminAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const isValid = ref(false);
const errorMessage = ref('');
const formRef = ref();

const usernameRules = [(value: string) => !!value || 'Kullanıcı adı zorunlu'];
const passwordRules = [(value: string) => !!value || 'Şifre zorunlu'];

const handleSubmit = async () => {
  const result = await formRef.value?.validate();
  if (!result?.valid) {
    return;
  }
  try {
    errorMessage.value = '';
    await adminAuth.login(username.value, password.value);
    router.replace('/adminDashboard');
  } catch (error) {
    errorMessage.value = 'Giriş başarısız. Bilgilerinizi kontrol edin.';
  }
};
</script>

<style scoped>
.auth-main {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
}

.auth-container {
  max-width: 420px;
}
</style>

