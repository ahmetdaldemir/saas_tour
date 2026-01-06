<template>
  <div class="dashboard-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Yükleniyor...</p>
    </div>

    <!-- Main Dashboard -->
    <div v-else class="dashboard-content">
      <!-- A) KPI SUMMARY CARDS (Top Row) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats.totalReservations }}</div>
            <div class="kpi-label">Toplam Rezervasyon</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon pickup">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats.todayPickups }}</div>
            <div class="kpi-label">Bugün Teslim</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon return">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats.todayReturns }}</div>
            <div class="kpi-label">Bugün İade</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon vehicle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/>
              <polygon points="12 15 17 21 7 21 12 15"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats.activeVehicles }}</div>
            <div class="kpi-label">Aktif Araç</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon revenue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ formatPrice(stats.revenueToday) }}</div>
            <div class="kpi-label">Bugün Gelir</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon payment">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ formatPrice(stats.pendingPayments) }}</div>
            <div class="kpi-label">Bekleyen Ödeme</div>
          </div>
        </div>
      </div>

      <!-- CURRENCY RATES -->
      <div class="currency-card">
        <div class="currency-header">
          <h3 class="currency-title">Döviz Kurları</h3>
          <button class="currency-refresh" @click="loadCurrencies" title="Yenile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
        <div class="currency-list">
          <div 
            v-for="currency in currencies" 
            :key="currency.id"
            class="currency-item"
            :class="{ 'base-currency': currency.isBaseCurrency }"
          >
            <div class="currency-info">
              <span class="currency-code">{{ currency.code }}</span>
              <span class="currency-name">{{ currency.name }}</span>
            </div>
            <div class="currency-rate">
              <span v-if="currency.isBaseCurrency" class="rate-value">1.00</span>
              <span v-else class="rate-value">{{ formatCurrencyRate(currency.rateToTry) }}</span>
              <span class="rate-label">₺</span>
            </div>
          </div>
          <div v-if="currencies.length === 0" class="currency-empty">
            Kur bilgisi yükleniyor...
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- B) OPERATIONS OVERVIEW -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Operasyon Özeti</h3>
            <button class="card-action" @click="refreshOperations">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>
          <div class="card-body">
            <div class="operations-section">
              <div class="operations-group">
                <div class="section-header">
                  <span class="section-title">Bugün Teslimler</span>
                  <span class="section-count">{{ todayPickups.length }}</span>
                </div>
                <div class="operations-list">
                  <div 
                    v-for="pickup in todayPickups.slice(0, 5)" 
                    :key="pickup.id"
                    class="operation-item"
                  >
                    <div class="operation-info">
                      <div class="operation-code">{{ pickup.reservationCode }}</div>
                      <div class="operation-meta">{{ pickup.customerName }} • {{ pickup.vehicle }}</div>
                    </div>
                    <span :class="['status-badge', `status-${pickup.status.toLowerCase()}`]">
                      {{ pickup.status }}
                    </span>
                  </div>
                  <div v-if="todayPickups.length === 0" class="empty-state">
                    Bugün için teslim planlanmamış
                  </div>
                </div>
              </div>

              <div class="operations-divider"></div>

              <div class="operations-group">
                <div class="section-header">
                  <span class="section-title">Bugün İadeler</span>
                  <span class="section-count">{{ todayReturns.length }}</span>
                </div>
                <div class="operations-list">
                  <div 
                    v-for="returnItem in todayReturns.slice(0, 5)" 
                    :key="returnItem.id"
                    class="operation-item"
                  >
                    <div class="operation-info">
                      <div class="operation-code">{{ returnItem.reservationCode }}</div>
                      <div class="operation-meta">{{ returnItem.customerName }} • {{ returnItem.vehicle }}</div>
                    </div>
                    <span :class="['status-badge', `status-${returnItem.status.toLowerCase()}`]">
                      {{ returnItem.status }}
                    </span>
                  </div>
                  <div v-if="todayReturns.length === 0" class="empty-state">
                    Bugün için iade planlanmamış
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- C) RESERVATION FLOW -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Son Rezervasyonlar</h3>
            <router-link to="/app/reservations" class="card-link">Tümünü Gör</router-link>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Müşteri</th>
                    <th>Tarihler</th>
                    <th>Araç</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reservation in recentReservations" :key="reservation.id">
                    <td>
                      <span class="table-code">{{ reservation.reference }}</span>
                    </td>
                    <td>{{ reservation.customerName }}</td>
                    <td>
                      <div class="table-dates">
                        <span>{{ formatDate(reservation.checkIn) }}</span>
                        <span class="date-separator">→</span>
                        <span>{{ formatDate(reservation.checkOut) }}</span>
                      </div>
                    </td>
                    <td>{{ getVehicleName(reservation) }}</td>
                    <td>
                      <span :class="['status-badge', `status-${reservation.status.toLowerCase()}`]">
                        {{ getStatusLabel(reservation.status) }}
                      </span>
                    </td>
                    <td>
                      <button 
                        class="table-action"
                        @click="viewReservation(reservation.id)"
                      >
                        Görüntüle
                      </button>
                    </td>
                  </tr>
                  <tr v-if="recentReservations.length === 0">
                    <td colspan="6" class="empty-state">Son rezervasyon bulunmuyor</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- D) VEHICLE STATUS OVERVIEW -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Araç Durumu</h3>
            <router-link to="/app/rentacar" class="card-link">Tümünü Gör</router-link>
          </div>
          <div class="card-body">
            <div class="vehicle-status-grid">
              <div class="status-item">
                <div class="status-indicator available"></div>
                <div class="status-content">
                  <div class="status-value">{{ vehicleStats.available }}</div>
                  <div class="status-label">Müsait</div>
                </div>
              </div>
              <div class="status-item">
                <div class="status-indicator rented"></div>
                <div class="status-content">
                  <div class="status-value">{{ vehicleStats.rented }}</div>
                  <div class="status-label">Kiralandı</div>
                </div>
              </div>
              <div class="status-item">
                <div class="status-indicator service"></div>
                <div class="status-content">
                  <div class="status-value">{{ vehicleStats.inService }}</div>
                  <div class="status-label">Serviste</div>
                </div>
              </div>
              <div class="status-item">
                <div class="status-indicator maintenance"></div>
                <div class="status-content">
                  <div class="status-value">{{ vehicleStats.maintenance }}</div>
                  <div class="status-label">Bakımda</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- E) FINANCIAL SNAPSHOT -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Finansal Özet</h3>
            <router-link to="/app/finance" class="card-link">Detayları Gör</router-link>
          </div>
          <div class="card-body">
            <div class="financial-list">
              <div class="financial-item">
                <span class="financial-label">Gelir (Bugün)</span>
                <span class="financial-value positive">{{ formatPrice(financial.revenueToday) }}</span>
              </div>
              <div class="financial-item">
                <span class="financial-label">Bekleyen Ödemeler</span>
                <span class="financial-value warning">{{ formatPrice(financial.outstanding) }}</span>
              </div>
              <div class="financial-item">
                <span class="financial-label">Tutulan Depozitolar</span>
                <span class="financial-value">{{ formatPrice(financial.deposits) }}</span>
              </div>
              <div class="financial-item">
                <span class="financial-label">İadeler</span>
                <span class="financial-value negative">{{ formatPrice(financial.refunds) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- F) ALERTS & WARNINGS -->
        <div v-if="alerts.length > 0" class="dashboard-card alerts-card">
          <div class="card-header">
            <h3 class="card-title">Uyarılar</h3>
          </div>
          <div class="card-body">
            <div class="alerts-list">
              <div 
                v-for="(alert, index) in alerts" 
                :key="index"
                :class="['alert-banner', `alert-${alert.type}`]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>{{ alert.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- G) REMINDERS & MESSAGES -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Hatırlatmalar ve Mesajlar</h3>
            <div class="card-actions">
              <button class="card-action" @click="showReminderModal = true" title="Yeni Ekle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button class="card-action" @click="refreshReminders" title="Yenile">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="reminders-list">
              <div 
                v-for="(reminder, index) in reminders" 
                :key="reminder.id || index"
                :class="['reminder-item', `reminder-${reminder.priority}`]"
              >
                <div class="reminder-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div class="reminder-content">
                  <div class="reminder-title">{{ reminder.title }}</div>
                  <div class="reminder-meta">{{ reminder.date }} • {{ reminder.time }}</div>
                </div>
                <button 
                  class="reminder-dismiss"
                  @click="deleteReminder(reminder.id || index)"
                  title="Sil"
                >
                  ×
                </button>
              </div>
              <div v-if="reminders.length === 0" class="empty-state">
                Hatırlatma bulunmuyor
              </div>
            </div>
          </div>
        </div>

        <!-- Reminder Modal -->
        <v-dialog v-model="showReminderModal" max-width="500">
          <v-card>
            <v-card-title>
              <span>Yeni Hatırlatma Ekle</span>
              <v-spacer></v-spacer>
              <v-btn icon="mdi-close" variant="text" size="small" @click="showReminderModal = false"></v-btn>
            </v-card-title>
            <v-card-text>
              <div class="reminder-form">
                <v-text-field
                  v-model="reminderForm.title"
                  label="Başlık"
                  placeholder="Hatırlatma başlığı"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="mb-3"
                />
                <v-textarea
                  v-model="reminderForm.description"
                  label="Açıklama (Opsiyonel)"
                  placeholder="Detaylı açıklama..."
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  hide-details
                  class="mb-3"
                />
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="reminderForm.date"
                      label="Tarih"
                      type="date"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="reminderForm.time"
                      label="Saat"
                      type="time"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                    />
                  </v-col>
                </v-row>
                <v-select
                  v-model="reminderForm.priority"
                  :items="priorityOptions"
                  label="Öncelik"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="mt-3"
                />
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="showReminderModal = false">İptal</v-btn>
              <v-btn color="primary" variant="flat" @click="saveReminder">Kaydet</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- H) DAILY PAYMENT REMINDERS -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Günlük Ödeme Hatırlatıcı</h3>
            <router-link to="/app/finance" class="card-link">Tümünü Gör</router-link>
          </div>
          <div class="card-body">
            <div class="payment-reminders-list">
              <div 
                v-for="(payment, index) in paymentReminders" 
                :key="index"
                class="payment-reminder-item"
              >
                <div class="payment-info">
                  <div class="payment-customer">{{ payment.customerName }}</div>
                  <div class="payment-meta">{{ payment.reservationCode }} • {{ payment.dueDate }}</div>
                </div>
                <div class="payment-amount">{{ formatPrice(payment.amount) }}</div>
                <button 
                  class="payment-action"
                  @click="viewPayment(payment.reservationId)"
                  title="Detayları Gör"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div v-if="paymentReminders.length === 0" class="empty-state">
                Bugün ödeme bekleyen rezervasyon yok
              </div>
            </div>
          </div>
        </div>

        <!-- I) VEHICLE MAINTENANCE & INSPECTION -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3 class="card-title">Araç Bakım ve Muayene</h3>
            <router-link to="/app/rentacar" class="card-link">Tümünü Gör</router-link>
          </div>
          <div class="card-body">
            <div class="maintenance-section">
              <!-- Bakım Box -->
              <div class="maintenance-box">
                <div class="maintenance-header">
                  <div class="maintenance-icon maintenance">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </div>
                  <div class="maintenance-title">Bakım Gereken Araçlar</div>
                  <span class="maintenance-count">{{ maintenanceVehicles.length }}</span>
                </div>
                <div class="maintenance-list">
                  <div 
                    v-for="(vehicle, index) in maintenanceVehicles.slice(0, 5)" 
                    :key="index"
                    class="maintenance-item"
                  >
                    <div class="maintenance-vehicle-info">
                      <div class="maintenance-vehicle-name">{{ vehicle.name }}</div>
                      <div class="maintenance-vehicle-meta">{{ vehicle.plate }} • {{ vehicle.reason }}</div>
                    </div>
                    <span class="maintenance-badge">{{ vehicle.dueDate }}</span>
                  </div>
                  <div v-if="maintenanceVehicles.length === 0" class="empty-state-small">
                    Bakım gereken araç yok
                  </div>
                </div>
              </div>

              <!-- Muayene Box -->
              <div class="maintenance-box">
                <div class="maintenance-header">
                  <div class="maintenance-icon inspection">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div class="maintenance-title">Muayene Gereken Araçlar</div>
                  <span class="maintenance-count">{{ inspectionVehicles.length }}</span>
                </div>
                <div class="maintenance-list">
                  <div 
                    v-for="(vehicle, index) in inspectionVehicles.slice(0, 5)" 
                    :key="index"
                    class="maintenance-item"
                  >
                    <div class="maintenance-vehicle-info">
                      <div class="maintenance-vehicle-name">{{ vehicle.name }}</div>
                      <div class="maintenance-vehicle-meta">{{ vehicle.plate }} • Muayene süresi doluyor</div>
                    </div>
                    <span class="maintenance-badge">{{ vehicle.expiryDate }}</span>
                  </div>
                  <div v-if="inspectionVehicles.length === 0" class="empty-state-small">
                    Muayene gereken araç yok
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const stats = ref({
  totalReservations: 0,
  todayPickups: 0,
  todayReturns: 0,
  activeVehicles: 0,
  revenueToday: 0,
  pendingPayments: 0,
});

const todayPickups = ref<Array<{
  id: string;
  reservationCode: string;
  customerName: string;
  vehicle: string;
  status: string;
}>>([]);

const todayReturns = ref<Array<{
  id: string;
  reservationCode: string;
  customerName: string;
  vehicle: string;
  status: string;
}>>([]);

const upcomingReturns = ref<Array<{
  id: string;
  reservationCode: string;
  customerName: string;
  vehicle: string;
  status: string;
  checkOut: string;
}>>([]);

const recentReservations = ref<Array<{
  id: string;
  reference: string;
  customerName: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  metadata?: Record<string, unknown>;
}>>([]);

const vehicleStats = ref({
  available: 0,
  rented: 0,
  inService: 0,
  maintenance: 0,
});

const financial = ref({
  revenueToday: 0,
  outstanding: 0,
  deposits: 0,
  refunds: 0,
});

const alerts = ref<Array<{
  type: 'warning' | 'error' | 'info';
  message: string;
}>>([]);

const currencies = ref<Array<{
  id: string;
  code: string;
  name: string;
  symbol?: string;
  rateToTry: number;
  isBaseCurrency: boolean;
}>>([]);

const reminders = ref<Array<{
  id?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}>>([]);

const showReminderModal = ref(false);
const reminderForm = ref({
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  priority: 'medium' as 'high' | 'medium' | 'low',
});

const priorityOptions = [
  { title: 'Yüksek', value: 'high' },
  { title: 'Orta', value: 'medium' },
  { title: 'Düşük', value: 'low' },
];

const paymentReminders = ref<Array<{
  reservationId: string;
  reservationCode: string;
  customerName: string;
  amount: number;
  dueDate: string;
}>>([]);

const maintenanceVehicles = ref<Array<{
  id: string;
  name: string;
  plate: string;
  reason: string;
  dueDate: string;
}>>([]);

const inspectionVehicles = ref<Array<{
  id: string;
  name: string;
  plate: string;
  expiryDate: string;
}>>([]);

onMounted(() => {
  loadDashboardData();
});

const loadDashboardData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadStats(),
      loadOperations(),
      loadReservations(),
      loadVehicleStats(),
      loadFinancial(),
      loadAlerts(),
      loadReminders(),
      loadPaymentReminders(),
      loadMaintenanceVehicles(),
      loadInspectionVehicles(),
      loadCurrencies(),
    ]);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    // Load reservations count
    const reservationsRes = await http.get('/reservations', {
      params: { limit: 1 },
    });
    stats.value.totalReservations = reservationsRes.data?.total || 0;

    // Load today's operations
    const today = new Date().toISOString().split('T')[0];
    const operationsRes = await http.get(`/api/rentacar/operations/list`, {
      params: { date: today },
    });
    
    if (operationsRes.data) {
      stats.value.todayPickups = operationsRes.data.pickups?.length || 0;
      stats.value.todayReturns = operationsRes.data.returns?.length || 0;
    }

    // Load vehicle count
    const vehiclesRes = await http.get('/api/rentacar/vehicles', {
      params: { limit: 1 },
    });
    stats.value.activeVehicles = vehiclesRes.data?.total || 0;

    // Mock financial data (replace with actual API)
    stats.value.revenueToday = 12500;
    stats.value.pendingPayments = 3500;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadOperations = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await http.get(`/api/rentacar/operations/list`, {
      params: { date: today },
    });
    
    if (res.data) {
      todayPickups.value = (res.data.pickups || []).map((p: any) => ({
        id: p.id,
        reservationCode: p.reservationCode || p.reference || '-',
        customerName: p.customerName || '-',
        vehicle: p.vehicle || '-',
        status: p.status || 'Beklemede',
      }));
      
      todayReturns.value = (res.data.returns || []).map((r: any) => ({
        id: r.id,
        reservationCode: r.reservationCode || r.reference || '-',
        customerName: r.customerName || '-',
        vehicle: r.vehicle || '-',
        status: r.status || 'Beklemede',
      }));
    }
  } catch (error) {
    console.error('Failed to load operations:', error);
  }
};

const loadReservations = async () => {
  try {
    const res = await http.get('/reservations', {
      params: { limit: 10, sortBy: 'createdAt', sortOrder: 'DESC' },
    });
    recentReservations.value = (res.data?.data || res.data || []).slice(0, 10);
    
    // Yaklaşan dönüşleri kontrol et ve ikaz ekle
    checkUpcomingReturns(recentReservations.value);
  } catch (error) {
    console.error('Failed to load reservations:', error);
  }
};

// Yaklaşan dönüşleri kontrol et ve ikaz ekle
const checkUpcomingReturns = (reservations: any[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  
  upcomingReturns.value = reservations.filter((r: any) => {
    if (!r.checkOut || r.status === 'cancelled' || r.status === 'completed') return false;
    const returnDate = new Date(r.checkOut);
    returnDate.setHours(0, 0, 0, 0);
    // Bugün veya yarın dönüş yapacak rezervasyonlar
    return returnDate >= today && returnDate <= tomorrow && r.status === 'confirmed';
  }).map((r: any) => ({
    id: r.id,
    reservationCode: r.reference || r.id.substring(0, 8).toUpperCase(),
    customerName: r.customerName || '-',
    vehicle: getVehicleName(r) || '-',
    status: r.status,
    checkOut: r.checkOut,
  }));
  
  if (upcomingReturns.value.length > 0) {
    const alertMessage = `${upcomingReturns.value.length} rezervasyonun dönüş tarihi yaklaşıyor (bugün veya yarın)`;
    // Eğer aynı ikaz yoksa ekle
    if (!alerts.value.some(a => a.message === alertMessage)) {
      alerts.value.unshift({
        type: 'warning',
        message: alertMessage,
      });
    }
  }
};

const loadVehicleStats = async () => {
  try {
    const res = await http.get('/api/rentacar/vehicles', {
      params: { limit: 1000 },
    });
    const vehicles = res.data?.data || res.data || [];
    
    vehicleStats.value = {
      available: vehicles.filter((v: any) => !v.isRented && !v.inService && !v.inMaintenance).length,
      rented: vehicles.filter((v: any) => v.isRented).length,
      inService: vehicles.filter((v: any) => v.inService).length,
      maintenance: vehicles.filter((v: any) => v.inMaintenance).length,
    };
  } catch (error) {
    console.error('Failed to load vehicle stats:', error);
  }
};

const loadFinancial = async () => {
  try {
    // Mock data - replace with actual API
    financial.value = {
      revenueToday: 12500,
      outstanding: 3500,
      deposits: 8500,
      refunds: 200,
    };
  } catch (error) {
    console.error('Failed to load financial data:', error);
  }
};

const loadAlerts = async () => {
  try {
    // Mock alerts - replace with actual API
    alerts.value = [
      { type: 'warning', message: '2 iadede 300 km\'den fazla KM farkı tespit edildi' },
      { type: 'info', message: 'Bu hafta 3 araç bakım gerektiriyor' },
    ];
  } catch (error) {
    console.error('Failed to load alerts:', error);
  }
};

const refreshOperations = () => {
  loadOperations();
};

const refreshReminders = () => {
  loadReminders();
};


const viewPayment = (reservationId: string) => {
  router.push(`/app/reservations/${reservationId}`);
};

const loadCurrencies = async () => {
  try {
    const res = await http.get('/api/currency');
    currencies.value = (res.data?.data || res.data || []).filter((c: any) => c.isActive);
  } catch (error) {
    console.error('Failed to load currencies:', error);
  }
};

const formatCurrencyRate = (rate: number): string => {
  return rate.toFixed(4);
};

const loadReminders = async () => {
  try {
    // Load from localStorage (or API if available)
    const stored = localStorage.getItem('dashboard_reminders');
    if (stored) {
      reminders.value = JSON.parse(stored);
    } else {
      // Default reminders
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      reminders.value = [
        {
          id: '1',
          title: 'Yarın 3 araç muayene tarihi doluyor',
          date: tomorrow.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' }),
          time: '09:00',
          priority: 'high',
        },
        {
          id: '2',
          title: 'Haftalık bakım raporu hazırlanacak',
          date: today.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' }),
          time: '14:00',
          priority: 'medium',
        },
      ];
      localStorage.setItem('dashboard_reminders', JSON.stringify(reminders.value));
    }
  } catch (error) {
    console.error('Failed to load reminders:', error);
  }
};

const saveReminder = () => {
  if (!reminderForm.value.title.trim()) {
    return;
  }
  
  const newReminder = {
    id: Date.now().toString(),
    title: reminderForm.value.title,
    description: reminderForm.value.description,
    date: new Date(reminderForm.value.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' }),
    time: reminderForm.value.time,
    priority: reminderForm.value.priority,
  };
  
  reminders.value.push(newReminder);
  localStorage.setItem('dashboard_reminders', JSON.stringify(reminders.value));
  
  // Reset form
  reminderForm.value = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    priority: 'medium',
  };
  
  showReminderModal.value = false;
};

const deleteReminder = (id: string | number) => {
  if (typeof id === 'string') {
    reminders.value = reminders.value.filter(r => r.id !== id);
  } else {
    reminders.value.splice(id, 1);
  }
  localStorage.setItem('dashboard_reminders', JSON.stringify(reminders.value));
};

const loadPaymentReminders = async () => {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Load pending reservations with payment due today
    const res = await http.get('/reservations', {
      params: { 
        limit: 100,
        status: 'confirmed',
      },
    });
    
    const reservations = res.data?.data || res.data || [];
    
    // Filter reservations with payment due today or overdue
    paymentReminders.value = reservations
      .filter((r: any) => {
        const metadata = r.metadata as any;
        const dueDate = metadata?.paymentDueDate;
        if (!dueDate) return false;
        
        const due = new Date(dueDate);
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        
        // Due today or overdue
        return due <= todayDate && r.status === 'confirmed';
      })
      .slice(0, 10)
      .map((r: any) => {
        const metadata = r.metadata as any;
        const totalPrice = metadata?.totalPrice || metadata?.price || 0;
        const paidAmount = metadata?.paidAmount || 0;
        const remaining = totalPrice - paidAmount;
        
        return {
          reservationId: r.id,
          reservationCode: r.reference,
          customerName: r.customerName,
          amount: remaining,
          dueDate: new Date(metadata?.paymentDueDate || r.checkIn).toLocaleDateString('tr-TR', { 
            day: '2-digit', 
            month: 'short' 
          }),
        };
      });
  } catch (error) {
    console.error('Failed to load payment reminders:', error);
  }
};

const loadMaintenanceVehicles = async () => {
  try {
    // Load vehicles that need maintenance
    const res = await http.get('/api/rentacar/vehicles', {
      params: { limit: 1000 },
    });
    
    const vehicles = res.data?.data || res.data || [];
    const today = new Date();
    
    // Filter vehicles that need maintenance (mock logic - replace with actual maintenance data)
    maintenanceVehicles.value = vehicles
      .filter((v: any) => {
        // Check if vehicle has maintenance scheduled or overdue
        // This is mock logic - replace with actual maintenance check
        return v.inMaintenance || (v.lastMaintenanceDate && 
          new Date(v.lastMaintenanceDate) < new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000));
      })
      .slice(0, 10)
      .map((v: any) => {
        const plates = v.plates || [];
        const currentPlate = plates.find((p: any) => p.isActive) || plates[0];
        
        return {
          id: v.id,
          name: v.name || `${v.brand?.name || ''} ${v.model?.name || ''}`.trim(),
          plate: currentPlate?.plateNumber || '-',
          reason: v.inMaintenance ? 'Bakımda' : 'Bakım gerekli',
          dueDate: v.nextMaintenanceDate 
            ? new Date(v.nextMaintenanceDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
            : 'Acil',
        };
      });
  } catch (error) {
    console.error('Failed to load maintenance vehicles:', error);
  }
};

const loadInspectionVehicles = async () => {
  try {
    // Load vehicles that need inspection
    const res = await http.get('/api/rentacar/vehicles', {
      params: { limit: 1000 },
    });
    
    const vehicles = res.data?.data || res.data || [];
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Filter vehicles with inspection expiring soon (mock logic - replace with actual inspection data)
    inspectionVehicles.value = vehicles
      .filter((v: any) => {
        // Check if vehicle has inspection expiring soon
        // This is mock logic - replace with actual inspection check
        const plates = v.plates || [];
        const currentPlate = plates.find((p: any) => p.isActive) || plates[0];
        
        if (!currentPlate?.inspectionEnd) return false;
        
        const expiryDate = new Date(currentPlate.inspectionEnd);
        return expiryDate >= today && expiryDate <= nextWeek;
      })
      .slice(0, 10)
      .map((v: any) => {
        const plates = v.plates || [];
        const currentPlate = plates.find((p: any) => p.isActive) || plates[0];
        
        return {
          id: v.id,
          name: v.name || `${v.brand?.name || ''} ${v.model?.name || ''}`.trim(),
          plate: currentPlate?.plateNumber || '-',
          expiryDate: currentPlate?.inspectionEnd 
            ? new Date(currentPlate.inspectionEnd).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
            : '-',
        };
      });
  } catch (error) {
    console.error('Failed to load inspection vehicles:', error);
  }
};

const viewReservation = (id: string) => {
  router.push(`/app/reservations/${id}`);
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    rejected: 'Reddedildi',
    cancelled: 'İptal Edildi',
    completed: 'Tamamlandı',
  };
  return labels[status.toLowerCase()] || status;
};

const getVehicleName = (reservation: any) => {
  if (reservation.metadata?.vehicleName) {
    return reservation.metadata.vehicleName;
  }
  return '-';
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #111827;
  padding: 24px;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  color: #6b7280;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.kpi-card:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
}

.kpi-icon.pickup { background: #dbeafe; color: #1e40af; }
.kpi-icon.return { background: #d1fae5; color: #065f46; }
.kpi-icon.vehicle { background: #f3e8ff; color: #6b21a8; }
.kpi-icon.revenue { background: #fef3c7; color: #92400e; }
.kpi-icon.payment { background: #fee2e2; color: #991b1b; }

.kpi-content {
  flex: 1;
  min-width: 0;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 4px;
}

.kpi-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* Currency Card */
.currency-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.currency-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.currency-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.currency-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.currency-refresh:hover {
  background: #f3f4f6;
  color: #111827;
}

.currency-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.currency-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.currency-item:hover {
  background: #f3f4f6;
}

.currency-item.base-currency {
  background: #eff6ff;
  border-color: #3b82f6;
}

.currency-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.currency-code {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.currency-name {
  font-size: 11px;
  color: #6b7280;
}

.currency-rate {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.rate-value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.rate-label {
  font-size: 12px;
  color: #6b7280;
}

.currency-empty {
  grid-column: 1 / -1;
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.dashboard-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.card-action:hover {
  background: #f3f4f6;
  color: #111827;
}

.card-link {
  font-size: 14px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.card-link:hover {
  color: #1d4ed8;
}

.card-body {
  padding: 20px;
}

/* Operations */
.operations-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.operations-divider {
  height: 1px;
  background: #e5e7eb;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.section-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 12px;
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.operation-info {
  flex: 1;
  min-width: 0;
}

.operation-code {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.operation-meta {
  font-size: 12px;
  color: #6b7280;
}

/* Table */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f9fafb;
  position: sticky;
  top: 0;
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 12px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.table-code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
}

.table-dates {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.date-separator {
  color: #9ca3af;
}

.table-action {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.table-action:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

/* Vehicle Status */
.vehicle-status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.available { background: #10b981; }
.status-indicator.rented { background: #2563eb; }
.status-indicator.service { background: #f59e0b; }
.status-indicator.maintenance { background: #ef4444; }

.status-content {
  flex: 1;
}

.status-value {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 4px;
}

.status-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

/* Financial */
.financial-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.financial-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.financial-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.financial-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.financial-value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.financial-value.positive { color: #10b981; }
.financial-value.warning { color: #f59e0b; }
.financial-value.negative { color: #ef4444; }

/* Alerts */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.alert-warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #92400e;
}

.alert-error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-info {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

/* Status Badges */
.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-confirmed { background: #d1fae5; color: #065f46; }
.status-rejected { background: #fee2e2; color: #991b1b; }
.status-cancelled { background: #fee2e2; color: #991b1b; }
.status-completed { background: #dbeafe; color: #1e40af; }
.status-approved { background: #d1fae5; color: #065f46; }

/* Empty State */
.empty-state {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .vehicle-status-grid {
    grid-template-columns: 1fr;
  }
}

/* Reminders */
.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #e5e7eb;
  transition: all 0.2s;
}

.reminder-item:hover {
  background: #f3f4f6;
}

.reminder-item.reminder-high {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.reminder-item.reminder-medium {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.reminder-item.reminder-low {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.reminder-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
}

.reminder-content {
  flex: 1;
  min-width: 0;
}

.reminder-title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.reminder-meta {
  font-size: 12px;
  color: #6b7280;
}

.reminder-dismiss {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.reminder-dismiss:hover {
  background: #e5e7eb;
  color: #111827;
}

.reminder-form {
  padding: 8px 0;
}

/* Payment Reminders */
.payment-reminders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
  transition: all 0.2s;
}

.payment-reminder-item:hover {
  background: #f3f4f6;
}

.payment-info {
  flex: 1;
  min-width: 0;
}

.payment-customer {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.payment-meta {
  font-size: 12px;
  color: #6b7280;
}

.payment-amount {
  font-size: 16px;
  font-weight: 600;
  color: #f59e0b;
}

.payment-action {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.payment-action:hover {
  background: #e5e7eb;
  color: #111827;
}

/* Maintenance & Inspection */
.maintenance-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.maintenance-box {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.maintenance-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.maintenance-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.maintenance-icon.maintenance {
  background: #fee2e2;
  color: #dc2626;
}

.maintenance-icon.inspection {
  background: #dbeafe;
  color: #2563eb;
}

.maintenance-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.maintenance-count {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  background: #6b7280;
  padding: 2px 8px;
  border-radius: 12px;
}

.maintenance-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.maintenance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.maintenance-vehicle-info {
  flex: 1;
  min-width: 0;
}

.maintenance-vehicle-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.maintenance-vehicle-meta {
  font-size: 12px;
  color: #6b7280;
}

.maintenance-badge {
  font-size: 12px;
  font-weight: 500;
  color: #dc2626;
  background: #fee2e2;
  padding: 4px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.empty-state-small {
  padding: 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
</style>
