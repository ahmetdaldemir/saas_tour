<template>
  <div class="trips-view">
    <v-container fluid class="pa-4">
      <v-row>
        <!-- Sol: Rezervasyon Listesi -->
        <v-col cols="12" md="4" class="pa-2">
          <v-card elevation="2" class="h-100">
            <v-card-title class="d-flex align-center justify-space-between pa-4">
              <span class="text-h6 font-weight-bold">Trips</span>
              <div class="d-flex align-center gap-2">
                <v-btn icon="mdi-magnify" variant="text" size="small" @click="showSearch = !showSearch" />
                <v-btn icon="mdi-filter" variant="text" size="small" @click="showFilter = !showFilter" />
                <v-btn icon="mdi-refresh" variant="text" size="small" @click="loadActiveTrips" :loading="loadingTrips" />
              </div>
            </v-card-title>
            <v-divider />
            
            <!-- Search Bar -->
            <v-expand-transition>
              <div v-if="showSearch" class="pa-3">
                <v-text-field
                  v-model="searchQuery"
                  placeholder="Search trips..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @input="filterTrips"
                />
              </div>
            </v-expand-transition>

            <!-- Trips List -->
            <v-card-text class="pa-0 trips-list" style="max-height: calc(100vh - 300px); overflow-y: auto;">
              <v-list density="compact">
                <v-list-item
                  v-for="trip in filteredTrips"
                  :key="trip.id"
                  :class="{ 'selected-trip': selectedTrip?.id === trip.id }"
                  @click="selectTrip(trip)"
                  class="trip-item"
                >
                  <template #prepend>
                    <v-avatar size="40" class="mr-3">
                      <v-icon v-if="!trip.customerName" color="grey">mdi-account</v-icon>
                      <span v-else class="text-h6">{{ trip.customerName.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title class="font-weight-medium">
                    {{ trip.customerName || 'Unknown' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="d-flex align-center gap-2 mt-1">
                      <span class="text-caption">#{{ trip.reference }}</span>
                      <v-chip
                        size="x-small"
                        :color="getStatusColor(trip.status)"
                        variant="flat"
                      >
                        {{ trip.isActive ? 'Active' : trip.isCompleted ? 'Completed' : trip.status }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-grey mt-1">
                      {{ formatDate(trip.createdAt) }}
                    </div>
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="d-flex flex-column align-end">
                      <span class="text-body-2 font-weight-bold text-primary">
                        ${{ trip.earned?.toFixed(2) || '0.00' }}
                      </span>
                      <v-menu>
                        <template #activator="{ props }">
                          <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" @click.stop />
                        </template>
                        <v-list>
                          <v-list-item @click="viewTripDetails(trip)">
                            <v-list-item-title>View Details</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="startChat(trip)">
                            <v-list-item-title>Start Chat</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Orta ve Sağ: Ana İçerik -->
        <v-col cols="12" md="8" class="pa-2">
          <v-row>
            <!-- Orta Üst: Kurlar -->
            <v-col cols="12">
              <v-card elevation="2">
                <v-card-title class="pa-3">
                  <span class="text-subtitle-1 font-weight-bold">Currency Rates</span>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-3">
                  <div v-if="loadingCurrencies" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                  <div v-else class="d-flex flex-wrap gap-3">
                    <v-chip
                      v-for="currency in currencies"
                      :key="currency.id"
                      :color="currency.isBaseCurrency ? 'primary' : 'default'"
                      variant="flat"
                      size="small"
                      class="px-3"
                    >
                      <span class="font-weight-bold mr-2">{{ currency.code }}</span>
                      <span>{{ currency.rateToTry?.toFixed(4) || '0.0000' }} TRY</span>
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Sağ: İstatistikler -->
            <v-col cols="12" md="6">
              <v-card elevation="2">
                <v-card-title class="pa-3">
                  <span class="text-subtitle-1 font-weight-bold">Today's Reservations</span>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-3">
                  <div v-if="loadingStats" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                  <div v-else class="d-flex flex-column gap-3">
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2">Total</span>
                      <span class="text-h6 font-weight-bold">{{ stats.today.total }}</span>
                    </div>
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2">Active</span>
                      <v-chip size="small" color="warning" variant="flat">{{ stats.today.active }}</v-chip>
                    </div>
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2">Completed</span>
                      <v-chip size="small" color="success" variant="flat">{{ stats.today.completed }}</v-chip>
                    </div>
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2">Cancelled</span>
                      <v-chip size="small" color="error" variant="flat">{{ stats.today.cancelled }}</v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Sağ Alt: Genel İstatistikler -->
            <v-col cols="12" md="6">
              <v-card elevation="2">
                <v-card-title class="pa-3">
                  <span class="text-subtitle-1 font-weight-bold">Overall Stats</span>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-3">
                  <div v-if="loadingStats" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                  <div v-else class="d-flex flex-column gap-3">
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2">Active Trips</span>
                      <v-chip size="small" color="warning" variant="flat">{{ stats.active }}</v-chip>
                    </div>
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2">Completed</span>
                      <v-chip size="small" color="success" variant="flat">{{ stats.completed }}</v-chip>
                    </div>
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-body-2">Cancelled</span>
                      <v-chip size="small" color="error" variant="flat">{{ stats.cancelled }}</v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Orta Alt: Harita ve Araç Takip -->
            <v-col cols="12">
              <v-card elevation="2">
                <v-card-title class="pa-3 d-flex align-center justify-space-between">
                  <span class="text-subtitle-1 font-weight-bold">Vehicle Tracking</span>
                  <v-text-field
                    v-model="trackingPlate"
                    placeholder="Enter plate number"
                    prepend-inner-icon="mdi-car"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="ml-4"
                    style="max-width: 200px;"
                    @keyup.enter="loadVehicleTracking"
                  />
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0" style="height: 400px;">
                  <div v-if="!trackingPlate || !vehicleLocation" class="d-flex align-center justify-center h-100 text-grey">
                    <div class="text-center">
                      <v-icon size="64" color="grey-lighten-1">mdi-map</v-icon>
                      <div class="mt-2">Enter a plate number to track vehicle</div>
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
import { ref, onMounted, computed, watch } from 'vue';
import { http } from '../modules/http';

interface Trip {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  checkIn?: Date | null;
  checkOut?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: {
    id: string;
    name: string;
    brandName?: string;
    modelName?: string;
    year?: number;
  };
  plate?: {
    id: string;
    plateNumber: string;
  };
  assignment?: {
    startDate: Date;
    endDate: Date;
  };
  earned?: number;
  isActive: boolean;
  isCompleted: boolean;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  rateToTry?: number;
  isBaseCurrency?: boolean;
}

interface TripsStats {
  today: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  active: number;
  completed: number;
  cancelled: number;
}

interface VehicleLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  address?: string;
}

const trips = ref<Trip[]>([]);
const selectedTrip = ref<Trip | null>(null);
const currencies = ref<Currency[]>([]);
const stats = ref<TripsStats>({
  today: { total: 0, active: 0, completed: 0, cancelled: 0 },
  active: 0,
  completed: 0,
  cancelled: 0,
});
const vehicleLocation = ref<VehicleLocation | null>(null);
const trackingPlate = ref('');

const loadingTrips = ref(false);
const loadingCurrencies = ref(false);
const loadingStats = ref(false);
const loadingTracking = ref(false);

const showSearch = ref(false);
const showFilter = ref(false);
const searchQuery = ref('');

const filteredTrips = computed(() => {
  if (!searchQuery.value) return trips.value;
  const query = searchQuery.value.toLowerCase();
  return trips.value.filter(
    (trip) =>
      trip.customerName.toLowerCase().includes(query) ||
      trip.reference.toLowerCase().includes(query) ||
      trip.customerEmail.toLowerCase().includes(query)
  );
});

const loadActiveTrips = async () => {
  loadingTrips.value = true;
  try {
    const { data } = await http.get<Trip[]>('/rentacar/trips/active');
    trips.value = data;
    if (data.length > 0 && !selectedTrip.value) {
      selectTrip(data[0]);
    }
  } catch (error) {
    console.error('Failed to load trips:', error);
  } finally {
    loadingTrips.value = false;
  }
};

const loadCurrencies = async () => {
  loadingCurrencies.value = true;
  try {
    const { data } = await http.get<Currency[]>('/currencies');
    currencies.value = data.filter((c) => c.isActive !== false);
  } catch (error) {
    console.error('Failed to load currencies:', error);
  } finally {
    loadingCurrencies.value = false;
  }
};

const loadStats = async () => {
  loadingStats.value = true;
  try {
    const { data } = await http.get<TripsStats>('/rentacar/trips/stats');
    stats.value = data;
  } catch (error) {
    console.error('Failed to load stats:', error);
  } finally {
    loadingStats.value = false;
  }
};

const loadVehicleTracking = async () => {
  if (!trackingPlate.value) return;
  
  loadingTracking.value = true;
  try {
    const { data } = await http.get<VehicleLocation>(`/rentacar/tracking/${trackingPlate.value}`);
    vehicleLocation.value = data;
    if (data.latitude && data.longitude) {
      initMap(data.latitude, data.longitude);
    }
  } catch (error) {
    console.error('Failed to load vehicle tracking:', error);
    vehicleLocation.value = null;
  } finally {
    loadingTracking.value = false;
  }
};

const selectTrip = (trip: Trip) => {
  selectedTrip.value = trip;
  if (trip.plate?.plateNumber) {
    trackingPlate.value = trip.plate.plateNumber;
    loadVehicleTracking();
  }
};

const initMap = (lat: number, lng: number) => {
  // Simple map initialization using Leaflet or Google Maps
  // For now, we'll use a simple iframe or placeholder
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Clear previous map
  mapElement.innerHTML = '';

  // Create a simple map using OpenStreetMap
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  mapElement.appendChild(iframe);
};

const formatDate = (date: Date | string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'confirmed':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'grey';
  }
};

const viewTripDetails = (trip: Trip) => {
  // Navigate to reservation details
  console.log('View trip details:', trip);
};

const startChat = (trip: Trip) => {
  // Start chat with customer
  console.log('Start chat:', trip);
};

const filterTrips = () => {
  // Filter is handled by computed property
};

onMounted(() => {
  loadActiveTrips();
  loadCurrencies();
  loadStats();
});
</script>

<style scoped>
.trips-view {
  height: 100%;
}

.trips-list {
  scrollbar-width: thin;
}

.trip-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.trip-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.selected-trip {
  background-color: rgba(25, 118, 210, 0.08) !important;
  border-left: 3px solid rgb(25, 118, 210);
}
</style>

