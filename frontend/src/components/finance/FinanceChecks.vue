<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Çekler / Senetler</span>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Yeni Çek/Senet</v-btn>
      </v-card-title>
      <v-card-text>
        <!-- Filtreler -->
        <v-row class="mb-4">
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.direction"
              :items="directionOptions"
              label="Yön"
              clearable
              density="compact"
              @update:model-value="loadChecks"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Durum"
              clearable
              density="compact"
              @update:model-value="loadChecks"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.from"
              type="date"
              label="Vade Başlangıç"
              density="compact"
              @update:model-value="loadChecks"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.to"
              type="date"
              label="Vade Bitiş"
              density="compact"
              @update:model-value="loadChecks"
            />
          </v-col>
        </v-row>

        <!-- Çek/Senet Listesi -->
        <v-data-table
          :headers="headers"
          :items="checks"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <template v-slot:item.direction="{ item }">
            <v-chip :color="item.direction === 'RECEIVABLE' ? 'success' : 'error'" size="small">
              {{ item.direction === 'RECEIVABLE' ? 'Alacak' : 'Borç' }}
            </v-chip>
          </template>
          <template v-slot:item.maturityDate="{ item }">
            <span :class="getMaturityDateClass(item.maturityDate)">
              {{ formatDate(item.maturityDate) }}
            </span>
          </template>
          <template v-slot:item.amount="{ item }">
            {{ formatCurrency(Number(item.amount)) }}
          </template>
          <template v-slot:item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
              </template>
              <v-list>
                <v-list-item @click="markStatus(item, 'COLLECTED')" v-if="item.direction === 'RECEIVABLE'">
                  <v-list-item-title>Tahsil Et</v-list-item-title>
                </v-list-item>
                <v-list-item @click="markStatus(item, 'PAID')" v-if="item.direction === 'PAYABLE'">
                  <v-list-item-title>Öde</v-list-item-title>
                </v-list-item>
                <v-list-item @click="markStatus(item, 'ENDORSED')">
                  <v-list-item-title>Ciro Et</v-list-item-title>
                </v-list-item>
                <v-list-item @click="editCheck(item)">
                  <v-list-item-title>Düzenle</v-list-item-title>
                </v-list-item>
                <v-list-item @click="deleteCheck(item)">
                  <v-list-item-title class="text-error">Sil</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Çek/Senet Dialog -->
    <v-dialog v-model="dialog" max-width="800" persistent>
      <v-card>
        <v-card-title>{{ editingCheck ? 'Çek/Senet Düzenle' : 'Yeni Çek/Senet' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.direction"
                  :items="directionOptions"
                  label="Yön *"
                  required
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
                <v-text-field
                  v-model="form.checkNo"
                  label="Çek/Senet No"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.bankName"
                  label="Banka"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.issuer"
                  label="Keşideci"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.issueDate"
                  type="date"
                  label="Düzenleme Tarihi"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.maturityDate"
                  type="date"
                  label="Vade Tarihi *"
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
                  v-model="form.currency"
                  :items="currencyOptions"
                  label="Para Birimi"
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
              <v-col cols="12">
                <v-textarea
                  v-model="form.description"
                  label="Açıklama"
                  rows="2"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveCheck">Kaydet</v-btn>
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

const checks = ref<any[]>([]);
const cariler = ref<any[]>([]);
const loading = ref(false);
const dialog = ref(false);
const editingCheck = ref<any>(null);
const formRef = ref();

const filters = ref({
  direction: null as string | null,
  status: null as string | null,
  from: null as string | null,
  to: null as string | null,
});

const form = ref({
  direction: 'RECEIVABLE',
  cariId: null as string | null,
  checkNo: '',
  bankName: '',
  issuer: '',
  issueDate: '',
  maturityDate: '',
  amount: 0,
  currency: 'TRY',
  status: 'IN_PORTFOLIO',
  description: '',
});

const headers = [
  { title: 'Yön', key: 'direction' },
  { title: 'Çek/Senet No', key: 'checkNo' },
  { title: 'Banka', key: 'bankName' },
  { title: 'Cari', key: 'cari.title' },
  { title: 'Vade Tarihi', key: 'maturityDate' },
  { title: 'Tutar', key: 'amount' },
  { title: 'Durum', key: 'status' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const directionOptions = [
  { title: 'Alacak', value: 'RECEIVABLE' },
  { title: 'Borç', value: 'PAYABLE' },
];

const statusOptions = [
  { title: 'Portföyde', value: 'IN_PORTFOLIO' },
  { title: 'Ciro Edildi', value: 'ENDORSED' },
  { title: 'Tahsil Edildi', value: 'COLLECTED' },
  { title: 'Ödendi', value: 'PAID' },
  { title: 'İade', value: 'RETURNED' },
  { title: 'İptal', value: 'CANCELLED' },
];

const currencyOptions = [
  { title: 'TRY', value: 'TRY' },
  { title: 'USD', value: 'USD' },
  { title: 'EUR', value: 'EUR' },
];

const loadChecks = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filters.value.direction) params.direction = filters.value.direction;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.from) params.from = filters.value.from;
    if (filters.value.to) params.to = filters.value.to;

    const { data } = await http.get('/finance/checks', { params });
    checks.value = data;
  } catch (error: any) {
    showError(error.response?.data?.message || 'Çekler/Senetler yüklenemedi');
  } finally {
    loading.value = false;
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

const openDialog = (check?: any) => {
  editingCheck.value = check || null;
  if (check) {
    form.value = {
      direction: check.direction,
      cariId: check.cariId,
      checkNo: check.checkNo || '',
      bankName: check.bankName || '',
      issuer: check.issuer || '',
      issueDate: check.issueDate ? check.issueDate.split('T')[0] : '',
      maturityDate: check.maturityDate.split('T')[0],
      amount: Number(check.amount),
      currency: check.currency,
      status: check.status,
      description: check.description || '',
    };
  } else {
    form.value = {
      direction: 'RECEIVABLE',
      cariId: null,
      checkNo: '',
      bankName: '',
      issuer: '',
      issueDate: '',
      maturityDate: '',
      amount: 0,
      currency: 'TRY',
      status: 'IN_PORTFOLIO',
      description: '',
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingCheck.value = null;
};

const saveCheck = async () => {
  try {
    const payload = { ...form.value };
    if (!payload.issueDate) payload.issueDate = null;

    if (editingCheck.value) {
      await http.patch(`/finance/checks/${editingCheck.value.id}`, payload);
      showSuccess('Çek/Senet güncellendi');
    } else {
      await http.post('/finance/checks', payload);
      showSuccess('Çek/Senet eklendi');
    }

    closeDialog();
    loadChecks();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Çek/Senet kaydedilemedi');
  }
};

const editCheck = (check: any) => {
  openDialog(check);
};

const deleteCheck = async (check: any) => {
  if (!confirm('Bu çek/senet kaydını silmek istediğinizden emin misiniz?')) return;

  try {
    await http.delete(`/finance/checks/${check.id}`);
    showSuccess('Çek/Senet silindi');
    loadChecks();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Çek/Senet silinemedi');
  }
};

const markStatus = async (check: any, status: string) => {
  try {
    await http.post(`/finance/checks/${check.id}/mark`, { status });
    showSuccess('Durum güncellendi');
    loadChecks();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Durum güncellenemedi');
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
    IN_PORTFOLIO: 'default',
    ENDORSED: 'warning',
    COLLECTED: 'success',
    PAID: 'success',
    RETURNED: 'error',
    CANCELLED: 'error',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    IN_PORTFOLIO: 'Portföyde',
    ENDORSED: 'Ciro Edildi',
    COLLECTED: 'Tahsil Edildi',
    PAID: 'Ödendi',
    RETURNED: 'İade',
    CANCELLED: 'İptal',
  };
  return texts[status] || status;
};

const getMaturityDateClass = (date: string): string => {
  const maturityDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  maturityDate.setHours(0, 0, 0, 0);

  if (maturityDate < today) return 'text-error font-weight-bold';
  const daysDiff = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 3) return 'text-warning font-weight-bold';
  return '';
};

onMounted(() => {
  loadChecks();
  loadCariler();
});
</script>
