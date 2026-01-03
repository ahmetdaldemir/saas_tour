<template>
  <v-container fluid class="dashboard-container">
    <v-row>
      <!-- Sol: Rezervasyonlar Listesi (col-2) -->
      <v-col cols="12" md="2" class="pa-2">
        <v-card elevation="0" class="h-100 reservation-card" style="border: 1px solid #e5e7eb;">
          <v-card-title class="d-flex align-center justify-space-between pa-2" style="min-height: 40px;">
            <span class="text-body-2 font-weight-bold" style="font-size: 0.75rem;">Rezervasyonlar</span>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              size="x-small"
              @click="loadReservations"
              :loading="loadingReservations"
              style="min-width: 24px; width: 24px; height: 24px;"
            />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0 reservations-list" style="max-height: calc(100vh - 200px); overflow-y: auto;">
            <div v-if="reservations.length === 0" class="text-center py-8">
              <v-icon icon="mdi-information-outline" size="24" color="grey-lighten-1" />
              <p class="text-caption text-medium-emphasis mt-2" style="font-size: 0.7rem;">Rezervasyon bulunamadı</p>
            </div>
            <div
              v-for="(reservation, index) in reservations"
              :key="reservation.id"
              class="reservation-item-card"
              :class="{ 'selected': selectedReservation?.id === reservation.id }"
              @click="selectReservation(reservation)"
            >
              <div class="d-flex align-center justify-space-between pa-2">
                <span class="reservation-id" style="font-size: 0.7rem; font-weight: 600; color: #6b7280;">
                  #{{ reservation.reference }}
                </span>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="x-small"
                      v-bind="props"
                      @click.stop
                      style="min-width: 20px; width: 20px; height: 20px;"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="viewReservationDetails(reservation)">
                      <v-list-item-title style="font-size: 0.75rem;">Detayları Gör</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              <div class="d-flex align-center pa-2 pt-0">
                <v-avatar size="32" class="mr-2">
                  <span style="font-size: 0.75rem; font-weight: 600;">
                    {{ getInitials(reservation.customerName) }}
                  </span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="customer-name" style="font-size: 0.75rem; font-weight: 500; line-height: 1.2;">
                    {{ reservation.customerName }}
                  </div>
                  <div class="reservation-date" style="font-size: 0.65rem; color: #9ca3af; margin-top: 2px;">
                    {{ formatReservationDate(reservation.createdAt) }}
                  </div>
                  <v-chip
                    size="x-small"
                    :color="getStatusColor(reservation.status)"
                    variant="flat"
                    class="mt-1"
                    style="height: 18px; font-size: 0.65rem; font-weight: 500;"
                  >
                    {{ getStatusText(reservation.status) }}
                  </v-chip>
                </div>
              </div>
              <v-divider class="mx-2" />
              <div class="d-flex align-center justify-space-between pa-2">
                <span style="font-size: 0.65rem; color: #6b7280; font-weight: 500;">Kazanç</span>
                <span class="earned-amount" style="font-size: 0.875rem; font-weight: 600; color: #059669;">
                  {{ formatCurrency(reservation.earned || 0) }}
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Orta: Kurlar ve Araç Takip (col-8) -->
      <v-col cols="12" md="8" class="pa-2">
        <v-row>
          <!-- Üst: Kur Bilgisi (Küçük, İkon - Price) -->
          <v-col cols="12">
            <v-card elevation="2" rounded="lg">
              <v-card-text class="pa-3">
                <div v-if="loadingCurrencies" class="text-center py-2">
                  <v-progress-circular indeterminate color="primary" size="20" />
                </div>
                <div v-else class="d-flex flex-wrap gap-2">
                  <div
                    v-for="currency in currencies"
                    :key="currency.id"
                    class="d-flex align-center gap-1 currency-item"
                  >
                    <v-icon
                      :icon="currency.isBaseCurrency ? 'mdi-currency-try' : 'mdi-currency-usd'"
                      size="16"
                      :color="currency.isBaseCurrency ? 'primary' : 'default'"
                    />
                    <span class="text-caption font-weight-bold">{{ currency.code }}</span>
                    <span class="text-caption">{{ formatCurrencyRateCompact(currency.rateToTry) }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Alt: Araç Takip -->
          <v-col cols="12">
            <v-card elevation="2" rounded="lg">
              <v-card-title class="pa-3">
                <span class="text-subtitle-1 font-weight-bold">Araç Takip</span>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-3">
                <v-select
                  v-model="selectedPlate"
                  :items="plates"
                  item-title="plateNumber"
                  item-value="plateNumber"
                  label="Plaka Seçin"
                  variant="outlined"
                  density="compact"
                  :loading="loadingPlates"
                  @update:model-value="trackVehicle"
                  prepend-inner-icon="mdi-car"
                />
                
                <div v-if="trackingInfo && selectedPlate" class="mt-3">
                  <v-row dense>
                    <v-col cols="6" md="3">
                      <div class="text-caption text-medium-emphasis">Hız</div>
                      <div class="text-body-2 font-weight-bold">
                        {{ trackingInfo.lastLocation?.speed || 0 }} km/h
                      </div>
                    </v-col>
                    <v-col cols="6" md="3">
                      <div class="text-caption text-medium-emphasis">Yakıt</div>
                      <div class="text-body-2 font-weight-bold">
                        {{ trackingInfo.fuelLevel || 0 }}%
                      </div>
                    </v-col>
                    <v-col cols="6" md="3">
                      <div class="text-caption text-medium-emphasis">Kontak</div>
                      <div class="text-body-2 font-weight-bold">
                        {{ trackingInfo.ignitionStatus ? 'Açık' : 'Kapalı' }}
                      </div>
                    </v-col>
                    <v-col cols="6" md="3">
                      <div class="text-caption text-medium-emphasis">Kilometre</div>
                      <div class="text-body-2 font-weight-bold">
                        {{ trackingInfo.mileage || 0 }} km
                      </div>
                    </v-col>
                  </v-row>
                  
                  <div v-if="trackingInfo.lastLocation" class="mt-3">
                    <div id="map" style="height: 300px; width: 100%; border-radius: 8px;"></div>
                  </div>
                </div>
                <div v-else-if="selectedPlate && loadingTracking" class="text-center py-4">
                  <v-progress-circular indeterminate color="primary" />
                </div>
                <div v-else-if="selectedPlate && !trackingInfo" class="text-center py-4">
                  <v-icon icon="mdi-alert-circle-outline" size="32" color="warning" />
                  <p class="text-caption text-medium-emphasis mt-2">Araç bilgisi bulunamadı</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Sağ: İstatistikler (col-2) -->
      <v-col cols="12" md="2" class="pa-2">
        <v-card elevation="0" class="h-100 stats-card" style="border: 1px solid #e5e7eb;">
          <v-card-title class="pa-2" style="min-height: 40px;">
            <span class="text-body-2 font-weight-bold" style="font-size: 0.75rem;">İstatistikler</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <div v-if="loadingStats" class="text-center py-4">
              <v-progress-circular indeterminate color="primary" size="20" />
            </div>
            <div v-else>
              <div
                v-for="(stat, index) in statsList"
                :key="stat.key"
                class="stat-item-card"
              >
                <div class="d-flex align-center justify-space-between pa-2">
                  <div class="flex-grow-1">
                    <div class="stat-label" style="font-size: 0.7rem; color: #6b7280; font-weight: 500; line-height: 1.2;">
                      {{ stat.label }}
                    </div>
                    <div class="stat-value" style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-top: 4px;">
                      {{ formatNumber(stat.value) }}
                    </div>
                  </div>
                  <v-icon :icon="stat.icon" size="20" :color="stat.iconColor" class="ml-2" />
                </div>
                <v-divider v-if="index < statsList.length - 1" class="mx-2" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Rezervasyon İstatistik Grafiği (col-12) -->
    <v-row class="mt-2">
      <v-col cols="12">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Rezervasyon İstatistik Grafiği</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-if="loadingChart" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" size="24" />
              <p class="mt-2 text-caption text-medium-emphasis">Grafik yükleniyor...</p>
            </div>
            <div v-else style="position: relative; height: 250px;">
              <Line :data="chartData" :options="chartOptions" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Alt Taraf: Mevcut Bölümler (Türkçe) -->
    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Hatırlatma ve Mesajlar</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <v-form @submit.prevent="addMessage" class="mb-3">
              <v-row dense>
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="messageForm.date"
                    type="date"
                    density="compact"
                    variant="outlined"
                    label="Tarih"
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
                    label="Saat"
                    hide-details
                    prepend-inner-icon="mdi-clock-outline"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn color="primary" block size="small" @click="addMessage">
                    <v-icon icon="mdi-plus" size="16" class="mr-1" />
                    Ekle
                  </v-btn>
                </v-col>
              </v-row>
              <v-row dense class="mt-1">
                <v-col cols="12">
                  <v-text-field
                    v-model="messageForm.subject"
                    density="compact"
                    variant="outlined"
                    label="Konu"
                    hide-details
                    prepend-inner-icon="mdi-format-title"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="messageForm.detail"
                    density="compact"
                    variant="outlined"
                    label="Detay"
                    rows="2"
                    hide-details
                    prepend-inner-icon="mdi-text"
                  />
                </v-col>
              </v-row>
            </v-form>
            
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
              <p class="text-caption text-medium-emphasis mt-1">Henüz mesaj eklenmemiş</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewAllMessages"
            >
              Tüm Mesajları Görüntüle
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Günlük Ödeme Hatırlatmaları</span>
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
                      {{ item.paid ? 'Ödendi' : 'Ödenmedi' }}
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
              <p class="text-caption text-medium-emphasis mt-1">Ödeme hatırlatması yok</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewPaymentSchedule"
            >
              Ödeme Çizelgesini Görüntüle
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Uyarılar Bölümü -->
    <v-row class="mt-2">
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Sigorta Muayene Uyarıları</span>
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
              <p class="text-caption text-medium-emphasis mt-1">Uyarı yok</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewAllInsurance"
            >
              Tüm Sigorta/Muayeneleri Görüntüle
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Araç Bakım Uyarıları</span>
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
              <p class="text-caption text-medium-emphasis mt-1">Bakım uyarısı yok</p>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-arrow-right"
              class="mt-2"
              @click="viewAllMaintenance"
            >
              Tüm Bakımları Görüntüle
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-3">
            <span class="text-subtitle-1 font-weight-bold">Ceza Uyarıları</span>
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
                    {{ item.remaining }} Gün
                  </v-chip>
                </template>
              </v-data-table>
            </div>
            <div v-else class="empty-state-compact">
              <v-icon icon="mdi-check-circle-outline" size="32" color="grey-lighten-1" />
              <p class="text-caption text-medium-emphasis mt-1">Ceza uyarısı yok</p>
            </div>
            <div class="d-flex gap-2 mt-2">
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                prepend-icon="mdi-file-upload-outline"
                @click="uploadPenaltyFile"
              >
                Dosya Yükle
              </v-btn>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                prepend-icon="mdi-arrow-right"
                @click="viewAllPenalties"
              >
                Tüm Cezalar
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reklam Alanı - Premium Özellikler -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="2" rounded="lg" color="primary" variant="tonal">
          <v-card-title class="d-flex align-center pa-3">
            <v-icon icon="mdi-star" color="primary" class="mr-2" />
            <span class="text-subtitle-1 font-weight-bold">Premium Özellikler</span>
            <v-spacer />
            <v-chip color="primary" size="small" variant="flat">Ücretli Özellikler</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="outlined" class="h-100 text-center pa-3">
                  <v-icon icon="mdi-cash-multiple" size="40" color="success" class="mb-2" />
                  <div class="text-subtitle-2 font-weight-bold mb-1">Ön Muhasebe</div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    Finansal işlemlerinizi yönetin
                  </div>
                  <v-chip color="success" size="x-small" variant="flat">Ücretli</v-chip>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="outlined" class="h-100 text-center pa-3">
                  <v-icon icon="mdi-car" size="40" color="info" class="mb-2" />
                  <div class="text-subtitle-2 font-weight-bold mb-1">Araç Takip</div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    Araçlarınızı gerçek zamanlı takip edin
                  </div>
                  <v-chip color="info" size="x-small" variant="flat">Ücretli</v-chip>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="outlined" class="h-100 text-center pa-3">
                  <v-icon icon="mdi-message-text" size="40" color="purple" class="mb-2" />
                  <div class="text-subtitle-2 font-weight-bold mb-1">Chat Sistemi</div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    Müşterilerinizle anlık iletişim
                  </div>
                  <v-chip color="purple" size="x-small" variant="flat">Ücretli</v-chip>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="outlined" class="h-100 text-center pa-3">
                  <v-icon icon="mdi-robot" size="40" color="orange" class="mb-2" />
                  <div class="text-subtitle-2 font-weight-bold mb-1">Yapay Zeka</div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    AI ile içerik üretimi
                  </div>
                  <v-chip color="orange" size="x-small" variant="flat">Ücretli</v-chip>
                </v-card>
              </v-col>
            </v-row>
            <v-alert type="info" variant="tonal" class="mt-4" density="compact">
              <div class="d-flex align-center">
                <v-icon icon="mdi-information" class="mr-2" />
                <div>
                  <strong>Bu özellikleri kullanmak için yetki alın.</strong>
                  <div class="text-caption mt-1">Detaylı bilgi için destek ekibimizle iletişime geçin.</div>
                </div>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Rezervasyonlar
interface ReservationDto {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  createdAt: string;
  earned?: number;
}

const reservations = ref<ReservationDto[]>([]);
const loadingReservations = ref(false);
const selectedReservation = ref<ReservationDto | null>(null);

// Plakalar ve Araç Takip
interface VehiclePlateDto {
  id: string;
  plateNumber: string;
  vehicleId: string;
}

interface VehicleTrackingInfo {
  plateNumber: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  };
  ignitionStatus?: boolean;
  engineStatus?: boolean;
  fuelLevel?: number;
  mileage?: number;
  lastUpdate?: string;
}

const plates = ref<VehiclePlateDto[]>([]);
const selectedPlate = ref<string | null>(null);
const trackingInfo = ref<VehicleTrackingInfo | null>(null);
const loadingPlates = ref(false);
const loadingTracking = ref(false);
const map = ref<L.Map | null>(null);
const marker = ref<L.Marker | null>(null);

// İstatistikler
const stats = ref({
  vehiclesDeparting24h: 0,
  notDeparted: 0,
  totalBusinessDays: 0,
  deliveredVehicles: 0,
  vehiclesReturning24h: 0,
  notReturned: 0,
});
const loadingStats = ref(false);

// İstatistikler listesi (görseldeki gibi)
const statsList = computed(() => [
  {
    key: 'totalBusinessDays',
    label: 'Toplam Kiralama Gün Sayısı',
    value: stats.value.totalBusinessDays,
    icon: 'mdi-calendar-month',
    iconColor: '#3b82f6',
  },
  {
    key: 'deliveredVehicles',
    label: 'Teslim Edilen Araçlar',
    value: stats.value.deliveredVehicles,
    icon: 'mdi-car-check',
    iconColor: '#10b981',
  },
  {
    key: 'vehiclesDeparting24h',
    label: '24 Saat İçinde Çıkacak',
    value: stats.value.vehiclesDeparting24h,
    icon: 'mdi-timer-outline',
    iconColor: '#f59e0b',
  },
  {
    key: 'notDeparted',
    label: 'Çıkışı Yapılmamışlar',
    value: stats.value.notDeparted,
    icon: 'mdi-car-outline',
    iconColor: '#6366f1',
  },
  {
    key: 'vehiclesReturning24h',
    label: '24 Saat İçinde Dönecek',
    value: stats.value.vehiclesReturning24h,
    icon: 'mdi-timer-outline',
    iconColor: '#f59e0b',
  },
  {
    key: 'notReturned',
    label: 'Dönüşü Yapılmamışlar',
    value: stats.value.notReturned,
    icon: 'mdi-car-off',
    iconColor: '#ef4444',
  },
]);

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
const loadingCurrencies = ref(false);

// Chart data
const loadingChart = ref(false);
const reservationsForChart = ref<any[]>([]);

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
  { title: 'Tarih', key: 'date', width: '100px' },
  { title: 'Saat', key: 'time', width: '80px' },
  { title: 'Konu', key: 'subject' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '60px', align: 'center' as const },
];

// Payment Reminders
const paymentReminders = ref<any[]>([]);
const paymentHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Banka', key: 'bank', width: '120px' },
  { title: 'Tip', key: 'type', width: '80px' },
  { title: 'Tutar', key: 'amount', width: '100px' },
  { title: 'Durum', key: 'status', sortable: false, width: '120px' },
  { title: 'Tarih', key: 'date', width: '100px' },
  { title: 'Açıklama', key: 'description' },
];

// Insurance Warnings
const insuranceWarnings = ref<any[]>([]);
const insuranceHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Plaka', key: 'plate', width: '90px' },
  { title: 'İşlem', key: 'action', width: '100px' },
  { title: 'Başlangıç', key: 'startDate', width: '90px' },
  { title: 'Bitiş', key: 'endDate', width: '90px' },
  { title: 'Kalan', key: 'remaining', width: '80px' },
];

// Maintenance Warnings
const maintenanceWarnings = ref<any[]>([]);
const maintenanceHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Plaka', key: 'plate', width: '90px' },
  { title: 'İşlem', key: 'action', width: '100px' },
  { title: 'Bakım Tarihi', key: 'maintenanceDate', width: '100px' },
  { title: 'Bakım Km', key: 'maintenanceKm', width: '90px' },
  { title: 'Araç Km', key: 'vehicleKm', width: '90px' },
  { title: 'Kalan', key: 'remaining', width: '80px' },
];

// Penalty Warnings
const penaltyWarnings = ref<any[]>([]);
const penaltyHeaders = [
  { title: '#', key: 'id', width: '50px' },
  { title: 'Plaka', key: 'plate', width: '90px' },
  { title: 'Tip', key: 'type', width: '100px' },
  { title: 'Tarih', key: 'date', width: '90px' },
  { title: 'Tutar', key: 'amount', width: '90px' },
  { title: 'Kalan', key: 'remaining', width: '100px' },
  { title: 'Açıklama', key: 'description' },
];

// Prepare chart data
const chartData = computed(() => {
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const currentDate = new Date();
  const last12Months: string[] = [];
  const monthData: number[] = new Array(12).fill(0);

  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    last12Months.push(months[date.getMonth()] + ' ' + date.getFullYear());
  }

  reservationsForChart.value.forEach((reservation) => {
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

const formatCurrencyRateCompact = (rate: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate) + ' TRY';
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'orange';
    case 'confirmed':
      return 'blue';
    case 'completed':
      return 'green';
    case 'cancelled':
      return 'red';
    case 'rejected':
      return 'red';
    default:
      return 'grey';
  }
};

const getStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Beklemede';
    case 'confirmed':
      return 'Aktif';
    case 'completed':
      return 'Tamamlandı';
    case 'cancelled':
      return 'İptal';
    case 'rejected':
      return 'Reddedildi';
    default:
      return status;
  }
};

// Get initials for avatar
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Format reservation date
const formatReservationDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

// Select reservation
const selectReservation = (reservation: ReservationDto) => {
  selectedReservation.value = reservation;
};

// View reservation details
const viewReservationDetails = (reservation: ReservationDto) => {
  router.push(`/app/reservations/${reservation.id}`);
};

// Load Reservations (sondan başlayarak)
const loadReservations = async () => {
  if (!auth.tenant) return;
  loadingReservations.value = true;
  try {
    const { data } = await http.get<ReservationDto[]>('/rentacar/trips', {
      params: { tenantId: auth.tenant.id },
    });
    // Sondan başlayarak sırala (en yeni en üstte)
    // earned değerini metadata'dan al
    reservations.value = data.map(res => ({
      ...res,
      earned: (res as any).earned || 0,
    })).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to load reservations:', error);
  } finally {
    loadingReservations.value = false;
  }
};

// Load Plates
const loadPlates = async () => {
  if (!auth.tenant) return;
  loadingPlates.value = true;
  try {
    const { data } = await http.get<VehiclePlateDto[]>('/rentacar/plates');
    plates.value = data;
  } catch (error) {
    console.error('Failed to load plates:', error);
  } finally {
    loadingPlates.value = false;
  }
};

// Track Vehicle
const trackVehicle = async () => {
  if (!selectedPlate.value || !auth.tenant) return;
  
  loadingTracking.value = true;
  try {
    const { data } = await http.get<VehicleTrackingInfo>(`/rentacar/tracking/${selectedPlate.value}/info`);
    trackingInfo.value = data;
    
    if (data.lastLocation) {
      await nextTick();
      initializeMap();
      const { latitude, longitude } = data.lastLocation;
      const latLng: L.LatLngExpression = [latitude, longitude];
      
      if (marker.value) {
        marker.value.setLatLng(latLng);
      } else {
        marker.value = L.marker(latLng).addTo(map.value!);
      }
      map.value!.setView(latLng, 15);
    }
  } catch (error) {
    console.error('Failed to get vehicle tracking info:', error);
    trackingInfo.value = null;
  } finally {
    loadingTracking.value = false;
  }
};

// Initialize Map
const initializeMap = () => {
  if (map.value) {
    map.value.remove();
  }
  const mapElement = document.getElementById('map');
  if (!mapElement) return;
  
  map.value = L.map('map').setView([36.8969, 30.7133], 13); // Default to Antalya

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);
};

// Load Stats
const loadStats = async () => {
  if (!auth.tenant) return;
  loadingStats.value = true;
  try {
    const { data } = await http.get('/rentacar/trips/stats', {
      params: { tenantId: auth.tenant.id },
    });
    // Map stats to our format
    stats.value = {
      vehiclesDeparting24h: 0, // TODO: Calculate from reservations
      notDeparted: 0, // TODO: Calculate from reservations
      totalBusinessDays: 0, // TODO: Calculate from reservations
      deliveredVehicles: 0, // TODO: Calculate from reservations
      vehiclesReturning24h: 0, // TODO: Calculate from reservations
      notReturned: 0, // TODO: Calculate from reservations
    };
  } catch (error) {
    console.error('Failed to load stats:', error);
  } finally {
    loadingStats.value = false;
  }
};

// Load Currencies
const loadCurrencies = async () => {
  loadingCurrencies.value = true;
  try {
    const { data } = await http.get<CurrencyDto[]>('/currencies');
    currencies.value = data.filter(c => c.isActive).sort((a, b) => {
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
    await loadCurrencies();
  } catch (error) {
    console.error('Failed to update currency rates:', error);
  } finally {
    updatingRates.value = false;
  }
};

// Load Chart Data
const loadChartData = async () => {
  if (!auth.tenant) return;
  loadingChart.value = true;
  try {
    const { data } = await http.get('/rentacar/trips', {
      params: { tenantId: auth.tenant.id },
    });
    reservationsForChart.value = data;
  } catch (error) {
    console.error('Failed to load chart data:', error);
  } finally {
    loadingChart.value = false;
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

onMounted(async () => {
  await auth.ensureSession();
  if (auth.isAuthenticated) {
    loadReservations();
    loadPlates();
    loadStats();
    loadCurrencies();
    loadChartData();
  }
});
</script>

<style scoped>
.dashboard-container {
  padding: 16px !important;
  background: #f5f5f5;
  min-height: 100vh;
}

.h-100 {
  height: 100%;
}

.reservations-list {
  max-height: calc(100vh - 200px);
}

.reservation-item-card {
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.reservation-item-card:hover {
  background-color: #f9fafb;
}

.reservation-item-card.selected {
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.stat-item-card {
  transition: background 0.2s ease;
}

.stat-item-card:hover {
  background-color: #f9fafb;
}

.currency-item {
  padding: 4px 8px;
  background: rgba(25, 118, 210, 0.05);
  border-radius: 4px;
}

.compact-table {
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

.empty-state-compact {
  text-align: center;
  padding: 24px 16px;
  color: #94a3b8;
}

#map {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
