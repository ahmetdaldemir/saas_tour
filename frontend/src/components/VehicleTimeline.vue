<template>
  <div class="vehicle-timeline">
    <v-card v-if="loading" class="pa-4">
      <v-progress-linear indeterminate color="primary" />
      <div class="text-center mt-4">Timeline yükleniyor...</div>
    </v-card>

    <v-card v-else-if="error" class="pa-4">
      <v-alert type="error" variant="tonal">
        {{ error }}
      </v-alert>
    </v-card>

    <div v-else-if="events.length === 0" class="text-center pa-8 text-medium-emphasis">
      <v-icon size="64" color="grey-lighten-1">mdi-timeline-outline</v-icon>
      <div class="text-h6 mt-4">Henüz timeline verisi yok</div>
      <div class="text-body-2 mt-2">Bu araç için henüz kayıt bulunmuyor.</div>
    </div>

    <v-timeline v-else side="end" density="compact" class="pa-4">
      <v-timeline-item
        v-for="(event, index) in groupedEvents"
        :key="event.id || index"
        :dot-color="getEventColor(event.type)"
        size="small"
        :icon="getEventIcon(event.type)"
      >
        <template #opposite>
          <div class="text-caption text-medium-emphasis">
            {{ formatDate(event.date) }}
          </div>
        </template>

        <v-card
          :color="getEventColor(event.type)"
          variant="tonal"
          class="mb-2"
          elevation="2"
        >
          <v-card-title class="d-flex align-center justify-space-between pa-3">
            <div class="d-flex align-center gap-2">
              <v-icon :icon="getEventIcon(event.type)" size="small" />
              <span class="text-subtitle-2 font-weight-bold">{{ event.title }}</span>
            </div>
            <v-chip
              :color="getEventColor(event.type)"
              size="x-small"
              variant="flat"
            >
              {{ getEventTypeLabel(event.type) }}
            </v-chip>
          </v-card-title>

          <v-card-text v-if="event.description" class="pt-0 pb-2">
            <div class="text-body-2" style="white-space: pre-line;">
              {{ event.description }}
            </div>
          </v-card-text>

          <!-- Metadata Display -->
          <v-card-text v-if="event.metadata" class="pt-0 pb-2">
            <v-expansion-panels variant="accordion" density="compact">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <span class="text-caption">Detaylar</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="text-caption">
                    <div v-for="(value, key) in getDisplayableMetadata(event.metadata)" :key="key" class="mb-1">
                      <strong>{{ formatMetadataKey(key) }}:</strong> {{ formatMetadataValue(value) }}
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>

          <!-- Media Gallery -->
          <v-card-text v-if="event.media && event.media.length > 0" class="pt-0 pb-2">
            <div class="d-flex flex-wrap gap-2">
              <v-card
                v-for="media in event.media"
                :key="media.id"
                variant="outlined"
                class="media-item"
                style="max-width: 200px;"
              >
                <v-img
                  v-if="media.type === 'image'"
                  :src="media.url"
                  :alt="media.filename || 'Resim'"
                  cover
                  height="120"
                  @click="openMediaViewer(media)"
                  style="cursor: pointer;"
                />
                <v-card-text v-else class="text-center pa-4">
                  <v-icon :icon="media.type === 'video' ? 'mdi-video' : 'mdi-file-document'" size="large" />
                  <div class="text-caption mt-2">{{ media.filename || 'Dosya' }}</div>
                </v-card-text>
                <v-card-actions v-if="media.description" class="pa-2">
                  <div class="text-caption text-truncate" style="max-width: 180px;">
                    {{ media.description }}
                  </div>
                </v-card-actions>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-timeline-item>
    </v-timeline>

    <!-- Media Viewer Dialog -->
    <v-dialog v-model="showMediaViewer" max-width="900">
      <v-card v-if="selectedMedia">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ selectedMedia.filename || 'Medya' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="showMediaViewer = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-img
            v-if="selectedMedia.type === 'image'"
            :src="selectedMedia.url"
            :alt="selectedMedia.filename"
            max-height="600"
            contain
          />
          <div v-else class="text-center pa-8">
            <v-icon size="64" color="grey">{{ selectedMedia.type === 'video' ? 'mdi-video' : 'mdi-file-document' }}</v-icon>
            <div class="mt-4">{{ selectedMedia.filename || 'Dosya' }}</div>
            <v-btn
              class="mt-4"
              color="primary"
              :href="selectedMedia.url"
              target="_blank"
              prepend-icon="mdi-download"
            >
              İndir
            </v-btn>
          </div>
        </v-card-text>
        <v-card-text v-if="selectedMedia.description" class="pt-2">
          <div class="text-body-2">{{ selectedMedia.description }}</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { http } from '../services/api.service';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  media?: Array<{
    id: string;
    type: 'image' | 'document' | 'video';
    url: string;
    filename?: string;
    description?: string;
  }>;
  metadata?: Record<string, any>;
}

interface MediaItem {
  id: string;
  type: 'image' | 'document' | 'video';
  url: string;
  filename?: string;
  description?: string;
}

const props = defineProps<{
  vehicleId: string;
}>();

const events = ref<TimelineEvent[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showMediaViewer = ref(false);
const selectedMedia = ref<MediaItem | null>(null);

const groupedEvents = computed(() => {
  // Events are already sorted chronologically from backend
  return events.value;
});

const loadTimeline = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await http.get(`/rentacar/vehicles/${props.vehicleId}/timeline`);
    events.value = response.data.data || [];
  } catch (err: any) {
    console.error('Failed to load timeline:', err);
    error.value = err.response?.data?.message || 'Timeline yüklenirken hata oluştu';
  } finally {
    loading.value = false;
  }
};

const getEventColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    rental_start: 'primary',
    rental_end: 'info',
    checkout: 'success',
    checkin: 'warning',
    damage: 'error',
    maintenance: 'orange',
    penalty: 'red-darken-2',
    revenue: 'green-darken-2',
  };
  return colorMap[type] || 'grey';
};

const getEventIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    rental_start: 'mdi-car-key',
    rental_end: 'mdi-car-key-variant',
    checkout: 'mdi-arrow-right-circle',
    checkin: 'mdi-arrow-left-circle',
    damage: 'mdi-alert-circle',
    maintenance: 'mdi-wrench',
    penalty: 'mdi-alert',
    revenue: 'mdi-cash-multiple',
  };
  return iconMap[type] || 'mdi-circle';
};

const getEventTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    rental_start: 'Kiralama Başlangıcı',
    rental_end: 'Kiralama Bitişi',
    checkout: 'Araç Teslimi',
    checkin: 'Araç Geri Alımı',
    damage: 'Hasar',
    maintenance: 'Bakım',
    penalty: 'Ceza',
    revenue: 'Gelir',
  };
  return labelMap[type] || type;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMetadataKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    reservationId: 'Rezervasyon ID',
    reference: 'Referans',
    customerName: 'Müşteri',
    customerEmail: 'E-posta',
    pickupLocation: 'Alış Lokasyonu',
    dropoffLocation: 'Dönüş Lokasyonu',
    amount: 'Tutar',
    currencyCode: 'Para Birimi',
    severity: 'Şiddet',
    status: 'Durum',
    repairCost: 'Onarım Maliyeti',
    type: 'Tip',
    cost: 'Maliyet',
    serviceProvider: 'Servis Sağlayıcı',
    fineNumber: 'Ceza Numarası',
    location: 'Konum',
  };
  return keyMap[key] || key;
};

const formatMetadataValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getDisplayableMetadata = (metadata: Record<string, any>): Record<string, any> => {
  // Filter out internal IDs and only show user-friendly fields
  const excluded = ['damageId', 'maintenanceId', 'penaltyId'];
  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!excluded.includes(key) && value !== null && value !== undefined) {
      filtered[key] = value;
    }
  }
  return filtered;
};

const openMediaViewer = (media: MediaItem) => {
  selectedMedia.value = media;
  showMediaViewer.value = true;
};

onMounted(() => {
  loadTimeline();
});
</script>

<style scoped>
.vehicle-timeline {
  width: 100%;
}

.media-item {
  transition: transform 0.2s;
}

.media-item:hover {
  transform: scale(1.05);
}
</style>

