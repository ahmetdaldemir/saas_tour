<template>
  <div class="transfer-vehicles-page">
    <div class="page-header">
      <h2 class="page-title">Transfer Araçları</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Araç Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="vehicles"
      :loading="loading"
      item-value="id"
      class="vehicles-table"
    >
      <template #item.type="{ item }">
        <v-chip :color="getTypeColor(item.type)" size="small">
          {{ getTypeLabel(item.type) }}
        </v-chip>
      </template>
      <template #item.passengerCapacity="{ item }">
        <v-icon icon="mdi-account" size="16" class="mr-1" />
        {{ item.passengerCapacity }}
      </template>
      <template #item.luggageCapacity="{ item }">
        <v-icon icon="mdi-bag-suitcase" size="16" class="mr-1" />
        {{ item.luggageCapacity }}
      </template>
      <template #item.hasDriver="{ item }">
        <v-chip :color="item.hasDriver ? 'success' : 'warning'" size="small" variant="tonal">
          {{ item.hasDriver ? 'Şoförlü' : 'Şoförsüz' }}
        </v-chip>
      </template>
      <template #item.isActive="{ item }">
        <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" variant="tonal">
          {{ item.isActive ? 'Aktif' : 'Pasif' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="editVehicle(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteVehicle(item.id)" />
      </template>
    </v-data-table>

    <!-- Vehicle Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="800" scrollable>
      <v-card class="vehicle-dialog">
        <v-card-title class="dialog-header">
          <span class="dialog-title">{{ editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="dialog-body admin-form-scope">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <label class="form-label">Araç Adı <span class="required">*</span></label>
                <v-text-field
                  v-model="form.name"
                  placeholder="Araç adını giriniz"
                  prepend-inner-icon="mdi-car"
                  :rules="[(v: string) => !!v || 'Araç adı gereklidir']"
                  required
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Araç Tipi <span class="required">*</span></label>
                <v-select
                  v-model="form.type"
                  :items="typeOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Araç tipi seçiniz"
                  prepend-inner-icon="mdi-shape"
                  :rules="[(v: string) => !!v || 'Araç tipi gereklidir']"
                  required
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="4">
                <label class="form-label">Yolcu Kapasitesi <span class="required">*</span></label>
                <v-text-field
                  v-model.number="form.passengerCapacity"
                  type="number"
                  placeholder="Örn: 4"
                  prepend-inner-icon="mdi-account"
                  :rules="[(v: number) => (v && v > 0) || 'Yolcu kapasitesi gereklidir']"
                  required
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="4">
                <label class="form-label">Bagaj Kapasitesi <span class="required">*</span></label>
                <v-text-field
                  v-model.number="form.luggageCapacity"
                  type="number"
                  placeholder="Örn: 2"
                  prepend-inner-icon="mdi-bag-suitcase"
                  :rules="[(v: number) => (v && v >= 0) || 'Bagaj kapasitesi gereklidir']"
                  required
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="4">
                <label class="form-label">Şoför</label>
                <div class="switch-group">
                  <v-switch
                    v-model="form.hasDriver"
                    label="Şoförlü"
                    color="success"
                    hide-details
                  />
                </div>
              </v-col>
              <v-col cols="12">
                <label class="form-label">Özellikler</label>
                <v-select
                  v-model="form.features"
                  :items="featureOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Özellik seçiniz"
                  multiple
                  chips
                  prepend-inner-icon="mdi-star"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Görsel URL</label>
                <v-text-field
                  v-model="form.imageUrl"
                  placeholder="https://..."
                  prepend-inner-icon="mdi-image"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Durum</label>
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
                <label class="form-label">Açıklama</label>
                <v-textarea
                  v-model="form.description"
                  placeholder="Açıklama giriniz..."
                  rows="3"
                  variant="outlined"
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
          <v-btn color="primary" variant="flat" @click="saveVehicle" :loading="saving" :disabled="!formValid">
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
const vehicles = ref<any[]>([]);
const showDialog = ref(false);
const formRef = ref<any>(null);
const formValid = ref(false);
const editingVehicle = ref<any>(null);

const form = reactive({
  name: '',
  type: 'vip' as 'vip' | 'shuttle' | 'premium' | 'luxury',
  passengerCapacity: 4,
  luggageCapacity: 2,
  hasDriver: true,
  features: [] as string[],
  imageUrl: '',
  description: '',
  isActive: true,
});

const typeOptions = [
  { label: 'VIP', value: 'vip' },
  { label: 'Shuttle', value: 'shuttle' },
  { label: 'Premium', value: 'premium' },
  { label: 'Luxury', value: 'luxury' },
];

const featureOptions = [
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Bebek Koltuğu', value: 'baby_seat' },
  { label: 'İçecek', value: 'drinks' },
  { label: 'Gazete', value: 'newspaper' },
  { label: 'Şarj Cihazı', value: 'charger' },
  { label: 'GPS', value: 'gps' },
  { label: 'Çok Dilli Şoför', value: 'multilingual_driver' },
];

const headers = [
  { title: 'Araç Adı', key: 'name' },
  { title: 'Tip', key: 'type' },
  { title: 'Yolcu Kapasitesi', key: 'passengerCapacity' },
  { title: 'Bagaj Kapasitesi', key: 'luggageCapacity' },
  { title: 'Şoför', key: 'hasDriver' },
  { title: 'Durum', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const loadVehicles = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get('/transfer/vehicles', {
      params: { tenantId: auth.tenant.id },
    });
    vehicles.value = data;
  } catch (error) {
    console.error('Failed to load vehicles:', error);
  } finally {
    loading.value = false;
  }
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    vip: 'purple',
    shuttle: 'blue',
    premium: 'orange',
    luxury: 'pink',
  };
  return colors[type] || 'grey';
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    vip: 'VIP',
    shuttle: 'Shuttle',
    premium: 'Premium',
    luxury: 'Luxury',
  };
  return labels[type] || type;
};

const resetForm = () => {
  form.name = '';
  form.type = 'vip';
  form.passengerCapacity = 4;
  form.luggageCapacity = 2;
  form.hasDriver = true;
  form.features = [];
  form.imageUrl = '';
  form.description = '';
  form.isActive = true;
  editingVehicle.value = null;
};

const openCreateDialog = () => {
  resetForm();
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  resetForm();
};

const editVehicle = (item: any) => {
  editingVehicle.value = item;
  form.name = item.name || '';
  form.type = item.type || 'vip';
  form.passengerCapacity = item.passengerCapacity || 4;
  form.luggageCapacity = item.luggageCapacity || 2;
  form.hasDriver = item.hasDriver ?? true;
  form.features = item.features || [];
  form.imageUrl = item.imageUrl || '';
  form.description = item.description || '';
  form.isActive = item.isActive ?? true;
  showDialog.value = true;
};

const saveVehicle = async () => {
  if (!auth.tenant) return;
  
  const validated = await formRef.value?.validate();
  if (!validated?.valid) return;
  
  saving.value = true;
  try {
    const vehicleData = {
      tenantId: auth.tenant.id,
      name: form.name,
      type: form.type,
      passengerCapacity: form.passengerCapacity,
      luggageCapacity: form.luggageCapacity,
      hasDriver: form.hasDriver,
      features: form.features,
      imageUrl: form.imageUrl || undefined,
      description: form.description || undefined,
      isActive: form.isActive,
    };
    
    if (editingVehicle.value) {
      await http.put(`/transfer/vehicles/${editingVehicle.value.id}`, vehicleData, {
        params: { tenantId: auth.tenant.id },
      });
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Araç başarıyla güncellendi',
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      await http.post('/transfer/vehicles', vehicleData);
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Araç başarıyla eklendi',
        timer: 2000,
        showConfirmButton: false,
      });
    }
    
    await loadVehicles();
    closeDialog();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Araç kaydedilirken bir hata oluştu',
    });
  } finally {
    saving.value = false;
  }
};

const deleteVehicle = async (id: string) => {
  const result = await Swal.fire({
    title: 'Emin misiniz?',
    text: 'Bu aracı silmek istediğinizden emin misiniz?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;
  if (!auth.tenant) return;
  
  try {
    await http.delete(`/transfer/vehicles/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Araç başarıyla silindi',
      timer: 2000,
      showConfirmButton: false,
    });
    await loadVehicles();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Araç silinirken bir hata oluştu',
    });
  }
};

onMounted(() => {
  loadVehicles();
});
</script>

<style scoped>
.transfer-vehicles-page {
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

.vehicles-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.vehicle-dialog {
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
  .transfer-vehicles-page {
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
