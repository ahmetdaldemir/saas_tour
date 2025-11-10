<template>
  <v-container class="py-12">
    <v-row class="mb-8" align="center" justify="space-between">
      <v-col cols="12" md="6">
        <h1 class="text-h3 font-weight-bold mb-4">Kurumsal Yaklasimimiz</h1>
        <p class="text-body-1 text-medium-emphasis">
          SaaS Travel Platformu; turizm ve mobilite sektorlerine ozel olarak tasarlanmis cok kiracili bir altyapi sunar.
          Kurumsal musterilerimize ozellestirilebilir moduller ve entegrasyon imkanlari sagliyoruz.
        </p>
      </v-col>
      <v-col cols="12" md="5">
        <v-card elevation="2" class="pa-6">
          <h2 class="text-h6 font-weight-bold mb-3">One Cikan Yetkinliklerimiz</h2>
          <v-list density="comfortable">
            <v-list-item prepend-icon="mdi-briefcase-variant-outline" title="Sektore ozel urun takimlari" />
            <v-list-item prepend-icon="mdi-puzzle-outline" title="3. parti API entegrasyonlarina hazir mimari" />
            <v-list-item prepend-icon="mdi-shield-check" title="Kurumsal guvenlik ve SLA taahhudu" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card elevation="1" class="pa-6">
          <v-avatar size="48" color="primary" variant="tonal" class="mb-4"><v-icon icon="mdi-account-multiple-outline" /></v-avatar>
          <h3 class="text-h6 font-weight-bold mb-2">Danismanlik</h3>
          <p class="text-body-2 text-medium-emphasis">Is analizi, surec dijitallestirme ve SaaS uyarlama danismanlik hizmetleri.</p>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card elevation="1" class="pa-6">
          <v-avatar size="48" color="secondary" variant="tonal" class="mb-4"><v-icon icon="mdi-cog-outline" /></v-avatar>
          <h3 class="text-h6 font-weight-bold mb-2">Ozellestirme</h3>
          <p class="text-body-2 text-medium-emphasis">Beyaz etiket cozumler, ozel raporlar ve CRM entegrasyonlari.</p>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card elevation="1" class="pa-6">
          <v-avatar size="48" color="success" variant="tonal" class="mb-4"><v-icon icon="mdi-headset" /></v-avatar>
          <h3 class="text-h6 font-weight-bold mb-2">Destek & SLA</h3>
          <p class="text-body-2 text-medium-emphasis">7/24 destek, SLA taahhutleri ve isletim ekipleriniz icin egitimler.</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
</script>
