<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5">Transfer Rotaları</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Rota Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="routes"
      :loading="loading"
      item-value="id"
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
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ editingRoute ? 'Rota Düzenle' : 'Yeni Rota Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.name"
                  label="Rota Adı *"
                  prepend-inner-icon="mdi-map-marker"
                  :rules="[(v: string) => !!v || 'Rota adı gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.type"
                  :items="typeOptions"
                  item-title="label"
                  item-value="value"
                  label="Rota Tipi *"
                  prepend-inner-icon="mdi-routes"
                  :rules="[(v: string) => !!v || 'Rota tipi gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.distance"
                  label="Mesafe (km)"
                  type="number"
                  prepend-inner-icon="mdi-road"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.averageDurationMinutes"
                  label="Ortalama Süre (dakika)"
                  type="number"
                  prepend-inner-icon="mdi-clock"
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
                  v-model="form.description"
                  label="Açıklama"
                  rows="3"
                  prepend-inner-icon="mdi-text"
                />
              </v-col>
              <!-- Route Points - Basitleştirilmiş -->
              <v-col cols="12">
                <v-divider class="my-4" />
                <h3 class="text-subtitle-1 mb-3">Çıkış Noktası</h3>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.originName"
                  label="Çıkış Noktası Adı *"
                  prepend-inner-icon="mdi-map-marker"
                  :rules="[(v: string) => !!v || 'Çıkış noktası adı gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.originType"
                  :items="pointTypeOptions"
                  item-title="label"
                  item-value="value"
                  label="Çıkış Noktası Tipi"
                  prepend-inner-icon="mdi-shape"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.originAddress"
                  label="Çıkış Adresi"
                  prepend-inner-icon="mdi-map"
                />
              </v-col>
              <v-col cols="12">
                <v-divider class="my-4" />
                <h3 class="text-subtitle-1 mb-3">Varış Noktası</h3>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.destinationName"
                  label="Varış Noktası Adı *"
                  prepend-inner-icon="mdi-map-marker"
                  :rules="[(v: string) => !!v || 'Varış noktası adı gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.destinationType"
                  :items="pointTypeOptions"
                  item-title="label"
                  item-value="value"
                  label="Varış Noktası Tipi"
                  prepend-inner-icon="mdi-shape"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.destinationAddress"
                  label="Varış Adresi"
                  prepend-inner-icon="mdi-map"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveRoute" :loading="saving" :disabled="!formValid">
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
  
  // Route points'leri basit şekilde handle et
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
    } else {
      await http.post('/transfer/routes', routeData);
    }
    
    await loadRoutes();
    closeDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Rota kaydedilirken bir hata oluştu');
  } finally {
    saving.value = false;
  }
};

const deleteRoute = async (id: string) => {
  if (!confirm('Bu rotayı silmek istediğinizden emin misiniz?')) return;
  if (!auth.tenant) return;
  try {
    await http.delete(`/transfer/routes/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await loadRoutes();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Rota silinirken bir hata oluştu');
  }
};

onMounted(() => {
  loadRoutes();
});
</script>
