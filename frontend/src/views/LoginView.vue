<template>
  <v-app>
    <v-main class="auth-main d-flex align-center justify-center">
      <v-container class="auth-container" max-width="420">
        <v-card elevation="8" class="pa-6">
          <v-card-title class="text-h5 font-weight-bold mb-2">SaaS Yönetim Paneli</v-card-title>
          <v-card-subtitle class="mb-6">Hesabınıza giriş yaparak yönetim paneline erişin.</v-card-subtitle>

          <v-form @submit.prevent="handleSubmit" ref="formRef" v-model="isValid">
            <v-text-field
              v-model="email"
              label="E-posta"
              type="email"
              
              prepend-inner-icon="mdi-email"
              :rules="emailRules"
              required
            />

            <v-text-field
              v-model="password"
              label="Şifre"
              :type="showPassword ? 'text' : 'password'"
              
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
              :loading="auth.loading"
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
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isValid = ref(false);
const errorMessage = ref('');
const formRef = ref();

const emailRules = [
  (value: string) => !!value || 'E-posta zorunlu',
  (value: string) => /.+@.+\..+/.test(value) || 'Geçerli bir e-posta girin',
];

const passwordRules = [(value: string) => !!value || 'Şifre zorunlu'];

const handleSubmit = async () => {
  const result = await formRef.value?.validate();
  if (!result?.valid) {
    return;
  }
  try {
    errorMessage.value = '';
    await auth.login(email.value, password.value);
    const redirect = (route.query.redirect as string) ?? '/';
    router.replace(redirect);
  } catch (error) {
    errorMessage.value = 'Giriş başarısız. Bilgilerinizi kontrol edin.';
  }
};
</script>

<style scoped>
.auth-main {
  min-height: 100vh;
  background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%);
}

.auth-container {
  max-width: 420px;
}
</style>
