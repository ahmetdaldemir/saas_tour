<template>
  <div>
    <v-row>
      <v-col cols="12" md="5">
        <v-card elevation="2" class="pa-6 mb-4">
          <h2 class="text-h6 font-weight-bold mb-4">{{ editingCountry ? 'Ülke Düzenle' : 'Yeni Ülke Ekle' }}</h2>
          <v-form @submit.prevent="handleSave" ref="formRef" v-model="isValid">
            <v-text-field 
              v-model="form.name" 
              label="Ülke Adı" 
              placeholder="Türkiye" 
              prepend-inner-icon="mdi-earth" 
              required 
              :rules="[v => !!v || 'Ülke adı gereklidir']"
            />
            <v-text-field 
              v-model="form.code" 
              label="Ülke Kodu" 
              placeholder="TR" 
              prepend-inner-icon="mdi-flag" 
              required 
              :rules="[v => !!v || 'Ülke kodu gereklidir', v => v.length === 2 || 'Ülke kodu 2 karakter olmalıdır']"
              maxlength="2"
              @input="form.code = form.code.toUpperCase()"
            />
            <v-text-field 
              v-model="form.phoneCode" 
              label="Telefon Kodu" 
              placeholder="+90" 
              prepend-inner-icon="mdi-phone" 
              required 
              :rules="[v => !!v || 'Telefon kodu gereklidir']"
            />
            <v-text-field 
              v-model="form.flag" 
              label="Bayrak (Emoji veya URL)" 
              placeholder="🇹🇷" 
              prepend-inner-icon="mdi-flag-variant" 
            />
            <v-switch v-model="form.isActive" color="primary" label="Aktif" inset />
            <div class="d-flex gap-2 mt-4">
              <v-btn color="primary" :loading="saving" type="submit">
                {{ editingCountry ? 'Güncelle' : 'Kaydet' }}
              </v-btn>
              <v-btn v-if="editingCountry" variant="outlined" @click="cancelEdit">İptal</v-btn>
            </div>
          </v-form>
          <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
          <v-alert v-if="success" type="success" variant="tonal" class="mt-4">{{ success }}</v-alert>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <v-card elevation="2" class="pa-6 mb-4">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">Ülkeler</h2>
            <div class="d-flex gap-2">
              <v-switch
                v-model="activeOnly"
                label="Sadece Aktifler"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="loadCountries"
              />
              <v-btn 
                color="primary" 
                prepend-icon="mdi-sync" 
                variant="outlined"
                @click="syncCountries" 
                :loading="syncing"
              >
                Senkronize Et
              </v-btn>
              <v-btn icon="mdi-refresh" variant="text" @click="loadCountries" :loading="loading" />
            </div>
          </div>
          <div class="countries-table-container">
            <v-table density="comfortable" fixed-header>
              <thead>
                <tr>
                  <th>Bayrak</th>
                  <th>Kod</th>
                  <th>Adı</th>
                  <th>Telefon Kodu</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="country in countries" :key="country.id">
                  <td>
                    <span v-if="country.flag" class="text-h6">{{ country.flag }}</span>
                    <span v-else class="text-grey text-caption">-</span>
                  </td>
                  <td>
                    <v-chip size="small" variant="flat" color="primary">
                      {{ country.code }}
                    </v-chip>
                  </td>
                  <td>{{ country.name }}</td>
                  <td>{{ country.phoneCode }}</td>
                  <td>
                    <v-chip :color="country.isActive ? 'success' : 'warning'" size="small" variant="tonal">
                      {{ country.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </td>
                  <td class="text-right">
                    <v-btn 
                      size="small" 
                      variant="text" 
                      color="primary"
                      :loading="toggling === country.id" 
                      @click="toggleActive(country)"
                      prepend-icon="mdi-toggle-switch"
                    >
                      {{ country.isActive ? 'Pasif Yap' : 'Aktif Yap' }}
                    </v-btn>
                    <v-btn 
                      size="small" 
                      variant="text" 
                      color="primary"
                      :loading="loading" 
                      @click="editCountry(country)"
                      prepend-icon="mdi-pencil"
                    >
                      Düzenle
                    </v-btn>
                    <v-btn 
                      size="small" 
                      variant="text" 
                      color="error" 
                      :loading="removing === country.id" 
                      @click="removeCountry(country.id)"
                      prepend-icon="mdi-delete"
                    >
                      Sil
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <v-alert v-if="!countries.length && !loading" type="info" variant="tonal" class="mt-4">Henüz ülke bulunmuyor.</v-alert>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { http } from '../modules/http';

interface Country {
  id: string;
  name: string;
  code: string;
  phoneCode: string;
  flag?: string;
  isActive: boolean;
}

const countries = ref<Country[]>([]);
const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);
const toggling = ref<string | null>(null);
const removing = ref<string | null>(null);
const error = ref('');
const success = ref('');
const formRef = ref();
const isValid = ref(false);
const activeOnly = ref(false);
const editingCountry = ref<Country | null>(null);

const form = reactive({
  name: '',
  code: '',
  phoneCode: '',
  flag: '',
  isActive: true,
});

const loadCountries = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = activeOnly.value ? { activeOnly: 'true' } : {};
    const { data } = await http.get<Country[]>('/countries', { params });
    countries.value = data;
  } catch (err) {
    error.value = (err as Error).message ?? 'Ülkeler yüklenemedi';
  } finally {
    loading.value = false;
  }
};

const syncCountries = async () => {
  if (!confirm('Tüm ülkeler REST Countries API\'den senkronize edilecek. Devam etmek istiyor musunuz?')) {
    return;
  }
  
  syncing.value = true;
  error.value = '';
  success.value = '';
  try {
    const { data } = await http.post<{ message: string; created: number; updated: number; total: number }>('/countries/sync');
    success.value = `${data.message}. Yeni: ${data.created}, Güncellenen: ${data.updated}, Toplam: ${data.total}`;
    await loadCountries();
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Ülkeler senkronize edilemedi';
  } finally {
    syncing.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.code = '';
  form.phoneCode = '';
  form.flag = '';
  form.isActive = true;
  editingCountry.value = null;
};

const editCountry = (country: Country) => {
  editingCountry.value = country;
  form.name = country.name;
  form.code = country.code;
  form.phoneCode = country.phoneCode;
  form.flag = country.flag || '';
  form.isActive = country.isActive;
  
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  resetForm();
};

const handleSave = async () => {
  const result = await formRef.value?.validate();
  if (!result?.valid) {
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    if (editingCountry.value) {
      await http.put(`/countries/${editingCountry.value.id}`, form);
    } else {
      await http.post('/countries', form);
    }
    resetForm();
    await loadCountries();
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Kayıt yapılamadı';
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (country: Country) => {
  toggling.value = country.id;
  try {
    await http.patch(`/countries/${country.id}/toggle-active`);
    await loadCountries();
  } catch (err) {
    error.value = (err as Error).message ?? 'Durum değiştirilemedi';
  } finally {
    toggling.value = null;
  }
};

const removeCountry = async (id: string) => {
  if (!confirm('Bu ülkeyi silmek istediğinizden emin misiniz?')) {
    return;
  }
  removing.value = id;
  try {
    await http.delete(`/countries/${id}`);
    await loadCountries();
    if (editingCountry.value?.id === id) {
      resetForm();
    }
  } catch (err) {
    error.value = (err as Error).message ?? 'Ülke silinemedi';
  } finally {
    removing.value = null;
  }
};

onMounted(() => {
  loadCountries();
});
</script>

<style scoped>
.countries-table-container {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
}

.countries-table-container::-webkit-scrollbar {
  width: 8px;
}

.countries-table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.countries-table-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.countries-table-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

