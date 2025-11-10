<template>
  <v-container class="py-12" style="max-width: 760px;">
    <v-card elevation="4" class="pa-6 pa-md-10">
      <div class="d-flex justify-space-between flex-wrap mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">Yeni SaaS Hesabı Oluştur</h1>
          <p class="text-body-2 text-medium-emphasis">
            Tenant bilgilerinizi ve yönetici kullanıcı detaylarını girerek hemen başlamanız yeterli.
          </p>
        </div>
        <v-btn variant="text" to="/login" prepend-icon="mdi-login">Zaten hesabım var</v-btn>
      </div>

      <v-form @submit.prevent="handleSignup" ref="formRef" v-model="isValid">
        <h2 class="text-h6 font-weight-bold mb-4">Tenant Bilgileri</h2>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.tenantName" label="Şirket / Marka Adı" prepend-inner-icon="mdi-domain" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.tenantCategory"
              :items="tenantCategories"
              item-title="label"
              item-value="value"
              label="Kategori"
              prepend-inner-icon="mdi-shape"
              required
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.tenantDefaultLanguage"
              :items="languages"
              label="Varsayılan Dil"
              prepend-inner-icon="mdi-translate"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.supportEmail" label="Destek E-postası" prepend-inner-icon="mdi-email-outline" />
          </v-col>
        </v-row>

        <h2 class="text-h6 font-weight-bold mb-4 mt-6">Yönetici Kullanıcı</h2>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.adminName" label="Ad Soyad" prepend-inner-icon="mdi-account" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.adminEmail" label="E-posta" type="email" prepend-inner-icon="mdi-email" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.adminPassword" :type="showPassword ? 'text' : 'password'" label="Şifre" prepend-inner-icon="mdi-lock" required>
              <template #append-inner>
                <v-btn icon="mdi-eye" variant="text" @click="showPassword = !showPassword" />
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.adminPasswordConfirm" :type="showPassword ? 'text' : 'password'" label="Şifre Tekrar" prepend-inner-icon="mdi-lock-check" required />
          </v-col>
        </v-row>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>
        <v-alert v-if="success" type="success" variant="tonal" class="mb-4">
          Kayıt başarılı! Yönetim paneline yönlendiriliyorsunuz...
        </v-alert>

        <v-btn color="primary" size="large" type="submit" :loading="auth.loading">Kayıt Ol</v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  tenantName: '',
  tenantCategory: 'tour',
  tenantDefaultLanguage: 'en',
  supportEmail: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  adminPasswordConfirm: '',
});

const tenantCategories = [
  { label: 'Tour Operatörü', value: 'tour' },
  { label: 'Rent A Car', value: 'rentacar' },
];

const languages = ['en', 'tr', 'de'];

const showPassword = ref(false);
const error = ref('');
const success = ref(false);
const formRef = ref();
const isValid = ref(false);

const handleSignup = async () => {
  const validation = await formRef.value?.validate();
  if (!validation?.valid) return;

  if (form.adminPassword !== form.adminPasswordConfirm) {
    error.value = 'Şifreler eşleşmiyor.';
    return;
  }

  try {
    error.value = '';
    success.value = false;
    await auth.signup({
      tenantName: form.tenantName,
      tenantCategory: form.tenantCategory,
      tenantDefaultLanguage: form.tenantDefaultLanguage,
      supportEmail: form.supportEmail,
      adminName: form.adminName,
      adminEmail: form.adminEmail,
      adminPassword: form.adminPassword,
    });
    success.value = true;
    setTimeout(() => router.replace('/app/dashboard'), 800);
  } catch (err) {
    error.value = (err as Error).message || 'Kayıt sırasında hata oluştu.';
  }
};
</script>
