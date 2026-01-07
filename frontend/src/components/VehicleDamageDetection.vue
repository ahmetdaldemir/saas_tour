<template>
  <div class="vehicle-damage-detection">
    <v-alert
      type="info"
      variant="tonal"
      class="mb-4"
      prominent
    >
      <v-alert-title>Otomatik Görsel Karşılaştırma</v-alert-title>
      <div class="text-body-2 mt-2">
        Bu sistem otomatik görsel karşılaştırma yapar. Tespit edilen farklılıkların <strong>mutlaka insan tarafından doğrulanması gerekir</strong>.
      </div>
    </v-alert>

    <!-- Detection Form -->
    <v-card v-if="!detectionResult" class="mb-4">
      <v-card-title>Hasar Tespiti Başlat</v-card-title>
      <v-divider />
      <v-card-text>
        <v-form ref="formRef">
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Check-in Fotoğrafları</div>
              <div v-if="checkinPhotos.length > 0" class="d-flex flex-wrap gap-2 mb-2">
                <v-chip
                  v-for="(photo, index) in checkinPhotos"
                  :key="index"
                  closable
                  @click:close="removeCheckinPhoto(index)"
                >
                  {{ photo.name || `Fotoğraf ${index + 1}` }}
                </v-chip>
              </div>
              <v-file-input
                v-model="checkinFiles"
                label="Check-in Fotoğrafları Seç"
                multiple
                accept="image/*"
                prepend-icon="mdi-camera"
                @update:model-value="handleCheckinFiles"
              />
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Check-out Fotoğrafları (Opsiyonel - Manuel)</div>
              <div v-if="checkoutPhotos.length > 0" class="d-flex flex-wrap gap-2 mb-2">
                <v-chip
                  v-for="(photo, index) in checkoutPhotos"
                  :key="index"
                  closable
                  @click:close="removeCheckoutPhoto(index)"
                >
                  {{ photo.name || `Fotoğraf ${index + 1}` }}
                </v-chip>
              </div>
              <v-file-input
                v-model="checkoutFiles"
                label="Check-out Fotoğrafları Seç"
                multiple
                accept="image/*"
                prepend-icon="mdi-camera"
                @update:model-value="handleCheckoutFiles"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          :loading="processing"
          @click="processDetection"
        >
          Hasar Tespiti Başlat
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Detection Results -->
    <v-card v-if="detectionResult" class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Hasar Tespit Sonuçları</span>
        <v-chip
          :color="getProbabilityColor(detectionResult.damageProbability)"
          variant="flat"
          size="large"
        >
          %{{ detectionResult.damageProbability }} Olasılık
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-card >
              <v-card-title class="text-subtitle-1">Güven Skoru</v-card-title>
              <v-card-text>
                <div class="text-h4 text-center">{{ detectionResult.confidenceScore }}%</div>
                <v-progress-linear
                  :model-value="detectionResult.confidenceScore"
                  color="primary"
                  height="8"
                  class="mt-2"
                />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card >
              <v-card-title class="text-subtitle-1">Piksel Farkı</v-card-title>
              <v-card-text>
                <div class="text-h4 text-center">{{ detectionResult.processingMetadata?.pixelDifference }}%</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card >
              <v-card-title class="text-subtitle-1">Kenar Farkı</v-card-title>
              <v-card-text>
                <div class="text-h4 text-center">{{ detectionResult.processingMetadata?.edgeDifference }}%</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Photo Comparison -->
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <v-card >
              <v-card-title class="text-subtitle-1">Check-in Fotoğrafı</v-card-title>
              <v-card-text class="pa-0">
                <v-img
                  v-if="checkinPhotoUrl"
                  :src="checkinPhotoUrl"
                  cover
                  height="300"
                  class="comparison-image"
                />
                <div v-else class="text-center pa-8 text-medium-emphasis">
                  Fotoğraf yükleniyor...
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card >
              <v-card-title class="text-subtitle-1">Check-out Fotoğrafı</v-card-title>
              <v-card-text class="pa-0">
                <v-img
                  v-if="checkoutPhotoUrl"
                  :src="checkoutPhotoUrl"
                  cover
                  height="300"
                  class="comparison-image"
                />
                <div v-else class="text-center pa-8 text-medium-emphasis">
                  Fotoğraf yükleniyor...
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Difference Overlay -->
        <v-row v-if="detectionResult.differenceImageUrl" class="mt-4">
          <v-col cols="12">
            <v-card >
              <v-card-title class="text-subtitle-1">Fark Görüntüsü (Overlay)</v-card-title>
              <v-card-text class="pa-0">
                <v-img
                  :src="detectionResult.differenceImageUrl"
                  cover
                  height="400"
                  class="difference-image"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Detected Damage Areas -->
        <v-row v-if="detectionResult.damagedAreas && detectionResult.damagedAreas.length > 0" class="mt-4">
          <v-col cols="12">
            <v-card >
              <v-card-title class="text-subtitle-1">
                Tespit Edilen Hasar Bölgeleri ({{ detectionResult.damagedAreas.length }})
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="(area, index) in detectionResult.damagedAreas"
                    :key="index"
                  >
                    <template #prepend>
                      <v-icon :color="getAreaColor(area.confidence)">
                        {{ getAreaIcon(area.type) }}
                      </v-icon>
                    </template>
                    <v-list-item-title>
                      Bölge {{ index + 1 }} - %{{ area.confidence }} Güven
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Tip: {{ getAreaTypeLabel(area.type) }} | 
                      Konum: ({{ Math.round(area.x * 100) }}%, {{ Math.round(area.y * 100) }}%) | 
                      Boyut: {{ Math.round(area.width * 100) }}% x {{ Math.round(area.height * 100) }}%
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Verification Actions -->
        <v-row v-if="detectionResult.status === 'completed'" class="mt-4">
          <v-col cols="12">
            <v-card  color="warning">
              <v-card-title class="text-subtitle-1">İnsan Doğrulaması Gerekli</v-card-title>
              <v-card-text>
                <v-textarea
                  v-model="verificationNotes"
                  label="Doğrulama Notları"
                  rows="3"
                  class="mb-4"
                />
                <div class="d-flex gap-2">
                  <v-btn
                    color="success"
                    prepend-icon="mdi-check-circle"
                    @click="verifyDetection(true)"
                    :loading="verifying"
                  >
                    Hasar Doğrulandı
                  </v-btn>
                  <v-btn
                    color="info"
                    prepend-icon="mdi-close-circle"
                    @click="verifyDetection(false)"
                    :loading="verifying"
                  >
                    Yanlış Pozitif
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Already Verified -->
        <v-alert
          v-if="detectionResult.status === 'verified'"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          Bu tespit doğrulanmıştır.
        </v-alert>
        <v-alert
          v-if="detectionResult.status === 'false_positive'"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          Bu tespit yanlış pozitif olarak işaretlenmiştir.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { http } from '../services/api.service';
import { useSnackbar } from '../composables/useSnackbar';

interface DamageDetectionResult {
  id: string;
  damageProbability: number;
  confidenceScore: number;
  damagedAreas?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    type?: string;
  }>;
  differenceImageUrl?: string;
  processingMetadata?: {
    pixelDifference: number;
    edgeDifference: number;
    processingTime: number;
    imageDimensions: {
      width: number;
      height: number;
    };
  };
  checkinPhotoUrls: string[];
  checkoutPhotoUrls: string[];
  status: string;
}

const props = defineProps<{
  vehicleId: string;
  reservationId: string;
}>();

const { showSnackbar } = useSnackbar();

const checkinFiles = ref<File[]>([]);
const checkoutFiles = ref<File[]>([]);
const checkinPhotos = ref<Array<{ url: string; name: string }>>([]);
const checkoutPhotos = ref<Array<{ url: string; name: string }>>([]);
const processing = ref(false);
const detectionResult = ref<DamageDetectionResult | null>(null);
const verifying = ref(false);
const verificationNotes = ref('');

const checkinPhotoUrl = computed(() => {
  if (detectionResult.value?.checkinPhotoUrls?.length > 0) {
    return detectionResult.value.checkinPhotoUrls[0];
  }
  return checkinPhotos.value[0]?.url;
});

const checkoutPhotoUrl = computed(() => {
  if (detectionResult.value?.checkoutPhotoUrls?.length > 0) {
    return detectionResult.value.checkoutPhotoUrls[0];
  }
  return checkoutPhotos.value[0]?.url;
});

const handleCheckinFiles = async (files: File[] | null) => {
  if (!files || files.length === 0) return;
  
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Upload file (you'll need to implement this endpoint or use existing upload)
      // For now, create object URL for preview
      const url = URL.createObjectURL(file);
      checkinPhotos.value.push({ url, name: file.name });
    } catch (error) {
      console.error('Failed to upload check-in photo:', error);
    }
  }
};

const handleCheckoutFiles = async (files: File[] | null) => {
  if (!files || files.length === 0) return;
  
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Upload file (you'll need to implement this endpoint or use existing upload)
      // For now, create object URL for preview
      const url = URL.createObjectURL(file);
      checkoutPhotos.value.push({ url, name: file.name });
    } catch (error) {
      console.error('Failed to upload check-out photo:', error);
    }
  }
};

const removeCheckinPhoto = (index: number) => {
  checkinPhotos.value.splice(index, 1);
};

const removeCheckoutPhoto = (index: number) => {
  checkoutPhotos.value.splice(index, 1);
};

const processDetection = async () => {
  try {
    processing.value = true;
    
    let checkinUrls: string[] = [];
    let checkoutUrls: string[] = [];
    
    // First, try to load photos from operations system
    try {
      const damageCompareResponse = await http.get(
        `/rentacar/operations/damage-compare/${props.reservationId}`
      );
      const damageCompare = damageCompareResponse.data;
      
      if (damageCompare.pickupPhotos && damageCompare.pickupPhotos.length > 0) {
        checkinUrls = damageCompare.pickupPhotos.map((p: any) => p.url);
      }
      if (damageCompare.returnPhotos && damageCompare.returnPhotos.length > 0) {
        checkoutUrls = damageCompare.returnPhotos.map((p: any) => p.url);
      }
    } catch (opsError) {
      console.warn('Could not load photos from operations:', opsError);
      // Fall back to manual uploads
    }
    
    // If no photos from operations, use manually uploaded photos
    if (checkinUrls.length === 0 && checkinPhotos.value.length > 0) {
      // Upload local files if needed
      for (const photo of checkinPhotos.value) {
        if (photo.url.startsWith('blob:')) {
          // This is a local file, needs to be uploaded
          // For now, skip - user should upload files first
          continue;
        }
        checkinUrls.push(photo.url);
      }
    }
    
    if (checkoutUrls.length === 0 && checkoutPhotos.value.length > 0) {
      for (const photo of checkoutPhotos.value) {
        if (photo.url.startsWith('blob:')) {
          continue;
        }
        checkoutUrls.push(photo.url);
      }
    }
    
    // If still no photos, check if we have manually uploaded files
    if (checkinUrls.length === 0 || checkoutUrls.length === 0) {
      if (checkinPhotos.value.length === 0 || checkoutPhotos.value.length === 0) {
        showSnackbar('Lütfen hem check-in hem check-out fotoğraflarını seçin veya operasyon sisteminden fotoğraflar yüklenmiş olmalı', 'warning');
        processing.value = false;
        return;
      }
    }
    
    // Get vehicleId from reservation if not provided
    let vehicleId = props.vehicleId;
    if (!vehicleId) {
      try {
        const reservationResponse = await http.get(`/reservations/${props.reservationId}`);
        vehicleId = reservationResponse.data.metadata?.vehicleId;
        if (!vehicleId) {
          throw new Error('Vehicle ID not found in reservation');
        }
      } catch (error) {
        showSnackbar('Araç bilgisi bulunamadı', 'error');
        processing.value = false;
        return;
      }
    }

    const response = await http.post(
      `/rentacar/vehicles/${vehicleId}/reservations/${props.reservationId}/damage-detection`,
      {
        checkinPhotoUrls: checkinUrls,
        checkoutPhotoUrls: checkoutUrls,
      }
    );

    detectionResult.value = response.data.data;
    showSnackbar('Hasar tespiti tamamlandı', 'success');
  } catch (error: any) {
    console.error('Failed to process detection:', error);
    showSnackbar(error.response?.data?.message || 'Hasar tespiti başarısız', 'error');
  } finally {
    processing.value = false;
  }
};

const verifyDetection = async (isDamage: boolean) => {
  if (!detectionResult.value) return;

  try {
    verifying.value = true;
    const response = await http.post(`/rentacar/damage-detections/${detectionResult.value.id}/verify`, {
      isDamage,
      notes: verificationNotes.value,
    });
    detectionResult.value = response.data.data;
    showSnackbar('Doğrulama kaydedildi', 'success');
  } catch (error: any) {
    console.error('Failed to verify detection:', error);
    showSnackbar(error.response?.data?.message || 'Doğrulama başarısız', 'error');
  } finally {
    verifying.value = false;
  }
};

const getProbabilityColor = (probability: number): string => {
  if (probability < 20) return 'success';
  if (probability < 50) return 'warning';
  if (probability < 80) return 'orange';
  return 'error';
};

const getAreaColor = (confidence: number): string => {
  if (confidence < 30) return 'success';
  if (confidence < 60) return 'warning';
  return 'error';
};

const getAreaIcon = (type?: string): string => {
  const iconMap: Record<string, string> = {
    scratch: 'mdi-scratch',
    dent: 'mdi-car-door',
    crack: 'mdi-alert-circle',
  };
  return iconMap[type || 'other'] || 'mdi-alert';
};

const getAreaTypeLabel = (type?: string): string => {
  const labelMap: Record<string, string> = {
    scratch: 'Çizik',
    dent: 'Göçük',
    crack: 'Çatlak',
  };
  return labelMap[type || 'other'] || 'Diğer';
};

// Load existing detection if available
const loadExistingDetection = async () => {
  try {
    const response = await http.get(`/rentacar/reservations/${props.reservationId}/damage-detection`);
    if (response.data.data) {
      detectionResult.value = response.data.data;
    }
  } catch (error) {
    // No existing detection, that's fine
  }
};

// Load on mount
loadExistingDetection();
</script>

<style scoped>
.vehicle-damage-detection {
  width: 100%;
}

.comparison-image {
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.difference-image {
  border: 2px solid rgba(255, 0, 0, 0.3);
}
</style>

