<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5">Transfer Fiyatlandırması</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Fiyatlandırma Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="pricings"
      :loading="loading"
      item-value="id"
    >
      <template #item.vehicle="{ item }">
        {{ item.vehicle?.name }}
      </template>
      <template #item.route="{ item }">
        {{ item.route?.name }}
      </template>
      <template #item.pricingModel="{ item }">
        <v-chip size="small" color="info" variant="tonal">
          {{ getPricingModelLabel(item.pricingModel) }}
        </v-chip>
      </template>
      <template #item.basePrice="{ item }">
        {{ item.basePrice }} {{ item.currencyCode }}
      </template>
      <template #item.isRoundTrip="{ item }">
        <v-chip :color="item.isRoundTrip ? 'success' : 'default'" size="small" variant="tonal">
          {{ item.isRoundTrip ? 'Gidiş-Dönüş' : 'Tek Yön' }}
        </v-chip>
      </template>
      <template #item.isNightRate="{ item }">
        <v-chip :color="item.isNightRate ? 'warning' : 'default'" size="small" variant="tonal">
          {{ item.isNightRate ? 'Gece Tarifesi' : 'Normal' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="editPricing(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deletePricing(item.id)" />
      </template>
    </v-data-table>

    <!-- Pricing Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ editingPricing ? 'Fiyatlandırma Düzenle' : 'Yeni Fiyatlandırma Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.vehicleId"
                  :items="vehicles"
                  item-title="name"
                  item-value="id"
                  label="Araç *"
                  prepend-inner-icon="mdi-car"
                  :rules="[(v: string) => !!v || 'Araç seçimi gereklidir']"
                  required
                  @update:model-value="loadPricings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.routeId"
                  :items="routes"
                  item-title="name"
                  item-value="id"
                  label="Rota *"
                  prepend-inner-icon="mdi-map-marker"
                  :rules="[(v: string) => !!v || 'Rota seçimi gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.pricingModel"
                  :items="pricingModelOptions"
                  item-title="label"
                  item-value="value"
                  label="Fiyatlandırma Modeli *"
                  prepend-inner-icon="mdi-calculator"
                  :rules="[(v: string) => !!v || 'Fiyatlandırma modeli gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.basePrice"
                  label="Base Fiyat *"
                  type="number"
                  prepend-inner-icon="mdi-currency-eur"
                  :rules="[(v: number) => (v && v >= 0) || 'Base fiyat gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.currencyCode"
                  :items="currencyOptions"
                  item-title="label"
                  item-value="value"
                  label="Para Birimi"
                  prepend-inner-icon="mdi-cash"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.isRoundTrip"
                  label="Gidiş-Dönüş"
                  color="success"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.isNightRate"
                  label="Gece Tarifesi"
                  color="warning"
                />
              </v-col>
              <v-col v-if="form.isNightRate" cols="12" md="6">
                <v-text-field
                  v-model.number="form.nightRateSurcharge"
                  label="Gece Tarifesi Ek Ücreti"
                  type="number"
                  prepend-inner-icon="mdi-currency-eur"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.minPassengers"
                  label="Min. Yolcu Sayısı"
                  type="number"
                  prepend-inner-icon="mdi-account"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.maxPassengers"
                  label="Max. Yolcu Sayısı"
                  type="number"
                  prepend-inner-icon="mdi-account-group"
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
          <v-btn color="primary" @click="savePricing" :loading="saving" :disabled="!formValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { http } from '../../modules/http';

const auth = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const pricings = ref<any[]>([]);
const vehicles = ref<any[]>([]);
const routes = ref<any[]>([]);
const showDialog = ref(false);
const formRef = ref<any>(null);
const formValid = ref(false);
const editingPricing = ref<any>(null);

const form = reactive({
  vehicleId: '',
  routeId: '',
  pricingModel: 'fixed' as string,
  basePrice: 0,
  currencyCode: 'EUR',
  isRoundTrip: false,
  isNightRate: false,
  nightRateSurcharge: undefined as number | undefined,
  minPassengers: undefined as number | undefined,
  maxPassengers: undefined as number | undefined,
  isActive: true,
  notes: '',
});

const pricingModelOptions = [
  { label: 'Sabit', value: 'fixed' },
  { label: 'Km Bazlı', value: 'per_km' },
  { label: 'Saatlik', value: 'per_hour' },
  { label: 'Araç Tipine Göre', value: 'per_vehicle_type' },
];

const currencyOptions = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'TRY (₺)', value: 'TRY' },
];

const headers = [
  { title: 'Araç', key: 'vehicle' },
  { title: 'Rota', key: 'route' },
  { title: 'Fiyatlandırma Modeli', key: 'pricingModel' },
  { title: 'Base Fiyat', key: 'basePrice' },
  { title: 'Tip', key: 'isRoundTrip' },
  { title: 'Tarife', key: 'isNightRate' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const loadPricings = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get('/transfer/pricings', {
      params: { tenantId: auth.tenant.id },
    });
    pricings.value = data;
  } catch (error) {
    console.error('Failed to load pricings:', error);
  } finally {
    loading.value = false;
  }
};

const loadVehicles = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get('/transfer/vehicles', {
      params: { tenantId: auth.tenant.id },
    });
    vehicles.value = data.filter((v: any) => v.isActive);
  } catch (error) {
    console.error('Failed to load vehicles:', error);
  }
};

const loadRoutes = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get('/transfer/routes', {
      params: { tenantId: auth.tenant.id },
    });
    routes.value = data.filter((r: any) => r.isActive);
  } catch (error) {
    console.error('Failed to load routes:', error);
  }
};

const getPricingModelLabel = (model: string) => {
  const labels: Record<string, string> = {
    fixed: 'Sabit',
    per_km: 'Km Bazlı',
    per_hour: 'Saatlik',
    per_vehicle_type: 'Araç Tipine Göre',
  };
  return labels[model] || model;
};

const resetForm = () => {
  form.vehicleId = '';
  form.routeId = '';
  form.pricingModel = 'fixed';
  form.basePrice = 0;
  form.currencyCode = 'EUR';
  form.isRoundTrip = false;
  form.isNightRate = false;
  form.nightRateSurcharge = undefined;
  form.minPassengers = undefined;
  form.maxPassengers = undefined;
  form.isActive = true;
  form.notes = '';
  editingPricing.value = null;
};

const openCreateDialog = async () => {
  resetForm();
  await Promise.all([loadVehicles(), loadRoutes()]);
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  resetForm();
};

const editPricing = async (item: any) => {
  editingPricing.value = item;
  form.vehicleId = item.vehicleId || '';
  form.routeId = item.routeId || '';
  form.pricingModel = item.pricingModel || 'fixed';
  form.basePrice = item.basePrice || 0;
  form.currencyCode = item.currencyCode || 'EUR';
  form.isRoundTrip = item.isRoundTrip ?? false;
  form.isNightRate = item.isNightRate ?? false;
  form.nightRateSurcharge = item.nightRateSurcharge;
  form.minPassengers = item.minPassengers;
  form.maxPassengers = item.maxPassengers;
  form.isActive = item.isActive ?? true;
  form.notes = item.notes || '';
  await Promise.all([loadVehicles(), loadRoutes()]);
  showDialog.value = true;
};

const savePricing = async () => {
  if (!auth.tenant) return;
  
  const validated = await formRef.value?.validate();
  if (!validated?.valid) return;
  
  saving.value = true;
  try {
    const pricingData = {
      tenantId: auth.tenant.id,
      vehicleId: form.vehicleId,
      routeId: form.routeId,
      pricingModel: form.pricingModel,
      basePrice: form.basePrice,
      currencyCode: form.currencyCode,
      isRoundTrip: form.isRoundTrip,
      isNightRate: form.isNightRate,
      nightRateSurcharge: form.nightRateSurcharge || undefined,
      minPassengers: form.minPassengers || undefined,
      maxPassengers: form.maxPassengers || undefined,
      isActive: form.isActive,
      notes: form.notes || undefined,
    };
    
    if (editingPricing.value) {
      await http.put(`/transfer/pricings/${editingPricing.value.id}`, pricingData, {
        params: { tenantId: auth.tenant.id },
      });
    } else {
      await http.post('/transfer/pricings', pricingData);
    }
    
    await loadPricings();
    closeDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Fiyatlandırma kaydedilirken bir hata oluştu');
  } finally {
    saving.value = false;
  }
};

const deletePricing = async (id: string) => {
  if (!confirm('Bu fiyatlandırmayı silmek istediğinizden emin misiniz?')) return;
  if (!auth.tenant) return;
  try {
    await http.delete(`/transfer/pricings/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await loadPricings();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Fiyatlandırma silinirken bir hata oluştu');
  }
};

onMounted(() => {
  loadPricings();
});
</script>
