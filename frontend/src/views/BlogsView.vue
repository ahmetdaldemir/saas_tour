<template>
  <div>
    <v-card elevation="2" class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-bold">Blog Yazıları</span>
        <div class="d-flex align-center gap-2">
          <v-select
            v-model="selectedLocationId"
            :items="locationOptions"
            item-title="label"
            item-value="value"
            label="Lokasyon Filtresi"
            prepend-inner-icon="mdi-map-marker"
            style="max-width: 250px;"
            density="compact"
            @update:model-value="loadBlogs"
          />
          <v-btn icon="mdi-refresh" variant="text" @click="loadBlogs" :loading="loadingBlogs" />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
            Yeni Blog Yazısı
          </v-btn>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          :headers="tableHeaders"
          :items="blogs"
          :loading="loadingBlogs"
          item-value="id"
          class="elevation-0"
        >
          <template #item.title="{ item }">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-file-document" size="20" color="primary" />
              <span class="font-weight-medium">{{ item.title }}</span>
            </div>
          </template>

          <template #item.location="{ item }">
            <v-chip v-if="item.location" size="small" color="info" variant="tonal">
              {{ getLocationName(item.location) }}
            </v-chip>
            <v-chip v-else size="small" color="success" variant="tonal">
              Genel
            </v-chip>
          </template>

          <template #item.status="{ item }">
            <v-chip 
              size="small" 
              :color="getStatusColor(item.status)" 
              variant="flat"
            >
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>

          <template #item.publishedAt="{ item }">
            <span v-if="item.publishedAt">{{ formatDate(item.publishedAt) }}</span>
            <span v-else class="text-grey">-</span>
          </template>

          <template #item.actions="{ item }">
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="editBlog(item)" />
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteBlog(item.id)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Blog Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showBlogDialog" max-width="1200" fullscreen scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-file-document" size="24" />
            <span class="text-h6">{{ editingBlog ? 'Blog Yazısı Düzenle' : 'Yeni Blog Yazısı' }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeBlogDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-form ref="blogFormRef" v-model="blogFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="blogForm.locationId"
                  :items="locationOptions"
                  item-title="label"
                  item-value="value"
                  label="Lokasyon"
                  prepend-inner-icon="mdi-map-marker"
                  hint="Genel seçilirse tüm lokasyonlar için geçerli olur"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="blogForm.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Durum"
                  prepend-inner-icon="mdi-check-circle"
                />
              </v-col>
            </v-row>

            <v-tabs v-model="blogLanguageTab" class="mb-4">
              <v-tab
                v-for="lang in availableLanguages"
                :key="lang.id"
                :value="lang.id"
              >
                <v-icon start icon="mdi-translate" />
                {{ lang.name }}
                <v-chip
                  v-if="lang.isDefault"
                  size="x-small"
                  color="primary"
                  class="ml-2"
                >
                  Varsayılan
                </v-chip>
              </v-tab>
            </v-tabs>

            <v-window v-model="blogLanguageTab">
              <v-window-item
                v-for="lang in availableLanguages"
                :key="lang.id"
                :value="lang.id"
              >
                <v-row>
                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="blogForm.translations[lang.id].title"
                      :label="`Başlık (${lang.name})`"
                      prepend-inner-icon="mdi-format-title"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="blogForm.translations[lang.id].slug"
                      :label="`Slug (URL) - ${lang.name}`"
                      prepend-inner-icon="mdi-link"
                      hint="Boş bırakılırsa başlıktan otomatik oluşturulur"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="blogForm.translations[lang.id].content"
                      :label="`İçerik (${lang.name})`"
                      prepend-inner-icon="mdi-text"
                      rows="15"
                      required
                    />
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeBlogDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveBlog" :loading="savingBlog" :disabled="!blogFormValid">
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

// Interfaces
interface LocationDto {
  id: string;
  translations?: Array<{
    id: string;
    languageId: string;
    languageCode: string;
    name: string;
    metaTitle?: string;
  }>;
  name?: string;
  province?: string;
  district?: string;
  parentRegion?: string;
}

interface BlogTranslationDto {
  id: string;
  blogId: string;
  languageId: string;
  languageCode?: string;
  title: string;
  slug?: string;
  content: string;
}

interface BlogDto {
  id: string;
  tenantId: string;
  locationId?: string | null;
  location?: LocationDto | null;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  translations?: BlogTranslationDto[];
}

const auth = useAuthStore();

// Data
const blogs = ref<BlogDto[]>([]);
const locations = ref<LocationDto[]>([]);
const availableLanguages = ref<Array<{ id: string; code: string; name: string; isDefault?: boolean }>>([]);

// UI State
const showBlogDialog = ref(false);
const loadingBlogs = ref(false);
const savingBlog = ref(false);
const selectedLocationId = ref<string | null>('all');
const editingBlog = ref<BlogDto | null>(null);
const blogLanguageTab = ref<string>('');

// Form Refs
const blogFormRef = ref();
const blogFormValid = ref(false);

// Forms
const blogForm = reactive({
  translations: {} as Record<string, { title: string; slug: string; content: string }>,
  locationId: null as string | null,
  status: 'draft' as 'draft' | 'published' | 'archived',
});

// Options
const statusOptions = [
  { label: 'Taslak', value: 'draft' },
  { label: 'Yayınlandı', value: 'published' },
  { label: 'Arşivlendi', value: 'archived' },
];

const locationOptions = computed(() => {
  const options = [
    { label: 'Genel (Tüm Lokasyonlar)', value: 'general' },
  ];
  
  locations.value.forEach(location => {
    const locationName = getLocationName(location);
    options.push({
      label: locationName,
      value: location.id,
    });
  });
  
  return options;
});

// Table headers
const tableHeaders = [
  { title: 'Başlık', key: 'title' },
  { title: 'Lokasyon', key: 'location' },
  { title: 'Durum', key: 'status', sortable: false },
  { title: 'Yayın Tarihi', key: 'publishedAt' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

// Methods
const getLocationName = (location: LocationDto): string => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang || !location.translations) return location.name || 'Lokasyon';
  const translation = location.translations.find(t => t.languageId === defaultLang.id);
  return translation?.name || location.name || 'Lokasyon';
};

const getStatusLabel = (status: string): string => {
  const option = statusOptions.find(o => o.value === status);
  return option?.label || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'warning',
    published: 'success',
    archived: 'grey',
  };
  return colors[status] || 'grey';
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

const loadLanguages = async () => {
  try {
    const { data } = await http.get('/languages');
    availableLanguages.value = data.filter((lang: any) => lang.isActive);
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

const loadLocations = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get<LocationDto[]>('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });
    locations.value = data;
  } catch (error) {
    console.error('Failed to load locations:', error);
  }
};

const loadBlogs = async () => {
  if (!auth.tenant) return;
  loadingBlogs.value = true;
  try {
    const params: any = { tenantId: auth.tenant.id };
    if (selectedLocationId.value && selectedLocationId.value !== 'all') {
      params.locationId = selectedLocationId.value === 'general' ? null : selectedLocationId.value;
    }
    
    const { data } = await http.get<BlogDto[]>('/blogs', { params });
    blogs.value = data;
  } catch (error) {
    console.error('Failed to load blogs:', error);
  } finally {
    loadingBlogs.value = false;
  }
};

const openCreateDialog = () => {
  editingBlog.value = null;
  resetBlogForm();
  showBlogDialog.value = true;
};

const closeBlogDialog = () => {
  showBlogDialog.value = false;
  resetBlogForm();
};

const resetBlogForm = () => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  blogLanguageTab.value = defaultLang?.id || '';
  
  blogForm.translations = {};
  availableLanguages.value.forEach(lang => {
    blogForm.translations[lang.id] = {
      title: '',
      slug: '',
      content: '',
    };
  });
  
  blogForm.locationId = null;
  blogForm.status = 'draft';
};

const saveBlog = async () => {
  if (!auth.tenant) return;
  
  const validated = await blogFormRef.value?.validate();
  if (!validated?.valid) return;
  
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang) {
    alert('Varsayılan dil bulunamadı');
    return;
  }
  
  const defaultTranslation = blogForm.translations[defaultLang.id];
  if (!defaultTranslation || !defaultTranslation.title || !defaultTranslation.content) {
    alert('Varsayılan dilde başlık ve içerik gerekli');
    return;
  }
  
  savingBlog.value = true;
  try {
    const translations = availableLanguages.value.map(lang => ({
      languageId: lang.id,
      title: blogForm.translations[lang.id]?.title || '',
      slug: blogForm.translations[lang.id]?.slug || undefined,
      content: blogForm.translations[lang.id]?.content || '',
    }));
    
    const blogData = {
      tenantId: auth.tenant.id,
      title: defaultTranslation.title,
      slug: defaultTranslation.slug || undefined,
      content: defaultTranslation.content,
      locationId: blogForm.locationId === 'general' ? null : blogForm.locationId,
      status: blogForm.status,
      translations,
    };
    
    if (editingBlog.value) {
      await http.put(`/blogs/${editingBlog.value.id}`, blogData);
    } else {
      await http.post('/blogs', blogData);
    }
    
    await loadBlogs();
    closeBlogDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Blog kaydedilirken bir hata oluştu');
  } finally {
    savingBlog.value = false;
  }
};

const editBlog = (blog: BlogDto) => {
  editingBlog.value = blog;
  
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  blogLanguageTab.value = defaultLang?.id || '';
  
  blogForm.translations = {};
  availableLanguages.value.forEach(lang => {
    const translation = blog.translations?.find(t => t.languageId === lang.id);
    blogForm.translations[lang.id] = {
      title: translation?.title || blog.title || '',
      slug: translation?.slug || blog.slug || '',
      content: translation?.content || blog.content || '',
    };
  });
  
  blogForm.locationId = blog.locationId || 'general';
  blogForm.status = blog.status;
  showBlogDialog.value = true;
};

const deleteBlog = async (id: string) => {
  if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/blogs/${id}`);
    await loadBlogs();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Blog silinirken bir hata oluştu');
  }
};

// Watch for automatic translation of title
watch(
  () => {
    const defaultLang = availableLanguages.value.find(l => l.isDefault);
    if (!defaultLang) return '';
    return blogForm.translations[defaultLang.id]?.title || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    
    const defaultLang = availableLanguages.value.find(l => l.isDefault);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        if (blogForm.translations[lang.id]?.title && blogForm.translations[lang.id].title !== '') continue;
        
        try {
          const translated = await translateText(newValue, lang.code, defaultLang.code);
          if (blogForm.translations[lang.id]) {
            blogForm.translations[lang.id].title = translated;
          }
        } catch (error) {
          console.error(`Failed to translate title to ${lang.code}:`, error);
        }
      }
    }, 1500);
  }
);

// Watch for automatic translation of content
watch(
  () => {
    const defaultLang = availableLanguages.value.find(l => l.isDefault);
    if (!defaultLang) return '';
    return blogForm.translations[defaultLang.id]?.content || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    
    const defaultLang = availableLanguages.value.find(l => l.isDefault);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        if (blogForm.translations[lang.id]?.content && blogForm.translations[lang.id].content !== '') continue;
        
        try {
          const translated = await translateText(newValue, lang.code, defaultLang.code);
          if (blogForm.translations[lang.id]) {
            blogForm.translations[lang.id].content = translated;
          }
        } catch (error) {
          console.error(`Failed to translate content to ${lang.code}:`, error);
        }
      }
    }, 2000);
  }
);

onMounted(async () => {
  await Promise.all([
    loadLanguages(),
    loadLocations(),
    loadBlogs(),
  ]);
  
  // Initialize form after languages are loaded
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    blogLanguageTab.value = defaultLang.id;
    
    availableLanguages.value.forEach(lang => {
      blogForm.translations[lang.id] = {
        title: '',
        slug: '',
        content: '',
      };
    });
  }
});
</script>

<style scoped>
</style>

