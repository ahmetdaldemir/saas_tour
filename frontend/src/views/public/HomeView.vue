<template>
  <div class="rentacar-home">
    <!-- HERO SECTION - Profesyonel Arama Formu -->
    <section class="hero-search-section">
      <div class="hero-background-image">
        <div class="hero-overlay-dark">
          <v-container>
            <div class="hero-content-wrapper">
              <!-- Ana Başlık -->
              <h1 class="hero-main-title">Ayrıcalıklı bir araç kiralama deneyimi</h1>

              <!-- Profesyonel Arama Formu -->
              <v-card class="professional-search-card" elevation="12">
                <!-- Tab Seçimi -->
                <div class="service-tabs">
                  <button
                    :class="['tab-button', { active: searchForm.serviceType === 'rentacar' }]"
                    @click="searchForm.serviceType = 'rentacar'"
                  >
                    <span class="tab-icon">🚗</span>
                    O Araç Kirala
                  </button>
                  <button
                    :class="['tab-button', { active: searchForm.serviceType === 'transfer' }]"
                    @click="searchForm.serviceType = 'transfer'"
                  >
                    <span class="tab-icon">🚐</span>
                    Transfer
                  </button>
                </div>

                <v-card-text class="search-form-content pa-6">
                  <!-- Teslim Alma Bölümü -->
                  <div class="form-section">
                    <div class="section-header">
                      <div class="section-number">1</div>
                      <span class="section-label">Alis Lokasyonu</span>
                    </div>
                    <div class="form-row">
                      <v-autocomplete
                        v-model="searchForm.pickupLocation"
                        :items="locationOptions"
                        item-title="label"
                        item-value="value"
                        placeholder="Alış Ofisi Seçiniz"
                        variant="solo"
                        density="comfortable"
                        hide-details
                        class="location-input"
                      >
                        <template #prepend-inner>
                          <v-icon icon="mdi-map-marker-radius" size="20" />
                        </template>
                      </v-autocomplete>
                      <div class="date-time-group">
                        <div class="date-box">
                          <span class="date-label">Alış Tarihi</span>
                          <v-text-field
                            v-model="searchForm.pickupDate"
                            type="date"
                            variant="solo"
                            density="compact"
                            hide-details
                            :min="minDate"
                            class="date-input"
                            @update:model-value="updatePickupDateTime"
                          />
                        </div>
                        <div class="time-box">
                          <span class="time-label">Saat</span>
                          <v-text-field
                            v-model="searchForm.pickupTime"
                            type="time"
                            variant="solo"
                            density="compact"
                            hide-details
                            class="time-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- İade Bölümü -->
                  <div class="form-section">
                    <div class="section-header">
                      <div class="section-number">2</div>
                      <span class="section-label">Donus Lokasyonu</span>
                    </div>
                    <div class="form-row">
                      <v-autocomplete
                        v-model="searchForm.returnLocation"
                        :items="locationOptions"
                        item-title="label"
                        item-value="value"
                        placeholder="İade Ofisi"
                        variant="solo"
                        density="comfortable"
                        hide-details
                        class="location-input"
                      >
                        <template #prepend-inner>
                          <v-icon icon="mdi-map-marker-check" size="20" />
                        </template>
                      </v-autocomplete>
                      <div class="date-time-group">
                        <div class="date-box">
                          <span class="date-label">İade Tarihi</span>
                          <v-text-field
                            v-model="searchForm.returnDate"
                            type="date"
                            variant="solo"
                            density="compact"
                            hide-details
                            :min="searchForm.pickupDate || minDate"
                            class="date-input"
                          />
                        </div>
                        <div class="time-box">
                          <span class="time-label">Saat</span>
                          <v-text-field
                            v-model="searchForm.returnTime"
                            type="time"
                            variant="solo"
                            density="compact"
                            hide-details
                            class="time-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- İndirim Kodu -->
                  <div class="discount-section">
                    <v-text-field
                      v-model="searchForm.discountCode"
                      placeholder="AVIS İNDİRİM NUMARASI >"
                      variant="solo"
                      density="compact"
                      hide-details
                      class="discount-input"
                    />
                  </div>

                  <!-- Arama Butonu -->
                  <div class="search-button-container">
                    <v-btn
                      color="primary"
                      size="x-large"
                      class="search-action-btn"
                      @click="handleSearch"
                      :loading="searching"
                      :disabled="!canSearch"
                    >
                      {{ getSearchButtonText() }}
                      <v-icon icon="mdi-chevron-right" end />
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-container>
        </div>
      </div>
    </section>

    <!-- CONTENT SECTION - Filtreleme ve Araç Listesi -->
    <section v-if="showResults" class="results-section py-8">
      <v-container>
        <v-row>
          <!-- Sidebar Filtreler -->
          <v-col cols="12" md="3">
            <v-card elevation="2" rounded="lg" class="filter-card">
              <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-filter" class="mr-2" />
                Filtreler
              </v-card-title>
              <v-divider />
              <v-card-text>
                <!-- Kategori Filtresi -->
                <div class="mb-6">
                  <h3 class="text-subtitle-2 font-weight-bold mb-3">Kategori</h3>
                  <v-checkbox
                    v-for="category in categories"
                    :key="category.id"
                    v-model="filters.categories"
                    :value="category.id"
                    :label="category.name"
                    density="compact"
                    hide-details
                    class="mb-1"
                  />
                </div>

                <!-- Marka Filtresi -->
                <div class="mb-6">
                  <h3 class="text-subtitle-2 font-weight-bold mb-3">Marka</h3>
                  <v-select
                    v-model="filters.brand"
                    :items="brandOptions"
                    item-title="label"
                    item-value="value"
                    label="Marka Seçiniz"
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details
                  />
                </div>

                <!-- Vites Tipi -->
                <div class="mb-6">
                  <h3 class="text-subtitle-2 font-weight-bold mb-3">Vites Tipi</h3>
                  <v-radio-group v-model="filters.transmission" hide-details>
                    <v-radio label="Tümü" value="" />
                    <v-radio label="Otomatik" value="automatic" />
                    <v-radio label="Manuel" value="manual" />
                  </v-radio-group>
                </div>

                <!-- Yakıt Tipi -->
                <div class="mb-6">
                  <h3 class="text-subtitle-2 font-weight-bold mb-3">Yakıt Tipi</h3>
                  <v-checkbox
                    v-for="fuel in fuelTypes"
                    :key="fuel.value"
                    v-model="filters.fuelTypes"
                    :value="fuel.value"
                    :label="fuel.label"
                    density="compact"
                    hide-details
                    class="mb-1"
                  />
                </div>

                <!-- Fiyat Aralığı -->
                <div class="mb-6">
                  <h3 class="text-subtitle-2 font-weight-bold mb-3">Fiyat Aralığı</h3>
                  <v-range-slider
                    v-model="filters.priceRange"
                    :min="0"
                    :max="1000"
                    :step="50"
                    thumb-label="always"
                    hide-details
                  >
                    <template #thumb-label="{ modelValue }">
                      {{ formatPrice(modelValue) }}
                    </template>
                  </v-range-slider>
                </div>

                <!-- Reset Button -->
                <v-btn
                  block
                  variant="outlined"
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="resetFilters"
                >
                  Filtreleri Temizle
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Araç Listesi -->
          <v-col cols="12" md="9">
            <!-- Sonuç Başlığı -->
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h2 class="text-h5 font-weight-bold">
                  {{ filteredVehicles.length }} Araç Bulundu
                </h2>
                <p class="text-body-2 text-medium-emphasis">
                  {{ formatSearchSummary() }}
                </p>
              </div>
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                item-title="label"
                item-value="value"
                label="Sırala"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-sort"
                style="max-width: 200px;"
                hide-details
              />
            </div>

            <!-- Araç Kartları -->
            <div v-if="loadingVehicles" class="text-center py-12">
              <v-progress-circular indeterminate color="primary" size="64" />
              <p class="mt-4 text-body-1">Araçlar yükleniyor...</p>
            </div>

            <div v-else-if="filteredVehicles.length === 0" class="text-center py-12">
              <v-icon icon="mdi-car-off" size="64" color="grey-lighten-1" />
              <p class="mt-4 text-h6">Araç bulunamadı</p>
              <p class="text-body-2 text-medium-emphasis">
                Filtreleri değiştirerek tekrar deneyin
              </p>
            </div>

            <div v-else class="vehicle-grid">
              <v-card
                v-for="vehicle in sortedVehicles"
                :key="vehicle.id"
                elevation="2"
                rounded="lg"
                class="vehicle-card"
              >
                <v-row no-gutters>
                  <!-- Araç Görseli -->
                  <v-col cols="12" md="4">
                    <div class="vehicle-image">
                      <v-icon icon="mdi-car-sports" size="80" color="grey-lighten-1" />
                      <div class="vehicle-badge">
                        <v-chip size="small" color="primary" variant="flat">
                          {{ vehicle.categoryName }}
                        </v-chip>
                      </div>
                    </div>
                  </v-col>

                  <!-- Araç Bilgileri -->
                  <v-col cols="12" md="5">
                    <v-card-text>
                      <h3 class="text-h6 font-weight-bold mb-2">
                        {{ vehicle.brandName }} {{ vehicle.modelName }}
                      </h3>
                      <div class="vehicle-features mb-3">
                        <v-chip size="small" variant="tonal" class="mr-2 mb-1">
                          <v-icon start icon="mdi-account" size="14" />
                          {{ vehicle.seats }} Kişi
                        </v-chip>
                        <v-chip size="small" variant="tonal" class="mr-2 mb-1">
                          <v-icon start icon="mdi-luggage" size="14" />
                          {{ vehicle.luggage }} Bagaj
                        </v-chip>
                        <v-chip size="small" variant="tonal" class="mr-2 mb-1">
                          <v-icon start icon="mdi-cog" size="14" />
                          {{ vehicle.transmission === 'automatic' ? 'Otomatik' : 'Manuel' }}
                        </v-chip>
                        <v-chip size="small" variant="tonal" class="mb-1">
                          <v-icon start icon="mdi-fuel" size="14" />
                          {{ getFuelTypeLabel(vehicle.fuelType) }}
                        </v-chip>
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        <div><v-icon icon="mdi-calendar" size="14" class="mr-1" /> Yıl: {{ vehicle.year }}</div>
                        <div v-if="vehicle.plate"><v-icon icon="mdi-card-text" size="14" class="mr-1" /> Plaka: {{ vehicle.plate }}</div>
                      </div>
                    </v-card-text>
                  </v-col>

                  <!-- Fiyat ve Buton -->
                  <v-col cols="12" md="3">
                    <v-card-text class="d-flex flex-column justify-space-between h-100">
                      <div>
                        <div class="text-h5 font-weight-bold text-primary mb-1">
                          {{ formatPrice(vehicle.totalPrice) }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ calculateDays() }} gün için
                        </div>
                        <div class="text-caption text-medium-emphasis mb-4">
                          Günlük: {{ formatPrice(vehicle.dailyPrice) }}
                        </div>
                      </div>
                      <v-btn
                        color="primary"
                        block
                        size="large"
                        prepend-icon="mdi-check-circle"
                        @click="selectVehicle(vehicle)"
                      >
                        Seç
                      </v-btn>
                    </v-card-text>
                  </v-col>
                </v-row>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- TANITIM BLOKLARI -->
    <section v-if="!showResults" class="features-section py-16">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold mb-4">Neden Bizi Seçmelisiniz?</h2>
          <p class="text-h6 text-medium-emphasis">Profesyonel araç kiralama çözümleri</p>
        </div>

        <v-row>
          <v-col
            v-for="feature in features"
            :key="feature.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card elevation="2" rounded="lg" class="feature-card h-100 text-center">
              <v-card-text class="pa-6">
                <v-avatar
                  :color="feature.color"
                  variant="tonal"
                  size="64"
                  class="mb-4"
                >
                  <v-icon :icon="feature.icon" size="32" />
                </v-avatar>
                <h3 class="text-h6 font-weight-bold mb-3">{{ feature.title }}</h3>
                <p class="text-body-2 text-medium-emphasis">{{ feature.description }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- REZERVASYON MODAL -->
    <v-dialog v-model="showReservationDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">Rezervasyon Detayları</span>
          <v-btn icon="mdi-close" variant="text" @click="showReservationDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" class="mb-6">
            Rezervasyon işlemini tamamlamak için lütfen giriş yapınız.
          </v-alert>
          <v-btn
            color="primary"
            block
            size="large"
            prepend-icon="mdi-login"
            to="/login"
          >
            Giriş Yap
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { http } from '../../modules/http';

// Interfaces
interface LocationOption {
  label: string;
  value: string;
}

interface Vehicle {
  id: string;
  name: string;
  brandName?: string;
  modelName?: string;
  categoryName?: string;
  categoryId?: string;
  brandId?: string;
  year?: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  luggage?: number;
  plate?: string;
  dailyPrice: number;
  totalPrice: number;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

// Form State
const searchForm = reactive({
  serviceType: 'rentacar' as 'rentacar' | 'transfer',
  pickupLocation: null as string | null,
  returnLocation: null as string | null,
  pickupDate: '',
  returnDate: '',
  pickupTime: '09:00',
  returnTime: '09:00',
  discountCode: '',
});

const filters = reactive({
  categories: [] as string[],
  brand: null as string | null,
  transmission: '',
  fuelTypes: [] as string[],
  priceRange: [0, 1000] as number[],
});

// UI State
const searching = ref(false);
const showResults = ref(false);
const loadingVehicles = ref(false);
const showReservationDialog = ref(false);
const sortBy = ref('price-asc');
const selectedVehicle = ref<Vehicle | null>(null);

// Data
const locations = ref<LocationOption[]>([]);
const vehicles = ref<Vehicle[]>([]);
const categories = ref<Category[]>([]);
const brands = ref<Brand[]>([]);

// Options
const fuelTypes = [
  { label: 'Benzin', value: 'gasoline' },
  { label: 'Dizel', value: 'diesel' },
  { label: 'Hibrit', value: 'hybrid' },
  { label: 'Elektrik', value: 'electric' },
];

const sortOptions = [
  { label: 'Fiyat (Düşükten Yükseğe)', value: 'price-asc' },
  { label: 'Fiyat (Yüksekten Düşüğe)', value: 'price-desc' },
  { label: 'Marka (A-Z)', value: 'brand-asc' },
];

const features = [
  {
    id: 1,
    icon: 'mdi-shield-check',
    title: 'Güvenli ve Sigortalı',
    description: 'Tüm araçlarımız tam kasko sigortalı ve güvenli',
    color: 'success',
  },
  {
    id: 2,
    icon: 'mdi-clock-fast',
    title: 'Hızlı İşlem',
    description: 'Rezervasyon işleminizi dakikalar içinde tamamlayın',
    color: 'primary',
  },
  {
    id: 3,
    icon: 'mdi-currency-usd',
    title: 'En İyi Fiyat Garantisi',
    description: 'En uygun fiyatlarla en kaliteli hizmet',
    color: 'warning',
  },
  {
    id: 4,
    icon: 'mdi-headset',
    title: '7/24 Destek',
    description: 'Her zaman yanınızdayız, destek ekibimiz 7/24 hazır',
    color: 'info',
  },
  {
    id: 5,
    icon: 'mdi-map-marker-multiple',
    title: 'Geniş Lokasyon Ağı',
    description: 'Türkiye genelinde birçok lokasyonda hizmet',
    color: 'purple',
  },
  {
    id: 6,
    icon: 'mdi-car-multiple',
    title: 'Geniş Araç Filosu',
    description: 'Ekonomi sınıfından lüks sınıfına kadar geniş seçenek',
    color: 'teal',
  },
];

// Computed
const minDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const locationOptions = computed(() => {
  return locations.value;
});

const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    label: cat.name,
    value: cat.id,
  }));
});

const brandOptions = computed(() => {
  return brands.value.map(brand => ({
    label: brand.name,
    value: brand.id,
  }));
});

const filteredVehicles = computed(() => {
  let filtered = vehicles.value;

  // Kategori filtresi
  if (filters.categories.length > 0) {
    filtered = filtered.filter(v => v.categoryId && filters.categories.includes(v.categoryId));
  }

  // Marka filtresi
  if (filters.brand) {
    filtered = filtered.filter(v => v.brandId === filters.brand);
  }

  // Vites tipi filtresi
  if (filters.transmission) {
    filtered = filtered.filter(v => v.transmission === filters.transmission);
  }

  // Yakıt tipi filtresi
  if (filters.fuelTypes.length > 0) {
    filtered = filtered.filter(v => v.fuelType && filters.fuelTypes.includes(v.fuelType));
  }

  // Fiyat aralığı filtresi
  filtered = filtered.filter(v => {
    const price = v.totalPrice;
    return price >= filters.priceRange[0] && price <= filters.priceRange[1];
  });

  return filtered;
});

const sortedVehicles = computed(() => {
  const sorted = [...filteredVehicles.value];

  switch (sortBy.value) {
    case 'price-asc':
      return sorted.sort((a, b) => a.totalPrice - b.totalPrice);
    case 'price-desc':
      return sorted.sort((a, b) => b.totalPrice - a.totalPrice);
    case 'brand-asc':
      return sorted.sort((a, b) => (a.brandName || '').localeCompare(b.brandName || ''));
    default:
      return sorted;
  }
});

// Methods
const loadLocations = async () => {
  try {
    // TODO: Backend API endpoint'e bağlanacak
    // const { data } = await http.get('/rentacar/locations');
    // locations.value = data.map(loc => ({ label: loc.name, value: loc.id }));
    
    // Örnek veri
    locations.value = [
      { label: 'İstanbul Havalimanı', value: '1' },
      { label: 'Antalya Havalimanı', value: '2' },
      { label: 'Ankara Merkez', value: '3' },
      { label: 'İzmir Alsancak', value: '4' },
    ];
  } catch (error) {
    console.error('Failed to load locations:', error);
  }
};

const loadCategories = async () => {
  try {
    const { data } = await http.get('/vehicle-categories');
    const defaultLang = 'tr'; // TODO: Get from language context
    categories.value = data.map((cat: any) => ({
      id: cat.id,
      name: cat.translations?.find((t: any) => t.languageCode === defaultLang)?.name || 'Kategori',
    }));
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
};

const loadBrands = async () => {
  try {
    const { data } = await http.get('/vehicle-brands');
    brands.value = data;
  } catch (error) {
    console.error('Failed to load brands:', error);
  }
};

const loadVehicles = async () => {
  if (!searchForm.pickupLocation || !searchForm.pickupDate || !searchForm.returnDate) {
    return;
  }

  loadingVehicles.value = true;
  try {
    // TODO: Backend API endpoint'e bağlanacak
    // const { data } = await http.get('/rentacar/vehicles', {
    //   params: {
    //     pickupLocationId: searchForm.pickupLocation,
    //     returnLocationId: searchForm.returnLocation || searchForm.pickupLocation,
    //     pickupDate: searchForm.pickupDate,
    //     returnDate: searchForm.returnDate,
    //   },
    // });
    
    // Örnek veri
    vehicles.value = [
      {
        id: '1',
        name: 'Renault Clio',
        brandName: 'Renault',
        modelName: 'Clio',
        categoryName: 'Ekonomi',
        categoryId: '1',
        brandId: '1',
        year: 2023,
        transmission: 'automatic',
        fuelType: 'gasoline',
        seats: 5,
        luggage: 2,
        plate: '34ABC123',
        dailyPrice: 150,
        totalPrice: 450,
      },
      {
        id: '2',
        name: 'Volkswagen Golf',
        brandName: 'Volkswagen',
        modelName: 'Golf',
        categoryName: 'Orta Sınıf',
        categoryId: '2',
        brandId: '2',
        year: 2023,
        transmission: 'automatic',
        fuelType: 'diesel',
        seats: 5,
        luggage: 3,
        plate: '34DEF456',
        dailyPrice: 200,
        totalPrice: 600,
      },
      {
        id: '3',
        name: 'BMW 3 Series',
        brandName: 'BMW',
        modelName: '3 Series',
        categoryName: 'Lüks',
        categoryId: '3',
        brandId: '3',
        year: 2024,
        transmission: 'automatic',
        fuelType: 'gasoline',
        seats: 5,
        luggage: 4,
        plate: '34GHI789',
        dailyPrice: 400,
        totalPrice: 1200,
      },
    ].map(v => ({
      ...v,
      totalPrice: v.dailyPrice * calculateDays(),
    }));
  } catch (error) {
    console.error('Failed to load vehicles:', error);
  } finally {
    loadingVehicles.value = false;
  }
};

const handleSearch = async () => {
  if (!searchForm.pickupLocation || !searchForm.pickupDate || !searchForm.returnDate) {
    alert('Lütfen tüm alanları doldurunuz');
    return;
  }

  if (new Date(searchForm.returnDate) <= new Date(searchForm.pickupDate)) {
    alert('İade tarihi alış tarihinden sonra olmalıdır');
    return;
  }

  searching.value = true;
  await loadVehicles();
  showResults.value = true;
  searching.value = false;
  
  // Scroll to results
  setTimeout(() => {
    document.querySelector('.results-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};

const resetFilters = () => {
  filters.categories = [];
  filters.brand = null;
  filters.transmission = '';
  filters.fuelTypes = [];
  filters.priceRange = [0, 1000];
};

const selectVehicle = (vehicle: Vehicle) => {
  selectedVehicle.value = vehicle;
  showReservationDialog.value = true;
};

const calculateDays = (): number => {
  if (!searchForm.pickupDate || !searchForm.returnDate) return 1;
  const pickup = new Date(searchForm.pickupDate);
  const returnDate = new Date(searchForm.returnDate);
  const diff = returnDate.getTime() - pickup.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatSearchSummary = (): string => {
  const pickupLoc = locations.value.find(l => l.value === searchForm.pickupLocation);
  const returnLoc = locations.value.find(l => l.value === searchForm.returnLocation);
  const days = calculateDays();
  
  let summary = `${pickupLoc?.label || 'Lokasyon'}`;
  if (returnLoc && returnLoc.value !== pickupLoc?.value) {
    summary += ` → ${returnLoc.label}`;
  }
  summary += ` • ${days} gün`;
  return summary;
};

const getFuelTypeLabel = (fuelType?: string): string => {
  const fuel = fuelTypes.find(f => f.value === fuelType);
  return fuel?.label || fuelType || '-';
};

const updatePickupDateTime = () => {
  // Pickup date değiştiğinde return date'i güncelle
  if (searchForm.pickupDate && searchForm.returnDate && searchForm.returnDate < searchForm.pickupDate) {
    searchForm.returnDate = searchForm.pickupDate;
  }
};

const canSearch = computed(() => {
  return !!(searchForm.pickupLocation && searchForm.returnLocation && searchForm.pickupDate && searchForm.returnDate);
});

const getSearchButtonText = (): string => {
  if (!searchForm.pickupDate || !searchForm.returnDate) return 'Araçları Ara >';
  
  const pickup = new Date(searchForm.pickupDate);
  const returnDate = new Date(searchForm.returnDate);
  const diffTime = Math.abs(returnDate.getTime() - pickup.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return `${diffDays} GÜN KİRALA >`;
};

// Chat Widget
const loadChatWidget = () => {
  // Environment variable'lardan tenant bilgilerini al
  // Veya hardcoded değerler kullanabilirsiniz
  const tenantId = import.meta.env.VITE_CHAT_TENANT_ID || '30119880-b233-4896-b612-1463e32617f2';
  const publicKey = import.meta.env.VITE_CHAT_PUBLIC_KEY || 'fd2520259560f0f619f00ae80ee76f6722e4f751f1c45f0e0a58438fe8be0b60';
  
  // Eğer zaten widget script'i yüklenmişse, tekrar yükleme
  if (document.querySelector(`script[data-tenant="${tenantId}"]`)) {
    return;
  }

  // Script tag'ini oluştur
  const script = document.createElement('script');
  script.src = 'https://chat.saastour360.com/widget.js';
  script.setAttribute('data-tenant', tenantId);
  script.setAttribute('data-key', publicKey);
  script.async = true;
  
  // Script'i body'nin sonuna ekle
  document.body.appendChild(script);
};

const removeChatWidget = () => {
  // Component unmount olduğunda widget script'ini kaldır (opsiyonel)
  const widgetScript = document.querySelector('script[data-tenant]');
  if (widgetScript) {
    widgetScript.remove();
  }
};

onMounted(async () => {
  await Promise.all([
    loadLocations(),
    loadCategories(),
    loadBrands(),
  ]);
  
  // Varsayılan tarihleri ayarla
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  searchForm.pickupDate = today.toISOString().split('T')[0];
  searchForm.returnDate = tomorrow.toISOString().split('T')[0];
  
  // Chat widget'ı yükle
  loadChatWidget();
});

onUnmounted(() => {
  // Component unmount olduğunda widget'ı kaldır (isteğe bağlı)
  // removeChatWidget();
});
</script>

<style scoped lang="scss">
.rentacar-home {
  background: #f5f7fa;
}

// Hero Section - Profesyonel Tasarım
.hero-search-section {
  position: relative;
  min-height: 650px;
  overflow: hidden;
}

.hero-background-image {
  position: relative;
  min-height: 650px;
  background-image: url('/images/hero-background.jpg');
  background-blend-mode: overlay;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: #1a237e; /* Fallback color */
}

.hero-overlay-dark {
  position: relative;
  z-index: 2;
  min-height: 650px;
  display: flex;
  align-items: center;
  padding: 60px 0;
}

.hero-content-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-main-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 40px;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
  line-height: 1.2;

  @media (max-width: 960px) {
    font-size: 1.75rem;
    margin-bottom: 30px;
  }
}

.professional-search-card {
  background: #2c2c2c !important;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.service-tabs {
  display: flex;
  background: #1a1a1a;
  border-bottom: 2px solid #333;
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 20px 24px;
  color: #999;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    background: #2c2c2c;
    color: #fff;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: #d32f2f;
    }
  }

  .tab-icon {
    font-size: 1.5rem;
  }
}

.search-form-content {
  background: #2c2c2c;
}

.form-section {
  margin-bottom: 24px;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #d32f2f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.section-label {
  color: #fff;
  font-weight: 600;
  font-size: 0.9375rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: end;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.location-input {
  flex: 1;
  
  :deep(.v-field) {
    background: #1a1a1a !important;
    color: #fff !important;
  }
  
  :deep(.v-field__input) {
    color: #fff !important;
    
    &::placeholder {
      color: #999 !important;
    }
  }
}

.date-time-group {
  display: flex;
  gap: 12px;
  align-items: end;

  @media (max-width: 960px) {
    width: 100%;
  }
}

.date-box,
.time-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;

  @media (max-width: 960px) {
    flex: 1;
  }
}

.date-label,
.time-label {
  color: #ccc;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-input,
.time-input {
  :deep(.v-field) {
    background: #1a1a1a !important;
  }
  
  :deep(.v-field__input) {
    color: #fff !important;
  }
}

.discount-section {
  margin-top: 20px;
  margin-bottom: 24px;
}

.discount-input {
  :deep(.v-field) {
    background: #1a1a1a !important;
  }
  
  :deep(.v-field__input) {
    color: #fff !important;
    font-weight: 600;
    
    &::placeholder {
      color: #999 !important;
    }
  }
}

.search-button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.search-action-btn {
  background: #d32f2f !important;
  color: #fff !important;
  font-size: 1.125rem !important;
  font-weight: 700 !important;
  padding: 16px 40px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3) !important;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: #b71c1c !important;
    box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4) !important;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :deep(.v-btn__prepend) {
    margin-inline-end: 8px;
  }
}

// Results Section
.results-section {
  background: #f5f7fa;
}

.filter-card {
  position: sticky;
  top: 80px;
}

.vehicle-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vehicle-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

.vehicle-image {
  position: relative;
  height: 100%;
  min-height: 200px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e0e0e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px 0 0 8px;

  .vehicle-badge {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}

.vehicle-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

// Features Section
.features-section {
  background: #ffffff;
}

.feature-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

// Responsive
@media (max-width: 960px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .filter-card {
    position: relative;
    top: 0;
    margin-bottom: 24px;
  }

  .vehicle-image {
    border-radius: 8px 8px 0 0;
    min-height: 150px;
  }
}
</style>
