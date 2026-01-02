<template>
  <div>
    <v-card elevation="2" class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
        <span class="text-h6 font-weight-bold">CRM Sayfalar</span>
        <div class="d-flex align-center gap-2">
          <v-btn icon="mdi-refresh" variant="text" @click="loadPages" :loading="loadingPages" />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openPageDialog">
            Yeni Sayfa Ekle
          </v-btn>
        </div>
      </v-card-title>
      <v-divider />
      
      <!-- Kategori Filtresi -->
      <v-card-text class="pb-2">
        <v-chip-group v-model="selectedCategoryId" mandatory>
          <v-chip
            :value="null"
            filter
            variant="outlined"
          >
            Tümü
          </v-chip>
          <v-chip
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
            filter
            variant="outlined"
          >
            {{ getCategoryName(category) }}
          </v-chip>
        </v-chip-group>
      </v-card-text>

      <v-divider />
      
      <!-- Sayfalar Tablosu -->
      <v-card-text class="pa-0">
        <v-data-table
          :headers="pageTableHeaders"
          :items="filteredPages"
          :loading="loadingPages"
          item-value="id"
          class="elevation-0"
          density="compact"
        >
          <template #item.index="{ index }">
            <span>{{ index + 1 }}</span>
          </template>

          <template #item.category="{ item }">
            <span class="font-weight-medium">{{ getCategoryName(item.category) }}</span>
          </template>

          <template #item.title="{ item }">
            <span class="font-weight-medium">{{ getPageTitle(item) }}</span>
          </template>

          <template #item.image="{ item }">
            <v-avatar v-if="item.image" size="40" rounded>
              <v-img :src="item.image" :alt="getPageTitle(item)" />
            </v-avatar>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <template #item.isActive="{ item }">
            <v-chip
              size="small"
              :color="item.isActive ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.isActive ? 'Aktif' : 'Pasif' }}
            </v-chip>
          </template>

          <template #item.viewCount="{ item }">
            <span>{{ item.viewCount || 0 }}</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex align-center gap-1 justify-end" @click.stop>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="primary"
                @click.stop="editPage(item)"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click.stop="deletePage(item.id)"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Sayfa Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showPageDialog" max-width="1200" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-file-document-plus" size="24" />
            <span class="text-h6">{{ editingPage ? 'Sayfa Düzenle' : 'Yeni Sayfa Ekle' }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closePageDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-form ref="pageFormRef" v-model="pageFormValid">
            <div class="pa-6">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="pageForm.categoryId"
                    :items="categoryOptions"
                    item-title="label"
                    item-value="value"
                    label="Kategori"
                    prepend-inner-icon="mdi-folder"
                    :loading="loadingCategories"
                    class="mb-2"
                  />
                  <v-btn
                    variant="text"
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="openCategoryDialog"
                    class="mt-1"
                  >
                    Yeni Kategori Oluştur
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <div>
                    <v-file-input
                      v-model="imageFile"
                      label="Resim Yükle"
                      prepend-inner-icon="mdi-image"
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
                      class="mb-2"
                    />
                    <v-btn
                      v-if="imageFile && !uploadingImage"
                      color="primary"
                      size="small"
                      prepend-icon="mdi-upload"
                      @click="handleImageUpload"
                      class="mt-2"
                    >
                      Resim Yükle
                    </v-btn>
                    <v-progress-linear
                      v-if="uploadingImage"
                      indeterminate
                      color="primary"
                      class="mt-2"
                    />
                    <v-img
                      v-if="pageForm.image"
                      :src="getImageUrl(pageForm.image)"
                      max-height="200"
                      max-width="300"
                      contain
                      class="mt-2 rounded"
                    />
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="pageForm.isActive"
                    label="Aktif"
                    color="success"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="pageForm.sortOrder"
                    label="Sıralama"
                    type="number"
                    prepend-inner-icon="mdi-sort"
                    class="mb-2"
                  />
                </v-col>
              </v-row>

              <!-- Başlık - Dil Sekmeleri -->
              <div class="mt-4">
                <label class="text-body-1 font-weight-medium mb-2 d-block">Başlık</label>
                <v-tabs v-model="titleLanguageTab" show-arrows>
                  <v-tab
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    {{ lang.name }}
                  </v-tab>
                </v-tabs>
                <v-window v-model="titleLanguageTab">
                  <v-window-item
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    <v-text-field
                      v-model="pageForm.titleTranslations[lang.id]"
                      :label="`Başlık (${lang.name})`"
                      prepend-inner-icon="mdi-format-title"
                      class="mt-2"
                      @update:model-value="() => autoGenerateSlug(lang.id)"
                    />
                    <v-text-field
                      v-model="pageForm.slugTranslations[lang.id]"
                      :label="`Slug (${lang.name})`"
                      prepend-inner-icon="mdi-link"
                      hint="Otomatik oluşturulur, isterseniz düzenleyebilirsiniz"
                      persistent-hint
                      class="mt-2"
                    />
                  </v-window-item>
                </v-window>
              </div>

              <!-- Açıklama - Dil Sekmeleri -->
              <div class="mt-4">
                <label class="text-body-1 font-weight-medium mb-2 d-block">Açıklama</label>
                <v-tabs v-model="descriptionLanguageTab" show-arrows>
                  <v-tab
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    {{ lang.name }}
                  </v-tab>
                </v-tabs>
                <v-window v-model="descriptionLanguageTab">
                  <v-window-item
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    <v-textarea
                      v-model="pageForm.descriptionTranslations[lang.id]"
                      :label="`Açıklama (${lang.name})`"
                      prepend-inner-icon="mdi-text"
                      rows="6"
                      class="mt-2"
                    />
                  </v-window-item>
                </v-window>
              </div>
            </div>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closePageDialog">Kapat</v-btn>
          <v-btn color="primary" @click="savePage" :loading="savingPage" :disabled="!pageFormValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Kategori Ekleme Dialog -->
    <v-dialog v-model="showCategoryDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-folder-plus" size="24" />
            <span class="text-h6">Yeni Kategori Oluştur</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeCategoryDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <div>
            <label class="text-body-1 font-weight-medium mb-2 d-block">Kategori Adı</label>
            <v-tabs v-model="categoryLanguageTab" show-arrows>
              <v-tab
                v-for="lang in availableLanguages"
                :key="lang.id"
                :value="lang.id"
              >
                {{ lang.name }}
              </v-tab>
            </v-tabs>
            <v-window v-model="categoryLanguageTab">
              <v-window-item
                v-for="lang in availableLanguages"
                :key="lang.id"
                :value="lang.id"
              >
                <v-text-field
                  v-model="categoryForm.translations[lang.id]"
                  :label="`Kategori Adı (${lang.name})`"
                  prepend-inner-icon="mdi-folder"
                  class="mt-2"
                />
              </v-window-item>
            </v-window>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeCategoryDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveCategory" :loading="savingCategory">
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

const auth = useAuthStore();

// Data
const availableLanguages = ref<LanguageDto[]>([]);
const pages = ref<CrmPageDto[]>([]);
const categories = ref<CrmPageCategoryDto[]>([]);
const selectedCategoryId = ref<string | null>(null);

// UI State
const loadingPages = ref(false);
const loadingCategories = ref(false);
const showPageDialog = ref(false);
const savingPage = ref(false);
const editingPage = ref<CrmPageDto | null>(null);
const titleLanguageTab = ref('');
const descriptionLanguageTab = ref('');
const showCategoryDialog = ref(false);
const savingCategory = ref(false);
const categoryLanguageTab = ref('');
const imageFile = ref<File | null>(null);
const uploadingImage = ref(false);
const categoryForm = reactive<{
  translations: Record<string, string>;
}>({
  translations: {},
});

// Form Refs
const pageFormRef = ref();
const pageFormValid = ref(false);

// Form
const pageForm = reactive<{
  categoryId: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  titleTranslations: Record<string, string>;
  slugTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
}>({
  categoryId: '',
  image: '',
  isActive: true,
  sortOrder: 0,
  titleTranslations: {},
  slugTranslations: {},
  descriptionTranslations: {},
});

// Interfaces
interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface CrmPageCategoryDto {
  id: string;
  slug: string;
  isActive: boolean;
  translations?: Array<{ languageId: string; name: string }>;
}

interface CrmPageDto {
  id: string;
  categoryId: string;
  category?: CrmPageCategoryDto;
  slug: string;
  image?: string;
  isActive: boolean;
  isPublished: boolean;
  sortOrder: number;
  viewCount: number;
  translations?: Array<{ languageId: string; name: string; value?: string }>;
}

// Computed
const filteredPages = computed(() => {
  if (!selectedCategoryId.value) {
    return pages.value;
  }
  return pages.value.filter(page => page.categoryId === selectedCategoryId.value);
});

const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    label: getCategoryName(cat),
    value: cat.id,
  }));
});

// Table headers
const pageTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Kategori', key: 'category', width: '150px' },
  { title: 'Başlık', key: 'title', width: '250px' },
  { title: 'Resim', key: 'image', sortable: false, width: '80px' },
  { title: 'Durum', key: 'isActive', sortable: false, width: '100px' },
  { title: 'Görüntülenme', key: 'viewCount', width: '120px' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '120px' },
];

// Helper functions
const getCategoryName = (category: CrmPageCategoryDto | undefined): string => {
  if (!category) return '-';
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang && category.translations) {
    const translation = category.translations.find(t => t.languageId === defaultLang.id);
    if (translation) return translation.name;
  }
  return category.slug;
};

const getPageTitle = (page: CrmPageDto): string => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang && page.translations) {
    const translation = page.translations.find(t => t.languageId === defaultLang.id);
    if (translation) return translation.name;
  }
  return page.slug;
};

// Methods
const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
    
    // Initialize form translations
    availableLanguages.value.forEach(lang => {
      pageForm.titleTranslations[lang.id] = '';
      pageForm.descriptionTranslations[lang.id] = '';
    });
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

const loadCategories = async () => {
  if (!auth.tenant) return;
  loadingCategories.value = true;
  try {
    const { data } = await http.get<{ data: CrmPageCategoryDto[] }>('/crm/page-categories', {
      params: { tenantId: auth.tenant.id },
    });
    categories.value = data.data || [];
  } catch (error) {
    console.error('Failed to load categories:', error);
    categories.value = [];
  } finally {
    loadingCategories.value = false;
  }
};

const loadPages = async () => {
  if (!auth.tenant) return;
  loadingPages.value = true;
  try {
    const { data } = await http.get<{ data: CrmPageDto[] }>('/crm/pages', {
      params: { tenantId: auth.tenant.id },
    });
    pages.value = data.data || [];
  } catch (error) {
    console.error('Failed to load pages:', error);
    pages.value = [];
  } finally {
    loadingPages.value = false;
  }
};

const openPageDialog = () => {
  editingPage.value = null;
  resetPageForm();
  showPageDialog.value = true;
  
  // Set default language tabs
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    titleLanguageTab.value = defaultLang.id;
    descriptionLanguageTab.value = defaultLang.id;
  }
};

const closePageDialog = () => {
  showPageDialog.value = false;
  resetPageForm();
};

const resetPageForm = () => {
  pageForm.categoryId = '';
  pageForm.image = '';
  pageForm.isActive = true;
  pageForm.sortOrder = 0;
  pageForm.titleTranslations = {};
  pageForm.slugTranslations = {};
  pageForm.descriptionTranslations = {};
  imageFile.value = null;
  
  // Initialize translations for all languages
  availableLanguages.value.forEach(lang => {
    pageForm.titleTranslations[lang.id] = '';
    pageForm.slugTranslations[lang.id] = '';
    pageForm.descriptionTranslations[lang.id] = '';
  });
};

// Auto-generate slug from title
const autoGenerateSlug = (languageId: string) => {
  const title = pageForm.titleTranslations[languageId] || '';
  if (title) {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    pageForm.slugTranslations[languageId] = slug;
  }
};

// Category dialog functions
const openCategoryDialog = () => {
  categoryForm.translations = {};
  availableLanguages.value.forEach(lang => {
    categoryForm.translations[lang.id] = '';
  });
  
  // Set default language tab
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    categoryLanguageTab.value = defaultLang.id;
  }
  
  showCategoryDialog.value = true;
};

const closeCategoryDialog = () => {
  showCategoryDialog.value = false;
  categoryForm.translations = {};
};

const saveCategory = async () => {
  if (!auth.tenant) return;
  
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  const defaultName = categoryForm.translations[defaultLang?.id || ''] || '';
  
  if (!defaultName) {
    alert('Varsayılan dilde kategori adı girilmelidir');
    return;
  }
  
  try {
    const categoryData = {
      tenantId: auth.tenant.id,
      translations: availableLanguages.value.map(lang => ({
        languageId: lang.id,
        name: categoryForm.translations[lang.id] || '',
      })),
    };
    
    await http.post('/crm/page-categories', categoryData);
    await loadCategories();
    closeCategoryDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Kategori kaydedilirken bir hata oluştu');
  }
};

// Image upload handler
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
      pageForm.image = data.url; // Save URL to form
      imageFile.value = null;
    } else {
      throw new Error('Upload response missing URL');
    }
  } catch (error: any) {
    console.error('Image upload error:', error);
    alert(error.response?.data?.message || 'Resim yüklenirken bir hata oluştu');
  } finally {
    uploadingImage.value = false;
  }
};

// Get image URL (handle both relative and absolute URLs)
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Relative URL - prepend base URL if needed
  return url.startsWith('/') ? url : `/${url}`;
};

const savePage = async () => {
  if (!auth.tenant) return;
  
  const validated = await pageFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingPage.value = true;
  try {
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    const defaultTitle = pageForm.titleTranslations[defaultLang?.id || ''] || '';
    
    if (!defaultTitle) {
      alert('Varsayılan dilde başlık girilmelidir');
      return;
    }
    
    if (!pageForm.categoryId) {
      alert('Kategori seçilmelidir');
      return;
    }
    
    // Auto-generate slug if not provided
    const slug = pageForm.slug || defaultTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check if we need to create category
    let categoryId = pageForm.categoryId;
    if (!categoryId && Object.keys(categoryForm.translations).length > 0) {
      // Create category first
      const categoryData = {
        tenantId: auth.tenant.id,
        categoryTranslations: availableLanguages.value.map(lang => ({
          languageId: lang.id,
          name: categoryForm.translations[lang.id] || '',
        })),
      };
      const { data: newCategory } = await http.post('/crm/page-categories', categoryData);
      categoryId = newCategory.data.id;
      await loadCategories();
    }
    
    const pageData = {
      tenantId: auth.tenant.id,
      categoryId,
      image: pageForm.image || undefined,
      isActive: pageForm.isActive,
      sortOrder: pageForm.sortOrder || 0,
      translations: availableLanguages.value.map(lang => {
        // Ensure slug is generated if not set
        if (!pageForm.slugTranslations[lang.id] && pageForm.titleTranslations[lang.id]) {
          autoGenerateSlug(lang.id);
        }
        return {
          languageId: lang.id,
          title: pageForm.titleTranslations[lang.id] || '',
          slug: pageForm.slugTranslations[lang.id] || '',
          description: pageForm.descriptionTranslations[lang.id] || '',
        };
      }),
    };
    
    if (editingPage.value) {
      await http.put(`/crm/pages/${editingPage.value.id}`, pageData);
    } else {
      await http.post('/crm/pages', pageData);
    }
    
    await loadPages();
    closePageDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Sayfa kaydedilirken bir hata oluştu');
  } finally {
    savingPage.value = false;
  }
};

const editPage = (page: CrmPageDto) => {
  editingPage.value = page;
  resetPageForm();
  
  // Set form values
  pageForm.categoryId = page.categoryId;
  pageForm.image = page.image || '';
  pageForm.isActive = page.isActive;
  pageForm.sortOrder = page.sortOrder || 0;
  
  // Set translations and extract slug from value (JSON)
  if (page.translations) {
    page.translations.forEach(trans => {
      pageForm.titleTranslations[trans.languageId] = trans.name || '';
      pageForm.descriptionTranslations[trans.languageId] = '';
      
      // Try to parse value as JSON to get description and slug
      if (trans.value) {
        try {
          const valueData = JSON.parse(trans.value);
          if (valueData.description) {
            pageForm.descriptionTranslations[trans.languageId] = valueData.description;
          }
          if (valueData.slug) {
            pageForm.slugTranslations[trans.languageId] = valueData.slug;
          }
        } catch {
          // Not JSON, treat as plain description
          pageForm.descriptionTranslations[trans.languageId] = trans.value || '';
        }
      }
      
      // If no slug found, generate from title
      if (!pageForm.slugTranslations[trans.languageId] && trans.name) {
        pageForm.slugTranslations[trans.languageId] = trans.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
      }
    });
  }
  
  // Set default language tabs
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    titleLanguageTab.value = defaultLang.id;
    descriptionLanguageTab.value = defaultLang.id;
  }
  
  showPageDialog.value = true;
};

const deletePage = async (id: string) => {
  if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return;
  if (!auth.tenant) return;
  
  try {
    await http.delete(`/crm/pages/${id}`);
    await loadPages();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Sayfa silinirken bir hata oluştu');
  }
};

onMounted(async () => {
  await Promise.all([
    loadLanguages(),
    loadCategories(),
    loadPages(),
  ]);
});
</script>

<style scoped>
</style>

