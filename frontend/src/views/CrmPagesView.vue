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

          <template #item.isPublished="{ item }">
            <v-chip
              size="small"
              :color="item.isPublished ? 'success' : 'warning'"
              variant="flat"
            >
              {{ item.isPublished ? 'Yayında' : 'Taslak' }}
            </v-chip>
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
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="pageForm.slug"
                    label="Slug (URL)"
                    prepend-inner-icon="mdi-link"
                    hint="URL-friendly identifier (otomatik oluşturulur)"
                    persistent-hint
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="pageForm.image"
                    label="Resim URL"
                    prepend-inner-icon="mdi-image"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="pageForm.isActive"
                    label="Aktif"
                    color="success"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="pageForm.isPublished"
                    label="Yayında"
                    color="primary"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="4">
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

// Form Refs
const pageFormRef = ref();
const pageFormValid = ref(false);

// Form
const pageForm = reactive<{
  categoryId: string;
  slug: string;
  image: string;
  isActive: boolean;
  isPublished: boolean;
  sortOrder: number;
  titleTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
}>({
  categoryId: '',
  slug: '',
  image: '',
  isActive: true,
  isPublished: false,
  sortOrder: 0,
  titleTranslations: {},
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
  { title: 'Yayın Durumu', key: 'isPublished', sortable: false, width: '120px' },
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
  pageForm.slug = '';
  pageForm.image = '';
  pageForm.isActive = true;
  pageForm.isPublished = false;
  pageForm.sortOrder = 0;
  pageForm.titleTranslations = {};
  pageForm.descriptionTranslations = {};
  
  // Initialize translations for all languages
  availableLanguages.value.forEach(lang => {
    pageForm.titleTranslations[lang.id] = '';
    pageForm.descriptionTranslations[lang.id] = '';
  });
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
    
    const pageData = {
      tenantId: auth.tenant.id,
      categoryId: pageForm.categoryId,
      slug,
      image: pageForm.image || undefined,
      isActive: pageForm.isActive,
      isPublished: pageForm.isPublished,
      sortOrder: pageForm.sortOrder || 0,
      translations: availableLanguages.value.map(lang => ({
        languageId: lang.id,
        title: pageForm.titleTranslations[lang.id] || '',
        description: pageForm.descriptionTranslations[lang.id] || '',
      })),
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
  pageForm.slug = page.slug;
  pageForm.image = page.image || '';
  pageForm.isActive = page.isActive;
  pageForm.isPublished = page.isPublished;
  pageForm.sortOrder = page.sortOrder || 0;
  
  // Set translations
  if (page.translations) {
    page.translations.forEach(trans => {
      pageForm.titleTranslations[trans.languageId] = trans.name || '';
      pageForm.descriptionTranslations[trans.languageId] = trans.value || '';
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

