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
            <!-- Wizard Steps Indicator -->
            <v-card variant="outlined" class="mb-4">
              <v-card-text class="pa-4">
                <v-stepper v-model="currentStep" alt-labels>
                  <v-stepper-header>
                    <template v-for="(step, index) in steps" :key="step.number">
                      <v-stepper-item
                        :value="step.number"
                        :title="step.title"
                        :complete="currentStep > step.number"
                        :icon="step.icon"
                        editable
                        @click="goToStep(step.number)"
                      />
                      <v-divider v-if="index < steps.length - 1" />
                    </template>
                  </v-stepper-header>
                </v-stepper>
              </v-card-text>
            </v-card>

            <!-- Step 1: Lokasyon & Tarih -->
            <v-card variant="outlined" class="mb-4" v-if="currentStep === 1">
              <v-card-title class="pa-4 bg-primary text-white">
                <v-icon icon="mdi-calendar-marker" class="mr-2" />
                Lokasyon & Tarih Bilgileri
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-6">
                <!-- Para Birimi ve Rezervasyon Kaynağı -->
                <v-row dense class="mb-4">
                  <v-col cols="12" md="6">
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
                  <v-col cols="12" md="6">
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
                    :items="locationSearchQuery ? flattenedLocations : []"
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
                          <span class="font-weight-medium">{{ item.raw?.name || item.raw?.title || item.title }}</span>
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
                    <template #selection>
                      <span v-if="reservationForm.pickupLocationId">
                        {{ getSelectedLocationName(reservationForm.pickupLocationId) }}
                      </span>
                      <span v-else>Alış Yeri Seçiniz</span>
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

                <!-- Dönüş Tarih Saat Bilgileri -->
                <div class="mb-4">
                  <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                    <v-icon icon="mdi-calendar-range" size="18" class="mr-1" color="success" />
                    Dönüş Tarih Saat Bilgileri
                  </div>
                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field
                        v-model="reservationForm.returnDate"
                        type="date"
                        label="Dönüş Tarihi"
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
                        label="Dönüş Saati"
                        density="comfortable"
                        variant="outlined"
                        prepend-inner-icon="mdi-clock-outline"
                        hide-details
                      />
                    </v-col>
                  </v-row>

                  <!-- Dönüş Lokasyonu Farklı mı? -->
                  <div class="mt-3">
                    <v-checkbox
                      v-model="reservationForm.sameReturnLocation"
                      label="Dönüş lokasyonu alış lokasyonu ile aynı"
                      density="comfortable"
                      hide-details
                      @update:model-value="onSameReturnLocationChanged"
                    />
                  </div>
                </div>

                <!-- Dönüş Lokasyon (Sadece farklı seçilirse) -->
                <div class="mb-4" v-if="!reservationForm.sameReturnLocation">
                  <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                    <v-icon icon="mdi-map-marker-check-outline" size="18" class="mr-1" color="success" />
                    Dönüş Lokasyon
                  </div>
                  <v-autocomplete
                    v-model="reservationForm.returnLocationId"
                    :items="locationSearchQuery ? flattenedLocations : []"
                    item-title="title"
                    item-value="id"
                    label="Dönüş Yeri Seçiniz"
                    placeholder="Dönüş Yeri Seçiniz"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="mdi-map-marker-check"
                    hide-details
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
                          <span class="font-weight-medium">{{ item.raw?.name || item.raw?.title || item.title }}</span>
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
                    <template #selection>
                      <span v-if="reservationForm.returnLocationId">
                        {{ getSelectedLocationName(reservationForm.returnLocationId) }}
                      </span>
                      <span v-else>Dönüş Yeri Seçiniz</span>
                    </template>
                  </v-autocomplete>
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
                >
                  Araçları Getir ve Devam Et
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Step 2: Araç Seçimi -->
            <v-card variant="outlined" class="mb-4" v-if="currentStep === 2">
              <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-car" class="mr-2" />
                  Araç Seçimi
                </div>
                <v-btn icon="mdi-close" variant="text" color="white" @click="currentStep = 1" />
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

            <!-- Step 3: Ekstra Hizmetler -->
            <v-card variant="outlined" class="mb-4" v-if="currentStep === 3">
              <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-star-plus" class="mr-2" />
                  Ekstra Hizmetler
                </div>
                <v-btn icon="mdi-close" variant="text" color="white" @click="currentStep = 2" />
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-6">
                <v-row v-if="availableExtras.length > 0">
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                    v-for="extra in availableExtras"
                    :key="extra.id"
                  >
                    <v-card
                      variant="outlined"
                      :class="{ 'border-primary': isExtraSelected(extra.id) }"
                      class="extra-card"
                      @click="toggleExtra(extra)"
                    >
                      <v-card-text class="pa-3">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <v-checkbox
                            :model-value="isExtraSelected(extra.id)"
                            @click.stop="toggleExtra(extra)"
                            density="compact"
                            hide-details
                            class="ma-0"
                          />
                          <v-chip
                            v-if="extra.isMandatory"
                            size="x-small"
                            color="error"
                            variant="flat"
                          >
                            Zorunlu
                          </v-chip>
                        </div>
                        <div class="text-body-2 font-weight-medium mb-1">{{ extra.name }}</div>
                        <div class="text-h6 font-weight-bold text-primary">
                          {{ formatPrice(getExtraDisplayPrice(extra), reservationForm.currencyCode) }}
                        </div>
                        <div class="text-caption text-medium-emphasis" v-if="extra.salesType === 'daily'">
                          Günlük
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                <v-alert v-else type="info" variant="tonal">
                  Henüz ekstra hizmet eklenmemiş.
                </v-alert>
                <v-alert
                  v-if="selectedExtras.length > 0"
                  type="success"
                  variant="tonal"
                  class="mt-4"
                >
                  <div class="d-flex align-center justify-space-between">
                    <span>Seçilen Ekstra Hizmetler Toplamı:</span>
                    <span class="text-h6 font-weight-bold">{{ formatPrice(calculateExtrasTotal(), reservationForm.currencyCode) }}</span>
                  </div>
                </v-alert>
                <div class="mt-4 d-flex justify-end">
                  <v-btn
                    color="primary"
                    size="large"
                    prepend-icon="mdi-arrow-right"
                    @click="currentStep = 4"
                  >
                    Devam Et
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- Step 4: Rezervasyon Özeti -->
            <v-card variant="outlined" class="mb-4" v-if="currentStep === 4">
              <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-file-document-outline" class="mr-2" />
                  Rezervasyon Özeti
                </div>
                <v-btn icon="mdi-close" variant="text" color="white" @click="currentStep = 3" />
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-6">
                <v-row>
                  <!-- Sol Kolon: Rezervasyon Detayları -->
                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="pa-3 bg-grey-lighten-4">
                        <h3 class="text-subtitle-1 font-weight-bold">Rezervasyon Detayları</h3>
                        <v-spacer />
                        <v-btn icon="mdi-pencil" variant="text" size="small" @click="currentStep = 1" />
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-4">
                        <div class="mb-3">
                          <div class="text-caption text-medium-emphasis">Alış Lokasyon</div>
                          <div class="text-body-1 font-weight-medium">
                            {{ getSelectedLocationName(reservationForm.pickupLocationId) }}
                          </div>
                          <div class="text-body-2">
                            {{ formatDate(reservationForm.pickupDate) }} {{ reservationForm.pickupTime }}
                          </div>
                        </div>
                        <div class="mb-3">
                          <div class="text-caption text-medium-emphasis">Dönüş Lokasyon</div>
                          <div class="text-body-1 font-weight-medium">
                            {{ getSelectedLocationName(reservationForm.returnLocationId) }}
                          </div>
                          <div class="text-body-2">
                            {{ formatDate(reservationForm.returnDate) }} {{ reservationForm.returnTime }}
                          </div>
                        </div>
                        <div class="mb-3">
                          <div class="text-caption text-medium-emphasis">Kiralama Süresi</div>
                          <div class="text-body-1 font-weight-medium">{{ calculateDays() }} Gün</div>
                        </div>
                      </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="pa-3 bg-grey-lighten-4">
                        <h3 class="text-subtitle-1 font-weight-bold">Seçilen Araç</h3>
                        <v-spacer />
                        <v-btn icon="mdi-pencil" variant="text" size="small" @click="currentStep = 2" />
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-4" v-if="selectedVehicle">
                        <div class="d-flex align-center mb-3">
                          <v-avatar size="64" color="primary" variant="tonal" class="mr-3">
                            <v-icon icon="mdi-car" size="32" />
                          </v-avatar>
                          <div>
                            <div class="text-h6 font-weight-bold">{{ selectedVehicle.name }}</div>
                            <div class="text-body-2 text-medium-emphasis">
                              {{ selectedVehicle.brandName }} | {{ selectedVehicle.modelName }}
                            </div>
                            <v-chip size="small" variant="outlined" color="primary" class="mt-1">
                              {{ selectedVehicle.plate || '-' }}
                            </v-chip>
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>

                    <v-card variant="outlined" v-if="selectedExtras.length > 0">
                      <v-card-title class="pa-3 bg-grey-lighten-4">
                        <h3 class="text-subtitle-1 font-weight-bold">Ekstra Hizmetler</h3>
                        <v-spacer />
                        <v-btn icon="mdi-pencil" variant="text" size="small" @click="currentStep = 3" />
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-4">
                        <v-list>
                          <v-list-item
                            v-for="extraId in selectedExtras"
                            :key="extraId"
                          >
                            <template #title>{{ extras.find((e: ExtraDto) => e.id === extraId)?.name || '' }}</template>
                            <template #subtitle>{{ formatPrice(getExtraDisplayPrice(extras.find((e: ExtraDto) => e.id === extraId)), reservationForm.currencyCode) }}</template>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <!-- Sağ Kolon: Fiyat Detayları -->
                  <v-col cols="12" md="6">
                    <v-card variant="outlined">
                      <v-card-title class="pa-3 bg-grey-lighten-4">
                        <h3 class="text-subtitle-1 font-weight-bold">Fiyat Detayları</h3>
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-4">
                        <v-list>
                          <v-list-item>
                            <template #prepend>
                              <v-icon icon="mdi-calendar-range" />
                            </template>
                            <v-list-item-title>Kiralama Süresi</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium">{{ calculateDays() }} Gün</span>
                            </template>
                          </v-list-item>
                          <v-list-item v-if="selectedVehicle">
                            <template #prepend>
                              <v-icon icon="mdi-currency-usd" />
                            </template>
                            <v-list-item-title>Günlük Fiyat</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium">{{ formatPrice(selectedVehicle.dailyPrice || 0, reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item v-if="selectedVehicle">
                            <template #prepend>
                              <v-icon icon="mdi-cash-multiple" />
                            </template>
                            <v-list-item-title>Kiralama Fiyatı</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium">{{ formatPrice(calculateRentalPrice(selectedVehicle), reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <template #prepend>
                              <v-icon icon="mdi-truck-delivery" />
                            </template>
                            <v-list-item-title>Teslim Ücreti</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium">{{ formatPrice(getDeliveryFee(), reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <template #prepend>
                              <v-icon icon="mdi-truck-check" />
                            </template>
                            <v-list-item-title>Drop Ücreti</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium">{{ formatPrice(getDropFee(), reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item v-if="calculateExtrasTotal() > 0">
                            <template #prepend>
                              <v-icon icon="mdi-star-plus" />
                            </template>
                            <v-list-item-title>Ekstra Hizmetler</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium">{{ formatPrice(calculateExtrasTotal(), reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item v-if="reservationForm.nonRentalFee > 0">
                            <template #prepend>
                              <v-icon icon="mdi-cash-off" />
                            </template>
                            <v-list-item-title>Kiramama Ücreti</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium">{{ formatPrice(reservationForm.nonRentalFee, reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-divider class="my-2" />
                          <v-list-item v-if="reservationForm.discountedAmount > 0">
                            <template #prepend>
                              <v-icon icon="mdi-tag" color="success" />
                            </template>
                            <v-list-item-title>İndirim</v-list-item-title>
                            <template #append>
                              <span class="font-weight-medium text-success">-{{ formatPrice(reservationForm.discountedAmount, reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <template #prepend>
                              <v-icon icon="mdi-cash" color="primary" />
                            </template>
                            <v-list-item-title class="text-h6 font-weight-bold">Toplam Tutar</v-list-item-title>
                            <template #append>
                              <span class="text-h6 font-weight-bold text-primary">{{ formatPrice(calculateTotalAmount(), reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <div class="mt-4 d-flex justify-end gap-2">
                  <v-btn
                    variant="outlined"
                    size="large"
                    prepend-icon="mdi-arrow-left"
                    @click="currentStep = 3"
                  >
                    Geri
                  </v-btn>
                  <v-btn
                    color="primary"
                    size="large"
                    prepend-icon="mdi-arrow-right"
                    @click="currentStep = 5"
                  >
                    Devam Et
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- Step 5: Müşteri Bilgileri -->
            <v-card variant="outlined" class="mb-4" v-if="currentStep === 5">
              <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-account" class="mr-2" />
                  Müşteri Bilgileri
                </div>
                <v-btn icon="mdi-close" variant="text" color="white" @click="currentStep = 4" />
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-6">
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
                    Yeni Müşteri Ekle
                  </v-btn>
                </div>

                <!-- Müşteri Bilgileri Düzenleme Formu -->
                <v-expand-transition>
                  <v-card variant="outlined" v-if="reservationForm.customerId" class="mb-4">
                    <v-card-title class="pa-3 bg-grey-lighten-4">
                      <h3 class="text-subtitle-1 font-weight-bold">Müşteri Bilgileri</h3>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-4">
                      <v-row dense>
                        <v-col cols="6" md="4">
                          <v-text-field
                            v-model="customerInfo.country"
                            label="Ülke"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6" md="4">
                          <v-text-field
                            v-model="customerInfo.fullName"
                            label="Müşteri Adı"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6" md="4">
                          <v-text-field
                            v-model="customerInfo.email"
                            label="Email"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6" md="4">
                          <v-text-field
                            v-model="customerInfo.mobile"
                            label="Mobil"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6" md="4">
                          <v-text-field
                            v-model="customerInfo.phone"
                            label="Tel"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6" md="4">
                          <v-text-field
                            v-model="customerInfo.birthDate"
                            label="Doğum Tarihi"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6" md="4">
                          <v-select
                            v-model="customerInfo.gender"
                            :items="[
                              { label: 'Erkek', value: 'Erkek' },
                              { label: 'Kadın', value: 'Kadın' },
                              { label: 'Diğer', value: 'Diğer' },
                            ]"
                            item-title="label"
                            item-value="value"
                            label="Cinsiyet"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-expand-transition>

                <div class="mt-4 d-flex justify-end gap-2">
                  <v-btn
                    variant="outlined"
                    size="large"
                    prepend-icon="mdi-arrow-left"
                    @click="currentStep = 4"
                  >
                    Geri
                  </v-btn>
                  <v-btn
                    color="primary"
                    size="large"
                    prepend-icon="mdi-arrow-right"
                    @click="currentStep = 6"
                    :disabled="!reservationForm.customerId"
                  >
                    Devam Et
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- Step 6: Ödeme -->
            <v-card variant="outlined" class="mb-4" v-if="currentStep === 6">
              <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-credit-card" class="mr-2" />
                  Ödeme
                </div>
                <v-btn icon="mdi-close" variant="text" color="white" @click="currentStep = 5" />
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-6">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="pa-3 bg-grey-lighten-4">
                        <h3 class="text-subtitle-1 font-weight-bold">Ödeme Yöntemi</h3>
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-4">
                        <v-radio-group v-model="reservationForm.paymentMethod" inline>
                          <v-radio
                            v-for="method in paymentMethodOptions"
                            :key="method.value"
                            :value="method.value"
                            :label="method.label"
                            class="mb-2"
                          >
                            <template #label>
                              <div class="d-flex align-center">
                                <v-icon :icon="method.icon" class="mr-2" />
                                <span>{{ method.label }}</span>
                              </div>
                            </template>
                          </v-radio>
                        </v-radio-group>
                      </v-card-text>
                    </v-card>

                    <v-card variant="outlined">
                      <v-card-title class="pa-3 bg-grey-lighten-4">
                        <h3 class="text-subtitle-1 font-weight-bold">Fiyat Özeti</h3>
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-4">
                        <v-list>
                          <v-list-item>
                            <v-list-item-title>Toplam Tutar</v-list-item-title>
                            <template #append>
                              <span class="text-h6 font-weight-bold text-primary">{{ formatPrice(calculateTotalAmount(), reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>İndirim</v-list-item-title>
                            <template #append>
                              <v-text-field
                                v-model="reservationForm.discountedAmount"
                                type="number"
                                density="compact"
                                variant="outlined"
                                hide-details
                                :suffix="getCurrencySymbol(reservationForm.currencyCode)"
                                style="max-width: 150px;"
                              />
                            </template>
                          </v-list-item>
                          <v-divider class="my-2" />
                          <v-list-item>
                            <v-list-item-title class="text-h6 font-weight-bold">Ödenecek Tutar</v-list-item-title>
                            <template #append>
                              <span class="text-h6 font-weight-bold text-success">{{ formatPrice(calculateTotalAmount(), reservationForm.currencyCode) }}</span>
                            </template>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined">
                      <v-card-title class="pa-3 bg-grey-lighten-4">
                        <h3 class="text-subtitle-1 font-weight-bold">Rezervasyon Özeti</h3>
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-4">
                        <div class="mb-3">
                          <div class="text-caption text-medium-emphasis">Müşteri</div>
                          <div class="text-body-1 font-weight-medium">{{ customerInfo.fullName || '-' }}</div>
                          <div class="text-body-2">{{ customerInfo.email || '-' }}</div>
                        </div>
                        <v-divider class="my-3" />
                        <div class="mb-3">
                          <div class="text-caption text-medium-emphasis">Araç</div>
                          <div class="text-body-1 font-weight-medium">{{ selectedVehicle?.name || '-' }}</div>
                        </div>
                        <v-divider class="my-3" />
                        <div class="mb-3">
                          <div class="text-caption text-medium-emphasis">Kiralama Süresi</div>
                          <div class="text-body-1 font-weight-medium">{{ calculateDays() }} Gün</div>
                          <div class="text-body-2">
                            {{ formatDate(reservationForm.pickupDate) }} {{ reservationForm.pickupTime }} - 
                            {{ formatDate(reservationForm.returnDate) }} {{ reservationForm.returnTime }}
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <div class="mt-4 d-flex justify-end gap-2">
                  <v-btn
                    variant="outlined"
                    size="large"
                    prepend-icon="mdi-arrow-left"
                    @click="currentStep = 5"
                  >
                    Geri
                  </v-btn>
                  <v-btn
                    color="success"
                    size="x-large"
                    prepend-icon="mdi-check"
                    @click="saveReservation"
                    :loading="savingReservation"
                    :disabled="!canSaveReservation"
                  >
                    Rezervasyonu Tamamla
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

          </div>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Müşteri Ekleme Dialog -->
    <v-dialog v-model="showCustomerDialog" max-width="1400" fullscreen scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-account-plus" size="24" />
            <span class="text-h6">Müşteri Ekleme Formu</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeCustomerDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-form ref="newCustomerFormRef" v-model="newCustomerFormValid">
            <v-tabs v-model="newCustomerFormTab" show-arrows class="px-4 pt-4">
              <v-tab value="personal">
                <v-icon start icon="mdi-account" />
                Kişisel Bilgiler
              </v-tab>
              <v-tab value="personal-continued">
                <v-icon start icon="mdi-account-details" />
                Kişisel Bilgiler (Devam)
              </v-tab>
              <v-tab value="identity">
                <v-icon start icon="mdi-card-account-details" />
                Kimlik / Pasaport Bilgileri
              </v-tab>
              <v-tab value="license">
                <v-icon start icon="mdi-license" />
                Ehliyet Bilgileri
              </v-tab>
            </v-tabs>
            <v-divider />
            <v-window v-model="newCustomerFormTab" class="pa-6">
              <!-- Kişisel Bilgiler Sekmesi -->
              <v-window-item value="personal">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.firstName"
                      label="Adı"
                      prepend-inner-icon="mdi-account"
                      required
                      :rules="[v => !!v || 'Adı gereklidir']"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.lastName"
                      label="Soyadı"
                      prepend-inner-icon="mdi-account"
                      required
                      :rules="[v => !!v || 'Soyadı gereklidir']"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.birthPlace"
                      label="Doğum Yeri"
                      prepend-inner-icon="mdi-map-marker"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.birthDate"
                      label="Doğum Tarihi"
                      type="date"
                      prepend-inner-icon="mdi-calendar"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12">
                    <div class="mb-2">
                      <label class="text-body-2 mb-2 d-block">Cinsiyet</label>
                      <v-radio-group v-model="newCustomerForm.gender" inline>
                        <v-radio label="Erkek" value="male" />
                        <v-radio label="Kadın" value="female" />
                      </v-radio-group>
                    </div>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Kişisel Bilgiler (Devam) Sekmesi -->
              <v-window-item value="personal-continued">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="newCustomerForm.languageId"
                      :items="availableLanguages"
                      item-title="name"
                      item-value="id"
                      label="Dil"
                      prepend-inner-icon="mdi-translate"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="newCustomerForm.country"
                      :items="countries"
                      item-title="name"
                      item-value="code"
                      label="Ülke"
                      prepend-inner-icon="mdi-earth"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.mobilePhone"
                      label="Cep Telefonu"
                      class="mb-2"
                    >
                      <template #prepend-inner>
                        <v-icon icon="mdi-phone" class="mr-2" />
                        <span class="text-body-2 font-weight-medium">{{ selectedCountry?.dialCode || '' }}</span>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.homePhone"
                      label="Ev/İş Telefonu (Yedek)"
                      prepend-inner-icon="mdi-phone"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.taxOffice"
                      label="Vergi Dairesi"
                      prepend-inner-icon="mdi-office-building"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.taxNumber"
                      label="Vergi No"
                      prepend-inner-icon="mdi-identifier"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.email"
                      label="Email"
                      type="email"
                      prepend-inner-icon="mdi-email"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-textarea
                      v-model="newCustomerForm.homeAddress"
                      label="Ev/Haus/Tatil Adresi"
                      prepend-inner-icon="mdi-home"
                      rows="3"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-textarea
                      v-model="newCustomerForm.workAddress"
                      label="Otel İsmi / Oda Numarası"
                      prepend-inner-icon="mdi-office-building"
                      rows="3"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Kimlik / Pasaport Bilgileri Sekmesi -->
              <v-window-item value="identity">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="newCustomerForm.idType"
                      :items="idTypeOptions"
                      item-title="label"
                      item-value="value"
                      label="Kimlik Türü"
                      prepend-inner-icon="mdi-card-account-details"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.idNumber"
                      :label="newCustomerForm.idType === 'tc' ? 'TCKN' : 'Passport No'"
                      prepend-inner-icon="mdi-card-account-details"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.idIssuePlace"
                      label="Verildiği Yer"
                      prepend-inner-icon="mdi-map-marker"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.idIssueDate"
                      label="Veriliş Tarihi"
                      type="date"
                      prepend-inner-icon="mdi-calendar"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Ehliyet Bilgileri Sekmesi -->
              <v-window-item value="license">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.licenseNumber"
                      label="No"
                      prepend-inner-icon="mdi-card-account-details"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.licenseClass"
                      label="Sınıfı"
                      prepend-inner-icon="mdi-format-list-bulleted"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.licenseIssuePlace"
                      label="Verildiği Yer"
                      prepend-inner-icon="mdi-map-marker"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newCustomerForm.licenseIssueDate"
                      label="Veriliş Tarihi"
                      type="date"
                      prepend-inner-icon="mdi-calendar"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeCustomerDialog">İptal</v-btn>
          <v-btn 
            color="primary" 
            @click="saveNewCustomer" 
            :loading="savingNewCustomer" 
            :disabled="!newCustomerFormValid"
          >
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import { COUNTRIES, type Country } from '../data/countries';

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
const currencies = ref<Array<{ code: string; rateToTry: number; symbol?: string }>>([]);
const defaultCurrency = ref<{ code: string; rateToTry: number } | null>(null);

// UI State
const mainTab = ref('list');
const loadingReservations = ref(false);
const loadingLocations = ref(false);
const loadingCustomers = ref(false);
const loadingVehicles = ref(false);
const savingReservation = ref(false);
const selectedVehicle = ref<AvailableVehicleDto | null>(null);

// Wizard Steps
const currentStep = ref(1); // 1: Lokasyon/Tarih, 2: Araç, 3: Ekstralar, 4: Özet, 5: Müşteri, 6: Ödeme
const steps = [
  { number: 1, title: 'Lokasyon & Tarih', icon: 'mdi-calendar-marker' },
  { number: 2, title: 'Araç Seçimi', icon: 'mdi-car' },
  { number: 3, title: 'Ekstra Hizmetler', icon: 'mdi-star-plus' },
  { number: 4, title: 'Rezervasyon Özeti', icon: 'mdi-file-document-outline' },
  { number: 5, title: 'Müşteri Bilgileri', icon: 'mdi-account' },
  { number: 6, title: 'Ödeme', icon: 'mdi-credit-card' },
];

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
  { label: 'Kredi Kartı ile Ödeme', value: 'credit_card', icon: 'mdi-credit-card' },
  { label: 'Teslimatta Nakit Ödeme', value: 'cash_on_delivery', icon: 'mdi-cash' },
  { label: 'Havale ile Ödeme', value: 'bank_transfer', icon: 'mdi-bank-transfer' },
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
  sameReturnLocation: true, // Dönüş lokasyonu alış ile aynı mı?
  customerId: '',
  vehicleId: '',
  nonRentalFee: 0,
  extraFee: 0,
  paymentMethod: 'credit_card',
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
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  homePhone?: string;
  country?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: 'male' | 'female' | 'other';
  isBlacklisted?: boolean;
  isActive?: boolean;
  languageId?: string;
  language?: { id: string; name: string; code: string };
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
  currencyCode?: string; // Selected currency for display
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
  salesType?: 'daily' | 'per_rental' | string;
  canIncreaseQuantity?: boolean;
  image?: string;
  value?: string;
  inputName?: string;
  type?: 'insurance' | 'extra';
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
  // Eğer dönüş lokasyonu alış ile aynı ise, otomatik güncelle
  if (reservationForm.sameReturnLocation) {
    reservationForm.returnLocationId = locationId;
  }
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
    // Eğer dönüş lokasyonu alış ile aynı ise, otomatik güncelle
    if (reservationForm.sameReturnLocation) {
      reservationForm.returnLocationId = value;
    }
    locationSearchQuery.value = ''; // Clear search query
    nextTick(() => {
      if (pickupLocationAutocomplete.value) {
        pickupLocationAutocomplete.value.blur();
      }
    });
  }
};

// Handler for when same return location checkbox changes
const onSameReturnLocationChanged = (value: boolean) => {
  if (value) {
    // Dönüş lokasyonu alış ile aynı yap
    reservationForm.returnLocationId = reservationForm.pickupLocationId;
  } else {
    // Dönüş lokasyonunu temizle, kullanıcı seçsin
    reservationForm.returnLocationId = '';
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
  const hasReturnLocation = reservationForm.sameReturnLocation 
    ? reservationForm.pickupLocationId 
    : reservationForm.returnLocationId;
  
  return !!(
    reservationForm.pickupLocationId &&
    hasReturnLocation &&
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

// Currency conversion: Converts price from default currency to target currency
const convertCurrency = (price: number, targetCurrency: string): number => {
  if (!defaultCurrency.value) {
    console.warn('Default currency not loaded, returning original price');
    return price;
  }
  
  const sourceCurrency = defaultCurrency.value.code;
  if (sourceCurrency === targetCurrency) return price;
  
  // Find currency rates
  const sourceCurrencyData = currencies.value.find(c => c.code === sourceCurrency);
  const targetCurrencyData = currencies.value.find(c => c.code === targetCurrency);
  
  // If currencies not loaded, return original price
  if (!sourceCurrencyData || !targetCurrencyData) {
    console.warn(`Currency rates not found for ${sourceCurrency} or ${targetCurrency}`);
    return price;
  }
  
  // Convert from default currency to TRY first, then to target currency
  // defaultCurrency -> TRY -> targetCurrency
  const priceInTry = sourceCurrency === 'TRY' ? price : price * sourceCurrencyData.rateToTry;
  const convertedPrice = targetCurrency === 'TRY' ? priceInTry : priceInTry / targetCurrencyData.rateToTry;
  
  return Number(convertedPrice.toFixed(2));
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
    const pickupDate = new Date(reservationForm.pickupDate);
    const returnDate = new Date(reservationForm.returnDate);
    
    // Validate dates
    if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) return 0;
    
    // If return date is before pickup date, return 0
    if (returnDate < pickupDate) return 0;
    
    // Calculate date difference in days
    const diffTime = returnDate.getTime() - pickupDate.getTime();
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Parse pickup and return times
    const [pickupHour, pickupMinute] = (reservationForm.pickupTime || '09:00').split(':').map(Number);
    const [returnHour, returnMinute] = (reservationForm.returnTime || '09:00').split(':').map(Number);
    
    // Calculate time difference in hours
    const pickupTimeHours = pickupHour + pickupMinute / 60;
    const returnTimeHours = returnHour + returnMinute / 60;
    const timeDiffHours = Math.abs(returnTimeHours - pickupTimeHours);
    
    // If time difference is more than 2 hours, add 1 day
    if (timeDiffHours > 2) {
      diffDays += 1;
    }
    
    return diffDays > 0 ? diffDays : 1; // Minimum 1 day
  } catch {
    return 0;
  }
};

const getPickupLocation = () => {
  return locations.value.find(l => l.id === reservationForm.pickupLocationId);
};

const getReturnLocation = () => {
  // Eğer dönüş lokasyonu alış ile aynı ise, alış lokasyonunu döndür
  if (reservationForm.sameReturnLocation) {
    return getPickupLocation();
  }
  return locations.value.find(l => l.id === reservationForm.returnLocationId);
};

// Helper function to get day range based on number of days
const getDayRange = (days: number): string => {
  if (days >= 1 && days <= 3) return '1-3';
  if (days >= 4 && days <= 6) return '4-6';
  if (days >= 7 && days <= 10) return '7-10';
  if (days >= 11 && days <= 13) return '11-13';
  if (days >= 14 && days <= 20) return '14-20';
  if (days >= 21 && days <= 29) return '21-29';
  if (days >= 30) return '30++';
  return '1-3'; // Default
};

// Helper function to get vehicle price from location pricing
const getVehiclePriceFromLocation = async (locationId: string, vehicleId: string, days: number): Promise<number> => {
  try {
    // Get pickup month (1-12)
    const pickupDate = new Date(reservationForm.pickupDate);
    const month = pickupDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Get day range
    const dayRange = getDayRange(days);
    
    // Get pricing from location-vehicle-pricing API
    const { data: pricings } = await http.get('/rentacar/location-pricing/by-vehicle', {
      params: {
        locationId: locationId,
        vehicleId: vehicleId,
        month: month,
      },
    });
    
    // Find pricing for the specific day range
    const pricing = pricings?.find((p: any) => p.dayRange === dayRange && p.isActive);
    
    if (pricing && pricing.price) {
      return Number(pricing.price);
    }
    
    // If no pricing found, fallback to vehicle baseRate
    const vehicle = vehicles.value.find(v => v.id === vehicleId);
    return vehicle?.baseRate ? Number(vehicle.baseRate) : 0;
  } catch (error) {
    console.error('Failed to get vehicle price from location:', error);
    // Fallback to vehicle baseRate
    const vehicle = vehicles.value.find(v => v.id === vehicleId);
    return vehicle?.baseRate ? Number(vehicle.baseRate) : 0;
  }
};

const getDeliveryFee = (): number => {
  const location = getPickupLocation();
  if (!location) return 0;
  
  // Delivery fee: Eğer lokasyon bir alt lokasyon ise (parentId varsa), parent'ın (merkez) delivery fee'ini kullan
  // Alt lokasyonların kendi delivery fee'leri yok, sadece merkez lokasyonlarda delivery fee girilir
  let fee = 0;
  if (location.parentId) {
    // Alt lokasyon ise, parent'ı bul ve onun delivery fee'sini kullan
    const parentLocation = locations.value.find(l => l.id === location.parentId);
    fee = parentLocation?.deliveryFee || 0;
  } else {
    // Merkez lokasyon ise, kendi delivery fee'sini kullan
    fee = location.deliveryFee || 0;
  }
  
  const feeValue = typeof fee === 'string' ? parseFloat(fee) || 0 : Number(fee) || 0;
  
  // Fees are stored in default currency, convert to selected currency
  return convertCurrency(feeValue, reservationForm.currencyCode);
};

const getDropFee = (): number => {
  // Eğer alış lokasyonu ile dönüş lokasyonu aynı ise, drop ücreti eklenmeyecek
  if (reservationForm.sameReturnLocation) {
    return 0;
  }
  
  // Eğer farklı ise, dönüş lokasyonunun drop fee'ini al
  const returnLocation = getReturnLocation();
  if (!returnLocation) return 0;
  
  // Eğer lokasyon bir alt lokasyon ise (parentId varsa), parent'ın (merkez) drop fee'ini kullan
  // Alt lokasyonların kendi drop fee'leri yok, sadece merkez lokasyonlarda drop fee girilir
  let fee = 0;
  if (returnLocation.parentId) {
    // Alt lokasyon ise, parent'ı bul ve onun drop fee'sini kullan
    const parentLocation = locations.value.find(l => l.id === returnLocation.parentId);
    fee = parentLocation?.dropFee || 0;
  } else {
    // Merkez lokasyon ise, kendi drop fee'sini kullan
    fee = returnLocation.dropFee || 0;
  }
  
  const feeValue = typeof fee === 'string' ? parseFloat(fee) || 0 : Number(fee) || 0;
  
  // Fees are stored in default currency, convert to selected currency
  return convertCurrency(feeValue, reservationForm.currencyCode);
};

const calculateRentalPrice = (vehicle: AvailableVehicleDto): number => {
  const days = calculateDays();
  // DailyPrice is already in selected currency (converted in loadAvailableVehicles)
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
    
    // Calculate price based on sales type
    let extraPrice = 0;
    const salesType = extra.salesType?.toLowerCase() || '';
    if (salesType === 'daily') {
      extraPrice = numPrice * days;
    } else {
      // per_rental or other types - price is per rental, not per day
      extraPrice = numPrice;
    }
    
    // Extras are stored in default currency, convert to selected currency
    const convertedPrice = convertCurrency(extraPrice, reservationForm.currencyCode);
    
    return total + convertedPrice;
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

const saveAddedCustomers = (customers: CustomerDto[]) => {
  localStorage.setItem('crm_added_customers', JSON.stringify(customers));
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
    // Backend API'den müşteri listesini çek
    const { data } = await http.get<CustomerDto[]>('/crm/customers', {
      params: { tenantId: auth.tenant.id },
    });
    
    // Backend'den gelen veriyi kullan
    const blacklistedIds = getBlacklistedCustomers();
    
    // Kara liste durumunu ekle
    customers.value = (data || []).map(customer => ({
      ...customer,
      isBlacklisted: blacklistedIds.includes(customer.id),
      phone: customer.mobilePhone || customer.homePhone || customer.phone || '',
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
    // Eğer dönüş lokasyonu alış ile aynı ise, pickupLocation kullan
    const returnLocation = reservationForm.sameReturnLocation 
      ? pickupLocation 
      : getReturnLocation();
    
    if (!pickupLocation || !returnLocation) {
      alert('Lokasyon bilgileri bulunamadı!');
      return;
    }
    
    // Get actual pickup location (merkez) - if pickup location is child, use parent
    const actualPickupLocation = pickupLocation.parentId 
      ? locations.value.find(l => l.id === pickupLocation.parentId)
      : pickupLocation;
    
    if (!actualPickupLocation) {
      alert('Alış lokasyonu bulunamadı!');
      return;
    }
    
    // Rezervasyonda olmayan araçları filtrele
    const available = vehicles.value.filter(vehicle => {
      // Rezervasyonda olan araçları filtrele
      return !isVehicleReserved(vehicle);
    });
    
    // Load prices for all vehicles in parallel
    const vehiclePrices = await Promise.all(
      available.map(async (vehicle) => {
        const dailyPriceInDefaultCurrency = await getVehiclePriceFromLocation(
          actualPickupLocation.id,
          vehicle.id,
          days
        );
        return { vehicle, dailyPriceInDefaultCurrency };
      })
    );
    
    availableVehicles.value = vehiclePrices.map(({ vehicle, dailyPriceInDefaultCurrency }) => {
      // Convert daily price from default currency to selected currency
      const dailyPrice = convertCurrency(dailyPriceInDefaultCurrency, reservationForm.currencyCode);
      const rentalPrice = dailyPrice * days;
      
      // Delivery fee: Alış bölgesi ücreti (merkez lokasyondan)
      let deliveryFeeValue = 0;
      if (pickupLocation.parentId) {
        // Alt lokasyon ise, parent'ın (merkez) delivery fee'sini kullan
        const parentLocation = locations.value.find(l => l.id === pickupLocation.parentId);
        deliveryFeeValue = Number(parentLocation?.deliveryFee || 0);
      } else {
        // Merkez lokasyon ise, kendi delivery fee'sini kullan
        deliveryFeeValue = Number(pickupLocation.deliveryFee || 0);
      }
      
      // Drop fee: Eğer alış ve dönüş lokasyonu aynı ise, drop ücreti eklenmeyecek
      // Eğer farklı ise, dönüş bölgesi ücreti (merkez lokasyondan)
      let dropFeeValue = 0;
      if (!reservationForm.sameReturnLocation) {
        // Sadece alış ve dönüş lokasyonu farklı ise drop fee ekle
        if (returnLocation.parentId) {
          // Alt lokasyon ise, parent'ın (merkez) drop fee'sini kullan
          const parentLocation = locations.value.find(l => l.id === returnLocation.parentId);
          dropFeeValue = Number(parentLocation?.dropFee || 0);
        } else {
          // Merkez lokasyon ise, kendi drop fee'sini kullan
          dropFeeValue = Number(returnLocation.dropFee || 0);
        }
      }
      
      const deliveryFee = convertCurrency(deliveryFeeValue, reservationForm.currencyCode);
      const dropFee = convertCurrency(dropFeeValue, reservationForm.currencyCode);
      
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
        currencyCode: reservationForm.currencyCode, // Store selected currency
      };
    });
    
    // Reload vehicles when currency changes to recalculate prices
    if (availableVehicles.value.length === 0) {
      alert('Seçilen tarihler için müsait araç bulunamadı.');
      currentStep.value = 1; // Araç bulunamadıysa adım 1'de kal
    } else {
      // Araçlar bulundu, araç seçim adımına geç
      currentStep.value = 2;
    }
  } catch (error) {
    console.error('Failed to load available vehicles:', error);
    alert('Araçlar yüklenirken bir hata oluştu.');
    currentStep.value = 1; // Hata durumunda adım 1'de kal
  } finally {
    loadingVehicles.value = false;
  }
};

const selectVehicle = (_event: any, { item }: { item: AvailableVehicleDto }) => {
  selectedVehicle.value = item;
  reservationForm.vehicleId = item.id;
  // Araç seçildikten sonra otomatik olarak ekstralar adımına geç
  currentStep.value = 3;
};

// Watch currency changes to reload vehicles with new prices
watch(
  () => reservationForm.currencyCode,
  async () => {
    if (availableVehicles.value.length > 0 && reservationForm.pickupLocationId && (reservationForm.returnLocationId || reservationForm.sameReturnLocation)) {
      // Reload vehicles to recalculate prices in new currency
      await loadAvailableVehicles();
    }
  }
);

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
  customerInfo.mobile = customer.mobilePhone || customer.homePhone || customer.phone || '';
  customerInfo.phone = customer.mobilePhone || customer.homePhone || customer.phone || '';
  customerInfo.birthDate = customer.birthDate ? (typeof customer.birthDate === 'string' ? customer.birthDate : new Date(customer.birthDate).toISOString().split('T')[0]) : '';
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

// Wizard Navigation
const goToStep = (step: number) => {
  // Validate step transitions
  if (step === 2 && !canLoadVehicles.value) {
    alert('Lütfen önce lokasyon ve tarih bilgilerini doldurunuz.');
    return;
  }
  if (step === 3 && !reservationForm.vehicleId) {
    alert('Lütfen önce bir araç seçiniz.');
    return;
  }
  if (step === 4 && !reservationForm.vehicleId) {
    alert('Lütfen önce bir araç seçiniz.');
    return;
  }
  if (step === 5 && !reservationForm.vehicleId) {
    alert('Lütfen önce bir araç seçiniz.');
    return;
  }
  if (step === 6 && !reservationForm.customerId) {
    alert('Lütfen önce bir müşteri seçiniz.');
    return;
  }
  currentStep.value = step;
};

// Watch: Araç seçildiğinde araç listesini kapat ve ekstralar adımına geç
watch(
  () => reservationForm.vehicleId,
  (newVehicleId) => {
    if (newVehicleId && currentStep.value === 2) {
      // Araç seçildi, ekstralar adımına geç
      currentStep.value = 3;
    }
  }
);

// Watch: Araç seçildiğinde otomatik olarak ekstralar adımına geç (zaten selectVehicle'da yapılıyor)

const showCustomerDialog = ref(false);
const savingNewCustomer = ref(false);
const newCustomerFormRef = ref();
const newCustomerFormValid = ref(false);
const newCustomerFormTab = ref('personal');
const availableLanguages = ref<Array<{ id: string; name: string; code: string; isActive: boolean; isDefault?: boolean }>>([]);

const countries = COUNTRIES;

const idTypeOptions = [
  { label: 'T.C. Kimlik', value: 'tc' },
  { label: 'Passport', value: 'passport' },
];

const newCustomerForm = reactive({
  firstName: '',
  lastName: '',
  birthPlace: '',
  birthDate: '',
  gender: 'male' as 'male' | 'female',
  languageId: '',
  mobilePhone: '',
  homePhone: '',
  taxOffice: '',
  taxNumber: '',
  email: '',
  country: 'TR',
  licenseNumber: '',
  licenseClass: '',
  licenseIssuePlace: '',
  licenseIssueDate: '',
  idNumber: '',
  idType: 'tc' as 'tc' | 'passport',
  idIssuePlace: '',
  idIssueDate: '',
  homeAddress: '',
  workAddress: '',
});

const selectedCountry = computed(() => {
  return countries.find(c => c.code === newCustomerForm.country);
});

const loadLanguages = async () => {
  try {
    const { data } = await http.get<Array<{ id: string; name: string; code: string; isActive: boolean; isDefault?: boolean }>>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
    
    // Set default language (Turkish)
    const defaultLang = availableLanguages.value.find(l => l.code === 'tr' || l.isDefault) || availableLanguages.value[0];
    if (defaultLang) {
      newCustomerForm.languageId = defaultLang.id;
    }
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

const openCustomerDialog = () => {
  // Reset form
  newCustomerForm.firstName = '';
  newCustomerForm.lastName = '';
  newCustomerForm.birthPlace = '';
  newCustomerForm.birthDate = '';
  newCustomerForm.gender = 'male';
  newCustomerForm.languageId = availableLanguages.value.find(l => l.code === 'tr' || l.isDefault)?.id || '';
  newCustomerForm.mobilePhone = '';
  newCustomerForm.homePhone = '';
  newCustomerForm.taxOffice = '';
  newCustomerForm.taxNumber = '';
  newCustomerForm.email = '';
  newCustomerForm.country = 'TR';
  newCustomerForm.licenseNumber = '';
  newCustomerForm.licenseClass = '';
  newCustomerForm.licenseIssuePlace = '';
  newCustomerForm.licenseIssueDate = '';
  newCustomerForm.idNumber = '';
  newCustomerForm.idType = 'tc';
  newCustomerForm.idIssuePlace = '';
  newCustomerForm.idIssueDate = '';
  newCustomerForm.homeAddress = '';
  newCustomerForm.workAddress = '';
  newCustomerFormTab.value = 'personal';
  showCustomerDialog.value = true;
};

const closeCustomerDialog = () => {
  showCustomerDialog.value = false;
};

const saveNewCustomer = async () => {
  if (!auth.tenant) return;
  
  const validated = await newCustomerFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingNewCustomer.value = true;
  try {
    const customerData = {
      tenantId: auth.tenant.id,
      firstName: newCustomerForm.firstName,
      lastName: newCustomerForm.lastName,
      fullName: `${newCustomerForm.firstName} ${newCustomerForm.lastName}`,
      birthPlace: newCustomerForm.birthPlace,
      birthDate: newCustomerForm.birthDate,
      gender: newCustomerForm.gender,
      languageId: newCustomerForm.languageId,
      mobilePhone: newCustomerForm.mobilePhone ? `${selectedCountry.value?.dialCode || ''} ${newCustomerForm.mobilePhone}`.trim() : '',
      homePhone: newCustomerForm.homePhone,
      taxOffice: newCustomerForm.taxOffice,
      taxNumber: newCustomerForm.taxNumber,
      email: newCustomerForm.email,
      // Password otomatik olarak id_number'dan oluşturulacak
      country: newCustomerForm.country,
      licenseNumber: newCustomerForm.licenseNumber,
      licenseClass: newCustomerForm.licenseClass,
      licenseIssuePlace: newCustomerForm.licenseIssuePlace,
      licenseIssueDate: newCustomerForm.licenseIssueDate,
      idNumber: newCustomerForm.idNumber,
      idType: newCustomerForm.idType,
      idIssuePlace: newCustomerForm.idIssuePlace,
      idIssueDate: newCustomerForm.idIssueDate,
      homeAddress: newCustomerForm.homeAddress,
      workAddress: newCustomerForm.workAddress,
      isActive: true,
    };
    
    // Backend API endpoint kullan
    const { data: newCustomer } = await http.post('/crm/customers', customerData);
    
    // Müşteri listesini yenile
    await loadCustomers();
    
    // Yeni eklenen müşteriyi otomatik seç
    reservationForm.customerId = newCustomer.id;
    await onCustomerSelect(newCustomer.id);
    
    closeCustomerDialog();
  } catch (error: any) {
    console.error('Failed to save customer:', error);
    alert(error.response?.data?.message || error.message || 'Müşteri kaydedilirken bir hata oluştu');
  } finally {
    savingNewCustomer.value = false;
  }
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
    const deliveryFee = getDeliveryFee();
    const dropFee = getDropFee();
    
    const reservationData = {
      tenantId: auth.tenant.id,
      type: 'rentacar',
      currencyCode: reservationForm.currencyCode,
      source: reservationForm.source,
      pickupLocationId: reservationForm.pickupLocationId,
      pickupDate: reservationForm.pickupDate,
      pickupTime: reservationForm.pickupTime,
      returnLocationId: reservationForm.sameReturnLocation 
        ? reservationForm.pickupLocationId 
        : reservationForm.returnLocationId,
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
      deliveryFee: deliveryFee,
      dropFee: dropFee,
      metadata: {
        deliveryFee: deliveryFee,
        dropFee: dropFee,
        sameReturnLocation: reservationForm.sameReturnLocation,
      },
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

// Get converted price for display (per unit)
const getExtraDisplayPrice = (extra: ExtraDto | undefined): number => {
  if (!extra) return 0;
  const price = typeof extra.price === 'string' ? parseFloat(extra.price) || 0 : (extra.price || 0);
  // Convert from default currency to selected currency
  return convertCurrency(price, reservationForm.currencyCode);
};

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
    // Load extras from backend API
    const { data } = await http.get<ExtraDto[]>('/rentacar/extras', {
      params: { tenantId: auth.tenant.id },
    });
    
    // Backend might return snake_case (is_active) or camelCase (isActive)
    // Normalize the field names to camelCase
    if (data && Array.isArray(data)) {
      extras.value = data.map((extra: any) => ({
        ...extra,
        isActive: extra.isActive !== undefined ? extra.isActive : (extra.is_active !== undefined ? extra.is_active : true),
        isMandatory: extra.isMandatory !== undefined ? extra.isMandatory : (extra.is_mandatory !== undefined ? extra.is_mandatory : false),
        salesType: extra.salesType || extra.sales_type || 'daily',
      }));
      
      console.log('Loaded extras (raw):', data);
      console.log('Loaded extras (normalized):', extras.value);
      console.log('Available extras (isActive=true):', extras.value.filter(e => e.isActive));
    } else {
      extras.value = [];
    }
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
  reservationForm.paymentMethod = 'credit_card';
  currentStep.value = 1;
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

const loadCurrencies = async () => {
  try {
    const { data } = await http.get<Array<{ code: string; rateToTry: number; symbol?: string }>>('/currencies');
    currencies.value = data || [];
  } catch (error) {
    console.error('Failed to load currencies:', error);
    // Fallback to default rates if API fails
    currencies.value = [
      { code: 'TRY', rateToTry: 1, symbol: '₺' },
      { code: 'USD', rateToTry: 32, symbol: '$' },
      { code: 'EUR', rateToTry: 35, symbol: '€' },
    ];
  }
};

const loadDefaultCurrency = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get<{ 
      defaultCurrency?: { 
        id?: string;
        code: string; 
        rateToTry: number | string;
        symbol?: string;
      } | null;
    }>(`/tenants/${auth.tenant.id}`);
    
    if (data?.defaultCurrency) {
      const rateToTry = typeof data.defaultCurrency.rateToTry === 'string' 
        ? parseFloat(data.defaultCurrency.rateToTry) 
        : data.defaultCurrency.rateToTry;
      
      defaultCurrency.value = {
        code: data.defaultCurrency.code,
        rateToTry: rateToTry || 1,
      };
    } else {
      // Fallback to TRY if no default currency is set
      defaultCurrency.value = { code: 'TRY', rateToTry: 1 };
    }
  } catch (error) {
    console.error('Failed to load default currency:', error);
    // Fallback to TRY if API fails
    defaultCurrency.value = { code: 'TRY', rateToTry: 1 };
  }
};

onMounted(async () => {
  // Load currencies and default currency first as they're needed for conversions
  await Promise.all([
    loadCurrencies(),
    loadDefaultCurrency(),
    loadLanguages(),
  ]);
  
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
