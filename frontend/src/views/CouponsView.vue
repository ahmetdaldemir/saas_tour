<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center justify-space-between bg-primary text-white">
            <div class="d-flex align-center">
              <v-icon icon="mdi-ticket-percent" class="mr-2" />
              <span class="text-h6 font-weight-bold">Kupon Yönetimi</span>
            </div>
            <v-btn
              color="white"
              variant="flat"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Yeni Kupon Oluştur
            </v-btn>
          </v-card-title>
          <v-divider />

          <v-card-text>
            <!-- Filters -->
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchQuery"
                  label="Kupon Kodu ile Ara"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  clearable
                  @input="loadCoupons"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="statusFilter"
                  :items="statusOptions"
                  label="Durum"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:model-value="loadCoupons"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="customerFilter"
                  :items="customerOptions"
                  label="Müşteri"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:model-value="loadCoupons"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-btn
                  color="primary"
                  variant="flat"
                  block
                  prepend-icon="mdi-refresh"
                  @click="loadCoupons"
                >
                  Yenile
                </v-btn>
              </v-col>
            </v-row>

            <!-- Coupons Table -->
            <v-data-table
              :headers="headers"
              :items="coupons"
              :loading="loading"
              item-value="id"
              class="elevation-0"
            >
              <template #item.code="{ item }">
                <v-chip color="primary" variant="flat" size="small">
                  {{ item.code }}
                </v-chip>
              </template>
              <template #item.value="{ item }">
                <span class="font-weight-bold">{{ formatPrice(item.value) }} {{ item.currencyCode || 'TRY' }}</span>
              </template>
              <template #item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                  variant="flat"
                >
                  {{ getStatusLabel(item.status) }}
                </v-chip>
              </template>
              <template #item.isSingleUse="{ item }">
                <v-icon :color="item.isSingleUse ? 'success' : 'info'">
                  {{ item.isSingleUse ? 'mdi-check-circle' : 'mdi-repeat' }}
                </v-icon>
              </template>
              <template #item.expiryDate="{ item }">
                {{ item.expiryDate ? formatDate(item.expiryDate) : 'Sınırsız' }}
              </template>
              <template #item.customerId="{ item }">
                <span v-if="item.customerId" class="text-caption">
                  {{ getCustomerName(item.customerId) }}
                </span>
                <span v-else class="text-grey">Tüm Müşteriler</span>
              </template>
              <template #item.createdAt="{ item }">
                {{ formatDateTime(item.createdAt) }}
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(item)"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Coupon Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon icon="mdi-ticket-percent" class="mr-2" />
          Yeni Kupon Oluştur
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="createFormRef" v-model="createFormValid">
            <v-select
              v-model="createForm.customerId"
              :items="customerOptions"
              label="Müşteri (Opsiyonel)"
              variant="outlined"
              clearable
              class="mb-4"
            />

            <v-text-field
              v-model.number="createForm.value"
              label="Kupon Değeri *"
              type="number"
              min="0"
              step="0.01"
              required
              :rules="[v => v !== null && v > 0 || 'Değer 0\'dan büyük olmalıdır']"
              prepend-icon="mdi-cash"
              class="mb-4"
            />

            <v-select
              v-model="createForm.currencyCode"
              :items="currencyOptions"
              label="Para Birimi"
              variant="outlined"
              class="mb-4"
            />

            <v-text-field
              v-model="createForm.expiryDate"
              label="Son Kullanma Tarihi (Opsiyonel)"
              type="date"
              variant="outlined"
              class="mb-4"
            />

            <v-switch
              v-model="createForm.isSingleUse"
              label="Tek Kullanımlık"
              color="primary"
              class="mb-4"
            />

            <v-textarea
              v-model="createForm.description"
              label="Açıklama (Opsiyonel)"
              rows="3"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreateDialog = false">İptal</v-btn>
          <v-btn
            color="primary"
            @click="createCoupon"
            :loading="creating"
            :disabled="!createFormValid"
          >
            Oluştur
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon icon="mdi-alert" class="mr-2" />
          Kuponu Sil
        </v-card-title>
        <v-card-text class="pt-4">
          <p>Bu kuponu silmek istediğinizden emin misiniz?</p>
          <v-chip v-if="couponToDelete" color="primary" variant="flat" class="mt-2">
            {{ couponToDelete.code }}
          </v-chip>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">İptal</v-btn>
          <v-btn
            color="error"
            @click="deleteCoupon"
            :loading="deleting"
          >
            Sil
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { http } from '../services/api.service';

interface Coupon {
  id: string;
  code: string;
  value: number;
  currencyCode: string;
  expiryDate?: string | null;
  isSingleUse: boolean;
  customerId?: string | null;
  status: 'unused' | 'used' | 'expired';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Customer {
  id: string;
  fullName: string;
  email?: string;
}

const loading = ref(false);
const creating = ref(false);
const deleting = ref(false);
const coupons = ref<Coupon[]>([]);
const customers = ref<Customer[]>([]);
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const customerFilter = ref<string | null>(null);
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const couponToDelete = ref<Coupon | null>(null);
const createFormValid = ref(false);
const createFormRef = ref<any>(null);

const createForm = ref({
  customerId: null as string | null,
  value: null as number | null,
  currencyCode: 'TRY',
  expiryDate: null as string | null,
  isSingleUse: true,
  description: '',
});

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

const headers = [
  { title: 'Kupon Kodu', key: 'code', sortable: true },
  { title: 'Değer', key: 'value', sortable: true },
  { title: 'Durum', key: 'status', sortable: true },
  { title: 'Tek Kullanım', key: 'isSingleUse', sortable: false },
  { title: 'Son Kullanma', key: 'expiryDate', sortable: true },
  { title: 'Müşteri', key: 'customerId', sortable: false },
  { title: 'Oluşturulma', key: 'createdAt', sortable: true },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const statusOptions = [
  { title: 'Kullanılmamış', value: 'unused' },
  { title: 'Kullanılmış', value: 'used' },
  { title: 'Süresi Dolmuş', value: 'expired' },
];

const currencyOptions = [
  { title: 'TRY', value: 'TRY' },
  { title: 'USD', value: 'USD' },
  { title: 'EUR', value: 'EUR' },
];

const customerOptions = computed(() => {
  if (!Array.isArray(customers.value)) {
    return [];
  }
  return customers.value.map(c => ({
    title: `${c.fullName}${c.email ? ` (${c.email})` : ''}`,
    value: c.id,
  }));
});

onMounted(() => {
  loadCoupons();
  loadCustomers();
});

const loadCoupons = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (searchQuery.value) params.code = searchQuery.value;
    if (statusFilter.value) params.status = statusFilter.value;
    if (customerFilter.value) params.customerId = customerFilter.value;

    const response = await http.get('/coupons', { params });
    const data = response.data;
    
    // Backend returns { success: true, data: coupons } or direct array
    // Ensure data is an array
    if (Array.isArray(data)) {
      coupons.value = data;
    } else if (data && Array.isArray(data.data)) {
      coupons.value = data.data;
    } else if (data && Array.isArray(data.items)) {
      coupons.value = data.items;
    } else {
      coupons.value = [];
    }
  } catch (error: any) {
    console.error('Failed to load coupons:', error);
    coupons.value = []; // Ensure it's always an array
    showSnackbar(error.response?.data?.message || 'Kuponlar yüklenirken bir hata oluştu', 'error');
  } finally {
    loading.value = false;
  }
};

const loadCustomers = async () => {
  try {
    const response = await http.get('/crm/customers');
    const data = response.data;
    
    // Backend returns direct array or { data: customers }
    // Ensure data is an array
    if (Array.isArray(data)) {
      customers.value = data;
    } else if (data && Array.isArray(data.data)) {
      customers.value = data.data;
    } else if (data && Array.isArray(data.items)) {
      customers.value = data.items;
    } else {
      customers.value = [];
    }
  } catch (error: any) {
    console.error('Failed to load customers:', error);
    customers.value = []; // Ensure it's always an array
  }
};

const createCoupon = async () => {
  if (!createForm.value.value || createForm.value.value <= 0) return;

  creating.value = true;
  try {
    const payload: any = {
      value: createForm.value.value,
      currencyCode: createForm.value.currencyCode,
      isSingleUse: createForm.value.isSingleUse,
    };

    if (createForm.value.customerId) {
      payload.customerId = createForm.value.customerId;
    }
    if (createForm.value.expiryDate) {
      payload.expiryDate = createForm.value.expiryDate;
    }
    if (createForm.value.description) {
      payload.description = createForm.value.description;
    }

    await http.post('/coupons', payload);
    
    showCreateDialog.value = false;
    createForm.value = {
      customerId: null,
      value: null,
      currencyCode: 'TRY',
      expiryDate: null,
      isSingleUse: true,
      description: '',
    };
    createFormValid.value = false;
    
    await loadCoupons();
    showSnackbar('Kupon başarıyla oluşturuldu', 'success');
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    showSnackbar(error.response?.data?.message || 'Kupon oluşturulurken bir hata oluştu', 'error');
  } finally {
    creating.value = false;
  }
};

const confirmDelete = (coupon: Coupon) => {
  couponToDelete.value = coupon;
  showDeleteDialog.value = true;
};

const deleteCoupon = async () => {
  if (!couponToDelete.value) return;

  deleting.value = true;
  try {
    await http.delete(`/coupons/${couponToDelete.value.id}`);
    showDeleteDialog.value = false;
    couponToDelete.value = null;
    await loadCoupons();
    showSnackbar('Kupon başarıyla silindi', 'success');
  } catch (error: any) {
    console.error('Failed to delete coupon:', error);
    showSnackbar(error.response?.data?.message || 'Kupon silinirken bir hata oluştu', 'error');
  } finally {
    deleting.value = false;
  }
};

const formatPrice = (price: number | string | null | undefined): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) || 0 : (price || 0);
  return Number(numPrice).toFixed(2);
};

const formatDate = (date?: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR');
};

const formatDateTime = (date?: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleString('tr-TR');
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    unused: 'success',
    used: 'info',
    expired: 'error',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    unused: 'Kullanılmamış',
    used: 'Kullanılmış',
    expired: 'Süresi Dolmuş',
  };
  return labels[status] || status;
};

const getCustomerName = (customerId: string): string => {
  if (!Array.isArray(customers.value)) {
    return customerId;
  }
  const customer = customers.value.find(c => c.id === customerId);
  return customer ? customer.fullName : customerId;
};

const showSnackbar = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}
</style>

