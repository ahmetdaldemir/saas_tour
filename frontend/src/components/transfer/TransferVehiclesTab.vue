<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5">Transfer Araçları</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Araç Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="vehicles"
      :loading="loading"
      item-value="id"
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
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.name"
                  label="Araç Adı *"
                  prepend-inner-icon="mdi-car"
                  :rules="[(v: string) => !!v || 'Araç adı gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.type"
                  :items="typeOptions"
                  item-title="label"
                  item-value="value"
                  label="Araç Tipi *"
                  prepend-inner-icon="mdi-shape"
                  :rules="[(v: string) => !!v || 'Araç tipi gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="form.passengerCapacity"
                  label="Yolcu Kapasitesi *"
                  type="number"
                  prepend-inner-icon="mdi-account"
                  :rules="[(v: number) => (v && v > 0) || 'Yolcu kapasitesi gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="form.luggageCapacity"
                  label="Bagaj Kapasitesi *"
                  type="number"
                  prepend-inner-icon="mdi-bag-suitcase"
                  :rules="[(v: number) => (v && v >= 0) || 'Bagaj kapasitesi gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="form.hasDriver"
                  label="Şoförlü"
                  color="success"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.features"
                  :items="featureOptions"
                  item-title="label"
                  item-value="value"
                  label="Özellikler"
                  multiple
                  chips
                  prepend-inner-icon="mdi-star"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.imageUrl"
                  label="Görsel URL"
                  prepend-inner-icon="mdi-image"
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
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveVehicle" :loading="saving" :disabled="!formValid">
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
    } else {
      await http.post('/transfer/vehicles', vehicleData);
    }
    
    await loadVehicles();
    closeDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Araç kaydedilirken bir hata oluştu');
  } finally {
    saving.value = false;
  }
};

const deleteVehicle = async (id: string) => {
  if (!confirm('Bu aracı silmek istediğinizden emin misiniz?')) return;
  if (!auth.tenant) return;
  try {
    await http.delete(`/transfer/vehicles/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await loadVehicles();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Araç silinirken bir hata oluştu');
  }
};

onMounted(() => {
  loadVehicles();
});
</script>

