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
    <v-dialog v-model="showBlogDialog" fullscreen scrollable>
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
                    >
                      <template v-if="lang.code === 'tr' && blogForm.translations[lang.id].title && hasAiFeature" #append-inner>
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
                      <template v-else-if="lang.code === 'tr' && blogForm.translations[lang.id].title && !hasAiFeature" #append-inner>
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
                    <label class="text-body-2 text-medium-emphasis mb-2 d-block">İçerik ({{ lang.name }}) <span class="text-error">*</span></label>
                    <TinyMceEditor
                      v-model="blogForm.translations[lang.id].content"
                      :height="500"
                      :dialog-visible="showBlogDialog"
                      placeholder="Blog içeriği girin..."
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
                    v-if="blogForm.image"
                    :src="getImageUrl(blogForm.image)"
                    max-height="200"
                    max-width="300"
                    contain
                    class="mt-2 rounded"
                  />
                </div>
              </v-col>
            </v-row>
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
import TinyMceEditor from '../components/TinyMceEditor.vue';
import { useFeaturesStore } from '../stores/features';
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
const features = useFeaturesStore();
const hasAiFeature = computed(() => features.initialized && features.hasFeature('ai'));

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
  image: '',
});

const imageFile = ref<File | null>(null);
const uploadingImage = ref(false);
const generatingContent = ref(false);

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
  
  // locations.value'nin array olduğundan emin ol
  if (Array.isArray(locations.value)) {
    locations.value.forEach(location => {
      const locationName = getLocationName(location);
      options.push({
        label: locationName,
        value: location.id,
      });
    });
  }
  
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
  if (!Array.isArray(availableLanguages.value) || availableLanguages.value.length === 0) {
    return location.name || 'Lokasyon';
  }
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
    const { data } = await http.get<{ success?: boolean; data?: any[] }>('/languages');
    // Backend response formatını kontrol et
    const languages = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    availableLanguages.value = languages.filter((lang: any) => lang.isActive);
  } catch (error) {
    console.error('Failed to load languages:', error);
    availableLanguages.value = []; // Hata durumunda boş array
  }
};

const loadLocations = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get<{ success?: boolean; data?: LocationDto[] }>('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });
    // Backend response formatını kontrol et
    locations.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to load locations:', error);
    locations.value = []; // Hata durumunda boş array
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
    
    const { data } = await http.get<{ success: boolean; data: BlogDto[] }>('/blogs', { params });
    // Backend { success: true, data: [...] } formatında dönüyor
    blogs.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to load blogs:', error);
    blogs.value = []; // Hata durumunda boş array
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
  // availableLanguages.value'nin array olduğundan emin ol
  if (!Array.isArray(availableLanguages.value) || availableLanguages.value.length === 0) {
    blogForm.translations = {};
    blogLanguageTab.value = '';
    return;
  }
  
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
  blogForm.image = '';
  imageFile.value = null;
  uploadingImage.value = false;
  generatingContent.value = false;
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
    // availableLanguages.value'nin array olduğundan emin ol
    if (!Array.isArray(availableLanguages.value) || availableLanguages.value.length === 0) {
      alert('Dil listesi yüklenemedi. Lütfen sayfayı yenileyin.');
      return;
    }
    
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
      image: blogForm.image || undefined,
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
  
  // availableLanguages.value'nin array olduğundan emin ol
  if (!Array.isArray(availableLanguages.value) || availableLanguages.value.length === 0) {
    alert('Dil listesi yüklenemedi. Lütfen sayfayı yenileyin.');
    return;
  }
  
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
  blogForm.image = (blog as any).image || '';
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
      blogForm.image = data.url;
      imageFile.value = null;
    }
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    const errorMessage = error.response?.data?.message || 'Görsel yüklenirken bir hata oluştu';
    alert(errorMessage);
  } finally {
    uploadingImage.value = false;
  }
};

// Get full image URL
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const origin = window.location.origin;
  if (url.startsWith('/')) {
    return origin + url;
  }
  return origin + '/' + url;
};

// Generate AI content for blog
const generateContent = async () => {
  const turkishLang = availableLanguages.value.find(lang => lang.code === 'tr');
  if (!turkishLang) {
    alert('Türkçe dil bulunamadı');
    return;
  }

  const turkishTitle = blogForm.translations[turkishLang.id]?.title?.trim();
  if (!turkishTitle) {
    alert('Lütfen önce Türkçe başlık girin');
    return;
  }

  generatingContent.value = true;

  try {
    const { data } = await http.post<{
      success: boolean;
      data: {
        [languageCode: string]: {
          title: string;
          content: string;
        };
      };
    }>('/blogs/generate-content', {
      title: turkishTitle,
    });

    if (!data.success || !data.data) {
      throw new Error('İçerik oluşturulamadı');
    }

    // Slugify helper
    const slugify = (text: string): string => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    // Fill form with generated content for all languages
    for (const [langCode, content] of Object.entries(data.data)) {
      const language = availableLanguages.value.find(lang => lang.code === langCode);
      if (language && blogForm.translations[language.id]) {
        blogForm.translations[language.id] = {
          title: content.title,
          slug: blogForm.translations[language.id].slug || slugify(content.title),
          content: content.content,
        };
      }
    }

    console.log('İçerik başarıyla oluşturuldu ve form dolduruldu');
  } catch (err: any) {
    console.error('Failed to generate content:', err);
    const errorMessage = err.response?.data?.error?.message || err.message || 'İçerik oluşturulurken bir hata oluştu';
    alert(errorMessage);
  } finally {
    generatingContent.value = false;
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
    if (!Array.isArray(availableLanguages.value) || availableLanguages.value.length === 0) return '';
    const defaultLang = availableLanguages.value.find(l => l.isDefault);
    if (!defaultLang) return '';
    return blogForm.translations[defaultLang.id]?.content || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    if (!Array.isArray(availableLanguages.value) || availableLanguages.value.length === 0) return;
    
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
  if (Array.isArray(availableLanguages.value) && availableLanguages.value.length > 0) {
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
  }
});
</script>

<style scoped>
</style>

