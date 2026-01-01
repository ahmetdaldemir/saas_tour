<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>İşlemler</span>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Yeni İşlem</v-btn>
      </v-card-title>
      <v-card-text>
        <!-- Filtreler -->
        <v-row class="mb-4">
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.type"
              :items="typeOptions"
              label="Tip"
              clearable
              density="compact"
              @update:model-value="loadTransactions"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Durum"
              clearable
              density="compact"
              @update:model-value="loadTransactions"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.from"
              type="date"
              label="Başlangıç"
              density="compact"
              @update:model-value="loadTransactions"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.to"
              type="date"
              label="Bitiş"
              density="compact"
              @update:model-value="loadTransactions"
            />
          </v-col>
        </v-row>

        <!-- İşlem Listesi -->
        <v-data-table
          :headers="headers"
          :items="transactions"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <template v-slot:item.type="{ item }">
            <v-chip :color="item.type === 'INCOME' ? 'success' : 'error'" size="small">
              {{ item.type === 'INCOME' ? 'Gelir' : 'Gider' }}
            </v-chip>
          </template>
          <template v-slot:item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          <template v-slot:item.date="{ item }">
            {{ formatDate(item.date) }}
          </template>
          <template v-slot:item.amount="{ item }">
            <span :class="item.type === 'INCOME' ? 'text-success' : 'text-error'">
              {{ item.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
            </span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="editTransaction(item)" />
            <v-btn icon="mdi-delete" variant="text" size="small" @click="deleteTransaction(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- İşlem Dialog -->
    <v-dialog v-model="dialog" max-width="800" persistent>
      <v-card>
        <v-card-title>{{ editingTransaction ? 'İşlem Düzenle' : 'Yeni İşlem' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.type"
                  :items="typeOptions"
                  label="Tip *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.status"
                  :items="statusOptions"
                  label="Durum *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.date"
                  type="date"
                  label="Tarih *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.amount"
                  type="number"
                  label="Tutar *"
                  required
                  density="compact"
                  prefix="₺"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Kategori"
                  clearable
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.cariId"
                  :items="cariler"
                  item-title="title"
                  item-value="id"
                  label="Cari"
                  clearable
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.paymentMethod"
                  :items="paymentMethodOptions"
                  label="Ödeme Yöntemi"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.description"
                  label="Açıklama"
                  rows="2"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.referenceNo"
                  label="Referans No"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveTransaction">Kaydet</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { http } from '../../modules/http';
import { useSnackbar } from '../../composables/useSnackbar';

const { showSuccess, showError } = useSnackbar();

const transactions = ref<any[]>([]);
const categories = ref<any[]>([]);
const cariler = ref<any[]>([]);
const loading = ref(false);
const dialog = ref(false);
const editingTransaction = ref<any>(null);
const formRef = ref();

const filters = ref({
  type: null as string | null,
  status: null as string | null,
  from: null as string | null,
  to: null as string | null,
});

const form = ref({
  type: 'INCOME',
  status: 'PAID',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  categoryId: null as string | null,
  cariId: null as string | null,
  paymentMethod: 'TRANSFER',
  description: '',
  referenceNo: '',
});

const headers = [
  { title: 'Tarih', key: 'date' },
  { title: 'Tip', key: 'type' },
  { title: 'Durum', key: 'status' },
  { title: 'Kategori', key: 'category.name' },
  { title: 'Cari', key: 'cari.title' },
  { title: 'Tutar', key: 'amount' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const typeOptions = [
  { title: 'Gelir', value: 'INCOME' },
  { title: 'Gider', value: 'EXPENSE' },
];

const statusOptions = [
  { title: 'Ödendi', value: 'PAID' },
  { title: 'Planlandı', value: 'PLANNED' },
  { title: 'İptal', value: 'CANCELLED' },
];

const paymentMethodOptions = [
  { title: 'Nakit', value: 'CASH' },
  { title: 'Kart', value: 'CARD' },
  { title: 'Havale', value: 'TRANSFER' },
  { title: 'Çek', value: 'CHECK' },
  { title: 'Diğer', value: 'OTHER' },
];

const loadTransactions = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.from) params.from = filters.value.from;
    if (filters.value.to) params.to = filters.value.to;

    const { data } = await http.get('/finance/transactions', { params });
    transactions.value = data;
  } catch (error: any) {
    showError(error.response?.data?.message || 'İşlemler yüklenemedi');
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const { data } = await http.get('/finance/categories');
    categories.value = data;
  } catch (error) {
    console.error('Categories load error:', error);
  }
};

const loadCariler = async () => {
  try {
    const { data } = await http.get('/finance/cari');
    cariler.value = data;
  } catch (error) {
    console.error('Cariler load error:', error);
  }
};

const openDialog = (transaction?: any) => {
  editingTransaction.value = transaction || null;
  if (transaction) {
    form.value = {
      type: transaction.type,
      status: transaction.status,
      date: transaction.date.split('T')[0],
      amount: Number(transaction.amount),
      categoryId: transaction.categoryId,
      cariId: transaction.cariId,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description || '',
      referenceNo: transaction.referenceNo || '',
    };
  } else {
    form.value = {
      type: 'INCOME',
      status: 'PAID',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      categoryId: null,
      cariId: null,
      paymentMethod: 'TRANSFER',
      description: '',
      referenceNo: '',
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingTransaction.value = null;
};

const saveTransaction = async () => {
  try {
    const payload = {
      ...form.value,
      amount: Number(form.value.amount),
    };

    if (editingTransaction.value) {
      await http.patch(`/finance/transactions/${editingTransaction.value.id}`, payload);
      showSuccess('İşlem güncellendi');
    } else {
      await http.post('/finance/transactions', payload);
      showSuccess('İşlem eklendi');
    }

    closeDialog();
    loadTransactions();
  } catch (error: any) {
    showError(error.response?.data?.message || 'İşlem kaydedilemedi');
  }
};

const editTransaction = (transaction: any) => {
  openDialog(transaction);
};

const deleteTransaction = async (transaction: any) => {
  if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;

  try {
    await http.delete(`/finance/transactions/${transaction.id}`);
    showSuccess('İşlem silindi');
    loadTransactions();
  } catch (error: any) {
    showError(error.response?.data?.message || 'İşlem silinemedi');
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('tr-TR');
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PAID: 'success',
    PLANNED: 'warning',
    CANCELLED: 'error',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    PAID: 'Ödendi',
    PLANNED: 'Planlandı',
    CANCELLED: 'İptal',
  };
  return texts[status] || status;
};

onMounted(() => {
  loadTransactions();
  loadCategories();
  loadCariler();
});
</script>
