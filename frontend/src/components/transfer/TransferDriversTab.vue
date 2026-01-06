<template>
  <div class="transfer-drivers-page">
    <div class="page-header">
      <h2 class="page-title">Transfer Şoförleri</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Şoför Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="drivers"
      :loading="loading"
      item-value="id"
      class="drivers-table"
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
      <v-card class="driver-dialog">
        <v-card-title class="dialog-header">
          <span class="dialog-title">{{ editingDriver ? 'Şoför Düzenle' : 'Yeni Şoför Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="dialog-body admin-form-scope">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <label class="form-label">Ad Soyad <span class="required">*</span></label>
                <v-text-field
                  v-model="form.name"
                  placeholder="Ad soyad giriniz"
                  prepend-inner-icon="mdi-account"
                  :rules="[(v: string) => !!v || 'Ad soyad gereklidir']"
                  required
                  
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Telefon <span class="required">*</span></label>
                <v-text-field
                  v-model="form.phone"
                  placeholder="Telefon numarası giriniz"
                  prepend-inner-icon="mdi-phone"
                  :rules="[(v: string) => !!v || 'Telefon gereklidir']"
                  required
                  
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">E-posta</label>
                <v-text-field
                  v-model="form.email"
                  placeholder="E-posta adresi giriniz"
                  type="email"
                  prepend-inner-icon="mdi-email"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Lisans No <span class="required">*</span></label>
                <v-text-field
                  v-model="form.licenseNumber"
                  placeholder="Lisans numarası giriniz"
                  prepend-inner-icon="mdi-card-account-details"
                  :rules="[(v: string) => !!v || 'Lisans no gereklidir']"
                  required
                  
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Lisans Geçerlilik Tarihi</label>
                <v-text-field
                  v-model="form.licenseExpiry"
                  type="date"
                  placeholder="Tarih seçiniz"
                  prepend-inner-icon="mdi-calendar"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Diller</label>
                <v-select
                  v-model="form.languages"
                  :items="languageOptions"
                  placeholder="Dil seçiniz"
                  multiple
                  chips
                  prepend-inner-icon="mdi-translate"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Durum</label>
                <div class="switch-group">
                  <v-switch
                    v-model="form.isAvailable"
                    label="Müsait"
                    color="success"
                    hide-details
                  />
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Aktif</label>
                <div class="switch-group">
                  <v-switch
                    v-model="form.isActive"
                    label="Aktif"
                    color="success"
                    hide-details
                  />
                </div>
              </v-col>
              <v-col cols="12">
                <label class="form-label">Notlar</label>
                <v-textarea
                  v-model="form.notes"
                  placeholder="Notlar giriniz..."
                  rows="3"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" variant="flat" @click="saveDriver" :loading="saving" :disabled="!formValid">
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
import Swal from 'sweetalert2';

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
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Şoför başarıyla güncellendi',
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      await http.post('/transfer/drivers', driverData);
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Şoför başarıyla eklendi',
        timer: 2000,
        showConfirmButton: false,
      });
    }
    
    await loadDrivers();
    closeDialog();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Şoför kaydedilirken bir hata oluştu',
    });
  } finally {
    saving.value = false;
  }
};

const deleteDriver = async (id: string) => {
  const result = await Swal.fire({
    title: 'Emin misiniz?',
    text: 'Bu şoförü silmek istediğinizden emin misiniz?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;
  if (!auth.tenant) return;
  
  try {
    await http.delete(`/transfer/drivers/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Şoför başarıyla silindi',
      timer: 2000,
      showConfirmButton: false,
    });
    await loadDrivers();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Şoför silinirken bir hata oluştu',
    });
  }
};

onMounted(() => {
  loadDrivers();
});
</script>

<style scoped>
.transfer-drivers-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.drivers-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.driver-dialog {
  border-radius: 12px;
}

.dialog-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.dialog-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.switch-group {
  padding: 8px 0;
}

.switch-group :deep(.v-switch) {
  margin: 0;
}

.switch-group :deep(.v-switch .v-label) {
  font-size: 14px;
  color: #374151;
  margin-left: 8px;
}

@media (max-width: 768px) {
  .transfer-drivers-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .dialog-body {
    padding: 16px;
  }
}
</style>
