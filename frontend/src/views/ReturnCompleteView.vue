<template>
  <v-container fluid class="pa-4 pb-16">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="$router.back()"
          />
          <h1 class="text-h4 ml-2">Dönüş İşlemi</h1>
        </div>

        <v-card class="mb-4">
          <v-card-title>Rezervasyon Bilgileri</v-card-title>
          <v-card-text>
            <div class="text-body-1">
              <strong>Rezervasyon:</strong> {{ reservation?.reference }}
            </div>
            <div class="text-body-1 mt-2">
              <strong>Müşteri:</strong> {{ reservation?.customerName }}
            </div>
            <div class="text-body-1 mt-2" v-if="vehicleInfo">
              <strong>Araç:</strong> {{ vehicleInfo.plate }} - {{ vehicleInfo.model }}
            </div>
          </v-card-text>
        </v-card>

        <!-- Warnings -->
        <v-card v-if="warnings.length > 0" class="mb-4" color="warning">
          <v-card-title>
            <v-icon start>mdi-alert</v-icon>
            Uyarılar
          </v-card-title>
          <v-card-text>
            <v-alert
              v-for="warning in warnings"
              :key="warning.id"
              type="warning"
              variant="tonal"
              class="mb-2"
            >
              <div class="d-flex align-center">
                <v-checkbox
                  v-model="acknowledgedWarnings"
                  :value="warning.id"
                  color="warning"
                  hide-details
                  class="mr-2"
                />
                <div>
                  <strong>{{ warning.type === 'KM_OVER_LIMIT' ? 'Kilometre Uyarısı' : 'Yakıt Uyarısı' }}</strong>
                  <div>{{ warning.message }}</div>
                </div>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>Kilometre</v-card-title>
          <v-card-text>
            <v-text-field
              v-model.number="odometerKm"
              type="number"
              label="Kilometre"
              placeholder="Örn: 15300"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.positive]"
              prepend-inner-icon="mdi-speedometer"
            />
            <div v-if="pickupKm !== null" class="text-caption text-medium-emphasis mt-2">
              Çıkış kilometresi: {{ pickupKm }} km
              <span v-if="kmDiff !== null" :class="kmDiff > 300 ? 'text-error' : 'text-success'">
                (Fark: {{ kmDiff > 0 ? '+' : '' }}{{ kmDiff.toFixed(0) }} km)
              </span>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>Yakıt Seviyesi</v-card-title>
          <v-card-text>
            <div class="fuel-buttons">
              <v-btn
                v-for="level in fuelLevels"
                :key="level.value"
                :color="fuelLevel === level.value ? 'primary' : 'grey'"
                :variant="fuelLevel === level.value ? 'flat' : 'outlined'"
                size="large"
                class="fuel-btn"
                @click="fuelLevel = level.value"
              >
                <v-icon start>{{ level.icon }}</v-icon>
                {{ level.label }}
              </v-btn>
            </div>
            <div v-if="pickupFuel" class="text-caption text-medium-emphasis mt-2">
              Çıkış yakıt seviyesi: {{ formatFuelLevel(pickupFuel) }}
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>Fotoğraflar</v-card-title>
          <v-card-text>
            <PhotoGrid8Slots
              v-model="photos"
              :reservation-id="reservationId"
              @upload-complete="handlePhotoUpload"
            />
          </v-card-text>
        </v-card>

        <BottomStickyActionBar
          :can-complete="canComplete"
          :loading="loading"
          complete-text="Dönüşü Tamamla"
          complete-icon="mdi-check-circle"
          @save-draft="saveDraft"
          @complete="completeReturn"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../services/api.service';
import PhotoGrid8Slots from '../components/PhotoGrid8Slots.vue';
import BottomStickyActionBar from '../components/BottomStickyActionBar.vue';

interface PhotoSlot {
  slotIndex: number;
  mediaUrl: string;
}

interface Warning {
  id: string;
  type: 'KM_OVER_LIMIT' | 'FUEL_MISMATCH';
  message: string;
  payload?: any;
}

const route = useRoute();
const router = useRouter();
const reservationId = route.params.reservationId as string;

const reservation = ref<any>(null);
const vehicleInfo = ref<{ plate?: string; model?: string } | null>(null);
const odometerKm = ref<number | null>(null);
const fuelLevel = ref<string>('');
const photos = ref<PhotoSlot[]>([]);
const warnings = ref<Warning[]>([]);
const acknowledgedWarnings = ref<string[]>([]);
const pickupKm = ref<number | null>(null);
const pickupFuel = ref<string | null>(null);
const loading = ref(false);

const fuelLevels = [
  { value: 'full', label: 'Dolu', icon: 'mdi-gas-station' },
  { value: '3/4', label: '3/4', icon: 'mdi-gas-station' },
  { value: '1/2', label: 'Yarım', icon: 'mdi-gas-station' },
  { value: '1/4', label: '1/4', icon: 'mdi-gas-station' },
  { value: 'empty', label: 'Boş', icon: 'mdi-gas-station-outline' },
];

const rules = {
  required: (v: any) => !!v || 'Bu alan zorunludur',
  positive: (v: number) => (v && v >= 0) || 'Kilometre 0 veya pozitif olmalıdır',
};

const kmDiff = computed(() => {
  if (odometerKm.value === null || pickupKm.value === null) return null;
  return odometerKm.value - pickupKm.value;
});

const canComplete = computed(() => {
  const allWarningsAcknowledged = warnings.value.every(w => acknowledgedWarnings.value.includes(w.id));
  return (
    odometerKm.value !== null &&
    odometerKm.value >= 0 &&
    fuelLevel.value !== '' &&
    photos.value.length === 8 &&
    allWarningsAcknowledged
  );
});

const formatFuelLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    full: 'Dolu',
    '3/4': '3/4',
    '1/2': 'Yarım',
    '1/4': '1/4',
    empty: 'Boş',
  };
  return levelMap[level] || level;
};

const loadData = async () => {
  try {
    // Load return data
    const returnResponse = await http.get(`/api/rentacar/operations/return/${reservationId}`);
    if (returnResponse.data.return) {
      odometerKm.value = returnResponse.data.return.odometerKm;
      fuelLevel.value = returnResponse.data.return.fuelLevel || '';
    }
    if (returnResponse.data.photos && returnResponse.data.photos.length > 0) {
      photos.value = returnResponse.data.photos.map((p: any) => ({
        slotIndex: p.slotIndex,
        mediaUrl: p.mediaUrl,
      }));
    }
    if (returnResponse.data.warnings) {
      warnings.value = returnResponse.data.warnings;
      acknowledgedWarnings.value = returnResponse.data.warnings
        .filter((w: Warning) => w.acknowledgedBy)
        .map((w: Warning) => w.id);
    }

    // Load pickup data for comparison
    const pickupResponse = await http.get(`/api/rentacar/operations/pickup/${reservationId}`);
    if (pickupResponse.data.pickup) {
      pickupKm.value = pickupResponse.data.pickup.odometerKm;
      pickupFuel.value = pickupResponse.data.pickup.fuelLevel;
    }

    // Load reservation details
    const reservationResponse = await http.get(`/api/reservations/${reservationId}`);
    reservation.value = reservationResponse.data;

    // Load vehicle info if available
    if (reservationResponse.data.metadata?.vehicleId) {
      try {
        const vehicleResponse = await http.get(
          `/api/rentacar/vehicles/${reservationResponse.data.metadata.vehicleId}`
        );
        const vehicle = vehicleResponse.data;
        vehicleInfo.value = {
          plate: vehicle.plates?.[0]?.plateNumber,
          model: `${vehicle.brand?.name || ''} ${vehicle.model?.name || ''}`.trim(),
        };
      } catch (e) {
        console.error('Error loading vehicle:', e);
      }
    }

    // Check for new warnings
    if (odometerKm.value !== null && fuelLevel.value) {
      await checkWarnings();
    }
  } catch (error: any) {
    console.error('Error loading return data:', error);
  }
};

// Watch for changes to trigger warning check
watch([odometerKm, fuelLevel], () => {
  if (odometerKm.value !== null && fuelLevel.value) {
    checkWarnings();
  }
});

const checkWarnings = async () => {
  if (pickupKm.value === null || odometerKm.value === null) return;

  // Check KM warning
  const diff = odometerKm.value - pickupKm.value;
  if (diff > 300) {
    const existingWarning = warnings.value.find(w => w.type === 'KM_OVER_LIMIT');
    if (!existingWarning) {
      warnings.value.push({
        id: `temp-${Date.now()}`,
        type: 'KM_OVER_LIMIT',
        message: `Kilometre farkı ${diff.toFixed(0)} km (Limit: 300 km)`,
      });
    }
  }

  // Check fuel mismatch
  if (pickupFuel.value && fuelLevel.value !== pickupFuel.value) {
    const existingWarning = warnings.value.find(w => w.type === 'FUEL_MISMATCH');
    if (!existingWarning) {
      warnings.value.push({
        id: `temp-${Date.now() + 1}`,
        type: 'FUEL_MISMATCH',
        message: `Yakıt seviyesi uyuşmuyor. Çıkış: ${formatFuelLevel(pickupFuel.value)}, Dönüş: ${formatFuelLevel(fuelLevel.value)}`,
      });
    }
  }
};

const handlePhotoUpload = (slotIndex: number, url: string) => {
  const existingIndex = photos.value.findIndex(p => p.slotIndex === slotIndex);
  if (existingIndex >= 0) {
    photos.value[existingIndex].mediaUrl = url;
  } else {
    photos.value.push({ slotIndex, mediaUrl: url });
  }
};

const saveDraft = async () => {
  loading.value = true;
  try {
    await http.post(`/api/rentacar/operations/return/${reservationId}/draft`, {
      odometerKm: odometerKm.value,
      fuelLevel: fuelLevel.value,
      photos: photos.value,
    });
    alert('Taslak kaydedildi');
  } catch (error: any) {
    console.error('Error saving draft:', error);
    alert('Taslak kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

const completeReturn = async () => {
  if (!canComplete.value) return;

  loading.value = true;
  try {
    const response = await http.post(`/api/rentacar/operations/return/${reservationId}/complete`, {
      odometerKm: odometerKm.value,
      fuelLevel: fuelLevel.value,
      photos: photos.value,
      acknowledgedWarnings: acknowledgedWarnings.value,
    });

    // If warnings are returned, show them
    if (response.data.warnings && response.data.warnings.length > 0) {
      warnings.value = response.data.warnings;
      // Check if all are acknowledged
      const unacknowledged = warnings.value.filter(w => !acknowledgedWarnings.value.includes(w.id));
      if (unacknowledged.length > 0) {
        alert('Lütfen tüm uyarıları onaylayın');
        return;
      }
    }

    alert('Dönüş işlemi tamamlandı');
    router.push('/app/operations');
  } catch (error: any) {
    console.error('Error completing return:', error);
    if (error.response?.status === 422 && error.response.data.warnings) {
      // Update warnings from server
      warnings.value = error.response.data.warnings;
      alert('Lütfen tüm uyarıları onaylayın');
    } else {
      alert('Dönüş tamamlanırken hata oluştu: ' + (error.response?.data?.message || error.message));
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.fuel-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.fuel-btn {
  min-height: 56px;
}

@media (max-width: 600px) {
  .fuel-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

