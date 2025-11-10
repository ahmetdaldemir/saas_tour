<template>
  <v-container class="py-12">
    <v-row class="mb-8" align="center">
      <v-col cols="12" md="6">
        <h1 class="text-h3 font-weight-bold mb-4">Bizimle Iletisime Gecin</h1>
        <p class="text-body-1 text-medium-emphasis">
          Urun demo talepleriniz, kurumsal is birlikleri veya teknik destek icin ekibimizle iletisime gecebilirsiniz.
        </p>
        <v-list density="comfortable" class="mt-4">
          <v-list-item prepend-icon="mdi-email-outline" title="info@saastourplatform.com" />
          <v-list-item prepend-icon="mdi-phone-outline" title="+90 212 000 00 00" />
          <v-list-item prepend-icon="mdi-map-marker-outline" title="Maslak, Istanbul" />
        </v-list>
      </v-col>
      <v-col cols="12" md="6">
        <v-card elevation="2" class="pa-6">
          <h2 class="text-h6 font-weight-bold mb-4">Iletisim Formu</h2>
          <v-form @submit.prevent="submitContact" ref="formRef" v-model="isValid">
            <v-text-field v-model="form.name" label="Adiniz" prepend-inner-icon="mdi-account" required />
            <v-text-field v-model="form.email" label="E-posta" type="email" prepend-inner-icon="mdi-email" required />
            <v-select
              v-model="form.topic"
              :items="topics"
              label="Konu"
              prepend-inner-icon="mdi-comment-question-outline"
              required
            />
            <v-textarea v-model="form.message" label="Mesaj" rows="4" prepend-inner-icon="mdi-text" required />
            <v-btn type="submit" color="primary" class="mt-4" :loading="submitting">
              Gonder
            </v-btn>
          </v-form>
          <v-alert v-if="submitted" type="success" variant="tonal" class="mt-4">
            Mesajiniz bize ulasti. En kisa surede donus yapacagiz.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const form = reactive({
  name: '',
  email: '',
  topic: 'Demo Talebi',
  message: '',
});

const topics = ['Demo Talebi', 'Kurumsal Is Birligi', 'Teknik Destek'];
const submitting = ref(false);
const submitted = ref(false);
const formRef = ref();
const isValid = ref(false);

const submitContact = async () => {
  const validation = await formRef.value?.validate();
  if (!validation?.valid) return;

  submitting.value = true;
  setTimeout(() => {
    submitting.value = false;
    submitted.value = true;
  }, 800);
};
</script>
