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
          <h1 class="text-h4 ml-2">Çıkış İşlemi</h1>
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

        <v-card class="mb-4">
          <v-card-title>Kilometre</v-card-title>
          <v-card-text>
            <v-text-field
              v-model.number="odometerKm"
              type="number"
              label="Kilometre"
              placeholder="Örn: 15000"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.positive]"
              prepend-inner-icon="mdi-speedometer"
            />
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
          complete-text="Çıkışı Tamamla"
          complete-icon="mdi-check-circle"
          @save-draft="saveDraft"
          @complete="completePickup"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../services/api.service';
import PhotoGrid8Slots from '../components/PhotoGrid8Slots.vue';
import BottomStickyActionBar from '../components/BottomStickyActionBar.vue';

interface PhotoSlot {
  slotIndex: number;
  mediaUrl: string;
}

const route = useRoute();
const router = useRouter();
const reservationId = route.params.reservationId as string;

const reservation = ref<any>(null);
const vehicleInfo = ref<{ plate?: string; model?: string } | null>(null);
const odometerKm = ref<number | null>(null);
const fuelLevel = ref<string>('');
const photos = ref<PhotoSlot[]>([]);
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

const canComplete = computed(() => {
  return (
    odometerKm.value !== null &&
    odometerKm.value >= 0 &&
    fuelLevel.value !== '' &&
    photos.value.length === 8
  );
});

const loadData = async () => {
  try {
    // Load reservation info
    const resResponse = await http.get(`/api/rentacar/operations/pickup/${reservationId}`);
    if (resResponse.data.pickup) {
      odometerKm.value = resResponse.data.pickup.odometerKm;
      fuelLevel.value = resResponse.data.pickup.fuelLevel || '';
    }
    if (resResponse.data.photos && resResponse.data.photos.length > 0) {
      photos.value = resResponse.data.photos.map((p: any) => ({
        slotIndex: p.slotIndex,
        mediaUrl: p.mediaUrl,
      }));
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
  } catch (error: any) {
    console.error('Error loading pickup data:', error);
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
    await http.post(`/api/rentacar/operations/pickup/${reservationId}/draft`, {
      odometerKm: odometerKm.value,
      fuelLevel: fuelLevel.value,
      photos: photos.value,
    });
    // Show success message
    alert('Taslak kaydedildi');
  } catch (error: any) {
    console.error('Error saving draft:', error);
    alert('Taslak kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

const completePickup = async () => {
  if (!canComplete.value) return;

  loading.value = true;
  try {
    await http.post(`/api/rentacar/operations/pickup/${reservationId}/complete`, {
      odometerKm: odometerKm.value,
      fuelLevel: fuelLevel.value,
      photos: photos.value,
    });
    // Show success message and redirect
    alert('Çıkış işlemi tamamlandı');
    router.push('/app/operations');
  } catch (error: any) {
    console.error('Error completing pickup:', error);
    alert('Çıkış tamamlanırken hata oluştu: ' + (error.response?.data?.message || error.message));
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

