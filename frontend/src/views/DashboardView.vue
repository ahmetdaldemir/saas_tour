<template>
  <div class="dashboard-container">
    <!-- Currency Rates - Üst Kısım -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="1" rounded="lg" class="currency-section-card">
          <v-card-title class="px-6 py-4 border-b">
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center">
                <v-icon icon="mdi-currency-usd" size="24" class="mr-3 text-primary" />
                <div>
                  <div class="text-h6 font-weight-medium">Döviz Kurları</div>
                  <div class="text-caption text-medium-emphasis">Güncel döviz kuru bilgileri</div>
                </div>
              </div>
              <v-btn
                icon="mdi-refresh"
                size="small"
                variant="outlined"
                color="primary"
                :loading="updatingRates"
                @click="updateCurrencyRates"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </div>
          </v-card-title>
          
          <v-card-text class="pa-6">
            <div v-if="currencies.length > 0">
              <v-row>
                <v-col
                  v-for="currency in currencies"
                  :key="currency.id"
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <v-card
                    elevation="0"
                    rounded="lg"
                    :class="['currency-item-card', { 'currency-base-item': currency.isBaseCurrency }]"
                    variant="outlined"
                  >
                    <v-card-text class="pa-4">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <div class="d-flex align-center">
                          <div
                            :class="[
                              'currency-code-box',
                              currency.isBaseCurrency ? 'code-box-primary' : 'code-box-default'
                            ]"
                          >
                            {{ currency.code }}
                          </div>
                          <div class="ml-3">
                            <div class="text-body-2 font-weight-medium">{{ currency.name }}</div>
                            <div v-if="currency.symbol" class="text-caption text-medium-emphasis">
                              {{ currency.symbol }}
                            </div>
                          </div>
                        </div>
                        <v-chip
                          v-if="currency.autoUpdate"
                          color="success"
                          size="x-small"
                          variant="tonal"
                        >
                          <v-icon start icon="mdi-sync" size="12" />
                          Otomatik
                        </v-chip>
                      </div>
                      
                      <div class="currency-rate-display mb-3">
                        <div class="text-h5 font-weight-bold text-primary mb-1">
                          {{ formatCurrencyRate(currency.rateToTry) }}
                        </div>
                        <div class="text-caption text-medium-emphasis">₺ Türk Lirası</div>
                      </div>
                      
                      <v-divider class="my-3" />
                      
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                          <v-icon icon="mdi-clock-outline" size="14" class="mr-1 text-medium-emphasis" />
                          <span class="text-caption text-medium-emphasis">
                            {{ formatDateTime(currency.lastUpdatedAt) }}
                          </span>
                        </div>
                        <v-chip
                          v-if="currency.isBaseCurrency"
                          color="primary"
                          size="x-small"
                          variant="flat"
                        >
                          Varsayılan
                        </v-chip>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
            <div v-else class="text-center py-8">
              <v-icon icon="mdi-currency-usd" size="48" color="grey-lighten-1" class="mb-3" />
              <p class="text-body-1 text-medium-emphasis mb-1">Kur Bilgisi Bulunamadı</p>
              <p class="text-caption text-medium-emphasis">Henüz döviz kuru eklenmemiş</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dashboard Metrics Cards -->
    <v-row class="mb-6">
      <!-- Row 1 -->
      <v-col cols="12" sm="6" md="3" v-for="metric in metrics" :key="metric.key">
        <v-card
          class="metric-card"
          :class="metric.colorClass"
          elevation="0"
          rounded="lg"
        >
          <div class="metric-content">
            <div class="metric-info">
              <div class="metric-label">{{ metric.label }}</div>
              <div class="metric-value">
                {{ formatNumber(stats[metric.key as keyof typeof stats]) }}
                <span v-if="metric.unit" class="metric-unit">{{ metric.unit }}</span>
              </div>
            </div>
            <div class="metric-icon" :style="{ background: metric.iconBg }">
              <v-icon :icon="metric.icon" :color="metric.iconColor" size="32" />
            </div>
          </div>
          <div class="metric-footer" v-if="metric.trend">
            <v-icon
              :icon="metric.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
              size="16"
              :color="metric.trend > 0 ? 'success' : 'error'"
            />
            <span class="metric-trend" :class="metric.trend > 0 ? 'text-success' : 'text-error'">
              {{ Math.abs(metric.trend) }}%
            </span>
            <span class="metric-period">vs last month</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reservation Chart -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="0" rounded="lg" class="section-card">
          <v-card-title class="section-title">
            <v-icon icon="mdi-chart-line" class="mr-2" color="primary" />
            Aylık Rezervasyon İstatistikleri
          </v-card-title>
          <v-divider class="mb-4" />
          <v-card-text>
            <div v-if="loadingChart" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-4 text-medium-emphasis">Grafik yükleniyor...</p>
            </div>
            <div v-else style="position: relative; height: 300px;">
              <Line :data="chartData" :options="chartOptions" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reminders and Messages -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card elevation="0" rounded="lg" class="section-card">
          <v-card-title class="section-title">
            <v-icon icon="mdi-message-text-outline" class="mr-2" color="primary" />
            Hatırlatma ve Mesajlar
          </v-card-title>
          <v-divider class="mb-4" />
          
          <!-- Message Form -->
          <v-form @submit.prevent="addMessage" class="mb-4">
            <v-row dense>
              <v-col cols="12" md="5">
                <v-text-field
                  v-model="messageForm.date"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  label="Tarih"
                  hide-details
                  prepend-inner-icon="mdi-calendar"
                  bg-color="grey-lighten-5"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="messageForm.time"
                  type="time"
                  density="comfortable"
                  variant="outlined"
                  label="Saat"
                  hide-details
                  prepend-inner-icon="mdi-clock-outline"
                  bg-color="grey-lighten-5"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-btn color="primary" block height="40" @click="addMessage">
                  <v-icon icon="mdi-plus" class="mr-1" />
                  Ekle
                </v-btn>
              </v-col>
            </v-row>
            <v-row dense class="mt-2">
              <v-col cols="12">
                <v-text-field
                  v-model="messageForm.subject"
                  density="comfortable"
                  variant="outlined"
                  label="Konu"
                  hide-details
                  prepend-inner-icon="mdi-format-title"
                  bg-color="grey-lighten-5"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="messageForm.detail"
                  density="comfortable"
                  variant="outlined"
                  label="Detay"
                  rows="2"
                  hide-details
                  prepend-inner-icon="mdi-text"
                  bg-color="grey-lighten-5"
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
              density="comfortable"
              class="modern-table"
              hide-default-footer
            >
              <template #item.date="{ item }">
                <span class="text-caption font-weight-medium">{{ item.date }}</span>
              </template>
              <template #item.time="{ item }">
                <v-chip size="small" variant="tonal" color="primary">{{ item.time }}</v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteMessage(item.id)"
                />
              </template>
            </v-data-table>
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-message-outline" size="48" color="grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis mt-2">Henüz mesaj eklenmemiş</p>
          </div>
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-arrow-right"
            class="mt-4"
            @click="viewAllMessages"
          >
            Tüm Mesajları Görüntüle
          </v-btn>
        </v-card>
      </v-col>
      
      <!-- Payment Reminders -->
      <v-col cols="12" md="6">
        <v-card elevation="0" rounded="lg" class="section-card">
          <v-card-title class="section-title">
            <v-icon icon="mdi-credit-card-outline" class="mr-2" color="success" />
            Günlük Ödeme Hatırlatmaları
          </v-card-title>
          <v-divider class="mb-4" />
          <div v-if="paymentReminders.length > 0">
            <v-data-table
              :headers="paymentHeaders"
              :items="paymentReminders"
              :items-per-page="5"
              density="comfortable"
              class="modern-table"
              hide-default-footer
            >
              <template #item.amount="{ item }">
                <span class="font-weight-bold text-primary">{{ formatCurrency(item.amount) }}</span>
              </template>
              <template #item.status="{ item }">
                <div class="d-flex align-center gap-2">
                  <v-chip
                    :color="item.paid ? 'success' : 'error'"
                    size="small"
                    variant="flat"
                  >
                    {{ item.paid ? 'Ödendi' : 'Ödenmedi' }}
                  </v-chip>
                  <v-btn
                    v-if="!item.paid"
                    size="small"
                    color="success"
                    variant="flat"
                    prepend-icon="mdi-check"
                    @click="markPaymentPaid(item.id)"
                  >
                    Öde
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-credit-card-off-outline" size="48" color="grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis mt-2">Ödeme hatırlatması yok</p>
          </div>
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-arrow-right"
            class="mt-4"
            @click="viewPaymentSchedule"
          >
            Ödeme Çizelgesini Görüntüle
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Warnings Section -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card elevation="0" rounded="lg" class="section-card warning-card">
          <v-card-title class="section-title">
            <v-icon icon="mdi-shield-check-outline" class="mr-2" color="warning" />
            Sigorta Muayene Uyarıları
          </v-card-title>
          <v-divider class="mb-4" />
          <div v-if="insuranceWarnings.length > 0">
            <v-data-table
              :headers="insuranceHeaders"
              :items="insuranceWarnings"
              :items-per-page="5"
              density="comfortable"
              class="modern-table"
              hide-default-footer
            />
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-shield-off-outline" size="48" color="grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis mt-2">Uyarı yok</p>
          </div>
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-arrow-right"
            class="mt-4"
            @click="viewAllInsurance"
          >
            Tüm Sigorta/Muayeneleri Görüntüle
          </v-btn>
        </v-card>
      </v-col>
      
      <!-- Maintenance Warnings -->
      <v-col cols="12" md="4">
        <v-card elevation="0" rounded="lg" class="section-card warning-card">
          <v-card-title class="section-title">
            <v-icon icon="mdi-wrench-outline" class="mr-2" color="info" />
            Araç Bakım Uyarıları
          </v-card-title>
          <v-divider class="mb-4" />
          <div v-if="maintenanceWarnings.length > 0">
            <v-data-table
              :headers="maintenanceHeaders"
              :items="maintenanceWarnings"
              :items-per-page="5"
              density="comfortable"
              class="modern-table"
              hide-default-footer
            />
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-wrench-clock-outline" size="48" color="grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis mt-2">Bakım uyarısı yok</p>
          </div>
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-arrow-right"
            class="mt-4"
            @click="viewAllMaintenance"
          >
            Tüm Bakımları Görüntüle
          </v-btn>
        </v-card>
      </v-col>
      
      <!-- Penalty Warnings -->
      <v-col cols="12" md="4">
        <v-card elevation="0" rounded="lg" class="section-card warning-card">
          <v-card-title class="section-title">
            <v-icon icon="mdi-alert-circle-outline" class="mr-2" color="error" />
            Ceza Uyarıları
          </v-card-title>
          <v-divider class="mb-4" />
          <div v-if="penaltyWarnings.length > 0">
            <v-data-table
              :headers="penaltyHeaders"
              :items="penaltyWarnings"
              :items-per-page="5"
              density="comfortable"
              class="modern-table"
              hide-default-footer
            >
              <template #item.remaining="{ item }">
                <v-chip
                  :color="item.remaining < 0 ? 'error' : 'warning'"
                  size="small"
                  variant="flat"
                >
                  {{ item.remaining }} Gün
                </v-chip>
              </template>
            </v-data-table>
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-check-circle-outline" size="48" color="grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis mt-2">Ceza uyarısı yok</p>
          </div>
          <div class="d-flex gap-2 mt-4">
            <v-btn
              variant="outlined"
              color="primary"
              prepend-icon="mdi-file-upload-outline"
              @click="uploadPenaltyFile"
            >
              Dosya Yükle
            </v-btn>
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-arrow-right"
              @click="viewAllPenalties"
            >
              Tüm Cezalar
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
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
    label: '24 Saat içinde Çıkacak Araçlar',
    icon: 'mdi-timer-outline',
    iconColor: 'primary',
    iconBg: 'rgba(25, 118, 210, 0.1)',
    colorClass: 'metric-primary',
    trend: 5,
  },
  {
    key: 'notDeparted',
    label: 'Çıkışı Yapılmamışlar',
    icon: 'mdi-car-outline',
    iconColor: 'info',
    iconBg: 'rgba(33, 150, 243, 0.1)',
    colorClass: 'metric-info',
  },
  {
    key: 'totalBusinessDays',
    label: 'Toplam İş Günü',
    icon: 'mdi-calendar-month',
    iconColor: 'primary',
    iconBg: 'rgba(25, 118, 210, 0.1)',
    colorClass: 'metric-primary',
  },
  {
    key: 'deliveredVehicles',
    label: 'Teslim Edilen Araçlar',
    icon: 'mdi-car-check',
    iconColor: 'success',
    iconBg: 'rgba(46, 125, 50, 0.1)',
    colorClass: 'metric-success',
    trend: 12,
  },
  {
    key: 'vehiclesReturning24h',
    label: '24 Saat içinde Dönecek Araçlar',
    icon: 'mdi-timer-outline',
    iconColor: 'warning',
    iconBg: 'rgba(237, 108, 2, 0.1)',
    colorClass: 'metric-warning',
  },
  {
    key: 'notReturned',
    label: 'Dönüşü Yapılmamışlar',
    icon: 'mdi-car-off',
    iconColor: 'error',
    iconBg: 'rgba(211, 47, 47, 0.1)',
    colorClass: 'metric-error',
  },
  {
    key: 'monthlyReservations',
    label: 'Aylık Rezervasyon',
    icon: 'mdi-calendar-month-outline',
    iconColor: 'info',
    iconBg: 'rgba(33, 150, 243, 0.1)',
    colorClass: 'metric-info',
    trend: 8,
  },
  {
    key: 'toBeDelivered',
    label: 'Teslim Edilecek Araçlar',
    icon: 'mdi-car-clock',
    iconColor: 'success',
    iconBg: 'rgba(46, 125, 50, 0.1)',
    colorClass: 'metric-success',
  },
  {
    key: 'totalReservations',
    label: 'Toplam Rezervasyon',
    icon: 'mdi-currency-eur',
    iconColor: 'success',
    iconBg: 'rgba(46, 125, 50, 0.1)',
    colorClass: 'metric-success',
    trend: 15,
  },
  {
    key: 'dailyReservations',
    label: 'Günlük Rezervasyon',
    icon: 'mdi-calendar-today',
    iconColor: 'info',
    iconBg: 'rgba(33, 150, 243, 0.1)',
    colorClass: 'metric-info',
  },
  {
    key: 'canceledReservations',
    label: 'İptal Edilen Rezervasyon',
    icon: 'mdi-account-cancel',
    iconColor: 'error',
    iconBg: 'rgba(211, 47, 47, 0.1)',
    colorClass: 'metric-error',
    trend: -3,
  },
  {
    key: 'customerSatisfaction',
    label: 'Müşteri Memnuniyet Oranı',
    icon: 'mdi-chart-line',
    iconColor: 'primary',
    iconBg: 'rgba(25, 118, 210, 0.1)',
    colorClass: 'metric-primary',
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
  { title: '#', key: 'id', width: '60px' },
  { title: 'Tarih', key: 'date', width: '120px' },
  { title: 'Saat', key: 'time', width: '100px' },
  { title: 'Konu', key: 'subject' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '80px', align: 'center' as const },
];

// Payment Reminders
const paymentReminders = ref<any[]>([]);
const paymentHeaders = [
  { title: '#', key: 'id', width: '60px' },
  { title: 'Banka', key: 'bank', width: '140px' },
  { title: 'Tip', key: 'type', width: '100px' },
  { title: 'Tutar', key: 'amount', width: '130px' },
  { title: 'Durum', key: 'status', sortable: false, width: '180px' },
  { title: 'Tarih', key: 'date', width: '150px' },
  { title: 'Açıklama', key: 'description' },
];

// Insurance Warnings
const insuranceWarnings = ref<any[]>([]);
const insuranceHeaders = [
  { title: '#', key: 'id', width: '60px' },
  { title: 'Plaka', key: 'plate', width: '110px' },
  { title: 'İşlem', key: 'action', width: '130px' },
  { title: 'Başlangıç', key: 'startDate', width: '110px' },
  { title: 'Bitiş', key: 'endDate', width: '110px' },
  { title: 'Kalan', key: 'remaining', width: '90px' },
];

// Maintenance Warnings
const maintenanceWarnings = ref<any[]>([]);
const maintenanceHeaders = [
  { title: '#', key: 'id', width: '60px' },
  { title: 'Plaka', key: 'plate', width: '110px' },
  { title: 'İşlem', key: 'action', width: '130px' },
  { title: 'Bakım Tarihi', key: 'maintenanceDate', width: '130px' },
  { title: 'Bakım Km', key: 'maintenanceKm', width: '110px' },
  { title: 'Aracın Km', key: 'vehicleKm', width: '110px' },
  { title: 'Kalan', key: 'remaining', width: '90px' },
];

// Penalty Warnings
const penaltyWarnings = ref<any[]>([]);
const penaltyHeaders = [
  { title: '#', key: 'id', width: '60px' },
  { title: 'Plaka', key: 'plate', width: '110px' },
  { title: 'Tip', key: 'type', width: '130px' },
  { title: 'Tarih', key: 'date', width: '110px' },
  { title: 'Tutar', key: 'amount', width: '110px' },
  { title: 'Kalan', key: 'remaining', width: '120px' },
  { title: 'Açıklama', key: 'description' },
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
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold' as const,
      },
      bodyFont: {
        size: 13,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        precision: 0,
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
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
  padding: 0;
  background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
}

/* Metric Cards */
.metric-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--metric-color) 0%, var(--metric-color-light) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.1);
}

.metric-card:hover::before {
  opacity: 1;
}

.metric-primary {
  --metric-color: #1976d2;
  --metric-color-light: #42a5f5;
}

.metric-info {
  --metric-color: #2196f3;
  --metric-color-light: #64b5f6;
}

.metric-success {
  --metric-color: #2e7d32;
  --metric-color-light: #66bb6a;
}

.metric-warning {
  --metric-color: #ed6c02;
  --metric-color-light: #ffa726;
}

.metric-error {
  --metric-color: #d32f2f;
  --metric-color-light: #ef5350;
}

.metric-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  min-height: 100px;
}

.metric-info {
  flex: 1;
}

.metric-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
  line-height: 1.4;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.metric-unit {
  font-size: 1.25rem;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.metric-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16px;
  transition: transform 0.3s;
}

.metric-card:hover .metric-icon {
  transform: scale(1.1) rotate(5deg);
}

.metric-footer {
  padding: 12px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.02);
}

.metric-trend {
  font-size: 0.875rem;
  font-weight: 600;
}

.metric-period {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: auto;
}

/* Section Cards */
.section-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  padding: 20px 24px;
  display: flex;
  align-items: center;
}

.warning-card {
  border-left: 4px solid transparent;
}

.warning-card:hover {
  border-left-color: currentColor;
}

/* Modern Table */
:deep(.modern-table) {
  background: transparent;
}

:deep(.modern-table .v-data-table__thead) {
  background: rgba(0, 0, 0, 0.02);
}

:deep(.modern-table .v-data-table__thead th) {
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.modern-table .v-data-table__tbody tr) {
  transition: background 0.2s;
}

:deep(.modern-table .v-data-table__tbody tr:hover) {
  background: rgba(25, 118, 210, 0.04);
}

:deep(.modern-table .v-data-table__tbody td) {
  padding: 16px;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #94a3b8;
}

/* Responsive */
@media (max-width: 960px) {
  .metric-value {
    font-size: 1.5rem;
  }
  
  .metric-icon {
    width: 48px;
    height: 48px;
  }
  
  .metric-content {
    padding: 20px;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.metric-card {
  animation: fadeIn 0.5s ease-out;
}

.metric-card:nth-child(1) { animation-delay: 0.05s; }
.metric-card:nth-child(2) { animation-delay: 0.1s; }
.metric-card:nth-child(3) { animation-delay: 0.15s; }
.metric-card:nth-child(4) { animation-delay: 0.2s; }
.metric-card:nth-child(5) { animation-delay: 0.25s; }
.metric-card:nth-child(6) { animation-delay: 0.3s; }
.metric-card:nth-child(7) { animation-delay: 0.35s; }
.metric-card:nth-child(8) { animation-delay: 0.4s; }
.metric-card:nth-child(9) { animation-delay: 0.45s; }
.metric-card:nth-child(10) { animation-delay: 0.5s; }
.metric-card:nth-child(11) { animation-delay: 0.55s; }
.metric-card:nth-child(12) { animation-delay: 0.6s; }

/* Currency Card - Modern Design */
/* Currency Section - Kurumsal Tasarım */
.currency-section-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.currency-section-card .border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.currency-item-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  height: 100%;
}

.currency-item-card:hover {
  border-color: rgba(25, 118, 210, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.currency-base-item {
  border-color: rgba(25, 118, 210, 0.2);
  background: rgba(25, 118, 210, 0.02);
}

.currency-code-box {
  min-width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.5px;
}

.code-box-primary {
  background: #1976d2;
  color: #ffffff;
}

.code-box-default {
  background: #f5f5f5;
  color: #424242;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.currency-rate-display {
  padding: 12px 0;
}

.currency-rate-display .text-h5 {
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Responsive Design */
@media (max-width: 960px) {
  .currency-rate-display .text-h5 {
    font-size: 1.5rem;
  }
}
</style>
