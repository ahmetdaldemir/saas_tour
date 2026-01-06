<template>
  <div class="transfer-pricing-page">
    <div class="page-header">
      <h2 class="page-title">Transfer Fiyatlandırması</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Fiyatlandırma Ekle
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="pricings"
      :loading="loading"
      item-value="id"
      class="pricing-table"
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
      <v-card class="pricing-dialog">
        <v-card-title class="dialog-header">
          <span class="dialog-title">{{ editingPricing ? 'Fiyatlandırma Düzenle' : 'Yeni Fiyatlandırma Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="dialog-body admin-form-scope">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
                <v-col cols="12" md="6">
                  <label class="form-label">Araç <span class="required">*</span></label>
                  <v-select
                    v-model="form.vehicleId"
                    :items="vehicles"
                    item-title="name"
                    item-value="id"
                    placeholder="Araç seçiniz"
                    prepend-inner-icon="mdi-car"
                    :rules="[(v: string) => !!v || 'Araç seçimi gereklidir']"
                    required
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    @update:model-value="loadPricings"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Rota <span class="required">*</span></label>
                  <v-select
                    v-model="form.routeId"
                    :items="routes"
                    item-title="name"
                    item-value="id"
                    placeholder="Rota seçiniz"
                    prepend-inner-icon="mdi-map-marker"
                    :rules="[(v: string) => !!v || 'Rota seçimi gereklidir']"
                    required
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Fiyatlandırma Modeli <span class="required">*</span></label>
                  <v-select
                    v-model="form.pricingModel"
                    :items="pricingModelOptions"
                    item-title="label"
                    item-value="value"
                    placeholder="Model seçiniz"
                    prepend-inner-icon="mdi-calculator"
                    :rules="[(v: string) => !!v || 'Fiyatlandırma modeli gereklidir']"
                    required
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Base Fiyat <span class="required">*</span></label>
                  <v-text-field
                    v-model.number="form.basePrice"
                    type="number"
                    placeholder="Örn: 100"
                    prepend-inner-icon="mdi-currency-eur"
                    :rules="[(v: number) => (v && v >= 0) || 'Base fiyat gereklidir']"
                    required
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Para Birimi</label>
                  <v-select
                    v-model="form.currencyCode"
                    :items="currencyOptions"
                    item-title="label"
                    item-value="value"
                    placeholder="Para birimi seçiniz"
                    prepend-inner-icon="mdi-cash"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Yolculuk Tipi</label>
                  <div class="switch-group">
                    <v-switch
                      v-model="form.isRoundTrip"
                      label="Gidiş-Dönüş"
                      color="primary"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Tarife Tipi</label>
                  <div class="switch-group">
                    <v-switch
                      v-model="form.isNightRate"
                      label="Gece Tarifesi"
                      color="warning"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col v-if="form.isNightRate" cols="12" md="6">
                  <label class="form-label">Gece Tarifesi Ek Ücreti</label>
                  <v-text-field
                    v-model.number="form.nightRateSurcharge"
                    type="number"
                    placeholder="Örn: 20"
                    prepend-inner-icon="mdi-currency-eur"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Min. Yolcu Sayısı</label>
                  <v-text-field
                    v-model.number="form.minPassengers"
                    type="number"
                    placeholder="Örn: 1"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Max. Yolcu Sayısı</label>
                  <v-text-field
                    v-model.number="form.maxPassengers"
                    type="number"
                    placeholder="Örn: 8"
                    prepend-inner-icon="mdi-account-group"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
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
                  <label class="form-label">Notlar</label>
                  <v-textarea
                    v-model="form.notes"
                    placeholder="Opsiyonel notlar..."
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
          <v-btn color="primary" variant="flat" @click="savePricing" :loading="saving" :disabled="!formValid">
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
import Swal from 'sweetalert2';

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
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Fiyatlandırma başarıyla güncellendi',
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      await http.post('/transfer/pricings', pricingData);
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Fiyatlandırma başarıyla eklendi',
        timer: 2000,
        showConfirmButton: false,
      });
    }
    
    await loadPricings();
    closeDialog();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Fiyatlandırma kaydedilirken bir hata oluştu',
    });
  } finally {
    saving.value = false;
  }
};

const deletePricing = async (id: string) => {
  const result = await Swal.fire({
    title: 'Emin misiniz?',
    text: 'Bu fiyatlandırmayı silmek istediğinizden emin misiniz?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;
  if (!auth.tenant) return;
  
  try {
    await http.delete(`/transfer/pricings/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Fiyatlandırma başarıyla silindi',
      timer: 2000,
      showConfirmButton: false,
    });
    await loadPricings();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: error.response?.data?.message || 'Fiyatlandırma silinirken bir hata oluştu',
    });
  }
};

onMounted(() => {
  loadPricings();
});
</script>

<style scoped>
.transfer-pricing-page {
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

.pricing-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

/* Dialog Styles */
.pricing-dialog {
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

/* Form Label Styles - Already handled by admin-forms.css */

/* Switch Group */
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

/* Responsive */
@media (max-width: 768px) {
  .transfer-pricing-page {
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
