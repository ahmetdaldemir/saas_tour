<template>
  <v-container fluid class="pa-6">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-medium-emphasis mt-4">Yükleniyor...</p>
    </div>

    <!-- Main Dashboard -->
    <div v-else>
      <!-- A) KPI SUMMARY CARDS (Top Row) -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="h-100" variant="flat">
            <v-card-text class="d-flex align-center ga-4">
              <v-avatar color="grey-lighten-3" size="48" rounded="lg">
                <v-icon color="grey-darken-1">mdi-calendar-check</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">{{ stats.totalReservations }}</div>
                <div class="text-caption text-medium-emphasis">Toplam Rezervasyon</div>
          </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="h-100" variant="flat">
            <v-card-text class="d-flex align-center ga-4">
              <v-avatar color="blue-lighten-4" size="48" rounded="lg">
                <v-icon color="blue-darken-2">mdi-arrow-right-bold</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">{{ stats.todayPickups }}</div>
                <div class="text-caption text-medium-emphasis">Bugün Teslim</div>
          </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="h-100" variant="flat">
            <v-card-text class="d-flex align-center ga-4">
              <v-avatar color="green-lighten-4" size="48" rounded="lg">
                <v-icon color="green-darken-2">mdi-arrow-left-bold</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">{{ stats.todayReturns }}</div>
                <div class="text-caption text-medium-emphasis">Bugün İade</div>
          </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="h-100" variant="flat">
            <v-card-text class="d-flex align-center ga-4">
              <v-avatar color="purple-lighten-4" size="48" rounded="lg">
                <v-icon color="purple-darken-2">mdi-car</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">{{ stats.activeVehicles }}</div>
                <div class="text-caption text-medium-emphasis">Aktif Araç</div>
          </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="h-100" variant="flat">
            <v-card-text class="d-flex align-center ga-4">
              <v-avatar color="amber-lighten-4" size="48" rounded="lg">
                <v-icon color="amber-darken-3">mdi-currency-try</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">{{ formatPrice(stats.revenueToday) }}</div>
                <div class="text-caption text-medium-emphasis">Bugün Gelir</div>
          </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="h-100" variant="flat">
            <v-card-text class="d-flex align-center ga-4">
              <v-avatar color="red-lighten-4" size="48" rounded="lg">
                <v-icon color="red-darken-2">mdi-credit-card-clock</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">{{ formatPrice(stats.pendingPayments) }}</div>
                <div class="text-caption text-medium-emphasis">Bekleyen Ödeme</div>
          </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- CURRENCY RATES -->
      <v-card class="mb-6" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Döviz Kurları</span>
          <v-btn icon="mdi-refresh" variant="text" size="small" @click="loadCurrencies" />
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col 
            v-for="currency in currencies" 
            :key="currency.id"
              cols="6" sm="4" md="3" lg="2"
            >
              <v-card 
                :color="currency.isBaseCurrency ? 'primary' : 'grey-lighten-4'" 
                :variant="currency.isBaseCurrency ? 'tonal' : 'flat'"
                class="pa-3"
          >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="font-weight-bold">{{ currency.code }}</div>
                    <div class="text-caption text-medium-emphasis">{{ currency.name }}</div>
            </div>
                  <div class="text-right">
                    <span class="text-h6 font-weight-bold">
                      {{ currency.isBaseCurrency ? '1.00' : formatCurrencyRate(currency.rateToTry) }}
                    </span>
                    <span class="text-caption ml-1">₺</span>
            </div>
          </div>
              </v-card>
            </v-col>
            <v-col v-if="currencies.length === 0" cols="12">
              <div class="text-center text-medium-emphasis py-4">
            Kur bilgisi yükleniyor...
          </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Main Grid -->
      <v-row>
        <!-- B) OPERATIONS OVERVIEW -->
        <v-col cols="12" lg="6">
          <v-card variant="flat" class="h-100">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Operasyon Özeti</span>
              <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshOperations" />
            </v-card-title>
            <v-card-text>
              <!-- Today Pickups -->
              <div class="mb-4">
                <div class="d-flex justify-space-between align-center mb-3">
                  <span class="font-weight-medium">Bugün Teslimler</span>
                  <v-chip size="small" color="grey-lighten-3">{{ todayPickups.length }}</v-chip>
          </div>
                <v-list density="compact" class="bg-transparent pa-0">
                  <v-list-item
                    v-for="pickup in todayPickups.slice(0, 5)" 
                    :key="pickup.id"
                    class="px-0 rounded-lg mb-1"
                    style="background: var(--color-gray-50);"
                  >
                    <template #prepend>
                      <v-icon color="blue" size="small" class="mr-3">mdi-arrow-right-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2 font-weight-medium">
                      {{ pickup.reservationCode }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ pickup.customerName }} • {{ pickup.vehicle }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip 
                        size="x-small" 
                        :color="getStatusColor(pickup.status)"
                        variant="tonal"
                      >
                      {{ pickup.status }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <div v-if="todayPickups.length === 0" class="text-center text-medium-emphasis py-4">
                    Bugün için teslim planlanmamış
                  </div>
                </v-list>
              </div>

              <v-divider class="my-4" />

              <!-- Today Returns -->
              <div>
                <div class="d-flex justify-space-between align-center mb-3">
                  <span class="font-weight-medium">Bugün İadeler</span>
                  <v-chip size="small" color="grey-lighten-3">{{ todayReturns.length }}</v-chip>
                </div>
                <v-list density="compact" class="bg-transparent pa-0">
                  <v-list-item
                    v-for="returnItem in todayReturns.slice(0, 5)" 
                    :key="returnItem.id"
                    class="px-0 rounded-lg mb-1"
                    style="background: var(--color-gray-50);"
                  >
                    <template #prepend>
                      <v-icon color="green" size="small" class="mr-3">mdi-arrow-left-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2 font-weight-medium">
                      {{ returnItem.reservationCode }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ returnItem.customerName }} • {{ returnItem.vehicle }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip 
                        size="x-small" 
                        :color="getStatusColor(returnItem.status)"
                        variant="tonal"
                      >
                      {{ returnItem.status }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <div v-if="todayReturns.length === 0" class="text-center text-medium-emphasis py-4">
                    Bugün için iade planlanmamış
                  </div>
                </v-list>
                </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- C) RESERVATION FLOW -->
        <v-col cols="12" lg="6">
          <v-card variant="flat" class="h-100">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Son Rezervasyonlar</span>
              <router-link to="/app/reservations" class="text-primary text-decoration-none text-body-2">
                Tümünü Gör
              </router-link>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table density="comfortable" hover>
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Müşteri</th>
                    <th>Tarihler</th>
                    <th>Araç</th>
                    <th>Durum</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reservation in recentReservations" :key="reservation.id">
                    <td>
                      <span class="font-weight-medium text-primary">{{ reservation.reference }}</span>
                    </td>
                    <td>{{ reservation.customerName }}</td>
                    <td>
                      <span class="text-body-2">
                        {{ formatDate(reservation.checkIn) }}
                        <v-icon size="x-small" class="mx-1">mdi-arrow-right</v-icon>
                        {{ formatDate(reservation.checkOut) }}
                      </span>
                    </td>
                    <td>{{ getVehicleName(reservation) }}</td>
                    <td>
                      <v-chip 
                        size="small" 
                        :color="getStatusColor(reservation.status)"
                        variant="tonal"
                      >
                        {{ getStatusLabel(reservation.status) }}
                      </v-chip>
                    </td>
                    <td>
                      <v-btn 
                        size="small" 
                        variant="outlined"
                        @click="viewReservation(reservation.id)"
                      >
                        Görüntüle
                      </v-btn>
                    </td>
                  </tr>
                  <tr v-if="recentReservations.length === 0">
                    <td colspan="6" class="text-center text-medium-emphasis py-8">
                      Son rezervasyon bulunmuyor
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- D) VEHICLE STATUS OVERVIEW -->
        <v-col cols="12" md="6" lg="4">
          <v-card variant="flat" class="h-100">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Araç Durumu</span>
              <router-link to="/app/rentacar" class="text-primary text-decoration-none text-body-2">
                Tümünü Gör
              </router-link>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <v-card color="grey-lighten-4" variant="flat" class="pa-4 text-center">
                    <v-avatar color="success" size="12" class="mb-2" />
                    <div class="text-h5 font-weight-bold">{{ vehicleStats.available }}</div>
                    <div class="text-caption text-medium-emphasis">Müsait</div>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card color="grey-lighten-4" variant="flat" class="pa-4 text-center">
                    <v-avatar color="primary" size="12" class="mb-2" />
                    <div class="text-h5 font-weight-bold">{{ vehicleStats.rented }}</div>
                    <div class="text-caption text-medium-emphasis">Kiralandı</div>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card color="grey-lighten-4" variant="flat" class="pa-4 text-center">
                    <v-avatar color="warning" size="12" class="mb-2" />
                    <div class="text-h5 font-weight-bold">{{ vehicleStats.inService }}</div>
                    <div class="text-caption text-medium-emphasis">Serviste</div>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card color="grey-lighten-4" variant="flat" class="pa-4 text-center">
                    <v-avatar color="error" size="12" class="mb-2" />
                    <div class="text-h5 font-weight-bold">{{ vehicleStats.maintenance }}</div>
                    <div class="text-caption text-medium-emphasis">Bakımda</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- E) FINANCIAL SNAPSHOT -->
        <v-col cols="12" md="6" lg="4">
          <v-card variant="flat" class="h-100">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Finansal Özet</span>
              <router-link to="/app/finance" class="text-primary text-decoration-none text-body-2">
                Detayları Gör
              </router-link>
            </v-card-title>
            <v-card-text>
              <v-list density="comfortable" class="bg-transparent pa-0">
                <v-list-item class="px-0">
                  <v-list-item-title>Gelir (Bugün)</v-list-item-title>
                  <template #append>
                    <span class="text-success font-weight-bold">{{ formatPrice(financial.revenueToday) }}</span>
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item class="px-0">
                  <v-list-item-title>Bekleyen Ödemeler</v-list-item-title>
                  <template #append>
                    <span class="text-warning font-weight-bold">{{ formatPrice(financial.outstanding) }}</span>
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item class="px-0">
                  <v-list-item-title>Tutulan Depozitolar</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold">{{ formatPrice(financial.deposits) }}</span>
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item class="px-0">
                  <v-list-item-title>İadeler</v-list-item-title>
                  <template #append>
                    <span class="text-error font-weight-bold">{{ formatPrice(financial.refunds) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- F) ALERTS & WARNINGS -->
        <v-col v-if="alerts.length > 0" cols="12" lg="4">
          <v-card variant="flat" class="h-100">
            <v-card-title>Uyarılar</v-card-title>
            <v-card-text>
              <v-alert
                v-for="(alert, index) in alerts" 
                :key="index"
                :type="alert.type"
                variant="tonal"
                density="compact"
                class="mb-2"
              >
                {{ alert.message }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- G) REMINDERS & MESSAGES -->
        <v-col cols="12" md="6" lg="4">
          <v-card variant="flat" class="h-100">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Hatırlatmalar ve Mesajlar</span>
              <div>
                <v-btn icon="mdi-plus" variant="text" size="small" @click="showReminderModal = true" />
                <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshReminders" />
            </div>
            </v-card-title>
            <v-card-text>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item
                v-for="(reminder, index) in reminders" 
                :key="reminder.id || index"
                  class="px-3 rounded-lg mb-2"
                  :style="getReminderStyle(reminder.priority)"
              >
                  <template #prepend>
                    <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ reminder.title }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ reminder.date }} • {{ reminder.time }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-btn 
                      icon="mdi-close" 
                      variant="text" 
                      size="x-small"
                  @click="deleteReminder(reminder.id || index)"
                    />
                  </template>
                </v-list-item>
                <div v-if="reminders.length === 0" class="text-center text-medium-emphasis py-4">
                  Hatırlatma bulunmuyor
                </div>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- H) DAILY PAYMENT REMINDERS -->
        <v-col cols="12" md="6" lg="4">
          <v-card variant="flat" class="h-100">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Günlük Ödeme Hatırlatıcı</span>
              <router-link to="/app/finance" class="text-primary text-decoration-none text-body-2">
                Tümünü Gör
              </router-link>
            </v-card-title>
            <v-card-text>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item
                  v-for="(payment, index) in paymentReminders"
                  :key="index"
                  class="px-3 rounded-lg mb-2"
                  style="background: var(--color-warning-50); border-left: 3px solid var(--color-warning-500);"
                >
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ payment.customerName }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ payment.reservationCode }} • {{ payment.dueDate }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <span class="text-warning font-weight-bold">{{ formatPrice(payment.amount) }}</span>
                      <v-btn 
                        icon="mdi-eye" 
                        variant="text" 
                        size="x-small"
                        @click="viewPayment(payment.reservationId)"
                      />
              </div>
                  </template>
                </v-list-item>
                <div v-if="paymentReminders.length === 0" class="text-center text-medium-emphasis py-4">
                  Bugün ödeme bekleyen rezervasyon yok
              </div>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- I) VEHICLE MAINTENANCE & INSPECTION -->
        <v-col cols="12" lg="4">
          <v-card variant="flat" class="h-100">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Araç Bakım ve Muayene</span>
              <router-link to="/app/rentacar" class="text-primary text-decoration-none text-body-2">
                Tümünü Gör
              </router-link>
            </v-card-title>
            <v-card-text>
              <!-- Maintenance Box -->
              <v-card color="grey-lighten-4" variant="flat" class="mb-4 pa-3">
                <div class="d-flex align-center ga-3 mb-3">
                  <v-avatar color="error-lighten-4" size="36" rounded="lg">
                    <v-icon color="error" size="small">mdi-wrench</v-icon>
                  </v-avatar>
                  <span class="font-weight-medium flex-grow-1">Bakım Gereken Araçlar</span>
                  <v-chip size="small" color="grey">{{ maintenanceVehicles.length }}</v-chip>
            </div>
                <v-list density="compact" class="bg-transparent pa-0">
                  <v-list-item
                    v-for="(vehicle, index) in maintenanceVehicles.slice(0, 5)"
                    :key="index"
                    class="px-2 rounded mb-1 bg-white"
                  >
                    <v-list-item-title class="text-body-2">{{ vehicle.name }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ vehicle.plate }} • {{ vehicle.reason }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip size="x-small" color="error" variant="tonal">{{ vehicle.dueDate }}</v-chip>
                    </template>
                  </v-list-item>
                  <div v-if="maintenanceVehicles.length === 0" class="text-center text-medium-emphasis py-2 text-caption">
                    Bakım gereken araç yok
          </div>
                </v-list>
              </v-card>

              <!-- Inspection Box -->
              <v-card color="grey-lighten-4" variant="flat" class="pa-3">
                <div class="d-flex align-center ga-3 mb-3">
                  <v-avatar color="primary-lighten-4" size="36" rounded="lg">
                    <v-icon color="primary" size="small">mdi-check-decagram</v-icon>
                  </v-avatar>
                  <span class="font-weight-medium flex-grow-1">Muayene Gereken Araçlar</span>
                  <v-chip size="small" color="grey">{{ inspectionVehicles.length }}</v-chip>
                </div>
                <v-list density="compact" class="bg-transparent pa-0">
                  <v-list-item
                    v-for="(vehicle, index) in inspectionVehicles.slice(0, 5)"
                    :key="index"
                    class="px-2 rounded mb-1 bg-white"
                  >
                    <v-list-item-title class="text-body-2">{{ vehicle.name }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ vehicle.plate }} • Muayene süresi doluyor
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip size="x-small" color="primary" variant="tonal">{{ vehicle.expiryDate }}</v-chip>
                    </template>
                  </v-list-item>
                  <div v-if="inspectionVehicles.length === 0" class="text-center text-medium-emphasis py-2 text-caption">
                    Muayene gereken araç yok
                  </div>
                </v-list>
              </v-card>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
        </div>

        <!-- Reminder Modal -->
        <v-dialog v-model="showReminderModal" max-width="500">
          <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
              <span>Yeni Hatırlatma Ekle</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showReminderModal = false" />
            </v-card-title>
            <v-card-text>
                <v-text-field
                  v-model="reminderForm.title"
                  label="Başlık"
                  placeholder="Hatırlatma başlığı"
                  density="comfortable"
                  hide-details="auto"
            class="mb-4"
                />
                <v-textarea
                  v-model="reminderForm.description"
                  label="Açıklama (Opsiyonel)"
                  placeholder="Detaylı açıklama..."
                  density="comfortable"
                  rows="3"
                  hide-details
            class="mb-4"
                />
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="reminderForm.date"
                      label="Tarih"
                      type="date"
                      density="comfortable"
                      hide-details="auto"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="reminderForm.time"
                      label="Saat"
                      type="time"
                      density="comfortable"
                      hide-details="auto"
                    />
                  </v-col>
                </v-row>
                <v-select
                  v-model="reminderForm.priority"
                  :items="priorityOptions"
                  label="Öncelik"
                  density="comfortable"
                  hide-details="auto"
            class="mt-4"
                />
            </v-card-text>
            <v-card-actions>
          <v-spacer />
              <v-btn variant="text" @click="showReminderModal = false">İptal</v-btn>
              <v-btn color="primary" variant="flat" @click="saveReminder">Kaydet</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
    const reservationsRes = await http.get('/reservations', {
      params: { limit: 1 },
    });
    stats.value.totalReservations = reservationsRes.data?.total || 0;

    const today = new Date().toISOString().split('T')[0];
    const operationsRes = await http.get(`/rentacar/operations/list`, {
      params: { date: today },
    });
    
    if (operationsRes.data) {
      stats.value.todayPickups = operationsRes.data.pickups?.length || 0;
      stats.value.todayReturns = operationsRes.data.returns?.length || 0;
    }

    const vehiclesRes = await http.get('/rentacar/vehicles', {
      params: { limit: 1 },
    });
    stats.value.activeVehicles = vehiclesRes.data?.total || 0;

    stats.value.revenueToday = 12500;
    stats.value.pendingPayments = 3500;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadOperations = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await http.get(`/rentacar/operations/list`, {
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
    checkUpcomingReturns(recentReservations.value);
  } catch (error) {
    console.error('Failed to load reservations:', error);
  }
};

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
    const res = await http.get('/rentacar/vehicles', {
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
    const res = await http.get('/currency');
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
    const stored = localStorage.getItem('dashboard_reminders');
    if (stored) {
      reminders.value = JSON.parse(stored);
    } else {
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
    const today = new Date().toISOString().split('T')[0];
    
    const res = await http.get('/reservations', {
      params: { 
        limit: 100,
        status: 'confirmed',
      },
    });
    
    const reservations = res.data?.data || res.data || [];
    
    paymentReminders.value = reservations
      .filter((r: any) => {
        const metadata = r.metadata as any;
        const dueDate = metadata?.paymentDueDate;
        if (!dueDate) return false;
        
        const due = new Date(dueDate);
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        
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
    const res = await http.get('/rentacar/vehicles', {
      params: { limit: 1000 },
    });
    
    const vehicles = res.data?.data || res.data || [];
    const today = new Date();
    
    maintenanceVehicles.value = vehicles
      .filter((v: any) => {
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
    const res = await http.get('/rentacar/vehicles', {
      params: { limit: 1000 },
    });
    
    const vehicles = res.data?.data || res.data || [];
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    inspectionVehicles.value = vehicles
      .filter((v: any) => {
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

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    confirmed: 'success',
    rejected: 'error',
    cancelled: 'error',
    completed: 'primary',
    approved: 'success',
    beklemede: 'warning',
  };
  return colors[status.toLowerCase()] || 'grey';
};

const getReminderStyle = (priority: string) => {
  const styles: Record<string, string> = {
    high: 'background: var(--color-error-50); border-left: 3px solid var(--color-error-500);',
    medium: 'background: var(--color-warning-50); border-left: 3px solid var(--color-warning-500);',
    low: 'background: var(--color-info-50); border-left: 3px solid var(--color-info-500);',
  };
  return styles[priority] || styles.medium;
};

const getVehicleName = (reservation: any) => {
  if (reservation.metadata?.vehicleName) {
    return reservation.metadata.vehicleName;
  }
  return '-';
};
</script>

<style scoped>
.h-100 {
  height: 100%;
}

.ga-2 {
  gap: 8px;
}

.ga-3 {
  gap: 12px;
}

.ga-4 {
  gap: 16px;
}
</style>
