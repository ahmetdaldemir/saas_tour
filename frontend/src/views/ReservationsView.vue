<template>
  <div>
    <v-card elevation="2" class="mb-4 main-container">
      <v-window v-model="mainTab" class="window-content">
        <!-- Rezervasyon Listesi -->
        <v-window-item value="list">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Rezervasyonlar</span>
              <div class="d-flex align-center gap-2">
                <v-btn icon="mdi-refresh" variant="text" @click="loadReservations" :loading="loadingReservations" />
                <v-btn color="primary" prepend-icon="mdi-plus" @click="mainTab = 'new'">
                  Yeni Rezervasyon
                </v-btn>
              </div>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-0">
              <v-data-table
                :headers="reservationTableHeaders"
                :items="reservations"
                :loading="loadingReservations"
                item-value="id"
                class="elevation-0 reservation-table"
                density="compact"
              >
                <template #item.index="{ index }">
                  <span>{{ index + 1 }}</span>
                </template>
                <template #item.customerName="{ item }">
                  <span class="font-weight-medium">{{ item.customerName || '-' }}</span>
                </template>
                <template #item.pickupLocation="{ item }">
                  <span>{{ item.pickupLocation || '-' }}</span>
                </template>
                <template #item.returnLocation="{ item }">
                  <span>{{ item.returnLocation || '-' }}</span>
                </template>
                <template #item.pickupDate="{ item }">
                  <span>{{ formatDate(item.pickupDate) }}</span>
                </template>
                <template #item.returnDate="{ item }">
                  <span>{{ formatDate(item.returnDate) }}</span>
                </template>
                <template #item.vehicleName="{ item }">
                  <span>{{ item.vehicleName || '-' }}</span>
                </template>
                <template #item.totalPrice="{ item }">
                  <span>{{ formatPrice(item.totalPrice, item.currencyCode) }}</span>
                </template>
                <template #item.status="{ item }">
                  <v-chip
                    size="small"
                    :color="getStatusColor(item.status)"
                    variant="flat"
                  >
                    {{ item.status || '-' }}
                  </v-chip>
                </template>
                <template #item.actions="{ item }">
                  <div class="d-flex align-center gap-1" @click.stop>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      color="primary"
                      @click.stop="editReservation(item)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click.stop="deleteReservation(item.id)"
                    />
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Yeni Rezervasyon -->
        <v-window-item value="new">
          <v-row class="ma-0">
            <!-- Sol Sidebar -->
            <v-col cols="12" md="3" class="pa-0">
              <v-card elevation="0" class="h-100" style="border-right: 1px solid rgba(0,0,0,0.12);">
                <v-card-text class="pa-4">
                  <!-- Para Birimi -->
                  <div class="mb-4">
                    <label class="text-body-2 font-weight-medium mb-2 d-block">Para Birimi</label>
                    <v-select
                      v-model="reservationForm.currencyCode"
                      :items="currencyOptions"
                      item-title="label"
                      item-value="value"
                      density="compact"
                      variant="outlined"
                      hide-details
                    >
                      <template #prepend-inner>
                        <v-icon :icon="getCurrencyIcon(reservationForm.currencyCode)" size="20" />
                      </template>
                    </v-select>
                  </div>

                  <!-- Rezervasyon Kaynağı -->
                  <div class="mb-4">
                    <label class="text-body-2 font-weight-medium mb-2 d-block">Rezervasyon Kaynağı</label>
                    <v-select
                      v-model="reservationForm.source"
                      :items="sourceOptions"
                      item-title="label"
                      item-value="value"
                      density="compact"
                      variant="outlined"
                      hide-details
                    >
                      <template #prepend-inner>
                        <v-icon :icon="getSourceIcon(reservationForm.source)" size="20" />
                      </template>
                    </v-select>
                  </div>

                  <!-- Alış Lokasyon - Tarih Saat Bilgileri -->
                  <div class="mb-4">
                    <label class="text-body-2 font-weight-medium mb-2 d-block">Alış Lokasyon - Tarih Saat Bilgileri</label>
                    <v-select
                      v-model="reservationForm.pickupLocationId"
                      :items="availableLocations"
                      item-title="name"
                      item-value="id"
                      label="Alış Yeri Seçiniz"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-2"
                    />
                    <v-text-field
                      v-model="reservationForm.pickupDate"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-2"
                    >
                      <template #prepend-inner>
                        <v-icon icon="mdi-calendar" size="20" />
                      </template>
                    </v-text-field>
                    <v-text-field
                      v-model="reservationForm.pickupTime"
                      type="time"
                      density="compact"
                      variant="outlined"
                      hide-details
                    >
                      <template #prepend-inner>
                        <v-icon icon="mdi-clock-outline" size="20" />
                      </template>
                    </v-text-field>
                  </div>

                  <!-- Dönüş Lokasyon - Tarih Saat Bilgileri -->
                  <div class="mb-4">
                    <label class="text-body-2 font-weight-medium mb-2 d-block">Dönüş Lokasyon - Tarih Saat Bilgileri</label>
                    <v-select
                      v-model="reservationForm.returnLocationId"
                      :items="availableLocations"
                      item-title="name"
                      item-value="id"
                      label="Dönüş Yeri Seçiniz"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-2"
                    />
                    <v-text-field
                      v-model="reservationForm.returnDate"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-2"
                    >
                      <template #prepend-inner>
                        <v-icon icon="mdi-calendar" size="20" />
                      </template>
                    </v-text-field>
                    <v-text-field
                      v-model="reservationForm.returnTime"
                      type="time"
                      density="compact"
                      variant="outlined"
                      hide-details
                    >
                      <template #prepend-inner>
                        <v-icon icon="mdi-clock-outline" size="20" />
                      </template>
                    </v-text-field>
                  </div>

                  <v-btn
                    color="primary"
                    block
                    prepend-icon="mdi-car-search"
                    @click="loadAvailableVehicles"
                    :loading="loadingVehicles"
                    :disabled="!canLoadVehicles"
                  >
                    Araçları Getir
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Orta Alan -->
            <v-col cols="12" md="6" class="pa-0">
              <v-card elevation="0" class="h-100" style="border-right: 1px solid rgba(0,0,0,0.12);">
                <v-card-text class="pa-4">
                  <!-- Kiraya Verilebilecek Araçlar -->
                  <div class="mb-4">
                    <h3 class="text-h6 font-weight-bold mb-3">Kiraya Verilebilecek Araçlar</h3>
                    <v-data-table
                      :headers="vehicleTableHeaders"
                      :items="availableVehicles"
                      :loading="loadingVehicles"
                      item-value="id"
                      class="elevation-0 vehicle-table"
                      density="compact"
                      @click:row="selectVehicle"
                    >
                      <template #item.image="{ item }">
                        <v-avatar size="40" color="grey-lighten-2">
                          <v-icon icon="mdi-car" />
                        </v-avatar>
                      </template>
                      <template #item.vehicleModel="{ item }">
                        <div>
                          <div class="font-weight-medium">{{ item.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ item.brandName || '-' }} {{ item.modelName || '-' }}
                          </div>
                        </div>
                      </template>
                      <template #item.plate="{ item }">
                        <span>{{ getVehiclePlate(item) || '-' }}</span>
                      </template>
                      <template #item.days="{ item }">
                        <span>{{ calculateDays() }}</span>
                      </template>
                      <template #item.dailyPrice="{ item }">
                        <span>{{ formatPrice(item.dailyPrice || 0, reservationForm.currencyCode) }}</span>
                      </template>
                      <template #item.rentalPrice="{ item }">
                        <span>{{ formatPrice(calculateRentalPrice(item), reservationForm.currencyCode) }}</span>
                      </template>
                      <template #item.dropFee="{ item }">
                        <span>{{ formatPrice(getDropFee(), reservationForm.currencyCode) }}</span>
                      </template>
                      <template #item.deliveryFee="{ item }">
                        <span>{{ formatPrice(getDeliveryFee(), reservationForm.currencyCode) }}</span>
                      </template>
                      <template #item.totalPrice="{ item }">
                        <span class="font-weight-bold">{{ formatPrice(calculateTotalPrice(item), reservationForm.currencyCode) }}</span>
                      </template>
                      <template #item.lastReturnLocation="{ item }">
                        <span>-</span>
                      </template>
                    </v-data-table>
                  </div>

                  <!-- Müşteri Seçimi -->
                  <div class="mb-4">
                    <h3 class="text-h6 font-weight-bold mb-3">Müşteri Seçimi</h3>
                    <div class="d-flex align-center gap-2 mb-3">
                      <v-select
                        v-model="reservationForm.customerId"
                        :items="availableCustomers"
                        item-title="fullName"
                        item-value="id"
                        label="Müşteri Seçimi"
                        density="compact"
                        variant="outlined"
                        hide-details
                        class="flex-grow-1"
                        @update:model-value="onCustomerSelect"
                      >
                        <template #item="{ item, props }">
                          <v-list-item
                            v-bind="props"
                            :disabled="item.raw.isBlacklisted"
                          >
                            <template #prepend>
                              <v-icon
                                v-if="item.raw.isBlacklisted"
                                icon="mdi-account-off"
                                color="error"
                                size="20"
                                class="mr-2"
                              />
                            </template>
                            <v-list-item-title>
                              <span :class="{ 'text-error': item.raw.isBlacklisted }">
                                {{ item.raw.fullName }}
                                <span v-if="item.raw.isBlacklisted" class="text-error text-caption ml-2">
                                  (Kara Listede)
                                </span>
                              </span>
                            </v-list-item-title>
                          </v-list-item>
                        </template>
                        <template #selection="{ item }">
                          <span :class="{ 'text-error': item.raw.isBlacklisted }">
                            {{ item.raw.fullName }}
                            <span v-if="item.raw.isBlacklisted" class="text-error text-caption ml-2">
                              (Kara Listede)
                            </span>
                          </span>
                        </template>
                      </v-select>
                      <v-btn
                        color="success"
                        prepend-icon="mdi-plus"
                        @click="openCustomerDialog"
                      >
                        Müşteri Ekle
                      </v-btn>
                    </div>

                    <!-- Müşteri Bilgileri -->
                    <v-row v-if="selectedCustomer" dense>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.country"
                          label="Ülke"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.fullName"
                          label="Müşteri"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.email"
                          label="Email"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.mobile"
                          label="Mobil"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.phone"
                          label="Tel"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.birthDate"
                          label="D.Tarihi"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.gender"
                          label="Cinsiyet"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.totalPoints"
                          label="Toplam Puan"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customerInfo.remainingPoints"
                          label="Kalan Puan"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="4">
                        <v-text-field
                          v-model="customerInfo.canceledReservations"
                          label="İptal Rez."
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="4">
                        <v-text-field
                          v-model="customerInfo.approvedReservations"
                          label="Onaylı Rez."
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="4">
                        <v-text-field
                          v-model="customerInfo.pendingReservations"
                          label="Beklemede Rez."
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="customerInfo.completedReservations"
                          label="Tamamlanan Rez."
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Sağ Sidebar -->
            <v-col cols="12" md="3" class="pa-0">
              <v-card elevation="0" class="h-100">
                <v-card-text class="pa-4">
                  <h3 class="text-h6 font-weight-bold mb-3">Fiyat Detayları</h3>
                  
                  <v-row dense>
                    <v-col cols="12">
                      <v-text-field
                        :model-value="calculateDays()"
                        label="Kiralama Süresi"
                        density="compact"
                        variant="outlined"
                        readonly
                        hide-details
                        suffix="Gün"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="reservationForm.nonRentalFee"
                        label="Kiramama Ücreti"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="reservationForm.extraFee"
                        label="Ekstra Ücreti"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        :model-value="getDeliveryFee()"
                        label="Teslim Ücreti"
                        density="compact"
                        variant="outlined"
                        readonly
                        hide-details
                        :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        :model-value="getDropFee()"
                        label="Drop Ücreti"
                        density="compact"
                        variant="outlined"
                        readonly
                        hide-details
                        :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        :model-value="selectedVehicle ? (selectedVehicle.dailyPrice || 0) : 0"
                        label="Günlük Fiyat"
                        density="compact"
                        variant="outlined"
                        readonly
                        hide-details
                        :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-select
                        v-model="reservationForm.paymentMethod"
                        :items="paymentMethodOptions"
                        item-title="label"
                        item-value="value"
                        label="Ödeme Yöntemi"
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        :model-value="calculateTotalAmount()"
                        label="Ödenecek Tutar"
                        density="compact"
                        variant="outlined"
                        readonly
                        hide-details
                        :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                        class="font-weight-bold"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="reservationForm.discountedAmount"
                        label="İndirimli Tutar"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Alt Bar - Kaydet Butonu -->
          <v-card elevation="0" class="mt-4">
            <v-card-actions class="pa-4 bg-primary">
              <v-spacer />
              <v-btn
                color="white"
                size="large"
                prepend-icon="mdi-content-save"
                @click="saveReservation"
                :loading="savingReservation"
                :disabled="!canSaveReservation"
              >
                REZERVASYONU KAYDET
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

// Data
const reservations = ref<ReservationDto[]>([]);
const locations = ref<LocationDto[]>([]);
const customers = ref<CustomerDto[]>([]);
const vehicles = ref<VehicleDto[]>([]);
const availableVehicles = ref<AvailableVehicleDto[]>([]);

// UI State
const mainTab = ref('list');
const loadingReservations = ref(false);
const loadingLocations = ref(false);
const loadingCustomers = ref(false);
const loadingVehicles = ref(false);
const savingReservation = ref(false);
const selectedVehicle = ref<AvailableVehicleDto | null>(null);

// Options
const currencyOptions = [
  { label: 'TRY (₺)', value: 'TRY', icon: 'mdi-currency-try' },
  { label: 'USD ($)', value: 'USD', icon: 'mdi-currency-usd' },
  { label: 'EUR (€)', value: 'EUR', icon: 'mdi-currency-eur' },
];

const sourceOptions = [
  { label: 'Ofis', value: 'office', icon: 'mdi-office-building' },
  { label: 'Telefon', value: 'phone', icon: 'mdi-phone' },
  { label: 'Whatsapp', value: 'whatsapp', icon: 'mdi-whatsapp' },
  { label: 'Facebook', value: 'facebook', icon: 'mdi-facebook' },
  { label: 'Instagram', value: 'instagram', icon: 'mdi-instagram' },
  { label: 'Google', value: 'google', icon: 'mdi-google' },
  { label: 'Öneri', value: 'recommendation', icon: 'mdi-star' },
];

const paymentMethodOptions = [
  { label: 'Nakit Ödeme', value: 'cash' },
  { label: 'Teslimatta Kredi Kartı', value: 'card_on_delivery' },
  { label: 'Online Ödeme', value: 'online' },
];

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Reservation Form
const reservationForm = reactive({
  currencyCode: 'TRY',
  source: 'office',
  pickupLocationId: '',
  pickupDate: getTodayDate(),
  pickupTime: '09:00',
  returnLocationId: '',
  returnDate: getTodayDate(),
  returnTime: '09:00',
  customerId: '',
  vehicleId: '',
  nonRentalFee: 0,
  extraFee: 0,
  paymentMethod: 'cash',
  discountedAmount: 0,
});

// Customer Info
const customerInfo = reactive({
  country: '',
  fullName: '',
  email: '',
  mobile: '',
  phone: '',
  birthDate: '',
  gender: '',
  totalPoints: 0,
  remainingPoints: 0,
  canceledReservations: 0,
  approvedReservations: 0,
  pendingReservations: 0,
  completedReservations: 0,
});

// Interfaces
interface LocationDto {
  id: string;
  name: string;
  province?: string;
  district?: string;
  deliveryFee?: number;
  dropFee?: number;
  currencyCode?: string;
  isActive?: boolean;
}

interface CustomerDto {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  country?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  isBlacklisted?: boolean;
}

interface VehicleDto {
  id: string;
  name: string;
  brandName?: string;
  modelName?: string;
  plates?: Array<{ plateNumber: string; isActive: boolean }>;
  baseRate?: number;
  currencyCode?: string;
}

interface AvailableVehicleDto {
  id: string;
  name: string;
  brandName?: string;
  modelName?: string;
  plate?: string;
  dailyPrice: number;
  rentalPrice: number;
  dropFee: number;
  deliveryFee: number;
  totalPrice: number;
}

interface ReservationDto {
  id: string;
  customerName: string;
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  returnDate: string;
  vehicleName: string;
  totalPrice: number;
  currencyCode: string;
  status: string;
}

// Computed
const availableLocations = computed(() => {
  return locations.value.filter(loc => loc.name).map(loc => ({
    id: loc.id,
    name: loc.name || `${loc.province || ''} ${loc.district || ''}`.trim(),
  }));
});

const getBlacklistedCustomers = (): string[] => {
  try {
    const blacklisted = localStorage.getItem('crm_blacklisted_customers');
    return blacklisted ? JSON.parse(blacklisted) : [];
  } catch {
    return [];
  }
};

const availableCustomers = computed(() => {
  const blacklistedIds = getBlacklistedCustomers();
  return customers.value.map(customer => ({
    ...customer,
    isBlacklisted: blacklistedIds.includes(customer.id),
    disabled: blacklistedIds.includes(customer.id),
  }));
});

const selectedCustomer = computed(() => {
  if (!reservationForm.customerId) return null;
  return customers.value.find(c => c.id === reservationForm.customerId);
});

const canLoadVehicles = computed(() => {
  return !!(
    reservationForm.pickupLocationId &&
    reservationForm.returnLocationId &&
    reservationForm.pickupDate &&
    reservationForm.returnDate
  );
});

const canSaveReservation = computed(() => {
  return !!(
    reservationForm.pickupLocationId &&
    reservationForm.returnLocationId &&
    reservationForm.pickupDate &&
    reservationForm.returnDate &&
    reservationForm.customerId &&
    reservationForm.vehicleId
  );
});

// Table headers
const reservationTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Müşteri', key: 'customerName', width: '200px' },
  { title: 'Alış Lokasyon', key: 'pickupLocation', width: '150px' },
  { title: 'Dönüş Lokasyon', key: 'returnLocation', width: '150px' },
  { title: 'Alış Tarihi', key: 'pickupDate', width: '120px' },
  { title: 'Dönüş Tarihi', key: 'returnDate', width: '120px' },
  { title: 'Araç', key: 'vehicleName', width: '150px' },
  { title: 'Toplam Fiyat', key: 'totalPrice', width: '120px' },
  { title: 'Durum', key: 'status', sortable: false, width: '100px' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '120px' },
];

const vehicleTableHeaders = [
  { title: 'Resim', key: 'image', sortable: false, width: '60px' },
  { title: 'Araç Model', key: 'vehicleModel', width: '150px' },
  { title: 'Plaka', key: 'plate', width: '100px' },
  { title: 'Kaç Gün', key: 'days', width: '80px' },
  { title: 'Günlük Fiyat', key: 'dailyPrice', width: '100px' },
  { title: 'Kiralama Fiyatı', key: 'rentalPrice', width: '120px' },
  { title: 'Drop Ücreti', key: 'dropFee', width: '100px' },
  { title: 'Teslim Ücreti', key: 'deliveryFee', width: '100px' },
  { title: 'Toplam Fiyat', key: 'totalPrice', width: '120px' },
  { title: 'Son Dönüş Lokasyonu', key: 'lastReturnLocation', width: '150px' },
];

// Methods
const getCurrencyIcon = (code: string): string => {
  const icons: Record<string, string> = {
    TRY: 'mdi-currency-try',
    USD: 'mdi-currency-usd',
    EUR: 'mdi-currency-eur',
  };
  return icons[code] || 'mdi-currency-usd';
};

const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
  };
  return symbols[code] || '$';
};

const getSourceIcon = (source: string): string => {
  const icons: Record<string, string> = {
    office: 'mdi-office-building',
    phone: 'mdi-phone',
    whatsapp: 'mdi-whatsapp',
    facebook: 'mdi-facebook',
    instagram: 'mdi-instagram',
    google: 'mdi-google',
    recommendation: 'mdi-star',
  };
  return icons[source] || 'mdi-help-circle';
};

const formatDate = (date: string): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR');
};

const formatPrice = (price: number, currencyCode: string): string => {
  return `${price.toFixed(2)} ${getCurrencySymbol(currencyCode)}`;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Onaylandı': 'success',
    'Beklemede': 'warning',
    'İptal': 'error',
    'Tamamlandı': 'info',
  };
  return colors[status] || 'default';
};

const calculateDays = (): number => {
  if (!reservationForm.pickupDate || !reservationForm.returnDate) return 0;
  const pickup = new Date(reservationForm.pickupDate);
  const returnDate = new Date(reservationForm.returnDate);
  const diffTime = returnDate.getTime() - pickup.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const getPickupLocation = () => {
  return locations.value.find(l => l.id === reservationForm.pickupLocationId);
};

const getReturnLocation = () => {
  return locations.value.find(l => l.id === reservationForm.returnLocationId);
};

const getDeliveryFee = (): number => {
  const location = getPickupLocation();
  if (!location || location.currencyCode !== reservationForm.currencyCode) return 0;
  return location.deliveryFee || 0;
};

const getDropFee = (): number => {
  const location = getReturnLocation();
  if (!location || location.currencyCode !== reservationForm.currencyCode) return 0;
  return location.dropFee || 0;
};

const calculateRentalPrice = (vehicle: AvailableVehicleDto): number => {
  const days = calculateDays();
  return (vehicle.dailyPrice || 0) * days;
};

const calculateTotalPrice = (vehicle: AvailableVehicleDto): number => {
  const rentalPrice = calculateRentalPrice(vehicle);
  const deliveryFee = getDeliveryFee();
  const dropFee = getDropFee();
  return rentalPrice + deliveryFee + dropFee;
};

const calculateTotalAmount = (): number => {
  if (!selectedVehicle.value) return 0;
  const rentalPrice = calculateRentalPrice(selectedVehicle.value);
  const deliveryFee = getDeliveryFee();
  const dropFee = getDropFee();
  const nonRentalFee = reservationForm.nonRentalFee || 0;
  const extraFee = reservationForm.extraFee || 0;
  return rentalPrice + deliveryFee + dropFee + nonRentalFee + extraFee;
};

const getVehiclePlate = (vehicle: VehicleDto): string => {
  if (!vehicle.plates || vehicle.plates.length === 0) return '';
  const activePlate = vehicle.plates.find(p => p.isActive);
  return activePlate?.plateNumber || vehicle.plates[0]?.plateNumber || '';
};

const loadReservations = async () => {
  if (!auth.tenant) return;
  loadingReservations.value = true;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // const { data } = await http.get<ReservationDto[]>('/rentacar/reservations', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // reservations.value = data;
    
    // Örnek veri
    reservations.value = [];
  } catch (error) {
    console.error('Failed to load reservations:', error);
  } finally {
    loadingReservations.value = false;
  }
};

const loadLocations = async () => {
  if (!auth.tenant) return;
  loadingLocations.value = true;
  try {
    const { data } = await http.get<LocationDto[]>('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });
    locations.value = data.filter(loc => loc.isActive);
  } catch (error) {
    console.error('Failed to load locations:', error);
  } finally {
    loadingLocations.value = false;
  }
};

// Helper functions for localStorage
const getDeletedCustomers = (): string[] => {
  try {
    const deleted = localStorage.getItem('crm_deleted_customers');
    return deleted ? JSON.parse(deleted) : [];
  } catch {
    return [];
  }
};

const getAddedCustomers = (): CustomerDto[] => {
  try {
    const added = localStorage.getItem('crm_added_customers');
    return added ? JSON.parse(added) : [];
  } catch {
    return [];
  }
};

const loadCustomers = async () => {
  if (!auth.tenant) return;
  loadingCustomers.value = true;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // const { data } = await http.get<CustomerDto[]>('/crm/customers', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // customers.value = data;
    
    // Örnek veri (CrmView'dan aynı)
    const sampleData: CustomerDto[] = [
      {
        id: '1',
        fullName: 'KARL ALEXANDER KROSTİNA',
        gender: 'male',
        phone: '(+49) 1704630767',
        email: 'kkroshina@googlemail.com',
      },
      {
        id: '2',
        fullName: 'OLEG BASALAEV',
        gender: 'male',
        phone: '(+7) 9633689689',
        email: 'laybol@yandex.ru',
      },
    ];
    
    // Silinen öğeleri filtrele ve eklenen öğeleri ekle
    const deletedIds = getDeletedCustomers();
    const addedCustomers = getAddedCustomers();
    const blacklistedIds = getBlacklistedCustomers();
    const filteredSample = sampleData.filter(item => !deletedIds.includes(item.id));
    const allCustomers = [...filteredSample, ...addedCustomers];
    
    // Kara liste durumunu ekle
    customers.value = allCustomers.map(customer => ({
      ...customer,
      isBlacklisted: blacklistedIds.includes(customer.id),
    }));
  } catch (error) {
    console.error('Failed to load customers:', error);
  } finally {
    loadingCustomers.value = false;
  }
};

const loadVehicles = async () => {
  if (!auth.tenant) return;
  loadingVehicles.value = true;
  try {
    const { data } = await http.get<VehicleDto[]>('/rentacar/vehicles', {
      params: { tenantId: auth.tenant.id },
    });
    vehicles.value = data;
  } catch (error) {
    console.error('Failed to load vehicles:', error);
  } finally {
    loadingVehicles.value = false;
  }
};

const loadAvailableVehicles = async () => {
  if (!canLoadVehicles.value) return;
  
  loadingVehicles.value = true;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // Araçları filtrele ve fiyatlandır
    
    // Şimdilik mevcut araçları göster
    const days = calculateDays();
    const pickupLocation = getPickupLocation();
    const returnLocation = getReturnLocation();
    
    availableVehicles.value = vehicles.value.map(vehicle => {
      const dailyPrice = vehicle.baseRate || 0;
      const rentalPrice = dailyPrice * days;
      const deliveryFee = pickupLocation?.deliveryFee || 0;
      const dropFee = returnLocation?.dropFee || 0;
      const totalPrice = rentalPrice + deliveryFee + dropFee;
      
      return {
        id: vehicle.id,
        name: vehicle.name,
        brandName: vehicle.brandName,
        modelName: vehicle.modelName,
        plate: getVehiclePlate(vehicle),
        dailyPrice,
        rentalPrice,
        dropFee,
        deliveryFee,
        totalPrice,
      };
    });
  } catch (error) {
    console.error('Failed to load available vehicles:', error);
  } finally {
    loadingVehicles.value = false;
  }
};

const selectVehicle = (_event: any, { item }: { item: AvailableVehicleDto }) => {
  selectedVehicle.value = item;
  reservationForm.vehicleId = item.id;
};

const onCustomerSelect = (customerId: string) => {
  const blacklistedIds = getBlacklistedCustomers();
  if (blacklistedIds.includes(customerId)) {
    // Kara listedeki müşteri seçilemez
    alert('Kara listedeki müşteriler rezervasyon için seçilemez!');
    reservationForm.customerId = '';
    resetCustomerInfo();
    return;
  }
  
  const customer = customers.value.find(c => c.id === customerId);
  if (!customer) {
    resetCustomerInfo();
    return;
  }
  
  customerInfo.country = customer.country || '';
  customerInfo.fullName = customer.fullName || '';
  customerInfo.email = customer.email || '';
  customerInfo.mobile = customer.phone || '';
  customerInfo.phone = customer.phone || '';
  customerInfo.birthDate = customer.birthDate || '';
  customerInfo.gender = customer.gender === 'male' ? 'Erkek' : customer.gender === 'female' ? 'Kadın' : 'Diğer';
  customerInfo.totalPoints = 0;
  customerInfo.remainingPoints = 0;
  customerInfo.canceledReservations = 0;
  customerInfo.approvedReservations = 0;
  customerInfo.pendingReservations = 0;
  customerInfo.completedReservations = 0;
};

const resetCustomerInfo = () => {
  customerInfo.country = '';
  customerInfo.fullName = '';
  customerInfo.email = '';
  customerInfo.mobile = '';
  customerInfo.phone = '';
  customerInfo.birthDate = '';
  customerInfo.gender = '';
  customerInfo.totalPoints = 0;
  customerInfo.remainingPoints = 0;
  customerInfo.canceledReservations = 0;
  customerInfo.approvedReservations = 0;
  customerInfo.pendingReservations = 0;
  customerInfo.completedReservations = 0;
};

const openCustomerDialog = () => {
  // TODO: Müşteri ekleme dialog'unu aç
  alert('Müşteri ekleme özelliği yakında eklenecek');
};

const saveReservation = async () => {
  if (!auth.tenant || !canSaveReservation.value) return;
  
  // Kara liste kontrolü
  const blacklistedIds = getBlacklistedCustomers();
  if (blacklistedIds.includes(reservationForm.customerId)) {
    alert('Kara listedeki müşteriler için rezervasyon oluşturulamaz!');
    return;
  }
  
  savingReservation.value = true;
  try {
    const reservationData = {
      tenantId: auth.tenant.id,
      currencyCode: reservationForm.currencyCode,
      source: reservationForm.source,
      pickupLocationId: reservationForm.pickupLocationId,
      pickupDate: reservationForm.pickupDate,
      pickupTime: reservationForm.pickupTime,
      returnLocationId: reservationForm.returnLocationId,
      returnDate: reservationForm.returnDate,
      returnTime: reservationForm.returnTime,
      customerId: reservationForm.customerId,
      vehicleId: reservationForm.vehicleId,
      nonRentalFee: reservationForm.nonRentalFee || 0,
      extraFee: reservationForm.extraFee || 0,
      paymentMethod: reservationForm.paymentMethod,
      discountedAmount: reservationForm.discountedAmount || 0,
      totalAmount: calculateTotalAmount(),
    };
    
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // await http.post('/rentacar/reservations', reservationData);
    
    alert('Rezervasyon başarıyla kaydedildi');
    resetReservationForm();
    mainTab.value = 'list';
    await loadReservations();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Rezervasyon kaydedilirken bir hata oluştu');
  } finally {
    savingReservation.value = false;
  }
};

const resetReservationForm = () => {
  reservationForm.currencyCode = 'TRY';
  reservationForm.source = 'office';
  reservationForm.pickupLocationId = '';
  reservationForm.pickupDate = getTodayDate();
  reservationForm.pickupTime = '09:00';
  reservationForm.returnLocationId = '';
  reservationForm.returnDate = getTodayDate();
  reservationForm.returnTime = '09:00';
  reservationForm.customerId = '';
  reservationForm.vehicleId = '';
  reservationForm.nonRentalFee = 0;
  reservationForm.extraFee = 0;
  reservationForm.paymentMethod = 'cash';
  reservationForm.discountedAmount = 0;
  selectedVehicle.value = null;
  availableVehicles.value = [];
  resetCustomerInfo();
};

const editReservation = (reservation: ReservationDto) => {
  // TODO: Rezervasyon düzenleme özelliği eklenecek
  alert(`Rezervasyon düzenleme: ${reservation.id}`);
};

const deleteReservation = async (id: string) => {
  if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // await http.delete(`/rentacar/reservations/${id}`);
    
    await loadReservations();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Rezervasyon silinirken bir hata oluştu');
  }
};

onMounted(async () => {
  await Promise.all([
    loadReservations(),
    loadLocations(),
    loadCustomers(),
    loadVehicles(),
  ]);
});
</script>

<style scoped>
.main-container {
  width: 100%;
  max-width: 100%;
}

.window-content {
  width: 100%;
}

.window-content :deep(.v-window-item) {
  width: 100%;
  padding: 0;
}

.reservation-table,
.vehicle-table {
  width: 100%;
}

.reservation-table :deep(th),
.reservation-table :deep(td),
.vehicle-table :deep(th),
.vehicle-table :deep(td) {
  white-space: nowrap;
  padding: 10px 12px !important;
  vertical-align: middle;
}

.reservation-table :deep(th),
.vehicle-table :deep(th) {
  font-weight: 600;
  font-size: 0.875rem;
}

.reservation-table :deep(.v-data-table-header),
.vehicle-table :deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-surface), 1);
}

.vehicle-table :deep(.v-data-table__tr) {
  cursor: pointer;
}

.vehicle-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>

