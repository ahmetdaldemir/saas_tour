<template>
  <div class="transfer-view">
    <v-card elevation="2" class="mb-4">
      <v-tabs v-model="mainTab" show-arrows>
        <v-tab value="reservations">
          <v-icon start icon="mdi-calendar-check" />
          Transfer Rezervasyonları
        </v-tab>
        <v-tab value="vehicles">
          <v-icon start icon="mdi-car-limousine" />
          Transfer Araçları
        </v-tab>
        <v-tab value="routes">
          <v-icon start icon="mdi-map-marker-path" />
          Transfer Rotaları
        </v-tab>
        <v-tab value="pricing">
          <v-icon start icon="mdi-currency-eur" />
          Fiyatlandırma
        </v-tab>
        <v-tab value="drivers">
          <v-icon start icon="mdi-account-tie" />
          Şoförler
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="mainTab">
        <!-- Rezervasyonlar Sekmesi -->
        <v-window-item value="reservations">
          <TransferReservationsTab />
        </v-window-item>

        <!-- Araçlar Sekmesi -->
        <v-window-item value="vehicles">
          <TransferVehiclesTab />
        </v-window-item>

        <!-- Rotalar Sekmesi -->
        <v-window-item value="routes">
          <TransferRoutesTab />
        </v-window-item>

        <!-- Fiyatlandırma Sekmesi -->
        <v-window-item value="pricing">
          <TransferPricingTab />
        </v-window-item>

        <!-- Şoförler Sekmesi -->
        <v-window-item value="drivers">
          <TransferDriversTab />
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TransferReservationsTab from '../components/transfer/TransferReservationsTab.vue';
import TransferVehiclesTab from '../components/transfer/TransferVehiclesTab.vue';
import TransferRoutesTab from '../components/transfer/TransferRoutesTab.vue';
import TransferPricingTab from '../components/transfer/TransferPricingTab.vue';
import TransferDriversTab from '../components/transfer/TransferDriversTab.vue';

const mainTab = ref('reservations');
</script>

<style scoped>
.transfer-view {
  padding: 0;
}
</style>

