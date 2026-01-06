<template>
  <div>
    <v-row>
      <v-col cols="12" md="5">
        <v-card elevation="2" class="pa-6 mb-4 admin-form-scope">
          <h2 class="text-h6 font-weight-bold mb-4">Yeni Dil Ekle</h2>
          <v-form @submit.prevent="handleCreate" ref="formRef" v-model="isValid">
            <div class="mb-4">
              <label class="form-label">Dil Kodu <span class="required">*</span></label>
              <v-text-field 
                v-model="form.code" 
                placeholder="en" 
                hide-details="auto"
                
                density="comfortable"
                required 
              />
            </div>
            <div class="mb-4">
              <label class="form-label">Dil Adı <span class="required">*</span></label>
              <v-text-field 
                v-model="form.name" 
                placeholder="English"
                hide-details="auto"
                
                density="comfortable"
                required 
              />
            </div>
            <v-switch v-model="form.isActive" color="primary" label="Aktif" inset />
            <v-switch 
              v-model="form.isDefault" 
              color="primary" 
              label="Varsayılan Dil" 
              inset 
              :hint="form.isDefault ? 'Bu dil varsayılan olarak ayarlanacak. Diğer varsayılan dil kaldırılacak.' : 'Bu dili varsayılan dil olarak ayarla'"
              persistent-hint
            />
            <v-btn color="primary" class="mt-4" :loading="creating" type="submit">Kaydet</v-btn>
          </v-form>
          <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <v-card elevation="2" class="pa-6 mb-4">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">Diller</h2>
            <v-btn icon="mdi-refresh" variant="text" @click="loadLanguages" :loading="loading" />
          </div>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Adi</th>
                <th>Durum</th>
                <th>Varsayılan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="language in languages" :key="language.id">
                <td>{{ language.code }}</td>
                <td>{{ language.name }}</td>
                <td>
                  <v-chip :color="language.isActive ? 'success' : 'warning'" size="small" variant="tonal">
                    {{ language.isActive ? 'Aktif' : 'Pasif' }}
                  </v-chip>
                </td>
                <td>
                  <v-chip 
                    v-if="language.isDefault" 
                    color="primary" 
                    size="small" 
                    variant="flat"
                    prepend-icon="mdi-star"
                  >
                    Varsayılan
                  </v-chip>
                  <span v-else class="text-grey text-caption">-</span>
                </td>
                <td class="text-right">
                  <v-btn 
                    v-if="!language.isDefault"
                    size="small" 
                    variant="text" 
                    color="primary"
                    :loading="settingDefault === language.id" 
                    @click="setAsDefault(language.id)"
                    prepend-icon="mdi-star"
                  >
                    Varsayılan Yap
                  </v-btn>
                  <v-btn size="small" variant="text" :loading="toggling === language.id" @click="toggleActive(language)">
                    {{ language.isActive ? 'Pasif Yap' : 'Aktif Yap' }}
                  </v-btn>
                  <v-btn size="small" variant="text" color="error" :loading="removing === language.id" @click="removeLanguage(language.id)">
                    Sil
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-if="!languages.length && !loading" type="info" variant="tonal">Henuz dil bulunmuyor.</v-alert>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { http } from '../modules/http';

interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
}

const languages = ref<Language[]>([]);
const loading = ref(false);
const creating = ref(false);
const toggling = ref<string | null>(null);
const removing = ref<string | null>(null);
const settingDefault = ref<string | null>(null);
const error = ref('');
const formRef = ref();
const isValid = ref(false);

const form = reactive({
  code: '',
  name: '',
  isActive: true,
  isDefault: false,
});

const loadLanguages = async () => {
  loading.value = true;
  try {
    const { data } = await http.get<Language[]>('/languages');
    languages.value = data;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.code = '';
  form.name = '';
  form.isActive = true;
  form.isDefault = false;
};

const handleCreate = async () => {
  const result = await formRef.value?.validate();
  if (!result?.valid) {
    return;
  }

  creating.value = true;
  error.value = '';
  try {
    await http.post('/languages', form);
    resetForm();
    await loadLanguages();
  } catch (err) {
    error.value = (err as Error).message ?? 'Kayit yapilamadi';
  } finally {
    creating.value = false;
  }
};

const toggleActive = async (language: Language) => {
  toggling.value = language.id;
  try {
    await http.patch(`/languages/${language.id}`, { isActive: !language.isActive });
    await loadLanguages();
  } finally {
    toggling.value = null;
  }
};

const removeLanguage = async (id: string) => {
  if (!confirm('Bu dili silmek istediğinizden emin misiniz?')) {
    return;
  }
  removing.value = id;
  try {
    await http.delete(`/languages/${id}`);
    await loadLanguages();
  } finally {
    removing.value = null;
  }
};

const setAsDefault = async (id: string) => {
  settingDefault.value = id;
  try {
    await http.post(`/languages/${id}/set-default`);
    await loadLanguages();
  } catch (err) {
    error.value = (err as Error).message ?? 'Varsayılan dil ayarlanamadı';
  } finally {
    settingDefault.value = null;
  }
};

onMounted(() => {
  loadLanguages();
});
</script>
