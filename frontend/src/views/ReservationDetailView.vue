<template>
  <div class="reservation-detail-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Yükleniyor...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!reservation" class="error-container">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>Rezervasyon bulunamadı</p>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- 1. STICKY TOP HEADER -->
      <header class="sticky-header">
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Rezervasyonlar</span>
          </button>
          <div class="header-info">
            <h1 class="reservation-code">{{ reservation.reference }}</h1>
            <span class="created-date">{{ formatDate(reservation.createdAt) }}</span>
          </div>
        </div>
        <div class="header-center">
          <div class="status-chips">
            <span :class="['status-chip', `chip-${getPaymentStatus()}`]">
              {{ getPaymentStatusLabel() }}
            </span>
            <span :class="['status-chip', `chip-${reservation.status}`]">
              {{ getStatusLabel(reservation.status) }}
            </span>
            <span v-if="reservation.type === 'rentacar'" class="status-chip chip-vehicle">
              Araç
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="editReservation" :disabled="isReadOnly || isCancelled || hasCheckout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Düzenle
          </button>
          <button class="action-btn" @click="exportPDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PDF İndir
          </button>
          <div class="send-menu">
            <button class="action-btn" @click="showSendMenu = !showSendMenu" :disabled="isReadOnly || isCancelled">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Gönder
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div v-if="showSendMenu" class="dropdown-menu send-dropdown">
              <button 
                v-if="reservation?.status === 'pending'" 
                @click="sendConfirmationEmail"
                :disabled="sendingEmail"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Onay Maili Gönder
              </button>
              <button 
                v-if="reservation?.status === 'confirmed' || reservation?.status === 'pending'" 
                @click="sendCancellationEmail"
                :disabled="sendingEmail"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                İptal Maili Gönder
              </button>
            </div>
          </div>
          <div class="more-menu">
            <button class="action-btn" @click="showMoreMenu = !showMoreMenu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            <div v-if="showMoreMenu" class="dropdown-menu">
              <button @click="cancelReservation">Rezervasyonu İptal Et</button>
              <button @click="duplicateReservation">Kopyala</button>
              <button @click="archiveReservation">Arşivle</button>
            </div>
          </div>
        </div>
      </header>

      <!-- 2. MAIN GRID (3 Columns) -->
      <div class="main-grid">
        <!-- LEFT COLUMN - OPERATIONS -->
        <aside class="left-column">
          <!-- A) Timeline Card -->
          <div class="card">
            <h3 class="card-title">Zaman Çizelgesi</h3>
            <div class="timeline">
              <div v-for="(event, index) in timelineEvents" :key="index" class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-time">{{ formatTime(event.time) }}</div>
                  <div class="timeline-text">{{ event.text }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- B) Pickup / Return Summary -->
          <div class="card">
            <h3 class="card-title">Alış & İade</h3>
            <div class="summary-section">
              <div class="summary-item">
                <span class="summary-label">Alış</span>
                <div class="summary-value">
                  <div>{{ formatDateTime(reservation.checkIn) }}</div>
                  <div class="summary-meta">{{ getPickupLocation() }}</div>
                </div>
              </div>
              <div class="summary-item">
                <span class="summary-label">İade</span>
                <div class="summary-value">
                  <div>{{ formatDateTime(reservation.checkOut) }}</div>
                  <div class="summary-meta">{{ getReturnLocation() }}</div>
                </div>
              </div>
              <div v-if="assignedStaff" class="summary-item">
                <span class="summary-label">Personel</span>
                <div class="summary-value">{{ assignedStaff }}</div>
              </div>
            </div>
          </div>

          <!-- C) Pickup / Return Control (Tabs) -->
          <div class="card">
            <div class="tabs">
              <button 
                :class="['tab', { active: activeTab === 'pickup' }]"
                @click="activeTab = 'pickup'"
              >
                Alış
              </button>
              <button 
                :class="['tab', { active: activeTab === 'return' }]"
                @click="activeTab = 'return'"
              >
                İade
              </button>
            </div>

            <!-- Pickup Tab -->
            <div v-if="activeTab === 'pickup'" class="tab-content">
              <div class="form-group">
                <label>KM <span class="required">*</span></label>
                <input 
                  v-model.number="pickupData.odometerKm" 
                  type="number" 
                  class="input"
                  placeholder="Kilometre girin"
                  :disabled="!canEditPickup && !(!isCancelled && !hasCheckout)"
                />
              </div>
              <div class="form-group">
                <label>Yakıt Seviyesi <span class="required">*</span></label>
                <select 
                  v-model="pickupData.fuelLevel" 
                  class="input"
                  :disabled="!canEditPickup && !(!isCancelled && !hasCheckout)"
                >
                  <option value="">Yakıt seviyesi seçin</option>
                  <option value="full">Dolu</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="empty">Boş</option>
                </select>
              </div>
              <div class="form-group">
                <label>Photos (8 required) <span class="required">*</span></label>
                <div class="photo-grid">
                  <div 
                    v-for="(photo, index) in pickupData.photos" 
                    :key="index"
                    class="photo-slot"
                    :class="{ 'disabled': !canEditPickup && !(!isCancelled && !hasCheckout) }"
                    @click="canEditPickup || (!isCancelled && !hasCheckout) ? uploadPhoto('pickup', index) : null"
                  >
                    <img v-if="photo" :src="photo" alt="" />
                    <div v-else class="photo-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>{{ index + 1 }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Video (İsteğe Bağlı)</label>
                <div 
                  class="video-upload" 
                  :class="{ 'disabled': !canEditPickup && !(!isCancelled && !hasCheckout) }"
                  @click="canEditPickup || (!isCancelled && !hasCheckout) ? uploadVideo('pickup') : null"
                >
                  <svg v-if="!pickupData.video" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <span v-else>Video yüklendi</span>
                </div>
              </div>
              <div class="form-group">
                <label>Hasar Notları</label>
                <textarea 
                  v-model="pickupData.damageNotes" 
                  class="textarea"
                  rows="3"
                  placeholder="Mevcut hasarları not edin..."
                  :disabled="!canEditPickup && !(!isCancelled && !hasCheckout)"
                />
              </div>
              <!-- Plaka uyarısı -->
              <div v-if="!hasPlate" class="warning-banner" style="margin-bottom: 16px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Plaka atanmamış rezervasyon çıkış yapılamaz. Önce rezervasyona plaka atayın.
              </div>
              <button 
                class="btn-primary"
                :disabled="!canSavePickup || (!canEditPickup && !(!isCancelled && !hasCheckout))"
                @click="savePickup"
              >
                Alışı Kaydet
              </button>
            </div>

            <!-- Return Tab -->
            <div v-if="activeTab === 'return'" class="tab-content">
              <!-- Pickup uyarısı -->
              <div v-if="!hasPickupCompleted" class="warning-banner" style="margin-bottom: 16px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Çıkış yapılamayan rezervasyon dönüş yapılamaz. Önce alış işlemini tamamlayın.
              </div>
              <!-- Warnings -->
              <div v-if="returnWarnings.length > 0" class="warnings">
                <div 
                  v-for="(warning, index) in returnWarnings" 
                  :key="index"
                  class="warning-banner"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  {{ warning }}
                </div>
              </div>

              <div class="form-group">
                <label>KM <span class="required">*</span></label>
                <input 
                  v-model.number="returnData.odometerKm" 
                  type="number" 
                  class="input"
                  placeholder="Kilometre girin"
                  :disabled="isReadOnly || isCancelled || hasCheckout"
                />
              </div>
              <div class="form-group">
                <label>Fuel Level <span class="required">*</span></label>
                <select 
                  v-model="returnData.fuelLevel" 
                  class="input"
                  :disabled="isReadOnly || isCancelled || hasCheckout"
                >
                  <option value="">Yakıt seviyesi seçin</option>
                  <option value="full">Dolu</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="empty">Boş</option>
                </select>
              </div>
              <div class="form-group">
                <label>Photos (8 required) <span class="required">*</span></label>
                <div class="photo-grid">
                  <div 
                    v-for="(photo, index) in returnData.photos" 
                    :key="index"
                    class="photo-slot"
                    :class="{ 'disabled': isReadOnly || isCancelled || hasCheckout }"
                    @click="!(isReadOnly || isCancelled || hasCheckout) ? uploadPhoto('return', index) : null"
                  >
                    <img v-if="photo" :src="photo" alt="" />
                    <div v-else class="photo-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>{{ index + 1 }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Hasar Karşılaştırması</label>
                <div class="damage-comparison">
                  <div class="comparison-before">
                    <span>Önce</span>
                    <img v-if="damageComparison.before" :src="damageComparison.before" alt="" />
                  </div>
                  <div class="comparison-after">
                    <span>Sonra</span>
                    <img v-if="damageComparison.after" :src="damageComparison.after" alt="" />
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Ekstra Ücretler</label>
                <button class="btn-secondary" @click="addExtraCharge">Ekstra Ücret Ekle</button>
              </div>
              <button 
                class="btn-primary"
                :disabled="!canSaveReturn || isReadOnly || isCancelled || hasCheckout || !hasPickupCompleted"
                @click="saveReturn"
              >
                İadeyi Tamamla
              </button>
            </div>
          </div>
        </aside>

        <!-- CENTER COLUMN - RESERVATION DETAILS -->
        <main class="center-column">
          <!-- D) Customer Card -->
          <div class="card">
            <h3 class="card-title">Müşteri</h3>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Ad</span>
                <span class="info-value">{{ reservation.customerName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Telefon</span>
                <a :href="`tel:${reservation.customerPhone}`" class="info-value link">
                  {{ reservation.customerPhone || '-' }}
                </a>
              </div>
              <div class="info-item">
                <span class="info-label">E-posta</span>
                <a :href="`mailto:${reservation.customerEmail}`" class="info-value link">
                  {{ reservation.customerEmail }}
                </a>
              </div>
              <div class="info-item">
                <span class="info-label">Ülke / Dil</span>
                <span class="info-value">
                  {{ getCountry() }} / {{ getLanguage() }}
                </span>
              </div>
            </div>
          </div>

          <!-- E) Reservation Details Card -->
          <div class="card">
            <h3 class="card-title">Rezervasyon Detayları</h3>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Ürün Tipi</span>
                <span class="info-value">{{ getReservationTypeLabel(reservation.type) }}</span>
              </div>
              <div v-if="reservation.type === 'rentacar'" class="info-item">
                <span class="info-label">Araç</span>
                <span class="info-value">{{ getVehicleName() }}</span>
              </div>
              <div v-if="reservation.type === 'rentacar'" class="info-item">
                <span class="info-label">Plaka</span>
                <span class="info-value">{{ getPlateNumber() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Süre</span>
                <span class="info-value">{{ getRentalDuration() }}</span>
              </div>
              <div v-if="getExtraServices().length > 0" class="info-item">
                <span class="info-label">Ekstra Hizmetler</span>
                <div class="info-value">
                  <span v-for="(service, index) in getExtraServices()" :key="index" class="service-tag">
                    {{ service }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- F) Documents -->
          <div class="card">
            <h3 class="card-title">Belgeler</h3>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Ehliyet</span>
                <span :class="['doc-status', getDocStatus('license')]">
                  {{ getDocStatusLabel('license') }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Pasaport</span>
                <span :class="['doc-status', getDocStatus('passport')]">
                  {{ getDocStatusLabel('passport') }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Doğrulama</span>
                <span :class="['doc-status', getDocStatus('verification')]">
                  {{ getDocStatusLabel('verification') }}
                </span>
              </div>
            </div>
          </div>

          <!-- G) Notes -->
          <div class="card">
            <h3 class="card-title">Notlar</h3>
            <div class="notes-section">
              <div class="note-group">
                <label>İç Admin Notu</label>
                <textarea 
                  v-model="internalNote" 
                  class="textarea"
                  rows="3"
                  placeholder="İç not ekle..."
                  :disabled="!canEditNotes"
                  @blur="saveNote('internal')"
                />
              </div>
              <div class="note-group">
                <label>Müşteri Notu</label>
                <textarea 
                  v-model="customerNote" 
                  class="textarea"
                  rows="3"
                  placeholder="Müşteri notu ekle..."
                  :disabled="!canEditNotes"
                  @blur="saveNote('customer')"
                />
              </div>
            </div>
          </div>
        </main>

        <!-- RIGHT SIDEBAR - FINANCIAL -->
        <aside class="right-sidebar">
          <!-- H) Price Summary Card -->
          <div class="card">
            <h3 class="card-title">Fiyat Özeti</h3>
            <div class="price-breakdown">
              <div class="price-row">
                <span>Temel Fiyat</span>
                <span>{{ formatPrice(getBasePrice()) }}</span>
              </div>
              <div class="price-row">
                <span>Ekstralar</span>
                <span>{{ formatPrice(getExtrasPrice()) }}</span>
              </div>
              <div class="price-row">
                <span>İndirim</span>
                <span class="discount">-{{ formatPrice(getDiscount()) }}</span>
              </div>
              <div class="price-row">
                <span>Vergi</span>
                <span>{{ formatPrice(getTax()) }}</span>
              </div>
              <div class="price-divider"></div>
              <div class="price-row total">
                <span>Toplam</span>
                <span>{{ formatPrice(getTotalPrice()) }}</span>
              </div>
              <div class="price-row payment">
                <span>Ödenen</span>
                <span>{{ formatPrice(getPaidAmount()) }}</span>
              </div>
              <div class="price-row payment">
                <span>Kalan</span>
                <span class="remaining">{{ formatPrice(getRemainingAmount()) }}</span>
              </div>
            </div>
          </div>

          <!-- I) Deposit & Extras -->
          <div class="card">
            <h3 class="card-title">Depozito & Ekstralar</h3>
            <div class="deposit-section">
              <div class="deposit-status">
                <span>Depozito Durumu</span>
                <span :class="['status-badge', getDepositStatus()]">
                  {{ getDepositStatusLabel() }}
                </span>
              </div>
              <div v-if="extraCharges.length > 0" class="extra-charges">
                <div v-for="(charge, index) in extraCharges" :key="charge.id || index" class="charge-item">
                  <div class="charge-info">
                    <span class="charge-description">{{ charge.description || charge.name }}</span>
                    <span class="charge-currency">{{ charge.currencyCode || 'TRY' }}</span>
                  </div>
                  <span class="charge-amount">{{ formatPrice(charge.amount || 0) }}</span>
                  <button 
                    v-if="!isCancelled"
                    class="charge-delete"
                    @click="removeExtraCharge(index)"
                    title="Sil"
                  >
                    ×
                  </button>
                </div>
              </div>
              <button 
                v-if="!isReadOnly && !isCancelled"
                class="btn-secondary" 
                @click="addExtraCharge"
              >
                Ekstra Ücret Ekle
              </button>
            </div>
          </div>

          <!-- J) Quick Actions -->
          <div class="card">
            <h3 class="card-title">Hızlı İşlemler</h3>
            <div class="quick-actions">
              <button 
                class="action-link" 
                @click="changeVehicle"
                :disabled="!canChangeVehicle && !(!isCancelled && !hasCheckout)"
              >
                Araç Değiştir
              </button>
              <button 
                class="action-link" 
                @click="changeDate"
                :disabled="isReadOnly || isCancelled"
              >
                Tarih Değiştir
              </button>
              <button 
                class="action-link" 
                @click="changeLocation"
                :disabled="isReadOnly || isCancelled"
              >
                Lokasyon Değiştir
              </button>
              <button 
                class="action-link" 
                @click="updateStatus"
                :disabled="isReadOnly || isCancelled"
              >
                Durum Güncelle
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Hidden file input -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      multiple
      style="display: none"
      @change="handleFileUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../modules/http';
import { useSnackbar } from '../composables/useSnackbar';
import { useAuthStore } from '../stores/auth';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const { showSnackbar } = useSnackbar();

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
const showMoreMenu = ref(false);
const showSendMenu = ref(false);
const sendingEmail = ref(false);
const activeTab = ref<'pickup' | 'return'>('pickup');
const fileInput = ref<HTMLInputElement | null>(null);
const currentUploadContext = ref<{ type: 'pickup' | 'return'; index: number } | null>(null);

// Modal states
const showEditModal = ref(false);
const showVehicleModal = ref(false);
const showDateModal = ref(false);
const showLocationModal = ref(false);
const showStatusModal = ref(false);

const pickupData = ref({
  odometerKm: null as number | null,
  fuelLevel: '',
  photos: Array(8).fill(null) as (string | null)[],
  video: null as string | null,
  damageNotes: '',
});

const returnData = ref({
  odometerKm: null as number | null,
  fuelLevel: '',
  photos: Array(8).fill(null) as (string | null)[],
});

const internalNote = ref('');
const customerNote = ref('');
const extraCharges = ref<Array<{ 
  id?: string;
  name?: string;
  description?: string;
  amount: number;
  currencyCode?: string;
  addedAt?: string;
}>>([]);
const assignedStaff = ref<string | null>(null);
const damageComparison = ref({
  before: null as string | null,
  after: null as string | null,
});

const timelineEvents = computed(() => {
  if (!reservation.value) return [];
  const events = [];
  events.push({ time: reservation.value.createdAt, text: 'Rezervasyon oluşturuldu' });
  if (reservation.value.checkIn) {
    events.push({ time: reservation.value.checkIn, text: 'Araç teslim alındı' });
  }
  if (reservation.value.checkOut) {
    events.push({ time: reservation.value.checkOut, text: 'Araç iade edildi' });
  }
  return events;
});

const returnWarnings = computed(() => {
  const warnings: string[] = [];
  if (pickupData.value.odometerKm && returnData.value.odometerKm) {
    const kmDiff = returnData.value.odometerKm - pickupData.value.odometerKm;
    if (kmDiff > 300) {
      warnings.push(`KM farkı ${kmDiff} km (eşik: 300 km)`);
    }
  }
  if (pickupData.value.fuelLevel && returnData.value.fuelLevel) {
    if (pickupData.value.fuelLevel !== returnData.value.fuelLevel) {
      warnings.push('Yakıt seviyesi uyumsuzluğu tespit edildi');
    }
  }
  return warnings;
});

// Check if reservation has a plate assigned
const hasPlate = computed(() => {
  if (!reservation.value) return false;
  const metadata = reservation.value.metadata as any;
  const plateNumber = metadata?.plateNumber;
  return plateNumber && plateNumber !== '-' && plateNumber.trim() !== '';
});

const canSavePickup = computed(() => {
  // Plaka atanmamış rezervasyon çıkış yapılamaz
  if (!hasPlate.value) return false;
  
  return pickupData.value.odometerKm !== null &&
         pickupData.value.fuelLevel !== '' &&
         pickupData.value.photos.filter(p => p !== null).length === 8;
});

// Check if pickup is completed
const hasPickupCompleted = computed(() => {
  if (!reservation.value) return false;
  // Check if reservation has checkIn (pickup completed)
  return reservation.value.checkIn !== null && reservation.value.checkIn !== undefined;
});

const canSaveReturn = computed(() => {
  // Çıkış yapılamayan rezervasyon dönüş yapılamaz
  if (!hasPickupCompleted.value) return false;
  
  return returnData.value.odometerKm !== null &&
         returnData.value.fuelLevel !== '' &&
         returnData.value.photos.filter(p => p !== null).length === 8;
});

// Check if reservation is cancelled
const isCancelled = computed(() => {
  if (!reservation.value) return false;
  return reservation.value.status === 'cancelled' || reservation.value.status === 'rejected';
});

// Check if checkout is done
const hasCheckout = computed(() => {
  if (!reservation.value) return false;
  return reservation.value.checkOut !== null && reservation.value.checkOut !== undefined;
});

// Check if return is completed
const isReturnCompleted = computed(() => {
  if (!reservation.value) return false;
  return reservation.value.status === 'completed';
});

// Check if reservation is fully read-only (cancelled or completed with checkout and return)
const isReadOnly = computed(() => {
  if (!reservation.value) return false;
  // İptal edilmiş rezervasyonlar tamamen readonly
  if (isCancelled.value) return true;
  // Çıkış ve dönüş yapılmış rezervasyonlarda işlem yapılamaz
  return hasCheckout.value && isReturnCompleted.value;
});

// Check if pickup can be edited (only if checkout is done but not cancelled)
const canEditPickup = computed(() => {
  if (!reservation.value || isCancelled.value) return false;
  return hasCheckout.value && !isReturnCompleted.value;
});

// Check if notes can be edited (only if not cancelled and not fully completed)
const canEditNotes = computed(() => {
  if (!reservation.value || isCancelled.value) return false;
  return !isReturnCompleted.value;
});

// Check if vehicle can be changed (only if checkout is done but not cancelled)
const canChangeVehicle = computed(() => {
  if (!reservation.value || isCancelled.value) return false;
  return hasCheckout.value && !isReturnCompleted.value;
});

onMounted(() => {
  loadReservation();
});

watch(() => route.params.id, () => {
  loadReservation();
});

const loadReservation = async () => {
  const id = route.params.id as string;
  if (!id) return;

  loading.value = true;
  try {
    const { data } = await http.get<Reservation>(`/reservations/${id}`);
    reservation.value = data;
    internalNote.value = data.notes || '';
    
    // Load extra charges from metadata
    const metadata = data.metadata as any;
    if (metadata?.extraCharges && Array.isArray(metadata.extraCharges)) {
      extraCharges.value = metadata.extraCharges;
    } else {
      extraCharges.value = [];
    }
    
    // Load pickup/return data if available
    if (data.type === 'rentacar') {
      await loadOperationsData(id);
    }
  } catch (error: any) {
    console.error('Failed to load reservation:', error);
  } finally {
    loading.value = false;
  }
};

const loadOperationsData = async (reservationId: string) => {
  try {
    // Load pickup data
    const pickupResponse = await http.get(`/rentacar/operations/pickup/${reservationId}`);
    if (pickupResponse.data) {
      pickupData.value.odometerKm = pickupResponse.data.odometerKm;
      pickupData.value.fuelLevel = pickupResponse.data.fuelLevel || '';
      // Load photos if available
    }
    
    // Load return data
    const returnResponse = await http.get(`/rentacar/operations/return/${reservationId}`);
    if (returnResponse.data) {
      returnData.value.odometerKm = returnResponse.data.odometerKm;
      returnData.value.fuelLevel = returnResponse.data.fuelLevel || '';
    }
    
    // Load damage comparison
    const damageResponse = await http.get(`/rentacar/operations/damage-compare/${reservationId}`);
    if (damageResponse.data) {
      damageComparison.value = {
        before: damageResponse.data.pickupPhotos?.[0]?.url || null,
        after: damageResponse.data.returnPhotos?.[0]?.url || null,
      };
    }
  } catch (error) {
    // Operations data might not exist yet
    console.log('Operations data not available');
  }
};

const uploadPhoto = (type: 'pickup' | 'return', index: number) => {
  currentUploadContext.value = { type, index };
  fileInput.value?.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || !currentUploadContext.value) return;

  const file = files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target?.result as string;
    if (currentUploadContext.value?.type === 'pickup') {
      pickupData.value.photos[currentUploadContext.value.index] = url;
    } else {
      returnData.value.photos[currentUploadContext.value.index] = url;
    }
  };
  reader.readAsDataURL(file);
  
  // Reset input
  target.value = '';
};

const uploadVideo = (type: 'pickup' | 'return') => {
  // Similar to photo upload
};

const savePickup = async () => {
  if (!reservation.value || !canSavePickup.value) return;
  
  try {
    // Fotoğrafları backend formatına çevir (slotIndex ile)
    const photos = pickupData.value.photos
      .map((photo, index) => photo ? { slotIndex: index, mediaUrl: photo } : null)
      .filter((p): p is { slotIndex: number; mediaUrl: string } => p !== null);
    
    await http.post(`/rentacar/operations/pickup/${reservation.value.id}/complete`, {
      odometerKm: pickupData.value.odometerKm,
      fuelLevel: pickupData.value.fuelLevel,
      photos,
      damageNotes: pickupData.value.damageNotes,
    });
    
    // Sözleşme oluştur ve PDF yazdır
    try {
      const metadata = reservation.value.metadata as any;
      const vehicleId = metadata?.vehicleId;
      
      if (vehicleId) {
        // Önce mevcut sözleşmeyi kontrol et
        let contractId: string | null = null;
        try {
          const contractsRes = await http.get('/rentacar/contracts');
          const contracts = contractsRes.data?.data || contractsRes.data || [];
          const existingContract = contracts.find((c: any) => c.reservationId === reservation.value.id);
          if (existingContract) {
            contractId = existingContract.id;
          }
        } catch (e) {
          console.warn('Could not fetch existing contracts:', e);
        }
        
        // Sözleşme yoksa oluştur
        if (!contractId) {
          // Varsayılan template'i al
          const templatesRes = await http.get('/rentacar/contracts/templates');
          const templates = templatesRes.data?.data || templatesRes.data || [];
          const defaultTemplate = templates.find((t: any) => t.isDefault) || templates[0];
          
          if (defaultTemplate) {
            const createRes = await http.post('/rentacar/contracts', {
              reservationId: reservation.value.id,
              vehicleId: vehicleId,
              templateId: defaultTemplate.id,
            });
            contractId = createRes.data?.data?.id || createRes.data?.id;
          }
        }
        
        // PDF oluştur ve yazdır
        if (contractId) {
          const pdfRes = await http.post(`/rentacar/contracts/${contractId}/generate-pdf`);
          const pdfUrl = pdfRes.data?.data?.pdfUrl || pdfRes.data?.pdfUrl;
          
          if (pdfUrl) {
            // PDF'i yeni tab'da aç
            window.open(pdfUrl, '_blank');
          } else {
            // PDF URL yoksa endpoint'den direkt aç
            const pdfEndpoint = `/rentacar/contracts/${contractId}/pdf`;
            window.open(pdfEndpoint, '_blank');
          }
        }
      }
    } catch (contractError: any) {
      console.error('Failed to generate contract:', contractError);
      // Sözleşme hatası alış kaydını engellemez, sadece log'la
    }
    
    showSnackbar('Alış işlemi başarıyla kaydedildi. Sözleşme yazdırılıyor...', 'success');
    
    // Rezervasyonu yeniden yükle
    await loadReservation();
  } catch (error: any) {
    console.error('Failed to save pickup:', error);
    showSnackbar(`Alış işlemi kaydedilemedi: ${error.response?.data?.message || error.message}`, 'error');
  }
};

const saveReturn = async () => {
  if (!reservation.value || !canSaveReturn.value) return;
  
  try {
    // Fotoğrafları backend formatına çevir (slotIndex ile)
    const photos = returnData.value.photos
      .map((photo, index) => photo ? { slotIndex: index, mediaUrl: photo } : null)
      .filter((p): p is { slotIndex: number; mediaUrl: string } => p !== null);
    
    // Uyarıları kontrol et ve kullanıcıdan onay al
    if (returnWarnings.value.length > 0) {
      const warningText = returnWarnings.value.join('\n');
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Uyarılar',
        html: `<div style="text-align: left;">${warningText.split('\n').map(w => `<p>${w}</p>`).join('')}</div>`,
        showCancelButton: true,
        confirmButtonText: 'Devam Et',
        cancelButtonText: 'İptal',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }
    
    await http.post(`/rentacar/operations/return/${reservation.value.id}/complete`, {
      odometerKm: returnData.value.odometerKm,
      fuelLevel: returnData.value.fuelLevel,
      photos,
    });
    
    // Hasar tespit analizini çalıştır
    try {
      const metadata = reservation.value.metadata as any;
      const vehicleId = metadata?.vehicleId;
      
      if (vehicleId) {
        // Hasar tespit analizini başlat
        const detectionRes = await http.post(
          `/rentacar/vehicles/${vehicleId}/reservations/${reservation.value.id}/damage-detection`
        );
        
        const detection = detectionRes.data?.data || detectionRes.data;
        
        if (detection) {
          // Raporu hasar notu olarak kaydet
          const reportLines: string[] = [];
          reportLines.push('=== HASAR TESPİT RAPORU ===');
          reportLines.push(`Tespit Tarihi: ${new Date().toLocaleString('tr-TR')}`);
          reportLines.push(`Hasar Olasılığı: %${detection.damageProbability || 0}`);
          reportLines.push(`Güven Skoru: %${detection.confidenceScore || 0}`);
          reportLines.push(`Durum: ${detection.status || 'Beklemede'}`);
          
          if (detection.damagedAreas && detection.damagedAreas.length > 0) {
            reportLines.push('\nTespit Edilen Hasar Bölgeleri:');
            detection.damagedAreas.forEach((area: any, index: number) => {
              reportLines.push(`${index + 1}. Bölge:`);
              reportLines.push(`   - Tip: ${area.type || 'Belirtilmemiş'}`);
              reportLines.push(`   - Güven: %${area.confidence || 0}`);
              reportLines.push(`   - Konum: X=${(area.x * 100).toFixed(1)}%, Y=${(area.y * 100).toFixed(1)}%`);
            });
          }
          
          if (detection.processingMetadata) {
            reportLines.push('\nİşleme Detayları:');
            if (detection.processingMetadata.pixelDifference !== undefined) {
              reportLines.push(`   - Piksel Farkı: %${detection.processingMetadata.pixelDifference.toFixed(2)}`);
            }
            if (detection.processingMetadata.edgeDifference !== undefined) {
              reportLines.push(`   - Kenar Farkı: ${detection.processingMetadata.edgeDifference.toFixed(2)}`);
            }
            if (detection.processingMetadata.processingTime !== undefined) {
              reportLines.push(`   - İşlem Süresi: ${detection.processingMetadata.processingTime}ms`);
            }
          }
          
          reportLines.push('\nNOT: Bu rapor otomatik olarak oluşturulmuştur. İnsan doğrulaması gereklidir.');
          
          const reportText = reportLines.join('\n');
          
          // Hasar notunu güncelle (pickupData.damageNotes'a ekle veya metadata'ya kaydet)
          const currentDamageNotes = pickupData.value.damageNotes || '';
          const updatedDamageNotes = currentDamageNotes 
            ? `${currentDamageNotes}\n\n${reportText}`
            : reportText;
          
          // Metadata'ya hasar raporunu kaydet
          const updatedMetadata = {
            ...metadata,
            damageDetectionReport: {
              detectionId: detection.id,
              damageProbability: detection.damageProbability,
              confidenceScore: detection.confidenceScore,
              status: detection.status,
              reportText,
              generatedAt: new Date().toISOString(),
            },
          };
          
          await http.put(`/reservations/${reservation.value.id}`, {
            metadata: updatedMetadata,
          });
          
          // Hasar notunu da pickupData'ya kaydet
          pickupData.value.damageNotes = updatedDamageNotes;
        }
      }
    } catch (detectionError: any) {
      console.error('Failed to run damage detection:', detectionError);
      // Hasar tespit hatası iade kaydını engellemez, sadece log'la
    }
    
    showSnackbar('İade işlemi başarıyla kaydedildi. Hasar tespit analizi tamamlandı.', 'success');
    
    // Rezervasyonu yeniden yükle
    await loadReservation();
  } catch (error: any) {
    console.error('Failed to save return:', error);
    showSnackbar(`İade işlemi kaydedilemedi: ${error.response?.data?.message || error.message}`, 'error');
  }
};

const saveNote = async (type: 'internal' | 'customer') => {
  if (!reservation.value) return;
  const note = type === 'internal' ? internalNote.value : customerNote.value;
  
  try {
    await http.post(`/reservations/${reservation.value.id}/notes`, { note });
    // Sessizce kaydet, kullanıcıya bildirim gösterme (blur event'inde)
  } catch (error: any) {
    console.error('Failed to save note:', error);
    showSnackbar(`Not kaydedilemedi: ${error.response?.data?.message || error.message}`, 'error');
  }
};

const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return symbols[code] || code;
};

const addExtraCharge = async () => {
  // Rezervasyon onaylanmış durumda iken ekstra ürün eklenebilmelidir
  // Sadece iptal edilmiş rezervasyonlarda ekstra ücret eklenemez
  if (!reservation.value || isCancelled.value) return;
  
  const metadata = reservation.value.metadata as any;
  const currencyCode = metadata?.currencyCode || 'TRY';
  
  const { value: formValues } = await Swal.fire({
    title: '<span style="font-size: 20px; font-weight: 600; color: #111827;">Ekstra Ücret Ekle</span>',
    html: `
      <div style="text-align: left; margin: 20px 0;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Açıklama:</label>
        <input id="description" class="swal2-input" placeholder="Ekstra ücret açıklaması" style="width: 100%; margin-bottom: 20px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Ücret (${currencyCode}):</label>
        <input id="amount" type="number" step="0.01" min="0" class="swal2-input" placeholder="0.00" style="width: 100%;">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Ekle',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    buttonsStyling: true,
    customClass: {
      popup: 'swal-popup-minimal',
      title: 'swal-title-minimal',
      htmlContainer: 'swal-html-minimal',
      input: 'swal-input-minimal',
      confirmButton: 'swal-confirm-minimal',
      cancelButton: 'swal-cancel-minimal',
    },
    preConfirm: () => {
      const description = (document.getElementById('description') as HTMLInputElement)?.value?.trim();
      const amount = parseFloat((document.getElementById('amount') as HTMLInputElement)?.value || '0');
      
      if (!description) {
        Swal.showValidationMessage('Lütfen açıklama girin');
        return false;
      }
      if (amount <= 0) {
        Swal.showValidationMessage('Ücret 0\'dan büyük olmalıdır');
        return false;
      }
      return { description, amount, currencyCode };
    },
  });
  
  if (formValues) {
    try {
      // Yeni ekstra ücreti ekle
      const newCharge = {
        id: Date.now().toString(),
        description: formValues.description,
        amount: formValues.amount,
        currencyCode: formValues.currencyCode,
        addedAt: new Date().toISOString(),
      };
      
      extraCharges.value.push(newCharge);
      
      // Metadata'yı güncelle
      const updatedMetadata = {
        ...metadata,
        extraCharges: extraCharges.value,
      };
      
      // Toplam ekstra ücretleri hesapla
      const totalExtraCharges = extraCharges.value.reduce((sum, charge) => {
        // Sadece aynı currency'deki ücretleri topla
        if (charge.currencyCode === currencyCode) {
          return sum + (charge.amount || 0);
        }
        return sum;
      }, 0);
      
      // Extras price'ı güncelle (sadece aynı currency için)
      const currentExtrasPrice = metadata?.extrasPrice || 0;
      updatedMetadata.extrasPrice = currentExtrasPrice + formValues.amount;
      
      // Total price'ı güncelle
      const currentTotalPrice = metadata?.totalPrice || 0;
      updatedMetadata.totalPrice = currentTotalPrice + formValues.amount;
      
      // Backend'e kaydet
      await http.put(`/reservations/${reservation.value.id}`, {
        metadata: updatedMetadata,
        recalculatePrice: false, // Manuel eklediğimiz için recalculate yapma
      });
      
      showSnackbar('Ekstra ücret başarıyla eklendi', 'success');
      
      // Rezervasyonu yeniden yükle
      await loadReservation();
    } catch (error: any) {
      console.error('Failed to add extra charge:', error);
      showSnackbar(`Ekstra ücret eklenemedi: ${error.response?.data?.message || error.message}`, 'error');
    }
  }
};

const removeExtraCharge = async (index: number) => {
  // Rezervasyon onaylanmış durumda iken ekstra ürün silinebilmelidir
  // Sadece iptal edilmiş rezervasyonlarda ekstra ücret silinemez
  if (!reservation.value || isCancelled.value) return;
  
  const charge = extraCharges.value[index];
  if (!charge) return;
  
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Emin misiniz?',
    text: 'Bu ekstra ücreti silmek istediğinize emin misiniz?',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
  });
  
  if (!result.isConfirmed) return;
  
  try {
    // Ekstra ücreti listeden çıkar
    const removedCharge = extraCharges.value.splice(index, 1)[0];
    
    // Metadata'yı güncelle
    const metadata = reservation.value.metadata as any;
    const updatedMetadata = {
      ...metadata,
      extraCharges: extraCharges.value,
    };
    
    // Extras price ve total price'ı güncelle
    const removedAmount = removedCharge.amount || 0;
    const currentExtrasPrice = metadata?.extrasPrice || 0;
    updatedMetadata.extrasPrice = Math.max(0, currentExtrasPrice - removedAmount);
    
    const currentTotalPrice = metadata?.totalPrice || 0;
    updatedMetadata.totalPrice = Math.max(0, currentTotalPrice - removedAmount);
    
    // Backend'e kaydet
    await http.put(`/reservations/${reservation.value.id}`, {
      metadata: updatedMetadata,
      recalculatePrice: false,
    });
    
    await Swal.fire({
      icon: 'success',
      title: 'Başarılı',
      text: 'Ekstra ücret başarıyla silindi',
      confirmButtonText: 'Tamam',
      confirmButtonColor: '#2563eb',
    });
    
    // Rezervasyonu yeniden yükle
    await loadReservation();
  } catch (error: any) {
    console.error('Failed to remove extra charge:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Hata',
      text: `Ekstra ücret silinemedi: ${error.response?.data?.message || error.message}`,
      confirmButtonText: 'Tamam',
      confirmButtonColor: '#dc2626',
    });
  }
};

// Helper functions
const goBack = () => router.push({ name: 'reservations' });
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (date: string) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const formatDateTime = (date?: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const formatPrice = (amount: number) => {
  if (!reservation.value) return '₺0';
  const metadata = reservation.value.metadata as any;
  const currencyCode = metadata?.currencyCode || 'TRY';
  const currencySymbol = getCurrencySymbol(currencyCode);
  
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    rejected: 'Reddedildi',
    cancelled: 'İptal Edildi',
    completed: 'Tamamlandı',
  };
  return labels[status || ''] || status || '-';
};

const getPaymentStatus = () => 'paid'; // Implement based on actual payment data
const getPaymentStatusLabel = () => 'Ödendi';
const getReservationTypeLabel = (type: string) => type === 'rentacar' ? 'Araç Kiralama' : 'Transfer';
const getPickupLocation = () => (reservation.value?.metadata as any)?.pickupLocationName || '-';
const getReturnLocation = () => (reservation.value?.metadata as any)?.dropoffLocationName || '-';
const getCountry = () => 'TR'; // Implement based on actual data
const getLanguage = () => reservation.value?.customerLanguage?.name || reservation.value?.customerLanguage?.code || '-';
const getVehicleName = () => (reservation.value?.metadata as any)?.vehicleName || '-';
const getPlateNumber = () => (reservation.value?.metadata as any)?.plateNumber || '-';
const getRentalDuration = () => {
  if (!reservation.value?.checkIn || !reservation.value?.checkOut) return '-';
  const days = Math.ceil((new Date(reservation.value.checkOut).getTime() - new Date(reservation.value.checkIn).getTime()) / (1000 * 60 * 60 * 24));
  return `${days} gün`;
};
const getExtraServices = () => {
  if (!reservation.value) return [];
  const metadata = reservation.value.metadata as any;
  
  // Metadata'dan ekstra ürünleri al (extras array)
  if (metadata?.extras && Array.isArray(metadata.extras)) {
    return metadata.extras.map((extra: any) => {
      if (typeof extra === 'string') return extra;
      return extra.name || extra.title || extra;
    });
  }
  
  return [];
};
const getDocStatus = (doc: string) => 'verified'; // Implement based on actual data
const getDocStatusLabel = (doc: string) => 'Doğrulandı';
const getBasePrice = () => (reservation.value?.metadata as any)?.vehiclePrice || 0;
const getExtrasPrice = () => {
  if (!reservation.value) return 0;
  const metadata = reservation.value.metadata as any;
  const currencyCode = metadata?.currencyCode || 'TRY';
  
  // Metadata'dan extrasPrice'ı al
  const extrasPrice = metadata?.extrasPrice || 0;
  
  // Ekstra ücretleri de ekle (sadece aynı currency için)
  const extraChargesTotal = extraCharges.value.reduce((sum, charge) => {
    if (charge.currencyCode === currencyCode) {
      return sum + (charge.amount || 0);
    }
    return sum;
  }, 0);
  
  return extrasPrice + extraChargesTotal;
};
const getDiscount = () => 0; // Implement based on actual data
const getTax = () => getBasePrice() * 0.2; // 20% tax
const getTotalPrice = () => (reservation.value?.metadata as any)?.totalPrice || 0;
const getPaidAmount = () => 0; // Implement based on actual data
const getRemainingAmount = () => getTotalPrice() - getPaidAmount();
const getDepositStatus = () => 'held';
const getDepositStatusLabel = () => 'Tutuldu';

const editReservation = () => {
  if (isReadOnly.value || isCancelled.value || hasCheckout.value) return;
  showEditModal.value = true;
};

const exportPDF = async () => {
  if (!reservation.value) return;
  
  try {
    // PDF export endpoint'i yoksa, yeni bir tab'da rezervasyon detayını aç
    const url = `/reservations/${reservation.value.id}/pdf`;
    window.open(url, '_blank');
  } catch (error: any) {
    showSnackbar(`PDF indirilemedi: ${error.message}`, 'error');
  }
};

const sendConfirmationEmail = async () => {
  if (!reservation.value || sendingEmail.value) return;
  
  sendingEmail.value = true;
  showSendMenu.value = false;
  
  try {
    await http.post(`/reservations/${reservation.value.id}/send-confirmation-email`);
    showSnackbar('Onay maili başarıyla gönderildi', 'success');
    // Rezervasyonu yeniden yükle
    await loadReservation();
  } catch (error: any) {
    console.error('Failed to send confirmation email:', error);
    showSnackbar(`Onay maili gönderilemedi: ${error.response?.data?.message || error.message}`, 'error');
  } finally {
    sendingEmail.value = false;
  }
};

const sendCancellationEmail = async () => {
  if (!reservation.value || sendingEmail.value) return;
  
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Emin misiniz?',
    text: 'Rezervasyonu iptal etmek istediğinize emin misiniz?',
    showCancelButton: true,
    confirmButtonText: 'Evet, İptal Et',
    cancelButtonText: 'Hayır',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
  });
  
  if (!result.isConfirmed) {
    return;
  }
  
  sendingEmail.value = true;
  showSendMenu.value = false;
  
  try {
    await http.post(`/reservations/${reservation.value.id}/send-cancellation-email`);
    showSnackbar('İptal maili başarıyla gönderildi', 'success');
    // Rezervasyonu yeniden yükle
    await loadReservation();
  } catch (error: any) {
    console.error('Failed to send cancellation email:', error);
    showSnackbar(`İptal maili gönderilemedi: ${error.response?.data?.message || error.message}`, 'error');
  } finally {
    sendingEmail.value = false;
  }
};

const cancelReservation = () => {
  if (isReadOnly.value) return;
  sendCancellationEmail();
};

const duplicateReservation = () => {
  if (isReadOnly.value) return;
  // TODO: Implement duplicate reservation
};

const archiveReservation = () => {
  if (isReadOnly.value) return;
  // TODO: Implement archive reservation
};

const changeVehicle = async () => {
  if ((!canChangeVehicle.value && !(!isCancelled.value && !hasCheckout.value)) || !reservation.value || reservation.value.type !== 'rentacar') return;
  
  // Rezervasyon tarihlerini al
  const checkIn = reservation.value.checkIn;
  const checkOut = reservation.value.checkOut;
  const metadata = reservation.value.metadata as any;
  const pickupLocationId = metadata?.pickupLocationId;
  const dropoffLocationId = metadata?.dropoffLocationId;
  
  if (!checkIn || !checkOut || !pickupLocationId || !dropoffLocationId) {
    showSnackbar('Rezervasyon tarihleri ve lokasyonları eksik. Önce bunları güncelleyin.', 'warning');
    return;
  }
  
  // Tarihleri formatla
  const pickupDate = new Date(checkIn).toISOString().split('T')[0];
  const dropoffDate = new Date(checkOut).toISOString().split('T')[0];
  const pickupTime = new Date(checkIn).toTimeString().slice(0, 5);
  const dropoffTime = new Date(checkOut).toTimeString().slice(0, 5);
  
  const { value: vehiclePlateId } = await Swal.fire({
    title: '<span style="font-size: 20px; font-weight: 600; color: #111827;">Araç Değiştir</span>',
    html: '<p style="color: #6b7280; margin: 8px 0 20px 0;">Müsait plakalardan birini seçin</p>',
    input: 'select',
    inputOptions: async () => {
      try {
        // Müsait araçları getir (searchVehicles endpoint'i availability kontrolü yapar)
        const tenantId = auth.tenant?.id;
        if (!tenantId) {
          return { '': 'Tenant bilgisi bulunamadı' };
        }
        
        const vehiclesRes = await http.get('/rentacar/vehicles/search', {
          params: {
            tenantId,
            pickupLocationId,
            dropoffLocationId,
            pickupDate,
            dropoffDate,
            pickupTime,
            dropoffTime,
          },
        });
        
        const availableVehicles = vehiclesRes.data?.vehicles || [];
        
        if (availableVehicles.length === 0) {
          return { '': 'Müsait araç bulunamadı' };
        }
        
        // Müsait araç ID'lerini topla
        const availableVehicleIds = new Set(availableVehicles.map((v: any) => v.id));
        
        // Tüm plakaları getir
        const platesRes = await http.get('/rentacar/plates');
        const allPlates = platesRes.data || [];
        
        // Sadece müsait araçların plakalarını filtrele
        const availablePlates = allPlates.filter((plate: any) => {
          return availableVehicleIds.has(plate.vehicleId);
        });
        
        if (availablePlates.length === 0) {
          return { '': 'Müsait plaka bulunamadı' };
        }
        
        // Plakaları araç bilgileriyle eşleştir
        const options: Record<string, string> = {};
        availablePlates.forEach((plate: any) => {
          const vehicle = availableVehicles.find((v: any) => v.id === plate.vehicleId);
          if (vehicle) {
            const plateKey = `${plate.vehicleId}_${plate.id}`;
            options[plateKey] = `${vehicle.name} - ${plate.plateNumber || 'Plaka yok'}`;
          }
        });
        
        return options;
      } catch (error: any) {
        console.error('Failed to load available vehicles:', error);
        return { '': 'Araçlar yüklenemedi' };
      }
    },
    showCancelButton: true,
    confirmButtonText: 'Değiştir',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    buttonsStyling: true,
    customClass: {
      popup: 'swal-popup-minimal',
      title: 'swal-title-minimal',
      htmlContainer: 'swal-html-minimal',
      input: 'swal-input-minimal',
      confirmButton: 'swal-confirm-minimal',
      cancelButton: 'swal-cancel-minimal',
    },
    inputValidator: (value) => {
      if (!value || value === '') {
        return 'Lütfen bir plaka seçin';
      }
    },
  });
  
  if (vehiclePlateId && vehiclePlateId !== '') {
    try {
      // vehiclePlateId formatı: "vehicleId_plateId"
      const [selectedVehicleId, selectedPlateId] = vehiclePlateId.includes('_') 
        ? vehiclePlateId.split('_') 
        : [vehiclePlateId, null];
      
      if (!selectedVehicleId) {
        throw new Error('Geçersiz araç seçimi');
      }
      
      const updatedMetadata = {
        ...metadata,
        vehicleId: selectedVehicleId,
        plateId: selectedPlateId || metadata?.plateId,
        recalculatePrice: true,
      };
      
      await http.put(`/reservations/${reservation.value.id}`, {
        metadata: updatedMetadata,
        recalculatePrice: true,
      });
      
      showSnackbar('Araç başarıyla değiştirildi', 'success');
      
      await loadReservation();
    } catch (error: any) {
      showSnackbar(`Araç değiştirilemedi: ${error.response?.data?.message || error.message}`, 'error');
    }
  }
};

const changeDate = async () => {
  if (isReadOnly.value || !reservation.value) return;
  
  const { value: formValues } = await Swal.fire({
    title: '<span style="font-size: 20px; font-weight: 600; color: #111827;">Tarih Değiştir</span>',
    html: `
      <div style="text-align: left; margin: 20px 0;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Alış Tarihi:</label>
        <input id="checkIn" type="datetime-local" class="swal2-input" value="${reservation.value.checkIn ? new Date(reservation.value.checkIn).toISOString().slice(0, 16) : ''}" style="width: 100%; margin-bottom: 20px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Dönüş Tarihi:</label>
        <input id="checkOut" type="datetime-local" class="swal2-input" value="${reservation.value.checkOut ? new Date(reservation.value.checkOut).toISOString().slice(0, 16) : ''}" style="width: 100%;">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Değiştir',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    buttonsStyling: true,
    customClass: {
      popup: 'swal-popup-minimal',
      title: 'swal-title-minimal',
      htmlContainer: 'swal-html-minimal',
      input: 'swal-input-minimal',
      confirmButton: 'swal-confirm-minimal',
      cancelButton: 'swal-cancel-minimal',
    },
    preConfirm: () => {
      const checkIn = (document.getElementById('checkIn') as HTMLInputElement)?.value;
      const checkOut = (document.getElementById('checkOut') as HTMLInputElement)?.value;
      if (!checkIn || !checkOut) {
        Swal.showValidationMessage('Lütfen tüm tarihleri doldurun');
        return false;
      }
      return { checkIn, checkOut };
    },
  });
  
  if (formValues) {
    try {
      await http.put(`/reservations/${reservation.value.id}`, {
        checkIn: new Date(formValues.checkIn),
        checkOut: new Date(formValues.checkOut),
        recalculatePrice: reservation.value.type === 'rentacar',
      });
      
      showSnackbar('Tarihler başarıyla değiştirildi', 'success');
      
      await loadReservation();
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: `Tarihler değiştirilemedi: ${error.response?.data?.message || error.message}`,
        confirmButtonText: 'Tamam',
        confirmButtonColor: '#dc2626',
      });
    }
  }
};

const changeLocation = async () => {
  if (isReadOnly.value || !reservation.value || reservation.value.type !== 'rentacar') return;
  
  try {
    // Lokasyonları yükle
    const locationsRes = await http.get('/rentacar/locations');
    const locations = locationsRes.data?.data || locationsRes.data || [];
    
    const { value: formValues } = await Swal.fire({
      title: '<span style="font-size: 20px; font-weight: 600; color: #111827;">Lokasyon Değiştir</span>',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Alış Lokasyonu:</label>
          <select id="pickupLocation" class="swal2-input" style="width: 100%; margin-bottom: 20px;">
            ${locations.map((loc: any) => `<option value="${loc.id}" ${(reservation.value?.metadata as any)?.pickupLocationId === loc.id ? 'selected' : ''}>${loc.name}</option>`).join('')}
          </select>
          <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Dönüş Lokasyonu:</label>
          <select id="dropoffLocation" class="swal2-input" style="width: 100%;">
            ${locations.map((loc: any) => `<option value="${loc.id}" ${(reservation.value?.metadata as any)?.dropoffLocationId === loc.id ? 'selected' : ''}>${loc.name}</option>`).join('')}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Değiştir',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      buttonsStyling: true,
      customClass: {
        popup: 'swal-popup-minimal',
        title: 'swal-title-minimal',
        htmlContainer: 'swal-html-minimal',
        input: 'swal-input-minimal',
        confirmButton: 'swal-confirm-minimal',
        cancelButton: 'swal-cancel-minimal',
      },
      preConfirm: () => {
        const pickupLocationId = (document.getElementById('pickupLocation') as HTMLSelectElement)?.value;
        const dropoffLocationId = (document.getElementById('dropoffLocation') as HTMLSelectElement)?.value;
        if (!pickupLocationId || !dropoffLocationId) {
          Swal.showValidationMessage('Lütfen tüm lokasyonları seçin');
          return false;
        }
        return { pickupLocationId, dropoffLocationId };
      },
    });
    
    if (formValues) {
      const metadata = reservation.value.metadata || {};
      const pickupLocation = locations.find((l: any) => l.id === formValues.pickupLocationId);
      const dropoffLocation = locations.find((l: any) => l.id === formValues.dropoffLocationId);
      
      await http.put(`/reservations/${reservation.value.id}`, {
        metadata: {
          ...metadata,
          pickupLocationId: formValues.pickupLocationId,
          dropoffLocationId: formValues.dropoffLocationId,
          pickupLocationName: pickupLocation?.name,
          dropoffLocationName: dropoffLocation?.name,
        },
      });
      
      showSnackbar('Lokasyonlar başarıyla değiştirildi', 'success');
      
      await loadReservation();
    }
  } catch (error: any) {
    showSnackbar(`Lokasyonlar değiştirilemedi: ${error.response?.data?.message || error.message}`, 'error');
  }
};

const updateStatus = async () => {
  if (isReadOnly.value || !reservation.value) return;
  
  const statusOptions: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    rejected: 'Reddedildi',
    cancelled: 'İptal Edildi',
    completed: 'Tamamlandı',
  };
  
  const { value: newStatus } = await Swal.fire({
    title: '<span style="font-size: 20px; font-weight: 600; color: #111827;">Durum Güncelle</span>',
    input: 'select',
    inputOptions: statusOptions,
    inputValue: reservation.value.status,
    showCancelButton: true,
    confirmButtonText: 'Güncelle',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    buttonsStyling: true,
    customClass: {
      popup: 'swal-popup-minimal',
      title: 'swal-title-minimal',
      htmlContainer: 'swal-html-minimal',
      input: 'swal-input-minimal',
      confirmButton: 'swal-confirm-minimal',
      cancelButton: 'swal-cancel-minimal',
    },
    inputValidator: (value) => {
      if (!value) {
        return 'Lütfen bir durum seçin';
      }
    },
  });
  
  if (newStatus) {
    try {
      await http.put(`/reservations/${reservation.value.id}/status`, {
        status: newStatus,
      });
      
      showSnackbar('Durum başarıyla güncellendi', 'success');
      
      await loadReservation();
    } catch (error: any) {
      showSnackbar(`Durum güncellenemedi: ${error.response?.data?.message || error.message}`, 'error');
    }
  }
};
</script>

<style scoped>
/* Reset & Base */
* {
  box-sizing: border-box;
}

.reservation-detail-page {
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #111827;
  line-height: 1.5;
}

/* Loading & Error States */
.loading-container,
.error-container {
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

/* 1. STICKY HEADER */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reservation-code {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.created-date {
  font-size: 12px;
  color: #6b7280;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.status-chips {
  display: flex;
  gap: 8px;
}

.status-chip {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chip-paid { background: #d1fae5; color: #065f46; }
.chip-pending { background: #fef3c7; color: #92400e; }
.chip-confirmed { background: #dbeafe; color: #1e40af; }
.chip-cancelled { background: #fee2e2; color: #991b1b; }
.chip-completed { background: #e0e7ff; color: #3730a3; }
.chip-vehicle { background: #f3f4f6; color: #374151; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.more-menu {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  overflow: hidden;
}

.dropdown-menu button,
.send-dropdown button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-menu button:hover:not(:disabled),
.send-dropdown button:hover:not(:disabled) {
  background: #f9fafb;
}

.dropdown-menu button:disabled,
.send-dropdown button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-menu {
  position: relative;
}

.send-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
}

/* 2. MAIN GRID */
.main-grid {
  display: grid;
  grid-template-columns: 360px 1fr 320px;
  gap: 24px;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

@media (max-width: 1400px) {
  .main-grid {
    grid-template-columns: 320px 1fr 300px;
  }
}

@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

/* CARD */
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

/* LEFT COLUMN - OPERATIONS */
.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2563eb;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #e5e7eb;
}

.timeline-content {
  padding-left: 8px;
}

.timeline-time {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.timeline-text {
  font-size: 14px;
  color: #374151;
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  text-align: right;
  font-size: 14px;
  color: #111827;
}

.summary-meta {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* TABS */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.input,
.textarea {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #111827;
  transition: all 0.2s;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

/* PHOTO GRID */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.photo-slot {
  aspect-ratio: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}

.photo-slot:hover {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.photo-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9ca3af;
}

.photo-placeholder svg {
  opacity: 0.5;
}

.video-upload {
  padding: 24px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.video-upload:hover {
  border-color: #2563eb;
  background: #f9fafb;
}

/* WARNINGS */
.warnings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #92400e;
  font-size: 13px;
}

/* DAMAGE COMPARISON */
.damage-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.comparison-before,
.comparison-after {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-before span,
.comparison-after span {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.comparison-before img,
.comparison-after img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

/* CENTER COLUMN */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #111827;
  text-align: right;
  max-width: 60%;
}

.info-value.link {
  color: #2563eb;
  text-decoration: none;
}

.info-value.link:hover {
  text-decoration: underline;
}

.service-tag {
  display: inline-block;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  margin-left: 4px;
}

.doc-status {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.doc-status.verified {
  background: #d1fae5;
  color: #065f46;
}

.doc-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.doc-status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.notes-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-group label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

/* RIGHT SIDEBAR - FINANCIAL */
.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #374151;
}

.price-row.total {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  margin-top: 4px;
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.price-row.payment {
  font-size: 13px;
  color: #6b7280;
}

.price-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.discount {
  color: #10b981;
}

.remaining {
  color: #ef4444;
  font-weight: 600;
}

.deposit-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.deposit-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.held {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.returned {
  background: #d1fae5;
  color: #065f46;
}

.extra-charges {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.charge-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  gap: 12px;
}

.charge-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
}

.charge-description {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.charge-currency {
  font-size: 12px;
  color: #6b7280;
}

.charge-amount {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.charge-delete {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.charge-delete:hover {
  background: #fecaca;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-link {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 8px;
  text-align: left;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-link:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* BUTTONS */
.btn-primary {
  padding: 12px 20px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 16px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* Responsive */
@media (max-width: 768px) {
  .sticky-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-center {
    width: 100%;
    justify-content: flex-start;
  }

  .main-grid {
    padding: 16px;
  }

  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* SweetAlert2 Minimal Styles */
:deep(.swal-popup-minimal) {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
  max-width: 500px;
}

:deep(.swal-title-minimal) {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.5;
}

:deep(.swal-html-minimal) {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0 20px 0;
}

:deep(.swal-html-minimal p) {
  margin: 0 0 8px 0;
}

:deep(.swal-html-minimal label) {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

:deep(.swal-input-minimal) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
  background: #ffffff;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  margin-bottom: 16px;
}

:deep(.swal-input-minimal:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

:deep(.swal-input-minimal:disabled) {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

:deep(.swal-confirm-minimal) {
  background: #2563eb;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  transition: background 0.2s;
}

:deep(.swal-confirm-minimal:hover) {
  background: #1d4ed8;
}

:deep(.swal-cancel-minimal) {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: background 0.2s, border-color 0.2s;
}

:deep(.swal-cancel-minimal:hover) {
  background: #f9fafb;
  border-color: #d1d5db;
}

:deep(.swal2-select) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
  background: #ffffff;
  width: 100%;
  margin-bottom: 16px;
}

:deep(.swal2-select:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.photo-slot.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.video-upload.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.action-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
