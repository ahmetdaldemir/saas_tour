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
          <div class="reservation-new-page">
            <!-- Üst Kısım: Kiraya Verilebilecek Araçlar -->
            <v-card variant="outlined" class="mb-4" v-if="availableVehicles.length > 0 || loadingVehicles">
              <v-card-title class="d-flex align-center justify-space-between pa-4 bg-grey-lighten-4">
                <h3 class="text-h6 font-weight-bold d-flex align-center">
                  <v-icon icon="mdi-car-multiple" class="mr-2" color="primary" />
                  Kiraya Verilebilecek Araçlar
                </h3>
                <v-chip color="primary" variant="tonal" v-if="availableVehicles.length > 0">
                  {{ availableVehicles.length }} Araç
                </v-chip>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="vehicleTableHeaders"
                  :items="availableVehicles"
                  :loading="loadingVehicles"
                  item-value="id"
                  class="elevation-0 vehicle-table"
                  density="comfortable"
                  @click:row="selectVehicle"
                  :item-class="(item: AvailableVehicleDto) => item.id === reservationForm.vehicleId ? 'selected-vehicle' : ''"
                >
                  <template #item.image="{ item }">
                    <v-avatar size="48" color="primary" variant="tonal">
                      <v-icon icon="mdi-car" size="24" />
                    </v-avatar>
                  </template>
                  <template #item.vehicleModel="{ item }">
                    <div>
                      <div class="font-weight-bold text-body-1">{{ item.name }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ (item.brandName && item.brandName !== '-' ? item.brandName : 'Marka Seçilmemiş') }} | 
                        {{ (item.modelName && item.modelName !== '-' ? item.modelName : 'Model Seçilmemiş') }}
                      </div>
                    </div>
                  </template>
                  <template #item.plate="{ item }">
                    <v-chip size="small" variant="outlined" color="primary">
                      {{ item.plate || '-' }}
                    </v-chip>
                  </template>
                  <template #item.days>
                    <v-chip size="small" color="info" variant="tonal">
                      {{ calculateDays() }} Gün
                    </v-chip>
                  </template>
                  <template #item.dailyPrice="{ item }">
                    <span class="font-weight-medium">{{ formatPrice(item.dailyPrice || 0, reservationForm.currencyCode) }}</span>
                  </template>
                  <template #item.rentalPrice="{ item }">
                    <span class="font-weight-medium">{{ formatPrice(calculateRentalPrice(item), reservationForm.currencyCode) }}</span>
                  </template>
                  <template #item.dropFee>
                    <span>{{ formatPrice(getDropFee(), reservationForm.currencyCode) }}</span>
                  </template>
                  <template #item.deliveryFee>
                    <span>{{ formatPrice(getDeliveryFee(), reservationForm.currencyCode) }}</span>
                  </template>
                  <template #item.totalPrice="{ item }">
                    <span class="font-weight-bold text-h6 text-primary">{{ formatPrice(calculateTotalPrice(item), reservationForm.currencyCode) }}</span>
                  </template>
                  <template #item.lastReturnLocation>
                    <span class="text-medium-emphasis">-</span>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>

            <!-- Ana İçerik: Sol ve Sağ Kolonlar -->
            <v-row class="reservation-content-row">
              <!-- Sol Kolon: Rezervasyon Formu -->
              <v-col cols="12" md="6" class="reservation-form-col">
                <v-card variant="outlined" class="mb-4">
                  <v-card-text class="pa-4">
                    <!-- Para Birimi ve Rezervasyon Kaynağı -->
                    <v-row dense class="mb-4">
                      <v-col cols="6">
                        <v-select
                          v-model="reservationForm.currencyCode"
                          :items="currencyOptions"
                          item-title="label"
                          item-value="value"
                          label="Para Birimi"
                          density="comfortable"
                          variant="outlined"
                          hide-details
                        >
                          <template #prepend-inner>
                            <v-icon :icon="getCurrencyIcon(reservationForm.currencyCode)" size="20" />
                          </template>
                        </v-select>
                      </v-col>
                      <v-col cols="6">
                        <v-select
                          v-model="reservationForm.source"
                          :items="sourceOptions"
                          item-title="label"
                          item-value="value"
                          label="Rezervasyon Kaynağı"
                          density="comfortable"
                          variant="outlined"
                          hide-details
                        >
                          <template #prepend-inner>
                            <v-icon :icon="getSourceIcon(reservationForm.source)" size="20" />
                          </template>
                        </v-select>
                      </v-col>
                    </v-row>

                    <!-- Alış Lokasyon - Tarih Saat Bilgileri -->
                    <div class="mb-4">
                      <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                        <v-icon icon="mdi-map-marker-outline" size="18" class="mr-1" color="primary" />
                        Alış Lokasyon - Tarih Saat Bilgileri
                      </div>
                      <v-autocomplete
                        v-model="reservationForm.pickupLocationId"
                        :items="locationSearchQuery ? filteredLocationsForSearch : []"
                        item-title="title"
                        item-value="id"
                        label="Alış Yeri Seçiniz"
                        placeholder="Alış Yeri Seçiniz"
                        density="comfortable"
                        variant="outlined"
                        prepend-inner-icon="mdi-map-marker"
                        hide-details
                        class="mb-3"
                        :search="locationSearchQuery"
                        @update:search="locationSearchQuery = $event"
                        @update:model-value="onPickupLocationSelected"
                        clearable
                        ref="pickupLocationAutocomplete"
                      >
                        <template #item="{ item, props: itemProps }">
                          <v-list-item 
                            v-bind="itemProps" 
                            :prepend-icon="item.raw?.icon || 'mdi-map-marker'"
                          >
                            <v-list-item-title>
                              <span class="font-weight-medium">{{ item.raw?.name || item.title }}</span>
                              <span v-if="item.raw?.type" class="text-caption text-medium-emphasis ml-2">
                                ({{ getLocationTypeLabel(item.raw.type) }})
                              </span>
                            </v-list-item-title>
                          </v-list-item>
                        </template>
                        <template #prepend-item v-if="!locationSearchQuery">
                          <template v-for="(group, groupIndex) in availableLocations" :key="`group-${groupIndex}`">
                            <v-list-subheader v-if="group.type === 'subheader'" class="font-weight-bold text-uppercase">
                              {{ group.title }}
                            </v-list-subheader>
                            <template v-if="group.children && group.children.length > 0">
                              <v-list-item
                                v-for="child in group.children"
                                :key="child.id"
                                :value="child.id"
                                :prepend-icon="child.icon"
                                class="pl-8"
                                @click="selectPickupLocation(child.id)"
                              >
                                <v-list-item-title>
                                  <span>{{ child.name }}</span>
                                  <span class="text-caption text-medium-emphasis ml-2">
                                    ({{ getLocationTypeLabel(child.type) }})
                                  </span>
                                </v-list-item-title>
                              </v-list-item>
                            </template>
                            <v-divider v-if="groupIndex < availableLocations.length - 1" class="my-2" />
                          </template>
                        </template>
                        <template #selection="{ item }">
                          <template v-if="reservationForm.pickupLocationId">
                            <template v-if="item && item.raw">
                              <div class="d-flex align-center">
                                <v-icon :icon="item.raw?.icon || 'mdi-map-marker'" size="18" class="mr-2" />
                                <span>{{ item.raw?.name || item.title }}</span>
                              </div>
                            </template>
                            <template v-else>
                              {{ getSelectedLocationName(reservationForm.pickupLocationId) }}
                            </template>
                          </template>
                        </template>
                      </v-autocomplete>
                      <v-row dense>
                        <v-col cols="6">
                          <v-text-field
                            v-model="reservationForm.pickupDate"
                            type="date"
                            label="Tarih"
                            density="comfortable"
                            variant="outlined"
                            prepend-inner-icon="mdi-calendar"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model="reservationForm.pickupTime"
                            type="time"
                            label="Saat"
                            density="comfortable"
                            variant="outlined"
                            prepend-inner-icon="mdi-clock-outline"
                            hide-details
                          />
                        </v-col>
                      </v-row>
                    </div>

                    <!-- Dönüş Lokasyon - Tarih Saat Bilgileri -->
                    <div class="mb-4">
                      <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                        <v-icon icon="mdi-map-marker-check-outline" size="18" class="mr-1" color="success" />
                        Dönüş Lokasyon - Tarih Saat Bilgileri
                      </div>
                      <v-autocomplete
                        v-model="reservationForm.returnLocationId"
                        :items="locationSearchQuery ? filteredLocationsForSearch : []"
                        item-title="title"
                        item-value="id"
                        label="Dönüş Yeri Seçiniz"
                        placeholder="Dönüş Yeri Seçiniz"
                        density="comfortable"
                        variant="outlined"
                        prepend-inner-icon="mdi-map-marker-check"
                        hide-details
                        class="mb-3"
                        :search="locationSearchQuery"
                        @update:search="locationSearchQuery = $event"
                        @update:model-value="onReturnLocationSelected"
                        clearable
                        ref="returnLocationAutocomplete"
                      >
                        <template #item="{ item, props: itemProps }">
                          <v-list-item 
                            v-bind="itemProps" 
                            :prepend-icon="item.raw?.icon || 'mdi-map-marker'"
                          >
                            <v-list-item-title>
                              <span class="font-weight-medium">{{ item.raw?.name || item.title }}</span>
                              <span v-if="item.raw?.type" class="text-caption text-medium-emphasis ml-2">
                                ({{ getLocationTypeLabel(item.raw.type) }})
                              </span>
                            </v-list-item-title>
                          </v-list-item>
                        </template>
                        <template #prepend-item v-if="!locationSearchQuery">
                          <template v-for="(group, groupIndex) in availableLocations" :key="`group-${groupIndex}`">
                            <v-list-subheader v-if="group.type === 'subheader'" class="font-weight-bold text-uppercase">
                              {{ group.title }}
                            </v-list-subheader>
                            <template v-if="group.children && group.children.length > 0">
                              <v-list-item
                                v-for="child in group.children"
                                :key="child.id"
                                :value="child.id"
                                :prepend-icon="child.icon"
                                class="pl-8"
                                @click="selectReturnLocation(child.id)"
                              >
                                <v-list-item-title>
                                  <span>{{ child.name }}</span>
                                  <span class="text-caption text-medium-emphasis ml-2">
                                    ({{ getLocationTypeLabel(child.type) }})
                                  </span>
                                </v-list-item-title>
                              </v-list-item>
                            </template>
                            <v-divider v-if="groupIndex < availableLocations.length - 1" class="my-2" />
                          </template>
                        </template>
                        <template #selection="{ item }">
                          <template v-if="reservationForm.returnLocationId">
                            <template v-if="item && item.raw">
                              <div class="d-flex align-center">
                                <v-icon :icon="item.raw?.icon || 'mdi-map-marker'" size="18" class="mr-2" />
                                <span>{{ item.raw?.name || item.title }}</span>
                              </div>
                            </template>
                            <template v-else>
                              {{ getSelectedLocationName(reservationForm.returnLocationId) }}
                            </template>
                          </template>
                        </template>
                      </v-autocomplete>
                      <v-row dense>
                        <v-col cols="6">
                          <v-text-field
                            v-model="reservationForm.returnDate"
                            type="date"
                            label="Tarih"
                            density="comfortable"
                            variant="outlined"
                            prepend-inner-icon="mdi-calendar"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model="reservationForm.returnTime"
                            type="time"
                            label="Saat"
                            density="comfortable"
                            variant="outlined"
                            prepend-inner-icon="mdi-clock-outline"
                            hide-details
                          />
                        </v-col>
                      </v-row>
                    </div>

                    <!-- Araçları Getir Butonu -->
                    <v-btn
                      color="primary"
                      size="large"
                      prepend-icon="mdi-car-search"
                      @click="loadAvailableVehicles"
                      :loading="loadingVehicles"
                      :disabled="!canLoadVehicles"
                      block
                      class="mb-4"
                    >
                      Araçları Getir
                    </v-btn>

                    <!-- Rezervasyon Alış / Dönüş Bilgileri Özeti -->
                    <v-card variant="outlined" v-if="reservationForm.pickupLocationId && reservationForm.returnLocationId" class="bg-grey-lighten-5">
                      <v-card-text class="pa-3">
                        <div class="text-subtitle-2 font-weight-bold mb-2">Rezervasyon Alış / Dönüş Bilgileri</div>
                        <div class="text-body-2">
                          <div class="mb-1">
                            <strong>Alış:</strong> {{ getSelectedLocationName(reservationForm.pickupLocationId) }} - 
                            {{ formatDate(reservationForm.pickupDate) }} {{ reservationForm.pickupTime }}
                          </div>
                          <div>
                            <strong>Dönüş:</strong> {{ getSelectedLocationName(reservationForm.returnLocationId) }} - 
                            {{ formatDate(reservationForm.returnDate) }} {{ reservationForm.returnTime }}
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Sağ Kolon: Müşteri ve Fiyat Detayları -->
              <v-col cols="12" md="6" class="reservation-details-col">
                <!-- Müşteri Seçimi -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="pa-3 bg-grey-lighten-4">
                    <h3 class="text-subtitle-1 font-weight-bold">Müşteri Seçimi</h3>
                  </v-card-title>
                  <v-divider />
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center gap-2 mb-4">
                      <v-select
                        v-model="reservationForm.customerId"
                        :items="availableCustomers"
                        item-title="fullName"
                        item-value="id"
                        label="Müşteri Seçimi"
                        density="comfortable"
                        variant="outlined"
                        prepend-inner-icon="mdi-account-search"
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
                              <v-icon
                                v-else
                                icon="mdi-account"
                                color="success"
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
                        size="large"
                      >
                        Müşteri Ekle
                      </v-btn>
                    </div>

                    <!-- Müşteri Bilgileri -->
                    <v-expand-transition>
                      <div v-if="selectedCustomer" class="customer-info-section">
                        <v-row dense>
                          <v-col cols="6" md="4">
                            <v-text-field
                              v-model="customerInfo.country"
                              label="Ülke"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="4">
                            <v-text-field
                              v-model="customerInfo.fullName"
                              label="Müşteri"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="4">
                            <v-text-field
                              v-model="customerInfo.email"
                              label="Email"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="4">
                            <v-text-field
                              v-model="customerInfo.mobile"
                              label="Mobil"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="4">
                            <v-text-field
                              v-model="customerInfo.phone"
                              label="Tel"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="4">
                            <v-text-field
                              v-model="customerInfo.birthDate"
                              label="D.Tarihi"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="4">
                            <v-text-field
                              v-model="customerInfo.gender"
                              label="Cinsiyet"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="4">
                            <v-text-field
                              :model-value="customerInfo.isBlacklisted ? 'Evet' : 'Hayır'"
                              label="Kara Liste"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                              :color="customerInfo.isBlacklisted ? 'error' : 'success'"
                            />
                          </v-col>
                        </v-row>

                        <!-- Müşteri Puanları -->
                        <v-row dense class="mt-2">
                          <v-col cols="6">
                            <v-text-field
                              :model-value="customerInfo.totalPoints"
                              label="Toplam Puan"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              :model-value="customerInfo.remainingPoints"
                              label="Kalan Puan"
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                        </v-row>

                        <!-- Rezervasyon Durum Sayıları -->
                        <v-row dense class="mt-2">
                          <v-col cols="6" md="3">
                            <v-text-field
                              :model-value="customerInfo.canceledReservations"
                              label="İptal Rez."
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="3">
                            <v-text-field
                              :model-value="customerInfo.approvedReservations"
                              label="Onaylı Rez."
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="3">
                            <v-text-field
                              :model-value="customerInfo.pendingReservations"
                              label="Beklemede Rez."
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6" md="3">
                            <v-text-field
                              :model-value="customerInfo.completedReservations"
                              label="Tamamlanan Rez."
                              density="compact"
                              variant="outlined"
                              readonly
                              hide-details
                            />
                          </v-col>
                        </v-row>
                      </div>
                    </v-expand-transition>
                  </v-card-text>
                </v-card>

                <!-- Fiyat Detayları -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="pa-3 bg-grey-lighten-4">
                    <h3 class="text-subtitle-1 font-weight-bold">Fiyat Detayları</h3>
                  </v-card-title>
                  <v-divider />
                  <v-card-text class="pa-4">
                    <v-row dense>
                      <v-col cols="6" md="4">
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
                      <v-col cols="6" md="4">
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
                      <v-col cols="6" md="4">
                        <v-text-field
                          :model-value="formatPrice(calculateExtrasTotal(), reservationForm.currencyCode)"
                          label="Ekstra Ücreti"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-text-field
                          :model-value="formatPrice(getDeliveryFee(), reservationForm.currencyCode)"
                          label="Teslim Ücreti"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-text-field
                          :model-value="formatPrice(getDropFee(), reservationForm.currencyCode)"
                          label="Drop Ücreti"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-text-field
                          :model-value="selectedVehicle ? formatPrice(selectedVehicle.dailyPrice || 0, reservationForm.currencyCode) : '0'"
                          label="Günlük Fiyat"
                          density="compact"
                          variant="outlined"
                          readonly
                          hide-details
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="reservationForm.paymentMethod"
                          :items="paymentMethodOptions"
                          item-title="label"
                          item-value="value"
                          label="Ödeme Yöntemi"
                          density="comfortable"
                          variant="outlined"
                          prepend-inner-icon="mdi-credit-card"
                          hide-details
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          :model-value="formatPrice(calculateTotalAmount(), reservationForm.currencyCode)"
                          label="Ödenecek Tutar"
                          density="comfortable"
                          variant="outlined"
                          prepend-inner-icon="mdi-cash"
                          readonly
                          hide-details
                          class="font-weight-bold text-h6"
                          color="primary"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="reservationForm.discountedAmount"
                          label="İndirimli Tutar"
                          type="number"
                          density="comfortable"
                          variant="outlined"
                          prepend-inner-icon="mdi-tag"
                          hide-details
                          :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Alt Kısım: Kaydet Butonu -->
            <v-card variant="flat" color="primary" class="mt-4">
              <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn
                  color="white"
                  size="x-large"
                  prepend-icon="mdi-content-save"
                  @click="saveReservation"
                  :loading="savingReservation"
                  :disabled="!canSaveReservation"
                >
                  REZERVASYONU KAYDET
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

// Data
const reservations = ref<ReservationDto[]>([]);
const locations = ref<LocationDto[]>([]);
const customers = ref<CustomerDto[]>([]);
const vehicles = ref<VehicleDto[]>([]);
const vehicleBrands = ref<VehicleBrandDto[]>([]);
const vehicleModels = ref<VehicleModelDto[]>([]);
const availableVehicles = ref<AvailableVehicleDto[]>([]);
const extras = ref<ExtraDto[]>([]);
const selectedExtras = ref<string[]>([]);

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

// Get tomorrow's date
const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
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
  returnDate: getTomorrowDate(),
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
  isBlacklisted: false,
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
  metaTitle?: string;
  parentId?: string | null;
  parent?: LocationDto | null;
  type?: 'merkez' | 'otel' | 'havalimani' | 'adres';
  sort?: number;
  deliveryFee?: number;
  dropFee?: number;
  minDayCount?: number;
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
  brandId?: string | null;
  modelId?: string | null;
  brand?: { id: string; name: string } | null;
  model?: { id: string; name: string } | null;
  brandName?: string | null;
  modelName?: string | null;
  plates?: Array<{ plateNumber: string; isActive: boolean }>;
  baseRate?: number;
  currencyCode?: string;
}

interface VehicleBrandDto {
  id: string;
  name: string;
}

interface VehicleModelDto {
  id: string;
  name: string;
  brandId: string;
}

interface AvailableVehicleDto {
  id: string;
  name: string;
  brandName?: string | null;
  modelName?: string | null;
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
  vehicleId?: string;
  plateId?: string;
}

interface ExtraDto {
  id: string;
  name: string;
  price: number;
  isMandatory: boolean;
  isActive: boolean;
  canIncreaseQuantity?: boolean;
  image?: string;
  value?: string;
  inputName?: string;
  type?: 'insurance' | 'extra';
  salesType?: 'daily' | 'per_rental';
}

// Location type options
const locationTypeOptions = [
  { label: 'Merkez', value: 'merkez' },
  { label: 'Otel', value: 'otel' },
  { label: 'Havalimanı', value: 'havalimani' },
  { label: 'Adres', value: 'adres' },
];

// Helper function to get location type label
const getLocationTypeLabel = (type?: string): string => {
  const option = locationTypeOptions.find(o => o.value === type);
  return option?.label || type || '';
};

// Helper function to get location icon based on type
const getLocationIcon = (type?: string): string => {
  const iconMap: Record<string, string> = {
    merkez: 'mdi-office-building',
    otel: 'mdi-bed',
    havalimani: 'mdi-airplane',
    adres: 'mdi-map-marker',
  };
  return iconMap[type || 'adres'] || 'mdi-map-marker';
};

// Helper function to format location name with type
const formatLocationDisplayName = (location: LocationDto): string => {
  const name = location.name || 'Lokasyon';
  const type = location.type;
  
  // Create display name based on type
  if (type === 'havalimani') {
    return `${name} (${location.metaTitle || name.substring(0, 3).toUpperCase()})`;
  } else if (type === 'otel') {
    return `${name} Teslimi${location.metaTitle ? ` (${location.metaTitle})` : ''}`;
  } else if (type === 'merkez') {
    return `${name} Büro${location.metaTitle ? ` (${location.metaTitle})` : ''}`;
  }
  
  return name;
};

// Computed: Grouped locations with merkez as option groups
const availableLocations = computed(() => {
  const activeLocations = locations.value.filter(loc => loc.isActive);
  
  // Get all merkez locations
  const merkezLocations = activeLocations.filter(loc => loc.type === 'merkez');
  
  // Build grouped structure
  const grouped: Array<{
    type: 'divider' | 'subheader';
    title?: string;
    children?: Array<{
      id: string;
      name: string;
      title: string;
      icon: string;
      type: string;
    }>;
  }> = [];
  
  // Sort merkez locations by sort field or name
  const sortedMerkez = [...merkezLocations].sort((a, b) => {
    if (a.sort !== undefined && b.sort !== undefined) {
      return a.sort - b.sort;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
  
  // For each merkez, create a group with its children (exclude merkez itself from selectable items)
  sortedMerkez.forEach(merkez => {
    const children = activeLocations
      .filter(loc => {
        // Only include children, exclude merkez itself and any other merkez types
        return loc.parentId === merkez.id && loc.type !== 'merkez';
      })
      .sort((a, b) => {
        // Sort children: havalimani first, then otel, then others
        const typeOrder: Record<string, number> = {
          havalimani: 1,
          otel: 2,
          adres: 3,
        };
        const aOrder = typeOrder[a.type || ''] || 4;
        const bOrder = typeOrder[b.type || ''] || 4;
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // Then by sort field or name
        if (a.sort !== undefined && b.sort !== undefined) {
          return a.sort - b.sort;
        }
        return (a.name || '').localeCompare(b.name || '');
      })
      .map(loc => ({
        id: loc.id,
        name: formatLocationDisplayName(loc),
        title: formatLocationDisplayName(loc),
        icon: getLocationIcon(loc.type),
        type: loc.type || '',
      }));
    
    // Only add merkez as group header if it has children (merkez itself is NOT selectable)
    if (children.length > 0) {
      grouped.push({
        type: 'subheader',
        title: merkez.name || 'Merkez',
        children: children,
      });
    }
  });
  
  // Also include standalone locations (those without parent or parent not merkez)
  const standaloneLocations = activeLocations.filter(loc => {
    if (loc.type === 'merkez') return false; // Skip merkez, they're groups
    if (!loc.parentId) return true; // Include locations without parent
    // Check if parent is merkez
    const parent = activeLocations.find(p => p.id === loc.parentId);
    return !parent || parent.type !== 'merkez';
  });
  
  if (standaloneLocations.length > 0) {
    grouped.push({
      type: 'subheader',
      title: 'Diğer Lokasyonlar',
      children: standaloneLocations.map(loc => ({
        id: loc.id,
        name: formatLocationDisplayName(loc),
        title: formatLocationDisplayName(loc),
        icon: getLocationIcon(loc.type),
        type: loc.type || '',
      })),
    });
  }
  
  return grouped;
});

// Flatten locations for autocomplete search (exclude merkez locations - they are only group headers)
const locationSearchQuery = ref('');
const flattenedLocations = computed(() => {
  const flat: Array<{
    id: string;
    title: string;
    name: string;
    icon: string;
    type: string;
    group?: string;
  }> = [];
  
  availableLocations.value.forEach(group => {
    if (group.children) {
      // Only add children, exclude any merkez type locations
      group.children
        .filter(child => child.type !== 'merkez')
        .forEach(child => {
          flat.push({
            ...child,
            title: child.name,
            group: group.title,
          });
        });
    }
  });
  
  // Filter by search query if exists
  if (locationSearchQuery.value) {
    const query = locationSearchQuery.value.toLowerCase();
    return flat.filter(loc => 
      loc.name.toLowerCase().includes(query) ||
      loc.type.toLowerCase().includes(query) ||
      (loc.group && loc.group.toLowerCase().includes(query))
    );
  }
  
  return flat;
});

// Filtered locations for search (only show when searching)
const filteredLocationsForSearch = computed(() => {
  if (!locationSearchQuery.value) {
    return [];
  }
  return flattenedLocations.value;
});

// Helper function to get location name by ID
const getSelectedLocationName = (locationId: string | null | undefined): string => {
  if (!locationId) return '';
  
  // First try to find in flattened locations
  const flattened = flattenedLocations.value.find(loc => loc.id === locationId);
  if (flattened) return flattened.name;
  
  // Then try to find in all locations
  const location = locations.value.find(loc => loc.id === locationId);
  if (location) {
    return formatLocationDisplayName(location);
  }
  
  return '';
};

// Refs for autocomplete components
const pickupLocationAutocomplete = ref<any>(null);
const returnLocationAutocomplete = ref<any>(null);

// Method to handle pickup location selection from prepend-item
const selectPickupLocation = (locationId: string) => {
  reservationForm.pickupLocationId = locationId;
  locationSearchQuery.value = ''; // Clear search query when selecting from prepend-item
  // Close the autocomplete menu
  nextTick(() => {
    if (pickupLocationAutocomplete.value) {
      pickupLocationAutocomplete.value.blur();
    }
  });
};

// Method to handle return location selection from prepend-item
const selectReturnLocation = (locationId: string) => {
  reservationForm.returnLocationId = locationId;
  locationSearchQuery.value = ''; // Clear search query when selecting from prepend-item
  // Close the autocomplete menu
  nextTick(() => {
    if (returnLocationAutocomplete.value) {
      returnLocationAutocomplete.value.blur();
    }
  });
};

// Handler for when pickup location is selected from items list
const onPickupLocationSelected = (value: string | null) => {
  if (value) {
    locationSearchQuery.value = ''; // Clear search query
    nextTick(() => {
      if (pickupLocationAutocomplete.value) {
        pickupLocationAutocomplete.value.blur();
      }
    });
  }
};

// Handler for when return location is selected from items list
const onReturnLocationSelected = (value: string | null) => {
  if (value) {
    locationSearchQuery.value = ''; // Clear search query
    nextTick(() => {
      if (returnLocationAutocomplete.value) {
        returnLocationAutocomplete.value.blur();
      }
    });
  }
};

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
    reservationForm.returnDate &&
    reservationForm.pickupTime &&
    reservationForm.returnTime
  );
});

const canSaveReservation = computed(() => {
  return !!(
    reservationForm.pickupLocationId &&
    reservationForm.returnLocationId &&
    reservationForm.pickupDate &&
    reservationForm.returnDate &&
    reservationForm.pickupTime &&
    reservationForm.returnTime &&
    reservationForm.customerId &&
    reservationForm.vehicleId &&
    !customerInfo.isBlacklisted
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
  try {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return date;
  }
};

const formatPrice = (price: number | string | null | undefined, currencyCode: string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) || 0 : (price || 0);
  return `${Number(numPrice).toFixed(2)} ${getCurrencySymbol(currencyCode)}`;
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
  try {
    const pickup = new Date(reservationForm.pickupDate);
    const returnDate = new Date(reservationForm.returnDate);
    
    // Validate dates
    if (isNaN(pickup.getTime()) || isNaN(returnDate.getTime())) return 0;
    
    // If return date is before pickup date, return 0
    if (returnDate < pickup) return 0;
    
    const diffTime = returnDate.getTime() - pickup.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; // Minimum 1 day
  } catch {
    return 0;
  }
};

const getPickupLocation = () => {
  return locations.value.find(l => l.id === reservationForm.pickupLocationId);
};

const getReturnLocation = () => {
  return locations.value.find(l => l.id === reservationForm.returnLocationId);
};

const getDeliveryFee = (): number => {
  const location = getPickupLocation();
  if (!location) return 0;
  const fee = location.deliveryFee || 0;
  return typeof fee === 'string' ? parseFloat(fee) || 0 : Number(fee) || 0;
};

const getDropFee = (): number => {
  const location = getReturnLocation();
  if (!location) return 0;
  const fee = location.dropFee || 0;
  return typeof fee === 'string' ? parseFloat(fee) || 0 : Number(fee) || 0;
};

const calculateRentalPrice = (vehicle: AvailableVehicleDto): number => {
  const days = calculateDays();
  const dailyPrice = typeof vehicle.dailyPrice === 'string' ? parseFloat(vehicle.dailyPrice) || 0 : (vehicle.dailyPrice || 0);
  return Number(dailyPrice) * days;
};

const calculateTotalPrice = (vehicle: AvailableVehicleDto): number => {
  const rentalPrice = calculateRentalPrice(vehicle);
  const deliveryFee = getDeliveryFee();
  const dropFee = getDropFee();
  return rentalPrice + deliveryFee + dropFee;
};

const calculateExtrasTotal = (): number => {
  const days = calculateDays();
  return selectedExtras.value.reduce((total, extraId) => {
    const extra = extras.value.find(e => e.id === extraId);
    if (!extra || !extra.isActive) return total;
    
    const price = typeof extra.price === 'string' ? parseFloat(extra.price) || 0 : (extra.price || 0);
    const numPrice = Number(price);
    
    if (extra.salesType === 'daily') {
      return total + (numPrice * days);
    } else {
      return total + numPrice;
    }
  }, 0);
};

const calculateTotalAmount = (): number => {
  if (!selectedVehicle.value) return 0;
  const rentalPrice = calculateRentalPrice(selectedVehicle.value);
  const deliveryFee = getDeliveryFee();
  const dropFee = getDropFee();
  const nonRentalFee = Number(reservationForm.nonRentalFee) || 0;
  const extrasTotal = calculateExtrasTotal();
  const discountedAmount = Number(reservationForm.discountedAmount) || 0;
  
  const total = rentalPrice + deliveryFee + dropFee + nonRentalFee + extrasTotal;
  return Math.max(0, total - discountedAmount);
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
    const { data } = await http.get<ReservationDto[]>('/reservations', {
      params: { tenantId: auth.tenant.id },
    });
    reservations.value = data || [];
  } catch (error) {
    console.error('Failed to load reservations:', error);
    reservations.value = [];
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
    locations.value = (data || []).filter(loc => loc.isActive !== false);
  } catch (error) {
    console.error('Failed to load locations:', error);
    locations.value = [];
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

const loadCustomerReservationStats = async (customerId: string) => {
  if (!auth.tenant || !customerId) return;
  try {
    // Load all reservations for this customer
    const { data } = await http.get<ReservationDto[]>('/reservations', {
      params: { 
        tenantId: auth.tenant.id,
        customerId: customerId,
      },
    });
    
    const customerReservations = data || [];
    customerInfo.canceledReservations = customerReservations.filter(r => r.status === 'İptal' || r.status === 'cancelled').length;
    customerInfo.approvedReservations = customerReservations.filter(r => r.status === 'Onaylandı' || r.status === 'confirmed').length;
    customerInfo.pendingReservations = customerReservations.filter(r => r.status === 'Beklemede' || r.status === 'pending').length;
    customerInfo.completedReservations = customerReservations.filter(r => r.status === 'Tamamlandı' || r.status === 'completed').length;
  } catch (error) {
    console.error('Failed to load customer reservation stats:', error);
    // Reset stats on error
    customerInfo.canceledReservations = 0;
    customerInfo.approvedReservations = 0;
    customerInfo.pendingReservations = 0;
    customerInfo.completedReservations = 0;
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
    customers.value = [];
  } finally {
    loadingCustomers.value = false;
  }
};

const loadVehicleBrands = async () => {
  try {
    const { data } = await http.get<VehicleBrandDto[]>('/vehicle-brands');
    vehicleBrands.value = data || [];
  } catch (error) {
    console.error('Failed to load vehicle brands:', error);
    vehicleBrands.value = [];
  }
};

const loadVehicleModels = async () => {
  try {
    const { data } = await http.get<VehicleModelDto[]>('/vehicle-models');
    vehicleModels.value = data || [];
  } catch (error) {
    console.error('Failed to load vehicle models:', error);
    vehicleModels.value = [];
  }
};

const loadVehicles = async () => {
  if (!auth.tenant) return;
  loadingVehicles.value = true;
  try {
    // Load brands and models first
    await Promise.all([loadVehicleBrands(), loadVehicleModels()]);
    
    const { data } = await http.get<VehicleDto[]>('/rentacar/vehicles', {
      params: { tenantId: auth.tenant.id },
    });
    
    // Resolve brandName and modelName from relations or IDs
    vehicles.value = (data || []).map(vehicle => {
      let brandName = vehicle.brandName || null;
      let modelName = vehicle.modelName || null;
      
      // First try: brand/model relations
      if (!brandName && vehicle.brand?.name) {
        brandName = vehicle.brand.name;
      }
      // Second try: lookup from brands list using brandId
      else if (!brandName && vehicle.brandId && vehicleBrands.value.length > 0) {
        const brand = vehicleBrands.value.find(b => b.id === vehicle.brandId);
        brandName = brand?.name || null;
      }
      
      if (!modelName && vehicle.model?.name) {
        modelName = vehicle.model.name;
      }
      // Second try: lookup from models list using modelId
      else if (!modelName && vehicle.modelId && vehicleModels.value.length > 0) {
        const model = vehicleModels.value.find(m => m.id === vehicle.modelId);
        modelName = model?.name || null;
      }
      
      return {
        ...vehicle,
        brandName: brandName || null,
        modelName: modelName || null,
      };
    });
  } catch (error) {
    console.error('Failed to load vehicles:', error);
    vehicles.value = [];
  } finally {
    loadingVehicles.value = false;
  }
};

const isVehicleReserved = (vehicle: VehicleDto): boolean => {
  if (!reservationForm.pickupDate || !reservationForm.returnDate) return false;
  
  try {
    const pickupDate = new Date(reservationForm.pickupDate);
    const returnDate = new Date(reservationForm.returnDate);
    pickupDate.setHours(0, 0, 0, 0);
    returnDate.setHours(23, 59, 59, 999);
    
    // Rezervasyonlarda bu araç için çakışma kontrolü
    return reservations.value.some(reservation => {
      if (reservation.vehicleId !== vehicle.id) return false;
      if (!reservation.pickupDate || !reservation.returnDate) return false;
      
      try {
        const resPickup = new Date(reservation.pickupDate);
        const resReturn = new Date(reservation.returnDate);
        resPickup.setHours(0, 0, 0, 0);
        resReturn.setHours(23, 59, 59, 999);
        
        // Çakışma kontrolü: yeni rezervasyon mevcut rezervasyonla çakışıyor mu?
        return (
          (pickupDate >= resPickup && pickupDate <= resReturn) ||
          (returnDate >= resPickup && returnDate <= resReturn) ||
          (pickupDate <= resPickup && returnDate >= resReturn)
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
};

const loadAvailableVehicles = async () => {
  if (!canLoadVehicles.value) {
    alert('Lütfen alış ve dönüş lokasyonu, tarih ve saat bilgilerini giriniz.');
    return;
  }
  
  // Validate dates
  const pickupDate = new Date(reservationForm.pickupDate);
  const returnDate = new Date(reservationForm.returnDate);
  
  if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) {
    alert('Geçersiz tarih formatı!');
    return;
  }
  
  if (returnDate < pickupDate) {
    alert('Dönüş tarihi alış tarihinden önce olamaz!');
    return;
  }
  
  loadingVehicles.value = true;
  try {
    const days = calculateDays();
    const pickupLocation = getPickupLocation();
    const returnLocation = getReturnLocation();
    
    if (!pickupLocation || !returnLocation) {
      alert('Lokasyon bilgileri bulunamadı!');
      return;
    }
    
    // Rezervasyonda olmayan araçları filtrele
    const available = vehicles.value.filter(vehicle => {
      // Aktif olmayan araçları filtrele
      if (!vehicle.baseRate || vehicle.baseRate === 0) return false;
      
      // Rezervasyonda olan araçları filtrele
      return !isVehicleReserved(vehicle);
    });
    
    availableVehicles.value = available.map(vehicle => {
      const dailyPrice = Number(vehicle.baseRate) || 0;
      const rentalPrice = dailyPrice * days;
      const deliveryFee = Number(pickupLocation.deliveryFee) || 0;
      const dropFee = Number(returnLocation.dropFee) || 0;
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
    
    if (availableVehicles.value.length === 0) {
      alert('Seçilen tarihler için müsait araç bulunamadı.');
    }
  } catch (error) {
    console.error('Failed to load available vehicles:', error);
    alert('Araçlar yüklenirken bir hata oluştu.');
  } finally {
    loadingVehicles.value = false;
  }
};

const selectVehicle = (_event: any, { item }: { item: AvailableVehicleDto }) => {
  selectedVehicle.value = item;
  reservationForm.vehicleId = item.id;
};

// Watch return location and date/time to update vehicle's last location
watch(
  () => [reservationForm.returnLocationId, reservationForm.returnDate, reservationForm.returnTime, reservationForm.vehicleId],
  async ([returnLocationId, returnDate, returnTime, vehicleId]) => {
    // Only update if all required fields are filled and vehicle is selected
    if (returnLocationId && returnDate && returnTime && vehicleId) {
      try {
        await http.put(`/rentacar/vehicles/${vehicleId}/last-return-location`, {
          locationId: returnLocationId,
        });
        // Optionally reload vehicles to reflect the change
        // await loadVehicles();
      } catch (error: any) {
        console.error('Failed to update vehicle last location:', error);
        // Don't show alert to user as this is an automatic background update
      }
    }
  },
  { deep: true }
);

// Watch for date changes to validate
watch(
  () => [reservationForm.pickupDate, reservationForm.returnDate],
  ([pickupDate, returnDate]) => {
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);
      
      if (returnD < pickup) {
        // Auto-correct: set return date to pickup date + 1 day
        const tomorrow = new Date(pickup);
        tomorrow.setDate(tomorrow.getDate() + 1);
        reservationForm.returnDate = tomorrow.toISOString().split('T')[0];
      }
    }
  }
);

const onCustomerSelect = async (customerId: string) => {
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
  customerInfo.isBlacklisted = blacklistedIds.includes(customerId);
  customerInfo.totalPoints = 0; // TODO: Load from backend
  customerInfo.remainingPoints = 0; // TODO: Load from backend
  
  // Load customer reservation statistics
  await loadCustomerReservationStats(customerId);
};

const resetCustomerInfo = () => {
  customerInfo.country = '';
  customerInfo.fullName = '';
  customerInfo.email = '';
  customerInfo.mobile = '';
  customerInfo.phone = '';
  customerInfo.birthDate = '';
  customerInfo.gender = '';
  customerInfo.isBlacklisted = false;
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
  if (!auth.tenant || !canSaveReservation.value) {
    alert('Lütfen tüm zorunlu alanları doldurunuz.');
    return;
  }
  
  // Kara liste kontrolü
  const blacklistedIds = getBlacklistedCustomers();
  if (blacklistedIds.includes(reservationForm.customerId)) {
    alert('Kara listedeki müşteriler için rezervasyon oluşturulamaz!');
    return;
  }
  
  // Date validation
  const pickupDate = new Date(reservationForm.pickupDate);
  const returnDate = new Date(reservationForm.returnDate);
  
  if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) {
    alert('Geçersiz tarih formatı!');
    return;
  }
  
  if (returnDate < pickupDate) {
    alert('Dönüş tarihi alış tarihinden önce olamaz!');
    return;
  }
  
  // Vehicle validation
  if (!selectedVehicle.value) {
    alert('Lütfen bir araç seçiniz!');
    return;
  }
  
  savingReservation.value = true;
  try {
    const reservationData = {
      tenantId: auth.tenant.id,
      type: 'rentacar',
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
      nonRentalFee: Number(reservationForm.nonRentalFee) || 0,
      extraFee: calculateExtrasTotal(),
      extraIds: selectedExtras.value,
      paymentMethod: reservationForm.paymentMethod,
      discountedAmount: Number(reservationForm.discountedAmount) || 0,
      totalAmount: calculateTotalAmount(),
    };
    
    await http.post('/reservations', reservationData);
    
    alert('Rezervasyon başarıyla kaydedildi');
    resetReservationForm();
    mainTab.value = 'list';
    await loadReservations();
  } catch (error: any) {
    console.error('Failed to save reservation:', error);
    alert(error.response?.data?.message || error.message || 'Rezervasyon kaydedilirken bir hata oluştu');
  } finally {
    savingReservation.value = false;
  }
};

// Ekstra Hizmetler
const getAddedExtras = (): ExtraDto[] => {
  try {
    const added = localStorage.getItem('crm_added_extras');
    return added ? JSON.parse(added) : [];
  } catch {
    return [];
  }
};

const availableExtras = computed(() => {
  return extras.value.filter(extra => extra.isActive);
});

const isExtraSelected = (extraId: string): boolean => {
  return selectedExtras.value.includes(extraId);
};

const toggleExtra = (extra: ExtraDto) => {
  if (extra.isMandatory) return; // Zorunlu ekstralar seçilemez/seçilemez yapılamaz
  
  const index = selectedExtras.value.indexOf(extra.id);
  if (index > -1) {
    selectedExtras.value.splice(index, 1);
  } else {
    selectedExtras.value.push(extra.id);
  }
  
  // Ekstra ücreti güncelle
  reservationForm.extraFee = calculateExtrasTotal();
};

const loadExtras = async () => {
  if (!auth.tenant) return;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // const { data } = await http.get<ExtraDto[]>('/crm/extras', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // extras.value = data.filter(e => e.isActive);
    
    // localStorage'dan ekstra hizmetleri yükle
    const addedExtras = getAddedExtras();
    extras.value = addedExtras.filter(e => e.isActive);
  } catch (error) {
    console.error('Failed to load extras:', error);
    extras.value = [];
  }
};

const resetReservationForm = () => {
  reservationForm.currencyCode = 'TRY';
  reservationForm.source = 'office';
  reservationForm.pickupLocationId = '';
  reservationForm.pickupDate = getTodayDate();
  reservationForm.pickupTime = '09:00';
  reservationForm.returnLocationId = '';
  reservationForm.returnDate = getTomorrowDate();
  reservationForm.returnTime = '09:00';
  reservationForm.customerId = '';
  reservationForm.vehicleId = '';
  reservationForm.nonRentalFee = 0;
  reservationForm.extraFee = 0;
  reservationForm.paymentMethod = 'cash';
  reservationForm.discountedAmount = 0;
  selectedVehicle.value = null;
  availableVehicles.value = [];
  selectedExtras.value = [];
  resetCustomerInfo();
};

const editReservation = (reservation: ReservationDto) => {
  // TODO: Rezervasyon düzenleme özelliği eklenecek
  alert(`Rezervasyon düzenleme: ${reservation.id}`);
};

const deleteReservation = async (id: string) => {
  if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/reservations/${id}`);
    await loadReservations();
    alert('Rezervasyon başarıyla silindi');
  } catch (error: any) {
    console.error('Failed to delete reservation:', error);
    alert(error.response?.data?.message || 'Rezervasyon silinirken bir hata oluştu');
  }
};

onMounted(async () => {
  await Promise.all([
    loadReservations(),
    loadLocations(),
    loadCustomers(),
    loadVehicles(),
    loadExtras(),
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

.reservation-new-page {
  padding: 24px;
}

.reservation-content-row {
  margin: 0;
}

.reservation-form-col,
.reservation-details-col {
  padding: 0 12px;
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
  background-color: rgba(var(--v-theme-surface), 1);
}

.vehicle-table :deep(.v-data-table__tr) {
  cursor: pointer;
}

.vehicle-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.vehicle-table :deep(.selected-vehicle) {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}

.customer-info-section {
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
  padding-top: 16px;
  margin-top: 16px;
}

@media (max-width: 960px) {
  .reservation-form-col,
  .reservation-details-col {
    padding: 0;
    margin-bottom: 16px;
  }
}
</style>
