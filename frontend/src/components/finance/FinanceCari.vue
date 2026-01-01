<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Cari Hesaplar</span>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Yeni Cari</v-btn>
      </v-card-title>
      <v-card-text>
        <!-- Arama -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              label="Ara"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              @update:model-value="loadCariler"
            />
          </v-col>
        </v-row>

        <!-- Cari Listesi -->
        <v-data-table
          :headers="headers"
          :items="cariler"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <template v-slot:item.kind="{ item }">
            <v-chip size="small">
              {{ item.kind === 'PERSON' ? 'Bireysel' : 'Kurumsal' }}
            </v-chip>
          </template>
          <template v-slot:item.balanceOpening="{ item }">
            {{ formatCurrency(Number(item.balanceOpening)) }}
          </template>
          <template v-slot:item.isActive="{ item }">
            <v-chip :color="item.isActive ? 'success' : 'default'" size="small">
              {{ item.isActive ? 'Aktif' : 'Pasif' }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon="mdi-eye" variant="text" size="small" @click="viewDetail(item)" />
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="editCari(item)" />
            <v-btn icon="mdi-delete" variant="text" size="small" @click="deleteCari(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Cari Dialog -->
    <v-dialog v-model="dialog" max-width="800" persistent>
      <v-card>
        <v-card-title>{{ editingCari ? 'Cari Düzenle' : 'Yeni Cari' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.kind"
                  :items="kindOptions"
                  label="Tip *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.title"
                  label="Ünvan / Ad Soyad *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.code"
                  label="Kod"
                  density="compact"
                  hint="Boş bırakılırsa otomatik oluşturulur"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.taxNo"
                  label="Vergi No / TC"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.phone"
                  label="Telefon"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.email"
                  label="E-posta"
                  type="email"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.address"
                  label="Adres"
                  rows="2"
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
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.balanceOpening"
                  type="number"
                  label="Açılış Bakiyesi"
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
              <v-col cols="12">
                <v-switch
                  v-model="form.isActive"
                  label="Aktif"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveCari">Kaydet</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Cari Detay Dialog -->
    <v-dialog v-model="detailDialog" max-width="900" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Cari Detay: {{ selectedCari?.title }}</span>
          <v-btn icon="mdi-close" variant="text" @click="detailDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-tabs v-model="detailTab">
            <v-tab value="info">Bilgiler</v-tab>
            <v-tab value="transactions">İşlemler</v-tab>
            <v-tab value="statement">Ekstre</v-tab>
          </v-tabs>
          <v-window v-model="detailTab">
            <v-window-item value="info">
              <div class="mt-4">
                <v-row>
                  <v-col cols="12" md="6"><strong>Kod:</strong> {{ selectedCari?.code }}</v-col>
                  <v-col cols="12" md="6"><strong>Tip:</strong> {{ selectedCari?.kind === 'PERSON' ? 'Bireysel' : 'Kurumsal' }}</v-col>
                  <v-col cols="12" md="6"><strong>Vergi No:</strong> {{ selectedCari?.taxNo || '-' }}</v-col>
                  <v-col cols="12" md="6"><strong>Telefon:</strong> {{ selectedCari?.phone || '-' }}</v-col>
                  <v-col cols="12" md="6"><strong>E-posta:</strong> {{ selectedCari?.email || '-' }}</v-col>
                  <v-col cols="12"><strong>Adres:</strong> {{ selectedCari?.address || '-' }}</v-col>
                  <v-col cols="12"><strong>Notlar:</strong> {{ selectedCari?.notes || '-' }}</v-col>
                </v-row>
              </div>
            </v-window-item>
            <v-window-item value="transactions">
              <div class="mt-4">
                <v-data-table
                  :headers="transactionHeaders"
                  :items="cariTransactions"
                  :loading="loadingTransactions"
                >
                  <template v-slot:item.date="{ item }">{{ formatDate(item.date) }}</template>
                  <template v-slot:item.amount="{ item }">
                    <span :class="item.type === 'INCOME' ? 'text-success' : 'text-error'">
                      {{ item.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(Number(item.amount)) }}
                    </span>
                  </template>
                </v-data-table>
              </div>
            </v-window-item>
            <v-window-item value="statement">
              <div class="mt-4 text-center text-medium-emphasis">
                Ekstre özelliği yakında eklenecek
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { http } from '../../modules/http';
import { useSnackbar } from '../../composables/useSnackbar';

const { showSuccess, showError } = useSnackbar();

const cariler = ref<any[]>([]);
const cariTransactions = ref<any[]>([]);
const loading = ref(false);
const loadingTransactions = ref(false);
const dialog = ref(false);
const detailDialog = ref(false);
const detailTab = ref('info');
const editingCari = ref<any>(null);
const selectedCari = ref<any>(null);
const searchQuery = ref('');
const formRef = ref();

const form = ref({
  kind: 'PERSON',
  title: '',
  code: '',
  taxNo: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  balanceOpening: 0,
  currency: 'TRY',
  isActive: true,
});

const headers = [
  { title: 'Kod', key: 'code' },
  { title: 'Ünvan / Ad Soyad', key: 'title' },
  { title: 'Tip', key: 'kind' },
  { title: 'Telefon', key: 'phone' },
  { title: 'E-posta', key: 'email' },
  { title: 'Açılış Bakiyesi', key: 'balanceOpening' },
  { title: 'Durum', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const transactionHeaders = [
  { title: 'Tarih', key: 'date' },
  { title: 'Tip', key: 'type' },
  { title: 'Açıklama', key: 'description' },
  { title: 'Tutar', key: 'amount' },
];

const kindOptions = [
  { title: 'Bireysel', value: 'PERSON' },
  { title: 'Kurumsal', value: 'COMPANY' },
];

const currencyOptions = [
  { title: 'TRY', value: 'TRY' },
  { title: 'USD', value: 'USD' },
  { title: 'EUR', value: 'EUR' },
];

const loadCariler = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (searchQuery.value) params.search = searchQuery.value;
    const { data } = await http.get('/finance/cari', { params });
    cariler.value = data;
  } catch (error: any) {
    showError(error.response?.data?.message || 'Cari hesaplar yüklenemedi');
  } finally {
    loading.value = false;
  }
};

const loadCariTransactions = async (cariId: string) => {
  loadingTransactions.value = true;
  try {
    const { data } = await http.get('/finance/transactions', { params: { cariId } });
    cariTransactions.value = data;
  } catch (error: any) {
    showError(error.response?.data?.message || 'İşlemler yüklenemedi');
  } finally {
    loadingTransactions.value = false;
  }
};

const openDialog = (cari?: any) => {
  editingCari.value = cari || null;
  if (cari) {
    form.value = {
      kind: cari.kind,
      title: cari.title,
      code: cari.code || '',
      taxNo: cari.taxNo || '',
      phone: cari.phone || '',
      email: cari.email || '',
      address: cari.address || '',
      notes: cari.notes || '',
      balanceOpening: Number(cari.balanceOpening),
      currency: cari.currency,
      isActive: cari.isActive,
    };
  } else {
    form.value = {
      kind: 'PERSON',
      title: '',
      code: '',
      taxNo: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      balanceOpening: 0,
      currency: 'TRY',
      isActive: true,
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingCari.value = null;
};

const saveCari = async () => {
  try {
    const payload = { ...form.value };
    if (payload.code === '') delete payload.code; // Let backend auto-generate

    if (editingCari.value) {
      await http.patch(`/finance/cari/${editingCari.value.id}`, payload);
      showSuccess('Cari güncellendi');
    } else {
      await http.post('/finance/cari', payload);
      showSuccess('Cari eklendi');
    }

    closeDialog();
    loadCariler();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Cari kaydedilemedi');
  }
};

const editCari = (cari: any) => {
  openDialog(cari);
};

const deleteCari = async (cari: any) => {
  if (!confirm('Bu cari hesabı silmek istediğinizden emin misiniz?')) return;

  try {
    await http.delete(`/finance/cari/${cari.id}`);
    showSuccess('Cari silindi');
    loadCariler();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Cari silinemedi');
  }
};

const viewDetail = (cari: any) => {
  selectedCari.value = cari;
  detailDialog.value = true;
  detailTab.value = 'info';
  loadCariTransactions(cari.id);
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

onMounted(() => {
  loadCariler();
});
</script>
