<template>
  <div>
    <v-alert type="warning" variant="tonal" class="mb-4" v-if="!isTourTenant">
      Bu modül yalnızca tur operatörü tenantlar için aktiftir.
    </v-alert>

    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <div v-else-if="tour" class="tour-detail">
      <!-- Header Section with Back Button -->
      <div class="mb-4">
        <v-btn
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="$router.push('/app/tours')"
          class="mb-2"
        >
          Turlar Listesine Dön
        </v-btn>
      </div>

      <!-- Hero Section with Primary Image or Video -->
      <v-card class="mb-6" elevation="4">
        <div v-if="primaryImage" class="hero-image-container">
          <img
            :src="primaryImage.url"
            :alt="primaryImage.alt || tour.title"
            class="hero-image"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <div class="hero-overlay">
            <h1 class="text-h3 font-weight-bold text-white mb-2">{{ getTourTitle() }}</h1>
            <div class="d-flex flex-wrap gap-2">
              <v-chip color="primary" variant="flat" prepend-icon="mdi-map-marker">
                {{ getDestinationName() }}
              </v-chip>
              <v-chip color="success" variant="flat" prepend-icon="mdi-clock-outline" v-if="tour.duration">
                {{ tour.duration }} {{ getDurationUnitText() }}
              </v-chip>
              <v-chip color="info" variant="flat" prepend-icon="mdi-account-group" v-if="tour.maxCapacity">
                {{ tour.maxCapacity === 0 ? 'Sınırsız' : `Max ${tour.maxCapacity} Kişi` }}
              </v-chip>
            </div>
          </div>
        </div>
        <div v-else-if="tour.video" class="hero-video-container">
          <iframe
            v-if="isYouTubeOrVimeo(tour.video)"
            :src="getEmbedUrl(tour.video)"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="hero-video"
          ></iframe>
          <video v-else :src="tour.video" controls class="hero-video" />
        </div>
        <div v-else class="hero-placeholder">
          <v-icon icon="mdi-image-off" size="64" color="grey-lighten-1" />
          <p class="text-grey mt-2">Görsel bulunmuyor</p>
        </div>
      </v-card>

      <v-row>
        <!-- Main Content -->
        <v-col cols="12" md="8">
          <!-- Description -->
          <v-card class="mb-4" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-information" class="mr-2" color="primary" />
              Tur Hakkında
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div v-if="getTourDescription()" class="text-body-1" v-html="formatDescription(getTourDescription())"></div>
              <p v-else class="text-grey">Açıklama bulunmuyor.</p>
            </v-card-text>
          </v-card>

          <!-- Included Services -->
          <v-card class="mb-4" elevation="2" v-if="getIncludedServices().length > 0">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-check-circle" class="mr-2" color="success" />
              Tura Dahil Hizmetler
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="(service, index) in getIncludedServices()"
                  :key="index"
                  prepend-icon="mdi-check"
                  :title="service"
                />
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Excluded Services -->
          <v-card class="mb-4" elevation="2" v-if="getExcludedServices().length > 0">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-close-circle" class="mr-2" color="error" />
              Hariç Hizmetler
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="(service, index) in getExcludedServices()"
                  :key="index"
                  prepend-icon="mdi-close"
                  :title="service"
                />
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Tour Info Items -->
          <v-card class="mb-4" elevation="2" v-if="getInfoItems().length > 0">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-information-outline" class="mr-2" color="primary" />
              Tur Bilgileri
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="(item, index) in getInfoItems()"
                  :key="index"
                  prepend-icon="mdi-circle-small"
                  :title="item"
                />
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Gallery -->
          <v-card class="mb-4" elevation="2" v-if="otherImages.length > 0">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-image-multiple" class="mr-2" color="primary" />
              Tur Görselleri
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col
                  v-for="(image, index) in otherImages"
                  :key="index"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-card
                    variant="outlined"
                    class="image-card"
                    @click="openImageDialog(image.url)"
                  >
                    <v-img
                      :src="image.url"
                      :alt="image.alt || 'Tur görseli'"
                      height="200"
                      cover
                      class="cursor-pointer"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Video Section -->
          <v-card class="mb-4" elevation="2" v-if="tour.video && primaryImage">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-video" class="mr-2" color="primary" />
              Tur Videosu
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="video-container">
                <iframe
                  v-if="isYouTubeOrVimeo(tour.video)"
                  :src="getEmbedUrl(tour.video)"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="video-iframe"
                ></iframe>
                <video v-else :src="tour.video" controls class="video-player" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Sidebar -->
        <v-col cols="12" md="4">
          <!-- Pricing Card -->
          <v-card class="mb-4" elevation="2" v-if="tour.pricing && tour.pricing.length > 0">
            <v-card-title class="d-flex align-center bg-primary text-white">
              <v-icon icon="mdi-cash" class="mr-2" />
              Fiyatlandırma
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-0">
              <v-list>
                <v-list-item
                  v-for="(price, index) in tour.pricing"
                  :key="index"
                  class="px-4 py-3"
                >
                  <template #prepend>
                    <v-icon
                      :icon="getPricingIcon(price.type)"
                      :color="getPricingColor(price.type)"
                      class="mr-3"
                    />
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ getPricingTypeName(price.type) }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="price.description">
                    {{ price.description }}
                  </v-list-item-subtitle>
                  <template #append>
                    <span class="text-h6 font-weight-bold text-primary">
                      {{ Number(price.price).toFixed(2) }} {{ price.currencyCode }}
                    </span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Tour Details Card -->
          <v-card class="mb-4" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-information" class="mr-2" color="primary" />
              Tur Detayları
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list>
                <v-list-item v-if="tour.duration">
                  <template #prepend>
                    <v-icon icon="mdi-clock-outline" class="mr-3" />
                  </template>
                  <v-list-item-title>Süre</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ tour.duration }} {{ getDurationUnitText() }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="tour.maxCapacity !== undefined">
                  <template #prepend>
                    <v-icon icon="mdi-account-group" class="mr-3" />
                  </template>
                  <v-list-item-title>Kapasite</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ tour.maxCapacity === 0 ? 'Sınırsız' : `Maksimum ${tour.maxCapacity} kişi` }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="tour.days && tour.days.length > 0">
                  <template #prepend>
                    <v-icon icon="mdi-calendar" class="mr-3" />
                  </template>
                  <v-list-item-title>Tur Günleri</v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                      <v-chip
                        v-for="day in tour.days"
                        :key="day"
                        size="small"
                        variant="tonal"
                        color="primary"
                      >
                        {{ getDayName(day) }}
                      </v-chip>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="tour.timeSlots && tour.timeSlots.length > 0">
                  <template #prepend>
                    <v-icon icon="mdi-clock-time-four" class="mr-3" />
                  </template>
                  <v-list-item-title>Saat Dilimleri</v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="mt-1">
                      <div
                        v-for="(slot, index) in tour.timeSlots"
                        :key="index"
                        class="mb-1"
                      >
                        {{ slot.startTime }} - {{ slot.endTime }}
                      </div>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="tour.languages && tour.languages.length > 0">
                  <template #prepend>
                    <v-icon icon="mdi-translate" class="mr-3" />
                  </template>
                  <v-list-item-title>Diller</v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                      <v-chip
                        v-for="lang in tour.languages"
                        :key="lang.id"
                        size="small"
                        variant="tonal"
                        color="primary"
                      >
                        {{ lang.name }}
                      </v-chip>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Features Card -->
          <v-card class="mb-4" elevation="2" v-if="tour.features && tour.features.length > 0">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-star" class="mr-2" color="primary" />
              Tur Özellikleri
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="feature in tour.features"
                  :key="feature.id"
                  :prepend-icon="feature.icon"
                  variant="outlined"
                  size="small"
                >
                  {{ getFeatureName(feature) }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Tags -->
          <v-card class="mb-4" elevation="2" v-if="tour.tags && tour.tags.length > 0">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-tag" class="mr-2" color="primary" />
              Etiketler
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="tag in tour.tags"
                  :key="tag"
                  size="small"
                  variant="tonal"
                  color="secondary"
                >
                  {{ tag }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Actions -->
          <v-card elevation="2">
            <v-card-actions class="flex-column">
              <v-btn
                color="primary"
                size="large"
                block
                prepend-icon="mdi-pencil"
                @click="editTour"
                class="mb-2"
              >
                Turu Düzenle
              </v-btn>
              <v-btn
                color="error"
                size="large"
                block
                prepend-icon="mdi-delete"
                @click="deleteTour"
                variant="outlined"
              >
                Turu Sil
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-alert v-else-if="!loading" type="error" variant="tonal">
      Tur bulunamadı veya yüklenirken bir hata oluştu.
    </v-alert>

    <!-- Image Dialog -->
    <v-dialog v-model="showImageDialog" max-width="1200">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Tur Görseli</span>
          <v-btn icon="mdi-close" variant="text" @click="showImageDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <img :src="selectedImageUrl" alt="Tur görseli" style="width: 100%; height: auto;" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';

interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface DestinationDto {
  id: string;
  name: string;
  country: string;
  city: string;
}

interface TourFeatureTranslationDto {
  id: string;
  languageId: string;
  languageCode: string;
  name: string;
}

interface TourFeatureDto {
  id: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  translations: TourFeatureTranslationDto[];
}

interface TourTranslationDto {
  id: string;
  languageId: string;
  title: string;
  slug?: string;
  description?: string;
  includedServices?: string;
  excludedServices?: string;
}

interface TourInfoItemDto {
  id: string;
  languageId: string;
  text: string;
  order: number;
}

interface TourImageDto {
  id: string;
  url: string;
  alt?: string;
  order: number;
  isPrimary: boolean;
}

interface TourTimeSlotDto {
  id: string;
  startTime: string;
  endTime: string;
  order: number;
}

interface TourPricingDto {
  id: string;
  type: string;
  price: number;
  currencyCode: string;
  description?: string;
}

interface TourDto {
  id: string;
  title: string;
  slug: string;
  destinationId: string;
  destination?: DestinationDto;
  duration?: number;
  durationUnit?: 'minute' | 'hour' | 'day';
  maxCapacity?: number;
  days?: string[];
  video?: string;
  currencyCode: string;
  tags?: string[];
  languages?: LanguageDto[];
  defaultLanguage?: LanguageDto | null;
  features?: TourFeatureDto[];
  translations?: TourTranslationDto[];
  infoItems?: TourInfoItemDto[];
  images?: TourImageDto[];
  timeSlots?: TourTimeSlotDto[];
  pricing?: TourPricingDto[];
}

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const isTourTenant = computed(() => auth.tenant?.category === 'tour');

const tour = ref<TourDto | null>(null);
const loading = ref(false);
const availableLanguages = ref<LanguageDto[]>([]);
const tourFeatures = ref<TourFeatureDto[]>([]);
const showImageDialog = ref(false);
const selectedImageUrl = ref('');

const primaryImage = computed(() => {
  if (!tour.value?.images || tour.value.images.length === 0) {
    console.log('[TourDetailView] No images found for tour');
    return null;
  }
  const primary = tour.value.images.find(img => img.isPrimary) || tour.value.images[0];
  console.log('[TourDetailView] Primary image:', primary);
  return primary;
});

const otherImages = computed(() => {
  if (!tour.value?.images || tour.value.images.length === 0) return [];
  const primary = primaryImage.value;
  if (!primary) return tour.value.images;
  return tour.value.images.filter(img => img.id !== primary.id);
});

const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

const loadTourFeatures = async () => {
  try {
    const { data } = await http.get<TourFeatureDto[]>('/tour-features');
    tourFeatures.value = data;
  } catch (error) {
    console.error('Failed to load tour features:', error);
  }
};

const loadTour = async () => {
  const tourId = route.params.id as string;
  if (!tourId) {
    router.push('/app/tours');
    return;
  }

  loading.value = true;
  try {
    const { data } = await http.get<TourDto>(`/tours/${tourId}`);
    console.log('[TourDetailView] Loaded tour data:', data);
    console.log('[TourDetailView] Tour images:', data.images);
    tour.value = data;
  } catch (error) {
    console.error('Failed to load tour:', error);
    alert('Tur yüklenirken bir hata oluştu.');
    router.push('/app/tours');
  } finally {
    loading.value = false;
  }
};

const getDefaultLanguageId = (): string | undefined => {
  if (!tour.value) return undefined;
  return tour.value.defaultLanguage?.id || availableLanguages.value.find(l => l.isDefault)?.id || availableLanguages.value[0]?.id;
};

const getTourTitle = (): string => {
  if (!tour.value) return '';
  const defaultLangId = getDefaultLanguageId();
  if (defaultLangId && tour.value.translations) {
    const translation = tour.value.translations.find(t => t.languageId === defaultLangId);
    if (translation?.title) return translation.title;
  }
  return tour.value.title;
};

const getTourDescription = (): string => {
  if (!tour.value) return '';
  const defaultLangId = getDefaultLanguageId();
  if (defaultLangId && tour.value.translations) {
    const translation = tour.value.translations.find(t => t.languageId === defaultLangId);
    if (translation?.description) return translation.description;
  }
  return '';
};

const getIncludedServices = (): string[] => {
  if (!tour.value) return [];
  const defaultLangId = getDefaultLanguageId();
  if (defaultLangId && tour.value.translations) {
    const translation = tour.value.translations.find(t => t.languageId === defaultLangId);
    if (translation?.includedServices) {
      try {
        return typeof translation.includedServices === 'string'
          ? JSON.parse(translation.includedServices)
          : translation.includedServices;
      } catch {
        return [];
      }
    }
  }
  return [];
};

const getExcludedServices = (): string[] => {
  if (!tour.value) return [];
  const defaultLangId = getDefaultLanguageId();
  if (defaultLangId && tour.value.translations) {
    const translation = tour.value.translations.find(t => t.languageId === defaultLangId);
    if (translation?.excludedServices) {
      try {
        return typeof translation.excludedServices === 'string'
          ? JSON.parse(translation.excludedServices)
          : translation.excludedServices;
      } catch {
        return [];
      }
    }
  }
  return [];
};

const getInfoItems = (): string[] => {
  if (!tour.value?.infoItems) return [];
  const defaultLangId = getDefaultLanguageId();
  if (!defaultLangId) return [];
  return tour.value.infoItems
    .filter(item => item.languageId === defaultLangId)
    .sort((a, b) => a.order - b.order)
    .map(item => item.text);
};

const getDestinationName = (): string => {
  if (!tour.value) return '';
  if (tour.value.destination) {
    return `${tour.value.destination.name} - ${tour.value.destination.city}, ${tour.value.destination.country}`;
  }
  return 'Destinasyon bilgisi yok';
};

const getDurationUnitText = (): string => {
  if (!tour.value?.durationUnit) return '';
  const units: Record<string, string> = {
    minute: 'Dakika',
    hour: 'Saat',
    day: 'Gün',
  };
  return units[tour.value.durationUnit] || '';
};

const getDayName = (day: string): string => {
  const days: Record<string, string> = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar',
  };
  return days[day] || day;
};

const getPricingTypeName = (type: string): string => {
  const names: Record<string, string> = {
    adult: 'Yetişkin',
    child: 'Çocuk',
    infant: 'Bebek',
    extra_motor: 'Ekstra Motor',
    one_plus_one: '1+1 Tur',
  };
  return names[type] || type;
};

const getPricingIcon = (type: string): string => {
  const icons: Record<string, string> = {
    adult: 'mdi-account',
    child: 'mdi-account-child',
    infant: 'mdi-baby',
    extra_motor: 'mdi-motorbike',
    one_plus_one: 'mdi-account-multiple',
  };
  return icons[type] || 'mdi-cash';
};

const getPricingColor = (type: string): string => {
  const colors: Record<string, string> = {
    adult: 'primary',
    child: 'info',
    infant: 'warning',
    extra_motor: 'secondary',
    one_plus_one: 'success',
  };
  return colors[type] || 'primary';
};

const getFeatureName = (feature: TourFeatureDto): string => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang) return feature.icon;
  const translation = feature.translations.find(t => t.languageId === defaultLang.id);
  return translation?.name || feature.icon;
};

const formatDescription = (text: string): string => {
  return text.replace(/\n/g, '<br>');
};

const isYouTubeOrVimeo = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
};

const getEmbedUrl = (url: string): string => {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
};

const handleImageError = (event: Event) => {
  console.error('[TourDetailView] Image load error:', event);
  const img = event.target as HTMLImageElement;
  console.error('[TourDetailView] Failed to load image URL:', img.src);
  // Set a placeholder image on error
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23f5f5f5" width="800" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="Roboto" font-size="20"%3EGörsel yüklenemedi%3C/text%3E%3C/svg%3E';
};

const handleImageLoad = () => {
  console.log('[TourDetailView] Image loaded successfully');
};

const openImageDialog = (url: string) => {
  selectedImageUrl.value = url;
  showImageDialog.value = true;
};

const editTour = () => {
  if (tour.value) {
    router.push({ path: '/app/tours', query: { edit: tour.value.id } });
  }
};

const deleteTour = async () => {
  if (!tour.value) return;
  if (!confirm('Bu turu silmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await http.delete(`/tours/${tour.value.id}`);
    router.push('/app/tours');
  } catch (error: any) {
    console.error('Failed to delete tour:', error);
    alert(error.response?.data?.message || 'Tur silinemedi');
  }
};

onMounted(async () => {
  if (isTourTenant.value) {
    await Promise.all([loadLanguages(), loadTourFeatures(), loadTour()]);
  }
});
</script>

<style scoped>
.tour-detail {
  max-width: 1400px;
  margin: 0 auto;
}

.hero-image-container {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 40px;
  color: white;
}

.hero-video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}

.hero-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.hero-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f5f5f5;
}

.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: 8px;
}

.video-iframe,
.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.image-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.cursor-pointer {
  cursor: pointer;
}
</style>

