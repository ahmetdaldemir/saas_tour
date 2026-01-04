<template>
  <div>
    <v-card elevation="2" class="pa-6 mb-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Destinasyonlar</h1>
          <p class="text-body-2 text-medium-emphasis">
            Global turizm bolgelerini yonetin ve vitrine cikarmak istediklerinizi belirleyin.
          </p>
        </div>
        <div class="d-flex gap-2">
          <v-btn
            v-if="selectedDestinations.length > 0"
            color="warning"
            prepend-icon="mdi-eye-off"
            @click="bulkDeactivate"
            :loading="bulkDeactivating"
            variant="outlined"
          >
            Pasif Yap ({{ selectedDestinations.length }})
          </v-btn>
          <v-btn
            v-if="selectedDestinations.length > 0"
            color="success"
            prepend-icon="mdi-eye"
            @click="bulkActivate"
            :loading="bulkActivating"
            variant="outlined"
          >
            Aktif Yap ({{ selectedDestinations.length }})
          </v-btn>
          <v-btn
            v-if="selectedDestinations.length > 0"
            color="error"
            prepend-icon="mdi-delete-multiple"
            @click="bulkDelete"
            :loading="bulkDeleting"
          >
            Sil ({{ selectedDestinations.length }})
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-map-plus" @click="openCreate">
            Yeni Destinasyon
          </v-btn>
        </div>
      </div>

      <!-- Arama Input -->
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Destinasyon ara..."
        variant="outlined"
        density="compact"
        clearable
        class="mb-4"
        hide-details
      />

      <v-data-table
        v-model:selected="selectedDestinations"
        :headers="headers"
        :items="filteredDestinations"
        :loading="loading"
        item-key="id"
        show-select
        density="comfortable"
        class="elevation-0"
      >
        <template #item.displayName="{ item }">
          <span class="font-weight-medium">{{ getDisplayName(item) }}</span>
        </template>
        <template #item.isActive="{ item }">
          <v-switch
            :model-value="item.isActive"
            @update:model-value="toggleActive(item.id, $event)"
            color="success"
            hide-details
            density="compact"
            :loading="updatingActive === item.id"
          />
        </template>
        <template #item.isFeatured="{ item }">
          <v-switch
            :model-value="item.isFeatured"
            @update:model-value="toggleFeatured(item.id, $event)"
            color="primary"
            hide-details
            density="compact"
            :loading="updatingFeatured === item.id"
          />
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" @click="startEdit(item)" />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            color="error"
            :loading="removing === item.id"
            @click="removeDestination(item.id)"
          />
        </template>
        <template #no-data>
          <v-alert type="info" variant="tonal" class="ma-4">Henuz destinasyon bulunmuyor.</v-alert>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="1400" fullscreen-sm-and-down persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ dialogTitle }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>
          <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit">
            <!-- Language Tabs -->
            <v-tabs v-model="selectedLanguageTab" class="mb-4" color="primary">
              <v-tab
                v-for="lang in availableLanguages"
                :key="lang.id"
                :value="lang.id"
                :prepend-icon="lang.isDefault ? 'mdi-star' : undefined"
              >
                {{ lang.name }}
              </v-tab>
            </v-tabs>

            <!-- Translation Content for Selected Language -->
            <v-window v-model="selectedLanguageTab">
              <v-window-item
                v-for="lang in availableLanguages"
                :key="lang.id"
                :value="lang.id"
              >
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="form.translations[lang.id].title"
                      label="Başlık"
                      prepend-inner-icon="mdi-format-title"
                      required
                      :rules="[v => !!v || 'Başlık zorunludur']"
                    >
                      <template v-if="lang.code === 'tr' && form.translations[lang.id].title && hasAiFeature" #append-inner>
                        <v-btn
                          icon="mdi-auto-fix"
                          size="small"
                          variant="text"
                          color="primary"
                          :loading="generatingContent"
                          @click="generateContent"
                          title="AI ile İçerik Oluştur"
                        />
                      </template>
                      <template v-else-if="lang.code === 'tr' && form.translations[lang.id].title && !hasAiFeature" #append-inner>
                        <v-tooltip text="AI özelliği aktif değil. Yetki almak için destek ekibimizle iletişime geçin.">
                          <template #activator="{ props }">
                            <v-btn
                              icon="mdi-auto-fix"
                              size="small"
                              variant="text"
                              color="grey"
                              disabled
                              v-bind="props"
                            />
                          </template>
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="form.translations[lang.id].shortDescription"
                      label="Kısa Açıklama"
                      prepend-inner-icon="mdi-text-short"
                      rows="2"
                      hint="Kısa açıklama (isteğe bağlı)"
                    />
                  </v-col>
                  <v-col cols="12">
                    <label class="text-body-2 text-medium-emphasis mb-2 d-block">Açıklama</label>
                    <TinyMceEditor
                      v-model="form.translations[lang.id].description"
                      :height="300"
                      placeholder="Detaylı açıklama girin..."
                    />
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>

            <!-- Common Fields (Outside tabs) -->
            <v-row class="mt-4">
              <v-col cols="12">
                <div>
                  <v-file-input
                    v-model="imageFile"
                    label="Görsel Yükle"
                    prepend-inner-icon="mdi-image"
                    variant="outlined"
                    density="comfortable"
                    accept="image/*"
                    :rules="[(v: any) => {
                      if (!v) return true;
                      if (v && typeof v === 'object' && 'size' in v) {
                        return v.size < 5000000 || 'Dosya boyutu 5MB\'dan küçük olmalıdır';
                      }
                      return true;
                    }]"
                    :loading="uploadingImage"
                    show-size
                    clearable
                  />
                  <v-btn
                    v-if="imageFile && !uploadingImage"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-upload"
                    @click="handleImageUpload"
                    class="mt-2"
                  >
                    Görsel Yükle
                  </v-btn>
                  <v-img
                    v-if="form.image"
                    :src="getImageUrl(form.image)"
                    max-height="200"
                    max-width="300"
                    contain
                    class="mt-2 rounded"
                  />
                </div>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.rentacarLocationId"
                  :items="rentacarLocations"
                  item-title="name"
                  item-value="id"
                  label="Lokasyon"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  :loading="loadingLocations"
                  hint="Bu destinasyonu bir lokasyona bağlayabilirsiniz"
                  persistent-hint
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #title>
                        {{ item.raw.name }}
                      </template>
                      <template #subtitle>
                        <span class="text-caption">{{ item.raw.location?.type || '' }}</span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12">
                <v-checkbox v-model="form.isActive" label="Aktif" color="success" />
                <v-checkbox v-model="form.isFeatured" label="Öne Çıkar" />
              </v-col>
            </v-row>

            <div class="d-flex justify-end gap-3 mt-6">
              <v-btn variant="text" @click="closeDialog">Iptal</v-btn>
              <v-btn color="primary" type="submit" :loading="submitting">
                {{ editingId ? 'Guncelle' : 'Kaydet' }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import TinyMceEditor from '../components/TinyMceEditor.vue';
import { useFeaturesStore } from '../stores/features';

interface Translation {
  id: string;
  languageId: string;
  name: string;
  value?: string; // JSON string containing { description?, shortDescription? }
}

interface TranslationForm {
  title: string;
  shortDescription?: string;
  description?: string;
}

interface Destination {
  id: string;
  image?: string;
  isActive: boolean;
  isFeatured: boolean;
  rentacarLocationId?: string;
  translations?: Translation[];
}

interface RentacarLocation {
  id: string;
  name: string;
  location: {
    id: string;
    name: string;
    type: string;
  };
}

interface Language {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

const headers = [
  { title: 'Ad', key: 'displayName' },
  { title: 'Aktif', key: 'isActive' },
  { title: 'Öne Çıkan', key: 'isFeatured' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const destinations = ref<Destination[]>([]);
const selectedDestinations = ref<Destination[]>([]);
const availableLanguages = ref<Language[]>([]);
const rentacarLocations = ref<RentacarLocation[]>([]);
const loadingLocations = ref(false);
const loading = ref(false);
const submitting = ref(false);
const removing = ref<string | null>(null);
const bulkDeleting = ref(false);
const bulkDeactivating = ref(false);
const bulkActivating = ref(false);
const updatingActive = ref<string | null>(null);
const updatingFeatured = ref<string | null>(null);
const formError = ref('');
const searchQuery = ref('');
const formRef = ref();
const isValid = ref(false);
const editingId = ref<string | null>(null);
const dialog = ref(false);
const selectedLanguageTab = ref<string>('');

const form = reactive({
  translations: {} as Record<string, TranslationForm>,
  image: '',
  isActive: true,
  isFeatured: false,
  rentacarLocationId: undefined as string | undefined,
});

const imageFile = ref<File | null>(null);
const uploadingImage = ref(false);
const generatingContent = ref(false);

const auth = useAuthStore();
const features = useFeaturesStore();
const hasAiFeature = computed(() => features.initialized && features.hasFeature('ai'));

const dialogTitle = computed(() => (editingId.value ? 'Destinasyonu duzenle' : 'Yeni destinasyon'));

// Get display name from translations (use default language or first available)
const getDisplayName = (destination: Destination): string => {
  if (!destination.translations || destination.translations.length === 0) {
    return 'İsimsiz';
  }
  const defaultLang = availableLanguages.value.find(l => l.isDefault);
  const translation = defaultLang
    ? destination.translations.find(t => t.languageId === defaultLang.id)
    : null;
  return translation?.name || destination.translations[0]?.name || 'İsimsiz';
};

// Filtered destinations based on search query
const filteredDestinations = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return destinations.value.map(d => ({ ...d, displayName: getDisplayName(d) }));
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return destinations.value
    .filter(destination => {
      const displayName = getDisplayName(destination).toLowerCase();
      // Search in display name
      if (displayName.includes(query)) {
        return true;
      }
      // Also search in all translations
      if (destination.translations) {
        return destination.translations.some(trans => 
          trans.name?.toLowerCase().includes(query)
        );
      }
      return false;
    })
    .map(d => ({ ...d, displayName: getDisplayName(d) }));
});

const loadRentacarLocations = async () => {
  if (!auth.tenant?.id) {
    return;
  }
  
  loadingLocations.value = true;
  try {
    const { data } = await http.get<RentacarLocation[]>(`/rentacar/locations?tenantId=${auth.tenant.id}&isActive=true`);
    rentacarLocations.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load rentacar locations:', error);
    rentacarLocations.value = [];
  } finally {
    loadingLocations.value = false;
  }
};

const loadLanguages = async () => {
  try {
    const { data } = await http.get<Language[]>('/languages');
    availableLanguages.value = Array.isArray(data) ? data.filter(l => (l as any).isActive !== false) : [];
    // Initialize translations for all languages
    availableLanguages.value.forEach(lang => {
      if (!form.translations[lang.id]) {
        form.translations[lang.id] = {
          title: '',
          shortDescription: '',
          description: '',
        };
      }
    });
    // Set default language tab
    if (availableLanguages.value.length > 0 && !selectedLanguageTab.value) {
      const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
      if (defaultLang) {
        selectedLanguageTab.value = defaultLang.id;
      }
    }
  } catch (error) {
    console.error('Failed to load languages:', error);
    availableLanguages.value = [];
  }
};

const loadDestinations = async () => {
  loading.value = true;
  try {
    // Ensure auth session is initialized
    await auth.ensureSession();
    
    if (!auth.tenant) {
      console.warn('Tenant not found, cannot load destinations');
      destinations.value = [];
      return;
    }

    // Get tenantId from auth store (from /auth/me endpoint)
    const tenantId = auth.tenant.id;

    // Load destinations with tenantId
    const { data } = await http.get<{ success: boolean; data: Destination[] }>(
      `/destinations?tenantId=${tenantId}`
    );
    if (data.success && Array.isArray(data.data)) {
      destinations.value = data.data;
    } else {
      destinations.value = [];
    }
  } catch (error) {
    console.error('Failed to load destinations:', error);
    destinations.value = [];
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  // Reset translations for all languages
  availableLanguages.value.forEach(lang => {
    form.translations[lang.id] = {
      title: '',
      shortDescription: '',
      description: '',
    };
  });
  form.image = '';
  form.isActive = true;
  form.isFeatured = false;
  form.rentacarLocationId = undefined;
  imageFile.value = null;
  uploadingImage.value = false;
  editingId.value = null;
  // Reset language tab to default
  if (availableLanguages.value.length > 0) {
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    if (defaultLang) {
      selectedLanguageTab.value = defaultLang.id;
    }
  }
  formRef.value?.resetValidation();
};

const handleSubmit = async () => {
  const validation = await formRef.value?.validate();
  if (!validation?.valid) {
    return;
  }

  // Validate at least one translation has title
  const hasValidTranslation = availableLanguages.value.some(
    lang => form.translations[lang.id]?.title?.trim()
  );

  if (!hasValidTranslation) {
    formError.value = 'En az bir dil için başlık gereklidir';
    return;
  }

  submitting.value = true;
  formError.value = '';
  try {
    // Build translations array from form
    const translations = availableLanguages.value
      .filter(lang => form.translations[lang.id]?.title?.trim())
      .map(lang => ({
        languageId: lang.id,
        title: form.translations[lang.id].title.trim(),
        description: form.translations[lang.id].description?.trim() || undefined,
        shortDescription: form.translations[lang.id].shortDescription?.trim() || undefined,
      }));

    const payload = {
      image: form.image?.trim() || undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      rentacarLocationId: form.rentacarLocationId || undefined,
      translations,
    };

    if (editingId.value) {
      const { data } = await http.patch<{ success: boolean; data: Destination }>(
        `/destinations/${editingId.value}`,
        payload
      );
      if (!data.success) {
        throw new Error('Güncelleme başarısız');
      }
    } else {
      const { data } = await http.post<{ success: boolean; data: Destination }>('/destinations', payload);
      if (!data.success) {
        throw new Error('Kayıt başarısız');
      }
    }
    await loadDestinations();
    closeDialog();
  } catch (err: any) {
    formError.value = err.response?.data?.error?.message || err.message || 'İşlem başarısız';
  } finally {
    submitting.value = false;
  }
};

const bulkActivate = async () => {
  if (selectedDestinations.value.length === 0) {
    return;
  }

  const count = selectedDestinations.value.length;
  const confirmMessage = `${count} destinasyon aktif yapılacak. Devam etmek istiyor musunuz?`;
  if (!confirm(confirmMessage)) {
    return;
  }

  bulkActivating.value = true;
  const selectedIds = selectedDestinations.value.map(d => d.id);
  const selectedNames = selectedDestinations.value.map(d => getDisplayName(d));
  
  try {
    // Activate all selected destinations in parallel
    const activatePromises = selectedDestinations.value.map(destination => 
      http.patch(`/destinations/${destination.id}`, { isActive: true })
    );
    
    await Promise.all(activatePromises);
    
    // Update local state
    destinations.value.forEach(d => {
      if (selectedIds.includes(d.id)) {
        d.isActive = true;
      }
    });
    selectedDestinations.value = [];
    
    // Show success message
    alert(`✅ ${count} destinasyon başarıyla aktif yapıldı:\n${selectedNames.join('\n')}`);
    
    // Reload destinations to ensure consistency
    await loadDestinations();
  } catch (error: any) {
    console.error('Failed to activate destinations:', error);
    const errorMessage = error.response?.data?.error?.message || 'Destinasyonlar aktif yapılırken bir hata oluştu';
    alert(`❌ Hata: ${errorMessage}`);
  } finally {
    bulkActivating.value = false;
  }
};

const bulkDeactivate = async () => {
  if (selectedDestinations.value.length === 0) {
    return;
  }

  const count = selectedDestinations.value.length;
  const confirmMessage = `${count} destinasyon pasif yapılacak. Devam etmek istiyor musunuz?`;
  if (!confirm(confirmMessage)) {
    return;
  }

  bulkDeactivating.value = true;
  const selectedIds = selectedDestinations.value.map(d => d.id);
  const selectedNames = selectedDestinations.value.map(d => getDisplayName(d));
  
  try {
    // Deactivate all selected destinations in parallel
    const deactivatePromises = selectedDestinations.value.map(destination => 
      http.patch(`/destinations/${destination.id}`, { isActive: false })
    );
    
    await Promise.all(deactivatePromises);
    
    // Update local state
    destinations.value.forEach(d => {
      if (selectedIds.includes(d.id)) {
        d.isActive = false;
      }
    });
    selectedDestinations.value = [];
    
    // Show success message
    alert(`✅ ${count} destinasyon başarıyla pasif yapıldı:\n${selectedNames.join('\n')}`);
    
    // Reload destinations to ensure consistency
    await loadDestinations();
  } catch (error: any) {
    console.error('Failed to deactivate destinations:', error);
    const errorMessage = error.response?.data?.error?.message || 'Destinasyonlar pasif yapılırken bir hata oluştu';
    alert(`❌ Hata: ${errorMessage}`);
  } finally {
    bulkDeactivating.value = false;
  }
};

const bulkDelete = async () => {
  if (selectedDestinations.value.length === 0) {
    return;
  }

  const count = selectedDestinations.value.length;
  const confirmMessage = `${count} destinasyon silinecek. Bu işlem geri alınamaz. Emin misiniz?`;
  if (!confirm(confirmMessage)) {
    return;
  }

  bulkDeleting.value = true;
  const selectedIds = selectedDestinations.value.map(d => d.id);
  const selectedNames = selectedDestinations.value.map(d => getDisplayName(d));
  
  try {
    // Delete all selected destinations in parallel
    const deletePromises = selectedDestinations.value.map(destination => 
      http.delete(`/destinations/${destination.id}`)
    );
    
    await Promise.all(deletePromises);
    
    // Remove from local state
    destinations.value = destinations.value.filter(d => !selectedIds.includes(d.id));
    selectedDestinations.value = [];
    
    // Show success message
    alert(`✅ ${count} destinasyon başarıyla silindi:\n${selectedNames.join('\n')}`);
    
    // Reload destinations to ensure consistency
    await loadDestinations();
  } catch (error: any) {
    console.error('Failed to delete destinations:', error);
    
    // Try to identify which destinations failed
    const errorMessage = error.response?.data?.error?.message || 'Destinasyonlar silinirken bir hata oluştu';
    
    // If some succeeded, show partial success message
    const remainingDestinations = destinations.value.filter(d => selectedIds.includes(d.id));
    if (remainingDestinations.length < selectedIds.length) {
      const deletedCount = selectedIds.length - remainingDestinations.length;
      alert(`⚠️ ${deletedCount} destinasyon silindi, ancak bazıları silinemedi:\n${errorMessage}`);
    } else {
      alert(`❌ Hata: ${errorMessage}`);
    }
  } finally {
    bulkDeleting.value = false;
  }
};

const removeDestination = async (id: string) => {
  removing.value = id;
  try {
    await http.delete(`/destinations/${id}`);
    await loadDestinations();
    if (editingId.value === id) {
      resetForm();
    }
  } finally {
    removing.value = null;
  }
};

const toggleFeatured = async (id: string, isFeatured: boolean) => {
  updatingFeatured.value = id;
  try {
    await http.patch(`/destinations/${id}`, { isFeatured });
    // Update local state immediately for better UX
    const destination = destinations.value.find(d => d.id === id);
    if (destination) {
      destination.isFeatured = isFeatured;
    }
  } catch (error: any) {
    console.error('Failed to update featured status:', error);
    // Revert on error
    const destination = destinations.value.find(d => d.id === id);
    if (destination) {
      destination.isFeatured = !isFeatured;
    }
    // Optionally show error message
    alert(error.response?.data?.error?.message || 'Öne çıkan durumu güncellenirken bir hata oluştu');
  } finally {
    updatingFeatured.value = null;
  }
};

const toggleActive = async (id: string, isActive: boolean) => {
  updatingActive.value = id;
  try {
    await http.patch(`/destinations/${id}`, { isActive });
    // Update local state immediately for better UX
    const destination = destinations.value.find(d => d.id === id);
    if (destination) {
      destination.isActive = isActive;
    }
  } catch (error: any) {
    console.error('Failed to update active status:', error);
    // Revert on error
    const destination = destinations.value.find(d => d.id === id);
    if (destination) {
      destination.isActive = !isActive;
    }
    // Optionally show error message
    alert(error.response?.data?.error?.message || 'Aktif durumu güncellenirken bir hata oluştu');
  } finally {
    updatingActive.value = null;
  }
};

const openCreate = () => {
  resetForm();
  formError.value = '';
  dialog.value = true;
};

const startEdit = (destination: Destination) => {
  editingId.value = destination.id;
  
  // Reset all translations first
  availableLanguages.value.forEach(lang => {
    form.translations[lang.id] = {
      title: '',
      shortDescription: '',
      description: '',
    };
  });

  // Load translations from destination
  if (destination.translations && destination.translations.length > 0) {
    destination.translations.forEach(trans => {
      if (form.translations[trans.languageId]) {
        let description = '';
        let shortDescription = '';
        
        // Parse value field (JSON string)
        if (trans.value) {
          try {
            const valueData = JSON.parse(trans.value);
            description = valueData.description || '';
            shortDescription = valueData.shortDescription || '';
          } catch (e) {
            // If value is not JSON, treat as plain text (fallback for old data)
            description = trans.value;
          }
        }
        
        form.translations[trans.languageId] = {
          title: trans.name || '',
          description,
          shortDescription,
        };
      }
    });
  }
  
  // Set default language tab
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    selectedLanguageTab.value = defaultLang.id;
  }
  
  form.image = destination.image || '';
  form.isActive = destination.isActive ?? true;
  form.isFeatured = destination.isFeatured || false;
  form.rentacarLocationId = destination.rentacarLocationId;
  formError.value = '';
  dialog.value = true;
  formRef.value?.resetValidation();
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
  formError.value = '';
};

// File upload handler
const handleImageUpload = async () => {
  if (!imageFile.value || !(imageFile.value instanceof File)) {
    return;
  }
  
  uploadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append('file', imageFile.value);

    const { data } = await http.post('/settings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (data.url) {
      form.image = data.url; // Save URL to form
      imageFile.value = null; // Clear file input after successful upload
    }
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    const errorMessage = error.response?.data?.message || 'Görsel yüklenirken bir hata oluştu';
    formError.value = errorMessage;
  } finally {
    uploadingImage.value = false;
  }
};

// Get full image URL
const getImageUrl = (url: string): string => {
  if (!url) return '';
  // Eğer zaten full URL ise olduğu gibi döndür
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Relative URL ise - window.location.origin kullan (multi-tenant yapısında subdomain korunur)
  // Backend'de /uploads route'u express.static ile serve ediliyor
  const origin = window.location.origin;
  
  // URL zaten / ile başlıyorsa direkt ekle
  if (url.startsWith('/')) {
    return origin + url;
  }
  return origin + '/' + url;
};

// Generate AI content for destination
const generateContent = async () => {
  // Find Turkish language
  const turkishLang = availableLanguages.value.find(lang => lang.code === 'tr');
  if (!turkishLang) {
    formError.value = 'Türkçe dil bulunamadı';
    return;
  }

  const turkishTitle = form.translations[turkishLang.id]?.title?.trim();
  if (!turkishTitle) {
    formError.value = 'Lütfen önce Türkçe başlık girin';
    return;
  }

  generatingContent.value = true;
  formError.value = '';

  try {
    // Call AI content generation endpoint
    const { data } = await http.post<{
      success: boolean;
      data: {
        [languageCode: string]: {
          title: string;
          short_description: string;
          description: string;
        };
      };
    }>('/destinations/generate-content', {
      title: turkishTitle,
    });

    if (!data.success || !data.data) {
      throw new Error('İçerik oluşturulamadı');
    }

    // Fill form with generated content for all languages
    for (const [langCode, content] of Object.entries(data.data)) {
      const language = availableLanguages.value.find(lang => lang.code === langCode);
      if (language && form.translations[language.id]) {
        form.translations[language.id] = {
          title: content.title,
          shortDescription: content.short_description,
          description: content.description,
        };
      }
    }

    // Show success message or feedback
    console.log('İçerik başarıyla oluşturuldu ve form dolduruldu');
  } catch (err: any) {
    console.error('Failed to generate content:', err);
    formError.value = err.response?.data?.error?.message || err.message || 'İçerik oluşturulurken bir hata oluştu';
  } finally {
    generatingContent.value = false;
  }
};

onMounted(async () => {
  await features.initialize();
  await loadLanguages();
  await loadRentacarLocations();
  // Load destinations after languages are loaded so we can find Turkish language
  await loadDestinations();
});
</script>
