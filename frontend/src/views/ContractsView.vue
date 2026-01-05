<template>
  <div class="contracts-view">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>Sözleşme Oluşturucu</span>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openNewContractDialog"
              >
                Yeni Sözleşme
              </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <ContractBuilder
                v-if="showBuilder"
                :reservation-id="selectedReservationId"
                :vehicle-id="selectedVehicleId"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ContractBuilder from '../components/ContractBuilder.vue';

const route = useRoute();
const showBuilder = ref(true);
const selectedReservationId = ref<string | undefined>(route.query.reservationId as string | undefined);
const selectedVehicleId = ref<string | undefined>(route.query.vehicleId as string | undefined);

const openNewContractDialog = () => {
  selectedReservationId.value = undefined;
  selectedVehicleId.value = undefined;
  showBuilder.value = false;
  setTimeout(() => {
    showBuilder.value = true;
  }, 100);
};

onMounted(() => {
  // Component is ready
});
</script>

<style scoped>
.contracts-view {
  width: 100%;
  height: 100%;
}
</style>

