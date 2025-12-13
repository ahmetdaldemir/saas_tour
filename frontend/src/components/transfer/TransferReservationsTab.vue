<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5">Transfer Rezervasyonları</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Yeni Rezervasyon
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="reservations"
      :loading="loading"
      item-value="id"
    >
      <template #item.reference="{ item }">
        <v-chip size="small" color="primary">{{ item.reference }}</v-chip>
      </template>
      <template #item.status="{ item }">
        <v-chip :color="getStatusColor(item.status)" size="small">
          {{ getStatusLabel(item.status) }}
        </v-chip>
      </template>
      <template #item.transferDate="{ item }">
        {{ formatDate(item.transferDate) }} {{ item.transferTime }}
      </template>
      <template #item.vehicle="{ item }">
        {{ item.vehicle?.name }}
      </template>
      <template #item.totalPrice="{ item }">
        {{ item.totalPrice }} {{ item.currencyCode }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-eye" variant="text" size="small" @click="viewReservation(item)" />
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="editReservation(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteReservation(item.id)" />
      </template>
    </v-data-table>

    <!-- Reservation View Dialog -->
    <v-dialog v-model="showViewDialog" max-width="700" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">Rezervasyon Detayları</span>
          <v-btn icon="mdi-close" variant="text" @click="showViewDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6" v-if="viewingReservation">
          <v-row>
            <v-col cols="12" md="6">
              <strong>Referans:</strong> {{ viewingReservation.reference }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Durum:</strong>
              <v-chip :color="getStatusColor(viewingReservation.status)" size="small" class="ml-2">
                {{ getStatusLabel(viewingReservation.status) }}
              </v-chip>
            </v-col>
            <v-col cols="12" md="6">
              <strong>Tarih:</strong> {{ formatDate(viewingReservation.transferDate) }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Saat:</strong> {{ viewingReservation.transferTime }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Araç:</strong> {{ viewingReservation.vehicle?.name }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Rota:</strong> {{ viewingReservation.route?.name }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Yolcu Adı:</strong> {{ viewingReservation.passengerName }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Yolcu Sayısı:</strong> {{ viewingReservation.passengerCount }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Telefon:</strong> {{ viewingReservation.passengerPhone }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>E-posta:</strong> {{ viewingReservation.passengerEmail }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Toplam Fiyat:</strong> {{ viewingReservation.totalPrice }} {{ viewingReservation.currencyCode }}
            </v-col>
            <v-col cols="12" v-if="viewingReservation.pickupAddress">
              <strong>Alış Adresi:</strong> {{ viewingReservation.pickupAddress }}
            </v-col>
            <v-col cols="12" v-if="viewingReservation.dropoffAddress">
              <strong>Bırakış Adresi:</strong> {{ viewingReservation.dropoffAddress }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showViewDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reservation Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ editingReservation ? 'Rezervasyon Düzenle' : 'Yeni Rezervasyon' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
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
                  v-model="form.vehicleId"
                  :items="vehicles"
                  item-title="name"
                  item-value="id"
                  label="Araç *"
                  prepend-inner-icon="mdi-car"
                  :rules="[(v: string) => !!v || 'Araç seçimi gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.driverId"
                  :items="drivers"
                  item-title="name"
                  item-value="id"
                  label="Şoför"
                  prepend-inner-icon="mdi-account"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Durum *"
                  prepend-inner-icon="mdi-information"
                  :rules="[(v: string) => !!v || 'Durum seçimi gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.transferDate"
                  label="Transfer Tarihi *"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  :rules="[(v: string) => !!v || 'Tarih gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.transferTime"
                  label="Transfer Saati *"
                  type="time"
                  prepend-inner-icon="mdi-clock"
                  :rules="[(v: string) => !!v || 'Saat gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.passengerName"
                  label="Yolcu Adı *"
                  prepend-inner-icon="mdi-account"
                  :rules="[(v: string) => !!v || 'Yolcu adı gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.passengerEmail"
                  label="E-posta *"
                  type="email"
                  prepend-inner-icon="mdi-email"
                  :rules="[(v: string) => !!v || 'E-posta gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.passengerPhone"
                  label="Telefon *"
                  prepend-inner-icon="mdi-phone"
                  :rules="[(v: string) => !!v || 'Telefon gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="form.passengerCount"
                  label="Yolcu Sayısı *"
                  type="number"
                  prepend-inner-icon="mdi-account-group"
                  :rules="[(v: number) => (v && v > 0) || 'Yolcu sayısı gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="form.luggageCount"
                  label="Bagaj Sayısı"
                  type="number"
                  prepend-inner-icon="mdi-bag-suitcase"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="form.totalPrice"
                  label="Toplam Fiyat *"
                  type="number"
                  prepend-inner-icon="mdi-currency-eur"
                  :rules="[(v: number) => (v && v >= 0) || 'Toplam fiyat gereklidir']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.pickupAddress"
                  label="Alış Adresi"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.dropoffAddress"
                  label="Bırakış Adresi"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.flightNumber"
                  label="Uçuş Numarası"
                  prepend-inner-icon="mdi-airplane"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.currencyCode"
                  label="Para Birimi"
                  prepend-inner-icon="mdi-cash"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.customerNotes"
                  label="Müşteri Notları"
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
          <v-btn color="primary" @click="saveReservation" :loading="saving" :disabled="!formValid">
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
const reservations = ref<any[]>([]);
const vehicles = ref<any[]>([]);
const routes = ref<any[]>([]);
const drivers = ref<any[]>([]);
const showDialog = ref(false);
const showViewDialog = ref(false);
const formRef = ref<any>(null);
const formValid = ref(false);
const editingReservation = ref<any>(null);
const viewingReservation = ref<any>(null);

const form = reactive({
  routeId: '',
  vehicleId: '',
  driverId: null as string | null,
  status: 'pending' as string,
  transferDate: '',
  transferTime: '',
  passengerName: '',
  passengerEmail: '',
  passengerPhone: '',
  passengerCount: 1,
  luggageCount: 0,
  totalPrice: 0,
  pickupAddress: '',
  dropoffAddress: '',
  flightNumber: '',
  currencyCode: 'EUR',
  customerNotes: '',
});

const statusOptions = [
  { label: 'Beklemede', value: 'pending' },
  { label: 'Onaylandı', value: 'confirmed' },
  { label: 'Devam Ediyor', value: 'in_progress' },
  { label: 'Tamamlandı', value: 'completed' },
  { label: 'İptal', value: 'cancelled' },
];

const headers = [
  { title: 'Referans', key: 'reference' },
  { title: 'Durum', key: 'status' },
  { title: 'Tarih & Saat', key: 'transferDate' },
  { title: 'Araç', key: 'vehicle' },
  { title: 'Yolcu', key: 'passengerName' },
  { title: 'Toplam Fiyat', key: 'totalPrice' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const loadReservations = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get('/transfer/reservations', {
      params: { tenantId: auth.tenant.id },
    });
    reservations.value = data;
  } catch (error) {
    console.error('Failed to load reservations:', error);
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

const loadDrivers = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get('/transfer/drivers', {
      params: { tenantId: auth.tenant.id },
    });
    drivers.value = data.filter((d: any) => d.isActive && d.isAvailable);
  } catch (error) {
    console.error('Failed to load drivers:', error);
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    confirmed: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    in_progress: 'Devam Ediyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
  };
  return labels[status] || status;
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('tr-TR');
};

const resetForm = () => {
  form.routeId = '';
  form.vehicleId = '';
  form.driverId = null;
  form.status = 'pending';
  form.transferDate = '';
  form.transferTime = '';
  form.passengerName = '';
  form.passengerEmail = '';
  form.passengerPhone = '';
  form.passengerCount = 1;
  form.luggageCount = 0;
  form.totalPrice = 0;
  form.pickupAddress = '';
  form.dropoffAddress = '';
  form.flightNumber = '';
  form.currencyCode = 'EUR';
  form.customerNotes = '';
  editingReservation.value = null;
};

const openCreateDialog = async () => {
  resetForm();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  form.transferDate = tomorrow.toISOString().split('T')[0];
  form.transferTime = '09:00';
  await Promise.all([loadVehicles(), loadRoutes(), loadDrivers()]);
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  resetForm();
};

const viewReservation = (item: any) => {
  viewingReservation.value = item;
  showViewDialog.value = true;
};

const editReservation = async (item: any) => {
  editingReservation.value = item;
  form.routeId = item.routeId || '';
  form.vehicleId = item.vehicleId || '';
  form.driverId = item.driverId || null;
  form.status = item.status || 'pending';
  form.transferDate = item.transferDate ? item.transferDate.split('T')[0] : '';
  form.transferTime = item.transferTime || '';
  form.passengerName = item.passengerName || '';
  form.passengerEmail = item.passengerEmail || '';
  form.passengerPhone = item.passengerPhone || '';
  form.passengerCount = item.passengerCount || 1;
  form.luggageCount = item.luggageCount || 0;
  form.totalPrice = item.totalPrice || 0;
  form.pickupAddress = item.pickupAddress || '';
  form.dropoffAddress = item.dropoffAddress || '';
  form.flightNumber = item.flightNumber || '';
  form.currencyCode = item.currencyCode || 'EUR';
  form.customerNotes = item.customerNotes || '';
  await Promise.all([loadVehicles(), loadRoutes(), loadDrivers()]);
  showDialog.value = true;
};

const saveReservation = async () => {
  if (!auth.tenant) return;
  
  const validated = await formRef.value?.validate();
  if (!validated?.valid) return;
  
  saving.value = true;
  try {
    const reservationData = {
      tenantId: auth.tenant.id,
      routeId: form.routeId,
      vehicleId: form.vehicleId,
      driverId: form.driverId || undefined,
      status: form.status,
      transferDate: form.transferDate,
      transferTime: form.transferTime,
      passengerName: form.passengerName,
      passengerEmail: form.passengerEmail,
      passengerPhone: form.passengerPhone,
      passengerCount: form.passengerCount,
      luggageCount: form.luggageCount || 0,
      totalPrice: form.totalPrice,
      pickupAddress: form.pickupAddress || undefined,
      dropoffAddress: form.dropoffAddress || undefined,
      flightNumber: form.flightNumber || undefined,
      currencyCode: form.currencyCode || 'EUR',
      customerNotes: form.customerNotes || undefined,
    };
    
    if (editingReservation.value) {
      await http.put(`/transfer/reservations/${editingReservation.value.id}`, reservationData, {
        params: { tenantId: auth.tenant.id },
      });
    } else {
      await http.post('/transfer/reservations', reservationData);
    }
    
    await loadReservations();
    closeDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Rezervasyon kaydedilirken bir hata oluştu');
  } finally {
    saving.value = false;
  }
};

const deleteReservation = async (id: string) => {
  if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return;
  if (!auth.tenant) return;
  try {
    await http.delete(`/transfer/reservations/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await loadReservations();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Rezervasyon silinirken bir hata oluştu');
  }
};

onMounted(() => {
  loadReservations();
});
</script>
