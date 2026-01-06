<template>
  <div>
    <v-card elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-clipboard-text" class="mr-2" />
          <span class="text-h5 font-weight-bold">Anketler</span>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Yeni Anket Ekle
        </v-btn>
      </v-card-title>
      <v-divider />

      <!-- Dil Tabları -->
      <v-tabs v-model="selectedLanguageTab" show-arrows>
        <v-tab value="all">
          <v-icon start icon="mdi-translate" />
          Tüm Diller
        </v-tab>
        <v-tab
          v-for="lang in languages"
          :key="lang.id"
          :value="lang.id"
        >
          <v-chip
            :color="lang.isDefault ? 'primary' : 'default'"
            size="small"
            variant="tonal"
            class="mr-2"
          >
            {{ lang.code }}
          </v-chip>
          {{ lang.name }}
        </v-tab>
      </v-tabs>
      <v-divider />

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="filteredSurveys"
          :loading="loading"
          density="comfortable"
        >
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              variant="flat"
            >
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>
          <template #item.isActive="{ item }">
            <v-chip
              :color="item.isActive ? 'success' : 'grey'"
              size="small"
              variant="tonal"
            >
              {{ item.isActive ? 'Aktif' : 'Pasif' }}
            </v-chip>
          </template>
          <template #item.autoSend="{ item }">
            <v-icon
              :icon="item.autoSend ? 'mdi-check-circle' : 'mdi-close-circle'"
              :color="item.autoSend ? 'success' : 'grey'"
              size="small"
            />
          </template>
          <template #item.language="{ item }">
            <v-chip
              v-if="item.language"
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ item.language.name || item.language.code }}
            </v-chip>
            <span v-else class="text-caption text-medium-emphasis">Tüm Diller</span>
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editSurvey(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deleteSurvey(item.id)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="1200" scrollable persistent>
      <v-card>
        <v-card-title>
          {{ editingSurvey ? 'Anket Düzenle' : 'Yeni Anket Ekle' }}
        </v-card-title>
        <v-divider />
        
        <!-- Ortak Ayarlar -->
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="form.status"
                :items="statusOptions"
                label="Durum"
                item-title="label"
                item-value="value"
                
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-switch
                v-model="form.isActive"
                label="Aktif"
                color="primary"
                class="mt-4"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-switch
                v-model="form.autoSend"
                label="Otomatik Gönder"
                color="primary"
                class="mt-4"
              />
            </v-col>
            <v-col cols="12" md="6" v-if="form.autoSend">
              <v-text-field
                v-model.number="form.sendAfterDays"
                label="Kaç Gün Sonra Gönderilsin?"
                type="number"
                min="0"
                
                density="comfortable"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <!-- Dil Tabları -->
        <v-tabs v-model="formLanguageTab" show-arrows>
          <v-tab
            v-for="lang in languages"
            :key="lang.id"
            :value="lang.id"
          >
            <v-chip
              :color="lang.isDefault ? 'primary' : 'default'"
              size="small"
              variant="tonal"
              class="mr-2"
            >
              {{ lang.code }}
            </v-chip>
            {{ lang.name }}
          </v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-window v-model="formLanguageTab">
              <v-window-item
                v-for="lang in languages"
                :key="lang.id"
                :value="lang.id"
              >
                <v-row v-if="formByLanguage[lang.id]">
                  <v-col cols="12">
                    <v-text-field
                      v-model="formByLanguage[lang.id].title"
                      label="Anket Başlığı"
                      :rules="[(v: string) => !!v || 'Başlık gereklidir']"
                      required
                      
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="formByLanguage[lang.id].description"
                      label="Açıklama"
                      rows="3"
                      
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="formByLanguage[lang.id].emailSubject"
                      label="E-posta Konusu"
                      
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="formByLanguage[lang.id].emailTemplate"
                      label="E-posta Şablonu (HTML)"
                      rows="8"
                      
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
                <div v-else class="text-center py-8">
                  <v-progress-circular indeterminate color="primary" />
                </div>
              </v-window-item>
            </v-window>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveSurvey" :disabled="!formValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { http } from '../modules/http';

interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
}

interface SurveyDto {
  id: string;
  title: string;
  description?: string;
  languageId?: string;
  language?: LanguageDto;
  status: 'draft' | 'active' | 'inactive';
  isActive: boolean;
  autoSend: boolean;
  sendAfterDays?: number;
  emailSubject?: string;
  emailTemplate?: string;
}

const auth = useAuthStore();
const loading = ref(false);
const surveys = ref<SurveyDto[]>([]);
const showDialog = ref(false);
const editingSurvey = ref<SurveyDto | null>(null);
const formRef = ref();
const formValid = ref(false);
const languages = ref<LanguageDto[]>([]);
const selectedLanguageTab = ref<string>('all');
const formLanguageTab = ref<string>('');

// Ortak form alanları
const form = ref({
  status: 'draft' as 'draft' | 'active' | 'inactive',
  isActive: true,
  autoSend: false,
  sendAfterDays: 1,
});

// Her dil için ayrı form verileri
const formByLanguage = ref<Record<string, {
  title: string;
  description: string;
  emailSubject: string;
  emailTemplate: string;
}>>({});

const headers = [
  { title: 'Başlık', key: 'title' },
  { title: 'Dil', key: 'language' },
  { title: 'Durum', key: 'status' },
  { title: 'Aktif', key: 'isActive' },
  { title: 'Otomatik Gönder', key: 'autoSend' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const statusOptions = [
  { label: 'Taslak', value: 'draft' },
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'grey';
    default: return 'warning';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Aktif';
    case 'inactive': return 'Pasif';
    default: return 'Taslak';
  }
};

// Tab'a göre filtreleme
const filteredSurveys = computed(() => {
  if (selectedLanguageTab.value === 'all') {
    return surveys.value;
  }
  return surveys.value.filter(s => s.languageId === selectedLanguageTab.value);
});

const loadSurveys = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get<SurveyDto[]>('/surveys', {
      params: { tenantId: auth.tenant.id },
    });
    surveys.value = data;
  } catch (error) {
    console.error('Failed to load surveys:', error);
  } finally {
    loading.value = false;
  }
};

const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    languages.value = data.filter(lang => lang.isActive);
    // İlk dili varsayılan tab olarak ayarla
    if (languages.value.length > 0 && !formLanguageTab.value) {
      formLanguageTab.value = languages.value[0].id;
    }
    // Her dil için form verilerini initialize et
    languages.value.forEach(lang => {
      if (!formByLanguage.value[lang.id]) {
        formByLanguage.value[lang.id] = {
          title: '',
          description: '',
          emailSubject: '',
          emailTemplate: '',
        };
      }
    });
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

// Form validation
const validateForm = () => {
  const hasValidLanguage = languages.value.some(lang => {
    const langForm = formByLanguage.value[lang.id];
    return langForm?.title;
  });
  return hasValidLanguage;
};

// Watch form validation
watch([form, formByLanguage], () => {
  formValid.value = validateForm();
}, { deep: true });

const openCreateDialog = () => {
  editingSurvey.value = null;
  form.value = {
    status: 'draft',
    isActive: true,
    autoSend: false,
    sendAfterDays: 1,
  };
  
  // Tüm diller için form verilerini temizle
  languages.value.forEach(lang => {
    formByLanguage.value[lang.id] = {
      title: '',
      description: '',
      emailSubject: '',
      emailTemplate: '',
    };
  });
  
  // İlk dili seç
  if (languages.value.length > 0) {
    formLanguageTab.value = languages.value[0].id;
  }
  
  showDialog.value = true;
};

const editSurvey = (survey: SurveyDto) => {
  editingSurvey.value = survey;
  form.value = {
    status: survey.status,
    isActive: survey.isActive,
    autoSend: survey.autoSend,
    sendAfterDays: survey.sendAfterDays || 1,
  };
  
  // Eğer bu survey belirli bir dil için ise, sadece o dili yükle
  if (survey.languageId) {
    // Tüm diller için form verilerini temizle
    languages.value.forEach(lang => {
      formByLanguage.value[lang.id] = {
        title: '',
        description: '',
        emailSubject: '',
        emailTemplate: '',
      };
    });
    
    // Bu survey'in diline verileri yükle
    formByLanguage.value[survey.languageId] = {
      title: survey.title,
      description: survey.description || '',
      emailSubject: survey.emailSubject || '',
      emailTemplate: survey.emailTemplate || '',
    };
    
    formLanguageTab.value = survey.languageId;
  } else {
    // Dil belirtilmemişse, tüm diller için aynı veriyi yükle
    languages.value.forEach(lang => {
      formByLanguage.value[lang.id] = {
        title: survey.title,
        description: survey.description || '',
        emailSubject: survey.emailSubject || '',
        emailTemplate: survey.emailTemplate || '',
      };
    });
    
    if (languages.value.length > 0) {
      formLanguageTab.value = languages.value[0].id;
    }
  }
  
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editingSurvey.value = null;
};

const saveSurvey = async () => {
  if (!auth.tenant || !validateForm()) return;
  
  try {
    // Her dil için ayrı anket kaydet
    const savePromises = languages.value.map(async (lang) => {
      const langForm = formByLanguage.value[lang.id];
      
      // Eğer bu dil için veri yoksa atla
      if (!langForm?.title) {
        return;
      }
      
      const surveyData = {
        tenantId: auth.tenant!.id,
        languageId: lang.id,
        title: langForm.title,
        description: langForm.description || '',
        status: form.value.status,
        isActive: form.value.isActive,
        autoSend: form.value.autoSend,
        sendAfterDays: form.value.sendAfterDays,
        emailSubject: langForm.emailSubject || '',
        emailTemplate: langForm.emailTemplate || '',
      };
      
      if (editingSurvey.value && editingSurvey.value.languageId === lang.id) {
        // Düzenleme modunda ve bu dil anketi düzenleniyor
        await http.put(`/surveys/${editingSurvey.value.id}`, surveyData);
      } else {
        // Yeni anket ekle
        await http.post('/surveys', surveyData);
      }
    });
    
    await Promise.all(savePromises.filter(p => p !== undefined));
    await loadSurveys();
    closeDialog();
  } catch (error) {
    console.error('Failed to save survey:', error);
    alert('Anket kaydedilirken bir hata oluştu');
  }
};

const deleteSurvey = async (id: string) => {
  if (!confirm('Bu anketi silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/surveys/${id}`);
    await loadSurveys();
  } catch (error) {
    console.error('Failed to delete survey:', error);
  }
};

onMounted(async () => {
  await loadLanguages();
  loadSurveys();
});
</script>
