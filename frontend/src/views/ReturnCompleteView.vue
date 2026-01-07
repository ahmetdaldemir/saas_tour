<template>
  <div class="return-page">
    <!-- Header -->
    <div class="page-header">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      <div class="flex-1">
        <h1 class="page-title">Dönüş İşlemi</h1>
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

    <!-- Warnings -->
    <div v-if="warnings.length > 0" class="warnings-card">
      <div class="warnings-header">
        <v-icon color="warning" size="24">mdi-alert</v-icon>
        <span class="warnings-title">Uyarılar</span>
      </div>
      <div class="warnings-list">
        <div
          v-for="warning in warnings"
          :key="warning.id"
          class="warning-item"
        >
          <v-checkbox
            v-model="acknowledgedWarnings"
            :value="warning.id"
            color="warning"
            hide-details
            density="compact"
            class="warning-checkbox"
          />
          <div class="warning-content">
            <div class="warning-type">
              {{ warning.type === 'KM_OVER_LIMIT' ? 'Kilometre Uyarısı' : 'Yakıt Uyarısı' }}
            </div>
            <div class="warning-message">{{ warning.message }}</div>
          </div>
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
        <div v-if="pickupKm !== null" class="comparison-info">
          <span class="comparison-label">Çıkış kilometresi:</span>
          <span class="comparison-value">{{ pickupKm }} km</span>
          <span
            v-if="kmDiff !== null"
            class="comparison-diff"
            :class="kmDiff > 300 ? 'diff-warning' : 'diff-ok'"
          >
            (Fark: {{ kmDiff > 0 ? '+' : '' }}{{ kmDiff.toFixed(0) }} km)
          </span>
        </div>
        <v-text-field
          v-model.number="odometerKm"
          type="number"
          placeholder="Örn: 15300"
          
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
        <div v-if="pickupFuel" class="comparison-info">
          <span class="comparison-label">Çıkış yakıt seviyesi:</span>
          <span class="comparison-value">{{ formatFuelLevel(pickupFuel) }}</span>
        </div>
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
      complete-text="Dönüşü Tamamla"
      complete-icon="mdi-check-circle"
      @save-draft="saveDraft"
      @complete="completeReturn"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../services/api.service';
import PhotoGrid8Slots from '../components/PhotoGrid8Slots.vue';
import BottomStickyActionBar from '../components/BottomStickyActionBar.vue';
import Swal from 'sweetalert2';

interface PhotoSlot {
  slotIndex: number;
  mediaUrl: string;
}

interface Warning {
  id: string;
  type: 'KM_OVER_LIMIT' | 'FUEL_MISMATCH';
  message: string;
  payload?: any;
  acknowledgedBy?: string;
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
    // Load return data (draft if exists)
    const returnResponse = await http.get(`/rentacar/operations/return/${reservationId}`);
    if (returnResponse.data.return) {
      odometerKm.value = returnResponse.data.return.odometerKm;
      fuelLevel.value = returnResponse.data.return.fuelLevel || '';
      damageNotes.value = returnResponse.data.return.damageNotes || '';
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
    const pickupResponse = await http.get(`/rentacar/operations/pickup/${reservationId}`);
    if (pickupResponse.data.pickup) {
      pickupKm.value = pickupResponse.data.pickup.odometerKm;
      pickupFuel.value = pickupResponse.data.pickup.fuelLevel;
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

    // Check for new warnings
    if (odometerKm.value !== null && fuelLevel.value) {
      await checkWarnings();
    }
  } catch (error: any) {
    console.error('Error loading return data:', error);
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: 'Veriler yüklenirken bir hata oluştu',
    });
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

  const newWarnings: Warning[] = [];

  // Check KM warning
  const diff = odometerKm.value - pickupKm.value;
  if (diff > 300) {
    const existingWarning = warnings.value.find(w => w.type === 'KM_OVER_LIMIT');
    if (!existingWarning) {
      newWarnings.push({
        id: `temp-km-${Date.now()}`,
        type: 'KM_OVER_LIMIT',
        message: `Kilometre farkı ${diff.toFixed(0)} km (Limit: 300 km)`,
      });
    }
  }

  // Check fuel mismatch
  if (pickupFuel.value && fuelLevel.value !== pickupFuel.value) {
    const existingWarning = warnings.value.find(w => w.type === 'FUEL_MISMATCH');
    if (!existingWarning) {
      newWarnings.push({
        id: `temp-fuel-${Date.now()}`,
        type: 'FUEL_MISMATCH',
        message: `Yakıt seviyesi uyuşmuyor. Çıkış: ${formatFuelLevel(pickupFuel.value)}, Dönüş: ${formatFuelLevel(fuelLevel.value)}`,
      });
    }
  }

  // Add new warnings
  warnings.value = [...warnings.value, ...newWarnings];
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
    await http.post(`/rentacar/operations/return/${reservationId}/draft`, {
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

const completeReturn = async () => {
  if (!canComplete.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Eksik Bilgi',
      text: 'Lütfen tüm zorunlu alanları doldurun ve uyarıları onaylayın',
    });
    return;
  }

  const result = await Swal.fire({
    title: 'Dönüşü tamamla?',
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
    const response = await http.post(`/rentacar/operations/return/${reservationId}/complete`, {
      odometerKm: odometerKm.value,
      fuelLevel: fuelLevel.value,
      photos: photos.value,
      damageNotes: damageNotes.value,
      acknowledgedWarnings: acknowledgedWarnings.value,
    });

    // If warnings are returned, show them
    if (response.data.warnings && response.data.warnings.length > 0) {
      warnings.value = response.data.warnings;
      const unacknowledged = warnings.value.filter(w => !acknowledgedWarnings.value.includes(w.id));
      if (unacknowledged.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Uyarı',
          text: 'Lütfen tüm uyarıları onaylayın',
        });
        return;
      }
    }

    await Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Dönüş işlemi tamamlandı',
      timer: 2000,
      showConfirmButton: false,
    });

    router.push('/app/operations');
  } catch (error: any) {
    if (error.response?.status === 422 && error.response.data.warnings) {
      warnings.value = error.response.data.warnings;
      Swal.fire({
        icon: 'warning',
        title: 'Uyarı',
        text: 'Lütfen tüm uyarıları onaylayın',
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: error.response?.data?.message || 'Dönüş tamamlanırken hata oluştu',
      });
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
.return-page {
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

.warnings-card {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.warnings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.warnings-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
}

.warnings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.warning-checkbox {
  margin-top: 2px;
}

.warning-content {
  flex: 1;
}

.warning-type {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 4px;
}

.warning-message {
  font-size: 13px;
  color: #78350f;
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

.comparison-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.comparison-label {
  font-weight: 500;
}

.comparison-value {
  font-weight: 600;
  color: #374151;
}

.comparison-diff {
  font-weight: 600;
  margin-left: auto;
}

.diff-ok {
  color: #059669;
}

.diff-warning {
  color: #dc2626;
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
  .return-page {
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

  .comparison-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
