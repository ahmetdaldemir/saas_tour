<template>
  <section>
    <v-container class="py-16">
      <v-row align="center" justify="space-between" class="mb-12">
        <v-col cols="12" md="6">
          <h1 class="text-h3 font-weight-bold mb-4">Seyahat & Rent A Car SaaS Platformu</h1>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Tek panelden turlarini yonetin, arac filonuzu takip edin ve rezervasyon sureclerinizi otomatiklestirin.
            SaaS modelimizle hizlica dijitallesin.
          </p>
          <div class="d-flex flex-wrap gap-3">
            <v-btn color="primary" size="large" to="/register">Ucretsiz Basla</v-btn>
            <v-btn variant="outlined" size="large" to="/corporate">Kurumsal Cozumler</v-btn>
          </div>
        </v-col>
        <v-col cols="12" md="5">
          <v-img src="/illustrations/landing-hero.svg" alt="SaaS Dashboard" height="320" contain />
        </v-col>
      </v-row>

      <v-row class="py-8" align="center" justify="space-around">
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-6">
            <v-avatar size="48" color="primary" variant="tonal" class="mb-4"><v-icon icon="mdi-airballoon" /></v-avatar>
            <h2 class="text-h6 font-weight-bold mb-2">Tur Operasyonu</h2>
            <p class="text-body-2 text-medium-emphasis">
              Destinasyon yonetimi, tur planlama, dil destegi ve dinamik fiyatlandirma ile uctan uca tur yonetimi.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-6">
            <v-avatar size="48" color="secondary" variant="tonal" class="mb-4"><v-icon icon="mdi-car" /></v-avatar>
            <h2 class="text-h6 font-weight-bold mb-2">Rent A Car</h2>
            <p class="text-body-2 text-medium-emphasis">
              Arac stok takibi, plaka atamasi, sezon bazli fiyatlandirma ve rezervasyon kontrolu tek panelde.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-6">
            <v-avatar size="48" color="success" variant="tonal" class="mb-4"><v-icon icon="mdi-credit-card" /></v-avatar>
            <h2 class="text-h6 font-weight-bold mb-2">Odeme Alt Yapisi</h2>
            <p class="text-body-2 text-medium-emphasis">
              Stripe, banka transferi ve dilediginiz odeme metodlarini tenant bazinda esnek sekilde tanimlayin.
            </p>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="py-12">
        <v-col cols="12" md="6">
          <v-img src="/illustrations/landing-features.svg" alt="Features" height="300" contain />
        </v-col>
        <v-col cols="12" md="6">
          <h2 class="text-h4 font-weight-bold mb-4">Dijital donusumunuzu hizlandirin</h2>
          <v-list density="comfortable">
            <v-list-item prepend-icon="mdi-check-circle-outline" title="Multi-tenant mimari ile tek panelde coklu marka yonetimi" />
            <v-list-item prepend-icon="mdi-check-circle-outline" title="Entegrasyonlara hazir moduler altyapi" />
            <v-list-item prepend-icon="mdi-check-circle-outline" title="CRM akisleri ve rezervasyon iletisimi icin hazir altyapi" />
          </v-list>
        </v-col>
      </v-row>
    </v-container>

    <v-sheet color="surface" class="py-12">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-center mb-8">Baslamak cok kolay</h2>
        <v-row>
          <v-col cols="12" md="4">
            <div class="text-center px-6">
              <v-avatar size="48" color="primary" variant="tonal" class="mb-4">1</v-avatar>
              <h3 class="text-h6 font-weight-medium mb-2">Kayit Ol</h3>
              <p class="text-body-2 text-medium-emphasis">Tenant bilgilerinizi girerek hesabinizi olusturun.</p>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-center px-6">
              <v-avatar size="48" color="secondary" variant="tonal" class="mb-4">2</v-avatar>
              <h3 class="text-h6 font-weight-medium mb-2">Modulleri Sec</h3>
              <p class="text-body-2 text-medium-emphasis">Tour veya Rent A Car modullerinden ihtiyac duyduklarinizi aktif edin.</p>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-center px-6">
              <v-avatar size="48" color="success" variant="tonal" class="mb-4">3</v-avatar>
              <h3 class="text-h6 font-weight-medium mb-2">Canliya Al</h3>
              <p class="text-body-2 text-medium-emphasis">Rezervasyon almaya baslayin ve operasyonunuzu yonetin.</p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </section>
</template>

<script setup lang="ts">
</script>
