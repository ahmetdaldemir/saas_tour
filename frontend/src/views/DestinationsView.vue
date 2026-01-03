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
        <v-btn color="primary" prepend-icon="mdi-map-plus" @click="openCreate">
          Yeni Destinasyon
        </v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="destinations.map(d => ({ ...d, displayName: getDisplayName(d) }))"
        :loading="loading"
        item-key="id"
        density="comfortable"
        class="elevation-0"
      >
        <template #item.displayName="{ item }">
          <span class="font-weight-medium">{{ getDisplayName(item) }}</span>
        </template>
        <template #item.isFeatured="{ item }">
          <v-chip v-if="item.isFeatured" color="primary" size="small">Öne Çıkan</v-chip>
          <span v-else class="text-medium-emphasis">-</span>
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

    <v-dialog v-model="dialog" max-width="800" persistent>
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
                    <v-textarea
                      v-model="form.translations[lang.id].description"
                      label="Açıklama"
                      prepend-inner-icon="mdi-text"
                      rows="4"
                      hint="Detaylı açıklama (isteğe bağlı)"
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
  isFeatured: boolean;
  translations?: Translation[];
}

interface Language {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

const headers = [
  { title: 'Ad', key: 'displayName' },
  { title: 'Öne Çıkan', key: 'isFeatured' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const destinations = ref<Destination[]>([]);
const availableLanguages = ref<Language[]>([]);
const loading = ref(false);
const submitting = ref(false);
const removing = ref<string | null>(null);
const formError = ref('');
const formRef = ref();
const isValid = ref(false);
const editingId = ref<string | null>(null);
const dialog = ref(false);
const selectedLanguageTab = ref<string>('');

const form = reactive({
  translations: {} as Record<string, TranslationForm>,
  image: '',
  isFeatured: false,
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
  form.isFeatured = false;
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
      isFeatured: form.isFeatured,
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
  form.isFeatured = destination.isFeatured || false;
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
  // Load destinations after languages are loaded so we can find Turkish language
  await loadDestinations();
});
</script>
