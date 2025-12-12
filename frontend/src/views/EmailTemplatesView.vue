<template>
  <div>
    <v-card elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-email-multiple" class="mr-2" />
          <span class="text-h5 font-weight-bold">Mail Şablonları</span>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Yeni Şablon Ekle
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
          <v-chip size="small" variant="tonal" color="primary" class="mr-2">
            {{ lang.code }}
          </v-chip>
          {{ lang.name }}
        </v-tab>
      </v-tabs>
      <v-divider />

      <v-card-text>
        <!-- Filter Bar -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedType"
              :items="templateTypes"
              item-title="label"
              item-value="value"
              label="Şablon Tipi"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="loadTemplates"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="filteredTemplates"
          :loading="loading"
          density="comfortable"
        >
          <template #item.language="{ item }">
            <v-chip
              v-if="item.language"
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ item.language.code }}
            </v-chip>
            <span v-else class="text-caption text-medium-emphasis">Tüm Diller</span>
          </template>
          <template #item.type="{ item }">
            <v-chip
              :color="getTypeColor(item.type)"
              size="small"
              variant="flat"
            >
              {{ getTypeLabel(item.type) }}
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
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editTemplate(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deleteTemplate(item.id)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="1400" scrollable persistent>
      <v-card>
        <v-card-title>
          {{ editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Ekle' }}
        </v-card-title>
        <v-divider />
        
        <!-- Ortak Ayarlar -->
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.type"
                :items="templateTypes"
                item-title="label"
                item-value="value"
                label="Şablon Tipi"
                :rules="[v => !!v || 'Şablon tipi gereklidir']"
                required
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="form.isActive"
                label="Aktif"
                color="primary"
                class="mt-4"
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
            <v-chip size="small" variant="tonal" color="primary" class="mr-2">
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
                      v-model="formByLanguage[lang.id].name"
                      label="Şablon Adı"
                      :rules="[(v: string) => !!v || 'Şablon adı gereklidir']"
                      required
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="formByLanguage[lang.id].description"
                      label="Açıklama"
                      rows="2"
                      hint="Bu şablonun ne zaman kullanılacağını açıklayın"
                      persistent-hint
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="formByLanguage[lang.id].subject"
                      label="E-posta Konusu"
                      :rules="[(v: string) => !!v || 'Konu gereklidir']"
                      required
                      hint="Değişkenler: {{customerName}}, {{reservationReference}}, vb."
                      persistent-hint
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <label class="text-body-2 font-weight-medium">E-posta İçeriği (HTML)</label>
                      <v-btn
                        size="small"
                        variant="text"
                        prepend-icon="mdi-help-circle"
                        @click="showVariablesHelp = !showVariablesHelp"
                      >
                        Kullanılabilir Değişkenler
                      </v-btn>
                    </div>
                    <v-expand-transition>
                      <v-card
                        v-if="showVariablesHelp"
                        variant="outlined"
                        color="info"
                        class="mb-4"
                      >
                        <v-card-text>
                          <div class="text-body-2">
                            <strong>Kullanılabilir Değişkenler:</strong>
                            <ul class="mt-2">
                              <li><code>{{customerName}}</code> - Müşteri adı</li>
                              <li><code>{{customerEmail}}</code> - Müşteri e-postası</li>
                              <li><code>{{customerPhone}}</code> - Müşteri telefonu</li>
                              <li><code>{{reservationReference}}</code> - Rezervasyon referansı</li>
                              <li><code>{{checkIn}}</code> - Check-in tarihi</li>
                              <li><code>{{checkOut}}</code> - Check-out tarihi</li>
                              <li><code>{{reservationType}}</code> - Rezervasyon tipi</li>
                              <li><code>{{reservationStatus}}</code> - Rezervasyon durumu</li>
                            </ul>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-expand-transition>
                    <v-textarea
                      v-model="formByLanguage[lang.id].body"
                      label="E-posta İçeriği"
                      rows="12"
                      :rules="[(v: string) => !!v || 'İçerik gereklidir']"
                      required
                      hint="HTML formatında e-posta içeriği. Değişkenler {{variableName}} formatında kullanılır."
                      persistent-hint
                      variant="outlined"
                      density="comfortable"
                    />
                    <v-btn
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-eye"
                      class="mt-2"
                      @click="showPreview = !showPreview"
                    >
                      Önizleme ({{ lang.name }})
                    </v-btn>
                  </v-col>
                  <v-col cols="12" v-if="showPreview">
                    <v-card variant="outlined">
                      <v-card-title class="text-subtitle-1">Önizleme - {{ lang.name }}</v-card-title>
                      <v-divider />
                      <v-card-text>
                        <div v-html="getPreviewBody(lang.id)" class="email-preview"></div>
                      </v-card-text>
                    </v-card>
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
          <v-btn color="primary" @click="saveTemplate" :disabled="!formValid">
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

interface EmailTemplateDto {
  id: string;
  tenantId: string;
  languageId?: string;
  language?: LanguageDto;
  type: 'reservation_confirmation' | 'reservation_cancelled' | 'reservation_completed' | 'survey_invitation' | 'custom';
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  description?: string;
}

const auth = useAuthStore();
const loading = ref(false);
const templates = ref<EmailTemplateDto[]>([]);
const showDialog = ref(false);
const editingTemplate = ref<EmailTemplateDto | null>(null);
const formRef = ref();
const formValid = ref(false);
const languages = ref<LanguageDto[]>([]);
const selectedType = ref<string | null>(null);
const selectedLanguageTab = ref<string>('all');
const formLanguageTab = ref<string>('');
const showVariablesHelp = ref(false);
const showPreview = ref(false);

// Ortak form alanları
const form = ref({
  type: '' as EmailTemplateDto['type'],
  isActive: true,
});

// Her dil için ayrı form verileri
const formByLanguage = ref<Record<string, {
  name: string;
  description: string;
  subject: string;
  body: string;
}>>({});

const templateTypes = [
  { label: 'Rezervasyon Onayı', value: 'reservation_confirmation' },
  { label: 'Rezervasyon İptali', value: 'reservation_cancelled' },
  { label: 'Rezervasyon Tamamlandı', value: 'reservation_completed' },
  { label: 'Anket Davetiyesi', value: 'survey_invitation' },
  { label: 'Özel', value: 'custom' },
];

const headers = [
  { title: 'Ad', key: 'name' },
  { title: 'Tip', key: 'type' },
  { title: 'Dil', key: 'language' },
  { title: 'Aktif', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    reservation_confirmation: 'success',
    reservation_cancelled: 'error',
    reservation_completed: 'info',
    survey_invitation: 'primary',
    custom: 'grey',
  };
  return colors[type] || 'grey';
};

const getTypeLabel = (type: string) => {
  const typeMap = templateTypes.find(t => t.value === type);
  return typeMap?.label || type;
};

// Tab'a göre filtreleme
const filteredTemplates = computed(() => {
  let filtered = templates.value;

  // Tip filtreleme
  if (selectedType.value) {
    filtered = filtered.filter(t => t.type === selectedType.value);
  }

  // Dil filtreleme
  if (selectedLanguageTab.value !== 'all') {
    filtered = filtered.filter(t => t.languageId === selectedLanguageTab.value);
  }

  return filtered;
});

// Preview with sample data for specific language
const getPreviewBody = (languageId: string) => {
  const langForm = formByLanguage.value[languageId];
  if (!langForm?.body) return '';
  return langForm.body
    .replace(/\{\{customerName\}\}/g, 'Ahmet Yılmaz')
    .replace(/\{\{customerEmail\}\}/g, 'ahmet@example.com')
    .replace(/\{\{customerPhone\}\}/g, '+90 555 123 45 67')
    .replace(/\{\{reservationReference\}\}/g, 'RES-2024-001')
    .replace(/\{\{checkIn\}\}/g, '01.01.2024')
    .replace(/\{\{checkOut\}\}/g, '05.01.2024')
    .replace(/\{\{reservationType\}\}/g, 'Rent A Car')
    .replace(/\{\{reservationStatus\}\}/g, 'Onaylandı');
};

// Form validation - en az bir dil için tüm alanlar dolu olmalı
const validateForm = () => {
  const hasValidLanguage = languages.value.some(lang => {
    const langForm = formByLanguage.value[lang.id];
    return langForm?.name && langForm?.subject && langForm?.body;
  });
  return form.value.type && hasValidLanguage;
};

// Watch form validation
watch([form, formByLanguage], () => {
  formValid.value = validateForm();
}, { deep: true });

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
          name: '',
          description: '',
          subject: '',
          body: '',
        };
      }
    });
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

const loadTemplates = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const params: any = { tenantId: auth.tenant.id };
    if (selectedType.value) params.type = selectedType.value;

    const { data } = await http.get<EmailTemplateDto[]>('/email-templates', { params });
    templates.value = data;
  } catch (error) {
    console.error('Failed to load templates:', error);
  } finally {
    loading.value = false;
  }
};

// Tab değiştiğinde şablonları yeniden yükle (sadece UI filtrelemesi yapılıyor ama tutarlılık için)
watch(selectedLanguageTab, () => {
  // UI'da filtreleme yapılıyor, ekstra yükleme gerekmiyor
});

const openCreateDialog = () => {
  editingTemplate.value = null;
  form.value = {
    type: 'custom',
    isActive: true,
  };
  
  // Tüm diller için form verilerini temizle
  languages.value.forEach(lang => {
    formByLanguage.value[lang.id] = {
      name: '',
      description: '',
      subject: '',
      body: '',
    };
  });
  
  // İlk dili seç
  if (languages.value.length > 0) {
    formLanguageTab.value = languages.value[0].id;
  }
  
  showDialog.value = true;
  showPreview.value = false;
  showVariablesHelp.value = false;
};

const editTemplate = async (template: EmailTemplateDto) => {
  editingTemplate.value = template;
  form.value = {
    type: template.type,
    isActive: template.isActive,
  };
  
  // Eğer bu template belirli bir dil için ise, sadece o dili yükle
  if (template.languageId) {
    // Tüm diller için form verilerini temizle
    languages.value.forEach(lang => {
      formByLanguage.value[lang.id] = {
        name: '',
        description: '',
        subject: '',
        body: '',
      };
    });
    
    // Bu template'in diline verileri yükle
    formByLanguage.value[template.languageId] = {
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      body: template.body,
    };
    
    formLanguageTab.value = template.languageId;
  } else {
    // Dil belirtilmemişse, tüm diller için aynı veriyi yükle
    languages.value.forEach(lang => {
      formByLanguage.value[lang.id] = {
        name: template.name,
        description: template.description || '',
        subject: template.subject,
        body: template.body,
      };
    });
    
    if (languages.value.length > 0) {
      formLanguageTab.value = languages.value[0].id;
    }
  }
  
  showDialog.value = true;
  showPreview.value = false;
  showVariablesHelp.value = false;
};

const closeDialog = () => {
  showDialog.value = false;
  editingTemplate.value = null;
};

const saveTemplate = async () => {
  if (!auth.tenant || !validateForm()) return;
  
  try {
    // Her dil için ayrı şablon kaydet
    const savePromises = languages.value.map(async (lang) => {
      const langForm = formByLanguage.value[lang.id];
      
      // Eğer bu dil için veri yoksa atla
      if (!langForm?.name || !langForm?.subject || !langForm?.body) {
        return;
      }
      
      const templateData = {
        tenantId: auth.tenant!.id,
        type: form.value.type,
        languageId: lang.id,
        name: langForm.name,
        description: langForm.description || '',
        subject: langForm.subject,
        body: langForm.body,
        isActive: form.value.isActive,
      };
      
      if (editingTemplate.value && editingTemplate.value.languageId === lang.id) {
        // Düzenleme modunda ve bu dil template'i düzenleniyor
        await http.put(`/email-templates/${editingTemplate.value.id}`, templateData);
      } else {
        // Yeni şablon ekle
        await http.post('/email-templates', templateData);
      }
    });
    
    await Promise.all(savePromises.filter(p => p !== undefined));
    await loadTemplates();
    closeDialog();
  } catch (error) {
    console.error('Failed to save template:', error);
    alert('Şablon kaydedilirken bir hata oluştu');
  }
};

const deleteTemplate = async (id: string) => {
  if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/email-templates/${id}`);
    await loadTemplates();
  } catch (error) {
    console.error('Failed to delete template:', error);
    alert('Şablon silinirken bir hata oluştu');
  }
};

onMounted(async () => {
  await loadLanguages();
  loadTemplates();
});
</script>

<style scoped>
.email-preview {
  max-width: 100%;
  border: 1px solid #e0e0e0;
  padding: 20px;
  background: white;
  min-height: 200px;
}

:deep(.email-preview) {
  font-family: Arial, sans-serif;
}
</style>
