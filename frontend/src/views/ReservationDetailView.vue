<template>
  <v-container fluid class="pa-0">
    <!-- Loading State -->
    <v-container v-if="loading" class="d-flex flex-column align-center justify-center" style="min-height: 400px;">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-1 text-medium-emphasis mt-4">Yükleniyor...</p>
    </v-container>

    <!-- Error State -->
    <v-container v-else-if="!reservation" class="d-flex flex-column align-center justify-center" style="min-height: 400px;">
      <v-icon icon="mdi-alert-circle-outline" size="64" color="grey" />
      <p class="text-body-1 text-medium-emphasis mt-4">Rezervasyon bulunamadı</p>
    </v-container>

    <!-- Main Content -->
    <template v-else>
      <!-- 1. STICKY TOP HEADER -->
      <v-app-bar flat color="surface" class="border-b">
        <v-btn variant="text" @click="goBack" class="mr-2">
          <v-icon start>mdi-arrow-left</v-icon>
          Rezervasyonlar
        </v-btn>
        
        <div class="d-flex flex-column">
          <span class="text-h6 font-weight-bold">{{ reservation.reference }}</span>
          <span class="text-caption text-medium-emphasis">{{ formatDate(reservation.createdAt) }}</span>
          </div>
        
        <v-spacer />
        
        <div class="d-flex ga-2 mr-4">
          <v-chip :color="getPaymentStatusColor()" size="small" variant="tonal">
              {{ getPaymentStatusLabel() }}
          </v-chip>
          <v-chip :color="getStatusColor(reservation.status)" size="small" variant="tonal">
              {{ getStatusLabel(reservation.status) }}
          </v-chip>
          <v-chip v-if="reservation.type === 'rentacar'" color="grey" size="small" variant="tonal">
              Araç
          </v-chip>
          </div>
        
        <v-btn variant="outlined" size="small" class="mr-2" @click="editReservation" :disabled="isReadOnly || isCancelled || hasCheckout">
          <v-icon start size="16">mdi-pencil</v-icon>
            Düzenle
        </v-btn>
        
        <v-btn variant="outlined" size="small" class="mr-2" @click="exportPDF">
          <v-icon start size="16">mdi-download</v-icon>
            PDF İndir
        </v-btn>
        
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn variant="outlined" size="small" class="mr-2" v-bind="props" :disabled="isReadOnly || isCancelled">
              <v-icon start size="16">mdi-email</v-icon>
              Gönder
              <v-icon end size="16">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item 
                v-if="reservation?.status === 'pending'" 
                @click="sendConfirmationEmail"
                :disabled="sendingEmail"
              >
              <template v-slot:prepend>
                <v-icon size="16">mdi-email-check</v-icon>
              </template>
              <v-list-item-title>Onay Maili Gönder</v-list-item-title>
            </v-list-item>
            <v-list-item 
                v-if="reservation?.status === 'confirmed' || reservation?.status === 'pending'" 
                @click="sendCancellationEmail"
                :disabled="sendingEmail"
              >
              <template v-slot:prepend>
                <v-icon size="16">mdi-email-off</v-icon>
              </template>
              <v-list-item-title>İptal Maili Gönder</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn variant="outlined" size="small" icon v-bind="props">
              <v-icon size="16">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="cancelReservation">
              <v-list-item-title>Rezervasyonu İptal Et</v-list-item-title>
            </v-list-item>
            <v-list-item @click="duplicateReservation">
              <v-list-item-title>Kopyala</v-list-item-title>
            </v-list-item>
            <v-list-item @click="archiveReservation">
              <v-list-item-title>Arşivle</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <!-- 2. MAIN GRID (3 Columns) -->
      <v-container fluid class="pa-6">
        <v-row>
        <!-- LEFT COLUMN - OPERATIONS -->
          <v-col cols="12" lg="3">
          <!-- A) Timeline Card -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Zaman Çizelgesi</v-card-title>
              <v-card-text>
                <v-timeline density="compact" side="end">
                  <v-timeline-item
                    v-for="(event, index) in timelineEvents"
                    :key="index"
                    dot-color="primary"
                    size="small"
                  >
                    <div class="text-caption text-medium-emphasis">{{ formatTime(event.time) }}</div>
                    <div class="text-body-2">{{ event.text }}</div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>

          <!-- B) Pickup / Return Summary -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Alış & İade</v-card-title>
              <v-card-text>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 60px;">Alış</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ formatDateTime(reservation.checkIn) }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">{{ getPickupLocation() }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 60px;">İade</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ formatDateTime(reservation.checkOut) }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">{{ getReturnLocation() }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="assignedStaff">
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 60px;">Personel</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ assignedStaff }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

          <!-- C) Pickup / Return Control (Tabs) -->
            <v-card variant="outlined">
              <v-tabs v-model="activeTab" grow>
                <v-tab value="pickup">Alış</v-tab>
                <v-tab value="return">İade</v-tab>
              </v-tabs>
              
              <v-card-text>
                <v-window v-model="activeTab">
            <!-- Pickup Tab -->
                  <v-window-item value="pickup">
                    <v-text-field
                  v-model.number="pickupData.odometerKm" 
                      label="KM"
                  type="number" 
                      variant="outlined"
                      density="compact"
                  placeholder="Kilometre girin"
                  :disabled="!canEditPickup && !(!isCancelled && !hasCheckout)"
                      class="mb-3"
                    >
                      <template v-slot:label>
                        KM <span class="text-error">*</span>
                      </template>
                    </v-text-field>
                    
                    <v-select
                  v-model="pickupData.fuelLevel" 
                      :items="fuelLevelOptions"
                      item-title="label"
                      item-value="value"
                      label="Yakıt Seviyesi"
                      variant="outlined"
                      density="compact"
                  :disabled="!canEditPickup && !(!isCancelled && !hasCheckout)"
                      class="mb-3"
                >
                      <template v-slot:label>
                        Yakıt Seviyesi <span class="text-error">*</span>
                      </template>
                    </v-select>
                    
                    <div class="mb-3">
                      <label class="text-body-2 text-medium-emphasis mb-2 d-block">
                        Fotoğraflar (8 gerekli) <span class="text-error">*</span>
                      </label>
                      <v-row dense>
                        <v-col v-for="(photo, index) in pickupData.photos" :key="index" cols="3">
                          <v-card
                            variant="outlined"
                            class="photo-slot-card"
                            :class="{ 'photo-slot-disabled': !canEditPickup && !(!isCancelled && !hasCheckout) }"
                    @click="canEditPickup || (!isCancelled && !hasCheckout) ? uploadPhoto('pickup', index) : null"
                  >
                            <v-img v-if="photo" :src="photo" aspect-ratio="1" cover />
                            <div v-else class="d-flex flex-column align-center justify-center pa-2" style="aspect-ratio: 1;">
                              <v-icon color="grey-lighten-1">mdi-image</v-icon>
                              <span class="text-caption text-grey">{{ index + 1 }}</span>
                    </div>
                          </v-card>
                        </v-col>
                      </v-row>
                  </div>
                    
                    <div class="mb-3">
                      <label class="text-body-2 text-medium-emphasis mb-2 d-block">Video (İsteğe Bağlı)</label>
                      <v-card
                        variant="outlined"
                        class="pa-4 text-center cursor-pointer"
                        :class="{ 'opacity-50': !canEditPickup && !(!isCancelled && !hasCheckout) }"
                  @click="canEditPickup || (!isCancelled && !hasCheckout) ? uploadVideo('pickup') : null"
                >
                        <v-icon v-if="!pickupData.video" color="grey">mdi-video</v-icon>
                        <span v-else class="text-body-2">Video yüklendi</span>
                      </v-card>
                </div>
                    
                    <v-textarea
                  v-model="pickupData.damageNotes" 
                      label="Hasar Notları"
                      variant="outlined"
                      density="compact"
                  rows="3"
                  placeholder="Mevcut hasarları not edin..."
                  :disabled="!canEditPickup && !(!isCancelled && !hasCheckout)"
                      class="mb-3"
                    />
                    
                    <v-alert v-if="!hasPlate" type="warning" variant="tonal" density="compact" class="mb-3">
                      <template v-slot:prepend>
                        <v-icon>mdi-alert</v-icon>
                      </template>
                Plaka atanmamış rezervasyon çıkış yapılamaz. Önce rezervasyona plaka atayın.
                    </v-alert>
                    
                    <v-btn
                      color="primary"
                      block
                :disabled="!canSavePickup || (!canEditPickup && !(!isCancelled && !hasCheckout))"
                @click="savePickup"
              >
                Alışı Kaydet
                    </v-btn>
                  </v-window-item>

            <!-- Return Tab -->
                  <v-window-item value="return">
                    <v-alert v-if="!hasPickupCompleted" type="warning" variant="tonal" density="compact" class="mb-3">
                      <template v-slot:prepend>
                        <v-icon>mdi-alert</v-icon>
                      </template>
                Çıkış yapılamayan rezervasyon dönüş yapılamaz. Önce alış işlemini tamamlayın.
                    </v-alert>
                    
                    <v-alert
                  v-for="(warning, index) in returnWarnings" 
                  :key="index"
                      type="warning"
                      variant="tonal"
                      density="compact"
                      class="mb-3"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-alert</v-icon>
                      </template>
                  {{ warning }}
                    </v-alert>

                    <v-text-field
                  v-model.number="returnData.odometerKm" 
                      label="KM"
                  type="number" 
                      variant="outlined"
                      density="compact"
                  placeholder="Kilometre girin"
                  :disabled="isReadOnly || isCancelled || hasCheckout"
                      class="mb-3"
                    >
                      <template v-slot:label>
                        KM <span class="text-error">*</span>
                      </template>
                    </v-text-field>
                    
                    <v-select
                  v-model="returnData.fuelLevel" 
                      :items="fuelLevelOptions"
                      item-title="label"
                      item-value="value"
                      label="Yakıt Seviyesi"
                      variant="outlined"
                      density="compact"
                  :disabled="isReadOnly || isCancelled || hasCheckout"
                      class="mb-3"
                >
                      <template v-slot:label>
                        Yakıt Seviyesi <span class="text-error">*</span>
                      </template>
                    </v-select>
                    
                    <div class="mb-3">
                      <label class="text-body-2 text-medium-emphasis mb-2 d-block">
                        Fotoğraflar (8 gerekli) <span class="text-error">*</span>
                      </label>
                      <v-row dense>
                        <v-col v-for="(photo, index) in returnData.photos" :key="index" cols="3">
                          <v-card
                            variant="outlined"
                            class="photo-slot-card"
                            :class="{ 'photo-slot-disabled': isReadOnly || isCancelled || hasCheckout }"
                    @click="!(isReadOnly || isCancelled || hasCheckout) ? uploadPhoto('return', index) : null"
                  >
                            <v-img v-if="photo" :src="photo" aspect-ratio="1" cover />
                            <div v-else class="d-flex flex-column align-center justify-center pa-2" style="aspect-ratio: 1;">
                              <v-icon color="grey-lighten-1">mdi-image</v-icon>
                              <span class="text-caption text-grey">{{ index + 1 }}</span>
                    </div>
                          </v-card>
                        </v-col>
                      </v-row>
                  </div>
                    
                    <div class="mb-3">
                      <label class="text-body-2 text-medium-emphasis mb-2 d-block">Hasar Karşılaştırması</label>
                      <v-row dense>
                        <v-col cols="6">
                          <v-card variant="outlined">
                            <v-card-subtitle class="text-center py-1">Önce</v-card-subtitle>
                            <v-img v-if="damageComparison.before" :src="damageComparison.before" aspect-ratio="1.33" cover />
                            <div v-else class="d-flex align-center justify-center bg-grey-lighten-4" style="aspect-ratio: 1.33;">
                              <v-icon color="grey">mdi-image-off</v-icon>
                </div>
                          </v-card>
                        </v-col>
                        <v-col cols="6">
                          <v-card variant="outlined">
                            <v-card-subtitle class="text-center py-1">Sonra</v-card-subtitle>
                            <v-img v-if="damageComparison.after" :src="damageComparison.after" aspect-ratio="1.33" cover />
                            <div v-else class="d-flex align-center justify-center bg-grey-lighten-4" style="aspect-ratio: 1.33;">
                              <v-icon color="grey">mdi-image-off</v-icon>
              </div>
                          </v-card>
                        </v-col>
                      </v-row>
                  </div>
                    
                    <v-btn
                      variant="outlined"
                      block
                      class="mb-3"
                      @click="addExtraCharge"
                    >
                      Ekstra Ücret Ekle
                    </v-btn>
                    
                    <v-btn
                      color="primary"
                      block
                :disabled="!canSaveReturn || isReadOnly || isCancelled || hasCheckout || !hasPickupCompleted"
                @click="saveReturn"
              >
                İadeyi Tamamla
                    </v-btn>
                  </v-window-item>
                </v-window>
              </v-card-text>
            </v-card>
          </v-col>

        <!-- CENTER COLUMN - RESERVATION DETAILS -->
          <v-col cols="12" lg="6">
          <!-- D) Customer Card -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Müşteri</v-card-title>
              <v-card-text>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 100px;">Ad</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ reservation.customerName }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 100px;">Telefon</span>
                    </template>
                    <v-list-item-title>
                      <a :href="`tel:${reservation.customerPhone}`" class="text-primary text-body-2">
                  {{ reservation.customerPhone || '-' }}
                </a>
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 100px;">E-posta</span>
                    </template>
                    <v-list-item-title>
                      <a :href="`mailto:${reservation.customerEmail}`" class="text-primary text-body-2">
                  {{ reservation.customerEmail }}
                </a>
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 100px;">Ülke / Dil</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ getCountry() }} / {{ getLanguage() }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

          <!-- E) Reservation Details Card -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Rezervasyon Detayları</v-card-title>
              <v-card-text>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 120px;">Ürün Tipi</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ getReservationTypeLabel(reservation.type) }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="reservation.type === 'rentacar'">
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 120px;">Araç</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ getVehicleName() }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="reservation.type === 'rentacar'">
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 120px;">Plaka</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ getPlateNumber() }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 120px;">Süre</span>
                    </template>
                    <v-list-item-title class="text-body-2">{{ getRentalDuration() }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="getExtraServices().length > 0">
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 120px;">Ekstra Hizmetler</span>
                    </template>
                    <v-list-item-title>
                      <v-chip v-for="(service, index) in getExtraServices()" :key="index" size="small" variant="tonal" class="mr-1 mb-1">
                    {{ service }}
                      </v-chip>
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

          <!-- F) Documents -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Belgeler</v-card-title>
              <v-card-text>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 100px;">Ehliyet</span>
                    </template>
                    <v-list-item-title>
                      <v-chip :color="getDocStatusColor('license')" size="small" variant="tonal">
                  {{ getDocStatusLabel('license') }}
                      </v-chip>
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 100px;">Pasaport</span>
                    </template>
                    <v-list-item-title>
                      <v-chip :color="getDocStatusColor('passport')" size="small" variant="tonal">
                  {{ getDocStatusLabel('passport') }}
                      </v-chip>
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <span class="text-body-2 text-medium-emphasis" style="min-width: 100px;">Doğrulama</span>
                    </template>
                    <v-list-item-title>
                      <v-chip :color="getDocStatusColor('verification')" size="small" variant="tonal">
                  {{ getDocStatusLabel('verification') }}
                      </v-chip>
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

          <!-- G) Notes -->
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Notlar</v-card-title>
              <v-card-text>
                <v-textarea
                  v-model="internalNote" 
                  label="İç Admin Notu"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  placeholder="İç not ekle..."
                  :disabled="!canEditNotes"
                  @blur="saveNote('internal')"
                  class="mb-3"
                />
                <v-textarea
                  v-model="customerNote" 
                  label="Müşteri Notu"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  placeholder="Müşteri notu ekle..."
                  :disabled="!canEditNotes"
                  @blur="saveNote('customer')"
                />
              </v-card-text>
            </v-card>
          </v-col>

        <!-- RIGHT SIDEBAR - FINANCIAL -->
          <v-col cols="12" lg="3">
          <!-- H) Price Summary Card -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Fiyat Özeti</v-card-title>
              <v-card-text>
                <div class="d-flex justify-space-between text-body-2 mb-2">
                  <span class="text-medium-emphasis">Temel Fiyat</span>
                <span>{{ formatPrice(getBasePrice()) }}</span>
              </div>
                <div class="d-flex justify-space-between text-body-2 mb-2">
                  <span class="text-medium-emphasis">Ekstralar</span>
                <span>{{ formatPrice(getExtrasPrice()) }}</span>
              </div>
                <div class="d-flex justify-space-between text-body-2 mb-2">
                  <span class="text-medium-emphasis">İndirim</span>
                  <span class="text-success">-{{ formatPrice(getDiscount()) }}</span>
              </div>
                <div class="d-flex justify-space-between text-body-2 mb-2">
                  <span class="text-medium-emphasis">Vergi</span>
                <span>{{ formatPrice(getTax()) }}</span>
              </div>
                <v-divider class="my-3" />
                <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold mb-2">
                <span>Toplam</span>
                <span>{{ formatPrice(getTotalPrice()) }}</span>
              </div>
                <div class="d-flex justify-space-between text-body-2 mb-2">
                  <span class="text-medium-emphasis">Ödenen</span>
                <span>{{ formatPrice(getPaidAmount()) }}</span>
              </div>
                <div class="d-flex justify-space-between text-body-2">
                  <span class="text-medium-emphasis">Kalan</span>
                  <span class="text-error font-weight-bold">{{ formatPrice(getRemainingAmount()) }}</span>
              </div>
              </v-card-text>
            </v-card>

          <!-- I) Deposit & Extras -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Depozito & Ekstralar</v-card-title>
              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-3">
                  <span class="text-body-2 text-medium-emphasis">Depozito Durumu</span>
                  <v-chip :color="getDepositStatusColor()" size="small" variant="tonal">
                  {{ getDepositStatusLabel() }}
                  </v-chip>
              </div>
                
                <div v-if="extraCharges.length > 0" class="mb-3">
                  <v-card
                    v-for="(charge, index) in extraCharges"
                    :key="charge.id || index"
                    variant="tonal"
                    color="grey-lighten-4"
                    class="mb-2 pa-3"
                  >
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="text-body-2 font-weight-medium">{{ charge.description || charge.name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ charge.currencyCode || 'TRY' }}</div>
                  </div>
                      <div class="d-flex align-center ga-2">
                        <span class="text-body-2 font-weight-bold">{{ formatPrice(charge.amount || 0) }}</span>
                        <v-btn
                    v-if="!isCancelled"
                          icon
                          size="x-small"
                          color="error"
                          variant="text"
                    @click="removeExtraCharge(index)"
                  >
                          <v-icon size="16">mdi-close</v-icon>
                        </v-btn>
                </div>
              </div>
                  </v-card>
                </div>
                
                <v-btn
                v-if="!isReadOnly && !isCancelled"
                  variant="outlined"
                  block
                @click="addExtraCharge"
              >
                Ekstra Ücret Ekle
                </v-btn>
              </v-card-text>
            </v-card>

          <!-- J) Quick Actions -->
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1 font-weight-bold pb-0">Hızlı İşlemler</v-card-title>
              <v-card-text>
                <v-btn
                  variant="outlined"
                  block
                  class="mb-2"
                @click="changeVehicle"
                :disabled="!canChangeVehicle && !(!isCancelled && !hasCheckout)"
              >
                Araç Değiştir
                </v-btn>
                <v-btn
                  variant="outlined"
                  block
                  class="mb-2"
                @click="changeDate"
                :disabled="isReadOnly || isCancelled"
              >
                Tarih Değiştir
                </v-btn>
                <v-btn
                  variant="outlined"
                  block
                  class="mb-2"
                @click="changeLocation"
                :disabled="isReadOnly || isCancelled"
              >
                Lokasyon Değiştir
                </v-btn>
                <v-btn
                  variant="outlined"
                  block
                @click="updateStatus"
                :disabled="isReadOnly || isCancelled"
              >
                Durum Güncelle
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- Hidden file input -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      multiple
      style="display: none"
      @change="handleFileUpload"
    />

    <!-- Ekstra Ücret Dialog -->
    <v-dialog v-model="showExtraChargeDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Ekstra Ücret Ekle
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="extraChargeForm.description"
            label="Açıklama"
            variant="outlined"
            density="compact"
            placeholder="Ekstra ücret açıklaması"
            :rules="[v => !!v || 'Açıklama gereklidir']"
            class="mb-3"
          />
          <v-text-field
            v-model.number="extraChargeForm.amount"
            :label="`Ücret (${extraChargeForm.currencyCode})`"
            type="number"
            variant="outlined"
            density="compact"
            placeholder="0.00"
            step="0.01"
            min="0"
            :rules="[v => v > 0 || 'Ücret 0\'dan büyük olmalıdır']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showExtraChargeDialog = false">
            İptal
          </v-btn>
          <v-btn 
            color="primary" 
            variant="flat"
            @click="saveExtraCharge"
            :disabled="!extraChargeForm.description || extraChargeForm.amount <= 0"
          >
            Ekle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Araç Değiştir Dialog -->
    <v-dialog v-model="showVehicleDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Araç Değiştir
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">Müsait plakalardan birini seçin</p>
          <v-select
            v-model="selectedVehiclePlateId"
            :items="availableVehicles"
            label="Araç Seçin"
            variant="outlined"
            density="compact"
            :loading="loadingVehicles"
            :disabled="loadingVehicles"
            :rules="[v => !!v || 'Lütfen bir araç seçin']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showVehicleDialog = false">
            İptal
          </v-btn>
          <v-btn 
            color="primary" 
            variant="flat"
            @click="saveVehicleChange"
            :disabled="!selectedVehiclePlateId || loadingVehicles"
          >
            Değiştir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tarih Değiştir Dialog -->
    <v-dialog v-model="showDateDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Tarih Değiştir
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="dateForm.checkIn"
            label="Alış Tarihi"
            type="datetime-local"
            variant="outlined"
            density="compact"
            class="mb-3"
            :rules="[v => !!v || 'Alış tarihi gereklidir']"
          />
          <v-text-field
            v-model="dateForm.checkOut"
            label="Dönüş Tarihi"
            type="datetime-local"
            variant="outlined"
            density="compact"
            :rules="[v => !!v || 'Dönüş tarihi gereklidir']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDateDialog = false">
            İptal
          </v-btn>
          <v-btn 
            color="primary" 
            variant="flat"
            @click="saveDateChange"
            :disabled="!dateForm.checkIn || !dateForm.checkOut"
          >
            Değiştir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Lokasyon Değiştir Dialog -->
    <v-dialog v-model="showLocationDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Lokasyon Değiştir
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="locationForm.pickupLocationId"
            :items="availableLocations"
            item-title="name"
            item-value="id"
            label="Alış Lokasyonu"
            variant="outlined"
            density="compact"
            class="mb-3"
            :loading="loadingLocations"
            :disabled="loadingLocations"
            :rules="[v => !!v || 'Alış lokasyonu gereklidir']"
          />
          <v-select
            v-model="locationForm.dropoffLocationId"
            :items="availableLocations"
            item-title="name"
            item-value="id"
            label="Dönüş Lokasyonu"
            variant="outlined"
            density="compact"
            :loading="loadingLocations"
            :disabled="loadingLocations"
            :rules="[v => !!v || 'Dönüş lokasyonu gereklidir']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showLocationDialog = false">
            İptal
          </v-btn>
          <v-btn 
            color="primary" 
            variant="flat"
            @click="saveLocationChange"
            :disabled="!locationForm.pickupLocationId || !locationForm.dropoffLocationId || loadingLocations"
          >
            Değiştir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Durum Güncelle Dialog -->
    <v-dialog v-model="showStatusDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Durum Güncelle
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="Durum Seçin"
            variant="outlined"
            density="compact"
            :rules="[v => !!v || 'Lütfen bir durum seçin']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showStatusDialog = false">
            İptal
          </v-btn>
          <v-btn 
            color="primary" 
            variant="flat"
            @click="saveStatusChange"
            :disabled="!selectedStatus"
          >
            Güncelle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Silme Onay Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Emin misiniz?
        </v-card-title>
        <v-card-text>
          <p class="text-body-1">{{ deleteDialogMessage }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">
            Hayır
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            @click="confirmDelete"
          >
            Evet, Sil
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- İptal Onay Dialog -->
    <v-dialog v-model="showCancelDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Rezervasyon İptali
        </v-card-title>
        <v-card-text>
          <p class="text-body-1">Rezervasyonu iptal etmek istediğinize emin misiniz?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCancelDialog = false">
            Hayır
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            @click="confirmCancellation"
          >
            Evet, İptal Et
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Return Uyarı Dialog -->
    <v-dialog v-model="showReturnWarningDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Uyarılar
        </v-card-title>
        <v-card-text>
          <v-alert
            v-for="(warning, index) in returnWarnings"
            :key="index"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            {{ warning }}
          </v-alert>
          <p class="text-body-2 text-medium-emphasis mt-4">Yine de devam etmek istiyor musunuz?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showReturnWarningDialog = false">
            İptal
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            @click="confirmReturnWithWarnings"
          >
            Devam Et
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../modules/http';
import { useSnackbar } from '../composables/useSnackbar';
import { useAuthStore } from '../stores/auth';

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
const showVehicleDialog = ref(false);
const showDateDialog = ref(false);
const showLocationDialog = ref(false);
const showStatusDialog = ref(false);
const showExtraChargeDialog = ref(false);
const showDeleteDialog = ref(false);
const showCancelDialog = ref(false);
const showReturnWarningDialog = ref(false);

// Dialog data
const extraChargeForm = ref({
  description: '',
  amount: 0,
  currencyCode: 'TRY'
});

const selectedVehiclePlateId = ref('');
const availableVehicles = ref<Array<{value: string, title: string}>>([]);
const loadingVehicles = ref(false);

const dateForm = ref({
  checkIn: '',
  checkOut: ''
});

const locationForm = ref({
  pickupLocationId: '',
  dropoffLocationId: ''
});
const availableLocations = ref<Array<{id: string, name: string}>>([]);
const loadingLocations = ref(false);

const selectedStatus = ref('');
const statusOptions = ref([
  { value: 'pending', title: 'Beklemede' },
  { value: 'confirmed', title: 'Onaylandı' },
  { value: 'rejected', title: 'Reddedildi' },
  { value: 'cancelled', title: 'İptal Edildi' },
  { value: 'completed', title: 'Tamamlandı' }
]);

const deleteDialogMessage = ref('');
const deleteDialogCallback = ref<(() => void) | null>(null);

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
  
  // Uyarıları kontrol et ve kullanıcıdan onay al
  if (returnWarnings.value.length > 0) {
    showReturnWarningDialog.value = true;
    return;
  }
  
  await processReturn();
};

const confirmReturnWithWarnings = async () => {
  showReturnWarningDialog.value = false;
  await processReturn();
};

const processReturn = async () => {
  if (!reservation.value) return;
  
  try {
    // Fotoğrafları backend formatına çevir (slotIndex ile)
    const photos = returnData.value.photos
      .map((photo, index) => photo ? { slotIndex: index, mediaUrl: photo } : null)
      .filter((p): p is { slotIndex: number; mediaUrl: string } => p !== null);
    
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
  
  // Reset form
  extraChargeForm.value = {
    description: '',
    amount: 0,
    currencyCode
  };
  
  // Show dialog
  showExtraChargeDialog.value = true;
};

const saveExtraCharge = async () => {
  if (!reservation.value || !extraChargeForm.value.description || extraChargeForm.value.amount <= 0) return;
  
  try {
    const metadata = reservation.value.metadata as any;
    
    // Yeni ekstra ücreti ekle
    const newCharge = {
      id: Date.now().toString(),
      description: extraChargeForm.value.description,
      amount: extraChargeForm.value.amount,
      currencyCode: extraChargeForm.value.currencyCode,
      addedAt: new Date().toISOString(),
    };
    
    extraCharges.value.push(newCharge);
    
    // Metadata'yı güncelle
    const updatedMetadata = {
      ...metadata,
      extraCharges: extraCharges.value,
    };
    
    // Extras price'ı güncelle
    const currentExtrasPrice = metadata?.extrasPrice || 0;
    updatedMetadata.extrasPrice = currentExtrasPrice + extraChargeForm.value.amount;
    
    // Total price'ı güncelle
    const currentTotalPrice = metadata?.totalPrice || 0;
    updatedMetadata.totalPrice = currentTotalPrice + extraChargeForm.value.amount;
    
    // Backend'e kaydet
    await http.put(`/reservations/${reservation.value.id}`, {
      metadata: updatedMetadata,
      recalculatePrice: false,
    });
    
    showSnackbar('Ekstra ücret başarıyla eklendi', 'success');
    showExtraChargeDialog.value = false;
    
    // Rezervasyonu yeniden yükle
    await loadReservation();
  } catch (error: any) {
    console.error('Failed to add extra charge:', error);
    showSnackbar(`Ekstra ücret eklenemedi: ${error.response?.data?.message || error.message}`, 'error');
  }
};

const removeExtraCharge = async (index: number) => {
  // Rezervasyon onaylanmış durumda iken ekstra ürün silinebilmelidir
  // Sadece iptal edilmiş rezervasyonlarda ekstra ücret silinemez
  if (!reservation.value || isCancelled.value) return;
  
  const charge = extraCharges.value[index];
  if (!charge) return;
  
  deleteDialogMessage.value = 'Bu ekstra ücreti silmek istediğinize emin misiniz?';
  deleteDialogCallback.value = async () => {
    try {
      // Ekstra ücreti listeden çıkar
      const removedCharge = extraCharges.value.splice(index, 1)[0];
      
      // Metadata'yı güncelle
      const metadata = reservation.value!.metadata as any;
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
      await http.put(`/reservations/${reservation.value!.id}`, {
        metadata: updatedMetadata,
        recalculatePrice: false,
      });
      
      showSnackbar('Ekstra ücret başarıyla silindi', 'success');
      showDeleteDialog.value = false;
      
      // Rezervasyonu yeniden yükle
      await loadReservation();
    } catch (error: any) {
      console.error('Failed to remove extra charge:', error);
      showSnackbar(`Ekstra ücret silinemedi: ${error.response?.data?.message || error.message}`, 'error');
    }
  };
  
  showDeleteDialog.value = true;
};

const confirmDelete = () => {
  if (deleteDialogCallback.value) {
    deleteDialogCallback.value();
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

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    confirmed: 'info',
    rejected: 'error',
    cancelled: 'error',
    completed: 'success',
  };
  return colors[status || ''] || 'grey';
};

const getPaymentStatus = () => 'paid'; // Implement based on actual payment data
const getPaymentStatusLabel = () => 'Ödendi';
const getPaymentStatusColor = () => 'success';
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
const getDocStatusColor = (doc: string) => {
  const status = getDocStatus(doc);
  const colors: Record<string, string> = {
    verified: 'success',
    pending: 'warning',
    rejected: 'error',
  };
  return colors[status] || 'grey';
};
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
const getDepositStatusColor = () => {
  const status = getDepositStatus();
  const colors: Record<string, string> = {
    held: 'info',
    returned: 'success',
    forfeited: 'error',
  };
  return colors[status] || 'grey';
};

const fuelLevelOptions = [
  { label: 'Yakıt seviyesi seçin', value: '' },
  { label: 'Dolu', value: 'full' },
  { label: '3/4', value: '3/4' },
  { label: '1/2', value: '1/2' },
  { label: '1/4', value: '1/4' },
  { label: 'Boş', value: 'empty' },
];

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
  
  showCancelDialog.value = true;
};

const confirmCancellation = async () => {
  if (!reservation.value) return;
  
  sendingEmail.value = true;
  showSendMenu.value = false;
  showCancelDialog.value = false;
  
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
/* Photo slot card styles */
.photo-slot-card {
  cursor: pointer;
  transition: all 0.2s;
}

.photo-slot-card:hover {
  border-color: rgb(var(--v-theme-primary));
}

.photo-slot-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
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
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}

:deep(.swal-input-minimal:disabled) {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

:deep(.swal-confirm-minimal) {
  background: rgb(var(--v-theme-primary));
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  transition: background 0.2s;
}

:deep(.swal-confirm-minimal:hover) {
  filter: brightness(0.9);
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
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}
</style>
