<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center justify-space-between bg-primary text-white">
            <div class="d-flex align-center">
              <v-btn icon="mdi-arrow-left" variant="text" color="white" @click="goBack" class="mr-2" />
              <span class="text-h6 font-weight-bold">Araç Detayları</span>
            </div>
          </v-card-title>
          <v-divider />
          
          <v-card-text v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4 text-body-1">Yükleniyor...</p>
          </v-card-text>

          <v-card-text v-else-if="!vehicle" class="text-center py-8">
            <v-icon icon="mdi-alert-circle" size="64" color="error" />
            <p class="mt-4 text-body-1">Araç bulunamadı</p>
          </v-card-text>

          <v-card-text v-else>
            <!-- Araç Bilgileri -->
            <v-row>
              <v-col cols="12" md="6">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-car" class="mr-2" />
                    Araç Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Marka</v-list-item-title>
                        <v-list-item-subtitle class="text-h6">{{ vehicle.brand?.name || '-' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Model</v-list-item-title>
                        <v-list-item-subtitle class="text-h6">{{ vehicle.model?.name || '-' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="vehicle.year">
                        <v-list-item-title>Yıl</v-list-item-title>
                        <v-list-item-subtitle>{{ vehicle.year }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Araç Adı</v-list-item-title>
                        <v-list-item-subtitle class="text-h6">{{ vehicle.name || '-' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="vehicle.plates && vehicle.plates.length > 0">
                        <v-list-item-title>Plaka</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            v-for="plate in vehicle.plates"
                            :key="plate.id"
                            color="primary"
                            variant="flat"
                            size="small"
                            class="mr-1"
                          >
                            {{ plate.plateNumber }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="vehicle.category">
                        <v-list-item-title>Kategori</v-list-item-title>
                        <v-list-item-subtitle>{{ vehicle.category.name || '-' }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-information" class="mr-2" />
                    Durum Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Durum</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            :color="vehicle.isActive ? 'success' : 'error'"
                            variant="flat"
                            size="small"
                          >
                            {{ vehicle.isActive ? 'Aktif' : 'Pasif' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="vehicle.plates && vehicle.plates.length > 0 && vehicle.plates[0].km">
                        <v-list-item-title>Son Kilometre</v-list-item-title>
                        <v-list-item-subtitle>{{ vehicle.plates[0].km }} km</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Vehicle Timeline -->
            <v-row>
              <v-col cols="12">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-timeline" class="mr-2" />
                    Araç Geçmişi (Timeline)
                  </v-card-title>
                  <v-card-text>
                    <VehicleTimeline :vehicle-id="vehicle.id" />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../modules/http';
import VehicleTimeline from '../components/VehicleTimeline.vue';

interface Vehicle {
  id: string;
  name: string;
  brand?: {
    id: string;
    name: string;
  };
  model?: {
    id: string;
    name: string;
  };
  year?: number;
  category?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  plates?: Array<{
    id: string;
    plateNumber: string;
    km?: number;
  }>;
}

const route = useRoute();
const router = useRouter();

const vehicle = ref<Vehicle | null>(null);
const loading = ref(false);

onMounted(() => {
  loadVehicle();
});

const loadVehicle = async () => {
  const id = route.params.id as string;
  if (!id) {
    return;
  }

  loading.value = true;
  try {
    const { data } = await http.get<Vehicle>(`/rentacar/vehicles/${id}`);
    vehicle.value = data;
  } catch (error: any) {
    console.error('Failed to load vehicle:', error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'rentacar' });
};
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}
</style>

