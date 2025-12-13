<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5">Transfer Şoförleri</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Şoför Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="drivers"
      :loading="loading"
      item-value="id"
    >
      <template #item.languages="{ item }">
        <v-chip
          v-for="lang in item.languages"
          :key="lang"
          size="small"
          color="primary"
          variant="tonal"
          class="mr-1"
        >
          {{ lang.toUpperCase() }}
        </v-chip>
      </template>
      <template #item.isAvailable="{ item }">
        <v-chip :color="item.isAvailable ? 'success' : 'warning'" size="small" variant="tonal">
          {{ item.isAvailable ? 'Müsait' : 'Meşgul' }}
        </v-chip>
      </template>
      <template #item.isActive="{ item }">
        <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" variant="tonal">
          {{ item.isActive ? 'Aktif' : 'Pasif' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="editDriver(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteDriver(item.id)" />
      </template>
    </v-data-table>

    <!-- Driver Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="700" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ editingDriver ? 'Şoför Düzenle' : 'Yeni Şoför Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.name"
                  label="Ad Soyad *"
                  prepend-inner-icon="mdi-account"
                  :rules="[(v: string) => !!v || 'Ad soyad gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.phone"
                  label="Telefon *"
                  prepend-inner-icon="mdi-phone"
                  :rules="[(v: string) => !!v || 'Telefon gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.email"
                  label="E-posta"
                  prepend-inner-icon="mdi-email"
                  type="email"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.licenseNumber"
                  label="Lisans No *"
                  prepend-inner-icon="mdi-card-account-details"
                  :rules="[(v: string) => !!v || 'Lisans no gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.licenseExpiry"
                  label="Lisans Geçerlilik Tarihi"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.languages"
                  :items="languageOptions"
                  label="Diller"
                  multiple
                  chips
                  prepend-inner-icon="mdi-translate"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.isAvailable"
                  label="Müsait"
                  color="success"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.isActive"
                  label="Aktif"
                  color="success"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Notlar"
                  rows="3"
                  prepend-inner-icon="mdi-text"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveDriver" :loading="saving" :disabled="!formValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { http } from '../../modules/http';

const auth = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const drivers = ref<any[]>([]);
const showDialog = ref(false);
const formRef = ref<any>(null);
const formValid = ref(false);
const editingDriver = ref<any>(null);

const form = reactive({
  name: '',
  phone: '',
  email: '',
  licenseNumber: '',
  licenseExpiry: '',
  languages: [] as string[],
  isAvailable: true,
  isActive: true,
  notes: '',
});

const languageOptions = [
  { title: 'Türkçe', value: 'tr' },
  { title: 'İngilizce', value: 'en' },
  { title: 'Almanca', value: 'de' },
  { title: 'Fransızca', value: 'fr' },
  { title: 'Rusça', value: 'ru' },
  { title: 'Arapça', value: 'ar' },
];

const headers = [
  { title: 'Ad Soyad', key: 'name' },
  { title: 'Telefon', key: 'phone' },
  { title: 'E-posta', key: 'email' },
  { title: 'Lisans No', key: 'licenseNumber' },
  { title: 'Diller', key: 'languages' },
  { title: 'Durum', key: 'isAvailable' },
  { title: 'Aktif', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const loadDrivers = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get('/transfer/drivers', {
      params: { tenantId: auth.tenant.id },
    });
    drivers.value = data;
  } catch (error) {
    console.error('Failed to load drivers:', error);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.phone = '';
  form.email = '';
  form.licenseNumber = '';
  form.licenseExpiry = '';
  form.languages = [];
  form.isAvailable = true;
  form.isActive = true;
  form.notes = '';
  editingDriver.value = null;
};

const openCreateDialog = () => {
  resetForm();
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  resetForm();
};

const editDriver = (item: any) => {
  editingDriver.value = item;
  form.name = item.name || '';
  form.phone = item.phone || '';
  form.email = item.email || '';
  form.licenseNumber = item.licenseNumber || '';
  form.licenseExpiry = item.licenseExpiry ? item.licenseExpiry.split('T')[0] : '';
  form.languages = item.languages || [];
  form.isAvailable = item.isAvailable ?? true;
  form.isActive = item.isActive ?? true;
  form.notes = item.notes || '';
  showDialog.value = true;
};

const saveDriver = async () => {
  if (!auth.tenant) return;
  
  const validated = await formRef.value?.validate();
  if (!validated?.valid) return;
  
  saving.value = true;
  try {
    const driverData = {
      tenantId: auth.tenant.id,
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      licenseNumber: form.licenseNumber,
      licenseExpiry: form.licenseExpiry || undefined,
      languages: form.languages,
      isAvailable: form.isAvailable,
      isActive: form.isActive,
      notes: form.notes || undefined,
    };
    
    if (editingDriver.value) {
      await http.put(`/transfer/drivers/${editingDriver.value.id}`, driverData, {
        params: { tenantId: auth.tenant.id },
      });
    } else {
      await http.post('/transfer/drivers', driverData);
    }
    
    await loadDrivers();
    closeDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Şoför kaydedilirken bir hata oluştu');
  } finally {
    saving.value = false;
  }
};

const deleteDriver = async (id: string) => {
  if (!confirm('Bu şoförü silmek istediğinizden emin misiniz?')) return;
  if (!auth.tenant) return;
  try {
    await http.delete(`/transfer/drivers/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await loadDrivers();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Şoför silinirken bir hata oluştu');
  }
};

onMounted(() => {
  loadDrivers();
});
</script>
