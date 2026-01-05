<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center justify-space-between bg-primary text-white">
            <div class="d-flex align-center">
              <v-btn icon="mdi-arrow-left" variant="text" color="white" @click="goBack" class="mr-2" />
              <span class="text-h6 font-weight-bold">Rezervasyon Detayları</span>
            </div>
            <v-chip :color="getStatusColor(reservation?.status)" variant="flat" size="large">
              {{ getStatusLabel(reservation?.status) }}
            </v-chip>
          </v-card-title>
          <v-divider />
          
          <v-card-text v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4 text-body-1">Yükleniyor...</p>
          </v-card-text>

          <v-card-text v-else-if="!reservation" class="text-center py-8">
            <v-icon icon="mdi-alert-circle" size="64" color="error" />
            <p class="mt-4 text-body-1">Rezervasyon bulunamadı</p>
          </v-card-text>

          <v-card-text v-else>
            <!-- Rezervasyon Bilgileri -->
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-information" class="mr-2" />
                    Rezervasyon Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Rezervasyon Kodu</v-list-item-title>
                        <v-list-item-subtitle class="text-h6 font-weight-bold">{{ reservation.reference }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Rezervasyon Tipi</v-list-item-title>
                        <v-list-item-subtitle>{{ getReservationTypeLabel(reservation.type) }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Durum</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip :color="getStatusColor(reservation.status)" size="small" variant="flat">
                            {{ getStatusLabel(reservation.status) }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Oluşturulma Tarihi</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDateTime(reservation.createdAt) }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="reservation.updatedAt">
                        <v-list-item-title>Son Güncelleme</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDateTime(reservation.updatedAt) }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-account" class="mr-2" />
                    Müşteri Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Ad Soyad</v-list-item-title>
                        <v-list-item-subtitle class="text-h6">{{ reservation.customerName }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>E-posta</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.customerEmail }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="reservation.customerPhone">
                        <v-list-item-title>Telefon</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.customerPhone }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="reservation.customerLanguage">
                        <v-list-item-title>Dil</v-list-item-title>
                        <v-list-item-subtitle>{{ reservation.customerLanguage.name || reservation.customerLanguage.code }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Rentacar Rezervasyon Detayları -->
            <v-row v-if="reservation.type === 'rentacar' && reservation.metadata">
              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-car" class="mr-2" />
                    Araç ve Lokasyon Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-list density="compact">
                          <v-list-item>
                            <v-list-item-title>Araç</v-list-item-title>
                            <v-list-item-subtitle class="text-h6">{{ (reservation.metadata as any).vehicleName || '-' }}</v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Alış Lokasyonu</v-list-item-title>
                            <v-list-item-subtitle>{{ (reservation.metadata as any).pickupLocationName || '-' }}</v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Alış Tarihi & Saati</v-list-item-title>
                            <v-list-item-subtitle>{{ formatDateTime(reservation.checkIn) }}</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-list density="compact">
                          <v-list-item>
                            <v-list-item-title>Kiralama Günü</v-list-item-title>
                            <v-list-item-subtitle>{{ (reservation.metadata as any).rentalDays || 0 }} gün</v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Dönüş Lokasyonu</v-list-item-title>
                            <v-list-item-subtitle>{{ (reservation.metadata as any).dropoffLocationName || '-' }}</v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Dönüş Tarihi & Saati</v-list-item-title>
                            <v-list-item-subtitle>{{ formatDateTime(reservation.checkOut) }}</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Fiyat Bilgileri -->
            <v-row v-if="reservation.type === 'rentacar' && reservation.metadata">
              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-cash" class="mr-2" />
                    Fiyat Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Araç Fiyatı</v-list-item-title>
                        <v-list-item-subtitle class="text-h6">
                          {{ formatPrice((reservation.metadata as any).vehiclePrice, (reservation.metadata as any).currencyCode) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="(reservation.metadata as any).extrasPrice > 0">
                        <v-list-item-title>Ekstra Hizmetler</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ formatPrice((reservation.metadata as any).extrasPrice, (reservation.metadata as any).currencyCode) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-divider class="my-2" />
                      <v-list-item>
                        <v-list-item-title class="text-h6 font-weight-bold">Toplam Fiyat</v-list-item-title>
                        <v-list-item-subtitle class="text-h5 font-weight-bold text-primary">
                          {{ formatPrice((reservation.metadata as any).totalPrice, (reservation.metadata as any).currencyCode) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="(reservation.metadata as any).paymentMethod">
                        <v-list-item-title>Ödeme Yöntemi</v-list-item-title>
                        <v-list-item-subtitle>{{ getPaymentMethodLabel((reservation.metadata as any).paymentMethod) }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Notlar -->
            <v-row>
              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-note-text" class="mr-2" />
                    Notlar
                  </v-card-title>
                  <v-card-text>
                    <div v-if="reservation.notes" class="mb-4">
                      <v-textarea
                        :model-value="reservation.notes"
                        readonly
                        variant="outlined"
                        rows="5"
                        auto-grow
                      />
                    </div>
                    <div v-else class="text-medium-emphasis mb-4">
                      Henüz not eklenmemiş.
                    </div>
                    <v-textarea
                      v-model="newNote"
                      label="Yeni Not Ekle"
                      variant="outlined"
                      rows="3"
                      placeholder="Notunuzu buraya yazın..."
                      class="mb-2"
                    />
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      @click="addNote"
                      :loading="addingNote"
                      :disabled="!newNote.trim()"
                    >
                      Not Ekle
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- İşlemler -->
            <v-row>
              <v-col cols="12">
                <v-card variant="outlined">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-cog" class="mr-2" />
                    İşlemler
                  </v-card-title>
                  <v-card-text>
                    <div class="d-flex flex-wrap gap-2">
                      <!-- Çıkış İşlemi (Checkout) -->
                      <v-btn
                        v-if="reservation.type === 'rentacar' && !reservation.checkIn && reservation.status !== 'cancelled'"
                        color="success"
                        prepend-icon="mdi-car-key"
                        @click="processCheckout"
                        :loading="processingCheckout"
                      >
                        Araç Çıkışı Yap
                      </v-btn>

                      <!-- Dönüş İşlemi (Checkin) -->
                      <v-btn
                        v-if="reservation.type === 'rentacar' && reservation.checkIn && !reservation.checkOut && reservation.status !== 'cancelled'"
                        color="info"
                        prepend-icon="mdi-car-check"
                        @click="processCheckin"
                        :loading="processingCheckin"
                      >
                        Araç Dönüşü Yap
                      </v-btn>

                      <!-- Onay Maili Gönder -->
                      <v-btn
                        v-if="reservation.status !== 'cancelled' && reservation.customerEmail"
                        color="primary"
                        prepend-icon="mdi-email"
                        @click="sendConfirmationEmail"
                        :loading="sendingEmail"
                      >
                        Onay Maili Gönder
                      </v-btn>

                      <!-- İptal Et -->
                      <v-btn
                        v-if="reservation.status !== 'cancelled' && reservation.status !== 'completed'"
                        color="error"
                        prepend-icon="mdi-cancel"
                        @click="showCancelDialog = true"
                      >
                        Rezervasyonu İptal Et
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- İptal Dialog -->
    <v-dialog v-model="showCancelDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon icon="mdi-alert" class="mr-2" />
          Rezervasyon İptali
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">Bu rezervasyonu iptal etmek istediğinizden emin misiniz?</p>
          <v-textarea
            v-model="cancelReason"
            label="İptal Nedeni (Opsiyonel)"
            variant="outlined"
            rows="3"
            placeholder="İptal nedenini buraya yazın..."
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCancelDialog = false">Vazgeç</v-btn>
          <v-btn color="error" @click="cancelReservation" :loading="cancelling">
            İptal Et
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../modules/http';

interface Reservation {
  id: string;
  reference: string;
  type: 'tour' | 'rentacar';
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerLanguage?: {
    id: string;
    name: string;
    code: string;
  };
  checkIn?: string | null;
  checkOut?: string | null;
  metadata?: Record<string, unknown>;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

const route = useRoute();
const router = useRouter();

const reservation = ref<Reservation | null>(null);
const loading = ref(false);
const addingNote = ref(false);
const processingCheckout = ref(false);
const processingCheckin = ref(false);
const sendingEmail = ref(false);
const cancelling = ref(false);
const newNote = ref('');
const showCancelDialog = ref(false);
const cancelReason = ref('');
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

onMounted(() => {
  loadReservation();
});

const loadReservation = async () => {
  const id = route.params.id as string;
  if (!id) {
    showSnackbar('Rezervasyon ID bulunamadı', 'error');
    return;
  }

  loading.value = true;
  try {
    const { data } = await http.get<Reservation>(`/reservations/${id}`);
    reservation.value = data;
  } catch (error: any) {
    console.error('Failed to load reservation:', error);
    showSnackbar(error.response?.data?.message || 'Rezervasyon yüklenirken bir hata oluştu', 'error');
  } finally {
    loading.value = false;
  }
};

const addNote = async () => {
  if (!reservation.value || !newNote.value.trim()) return;

  addingNote.value = true;
  try {
    const { data } = await http.post(`/reservations/${reservation.value.id}/notes`, {
      note: newNote.value.trim(),
    });
    reservation.value = data;
    newNote.value = '';
    showSnackbar('Not başarıyla eklendi', 'success');
  } catch (error: any) {
    console.error('Failed to add note:', error);
    showSnackbar(error.response?.data?.message || 'Not eklenirken bir hata oluştu', 'error');
  } finally {
    addingNote.value = false;
  }
};

const processCheckout = async () => {
  if (!reservation.value) return;

  if (!confirm('Araç çıkış işlemini yapmak istediğinizden emin misiniz?')) {
    return;
  }

  processingCheckout.value = true;
  try {
    const { data } = await http.post(`/reservations/${reservation.value.id}/checkout`);
    reservation.value = data;
    showSnackbar('Araç çıkış işlemi başarıyla yapıldı', 'success');
  } catch (error: any) {
    console.error('Failed to process checkout:', error);
    showSnackbar(error.response?.data?.message || 'Çıkış işlemi sırasında bir hata oluştu', 'error');
  } finally {
    processingCheckout.value = false;
  }
};

const processCheckin = async () => {
  if (!reservation.value) return;

  if (!confirm('Araç dönüş işlemini yapmak istediğinizden emin misiniz?')) {
    return;
  }

  processingCheckin.value = true;
  try {
    const { data } = await http.post(`/reservations/${reservation.value.id}/checkin`);
    reservation.value = data;
    showSnackbar('Araç dönüş işlemi başarıyla yapıldı', 'success');
  } catch (error: any) {
    console.error('Failed to process checkin:', error);
    showSnackbar(error.response?.data?.message || 'Dönüş işlemi sırasında bir hata oluştu', 'error');
  } finally {
    processingCheckin.value = false;
  }
};

const sendConfirmationEmail = async () => {
  if (!reservation.value) return;

  sendingEmail.value = true;
  try {
    await http.post(`/reservations/${reservation.value.id}/send-confirmation-email`);
    showSnackbar('Onay maili başarıyla gönderildi', 'success');
  } catch (error: any) {
    console.error('Failed to send confirmation email:', error);
    showSnackbar(error.response?.data?.message || 'Mail gönderilirken bir hata oluştu', 'error');
  } finally {
    sendingEmail.value = false;
  }
};

const cancelReservation = async () => {
  if (!reservation.value) return;

  cancelling.value = true;
  try {
    const { data } = await http.post(`/reservations/${reservation.value.id}/cancel`, {
      reason: cancelReason.value.trim() || undefined,
    });
    reservation.value = data;
    showCancelDialog.value = false;
    cancelReason.value = '';
    showSnackbar('Rezervasyon başarıyla iptal edildi', 'success');
  } catch (error: any) {
    console.error('Failed to cancel reservation:', error);
    showSnackbar(error.response?.data?.message || 'İptal işlemi sırasında bir hata oluştu', 'error');
  } finally {
    cancelling.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'reservations' });
};

const showSnackbar = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

const formatDateTime = (date?: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (price: number, currency: string = 'TRY'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
  }).format(price || 0);
};

const getStatusColor = (status?: string): string => {
  const colors: Record<string, string> = {
    pending: 'orange',
    confirmed: 'success',
    rejected: 'error',
    cancelled: 'error',
    completed: 'info',
  };
  return colors[status || ''] || 'grey';
};

const getStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    rejected: 'Reddedildi',
    cancelled: 'İptal Edildi',
    completed: 'Tamamlandı',
  };
  return labels[status || ''] || status || '-';
};

const getReservationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    tour: 'Tur',
    rentacar: 'Rent A Car',
  };
  return labels[type] || type;
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    credit_card: 'Kredi Kartı',
    cash: 'Nakit',
    bank_transfer: 'Banka Havalesi',
    other: 'Diğer',
  };
  return labels[method] || method;
};
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}
</style>

