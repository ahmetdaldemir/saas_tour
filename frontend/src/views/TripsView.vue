<template>
  <div class="trips-view">
    <v-container fluid class="pa-0" style="height: calc(100vh - 64px);">
      <v-row no-gutters class="h-100">
        <!-- Sol: Plakalar Listesi -->
        <v-col cols="12" md="3" class="pa-2 border-e">
          <v-card elevation="0" class="h-100" style="border: 1px solid #e5e7eb;">
            <v-card-title class="d-flex align-center justify-space-between pa-3">
              <span class="text-subtitle-1 font-weight-bold">Araç Plakaları</span>
              <v-btn
                icon="mdi-refresh"
                variant="text"
                size="small"
                @click="loadPlates"
                :loading="loadingPlates"
              />
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-0 plates-list" style="max-height: calc(100vh - 200px); overflow-y: auto;">
              <div v-if="plates.length === 0" class="text-center py-8">
                <v-icon icon="mdi-car-off" size="48" color="grey-lighten-1" />
                <p class="text-caption text-medium-emphasis mt-2">Plaka bulunamadı</p>
              </div>
              <v-list density="comfortable" class="pa-0">
                <v-list-item
                  v-for="plate in plates"
                  :key="plate.id"
                  :class="{ 'selected-plate': selectedPlate?.id === plate.id }"
                  @click="selectPlate(plate)"
                  class="plate-item"
                >
                  <template #prepend>
                    <v-avatar size="40" :color="selectedPlate?.id === plate.id ? 'primary' : 'grey-lighten-2'">
                      <v-icon :color="selectedPlate?.id === plate.id ? 'white' : 'grey-darken-1'">
                        mdi-car
                      </v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title class="font-weight-bold text-h6">
                    {{ plate.plateNumber }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="d-flex align-center gap-2 mt-1">
                      <v-chip
                        size="x-small"
                        :color="plate.isOnline ? 'success' : 'error'"
                        variant="flat"
                      >
                        {{ plate.isOnline ? 'Çevrimiçi' : 'Çevrimdışı' }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-grey mt-1" v-if="plate.vehicleName">
                      {{ plate.vehicleName }}
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Sağ: Harita ve Bilgiler -->
        <v-col cols="12" md="9" class="pa-2">
          <v-row no-gutters class="h-100">
            <!-- Sağ Üst: Araç Bilgileri Header -->
            <v-col cols="12" class="mb-2">
              <v-card elevation="2" v-if="selectedPlate && vehicleInfo">
                <v-card-text class="pa-3">
                  <div class="d-flex align-center justify-space-between flex-wrap gap-3">
                    <div class="d-flex align-center gap-4">
                      <div>
                        <div class="text-caption text-medium-emphasis">Plaka</div>
                        <div class="text-h6 font-weight-bold">{{ selectedPlate.plateNumber }}</div>
                      </div>
                      <v-divider vertical />
                      <div>
                        <div class="text-caption text-medium-emphasis">Yakıt Durumu</div>
                        <div class="d-flex align-center gap-2">
                          <v-progress-linear
                            :model-value="vehicleInfo.fuelLevel || 0"
                            :color="getFuelColor(vehicleInfo.fuelLevel || 0)"
                            height="8"
                            rounded
                            style="width: 100px;"
                          />
                          <span class="text-body-2 font-weight-bold">{{ vehicleInfo.fuelLevel || 0 }}%</span>
                        </div>
                      </div>
                      <v-divider vertical />
                      <div>
                        <div class="text-caption text-medium-emphasis">Kilometre</div>
                        <div class="text-h6 font-weight-bold">{{ formatNumber(vehicleInfo.mileage || 0) }} km</div>
                      </div>
                      <v-divider vertical />
                      <div>
                        <div class="text-caption text-medium-emphasis">Motor Durumu</div>
                        <v-chip
                          size="small"
                          :color="vehicleInfo.engineStatus === 'on' ? 'success' : 'error'"
                          variant="flat"
                        >
                          <v-icon start :icon="vehicleInfo.engineStatus === 'on' ? 'mdi-engine' : 'mdi-engine-off'" size="16" />
                          {{ vehicleInfo.engineStatus === 'on' ? 'Açık' : 'Kapalı' }}
                        </v-chip>
                      </div>
                      <v-divider vertical />
                      <div>
                        <div class="text-caption text-medium-emphasis">Hız</div>
                        <div class="text-h6 font-weight-bold">{{ vehicleInfo.location?.speed || 0 }} km/h</div>
                      </div>
                      <v-divider vertical />
                      <div>
                        <div class="text-caption text-medium-emphasis">Son Güncelleme</div>
                        <div class="text-body-2">{{ formatTime(vehicleInfo.lastUpdate || new Date()) }}</div>
                      </div>
                    </div>
                    <div>
                      <v-chip
                        :color="vehicleInfo.isOnline ? 'success' : 'error'"
                        variant="flat"
                        size="small"
                      >
                        <v-icon start :icon="vehicleInfo.isOnline ? 'mdi-check-circle' : 'mdi-close-circle'" size="16" />
                        {{ vehicleInfo.isOnline ? 'Çevrimiçi' : 'Çevrimdışı' }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
              <v-card v-else elevation="2">
                <v-card-text class="text-center py-8">
                  <v-icon icon="mdi-information-outline" size="48" color="grey-lighten-1" />
                  <p class="text-body-1 text-medium-emphasis mt-2">Bir plaka seçin</p>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Sağ Alt: Harita -->
            <v-col cols="12" class="flex-grow-1">
              <v-card elevation="2" class="h-100">
                <v-card-title class="d-flex align-center justify-space-between pa-3">
                  <span class="text-subtitle-1 font-weight-bold">Harita</span>
                  <v-btn
                    icon="mdi-refresh"
                    variant="text"
                    size="small"
                    @click="refreshTracking"
                    :loading="loadingTracking"
                  />
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0" style="height: calc(100vh - 300px);">
                  <div v-if="!selectedPlate || !vehicleInfo?.location" class="d-flex align-center justify-center h-100 text-grey">
                    <div class="text-center">
                      <v-icon size="64" color="grey-lighten-1">mdi-map</v-icon>
                      <div class="mt-2 text-body-1">Bir plaka seçin</div>
                    </div>
                  </div>
                  <div v-else id="map" style="height: 100%; width: 100%;"></div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { http } from '../modules/http';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Plate {
  id: string;
  plateNumber: string;
  vehicleId?: string;
  vehicleName?: string;
  isOnline?: boolean;
}

interface VehicleLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  address?: string;
}

interface VehicleTrackingInfo {
  plate: string;
  location: VehicleLocation;
  isOnline: boolean;
  lastUpdate?: Date;
  fuelLevel?: number;
  mileage?: number;
  engineStatus?: 'on' | 'off';
  additionalData?: Record<string, unknown>;
}

const plates = ref<Plate[]>([]);
const selectedPlate = ref<Plate | null>(null);
const vehicleInfo = ref<VehicleTrackingInfo | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

const loadingPlates = ref(false);
const loadingTracking = ref(false);

const loadPlates = async () => {
  loadingPlates.value = true;
  try {
    // Get all vehicles with plates from rentacar endpoint
    const { data: vehicles } = await http.get<any[]>('/rentacar');
    const platesData: Plate[] = [];
    
    vehicles.forEach((vehicle: any) => {
      if (vehicle.plates && vehicle.plates.length > 0) {
        vehicle.plates.forEach((plate: any) => {
          platesData.push({
            id: plate.id,
            plateNumber: plate.plateNumber,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            isOnline: false, // Will be updated when tracking info is loaded
          });
        });
      }
    });
    
    plates.value = platesData;
    
    // Load tracking info for all plates to get online status
    if (platesData.length > 0) {
      await Promise.all(platesData.map(async (plate) => {
        try {
          const { data: info } = await http.get<VehicleTrackingInfo>(`/rentacar/tracking/${plate.plateNumber}/info`);
          const plateIndex = plates.value.findIndex(p => p.id === plate.id);
          if (plateIndex !== -1) {
            plates.value[plateIndex].isOnline = info.isOnline;
          }
        } catch (error) {
          // Ignore errors for individual plates
        }
      }));
    }
  } catch (error) {
    console.error('Failed to load plates:', error);
    // Demo data for testing
    plates.value = [
      { id: '1', plateNumber: '34ABC123', vehicleName: 'BMW 320i', isOnline: true },
      { id: '2', plateNumber: '06XYZ789', vehicleName: 'Mercedes C200', isOnline: false },
      { id: '3', plateNumber: '35DEF456', vehicleName: 'Audi A4', isOnline: true },
    ];
  } finally {
    loadingPlates.value = false;
  }
};

const selectPlate = async (plate: Plate) => {
  selectedPlate.value = plate;
  await loadVehicleTracking(plate.plateNumber);
};

const loadVehicleTracking = async (plateNumber: string) => {
  if (!plateNumber) return;
  
  loadingTracking.value = true;
  try {
    const { data } = await http.get<VehicleTrackingInfo>(`/rentacar/tracking/${plateNumber}/info`);
    vehicleInfo.value = data;
    
    if (data.location && data.location.latitude && data.location.longitude) {
      initMap(data.location.latitude, data.location.longitude, data.location);
    }
  } catch (error) {
    console.error('Failed to load vehicle tracking:', error);
    // Demo data for testing
    vehicleInfo.value = {
      plate: plateNumber,
      location: {
        latitude: 41.0082 + (Math.random() - 0.5) * 0.1,
        longitude: 28.9784 + (Math.random() - 0.5) * 0.1,
        speed: Math.floor(Math.random() * 100),
        heading: Math.floor(Math.random() * 360),
        timestamp: new Date(),
        address: 'İstanbul, Türkiye',
      },
      isOnline: true,
      lastUpdate: new Date(),
      fuelLevel: Math.floor(Math.random() * 100),
      mileage: Math.floor(Math.random() * 100000),
      engineStatus: Math.random() > 0.5 ? 'on' : 'off',
    };
    
    if (vehicleInfo.value.location) {
      initMap(vehicleInfo.value.location.latitude, vehicleInfo.value.location.longitude, vehicleInfo.value.location);
    }
  } finally {
    loadingTracking.value = false;
  }
};

const refreshTracking = async () => {
  if (selectedPlate.value) {
    await loadVehicleTracking(selectedPlate.value.plateNumber);
  }
};

const initMap = (lat: number, lng: number, location?: VehicleLocation) => {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Clear previous map
  if (map) {
    map.remove();
  }

  // Initialize map
  map = L.map('map').setView([lat, lng], 13);

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  // Add marker
  if (marker) {
    map.removeLayer(marker);
  }

  const icon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  marker = L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(`
      <div>
        <strong>${selectedPlate.value?.plateNumber || 'Araç'}</strong><br/>
        ${location?.address || 'Konum bilgisi yok'}<br/>
        ${location?.speed ? `Hız: ${location.speed} km/h` : ''}
      </div>
    `)
    .openPopup();

  // Auto-refresh every 30 seconds
  if (selectedPlate.value) {
    const intervalId = setInterval(async () => {
      if (selectedPlate.value) {
        await loadVehicleTracking(selectedPlate.value.plateNumber);
      } else {
        clearInterval(intervalId);
      }
    }, 30000);
    
    // Clean up interval when component unmounts or plate changes
    watch(() => selectedPlate.value?.id, () => {
      clearInterval(intervalId);
    });
  }
};

const getFuelColor = (level: number): string => {
  if (level > 50) return 'success';
  if (level > 20) return 'warning';
  return 'error';
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR').format(num);
};

const formatTime = (date: Date | string): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

onMounted(() => {
  loadPlates();
});
</script>

<style scoped>
.trips-view {
  height: 100%;
}

.plates-list {
  scrollbar-width: thin;
}

.plate-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.plate-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.selected-plate {
  background-color: rgba(25, 118, 210, 0.08) !important;
  border-left: 3px solid rgb(25, 118, 210);
}

.border-e {
  border-right: 1px solid #e5e7eb;
}
</style>
