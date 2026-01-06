<template>
  <div class="transfer-routes-page">
    <div class="page-header">
      <h2 class="page-title">Transfer Rotaları</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Rota Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="routes"
      :loading="loading"
      item-value="id"
      class="routes-table"
    >
      <template #item.type="{ item }">
        <v-chip size="small" color="primary" variant="tonal">
          {{ getTypeLabel(item.type) }}
        </v-chip>
      </template>
      <template #item.distance="{ item }">
        {{ item.distance ? `${item.distance} km` : '-' }}
      </template>
      <template #item.averageDurationMinutes="{ item }">
        {{ item.averageDurationMinutes ? `${item.averageDurationMinutes} dk` : '-' }}
      </template>
      <template #item.isActive="{ item }">
        <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" variant="tonal">
          {{ item.isActive ? 'Aktif' : 'Pasif' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="editRoute(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteRoute(item.id)" />
      </template>
    </v-data-table>

    <!-- Route Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="800" scrollable>
      <v-card class="route-dialog">
        <v-card-title class="dialog-header">
          <span class="dialog-title">{{ editingRoute ? 'Rota Düzenle' : 'Yeni Rota Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="dialog-body admin-form-scope">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <label class="form-label">Rota Adı <span class="required">*</span></label>
                <v-text-field
                  v-model="form.name"
                  placeholder="Rota adını giriniz"
                  prepend-inner-icon="mdi-map-marker"
                  :rules="[(v: string) => !!v || 'Rota adı gereklidir']"
                  required
                  
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Rota Tipi <span class="required">*</span></label>
                <v-select
                  v-model="form.type"
                  :items="typeOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Rota tipi seçiniz"
                  prepend-inner-icon="mdi-routes"
                  :rules="[(v: string) => !!v || 'Rota tipi gereklidir']"
                  required
                  
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Mesafe (km)</label>
                <v-text-field
                  v-model.number="form.distance"
                  type="number"
                  placeholder="Örn: 50"
                  prepend-inner-icon="mdi-road"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Ortalama Süre (dakika)</label>
                <v-text-field
                  v-model.number="form.averageDurationMinutes"
                  type="number"
                  placeholder="Örn: 60"
                  prepend-inner-icon="mdi-clock"
                  
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
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              
              <!-- Çıkış Noktası -->
              <v-col cols="12">
                <v-divider class="my-4" />
                <h3 class="section-title">Çıkış Noktası</h3>
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Çıkış Noktası Adı <span class="required">*</span></label>
                <v-text-field
                  v-model="form.originName"
                  placeholder="Çıkış noktası adını giriniz"
                  prepend-inner-icon="mdi-map-marker"
                  :rules="[(v: string) => !!v || 'Çıkış noktası adı gereklidir']"
                  required
                  
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Çıkış Noktası Tipi</label>
                <v-select
                  v-model="form.originType"
                  :items="pointTypeOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Tip seçiniz"
                  prepend-inner-icon="mdi-shape"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <label class="form-label">Çıkış Adresi</label>
                <v-text-field
                  v-model="form.originAddress"
                  placeholder="Adres giriniz"
                  prepend-inner-icon="mdi-map"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              
              <!-- Varış Noktası -->
              <v-col cols="12">
                <v-divider class="my-4" />
                <h3 class="section-title">Varış Noktası</h3>
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Varış Noktası Adı <span class="required">*</span></label>
                <v-text-field
                  v-model="form.destinationName"
                  placeholder="Varış noktası adını giriniz"
                  prepend-inner-icon="mdi-map-marker"
                  :rules="[(v: string) => !!v || 'Varış noktası adı gereklidir']"
                  required
                  
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Varış Noktası Tipi</label>
                <v-select
                  v-model="form.destinationType"
                  :items="pointTypeOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Tip seçiniz"
                  prepend-inner-icon="mdi-shape"
                  
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <label class="form-label">Varış Adresi</label>
                <v-text-field
                  v-model="form.destinationAddress"
                  placeholder="Adres giriniz"
                  prepend-inner-icon="mdi-map"
                  
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
          <v-btn color="primary" variant="flat" @click="saveRoute" :loading="saving" :disabled="!formValid">
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
const routes = ref<any[]>([]);
const showDialog = ref(false);
const formRef = ref<any>(null);
const formValid = ref(false);
const editingRoute = ref<any>(null);

const form = reactive({
  name: '',
  type: 'airport_to_hotel' as string,
  distance: undefined as number | undefined,
  averageDurationMinutes: undefined as number | undefined,
  description: '',
  isActive: true,
  originName: '',
  originType: 'airport' as string,
  originAddress: '',
  destinationName: '',
  destinationType: 'hotel' as string,
  destinationAddress: '',
});

const typeOptions = [
  { label: 'Havalimanı → Otel', value: 'airport_to_hotel' },
  { label: 'Otel → Havalimanı', value: 'hotel_to_airport' },
  { label: 'Şehirler Arası', value: 'city_to_city' },
  { label: 'Şehir İçi', value: 'intra_city' },
  { label: 'Özel', value: 'custom' },
];

const pointTypeOptions = [
  { label: 'Havalimanı', value: 'airport' },
  { label: 'Otel', value: 'hotel' },
  { label: 'Şehir Merkezi', value: 'city_center' },
  { label: 'Adres', value: 'address' },
  { label: 'İşaret Noktası', value: 'landmark' },
];

const headers = [
  { title: 'Rota Adı', key: 'name' },
  { title: 'Tip', key: 'type' },
  { title: 'Mesafe', key: 'distance' },
  { title: 'Ortalama Süre', key: 'averageDurationMinutes' },
  { title: 'Durum', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const loadRoutes = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get('/transfer/routes', {
      params: { tenantId: auth.tenant.id },
    });
    routes.value = data;
  } catch (error) {
    console.error('Failed to load routes:', error);
  } finally {
    loading.value = false;
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    airport_to_hotel: 'Havalimanı → Otel',
    hotel_to_airport: 'Otel → Havalimanı',
    city_to_city: 'Şehirler Arası',
    intra_city: 'Şehir İçi',
    custom: 'Özel',
  };
  return labels[type] || type;
};

const resetForm = () => {
  form.name = '';
  form.type = 'airport_to_hotel';
  form.distance = undefined;
  form.averageDurationMinutes = undefined;
  form.description = '';
  form.isActive = true;
  form.originName = '';
  form.originType = 'airport';
  form.originAddress = '';
  form.destinationName = '';
  form.destinationType = 'hotel';
  form.destinationAddress = '';
  editingRoute.value = null;
};

const openCreateDialog = () => {
  resetForm();
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  resetForm();
};

const editRoute = (item: any) => {
  editingRoute.value = item;
  form.name = item.name || '';
  form.type = item.type || 'airport_to_hotel';
  form.distance = item.distance;
  form.averageDurationMinutes = item.averageDurationMinutes;
  form.description = item.description || '';
  form.isActive = item.isActive ?? true;
  
  if (item.points && item.points.length > 0) {
    const pickupPoint = item.points.find((p: any) => p.isPickup);
    const dropoffPoint = item.points.find((p: any) => !p.isPickup);
    
    if (pickupPoint) {
      form.originName = pickupPoint.name || '';
      form.originType = pickupPoint.type || 'airport';
      form.originAddress = pickupPoint.address || '';
    }
    if (dropoffPoint) {
      form.destinationName = dropoffPoint.name || '';
      form.destinationType = dropoffPoint.type || 'hotel';
      form.destinationAddress = dropoffPoint.address || '';
    }
  }
  
  showDialog.value = true;
};

const saveRoute = async () => {
  if (!auth.tenant) return;
  
  const validated = await formRef.value?.validate();
  if (!validated?.valid) return;
  
  saving.value = true;
  try {
    const routeData = {
      tenantId: auth.tenant.id,
      name: form.name,
      type: form.type,
      distance: form.distance || undefined,
      averageDurationMinutes: form.averageDurationMinutes || undefined,
      description: form.description || undefined,
      isActive: form.isActive,
      points: [
        {
          name: form.originName,
          type: form.originType,
          address: form.originAddress || undefined,
          isPickup: true,
          isActive: true,
        },
        {
          name: form.destinationName,
          type: form.destinationType,
          address: form.destinationAddress || undefined,
          isPickup: false,
          isActive: true,
        },
      ],
    };
    
    if (editingRoute.value) {
      await http.put(`/transfer/routes/${editingRoute.value.id}`, routeData, {
        params: { tenantId: auth.tenant.id },
      });
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Rota başarıyla güncellendi',
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      await http.post('/transfer/routes', routeData);
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Rota başarıyla eklendi',
        timer: 2000,
        showConfirmButton: false,
      });
    }
    
    await loadRoutes();
    closeDialog();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Rota kaydedilirken bir hata oluştu',
    });
  } finally {
    saving.value = false;
  }
};

const deleteRoute = async (id: string) => {
  const result = await Swal.fire({
    title: 'Emin misiniz?',
    text: 'Bu rotayı silmek istediğinizden emin misiniz?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;
  if (!auth.tenant) return;
  
  try {
    await http.delete(`/transfer/routes/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Rota başarıyla silindi',
      timer: 2000,
      showConfirmButton: false,
    });
    await loadRoutes();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Rota silinirken bir hata oluştu',
    });
  }
};

onMounted(() => {
  loadRoutes();
});
</script>

<style scoped>
.transfer-routes-page {
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

.routes-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.route-dialog {
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

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
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
  .transfer-routes-page {
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
