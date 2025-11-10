<template>
  <div>
    <v-row>
      <v-col cols="12" md="8">
        <v-card elevation="2" class="pa-6 mb-4">
          <h2 class="text-h5 font-weight-bold mb-2">Merhaba {{ auth.user?.name ?? '' }} 👋</h2>
          <p class="text-body-2 text-medium-emphasis">
            {{ auth.tenant?.name }} yönetim paneline hoş geldiniz. Sol menüden modüllerinize geçiş yapabilirsiniz.
          </p>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-6 mb-4">
          <div class="text-overline mb-1">Tenant tipi</div>
          <div class="text-h6 font-weight-medium text-capitalize">
            {{ auth.tenant?.category === 'tour' ? 'Tur Operatörü' : 'Rent A Car' }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-5" elevation="1" color="primary" variant="tonal">
          <div class="text-caption text-uppercase mb-2">Rezervasyonlar</div>
          <div class="text-h4 font-weight-bold">0</div>
          <div class="text-body-2 text-medium-emphasis mt-1">Yakında analitikler eklenecek</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-5" elevation="1" color="secondary" variant="tonal">
          <div class="text-caption text-uppercase mb-2">Aktif Ödeme Metodları</div>
          <div class="text-h4 font-weight-bold">0</div>
          <div class="text-body-2 text-medium-emphasis mt-1">Konfigürasyon ekranı hazırlanıyor</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-5" elevation="1" color="success" variant="tonal">
          <div class="text-caption text-uppercase mb-2">Dil Desteği</div>
          <div class="text-h4 font-weight-bold">0</div>
          <div class="text-body-2 text-medium-emphasis mt-1">Çoklu dil modülü planlandı</div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
</script>
