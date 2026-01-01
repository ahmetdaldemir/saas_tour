<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Krediler</span>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Yeni Kredi</v-btn>
      </v-card-title>
      <v-card-text>
        <!-- Filtreler -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Durum"
              clearable
              density="compact"
              @update:model-value="loadLoans"
            />
          </v-col>
        </v-row>

        <!-- Krediler Listesi -->
        <v-data-table
          :headers="headers"
          :items="loans"
          :loading="loading"
          item-value="id"
          class="elevation-0"
          @click:row="viewLoanDetail"
        >
          <template v-slot:item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          <template v-slot:item.principal="{ item }">
            {{ formatCurrency(Number(item.principal)) }}
          </template>
          <template v-slot:item.totalCost="{ item }">
            {{ formatCurrency(Number(item.totalCost || item.principal)) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon="mdi-eye" variant="text" size="small" @click.stop="viewLoanDetail(item)" />
            <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="editLoan(item)" />
            <v-btn icon="mdi-delete" variant="text" size="small" @click.stop="deleteLoan(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Kredi Dialog -->
    <v-dialog v-model="dialog" max-width="800" persistent>
      <v-card>
        <v-card-title>{{ editingLoan ? 'Kredi Düzenle' : 'Yeni Kredi' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="form.title"
                  label="Başlık *"
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
                  v-model.number="form.principal"
                  type="number"
                  label="Ana Para *"
                  required
                  density="compact"
                  prefix="₺"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.interestRate"
                  type="number"
                  label="Faiz Oranı (%)"
                  density="compact"
                  suffix="%"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.totalCost"
                  type="number"
                  label="Toplam Tutar"
                  density="compact"
                  prefix="₺"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.startDate"
                  type="date"
                  label="Başlangıç Tarihi *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.paymentDay"
                  type="number"
                  label="Ödeme Günü (1-28) *"
                  required
                  min="1"
                  max="28"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.termCount"
                  type="number"
                  label="Taksit Sayısı *"
                  required
                  density="compact"
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
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Notlar"
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
          <v-btn color="primary" @click="saveLoan">Kaydet</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Kredi Detay Dialog -->
    <v-dialog v-model="detailDialog" max-width="1000" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Kredi Detay: {{ selectedLoan?.title }}</span>
          <div>
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              variant="text"
              @click="regenerateInstallments"
              :loading="regenerating"
              class="mr-2"
            >
              Taksitleri Yeniden Oluştur
            </v-btn>
            <v-btn
              color="error"
              prepend-icon="mdi-close-circle"
              variant="text"
              @click="closeLoan"
              v-if="selectedLoan?.status === 'ACTIVE'"
            >
              Krediyi Kapat
            </v-btn>
            <v-btn icon="mdi-close" variant="text" @click="detailDialog = false" />
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <div><strong>Ana Para:</strong> {{ formatCurrency(Number(selectedLoan?.principal || 0)) }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div><strong>Toplam Tutar:</strong> {{ formatCurrency(Number(selectedLoan?.totalCost || selectedLoan?.principal || 0)) }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div><strong>Durum:</strong> {{ getStatusText(selectedLoan?.status) }}</div>
            </v-col>
          </v-row>

          <v-divider class="mb-4" />

          <div class="text-h6 mb-4">Taksitler</div>
          <v-data-table
            :headers="installmentHeaders"
            :items="installments"
            :loading="loadingInstallments"
            item-value="id"
          >
            <template v-slot:item.dueDate="{ item }">
              <span :class="getDueDateClass(item.dueDate, item.status)">
                {{ formatDate(item.dueDate) }}
              </span>
            </template>
            <template v-slot:item.amount="{ item }">
              {{ formatCurrency(Number(item.amount)) }}
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getInstallmentStatusColor(item.status)" size="small">
                {{ getInstallmentStatusText(item.status) }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                color="success"
                size="small"
                prepend-icon="mdi-check"
                @click="payInstallment(item)"
                :disabled="item.status === 'PAID'"
              >
                Öde
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Taksit Ödeme Dialog -->
    <v-dialog v-model="paymentDialog" max-width="500">
      <v-card>
        <v-card-title>Taksit Ödeme</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="paymentAmount"
            type="number"
            label="Ödeme Tutarı *"
            required
            prefix="₺"
            :hint="`Taksit Tutarı: ${formatCurrency(Number(selectedInstallment?.amount || 0))}`"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="paymentDialog = false">İptal</v-btn>
          <v-btn color="primary" @click="confirmPayment">Öde</v-btn>
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

const loans = ref<any[]>([]);
const installments = ref<any[]>([]);
const cariler = ref<any[]>([]);
const loading = ref(false);
const loadingInstallments = ref(false);
const regenerating = ref(false);
const dialog = ref(false);
const detailDialog = ref(false);
const paymentDialog = ref(false);
const editingLoan = ref<any>(null);
const selectedLoan = ref<any>(null);
const selectedInstallment = ref<any>(null);
const paymentAmount = ref(0);
const statusFilter = ref<string | null>(null);
const formRef = ref();

const form = ref({
  title: '',
  cariId: null as string | null,
  principal: 0,
  interestRate: null as number | null,
  totalCost: null as number | null,
  currency: 'TRY',
  startDate: '',
  paymentDay: 1,
  termCount: 0,
  notes: '',
});

const headers = [
  { title: 'Başlık', key: 'title' },
  { title: 'Cari', key: 'cari.title' },
  { title: 'Ana Para', key: 'principal' },
  { title: 'Toplam Tutar', key: 'totalCost' },
  { title: 'Başlangıç Tarihi', key: 'startDate' },
  { title: 'Taksit Sayısı', key: 'termCount' },
  { title: 'Durum', key: 'status' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const installmentHeaders = [
  { title: 'Taksit No', key: 'installmentNo' },
  { title: 'Vade Tarihi', key: 'dueDate' },
  { title: 'Tutar', key: 'amount' },
  { title: 'Durum', key: 'status' },
  { title: 'Ödeme Tarihi', key: 'paidAt' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const statusOptions = [
  { title: 'Aktif', value: 'ACTIVE' },
  { title: 'Kapalı', value: 'CLOSED' },
  { title: 'İptal', value: 'CANCELLED' },
];

const currencyOptions = [
  { title: 'TRY', value: 'TRY' },
  { title: 'USD', value: 'USD' },
  { title: 'EUR', value: 'EUR' },
];

const loadLoans = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (statusFilter.value) params.status = statusFilter.value;
    const { data } = await http.get('/finance/loans', { params });
    loans.value = data;
  } catch (error: any) {
    showError(error.response?.data?.message || 'Krediler yüklenemedi');
  } finally {
    loading.value = false;
  }
};

const loadLoanInstallments = async (loanId: string) => {
  loadingInstallments.value = true;
  try {
    const { data } = await http.get('/finance/loan-installments', { params: { loanId } });
    installments.value = data;
  } catch (error: any) {
    showError(error.response?.data?.message || 'Taksitler yüklenemedi');
  } finally {
    loadingInstallments.value = false;
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

const openDialog = (loan?: any) => {
  editingLoan.value = loan || null;
  if (loan) {
    form.value = {
      title: loan.title,
      cariId: loan.cariId,
      principal: Number(loan.principal),
      interestRate: loan.interestRate ? Number(loan.interestRate) : null,
      totalCost: loan.totalCost ? Number(loan.totalCost) : null,
      currency: loan.currency,
      startDate: loan.startDate.split('T')[0],
      paymentDay: loan.paymentDay,
      termCount: loan.termCount,
      notes: loan.notes || '',
    };
  } else {
    form.value = {
      title: '',
      cariId: null,
      principal: 0,
      interestRate: null,
      totalCost: null,
      currency: 'TRY',
      startDate: new Date().toISOString().split('T')[0],
      paymentDay: 1,
      termCount: 0,
      notes: '',
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingLoan.value = null;
};

const saveLoan = async () => {
  try {
    const payload = { ...form.value };

    if (editingLoan.value) {
      await http.patch(`/finance/loans/${editingLoan.value.id}`, payload);
      showSuccess('Kredi güncellendi');
    } else {
      await http.post('/finance/loans', payload);
      showSuccess('Kredi eklendi');
    }

    closeDialog();
    loadLoans();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Kredi kaydedilemedi');
  }
};

const editLoan = (loan: any) => {
  openDialog(loan);
};

const deleteLoan = async (loan: any) => {
  if (!confirm('Bu krediyi silmek istediğinizden emin misiniz?')) return;

  try {
    await http.delete(`/finance/loans/${loan.id}`);
    showSuccess('Kredi silindi');
    loadLoans();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Kredi silinemedi');
  }
};

const viewLoanDetail = (loan: any) => {
  selectedLoan.value = loan;
  detailDialog.value = true;
  loadLoanInstallments(loan.id);
};

const regenerateInstallments = async () => {
  if (!selectedLoan.value) return;
  if (!confirm('Taksitleri yeniden oluşturmak istediğinizden emin misiniz? Ödenmiş taksitler varsa bu işlem yapılamaz.')) return;

  regenerating.value = true;
  try {
    await http.post(`/finance/loans/${selectedLoan.value.id}/regenerate-installments`);
    showSuccess('Taksitler yeniden oluşturuldu');
    loadLoanInstallments(selectedLoan.value.id);
  } catch (error: any) {
    showError(error.response?.data?.message || 'Taksitler yeniden oluşturulamadı');
  } finally {
    regenerating.value = false;
  }
};

const closeLoan = async () => {
  if (!selectedLoan.value) return;
  if (!confirm('Bu krediyi kapatmak istediğinizden emin misiniz?')) return;

  try {
    await http.post(`/finance/loans/${selectedLoan.value.id}/close`);
    showSuccess('Kredi kapatıldı');
    loadLoans();
    detailDialog.value = false;
  } catch (error: any) {
    showError(error.response?.data?.message || 'Kredi kapatılamadı');
  }
};

const payInstallment = (installment: any) => {
  selectedInstallment.value = installment;
  paymentAmount.value = Number(installment.amount);
  paymentDialog.value = true;
};

const confirmPayment = async () => {
  if (!selectedInstallment.value) return;

  try {
    await http.post(`/finance/loan-installments/${selectedInstallment.value.id}/pay`, {
      paidAmount: paymentAmount.value,
    });
    showSuccess('Taksit ödendi');
    paymentDialog.value = false;
    loadLoanInstallments(selectedLoan.value.id);
  } catch (error: any) {
    showError(error.response?.data?.message || 'Taksit ödenemedi');
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
    ACTIVE: 'success',
    CLOSED: 'default',
    CANCELLED: 'error',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    ACTIVE: 'Aktif',
    CLOSED: 'Kapalı',
    CANCELLED: 'İptal',
  };
  return texts[status] || status;
};

const getInstallmentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PLANNED: 'default',
    DUE: 'warning',
    OVERDUE: 'error',
    PAID: 'success',
    CANCELLED: 'error',
  };
  return colors[status] || 'default';
};

const getInstallmentStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    PLANNED: 'Planlandı',
    DUE: 'Vadesi Geldi',
    OVERDUE: 'Gecikmiş',
    PAID: 'Ödendi',
    CANCELLED: 'İptal',
  };
  return texts[status] || status;
};

const getDueDateClass = (date: string, status: string): string => {
  if (status === 'PAID') return '';
  const dueDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate < today) return 'text-error font-weight-bold';
  const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 3) return 'text-warning font-weight-bold';
  return '';
};

onMounted(() => {
  loadLoans();
  loadCariler();
});
</script>
