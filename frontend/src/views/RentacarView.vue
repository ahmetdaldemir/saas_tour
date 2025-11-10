<template>
  <div>
    <v-alert type="warning" variant="tonal" class="mb-4" v-if="!isRentacarTenant">
      Bu modül yalnızca rent a car tenantlar için aktiftir.
    </v-alert>

    <template v-else>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-card elevation="2" class="pa-6 mb-4">
            <h2 class="text-h6 font-weight-bold mb-4">Araç Ekle</h2>
            <v-form @submit.prevent="createVehicle" ref="vehicleFormRef" v-model="vehicleFormValid">
              <v-text-field v-model="vehicleForm.name" label="Araç Adı" prepend-inner-icon="mdi-car" required />
              <v-text-field v-model="vehicleForm.brand" label="Marka" prepend-inner-icon="mdi-alpha-b-box" required />
              <v-text-field v-model="vehicleForm.model" label="Model" prepend-inner-icon="mdi-shape" required />
              <v-text-field v-model.number="vehicleForm.year" label="Yıl" type="number" prepend-inner-icon="mdi-calendar" />
              <v-text-field v-model.number="vehicleForm.baseRate" label="Baz Fiyat" type="number" prepend-inner-icon="mdi-currency-eur" />

              <v-btn type="submit" color="primary" class="mt-4" :loading="loading.vehicle">
                Araç Oluştur
              </v-btn>
            </v-form>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card elevation="2" class="pa-6 mb-4">
            <h2 class="text-h6 font-weight-bold mb-4">Plaka Ekle</h2>
            <v-form @submit.prevent="addPlate" ref="plateFormRef" v-model="plateFormValid">
              <v-text-field v-model="plateForm.vehicleId" label="Araç ID" prepend-inner-icon="mdi-car-info" required />
              <v-text-field v-model="plateForm.plateNumber" label="Plaka" prepend-inner-icon="mdi-card-text" required />
              <v-btn type="submit" color="primary" class="mt-4" :loading="loading.plate">
                Plaka Kaydet
              </v-btn>
            </v-form>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card elevation="2" class="pa-6 mb-4">
            <h2 class="text-h6 font-weight-bold mb-4">Fiyat Periyodu</h2>
            <v-form @submit.prevent="upsertPricing" ref="pricingFormRef" v-model="pricingFormValid">
              <v-text-field v-model="pricingForm.vehicleId" label="Araç ID" prepend-inner-icon="mdi-car-cog" required />
              <v-select
                v-model="pricingForm.season"
                :items="seasonOptions"
                item-title="label"
                item-value="value"
                label="Mevsim"
                prepend-inner-icon="mdi-weather-partly-cloudy"
              />
              <v-text-field v-model.number="pricingForm.month" label="Ay (1-12)" type="number" min="1" max="12" />
              <v-text-field v-model.number="pricingForm.dailyRate" label="Günlük Fiyat" type="number" prepend-inner-icon="mdi-currency-eur" />
              <v-text-field v-model.number="pricingForm.weeklyRate" label="Haftalık Fiyat" type="number" prepend-inner-icon="mdi-calendar-week" />
              <v-btn type="submit" color="primary" class="mt-4" :loading="loading.pricing">
                Kaydet
              </v-btn>
            </v-form>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card elevation="2" class="pa-6 mb-4">
            <h2 class="text-h6 font-weight-bold mb-4">Rezervasyon Plaka Atama</h2>
            <v-form @submit.prevent="assignPlate" ref="assignFormRef" v-model="assignFormValid">
              <v-text-field v-model="assignForm.reservationId" label="Rezervasyon ID" prepend-inner-icon="mdi-book-account" required />
              <v-text-field v-model="assignForm.plateId" label="Plaka ID" prepend-inner-icon="mdi-card-bulleted" required />
              <v-text-field v-model="assignForm.startDate" label="Başlangıç" type="datetime-local" prepend-inner-icon="mdi-calendar-start" required />
              <v-text-field v-model="assignForm.endDate" label="Bitiş" type="datetime-local" prepend-inner-icon="mdi-calendar-end" required />
              <v-btn type="submit" color="primary" class="mt-4" :loading="loading.assign">
                Plaka Ata
              </v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>

      <v-card elevation="2" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h6 font-weight-bold">Araç Listesi</h2>
          <v-btn icon="mdi-refresh" variant="text" @click="loadVehicles" />
        </div>

        <v-list v-if="vehicles.length" lines="two">
          <v-list-item v-for="vehicle in vehicles" :key="vehicle.id">
            <template #prepend>
              <v-avatar color="primary" variant="tonal"><v-icon icon="mdi-car" /></v-avatar>
            </template>
            <v-list-item-title>{{ vehicle.brand }} {{ vehicle.model }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ vehicle.baseRate }} {{ vehicle.currencyCode }} · Plakalar: {{ vehicle.plates.map((p) => p.plateNumber).join(', ') || '-' }}
            </v-list-item-subtitle>
            <template #append>
              <v-chip color="secondary" variant="tonal">{{ vehicle.pricingPeriods.length }} fiyat</v-chip>
            </template>
          </v-list-item>
        </v-list>
        <v-alert v-else type="info" variant="tonal">Araç kaydı bulunamadı.</v-alert>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';

interface VehicleDto {
  id: string;
  brand: string;
  model: string;
  baseRate: number;
  currencyCode: string;
  plates: { id: string; plateNumber: string }[];
  pricingPeriods: { id: string; month: number; dailyRate: number }[];
}

const auth = useAuthStore();
const isRentacarTenant = computed(() => auth.tenant?.category === 'rentacar');

const vehicles = ref<VehicleDto[]>([]);

const vehicleForm = reactive({
  name: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  baseRate: 0,
});

const plateForm = reactive({
  vehicleId: '',
  plateNumber: '',
});

const pricingForm = reactive({
  vehicleId: '',
  season: 'winter',
  month: 1,
  dailyRate: 0,
  weeklyRate: 0,
});

const assignForm = reactive({
  reservationId: '',
  plateId: '',
  startDate: '',
  endDate: '',
});

const loading = reactive({
  vehicle: false,
  plate: false,
  pricing: false,
  assign: false,
});

const vehicleFormRef = ref();
const plateFormRef = ref();
const pricingFormRef = ref();
const assignFormRef = ref();
const vehicleFormValid = ref(false);
const plateFormValid = ref(false);
const pricingFormValid = ref(false);
const assignFormValid = ref(false);

const seasonOptions = [
  { label: 'Kış', value: 'winter' },
  { label: 'İlkbahar', value: 'spring' },
  { label: 'Yaz', value: 'summer' },
  { label: 'Sonbahar', value: 'autumn' },
];

const loadVehicles = async () => {
  if (!auth.tenant) return;
  const { data } = await http.get<VehicleDto[]>('/rentacar/vehicles', {
    params: { tenantId: auth.tenant.id },
  });
  vehicles.value = data;
};

const createVehicle = async () => {
  if (!auth.tenant) return;
  const validated = await vehicleFormRef.value?.validate();
  if (!validated?.valid) return;

  loading.vehicle = true;
  try {
    await http.post('/rentacar/vehicles', {
      tenantId: auth.tenant.id,
      name: vehicleForm.name,
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      year: vehicleForm.year,
      baseRate: vehicleForm.baseRate,
    });
    await loadVehicles();
  } finally {
    loading.vehicle = false;
  }
};

const addPlate = async () => {
  const validated = await plateFormRef.value?.validate();
  if (!validated?.valid) return;

  loading.plate = true;
  try {
    await http.post(`/rentacar/vehicles/${plateForm.vehicleId}/plates`, {
      plateNumber: plateForm.plateNumber,
    });
    await loadVehicles();
  } finally {
    loading.plate = false;
  }
};

const upsertPricing = async () => {
  const validated = await pricingFormRef.value?.validate();
  if (!validated?.valid) return;

  loading.pricing = true;
  try {
    await http.post(`/rentacar/vehicles/${pricingForm.vehicleId}/pricing`, pricingForm);
    await loadVehicles();
  } finally {
    loading.pricing = false;
  }
};

const assignPlate = async () => {
  const validated = await assignFormRef.value?.validate();
  if (!validated?.valid) return;

  loading.assign = true;
  try {
    await http.post(`/rentacar/reservations/${assignForm.reservationId}/assignments`, assignForm);
  } finally {
    loading.assign = false;
  }
};

onMounted(() => {
  if (isRentacarTenant.value) {
    loadVehicles();
  }
});
</script>
