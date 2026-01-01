<template>
  <v-container fluid class="dashboard-container">
    <!-- Currency Rates - Üst Kısım (Kompakt) -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex align-center justify-space-between pa-3">
            <span class="text-subtitle-1 font-weight-bold">Currency Rates</span>
            <v-btn
              icon="mdi-refresh"
              size="small"
              variant="text"
              :loading="updatingRates"
              @click="updateCurrencyRates"
            />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-if="loadingCurrencies" class="text-center py-4">
              <v-progress-circular indeterminate color="primary" size="24" />
            </div>
            <div v-else-if="currencies.length > 0" class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="currency in currencies"
                :key="currency.id"
                :color="currency.isBaseCurrency ? 'primary' : 'default'"
                variant="flat"
                size="small"
                class="px-3"
              >
                <span class="font-weight-bold mr-2 text-caption">{{ currency.code }}</span>
                <span class="text-caption">{{ formatCurrencyRateCompact(currency.rateToTry) }}</span>
              </v-chip>
            </div>
            <div v-else class="text-center py-3">
              <v-icon icon="mdi-currency-usd" size="32" color="grey-lighten-1" class="mb-2" />
              <p class="text-caption text-medium-emphasis">No currency data available</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dashboard Metrics Cards (Kompakt) -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3" v-for="metric in metrics" :key="metric.key">
        <v-card elevation="2" rounded="lg" class="metric-card-compact">
          <v-card-text class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis mb-1">{{ metric.label }}</div>
                <div class="d-flex align-baseline gap-1">
                  <span class="text-h6 font-weight-bold">
                    {{ formatNumber(stats[metric.key as keyof typeof stats]) }}
                  </span>
                  <span v-if="metric.unit" class="text-caption text-medium-emphasis">{{ metric.unit }}</span>
                </div>
                <div v-if="metric.trend" class="d-flex align-center gap-1 mt-1">
                  <v-icon
                    :icon="metric.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                    size="14"
                    :color="metric.trend > 0 ? 'success' : 'error'"
                  />
                  <span class="text-caption" :class="metric.trend > 0 ? 'text-success' : 'text-error'">
                    {{ Math.abs(metric.trend) }}%
                  </span>
                </div>
              </div>
              <v-avatar
                size="40"
                :color="metric.iconColor"
                variant="tonal"
                class="ml-2"
              >
                <v-icon :icon="metric.icon" :color="metric.iconColor" size="20" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reservation Chart (Kompakt) -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Monthly Reservation Statistics</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-if="loadingChart" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" size="24" />
              <p class="mt-2 text-caption text-medium-emphasis">Loading chart...</p>
            </div>
            <div v-else style="position: relative; height: 250px;">
              <Line :data="chartData" :options="chartOptions" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reminders and Messages (Kompakt) -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Reminders & Messages</span>
          </v-card-title>
          <v-divider />
          
          <!-- Message Form -->
          <v-card-text class="pa-3">
            <v-form @submit.prevent="addMessage" class="mb-3">
              <v-row dense>
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="messageForm.date"
                    type="date"
                    density="compact"
                    variant="outlined"
                    label="Date"
                    hide-details
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="messageForm.time"
                    type="time"
                    density="compact"
                    variant="outlined"
                    label="Time"
                    hide-details
                    prepend-inner-icon="mdi-clock-outline"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn color="primary" block size="small" @click="addMessage">
                    <v-icon icon="mdi-plus" size="16" class="mr-1" />
                    Add
                  </v-btn>
                </v-col>
              </v-row>
              <v-row dense class="mt-1">
                <v-col cols="12">
                  <v-text-field
                    v-model="messageForm.subject"
                    density="compact"
                    variant="outlined"
                    label="Subject"
                    hide-details
                    prepend-inner-icon="mdi-format-title"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="messageForm.detail"
                    density="compact"
                    variant="outlined"
                    label="Detail"
                    rows="2"
                    hide-details
                    prepend-inner-icon="mdi-text"
                  />
                </v-col>
              </v-row>
            </v-form>
            
            <!-- Messages List -->
            <div v-if="messages.length > 0">
              <v-data-table
                :headers="messageHeaders"
                :items="messages"
                :items-per-page="5"
                density="compact"
                class="compact-table"
                hide-default-footer
              >
                <template #item.date="{ item }">
                  <span class="text-caption font-weight-medium">{{ item.date }}</span>
                </template>
                <template #item.time="{ item }">
                  <v-chip size="x-small" variant="tonal" color="primary">{{ item.time }}</v-chip>
                </template>
                <template #item.actions="{ item }">
                  <v-btn
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="deleteMessage(item.id)"
                  />
                </template>
              </v-data-table>
            </div>
            <div v-else class="empty-state-compact">
              <v-icon icon="mdi-message-outline" size="32" color="grey-lighten-1" />
              <p class="text-caption text-medium-emphasis mt-1">No messages yet</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewAllMessages"
            >
              View All Messages
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Payment Reminders -->
      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Daily Payment Reminders</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-if="paymentReminders.length > 0">
              <v-data-table
                :headers="paymentHeaders"
                :items="paymentReminders"
                :items-per-page="5"
                density="compact"
                class="compact-table"
                hide-default-footer
              >
                <template #item.amount="{ item }">
                  <span class="text-caption font-weight-bold text-primary">{{ formatCurrency(item.amount) }}</span>
                </template>
                <template #item.status="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-chip
                      :color="item.paid ? 'success' : 'error'"
                      size="x-small"
                      variant="flat"
                    >
                      {{ item.paid ? 'Paid' : 'Unpaid' }}
                    </v-chip>
                    <v-btn
                      v-if="!item.paid"
                      size="x-small"
                      color="success"
                      variant="flat"
                      icon="mdi-check"
                      @click="markPaymentPaid(item.id)"
                    />
                  </div>
                </template>
              </v-data-table>
            </div>
            <div v-else class="empty-state-compact">
              <v-icon icon="mdi-credit-card-off-outline" size="32" color="grey-lighten-1" />
              <p class="text-caption text-medium-emphasis mt-1">No payment reminders</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewPaymentSchedule"
            >
              View Payment Schedule
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Warnings Section (Kompakt) -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Insurance/Inspection Warnings</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-if="insuranceWarnings.length > 0">
              <v-data-table
                :headers="insuranceHeaders"
                :items="insuranceWarnings"
                :items-per-page="5"
                density="compact"
                class="compact-table"
                hide-default-footer
              />
            </div>
            <div v-else class="empty-state-compact">
              <v-icon icon="mdi-shield-off-outline" size="32" color="grey-lighten-1" />
              <p class="text-caption text-medium-emphasis mt-1">No warnings</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewAllInsurance"
            >
              View All Insurance/Inspections
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Maintenance Warnings -->
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Vehicle Maintenance Warnings</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-if="maintenanceWarnings.length > 0">
              <v-data-table
                :headers="maintenanceHeaders"
                :items="maintenanceWarnings"
                :items-per-page="5"
                density="compact"
                class="compact-table"
                hide-default-footer
              />
            </div>
            <div v-else class="empty-state-compact">
              <v-icon icon="mdi-wrench-clock-outline" size="32" color="grey-lighten-1" />
              <p class="text-caption text-medium-emphasis mt-1">No maintenance warnings</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewAllMaintenance"
            >
              View All Maintenance
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Penalty Warnings -->
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Penalty Warnings</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-if="penaltyWarnings.length > 0">
              <v-data-table
                :headers="penaltyHeaders"
                :items="penaltyWarnings"
                :items-per-page="5"
                density="compact"
                class="compact-table"
                hide-default-footer
              >
                <template #item.remaining="{ item }">
                  <v-chip
                    :color="item.remaining < 0 ? 'error' : 'warning'"
                    size="x-small"
                    variant="flat"
                  >
                    {{ item.remaining }} Days
                  </v-chip>
                </template>
              </v-data-table>
            </div>
            <div v-else class="empty-state-compact">
              <v-icon icon="mdi-check-circle-outline" size="32" color="grey-lighten-1" />
              <p class="text-caption text-medium-emphasis mt-1">No penalty warnings</p>
            </div>
            <div class="d-flex gap-2 mt-2">
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                prepend-icon="mdi-file-upload-outline"
                @click="uploadPenaltyFile"
              >
                Upload File
              </v-btn>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                prepend-icon="mdi-arrow-right"
                @click="viewAllPenalties"
              >
                View All
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { http } from '../modules/http';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const auth = useAuthStore();
const router = useRouter();

// Metrics configuration
const metrics = computed(() => [
  {
    key: 'vehiclesDeparting24h',
    label: 'Departing in 24h',
    icon: 'mdi-timer-outline',
    iconColor: 'primary',
    trend: 5,
  },
  {
    key: 'notDeparted',
    label: 'Not Departed',
    icon: 'mdi-car-outline',
    iconColor: 'info',
  },
  {
    key: 'totalBusinessDays',
    label: 'Total Business Days',
    icon: 'mdi-calendar-month',
    iconColor: 'primary',
  },
  {
    key: 'deliveredVehicles',
    label: 'Delivered Vehicles',
    icon: 'mdi-car-check',
    iconColor: 'success',
    trend: 12,
  },
  {
    key: 'vehiclesReturning24h',
    label: 'Returning in 24h',
    icon: 'mdi-timer-outline',
    iconColor: 'warning',
  },
  {
    key: 'notReturned',
    label: 'Not Returned',
    icon: 'mdi-car-off',
    iconColor: 'error',
  },
  {
    key: 'monthlyReservations',
    label: 'Monthly Reservations',
    icon: 'mdi-calendar-month-outline',
    iconColor: 'info',
    trend: 8,
  },
  {
    key: 'toBeDelivered',
    label: 'To Be Delivered',
    icon: 'mdi-car-clock',
    iconColor: 'success',
  },
  {
    key: 'totalReservations',
    label: 'Total Reservations',
    icon: 'mdi-currency-eur',
    iconColor: 'success',
    trend: 15,
  },
  {
    key: 'dailyReservations',
    label: 'Daily Reservations',
    icon: 'mdi-calendar-today',
    iconColor: 'info',
  },
  {
    key: 'canceledReservations',
    label: 'Canceled Reservations',
    icon: 'mdi-account-cancel',
    iconColor: 'error',
    trend: -3,
  },
  {
    key: 'customerSatisfaction',
    label: 'Customer Satisfaction',
    icon: 'mdi-chart-line',
    iconColor: 'primary',
    unit: '%',
    trend: 2,
  },
]);

// Dashboard Stats
const stats = ref({
  vehiclesDeparting24h: 0,
  notDeparted: 1,
  totalBusinessDays: 6451,
  deliveredVehicles: 941,
  vehiclesReturning24h: 1,
  notReturned: 1,
  monthlyReservations: 15,
  toBeDelivered: 7,
  totalReservations: 1051,
  dailyReservations: 1,
  canceledReservations: 103,
  customerSatisfaction: 96,
});

// Messages
const messageForm = ref({
  date: new Date().toISOString().split('T')[0],
  time: '00:00',
  subject: '',
  detail: '',
});

const messages = ref<any[]>([]);
const messageHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Date', key: 'date', width: '100px' },
  { title: 'Time', key: 'time', width: '80px' },
  { title: 'Subject', key: 'subject' },
  { title: 'Actions', key: 'actions', sortable: false, width: '60px', align: 'center' as const },
];

// Payment Reminders
const paymentReminders = ref<any[]>([]);
const paymentHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Bank', key: 'bank', width: '120px' },
  { title: 'Type', key: 'type', width: '80px' },
  { title: 'Amount', key: 'amount', width: '100px' },
  { title: 'Status', key: 'status', sortable: false, width: '120px' },
  { title: 'Date', key: 'date', width: '100px' },
  { title: 'Description', key: 'description' },
];

// Insurance Warnings
const insuranceWarnings = ref<any[]>([]);
const insuranceHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Plate', key: 'plate', width: '90px' },
  { title: 'Action', key: 'action', width: '100px' },
  { title: 'Start', key: 'startDate', width: '90px' },
  { title: 'End', key: 'endDate', width: '90px' },
  { title: 'Remaining', key: 'remaining', width: '80px' },
];

// Maintenance Warnings
const maintenanceWarnings = ref<any[]>([]);
const maintenanceHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Plate', key: 'plate', width: '90px' },
  { title: 'Action', key: 'action', width: '100px' },
  { title: 'Maint. Date', key: 'maintenanceDate', width: '100px' },
  { title: 'Maint. Km', key: 'maintenanceKm', width: '90px' },
  { title: 'Vehicle Km', key: 'vehicleKm', width: '90px' },
  { title: 'Remaining', key: 'remaining', width: '80px' },
];

// Penalty Warnings
const penaltyWarnings = ref<any[]>([]);
const penaltyHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Plate', key: 'plate', width: '90px' },
  { title: 'Type', key: 'type', width: '100px' },
  { title: 'Date', key: 'date', width: '90px' },
  { title: 'Amount', key: 'amount', width: '90px' },
  { title: 'Remaining', key: 'remaining', width: '100px' },
  { title: 'Description', key: 'description' },
];

// Currency
interface CurrencyDto {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  rateToTry: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  lastUpdatedAt?: string;
  autoUpdate: boolean;
}

const currencies = ref<CurrencyDto[]>([]);
const updatingRates = ref(false);

// Chart data
const loadingChart = ref(false);
const loadingCurrencies = ref(false);
const reservations = ref<any[]>([]);

// Prepare chart data
const chartData = computed(() => {
  // Son 12 ayı hazırla
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const currentDate = new Date();
  const last12Months: string[] = [];
  const monthData: number[] = new Array(12).fill(0);

  // Son 12 ayın isimlerini hazırla (ters sırada)
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    last12Months.push(months[date.getMonth()] + ' ' + date.getFullYear());
  }

  // Rezervasyonları aylara göre say
  reservations.value.forEach((reservation) => {
    const createdDate = new Date(reservation.createdAt);
    const monthDiff = (currentDate.getFullYear() - createdDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - createdDate.getMonth());
    
    if (monthDiff >= 0 && monthDiff < 12) {
      monthData[11 - monthDiff] += 1;
    }
  });

  return {
    labels: last12Months,
    datasets: [
      {
        label: 'Rezervasyon Sayısı',
        data: monthData,
        borderColor: 'rgb(25, 118, 210)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(25, 118, 210)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        font: { size: 11 },
        padding: 8,
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 8,
      titleFont: {
        size: 12,
        weight: 'bold' as const,
      },
      bodyFont: {
        size: 11,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        precision: 0,
        font: { size: 10 },
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      ticks: {
        font: { size: 10 },
      },
      grid: {
        display: false,
      },
    },
  },
};

// Load reservations for chart
const loadReservations = async () => {
  if (!auth.tenant) return;
  loadingChart.value = true;
  try {
    const { data } = await http.get('/reservations', {
      params: { tenantId: auth.tenant.id },
    });
    reservations.value = data;
  } catch (error) {
    console.error('Failed to load reservations:', error);
  } finally {
    loadingChart.value = false;
  }
};

// Helper functions
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR').format(num);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatCurrencyRate = (rate: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(rate) + ' ₺';
};

const formatCurrencyRateCompact = (rate: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate) + ' TRY';
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

// Load Dashboard Data
const loadDashboardData = async () => {
  if (!auth.tenant) return;
  
  try {
    // TODO: Backend API endpoint'leri eklendiğinde burada çağrılacak
    stats.value = {
      vehiclesDeparting24h: 0,
      notDeparted: 1,
      totalBusinessDays: 6451,
      deliveredVehicles: 941,
      vehiclesReturning24h: 1,
      notReturned: 1,
      monthlyReservations: 15,
      toBeDelivered: 7,
      totalReservations: 1051,
      dailyReservations: 1,
      canceledReservations: 103,
      customerSatisfaction: 96,
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
};

// Load Currencies
const loadCurrencies = async () => {
  loadingCurrencies.value = true;
  try {
    const { data } = await http.get<CurrencyDto[]>('/currencies');
    currencies.value = data.filter(c => c.isActive).sort((a, b) => {
      // Base currency first, then alphabetically
      if (a.isBaseCurrency) return -1;
      if (b.isBaseCurrency) return 1;
      return a.code.localeCompare(b.code);
    });
  } catch (error) {
    console.error('Failed to load currencies:', error);
  } finally {
    loadingCurrencies.value = false;
  }
};

// Update Currency Rates
const updateCurrencyRates = async () => {
  updatingRates.value = true;
  try {
    await http.post('/currencies/update-rates');
    await loadCurrencies(); // Reload to get updated rates
  } catch (error) {
    console.error('Failed to update currency rates:', error);
  } finally {
    updatingRates.value = false;
  }
};

const addMessage = () => {
  if (!messageForm.value.subject || !messageForm.value.detail) return;
  
  messages.value.unshift({
    id: messages.value.length + 1,
    date: messageForm.value.date.split('-').reverse().join('-'),
    time: messageForm.value.time,
    subject: messageForm.value.subject,
    detail: messageForm.value.detail,
  });
  
  messageForm.value.subject = '';
  messageForm.value.detail = '';
};

const deleteMessage = (id: number) => {
  const index = messages.value.findIndex(m => m.id === id);
  if (index > -1) {
    messages.value.splice(index, 1);
  }
};

const viewAllMessages = () => {
  console.log('View all messages');
};

const markPaymentPaid = (id: number) => {
  const payment = paymentReminders.value.find(p => p.id === id);
  if (payment) {
    payment.paid = true;
  }
};

const viewPaymentSchedule = () => {
  console.log('View payment schedule');
};

const viewAllInsurance = () => {
  console.log('View all insurance');
};

const viewAllMaintenance = () => {
  console.log('View all maintenance');
};

const uploadPenaltyFile = () => {
  console.log('Upload penalty file');
};

const viewAllPenalties = () => {
  console.log('View all penalties');
};

onMounted(() => {
  loadDashboardData();
  loadCurrencies();
  loadReservations();
});
</script>

<style scoped>
.dashboard-container {
  padding: 16px !important;
  background: #f5f5f5;
  min-height: 100vh;
}

/* Metric Cards - Kompakt */
.metric-card-compact {
  background: white;
  transition: all 0.2s ease;
}

.metric-card-compact:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Compact Table */
:deep(.compact-table) {
  background: transparent;
}

:deep(.compact-table .v-data-table__thead) {
  background: rgba(0, 0, 0, 0.02);
}

:deep(.compact-table .v-data-table__thead th) {
  font-weight: 600;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px;
}

:deep(.compact-table .v-data-table__tbody tr) {
  transition: background 0.2s;
}

:deep(.compact-table .v-data-table__tbody tr:hover) {
  background: rgba(25, 118, 210, 0.04);
}

:deep(.compact-table .v-data-table__tbody td) {
  padding: 8px 12px;
  font-size: 0.75rem;
}

/* Empty State - Kompakt */
.empty-state-compact {
  text-align: center;
  padding: 24px 16px;
  color: #94a3b8;
}

</style>
