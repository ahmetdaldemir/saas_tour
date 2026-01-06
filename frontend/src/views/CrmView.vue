<template>
  <div>
    <!-- Ana Tab Bar -->
    <v-card elevation="2" class="mb-4 main-container">
      <v-tabs v-model="mainTab" show-arrows>
        <v-tab value="extras">
          <v-icon start icon="mdi-package-variant" />
          Ekstralar
        </v-tab>
        <v-tab value="kapis">
          <v-icon start icon="mdi-bell-alert" />
          KAPİS Bildirim
        </v-tab>
        <v-tab value="penalty">
          <v-icon start icon="mdi-gavel" />
          Ceza Sorgulama (Tüzel)
        </v-tab>
        <v-tab value="penalty-person">
          <v-icon start icon="mdi-account-alert" />
          Ceza Sorgulama (Kişi)
        </v-tab>
        <v-tab value="hgs">
          <v-icon start icon="mdi-road-variant" />
          HGS Sorgulama
        </v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="mainTab" class="window-content">
        <!-- Ekstralar Sekmesi -->
        <v-window-item value="extras">
          <!-- Ekstra Ürünler Listesi -->
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Ekstra ürünler</span>
              <div class="d-flex align-center gap-2">
                <v-btn icon="mdi-refresh" variant="text" @click="loadExtras" :loading="loadingExtras" />
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openExtraDialog">
                  Yeni Ekle
                </v-btn>
              </div>
            </v-card-title>
            <v-divider />
            
            <!-- Ekstra Ürünler Tablosu -->
            <v-card-text class="pa-0">
              <v-data-table
                :headers="extraTableHeaders"
                :items="extras"
                :loading="loadingExtras"
                item-value="id"
                class="elevation-0 extra-table"
                density="compact"
              >
                <template #item.index="{ index }">
                  <span>{{ index + 1 }}</span>
                </template>

                <template #item.name="{ item }">
                  <span class="font-weight-medium">{{ item.name || '-' }}</span>
                </template>

                <template #item.price="{ item }">
                  <div class="d-flex align-center gap-1 justify-end">
                    <v-icon 
                      :icon="getCurrencyIcon(defaultCurrency?.code || 'TRY')" 
                      size="small" 
                      color="primary"
                    />
                    <span class="price-value">{{ item.price || 0 }}</span>
                  </div>
                </template>

                <template #item.isMandatory="{ item }">
                  <div class="d-flex justify-center">
                    <v-chip
                      size="small"
                      :color="item.isMandatory ? 'success' : 'error'"
                      variant="flat"
                    >
                      {{ item.isMandatory ? 'EVET' : 'HAYIR' }}
                    </v-chip>
                  </div>
                </template>

                <template #item.status="{ item }">
                  <div class="d-flex justify-center">
                    <v-chip
                      size="small"
                      :color="item.isActive ? 'success' : 'error'"
                      variant="flat"
                    >
                      {{ item.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </div>
                </template>

                <template #item.actions="{ item }">
                  <div class="d-flex align-center gap-1 justify-end" @click.stop>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      color="primary"
                      @click.stop="editExtra(item)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click.stop="deleteExtra(item.id)"
                    />
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- KAPİS Bildirim Sekmesi -->
        <v-window-item value="kapis">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">KAPİS Bildirim</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openKapisInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Ceza Sorgulama (Tüzel) Sekmesi -->
        <v-window-item value="penalty">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Ceza Sorgulama (Tüzel)</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openPenaltyInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Ceza Sorgulama (Kişi) Sekmesi -->
        <v-window-item value="penalty-person">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Ceza Sorgulama (Kişi)</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openPenaltyPersonInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- HGS Sorgulama Sekmesi -->
        <v-window-item value="hgs">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">HGS Sorgulama</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openHgsInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Ekstra Ürün Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showExtraDialog" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-package-variant-plus" size="24" />
            <span class="text-h6">{{ editingExtra ? 'Ekstra Ürün Düzenle' : 'Ekstra Ürün Ekleme Formu' }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeExtraDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-form ref="extraFormRef" v-model="extraFormValid">
            <!-- Ürün Adı - Dil Sekmeleri -->
            <div class="pa-4">
              <label class="text-body-1 font-weight-medium mb-2 d-block">Ürün Adı</label>
              <v-tabs v-model="extraLanguageTab" show-arrows>
                <v-tab
                  v-for="lang in availableLanguages"
                  :key="lang.id"
                  :value="lang.id"
                >
                  {{ lang.name }}
                </v-tab>
              </v-tabs>
              <v-window v-model="extraLanguageTab">
                <v-window-item
                  v-for="lang in availableLanguages"
                  :key="lang.id"
                  :value="lang.id"
                >
                  <v-text-field
                    v-model="extraForm.translations[lang.id]"
                    :label="`Ürün Adı (${lang.name})`"
                    :placeholder="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için ürün adı'"
                    prepend-inner-icon="mdi-package-variant"
                    :hint="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için ürün adı'"
                    persistent-hint
                    class="mt-2"
                  />
                </v-window-item>
              </v-window>
            </div>

            <v-divider />

            <v-row class="pa-4">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.price"
                  label="Fiyat"
                  type="number"
                  :prepend-icon="getCurrencyIcon(defaultCurrency?.code || 'TRY')"
                  :suffix="getCurrencySymbol(defaultCurrency?.code || 'TRY')"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.isMandatory"
                  :items="yesNoOptions"
                  item-title="label"
                  item-value="value"
                  label="Kontratta Zorunlumu"
                  prepend-inner-icon="mdi-check-circle"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.canIncreaseQuantity"
                  :items="yesNoOptions"
                  item-title="label"
                  item-value="value"
                  label="Adet Arttırma"
                  prepend-inner-icon="mdi-plus-circle"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.image"
                  label="Resim"
                  prepend-inner-icon="mdi-image"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.value"
                  label="Değer"
                  prepend-inner-icon="mdi-numeric"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.inputName"
                  label="Input Name"
                  prepend-inner-icon="mdi-form-textbox"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.type"
                  :items="extraTypeOptions"
                  item-title="label"
                  item-value="value"
                  label="Tipi"
                  prepend-inner-icon="mdi-format-list-bulleted-type"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.salesType"
                  :items="salesTypeOptions"
                  item-title="label"
                  item-value="value"
                  label="Satış Tipi"
                  prepend-inner-icon="mdi-cash-multiple"
                  class="mb-2"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeExtraDialog">Kapat</v-btn>
          <v-btn color="primary" @click="saveExtra" :loading="savingExtra" :disabled="!extraFormValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import { translateText } from '../services/deepl';

const auth = useAuthStore();

// Data
const availableLanguages = ref<LanguageDto[]>([]);
const extras = ref<ExtraDto[]>([]);
const vehicles = ref<VehicleDto[]>([]);
const locations = ref<LocationDto[]>([]);

// UI State
const mainTab = ref('extras');
const loadingExtras = ref(false);
const loadingVehicles = ref(false);
const loadingLocations = ref(false);
const kapisUrl = 'https://arackiralama.egm.gov.tr/my.policy';
const penaltyUrl = 'https://www.turkiye.gov.tr/egm-arac-plakasina-yazilan-ceza-sorgulama-tuzel-kisi';
const penaltyPersonUrl = 'https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama';
const hgsUrl = 'https://webihlaltakip.kgm.gov.tr/WebIhlalSorgulama/Sayfalar/Sorgulama';
const showExtraDialog = ref(false);
const savingExtra = ref(false);
const editingExtra = ref<ExtraDto | null>(null);
const extraLanguageTab = ref('');

// Form Refs
const extraFormRef = ref();
const extraFormValid = ref(false);

// Options
const yesNoOptions = [
  { label: 'Evet', value: true },
  { label: 'Hayır', value: false },
];

const extraTypeOptions = [
  { label: 'Sigorta', value: 'insurance' },
  { label: 'Ekstra', value: 'extra' },
];

const salesTypeOptions = [
  { label: 'Günlük', value: 'daily' },
  { label: 'Kiralama Başı', value: 'per_rental' },
];

const currencyOptions = [
  { label: 'TRY', value: 'TRY' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
];

const regionOptions = [
  { label: 'Yurt İçi', value: 'domestic' },
  { label: 'Yurt Dışı', value: 'international' },
];

const validityDaysOptions = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1} Gün`,
  value: i + 1,
})).concat([{ label: '30+ Gün', value: 31 }]);

const customerTypeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Özel Müşteri', value: 'special' },
];
const defaultCurrency = ref<{ code: string; symbol?: string } | null>(null);

// Computed
const locationOptions = computed(() => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  return locations.value.map(loc => {
    let name = loc.name || '';
    if (!name && loc.translations && defaultLang) {
      const translation = loc.translations.find(t => t.languageId === defaultLang.id);
      name = translation?.name || '';
    }
    if (!name && loc.province) {
      name = loc.district ? `${loc.province} - ${loc.district}` : loc.province;
    }
    return {
      label: name || 'İsimsiz Lokasyon',
      value: loc.id,
    };
  });
});


// Interfaces
interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface ExtraDto {
  id: string;
  name: string;
  price: number;
  isMandatory: boolean;
  isActive: boolean;
  canIncreaseQuantity?: boolean;
  image?: string;
  value?: string;
  inputName?: string;
  type?: 'insurance' | 'extra';
  salesType?: 'daily' | 'per_rental';
}

interface VehicleDto {
  id: string;
  name: string;
  brand?: { name: string } | null;
  brandName?: string;
  model?: { name: string } | null;
  modelName?: string;
  year?: number;
}

interface LocationDto {
  id: string;
  name?: string;
  province?: string;
  district?: string;
  translations?: Array<{ languageId: string; name: string }>;
}


// Extra Form
const extraForm = reactive<{
  translations: Record<string, string>;
  price: number | null;
  isMandatory: boolean;
  isActive: boolean;
  canIncreaseQuantity: boolean;
  image: string;
  value: string;
  inputName: string;
  type: 'insurance' | 'extra';
  salesType: 'daily' | 'per_rental';
}>({
  translations: {},
  price: null,
  isMandatory: false,
  isActive: true,
  canIncreaseQuantity: false,
  image: '',
  value: '',
  inputName: 'default',
  type: 'extra',
  salesType: 'daily',
});


// Table headers
const extraTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Ürün Adı', key: 'name', width: '250px' },
  { title: 'Fiyat', key: 'price', width: '100px' },
  { title: 'Zorunlumu', key: 'isMandatory', sortable: false, width: '120px' },
  { title: 'Durum', key: 'status', sortable: false, width: '100px' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '120px' },
];

// Helper functions for localStorage
const getDeletedExtras = (): string[] => {
  try {
    const deleted = localStorage.getItem('crm_deleted_extras');
    return deleted ? JSON.parse(deleted) : [];
  } catch {
    return [];
  }
};

const saveDeletedExtras = (deletedIds: string[]) => {
  try {
    localStorage.setItem('crm_deleted_extras', JSON.stringify(deletedIds));
  } catch (error) {
    console.error('Failed to save deleted extras:', error);
  }
};

const getAddedExtras = (): ExtraDto[] => {
  try {
    const added = localStorage.getItem('crm_added_extras');
    return added ? JSON.parse(added) : [];
  } catch {
    return [];
  }
};

const saveAddedExtras = (extras: ExtraDto[]) => {
  try {
    localStorage.setItem('crm_added_extras', JSON.stringify(extras));
  } catch (error) {
    console.error('Failed to save added extras:', error);
  }
};

// Extra Products Methods
const loadExtras = async () => {
  if (!auth.tenant) return;
  loadingExtras.value = true;
  try {
    // Load extras from backend API
    const { data } = await http.get<ExtraDto[]>('/rentacar/extras', {
      params: { tenantId: auth.tenant.id },
    });
    
    // Backend might return snake_case (is_active) or camelCase (isActive)
    // Normalize the field names to camelCase
    if (data && Array.isArray(data)) {
      extras.value = data.map((extra: any) => ({
        ...extra,
        isActive: extra.isActive !== undefined ? extra.isActive : (extra.is_active !== undefined ? extra.is_active : true),
        isMandatory: extra.isMandatory !== undefined ? extra.isMandatory : (extra.is_mandatory !== undefined ? extra.is_mandatory : false),
        salesType: extra.salesType || extra.sales_type || 'daily',
      }));
    } else {
      extras.value = [];
    }
  } catch (error) {
    console.error('Failed to load extras:', error);
    extras.value = [];
  } finally {
    loadingExtras.value = false;
  }
};
const getCurrencyIcon = (code: string): string => {
  const icons: Record<string, string> = {
    TRY: 'mdi-currency-try',
    USD: 'mdi-currency-usd',
    EUR: 'mdi-currency-eur',
    GBP: 'mdi-currency-gbp',
  };
  return icons[code] || 'mdi-currency-usd';
};

const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return symbols[code] || '$';
};

// Computed for extra form default language
const extraDefaultLanguageId = computed(() => {
  return availableLanguages.value.find(l => l.isDefault)?.id || availableLanguages.value[0]?.id;
});

// Auto-translate extra product name
watch(
  () => {
    const defaultLangId = extraDefaultLanguageId.value;
    if (!defaultLangId) return '';
    return extraForm.translations[defaultLangId] || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    
    const defaultLang = availableLanguages.value.find(l => l.id === extraDefaultLanguageId.value);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        if (extraForm.translations[lang.id] && extraForm.translations[lang.id] !== '') continue;
        
        try {
          const translated = await translateText(newValue, lang.code, defaultLang.code);
          extraForm.translations[lang.id] = translated;
        } catch (error) {
          console.error(`Failed to translate extra product name to ${lang.code}:`, error);
        }
      }
    }, 1500);
  }
);


const openExtraDialog = () => {
  editingExtra.value = null;
  resetExtraForm();
  showExtraDialog.value = true;
  
  // Set default language tab
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    extraLanguageTab.value = defaultLang.id;
  }
};

const closeExtraDialog = () => {
  showExtraDialog.value = false;
  resetExtraForm();
};

const resetExtraForm = () => {
  extraForm.translations = {};
  extraForm.price = null;
  extraForm.isMandatory = false;
  extraForm.isActive = true;
  extraForm.canIncreaseQuantity = false;
  extraForm.image = '';
  extraForm.value = '';
  extraForm.inputName = 'default';
  extraForm.type = 'extra';
  extraForm.salesType = 'daily';
  
  // Initialize translations for all languages
  availableLanguages.value.forEach(lang => {
    extraForm.translations[lang.id] = '';
  });
};

const saveExtra = async () => {
  if (!auth.tenant) return;
  
  const validated = await extraFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingExtra.value = true;
  try {
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    const defaultName = extraForm.translations[defaultLang?.id || ''] || '';
    
    if (!defaultName) {
      alert('Varsayılan dilde ürün adı girilmelidir');
      return;
    }
    
    const extraData = {
      tenantId: auth.tenant.id,
      name: defaultName,
      price: extraForm.price || 0,
      currencyCode: 'TRY', // Default currency
      isMandatory: extraForm.isMandatory || false,
      isActive: extraForm.isActive !== undefined ? extraForm.isActive : true,
      salesType: extraForm.salesType || 'daily',
      description: extraForm.value || null,
      imageUrl: extraForm.image || null,
    };
    
    // Backend API endpoint kullan
    if (editingExtra.value) {
      // Update existing extra - tenantId query param olarak gönder
      const { tenantId, ...updateData } = extraData;
      await http.put(`/rentacar/extras/${editingExtra.value.id}`, updateData, {
        params: { tenantId: auth.tenant.id },
      });
    } else {
      // Create new extra
      await http.post('/rentacar/extras', extraData);
    }
    
    // Reload extras from backend
    await loadExtras();
    closeExtraDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Ekstra ürün kaydedilirken bir hata oluştu');
  } finally {
    savingExtra.value = false;
  }
};

const editExtra = (extra: ExtraDto) => {
  editingExtra.value = extra;
  
  // Reset form
  resetExtraForm();
  
  // Set form values
  extraForm.price = extra.price;
  extraForm.isMandatory = extra.isMandatory;
  extraForm.isActive = extra.isActive !== undefined ? extra.isActive : true;
  extraForm.canIncreaseQuantity = extra.canIncreaseQuantity ?? false;
  extraForm.image = extra.image || '';
  extraForm.value = extra.value || '';
  extraForm.inputName = extra.inputName || 'default';
  extraForm.type = extra.type || 'extra';
  extraForm.salesType = extra.salesType || 'daily';
  
  // Set name in default language
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    extraForm.translations[defaultLang.id] = extra.name;
    extraLanguageTab.value = defaultLang.id;
  }
  
  showExtraDialog.value = true;
};

const deleteExtra = async (id: string) => {
  if (!confirm('Bu ekstra ürünü silmek istediğinizden emin misiniz?')) return;
  if (!auth.tenant) return;
  
  try {
    // Backend API endpoint kullan
    await http.delete(`/rentacar/extras/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    
    // Reload extras from backend
    await loadExtras();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Ekstra ürün silinirken bir hata oluştu');
  }
};

const openKapisInNewTab = () => {
  window.open(kapisUrl, '_blank', 'noopener,noreferrer');
};

const openPenaltyInNewTab = () => {
  window.open(penaltyUrl, '_blank', 'noopener,noreferrer');
};

const openPenaltyPersonInNewTab = () => {
  window.open(penaltyPersonUrl, '_blank', 'noopener,noreferrer');
};

const openHgsInNewTab = () => {
  window.open(hgsUrl, '_blank', 'noopener,noreferrer');
};


const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};
const loadDefaultCurrency = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get<{ 
      defaultCurrency?: { 
        id?: string;
        code: string; 
        symbol?: string;
      } | null;
    }>(`/tenants/${auth.tenant.id}`);
    
    if (data?.defaultCurrency) {
      defaultCurrency.value = {
        code: data.defaultCurrency.code,
        symbol: data.defaultCurrency.symbol,
      };
    } else {
      // Fallback to TRY if no default currency is set
      defaultCurrency.value = { code: 'TRY', symbol: '₺' };
    }
  } catch (error) {
    console.error('Failed to load default currency:', error);
    // Fallback to TRY if API fails
    defaultCurrency.value = { code: 'TRY', symbol: '₺' };
  }
};

onMounted(async () => {
  await Promise.all([
    loadLanguages(),
    loadExtras(),
    loadDefaultCurrency(), // Load default currency for location fee icons
  ]);
  
  // Initialize extra form translations
  availableLanguages.value.forEach(lang => {
    extraForm.translations[lang.id] = '';
  });
});
</script>

<style scoped>
.main-container {
  width: 100%;
  max-width: 100%;
}

.window-content {
  width: 100%;
}

.window-content :deep(.v-window-item) {
  width: 100%;
  padding: 0;
}

.extra-table {
  width: 100%;
}

.extra-table :deep(th),
.extra-table :deep(td) {
  white-space: nowrap;
  padding: 10px 12px !important;
  vertical-align: middle;
}

.extra-table :deep(th) {
  font-weight: 600;
  font-size: 0.875rem;
}

.extra-table :deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-surface), 1);
}

.extra-table :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.price-value {
  font-size: 16px;
  font-weight: 500;
  color: #f44336;
  text-align: right;
  min-width: 25px;
  display: inline-block;
}


</style>
