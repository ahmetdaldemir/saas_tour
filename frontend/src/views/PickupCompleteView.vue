<template>
  <div class="pickup-page">
    <!-- Header -->
    <div class="page-header">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <div class="flex-1">
        <h1 class="page-title">Çıkış İşlemi</h1>
        <p class="page-subtitle">Rezervasyon: {{ reservation?.reference || 'Yükleniyor...' }}</p>
      </div>
    </div>

    <!-- Reservation Info Card -->
    <div v-if="reservation || vehicleInfo" class="info-card">
      <div class="info-row">
        <div class="info-item">
          <span class="info-label">Müşteri</span>
          <span class="info-value">{{ reservation?.customerName || '-' }}</span>
        </div>
        <div v-if="vehicleInfo" class="info-item">
          <span class="info-label">Araç</span>
          <span class="info-value">{{ vehicleInfo.plate || '' }} {{ vehicleInfo.model || '' }}</span>
        </div>
      </div>
    </div>

    <!-- Form Sections -->
    <div class="form-sections">
      <!-- KM Section -->
      <div class="form-section">
        <label class="section-label">
          <v-icon size="20" class="mr-2">mdi-speedometer</v-icon>
          Kilometre <span class="required">*</span>
        </label>
        <v-text-field
          v-model.number="odometerKm"
          type="number"
          placeholder="Örn: 15000"
          
          density="comfortable"
          :rules="[rules.required, rules.positive]"
          hide-details="auto"
          class="mt-2"
        />
      </div>

      <!-- Fuel Level Section -->
      <div class="form-section">
        <label class="section-label">
          <v-icon size="20" class="mr-2">mdi-gas-station</v-icon>
          Yakıt Seviyesi <span class="required">*</span>
        </label>
        <div class="fuel-buttons mt-2">
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
      </div>

      <!-- Photos Section -->
      <div class="form-section">
        <label class="section-label">
          <v-icon size="20" class="mr-2">mdi-camera</v-icon>
          Fotoğraflar <span class="required">*</span>
        </label>
        <p class="section-hint">8 adet fotoğraf yüklenmelidir</p>
        <PhotoGrid8Slots
          v-model="photos"
          :reservation-id="reservationId"
          class="mt-2"
          @upload-complete="handlePhotoUpload"
        />
      </div>

      <!-- Damage Notes Section -->
      <div class="form-section">
        <label class="section-label">
          <v-icon size="20" class="mr-2">mdi-alert-circle</v-icon>
          Hasar Notları
        </label>
        <v-textarea
          v-model="damageNotes"
          placeholder="Varsa hasar notlarını girin..."
          
          density="comfortable"
          rows="3"
          hide-details
          class="mt-2"
        />
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <BottomStickyActionBar
      :can-complete="canComplete"
      :loading="loading"
      complete-text="Çıkışı Tamamla"
      complete-icon="mdi-check-circle"
      @save-draft="saveDraft"
      @complete="completePickup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../services/api.service';
import PhotoGrid8Slots from '../components/PhotoGrid8Slots.vue';
import BottomStickyActionBar from '../components/BottomStickyActionBar.vue';
import Swal from 'sweetalert2';

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
const damageNotes = ref('');
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
    // Load pickup data (draft if exists)
    const resResponse = await http.get(`/rentacar/operations/pickup/${reservationId}`);
    if (resResponse.data.pickup) {
      odometerKm.value = resResponse.data.pickup.odometerKm;
      fuelLevel.value = resResponse.data.pickup.fuelLevel || '';
      damageNotes.value = resResponse.data.pickup.damageNotes || '';
    }
    if (resResponse.data.photos && resResponse.data.photos.length > 0) {
      photos.value = resResponse.data.photos.map((p: any) => ({
        slotIndex: p.slotIndex,
        mediaUrl: p.mediaUrl,
      }));
    }

    // Load reservation details
    const reservationResponse = await http.get(`/reservations/${reservationId}`);
    reservation.value = reservationResponse.data;

    // Load vehicle info if available
    if (reservationResponse.data.metadata?.vehicleId) {
      try {
        const vehicleResponse = await http.get(
          `/rentacar/vehicles/${reservationResponse.data.metadata.vehicleId}`
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
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: 'Veriler yüklenirken bir hata oluştu',
    });
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
    await http.post(`/rentacar/operations/pickup/${reservationId}/draft`, {
      odometerKm: odometerKm.value,
      fuelLevel: fuelLevel.value,
      photos: photos.value,
      damageNotes: damageNotes.value,
    });
    Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Taslak kaydedildi',
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Taslak kaydedilirken hata oluştu',
    });
  } finally {
    loading.value = false;
  }
};

const completePickup = async () => {
  if (!canComplete.value) return;

  const result = await Swal.fire({
    title: 'Çıkışı tamamla?',
    text: 'Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Evet, tamamla',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#3b82f6',
  });

  if (!result.isConfirmed) return;

  loading.value = true;
  try {
    await http.post(`/rentacar/operations/pickup/${reservationId}/complete`, {
      odometerKm: odometerKm.value,
      fuelLevel: fuelLevel.value,
      photos: photos.value,
      damageNotes: damageNotes.value,
    });
    
    await Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Çıkış işlemi tamamlandı',
      timer: 2000,
      showConfirmButton: false,
    });
    
    router.push('/app/operations');
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Çıkış tamamlanırken hata oluştu',
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.pickup-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 100px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.form-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.section-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.section-label .required {
  color: #dc2626;
  margin-left: 4px;
}

.section-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.fuel-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.fuel-btn {
  min-height: 48px;
}

@media (max-width: 768px) {
  .pickup-page {
    padding: 16px;
    padding-bottom: 100px;
  }

  .info-row {
    flex-direction: column;
    gap: 12px;
  }

  .fuel-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
