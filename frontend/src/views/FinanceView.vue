<template>
  <div class="finance-view">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold">Ön Muhasebe</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="mainTab = 'transactions'; openTransactionDialog()">
        İşlem Ekle
      </v-btn>
    </div>

    <!-- KPI Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-2">Toplam Gelir</div>
            <div class="text-h5 font-weight-bold text-success">{{ formatCurrency(summary.incomeTotal) }}</div>
            <div class="text-caption text-success mt-1">Planlanan: {{ formatCurrency(summary.incomePlanned) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-2">Toplam Gider</div>
            <div class="text-h5 font-weight-bold text-error">{{ formatCurrency(summary.expenseTotal) }}</div>
            <div class="text-caption text-error mt-1">Planlanan: {{ formatCurrency(summary.expensePlanned) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-2">Net Tutar</div>
            <div class="text-h5 font-weight-bold" :class="summary.netTotal >= 0 ? 'text-success' : 'text-error'">
              {{ formatCurrency(summary.netTotal) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-2">Vadesi Yaklaşan</div>
            <div class="text-h5 font-weight-bold text-warning">{{ summary.dueSoonCount }}</div>
            <div class="text-caption text-error mt-1">Geciken: {{ summary.overdueCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-card elevation="2" class="mb-4">
      <v-tabs v-model="mainTab" show-arrows>
        <v-tab value="dashboard">Dashboard</v-tab>
        <v-tab value="transactions">İşlemler</v-tab>
        <v-tab value="categories">Kategoriler</v-tab>
        <v-tab value="cari">Cari Hesaplar</v-tab>
        <v-tab value="checks">Çekler / Senetler</v-tab>
        <v-tab value="loans">Krediler</v-tab>
        <v-tab value="reminders">Hatırlatıcılar</v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="mainTab">
        <!-- Dashboard Tab -->
        <v-window-item value="dashboard">
          <FinanceDashboard
            :summary="summary"
            :date-range="dateRange"
            @update-date-range="dateRange = $event"
            @refresh="loadSummary"
          />
        </v-window-item>

        <!-- Transactions Tab -->
        <v-window-item value="transactions">
          <FinanceTransactions
            @open-dialog="openTransactionDialog"
          />
        </v-window-item>

        <!-- Categories Tab -->
        <v-window-item value="categories">
          <FinanceCategories />
        </v-window-item>

        <!-- Cari Tab -->
        <v-window-item value="cari">
          <FinanceCari />
        </v-window-item>

        <!-- Checks Tab -->
        <v-window-item value="checks">
          <FinanceChecks />
        </v-window-item>

        <!-- Loans Tab -->
        <v-window-item value="loans">
          <FinanceLoans />
        </v-window-item>

        <!-- Reminders Tab -->
        <v-window-item value="reminders">
          <FinanceReminders />
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { http } from '../modules/http';
import FinanceDashboard from '../components/finance/FinanceDashboard.vue';
import FinanceTransactions from '../components/finance/FinanceTransactions.vue';
import FinanceCategories from '../components/finance/FinanceCategories.vue';
import FinanceCari from '../components/finance/FinanceCari.vue';
import FinanceChecks from '../components/finance/FinanceChecks.vue';
import FinanceLoans from '../components/finance/FinanceLoans.vue';
import FinanceReminders from '../components/finance/FinanceReminders.vue';

const mainTab = ref('dashboard');
const dateRange = ref({ from: null as string | null, to: null as string | null });
const summary = ref({
  incomeTotal: 0,
  expenseTotal: 0,
  netTotal: 0,
  incomePlanned: 0,
  expensePlanned: 0,
  dueSoonCount: 0,
  overdueCount: 0,
});

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

const loadSummary = async () => {
  try {
    const params: any = {};
    if (dateRange.value.from) params.from = dateRange.value.from;
    if (dateRange.value.to) params.to = dateRange.value.to;

    // API henüz hazır olmadığı için geçici olarak hata yakalıyoruz
    try {
      const { data } = await http.get('/finance/reports/summary', { params });
      summary.value = data;
    } catch (apiError) {
      // API henüz hazır değil, varsayılan değerlerle devam et
      console.warn('Finance API not ready yet:', apiError);
    }
  } catch (error) {
    console.error('Failed to load summary:', error);
  }
};

const openTransactionDialog = () => {
  // Will be handled by FinanceTransactions component
  // Emit to child component if needed
};

onMounted(() => {
  loadSummary();
});
</script>

<style scoped>
.finance-view {
  padding: 24px;
}
</style>

