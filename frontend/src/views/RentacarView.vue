<template>
  <div>
    <v-alert type="warning" variant="tonal" class="mb-4" v-if="!isRentacarTenant">
      Bu modül yalnızca rent a car tenantlar için aktiftir.
    </v-alert>

    <template v-else>
      <!-- Ana Tab Bar -->
      <v-card elevation="2" class="mb-4 main-container">
        <v-tabs v-model="mainTab" show-arrows>
          <v-tab value="vehicles">
            <v-icon start icon="mdi-car" />
            Araçlar
          </v-tab>
          <v-tab value="locations">
            <v-icon start icon="mdi-map-marker" />
            Lokasyonlar
          </v-tab>
        </v-tabs>
        <v-divider />
        <v-window v-model="mainTab" class="window-content">
          <!-- Araçlar Sekmesi -->
          <v-window-item value="vehicles">
            <!-- Araç Listesi -->
            <v-card elevation="0" class="mb-4">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6 font-weight-bold">Araçlar</span>
          <div class="d-flex align-center gap-2">
            <v-btn icon="mdi-refresh" variant="text" @click="loadVehicles" :loading="loadingVehicles" />
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
              Yeni Araç Ekle
            </v-btn>
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-data-table
            :headers="tableHeaders"
            :items="vehicles"
            :loading="loadingVehicles"
            item-value="id"
            class="elevation-0"
          >
            <template #item.plate="{ item }">
              <div v-if="item.plates && item.plates.length > 0">
                <v-chip
                  v-for="plate in item.plates"
                  :key="plate.id"
                  color="info"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-card-text"
                  style="cursor: pointer;"
                  @click="openPlateDialog(item, plate)"
                >
                  {{ plate.plateNumber }}
                </v-chip>
              </div>
              <v-btn
                v-else
                color="info"
                variant="outlined"
                size="small"
                prepend-icon="mdi-card-text"
                @click="openPlateDialog(item)"
              >
                Plaka Ekle
              </v-btn>
            </template>

            <template #item.name="{ item }">
              <div class="d-flex align-center gap-2">
                <v-icon icon="mdi-car" size="20" color="primary" />
                <span class="font-weight-medium">{{ item.name }}</span>
              </div>
            </template>

            <template #item.category="{ item }">
              <v-chip v-if="item.category" size="small" color="primary" variant="tonal">
                {{ getCategoryName(item.category) }}
              </v-chip>
              <span v-else class="text-grey">-</span>
            </template>

            <template #item.brand="{ item }">
              <span>{{ item.brand?.name || item.brandName || '-' }}</span>
            </template>

            <template #item.model="{ item }">
              <span>{{ item.model?.name || item.modelName || '-' }}</span>
            </template>

            <template #item.year="{ item }">
              <span>{{ item.year || '-' }}</span>
            </template>

            <template #item.baseRate="{ item }">
              <span class="font-weight-medium">{{ Number(item.baseRate).toFixed(2) }} {{ item.currencyCode }}</span>
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" variant="text" size="small" @click="editVehicle(item)" />
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteVehicle(item.id)" />
            </template>
          </v-data-table>
        </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Lokasyonlar Sekmesi -->
          <v-window-item value="locations">
            <!-- Lokasyon Listesi -->
            <v-card elevation="0" class="mb-4">
              <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
                <span class="text-h6 font-weight-bold">Lokasyonlar</span>
                <div class="d-flex align-center gap-2">
                  <v-btn icon="mdi-refresh" variant="text" @click="loadLocations" :loading="loadingLocations" />
                  <v-btn color="primary" prepend-icon="mdi-plus" @click="openLocationDialog">
                    Lokasyon Ekle
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <div class="table-container">
                  <v-data-table
                    :headers="locationTableHeaders"
                    :items="locations"
                    :loading="loadingLocations"
                    item-value="id"
                    class="elevation-0 location-table"
                    density="compact"
                  >
                  <template #item.index="{ index }">
                    <span>{{ index + 1 }}</span>
                  </template>

                  <template #item.name="{ item }">
                    <div class="d-flex align-center gap-2">
                      <v-icon icon="mdi-map-marker" size="20" color="primary" />
                      <span class="font-weight-medium">{{ getLocationName(item) }}</span>
                    </div>
                  </template>

                  <template #item.parentRegion="{ item }">
                    <span>{{ item.parentRegion || '-' }}</span>
                  </template>

                  <template #item.type="{ item }">
                    <v-chip size="small" color="info" variant="tonal">
                      {{ getLocationTypeLabel(item.type) }}
                    </v-chip>
                  </template>

                  <template #item.status="{ item }">
                    <v-chip 
                      size="small" 
                      :color="item.isActive ? 'success' : 'error'" 
                      variant="flat"
                    >
                      {{ item.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </template>

                  <template #item.pricing="{ item }">
                    <v-btn 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                      prepend-icon="mdi-currency-usd"
                      @click="openPricingDialog(item)"
                      class="text-uppercase"
                    >
                      Fiyat Ekle
                    </v-btn>
                  </template>

                  <template #item.minDayCount="{ item }">
                    <v-text-field
                      v-model.number="item.minDayCount"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @blur="updateLocationField(item, 'minDayCount', item.minDayCount)"
                      @keyup.enter="updateLocationField(item, 'minDayCount', item.minDayCount)"
                    >
                      <template #append>
                        <span class="text-caption">Gün</span>
                      </template>
                    </v-text-field>
                  </template>

                  <template #item.orderNo="{ item }">
                    <v-text-field
                      v-model.number="item.orderNo"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @blur="updateLocationField(item, 'orderNo', item.orderNo)"
                      @keyup.enter="updateLocationField(item, 'orderNo', item.orderNo)"
                    />
                  </template>

                  <template #item.deliveryPricing="{ item }">
                    <v-btn 
                      color="success" 
                      variant="outlined" 
                      size="small"
                      prepend-icon="mdi-map-marker-multiple"
                      @click="openDeliveryPricingDialog(item)"
                      class="text-uppercase"
                    >
                      Dönüş Bölgesi Ücretleri
                    </v-btn>
                  </template>

                  <template #item.actions="{ item }">
                    <v-btn icon="mdi-pencil" variant="text" size="small" color="success" @click="editLocation(item)" />
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteLocation(item.id)" />
                  </template>
                  </v-data-table>
                </div>
              </v-card-text>
            </v-card>
          </v-window-item>

        </v-window>
      </v-card>

      <!-- Yeni Araç Ekleme/Düzenleme Dialog -->
      <v-dialog v-model="showVehicleDialog" max-width="1400" fullscreen scrollable>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-car" size="24" />
              <span class="text-h6">{{ editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle' }}</span>
              <v-chip v-if="activeTab" size="small" color="primary" variant="tonal" class="ml-2">
                {{ getTabName(activeTab) }}
              </v-chip>
            </div>
            <v-btn icon="mdi-close" variant="text" @click="closeVehicleDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <v-tabs v-model="activeTab" show-arrows>
              <v-tab value="category">
                <v-icon start icon="mdi-tag" />
                Kategoriler
              </v-tab>
              <v-tab value="brand">
                <v-icon start icon="mdi-alpha-b-box" />
                Marka
              </v-tab>
              <v-tab value="model">
                <v-icon start icon="mdi-shape" />
                Model
              </v-tab>
              <v-tab value="vehicle">
                <v-icon start icon="mdi-car" />
                Araçlar
              </v-tab>
            </v-tabs>
            <v-divider />
            <v-window v-model="activeTab">
              <!-- Kategoriler Sekmesi -->
              <v-window-item value="category">
                <div class="pa-6">
                  <h3 class="text-h6 mb-4">Kategori Seç veya Oluştur</h3>
                  
                  <!-- Yeni Kategori Ekle -->
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1">Yeni Kategori Ekle</v-card-title>
                    <v-card-text>
                      <v-form ref="categoryFormRef" v-model="categoryFormValid">
                        <v-tabs v-model="categoryLanguageTab" density="compact" class="mb-4">
                          <v-tab
                            v-for="lang in availableLanguages"
                            :key="lang.id"
                            :value="lang.id"
                          >
                            {{ lang.name }} ({{ lang.code }})
                            <v-chip v-if="lang.isDefault" size="x-small" color="primary" class="ml-1">Varsayılan</v-chip>
                          </v-tab>
                        </v-tabs>
                        <v-window v-model="categoryLanguageTab">
                          <v-window-item
                            v-for="lang in availableLanguages"
                            :key="lang.id"
                            :value="lang.id"
                          >
                            <v-text-field
                              v-model="categoryForm.translations[lang.id]"
                              :label="`Kategori Adı (${lang.name})`"
                              :placeholder="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için kategori adı'"
                              prepend-inner-icon="mdi-tag"
                              required
                              :hint="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için kategori adı'"
                              persistent-hint
                            />
                          </v-window-item>
                        </v-window>
                        <v-btn color="primary" @click="saveCategory" :loading="savingCategory" :disabled="!categoryFormValid">
                          Kategori Ekle
                        </v-btn>
                      </v-form>
                    </v-card-text>
                  </v-card>

                  <!-- Mevcut Kategoriler -->
                  <v-card variant="outlined">
                    <v-card-title class="text-subtitle-1">Mevcut Kategoriler</v-card-title>
                    <v-card-text>
                      <v-list v-if="vehicleCategories.length > 0">
                        <v-list-item
                          v-for="category in vehicleCategories"
                          :key="category.id"
                          :class="{ 'bg-primary-lighten-5': form.categoryId === category.id }"
                          @click="selectCategory(category.id)"
                        >
                          <template #prepend>
                            <v-radio :model-value="form.categoryId" :value="category.id" />
                          </template>
                          <v-list-item-title>{{ getCategoryName(category) }}</v-list-item-title>
                          <template #append>
                            <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="editCategory(category)" />
                            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="deleteCategory(category.id)" />
                          </template>
                        </v-list-item>
                      </v-list>
                      <v-alert v-else type="info" variant="tonal">Henüz kategori eklenmemiş.</v-alert>
                    </v-card-text>
                  </v-card>
                </div>
              </v-window-item>

              <!-- Marka Sekmesi -->
              <v-window-item value="brand">
                <div class="pa-6">
                  <h3 class="text-h6 mb-4">Marka Seç veya Oluştur</h3>
                  
                  <!-- Yeni Marka Ekle -->
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1">Yeni Marka Ekle</v-card-title>
                    <v-card-text>
                      <v-form ref="brandFormRef" v-model="brandFormValid">
                        <v-text-field
                          v-model="brandForm.name"
                          label="Marka Adı"
                          prepend-inner-icon="mdi-alpha-b-box"
                          required
                        />
                        <v-btn color="primary" @click="saveBrand" :loading="savingBrand" :disabled="!brandFormValid">
                          Marka Ekle
                        </v-btn>
                      </v-form>
                    </v-card-text>
                  </v-card>

                  <!-- Mevcut Markalar -->
                  <v-card variant="outlined">
                    <v-card-title class="text-subtitle-1">Mevcut Markalar</v-card-title>
                    <v-card-text>
                      <v-list v-if="vehicleBrands.length > 0">
                        <v-list-item
                          v-for="brand in vehicleBrands"
                          :key="brand.id"
                          :class="{ 'bg-primary-lighten-5': form.brandId === brand.id }"
                          @click="selectBrand(brand.id)"
                        >
                          <template #prepend>
                            <v-radio :model-value="form.brandId" :value="brand.id" />
                          </template>
                          <v-list-item-title>{{ brand.name }}</v-list-item-title>
                          <template #append>
                            <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="editBrand(brand)" />
                            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="deleteBrand(brand.id)" />
                          </template>
                        </v-list-item>
                      </v-list>
                      <v-alert v-else type="info" variant="tonal">Henüz marka eklenmemiş.</v-alert>
                    </v-card-text>
                  </v-card>
                </div>
              </v-window-item>

              <!-- Model Sekmesi -->
              <v-window-item value="model">
                <div class="pa-6">
                  <h3 class="text-h6 mb-4">Model Seç veya Oluştur</h3>
                  <v-alert v-if="!form.brandId" type="warning" variant="tonal" class="mb-4">
                    Önce bir marka seçmelisiniz.
                  </v-alert>
                  
                  <template v-else>
                    <!-- Yeni Model Ekle -->
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="text-subtitle-1">Yeni Model Ekle</v-card-title>
                      <v-card-text>
                        <v-form ref="modelFormRef" v-model="modelFormValid">
                          <v-text-field
                            v-model="modelForm.name"
                            label="Model Adı"
                            prepend-inner-icon="mdi-shape"
                            required
                          />
                          <v-btn color="primary" @click="saveModel" :loading="savingModel" :disabled="!modelFormValid">
                            Model Ekle
                          </v-btn>
                        </v-form>
                      </v-card-text>
                    </v-card>

                    <!-- Mevcut Modeller -->
                    <v-card variant="outlined">
                      <v-card-title class="text-subtitle-1">Mevcut Modeller ({{ selectedBrandName }})</v-card-title>
                      <v-card-text>
                        <v-list v-if="vehicleModels.length > 0">
                          <v-list-item
                            v-for="model in vehicleModels"
                            :key="model.id"
                            :class="{ 'bg-primary-lighten-5': form.modelId === model.id }"
                            @click="selectModel(model.id)"
                          >
                            <template #prepend>
                              <v-radio :model-value="form.modelId" :value="model.id" />
                            </template>
                            <v-list-item-title>{{ model.name }}</v-list-item-title>
                            <template #append>
                              <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="editModel(model)" />
                              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="deleteModel(model.id)" />
                            </template>
                          </v-list-item>
                        </v-list>
                        <v-alert v-else type="info" variant="tonal">Bu marka için henüz model eklenmemiş.</v-alert>
                      </v-card-text>
                    </v-card>
                  </template>
                </div>
              </v-window-item>

              <!-- Araçlar Sekmesi -->
              <v-window-item value="vehicle">
                <div class="pa-6">
                  <h3 class="text-h6 mb-4">Araç Bilgileri</h3>
                  <v-alert v-if="!form.categoryId || !form.brandId || !form.modelId" type="warning" variant="tonal" class="mb-4">
                    Önce kategori, marka ve model seçmelisiniz.
                  </v-alert>
                  
                  <v-form ref="vehicleFormRef" v-model="vehicleFormValid">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="form.name"
                          label="Araç Adı"
                          prepend-inner-icon="mdi-car"
                          required
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="form.year"
                          label="Yıl"
                          type="number"
                          prepend-inner-icon="mdi-calendar"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="form.transmission"
                          :items="transmissionOptions"
                          item-title="label"
                          item-value="value"
                          label="Vites"
                          prepend-inner-icon="mdi-cog"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="form.fuelType"
                          :items="fuelTypeOptions"
                          item-title="label"
                          item-value="value"
                          label="Yakıt"
                          prepend-inner-icon="mdi-fuel"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="form.seats"
                          label="Yolcu Sayısı"
                          type="number"
                          prepend-inner-icon="mdi-account"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="form.largeLuggage"
                          label="Büyük Bagaj Adedi"
                          type="number"
                          prepend-inner-icon="mdi-luggage"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="form.smallLuggage"
                          label="Küçük Bagaj Adedi"
                          type="number"
                          prepend-inner-icon="mdi-luggage"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="form.doors"
                          label="Kapı Sayısı"
                          type="number"
                          prepend-inner-icon="mdi-door"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.engineSize"
                          :items="engineSizeOptions"
                          label="Motor"
                          prepend-inner-icon="mdi-engine"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.bodyType"
                          :items="bodyTypeOptions"
                          label="Kasa"
                          prepend-inner-icon="mdi-car-side"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.horsepower"
                          :items="horsepowerOptions"
                          label="Beygir"
                          prepend-inner-icon="mdi-lightning-bolt"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.hasHydraulicSteering"
                          :items="yesNoOptions"
                          item-title="label"
                          item-value="value"
                          label="Hidrolik Direksiyon"
                          prepend-inner-icon="mdi-steering"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.isFourWheelDrive"
                          :items="yesNoOptions"
                          item-title="label"
                          item-value="value"
                          label="4 Çeker"
                          prepend-inner-icon="mdi-car-multiple"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.hasAirConditioning"
                          :items="yesNoOptions"
                          item-title="label"
                          item-value="value"
                          label="Klima"
                          prepend-inner-icon="mdi-snowflake"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.hasAbs"
                          :items="yesNoOptions"
                          item-title="label"
                          item-value="value"
                          label="ABS"
                          prepend-inner-icon="mdi-alert-circle"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.hasRadio"
                          :items="yesNoOptions"
                          item-title="label"
                          item-value="value"
                          label="Radio"
                          prepend-inner-icon="mdi-radio"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.hasCd"
                          :items="yesNoOptions"
                          item-title="label"
                          item-value="value"
                          label="CD"
                          prepend-inner-icon="mdi-disc"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="form.hasSunroof"
                          :items="yesNoOptions"
                          item-title="label"
                          item-value="value"
                          label="Sun Roof"
                          prepend-inner-icon="mdi-car-convertible"
                        />
                      </v-col>
                      <v-col cols="12">
                        <v-textarea
                          v-model="form.description"
                          label="Açıklama"
                          prepend-inner-icon="mdi-text"
                          rows="3"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="form.baseRate"
                          label="Baz Fiyat"
                          type="number"
                          prepend-inner-icon="mdi-currency-eur"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="form.currencyCode"
                          :items="currencyOptions"
                          item-title="title"
                          item-value="value"
                          label="Para Birimi"
                          prepend-inner-icon="mdi-wallet"
                        />
                      </v-col>
                    </v-row>
                  </v-form>
                </div>
              </v-window-item>
            </v-window>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeVehicleDialog">İptal</v-btn>
            <v-btn color="primary" @click="saveVehicle" :loading="savingVehicle" :disabled="!vehicleFormValid">
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Plaka Ekleme Dialog -->
      <v-dialog v-model="showPlateDialog" max-width="1000" scrollable>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-card-text" size="24" />
              <span class="text-h6">{{ editingPlate ? 'Plaka Düzenle' : 'Plaka Ekle' }}</span>
            </div>
            <v-btn icon="mdi-close" variant="text" @click="closePlateDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <div v-if="selectedVehicleForPlate" class="mb-4">
              <v-alert type="info" variant="tonal">
                <div class="d-flex align-center gap-2">
                  <v-icon icon="mdi-car" />
                  <div>
                    <div class="font-weight-medium">{{ selectedVehicleForPlate.name }}</div>
                    <div class="text-caption">
                      {{ selectedVehicleForPlate.brand?.name || selectedVehicleForPlate.brandName || '-' }} 
                      {{ selectedVehicleForPlate.model?.name || selectedVehicleForPlate.modelName || '-' }}
                      <span v-if="selectedVehicleForPlate.year">({{ selectedVehicleForPlate.year }})</span>
                    </div>
                  </div>
                </div>
              </v-alert>
            </div>

            <v-form ref="plateFormRef" v-model="plateFormValid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="plateForm.plateNumber"
                    label="Plaka"
                    prepend-inner-icon="mdi-card-text"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="plateForm.registrationDate"
                    label="Tescil Tarihi"
                    type="date"
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="plateForm.documentNumber"
                    label="Belge No/ Seri No"
                    prepend-inner-icon="mdi-file-document"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="plateForm.km"
                    label="Km"
                    type="number"
                    prepend-inner-icon="mdi-speedometer"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="plateForm.oilKm"
                    label="Oil Km"
                    type="number"
                    prepend-inner-icon="mdi-oil"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="plateForm.description"
                    label="Description"
                    rows="3"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <h3 class="text-subtitle-1 mb-4">Sigorta / Muayene / Diğer</h3>
              <v-table>
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Sigorta Şirketi</th>
                    <th>Başlangıç Tarihi</th>
                    <th>Bitiş Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Kasko</td>
                    <td>
                      <v-text-field
                        v-model="plateForm.comprehensiveInsuranceCompany"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.comprehensiveInsuranceStart"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.comprehensiveInsuranceEnd"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Trafik Sigortası</td>
                    <td>
                      <v-text-field
                        v-model="plateForm.trafficInsuranceCompany"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.trafficInsuranceStart"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.trafficInsuranceEnd"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Muayene</td>
                    <td>
                      <v-text-field
                        v-model="plateForm.inspectionCompany"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.inspectionStart"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.inspectionEnd"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Eksoz Muayenesi</td>
                    <td>
                      <v-text-field
                        v-model="plateForm.exhaustInspectionCompany"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.exhaustInspectionStart"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="plateForm.exhaustInspectionEnd"
                        type="date"
                        density="compact"
                        hide-details
                      />
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-form>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn 
              v-if="editingPlate"
              color="error"
              variant="text"
              prepend-icon="mdi-delete"
              @click="deletePlate"
              :loading="deletingPlate"
            >
              Sil
            </v-btn>
            <v-btn variant="text" @click="closePlateDialog">İptal</v-btn>
            <v-btn color="primary" @click="savePlate" :loading="savingPlate" :disabled="!plateFormValid">
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Fiyatlandırma Dialog -->
      <v-dialog v-model="showPricingDialog" max-width="1600" fullscreen scrollable>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-currency-usd" size="24" />
              <span class="text-h6">
                {{ selectedLocationForPricing ? `${getLocationName(selectedLocationForPricing)}${selectedLocationForPricing.province || selectedLocationForPricing.district ? ` (${selectedLocationForPricing.province || ''}${selectedLocationForPricing.district ? ` - ${selectedLocationForPricing.district}` : ''})` : ''} => Fiyatlandırma` : 'Fiyatlandırma' }}
              </span>
            </div>
            <v-btn icon="mdi-close" variant="text" @click="closePricingDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <!-- Aylar Tab Bar -->
            <v-tabs v-model="selectedMonth" show-arrows class="px-4 pt-4">
              <v-tab
                v-for="month in months"
                :key="month.value"
                :value="month.value"
              >
                {{ month.label }}
              </v-tab>
            </v-tabs>
            <v-divider />
            <!-- Pricing Table -->
            <div class="pa-4">
              <v-data-table
                :headers="pricingTableHeaders"
                :items="pricingTableData"
                :loading="loadingPricing"
                item-value="vehicleId"
                class="elevation-0"
                density="compact"
              >
                <template #item.vehicle="{ item }">
                  <div class="d-flex flex-column">
                    <span class="font-weight-medium">
                      {{ item.brandName || '-' }} | {{ item.modelName || '-' }}
                    </span>
                    <span class="text-caption text-grey">
                      {{ item.transmission ? (item.transmission === 'automatic' ? 'Automatic' : 'Manuel') : '' }}
                      {{ item.fuelType ? `| ${item.fuelType === 'gasoline' ? 'Benzin' : item.fuelType === 'diesel' ? 'Dizel' : item.fuelType === 'hybrid' ? 'Hibrit' : 'Elektrik'}` : '' }}
                      {{ item.year ? `| ${item.year}` : '' }}
                    </span>
                  </div>
                </template>

                <template #item.range1_3="{ item }">
                  <v-text-field
                    v-model.number="item.prices['1-3']"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 100px;"
                    @update:model-value="updatePricing(item, '1-3', $event)"
                  />
                </template>

                <template #item.range4_6="{ item }">
                  <v-text-field
                    v-model.number="item.prices['4-6']"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 100px;"
                    @update:model-value="updatePricing(item, '4-6', $event)"
                  />
                </template>

                <template #item.range7_10="{ item }">
                  <v-text-field
                    v-model.number="item.prices['7-10']"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 100px;"
                    @update:model-value="updatePricing(item, '7-10', $event)"
                  />
                </template>

                <template #item.range11_13="{ item }">
                  <v-text-field
                    v-model.number="item.prices['11-13']"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 100px;"
                    @update:model-value="updatePricing(item, '11-13', $event)"
                  />
                </template>

                <template #item.range14_20="{ item }">
                  <v-text-field
                    v-model.number="item.prices['14-20']"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 100px;"
                    @update:model-value="updatePricing(item, '14-20', $event)"
                  />
                </template>

                <template #item.range21_29="{ item }">
                  <v-text-field
                    v-model.number="item.prices['21-29']"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 100px;"
                    @update:model-value="updatePricing(item, '21-29', $event)"
                  />
                </template>

                <template #item.range30_plus="{ item }">
                  <v-text-field
                    v-model.number="item.prices['30++']"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 100px;"
                    @update:model-value="updatePricing(item, '30++', $event)"
                  />
                </template>

                <template #item.discount="{ item }">
                  <v-text-field
                    v-model.number="item.discount"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 80px;"
                    @update:model-value="updatePricingDiscount(item, $event)"
                  />
                </template>

                <template #item.minDays="{ item }">
                  <v-text-field
                    v-model.number="item.minDays"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 80px;"
                    @update:model-value="updatePricingMinDays(item, $event)"
                  />
                </template>

                <template #item.status="{ item }">
                  <v-select
                    v-model="item.isActive"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="max-width: 120px;"
                    @update:model-value="updatePricingStatus(item, $event)"
                  />
                </template>
              </v-data-table>
            </div>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closePricingDialog">Kapat</v-btn>
            <v-btn color="primary" @click="savePricing" :loading="savingPricing">
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dönüş Bölgesi Ücretleri Dialog -->
      <v-dialog v-model="showDeliveryPricingDialog" max-width="1200" fullscreen scrollable>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-map-marker-multiple" size="24" />
              <span class="text-h6">
                {{ selectedLocationForDeliveryPricing ? `${getLocationName(selectedLocationForDeliveryPricing)}${selectedLocationForDeliveryPricing.province || selectedLocationForDeliveryPricing.district ? ` (${selectedLocationForDeliveryPricing.province || ''}${selectedLocationForDeliveryPricing.district ? ` - ${selectedLocationForDeliveryPricing.district}` : ''})` : ''} => Dönüş Bölgesi Ücretleri` : 'Dönüş Bölgesi Ücretleri' }}
              </span>
            </div>
            <div class="d-flex align-center gap-2">
              <v-btn color="success" prepend-icon="mdi-map-marker" @click="goToLocations">
                Lokasyonlara Git
              </v-btn>
              <v-btn icon="mdi-close" variant="text" @click="closeDeliveryPricingDialog" />
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <v-data-table
              :headers="deliveryPricingTableHeaders"
              :items="deliveryPricingTableData"
              :loading="loadingDeliveryPricing"
              item-value="deliveryLocationId"
              class="elevation-0"
              density="compact"
            >
              <template #item.city="{ item }">
                <span class="font-weight-medium">
                  {{ item.cityName }}
                </span>
              </template>

              <template #item.distance="{ item }">
                <v-text-field
                  v-model.number="item.distance"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                  style="max-width: 120px;"
                  @update:model-value="updateDeliveryPricingDistance(item, $event)"
                />
              </template>

              <template #item.fee="{ item }">
                <v-text-field
                  v-model.number="item.fee"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                  style="max-width: 120px;"
                  suffix="₺"
                  @update:model-value="updateDeliveryPricingFee(item, $event)"
                />
              </template>

              <template #item.status="{ item }">
                <v-select
                  v-model="item.isActive"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  density="compact"
                  hide-details
                  variant="outlined"
                  style="max-width: 120px;"
                  @update:model-value="updateDeliveryPricingStatus(item, $event)"
                />
              </template>
            </v-data-table>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeDeliveryPricingDialog">Kapat</v-btn>
            <v-btn color="primary" @click="saveDeliveryPricing" :loading="savingDeliveryPricing">
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Lokasyon Ekleme/Düzenleme Dialog -->
      <v-dialog v-model="showLocationDialog" max-width="1200" scrollable>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-map-marker" size="24" />
              <span class="text-h6">{{ editingLocation ? 'Lokasyon Düzenle' : 'Lokasyon Ekle' }}</span>
            </div>
            <v-btn icon="mdi-close" variant="text" @click="closeLocationDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-form ref="locationFormRef" v-model="locationFormValid">
              <!-- Dil Sekmeleri -->
              <v-tabs v-model="locationLanguageTab" density="compact" class="mb-4">
                <v-tab
                  v-for="lang in availableLanguages"
                  :key="lang.id"
                  :value="lang.id"
                >
                  {{ lang.name }} ({{ lang.code }})
                  <v-chip v-if="lang.isDefault" size="x-small" color="primary" class="ml-1">Varsayılan</v-chip>
                </v-tab>
              </v-tabs>

              <v-window v-model="locationLanguageTab">
                <v-window-item
                  v-for="lang in availableLanguages"
                  :key="lang.id"
                  :value="lang.id"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="locationForm.translations[lang.id].name"
                        :label="`Lokasyon Adı (${lang.name})`"
                        :placeholder="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için lokasyon adı'"
                        prepend-inner-icon="mdi-map-marker"
                        required
                        :hint="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için lokasyon adı'"
                        persistent-hint
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="locationForm.translations[lang.id].metaTitle"
                        :label="`Meta Title (${lang.name})`"
                        :placeholder="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için meta title'"
                        prepend-inner-icon="mdi-tag"
                        :hint="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için meta title'"
                        persistent-hint
                      />
                    </v-col>
                  </v-row>
                </v-window-item>
              </v-window>

              <v-divider class="my-4" />

              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="locationForm.province"
                    :items="provinces"
                    item-title="name"
                    item-value="name"
                    label="İl"
                    prepend-inner-icon="mdi-map"
                    @update:model-value="onProvinceChange"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="locationForm.district"
                    :items="districts"
                    :disabled="!locationForm.province"
                    label="İlçe"
                    prepend-inner-icon="mdi-map-marker"
                    :placeholder="locationForm.province ? 'İlçe seçin' : 'Önce il seçin'"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="locationForm.type"
                    :items="locationTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Tipi"
                    prepend-inner-icon="mdi-tag"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="locationForm.orderNo"
                    label="Sıra No"
                    type="number"
                    prepend-inner-icon="mdi-sort-numeric"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="locationForm.deliveryFee"
                    label="Teslim Ücreti"
                    type="number"
                    prepend-inner-icon="mdi-currency-try"
                    suffix="₺"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="locationForm.dropFee"
                    label="Drop Ücreti"
                    type="number"
                    prepend-inner-icon="mdi-currency-try"
                    suffix="₺"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="locationForm.minDayCount"
                    label="Min Gün Sayısı"
                    type="number"
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="locationForm.isActive"
                    label="Aktif"
                    color="success"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeLocationDialog">Kapat</v-btn>
            <v-btn color="primary" @click="saveLocation" :loading="savingLocation" :disabled="!locationFormValid">
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import { translateText } from '../services/deepl';
import { TURKEY_CITIES } from '../data/turkey-cities';

// Interfaces
interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface VehicleCategoryTranslationDto {
  id: string;
  languageId: string;
  languageCode: string;
  name: string;
}

interface VehicleCategoryDto {
  id: string;
  isActive: boolean;
  sortOrder: number;
  translations: VehicleCategoryTranslationDto[];
}

interface VehicleBrandDto {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface VehicleModelDto {
  id: string;
  brandId: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface VehiclePlateDto {
  id: string;
  vehicleId: string;
  plateNumber: string;
  registrationDate?: string;
  documentNumber?: string;
  serialNumber?: string;
  km?: number;
  oilKm?: number;
  description?: string;
  comprehensiveInsuranceCompany?: string;
  comprehensiveInsuranceStart?: string;
  comprehensiveInsuranceEnd?: string;
  trafficInsuranceCompany?: string;
  trafficInsuranceStart?: string;
  trafficInsuranceEnd?: string;
  inspectionCompany?: string;
  inspectionStart?: string;
  inspectionEnd?: string;
  exhaustInspectionCompany?: string;
  exhaustInspectionStart?: string;
  exhaustInspectionEnd?: string;
}

interface VehicleDto {
  id: string;
  name: string;
  categoryId?: string | null;
  category?: VehicleCategoryDto | null;
  brandId?: string | null;
  brand?: VehicleBrandDto | null;
  modelId?: string | null;
  model?: VehicleModelDto | null;
  brandName?: string;
  modelName?: string;
  year?: number;
  transmission?: 'automatic' | 'manual';
  fuelType?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  seats?: number;
  luggage?: number;
  largeLuggage?: number;
  smallLuggage?: number;
  doors?: number;
  engineSize?: string;
  horsepower?: string;
  bodyType?: string;
  hasHydraulicSteering?: boolean;
  isFourWheelDrive?: boolean;
  hasAirConditioning?: boolean;
  hasAbs?: boolean;
  hasRadio?: boolean;
  hasCd?: boolean;
  hasSunroof?: boolean;
  order?: number;
  description?: string;
  baseRate?: number;
  currencyCode?: string;
  plates?: VehiclePlateDto[];
  pricingPeriods?: any[];
}

interface LocationTranslationDto {
  id: string;
  languageId: string;
  languageCode: string;
  name: string;
  metaTitle?: string;
}

interface LocationDto {
  id: string;
  translations?: LocationTranslationDto[];
  name?: string;
  metaTitle?: string;
  province?: string;
  district?: string;
  parentRegion?: string;
  type?: 'merkez' | 'otel' | 'havalimani' | 'adres';
  orderNo?: number;
  deliveryFee?: number;
  dropFee?: number;
  minDayCount?: number;
  currencyCode?: string;
  isActive?: boolean;
}

const auth = useAuthStore();
const isRentacarTenant = computed(() => auth.tenant?.category === 'rentacar');

// Data
const vehicles = ref<VehicleDto[]>([]);
const vehicleCategories = ref<VehicleCategoryDto[]>([]);
const vehicleBrands = ref<VehicleBrandDto[]>([]);
const vehicleModels = ref<VehicleModelDto[]>([]);
const availableLanguages = ref<LanguageDto[]>([]);
const locations = ref<LocationDto[]>([]);

// UI State
const mainTab = ref('vehicles');
const showVehicleDialog = ref(false);
const showPlateDialog = ref(false);
const showLocationDialog = ref(false);
const showPricingDialog = ref(false);
const showDeliveryPricingDialog = ref(false);
const activeTab = ref('category');
const loadingVehicles = ref(false);
const loadingLocations = ref(false);
const loadingPricing = ref(false);
const loadingDeliveryPricing = ref(false);
const savingVehicle = ref(false);
const savingCategory = ref(false);
const savingBrand = ref(false);
const savingModel = ref(false);
const savingPlate = ref(false);
const savingLocation = ref(false);
const savingPricing = ref(false);
const savingDeliveryPricing = ref(false);
const updatingLocationField = ref(false);
const deletingPlate = ref(false);
const selectedVehicleForPlate = ref<VehicleDto | null>(null);
const editingPlate = ref<VehiclePlateDto | null>(null);
const editingLocation = ref<LocationDto | null>(null);
const selectedLocationForPricing = ref<LocationDto | null>(null);
const selectedLocationForDeliveryPricing = ref<LocationDto | null>(null);
const selectedMonth = ref(new Date().getMonth() + 1);

// Form Refs
const vehicleFormRef = ref();
const categoryFormRef = ref();
const brandFormRef = ref();
const modelFormRef = ref();
const plateFormRef = ref();
const locationFormRef = ref();
const vehicleFormValid = ref(false);
const categoryFormValid = ref(false);
const brandFormValid = ref(false);
const modelFormValid = ref(false);
const plateFormValid = ref(false);
const locationFormValid = ref(false);

// Forms
const form = reactive({
  name: '',
  categoryId: null as string | null,
  brandId: null as string | null,
  modelId: null as string | null,
  year: new Date().getFullYear(),
  transmission: 'automatic' as 'automatic' | 'manual',
  fuelType: 'gasoline' as 'gasoline' | 'diesel' | 'hybrid' | 'electric',
  seats: 4,
  luggage: 2,
  largeLuggage: 1,
  smallLuggage: 1,
  doors: 4,
  engineSize: '',
  horsepower: '',
  bodyType: '',
  hasHydraulicSteering: false,
  isFourWheelDrive: false,
  hasAirConditioning: false,
  hasAbs: false,
  hasRadio: false,
  hasCd: false,
  hasSunroof: false,
  order: 0,
  description: '',
  baseRate: 0,
  currencyCode: 'EUR',
});

const plateForm = reactive({
  plateNumber: '',
  registrationDate: '',
  documentNumber: '',
  serialNumber: '',
  km: undefined as number | undefined,
  oilKm: undefined as number | undefined,
  description: '',
  comprehensiveInsuranceCompany: '',
  comprehensiveInsuranceStart: '',
  comprehensiveInsuranceEnd: '',
  trafficInsuranceCompany: '',
  trafficInsuranceStart: '',
  trafficInsuranceEnd: '',
  inspectionCompany: '',
  inspectionStart: '',
  inspectionEnd: '',
  exhaustInspectionCompany: '',
  exhaustInspectionStart: '',
  exhaustInspectionEnd: '',
});

const categoryForm = reactive({
  translations: {} as Record<string, string>,
});

const brandForm = reactive({
  name: '',
});

const modelForm = reactive({
  name: '',
});

const categoryLanguageTab = ref('');
const locationLanguageTab = ref('');

// Editing state
const editingVehicle = ref<VehicleDto | null>(null);

// Location Form
const locationForm = reactive({
  translations: {} as Record<string, { name: string; metaTitle: string }>,
  province: '',
  district: '',
  type: 'merkez' as 'merkez' | 'otel' | 'havalimani' | 'adres',
  orderNo: 1000,
  deliveryFee: 0,
  dropFee: 0,
  minDayCount: undefined as number | undefined,
  currencyCode: 'TRY' as string,
  isActive: true,
});

// Provinces and Districts
const provinces = computed(() => TURKEY_CITIES.map(city => ({ name: city.name, code: city.code })));
const districts = ref<string[]>([]);

const locationTypeOptions = [
  { label: 'Merkez', value: 'merkez' },
  { label: 'Otel', value: 'otel' },
  { label: 'Havalimanı', value: 'havalimani' },
  { label: 'Adres', value: 'adres' },
];

// Options
const transmissionOptions = [
  { label: 'Otomatik', value: 'automatic' },
  { label: 'Manuel', value: 'manual' },
];

const fuelTypeOptions = [
  { label: 'Benzin', value: 'gasoline' },
  { label: 'Dizel', value: 'diesel' },
  { label: 'Hibrit', value: 'hybrid' },
  { label: 'Elektrik', value: 'electric' },
];

const engineSizeOptions = [
  '1300 cm3\'e kadar',
  '1300-1600 cm3',
  '1600-2000 cm3',
  '2000 cm3\'ten fazla',
];

const bodyTypeOptions = [
  'Sedan',
  'Hatchback',
  'SUV',
  'Station Wagon',
  'Coupe',
  'Convertible',
];

const horsepowerOptions = [
  '50-75',
  '75-100',
  '100-150',
  '150-200',
  '200+',
];

const yesNoOptions = [
  { label: 'Evet', value: true },
  { label: 'Hayır', value: false },
];

const currencyOptions = [
  { value: 'TRY', title: 'Türk Lirası', symbol: '₺' },
  { value: 'USD', title: 'Amerikan Doları', symbol: '$' },
  { value: 'EUR', title: 'Euro', symbol: '€' },
];

// Table headers
const tableHeaders = [
  { title: 'Plaka', key: 'plate', sortable: false, width: '100px' },
  { title: 'Araç Adı', key: 'name' },
  { title: 'Kategori', key: 'category' },
  { title: 'Marka', key: 'brand' },
  { title: 'Model', key: 'model' },
  { title: 'Yıl', key: 'year' },
  { title: 'Fiyat', key: 'baseRate' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const locationTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Alış Lokasyon Adı', key: 'name', width: '200px' },
  { title: 'Üst Bölge', key: 'parentRegion', width: '150px' },
  { title: 'Tipi', key: 'type', width: '100px' },
  { title: 'Durum', key: 'status', sortable: false, width: '100px' },
  { title: 'Fiyatlandır', key: 'pricing', sortable: false, width: '140px' },
  { title: 'Min. Kiralama Süresi', key: 'minDayCount', width: '150px' },
  { title: 'Sıra', key: 'orderNo', sortable: false, width: '100px' },
  { title: 'Teslim Bölgesi', key: 'deliveryPricing', sortable: false, width: '220px' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '100px' },
];

const months = [
  { label: 'Ocak', value: 1 },
  { label: 'Şubat', value: 2 },
  { label: 'Mart', value: 3 },
  { label: 'Nisan', value: 4 },
  { label: 'Mayıs', value: 5 },
  { label: 'Haziran', value: 6 },
  { label: 'Temmuz', value: 7 },
  { label: 'Ağustos', value: 8 },
  { label: 'Eylül', value: 9 },
  { label: 'Ekim', value: 10 },
  { label: 'Kasım', value: 11 },
  { label: 'Aralık', value: 12 },
];

const statusOptions = [
  { label: 'Aktif', value: true },
  { label: 'Pasif', value: false },
];

const dayRanges = ['1-3', '4-6', '7-10', '11-13', '14-20', '21-29', '30++'] as const;

interface PricingTableItem {
  vehicleId: string;
  vehicleName: string;
  brandName: string;
  modelName: string;
  transmission?: string;
  fuelType?: string;
  year?: number;
  prices: Record<string, number>;
  discount: number;
  minDays: number;
  isActive: boolean;
}

const pricingTableHeaders = [
  { title: 'Araç', key: 'vehicle', width: '250px' },
  { title: '1-3', key: 'range1_3', width: '100px' },
  { title: '4-6', key: 'range4_6', width: '100px' },
  { title: '7-10', key: 'range7_10', width: '100px' },
  { title: '11-13', key: 'range11_13', width: '100px' },
  { title: '14-20', key: 'range14_20', width: '100px' },
  { title: '21-29', key: 'range21_29', width: '100px' },
  { title: '30++', key: 'range30_plus', width: '100px' },
  { title: 'İndirim', key: 'discount', width: '100px' },
  { title: 'Min Gün', key: 'minDays', width: '100px' },
  { title: 'Durum', key: 'status', width: '120px' },
];

const pricingTableData = ref<PricingTableItem[]>([]);

interface DeliveryPricingTableItem {
  deliveryLocationId: string;
  cityName: string;
  distance: number;
  fee: number;
  isActive: boolean;
}

const deliveryPricingTableHeaders = [
  { title: 'Şehir', key: 'city', width: '300px' },
  { title: 'Mesafe', key: 'distance', width: '150px' },
  { title: 'Ücret', key: 'fee', width: '150px' },
  { title: 'Durum', key: 'status', width: '120px' },
];

const deliveryPricingTableData = ref<DeliveryPricingTableItem[]>([]);

// Computed
const selectedBrandName = computed(() => {
  const brand = vehicleBrands.value.find(b => b.id === form.brandId);
  return brand?.name || '';
});

// Methods
const getTabName = (tab: string) => {
  const names: Record<string, string> = {
    category: 'Kategoriler',
    brand: 'Marka',
    model: 'Model',
    vehicle: 'Araçlar',
  };
  return names[tab] || tab;
};

const getCategoryName = (category: VehicleCategoryDto): string => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang) return 'Kategori';
  const translation = category.translations.find(t => t.languageId === defaultLang.id);
  return translation?.name || 'Kategori';
};

const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
    
    // Initialize category form translations
    availableLanguages.value.forEach(lang => {
      if (!categoryForm.translations[lang.id]) {
        categoryForm.translations[lang.id] = '';
      }
    });
    
    // Set default language tab
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    if (defaultLang) {
      categoryLanguageTab.value = defaultLang.id;
    }
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

const loadVehicleCategories = async () => {
  try {
    const { data } = await http.get<VehicleCategoryDto[]>('/vehicle-categories');
    vehicleCategories.value = data;
  } catch (error) {
    console.error('Failed to load vehicle categories:', error);
  }
};

const loadVehicleBrands = async () => {
  try {
    const { data } = await http.get<VehicleBrandDto[]>('/vehicle-brands');
    vehicleBrands.value = data;
  } catch (error) {
    console.error('Failed to load vehicle brands:', error);
  }
};

const loadVehicleModels = async (brandId?: string) => {
  try {
    const params = brandId ? { brandId } : {};
    const { data } = await http.get<VehicleModelDto[]>('/vehicle-models', { params });
    vehicleModels.value = data;
  } catch (error) {
    console.error('Failed to load vehicle models:', error);
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

const openCreateDialog = () => {
  editingVehicle.value = null;
  resetForm();
  showVehicleDialog.value = true;
  activeTab.value = 'category';
};

const closeVehicleDialog = () => {
  showVehicleDialog.value = false;
  resetForm();
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    categoryId: null,
    brandId: null,
    modelId: null,
    year: new Date().getFullYear(),
    transmission: 'automatic',
    fuelType: 'gasoline',
    seats: 4,
    luggage: 2,
    largeLuggage: 1,
    smallLuggage: 1,
    doors: 4,
    engineSize: '',
    horsepower: '',
    bodyType: '',
    hasHydraulicSteering: false,
    isFourWheelDrive: false,
    hasAirConditioning: false,
    hasAbs: false,
    hasRadio: false,
    hasCd: false,
    hasSunroof: false,
    order: 0,
    description: '',
    baseRate: 0,
    currencyCode: 'EUR',
  });
  
  Object.assign(plateForm, {
    plateNumber: '',
    registrationDate: '',
    documentNumber: '',
    serialNumber: '',
    km: undefined,
    oilKm: undefined,
    description: '',
    comprehensiveInsuranceCompany: '',
    comprehensiveInsuranceStart: '',
    comprehensiveInsuranceEnd: '',
    trafficInsuranceCompany: '',
    trafficInsuranceStart: '',
    trafficInsuranceEnd: '',
    inspectionCompany: '',
    inspectionStart: '',
    inspectionEnd: '',
    exhaustInspectionCompany: '',
    exhaustInspectionStart: '',
    exhaustInspectionEnd: '',
  });
  
  availableLanguages.value.forEach(lang => {
    categoryForm.translations[lang.id] = '';
  });
  
  brandForm.name = '';
  modelForm.name = '';
};

// Category methods
const selectCategory = (categoryId: string) => {
  form.categoryId = categoryId;
};

const saveCategory = async () => {
  const validated = await categoryFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingCategory.value = true;
  try {
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    if (!defaultLang) {
      alert('Varsayılan dil bulunamadı');
      return;
    }
    
    const translations = availableLanguages.value.map(lang => ({
      languageId: lang.id,
      name: categoryForm.translations[lang.id] || '',
    })).filter(t => t.name);
    
    if (translations.length === 0) {
      alert('En az bir dil için kategori adı gerekli');
      return;
    }
    
    await http.post('/vehicle-categories', { translations });
    await loadVehicleCategories();
    
    // Reset form
    availableLanguages.value.forEach(lang => {
      categoryForm.translations[lang.id] = '';
    });
  } catch (error: any) {
    alert(error.response?.data?.message || 'Kategori eklenirken bir hata oluştu');
  } finally {
    savingCategory.value = false;
  }
};

const editCategory = (category: VehicleCategoryDto) => {
  // TODO: Implement edit category
  alert('Kategori düzenleme özelliği yakında eklenecek');
};

const deleteCategory = async (id: string) => {
  if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/vehicle-categories/${id}`);
    await loadVehicleCategories();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Kategori silinirken bir hata oluştu');
  }
};

// Brand methods
const selectBrand = (brandId: string) => {
  form.brandId = brandId;
  form.modelId = null; // Reset model when brand changes
  loadVehicleModels(brandId);
};

const saveBrand = async () => {
  const validated = await brandFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingBrand.value = true;
  try {
    await http.post('/vehicle-brands', { name: brandForm.name });
    await loadVehicleBrands();
    brandForm.name = '';
  } catch (error: any) {
    alert(error.response?.data?.message || 'Marka eklenirken bir hata oluştu');
  } finally {
    savingBrand.value = false;
  }
};

const editBrand = (brand: VehicleBrandDto) => {
  // TODO: Implement edit brand
  alert('Marka düzenleme özelliği yakında eklenecek');
};

const deleteBrand = async (id: string) => {
  if (!confirm('Bu markayı silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/vehicle-brands/${id}`);
    await loadVehicleBrands();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Marka silinirken bir hata oluştu');
  }
};

// Model methods
const selectModel = (modelId: string) => {
  form.modelId = modelId;
};

const saveModel = async () => {
  if (!form.brandId) {
    alert('Önce bir marka seçmelisiniz');
    return;
  }
  
  const validated = await modelFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingModel.value = true;
  try {
    await http.post('/vehicle-models', {
      brandId: form.brandId,
      name: modelForm.name,
    });
    await loadVehicleModels(form.brandId);
    modelForm.name = '';
  } catch (error: any) {
    alert(error.response?.data?.message || 'Model eklenirken bir hata oluştu');
  } finally {
    savingModel.value = false;
  }
};

const editModel = (model: VehicleModelDto) => {
  // TODO: Implement edit model
  alert('Model düzenleme özelliği yakında eklenecek');
};

const deleteModel = async (id: string) => {
  if (!confirm('Bu modeli silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/vehicle-models/${id}`);
    await loadVehicleModels(form.brandId);
  } catch (error: any) {
    alert(error.response?.data?.message || 'Model silinirken bir hata oluştu');
  }
};

// Vehicle methods
const saveVehicle = async () => {
  if (!auth.tenant) return;
  
  const validated = await vehicleFormRef.value?.validate();
  if (!validated?.valid) return;
  
  if (!form.categoryId || !form.brandId || !form.modelId) {
    alert('Lütfen kategori, marka ve model seçin');
    return;
  }
  
  savingVehicle.value = true;
  try {
    const vehicleData = {
      tenantId: auth.tenant.id,
      name: form.name,
      categoryId: form.categoryId,
      brandId: form.brandId,
      modelId: form.modelId,
      year: form.year,
      transmission: form.transmission,
      fuelType: form.fuelType,
      seats: form.seats,
      luggage: form.luggage,
      largeLuggage: form.largeLuggage,
      smallLuggage: form.smallLuggage,
      doors: form.doors,
      engineSize: form.engineSize,
      horsepower: form.horsepower,
      bodyType: form.bodyType,
      hasHydraulicSteering: form.hasHydraulicSteering,
      isFourWheelDrive: form.isFourWheelDrive,
      hasAirConditioning: form.hasAirConditioning,
      hasAbs: form.hasAbs,
      hasRadio: form.hasRadio,
      hasCd: form.hasCd,
      hasSunroof: form.hasSunroof,
      order: form.order,
      description: form.description,
      baseRate: form.baseRate,
      currencyCode: form.currencyCode,
    };
    
    if (editingVehicle.value) {
      await http.put(`/rentacar/vehicles/${editingVehicle.value.id}`, vehicleData);
    } else {
      await http.post('/rentacar/vehicles', vehicleData);
    }
    
    await loadVehicles();
    closeVehicleDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Araç kaydedilirken bir hata oluştu');
  } finally {
    savingVehicle.value = false;
  }
};

const editVehicle = (vehicle: VehicleDto) => {
  editingVehicle.value = vehicle;
  Object.assign(form, {
    name: vehicle.name,
    categoryId: vehicle.categoryId || null,
    brandId: vehicle.brandId || null,
    modelId: vehicle.modelId || null,
    year: vehicle.year,
    transmission: vehicle.transmission || 'automatic',
    fuelType: vehicle.fuelType || 'gasoline',
    seats: vehicle.seats || 4,
    luggage: vehicle.luggage || 2,
    largeLuggage: vehicle.largeLuggage || 1,
    smallLuggage: vehicle.smallLuggage || 1,
    doors: vehicle.doors || 4,
    engineSize: vehicle.engineSize || '',
    horsepower: vehicle.horsepower || '',
    bodyType: vehicle.bodyType || '',
    hasHydraulicSteering: vehicle.hasHydraulicSteering || false,
    isFourWheelDrive: vehicle.isFourWheelDrive || false,
    hasAirConditioning: vehicle.hasAirConditioning || false,
    hasAbs: vehicle.hasAbs || false,
    hasRadio: vehicle.hasRadio || false,
    hasCd: vehicle.hasCd || false,
    hasSunroof: vehicle.hasSunroof || false,
    order: vehicle.order || 0,
    description: vehicle.description || '',
    baseRate: vehicle.baseRate || 0,
    currencyCode: vehicle.currencyCode || 'EUR',
  });
  
  if (vehicle.brandId) {
    loadVehicleModels(vehicle.brandId);
  }
  
  showVehicleDialog.value = true;
  activeTab.value = 'vehicle';
};

const deleteVehicle = async (id: string) => {
  if (!confirm('Bu aracı silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/rentacar/vehicles/${id}`);
    await loadVehicles();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Araç silinirken bir hata oluştu');
  }
};

// Plate methods
const openPlateDialog = (vehicle: VehicleDto, plate?: VehiclePlateDto) => {
  selectedVehicleForPlate.value = vehicle;
  editingPlate.value = plate || null;
  if (plate) {
    // Load existing plate data
    Object.assign(plateForm, {
      plateNumber: plate.plateNumber || '',
      registrationDate: plate.registrationDate || '',
      documentNumber: plate.documentNumber || '',
      serialNumber: plate.serialNumber || '',
      km: plate.km,
      oilKm: plate.oilKm,
      description: plate.description || '',
      comprehensiveInsuranceCompany: plate.comprehensiveInsuranceCompany || '',
      comprehensiveInsuranceStart: plate.comprehensiveInsuranceStart || '',
      comprehensiveInsuranceEnd: plate.comprehensiveInsuranceEnd || '',
      trafficInsuranceCompany: plate.trafficInsuranceCompany || '',
      trafficInsuranceStart: plate.trafficInsuranceStart || '',
      trafficInsuranceEnd: plate.trafficInsuranceEnd || '',
      inspectionCompany: plate.inspectionCompany || '',
      inspectionStart: plate.inspectionStart || '',
      inspectionEnd: plate.inspectionEnd || '',
      exhaustInspectionCompany: plate.exhaustInspectionCompany || '',
      exhaustInspectionStart: plate.exhaustInspectionStart || '',
      exhaustInspectionEnd: plate.exhaustInspectionEnd || '',
    });
  } else {
    resetPlateForm();
  }
  showPlateDialog.value = true;
};

const closePlateDialog = () => {
  showPlateDialog.value = false;
  selectedVehicleForPlate.value = null;
  editingPlate.value = null;
  resetPlateForm();
};

const resetPlateForm = () => {
  Object.assign(plateForm, {
    plateNumber: '',
    registrationDate: '',
    documentNumber: '',
    serialNumber: '',
    km: undefined,
    oilKm: undefined,
    description: '',
    comprehensiveInsuranceCompany: '',
    comprehensiveInsuranceStart: '',
    comprehensiveInsuranceEnd: '',
    trafficInsuranceCompany: '',
    trafficInsuranceStart: '',
    trafficInsuranceEnd: '',
    inspectionCompany: '',
    inspectionStart: '',
    inspectionEnd: '',
    exhaustInspectionCompany: '',
    exhaustInspectionStart: '',
    exhaustInspectionEnd: '',
  });
};

const savePlate = async () => {
  if (!selectedVehicleForPlate.value) return;
  
  const validated = await plateFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingPlate.value = true;
  try {
    const plateData: any = {
      plateNumber: plateForm.plateNumber,
      registrationDate: plateForm.registrationDate || undefined,
      documentNumber: plateForm.documentNumber || undefined,
      serialNumber: plateForm.serialNumber || undefined,
      km: plateForm.km,
      oilKm: plateForm.oilKm,
      description: plateForm.description || undefined,
      comprehensiveInsuranceCompany: plateForm.comprehensiveInsuranceCompany || undefined,
      comprehensiveInsuranceStart: plateForm.comprehensiveInsuranceStart || undefined,
      comprehensiveInsuranceEnd: plateForm.comprehensiveInsuranceEnd || undefined,
      trafficInsuranceCompany: plateForm.trafficInsuranceCompany || undefined,
      trafficInsuranceStart: plateForm.trafficInsuranceStart || undefined,
      trafficInsuranceEnd: plateForm.trafficInsuranceEnd || undefined,
      inspectionCompany: plateForm.inspectionCompany || undefined,
      inspectionStart: plateForm.inspectionStart || undefined,
      inspectionEnd: plateForm.inspectionEnd || undefined,
      exhaustInspectionCompany: plateForm.exhaustInspectionCompany || undefined,
      exhaustInspectionStart: plateForm.exhaustInspectionStart || undefined,
      exhaustInspectionEnd: plateForm.exhaustInspectionEnd || undefined,
    };
    
    // Remove undefined values
    Object.keys(plateData).forEach(key => {
      if (plateData[key] === undefined || plateData[key] === '') {
        delete plateData[key];
      }
    });
    
    if (editingPlate.value) {
      // Update existing plate
      await http.put(`/rentacar/vehicles/${selectedVehicleForPlate.value.id}/plates/${editingPlate.value.id}`, plateData);
    } else {
      // Create new plate
      await http.post(`/rentacar/vehicles/${selectedVehicleForPlate.value.id}/plates`, plateData);
    }
    
    await loadVehicles();
    closePlateDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Plaka kaydedilirken bir hata oluştu');
  } finally {
    savingPlate.value = false;
  }
};

const deletePlate = async () => {
  if (!editingPlate.value || !selectedVehicleForPlate.value) return;
  
  if (!confirm(`"${editingPlate.value.plateNumber}" plakasını silmek istediğinizden emin misiniz?`)) {
    return;
  }
  
  deletingPlate.value = true;
  try {
    await http.delete(`/rentacar/vehicles/${selectedVehicleForPlate.value.id}/plates/${editingPlate.value.id}`);
    await loadVehicles();
    closePlateDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Plaka silinirken bir hata oluştu');
  } finally {
    deletingPlate.value = false;
  }
};

// Watch brandId to load models
watch(() => form.brandId, (newBrandId) => {
  if (newBrandId) {
    loadVehicleModels(newBrandId);
  } else {
    vehicleModels.value = [];
  }
});

// Auto-translate category name
const categoryDefaultLanguageId = computed(() => {
  return availableLanguages.value.find(l => l.isDefault)?.id || availableLanguages.value[0]?.id;
});

watch(
  () => {
    const defaultLangId = categoryDefaultLanguageId.value;
    if (!defaultLangId) return '';
    return categoryForm.translations[defaultLangId] || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    
    const defaultLang = availableLanguages.value.find(l => l.id === categoryDefaultLanguageId.value);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        if (categoryForm.translations[lang.id] && categoryForm.translations[lang.id] !== '') continue;
        
        try {
          const translated = await translateText(newValue, lang.code, defaultLang.code);
          categoryForm.translations[lang.id] = translated;
        } catch (error) {
          console.error(`Failed to translate category name to ${lang.code}:`, error);
        }
      }
    }, 1500);
  }
);

// Location methods
const onProvinceChange = (provinceName: string) => {
  const city = TURKEY_CITIES.find(c => c.name === provinceName);
  if (city) {
    districts.value = city.districts;
    locationForm.district = '';
  } else {
    districts.value = [];
  }
};

const getLocationName = (location: LocationDto): string => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang || !location.translations) return location.name || 'Lokasyon';
  const translation = location.translations.find(t => t.languageId === defaultLang.id);
  return translation?.name || location.name || 'Lokasyon';
};

const getLocationTypeLabel = (type?: string): string => {
  const option = locationTypeOptions.find(o => o.value === type);
  return option?.label || type || '-';
};

const loadLocations = async () => {
  if (!auth.tenant) return;
  loadingLocations.value = true;
  try {
    const { data } = await http.get<LocationDto[]>('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });
    locations.value = data;
  } catch (error) {
    console.error('Failed to load locations:', error);
  } finally {
    loadingLocations.value = false;
  }
};

const openLocationDialog = () => {
  editingLocation.value = null;
  resetLocationForm();
  showLocationDialog.value = true;
  
  // Set default language tab
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    locationLanguageTab.value = defaultLang.id;
  }
};

const closeLocationDialog = () => {
  showLocationDialog.value = false;
  resetLocationForm();
};

const resetLocationForm = () => {
  availableLanguages.value.forEach(lang => {
    locationForm.translations[lang.id] = { name: '', metaTitle: '' };
  });
  
  locationForm.province = '';
  locationForm.district = '';
  locationForm.type = 'merkez';
  locationForm.orderNo = 1000;
  locationForm.deliveryFee = 0;
  locationForm.dropFee = 0;
  locationForm.minDayCount = undefined;
  locationForm.currencyCode = 'TRY';
  locationForm.isActive = true;
  districts.value = [];
};

const saveLocation = async () => {
  if (!auth.tenant) return;
  
  const validated = await locationFormRef.value?.validate();
  if (!validated?.valid) return;
  
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang) {
    alert('Varsayılan dil bulunamadı');
    return;
  }
  
  const defaultName = locationForm.translations[defaultLang.id]?.name;
  if (!defaultName) {
    alert('Lokasyon adı gerekli');
    return;
  }
  
  savingLocation.value = true;
  try {
    const translations = availableLanguages.value.map(lang => ({
      languageId: lang.id,
      name: locationForm.translations[lang.id]?.name || '',
      metaTitle: locationForm.translations[lang.id]?.metaTitle || '',
    })).filter(t => t.name);
    
    const locationData = {
      tenantId: auth.tenant.id,
      translations,
      province: locationForm.province,
      district: locationForm.district,
      parentRegion: locationForm.district ? `${locationForm.province} - ${locationForm.district}` : locationForm.province,
      type: locationForm.type,
      orderNo: locationForm.orderNo,
      deliveryFee: locationForm.deliveryFee,
      dropFee: locationForm.dropFee,
      minDayCount: locationForm.minDayCount,
      currencyCode: locationForm.currencyCode,
      isActive: locationForm.isActive,
    };
    
    if (editingLocation.value) {
      await http.put(`/rentacar/locations/${editingLocation.value.id}`, locationData);
    } else {
      await http.post('/rentacar/locations', locationData);
    }
    
    await loadLocations();
    closeLocationDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Lokasyon kaydedilirken bir hata oluştu');
  } finally {
    savingLocation.value = false;
  }
};

const editLocation = (location: LocationDto) => {
  editingLocation.value = location;
  
  // Load translations
  if (location.translations) {
    location.translations.forEach(trans => {
      if (!locationForm.translations[trans.languageId]) {
        locationForm.translations[trans.languageId] = { name: '', metaTitle: '' };
      }
      locationForm.translations[trans.languageId].name = trans.name;
      locationForm.translations[trans.languageId].metaTitle = trans.metaTitle || '';
    });
  } else {
    // Fallback to direct name/metaTitle
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    if (defaultLang && location.name) {
      if (!locationForm.translations[defaultLang.id]) {
        locationForm.translations[defaultLang.id] = { name: '', metaTitle: '' };
      }
      locationForm.translations[defaultLang.id].name = location.name;
      locationForm.translations[defaultLang.id].metaTitle = location.metaTitle || '';
    }
  }
  
  locationForm.province = location.province || '';
  locationForm.district = location.district || '';
  locationForm.type = location.type || 'merkez';
  locationForm.orderNo = location.orderNo || 1000;
  locationForm.deliveryFee = location.deliveryFee || 0;
  locationForm.dropFee = location.dropFee || 0;
  locationForm.minDayCount = location.minDayCount;
  locationForm.currencyCode = location.currencyCode || 'TRY';
  locationForm.isActive = location.isActive !== undefined ? location.isActive : true;
  
  if (locationForm.province) {
    onProvinceChange(locationForm.province);
  }
  
  showLocationDialog.value = true;
  
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    locationLanguageTab.value = defaultLang.id;
  }
};

const deleteLocation = async (id: string) => {
  if (!confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/rentacar/locations/${id}`);
    await loadLocations();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Lokasyon silinirken bir hata oluştu');
  }
};

const updateLocationField = async (location: LocationDto, field: 'minDayCount' | 'orderNo', value: number | undefined) => {
  if (!location.id) return;
  
  updatingLocationField.value = true;
  try {
    const updateData: any = {};
    if (field === 'minDayCount') {
      updateData.minDayCount = value !== undefined && value !== null ? value : null;
    } else if (field === 'orderNo') {
      updateData.orderNo = value !== undefined && value !== null ? value : 1000;
    }

    await http.put(`/rentacar/locations/${location.id}`, updateData);
    
    // Update local data
    const index = locations.value.findIndex(l => l.id === location.id);
    if (index !== -1) {
      if (field === 'minDayCount') {
        locations.value[index].minDayCount = updateData.minDayCount;
      } else if (field === 'orderNo') {
        locations.value[index].orderNo = updateData.orderNo;
      }
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Lokasyon güncellenirken bir hata oluştu');
    // Reload to get correct values
    await loadLocations();
  } finally {
    updatingLocationField.value = false;
  }
};

const openPricingDialog = async (location: LocationDto) => {
  selectedLocationForPricing.value = location;
  selectedMonth.value = new Date().getMonth() + 1;
  showPricingDialog.value = true;
  await loadPricingData();
};

const closePricingDialog = () => {
  showPricingDialog.value = false;
  selectedLocationForPricing.value = null;
  pricingTableData.value = [];
};

const loadPricingData = async () => {
  if (!selectedLocationForPricing.value) return;
  
  loadingPricing.value = true;
  try {
    // Load vehicles
    if (!auth.tenant) return;
    const { data: vehiclesData } = await http.get<VehicleDto[]>('/rentacar/vehicles', {
      params: { tenantId: auth.tenant.id },
    });

    // Load existing pricing for selected month
    const { data: existingPricing } = await http.get('/rentacar/location-pricing', {
      params: {
        locationId: selectedLocationForPricing.value.id,
        month: selectedMonth.value,
      },
    });

    // Create pricing table data
    const tableData: PricingTableItem[] = vehiclesData.map(vehicle => {
      const vehiclePricing = existingPricing.filter((p: any) => p.vehicleId === vehicle.id);
      
      const prices: Record<string, number> = {};
      dayRanges.forEach(range => {
        const pricing = vehiclePricing.find((p: any) => p.dayRange === range);
        prices[range] = pricing ? Number(pricing.price) : 0;
      });

      const firstPricing = vehiclePricing[0];
      
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        brandName: vehicle.brand?.name || vehicle.brandName || '-',
        modelName: vehicle.model?.name || vehicle.modelName || '-',
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        year: vehicle.year,
        prices,
        discount: firstPricing ? Number(firstPricing.discount) : 0,
        minDays: firstPricing ? Number(firstPricing.minDays) : 0,
        isActive: firstPricing ? firstPricing.isActive : true,
      };
    });

    pricingTableData.value = tableData;
  } catch (error) {
    console.error('Failed to load pricing data:', error);
  } finally {
    loadingPricing.value = false;
  }
};

watch(selectedMonth, () => {
  if (showPricingDialog.value) {
    loadPricingData();
  }
});

const updatePricing = (item: PricingTableItem, range: string, value: number | null) => {
  if (value === null || value < 0) {
    item.prices[range] = 0;
  } else {
    item.prices[range] = value;
  }
};

const updatePricingDiscount = (item: PricingTableItem, value: number | null) => {
  if (value === null || value < 0) {
    item.discount = 0;
  } else {
    item.discount = value;
  }
};

const updatePricingMinDays = (item: PricingTableItem, value: number | null) => {
  if (value === null || value < 0) {
    item.minDays = 0;
  } else {
    item.minDays = value;
  }
};

const updatePricingStatus = (item: PricingTableItem, value: boolean) => {
  item.isActive = value;
};

const savePricing = async () => {
  if (!selectedLocationForPricing.value) return;
  
  savingPricing.value = true;
  try {
    const pricings: any[] = [];
    
    pricingTableData.value.forEach(item => {
      dayRanges.forEach(range => {
        const price = item.prices[range] || 0;
        if (price > 0) {
          pricings.push({
            vehicleId: item.vehicleId,
            dayRange: range,
            price: price,
            discount: item.discount || 0,
            minDays: item.minDays || 0,
            isActive: item.isActive,
          });
        }
      });
    });

    await http.post('/rentacar/location-pricing/bulk', {
      locationId: selectedLocationForPricing.value.id,
      month: selectedMonth.value,
      pricings,
    });

    await loadPricingData();
    alert('Fiyatlandırma başarıyla kaydedildi');
  } catch (error: any) {
    alert(error.response?.data?.message || 'Fiyatlandırma kaydedilirken bir hata oluştu');
  } finally {
    savingPricing.value = false;
  }
};

const openDeliveryPricingDialog = async (location: LocationDto) => {
  selectedLocationForDeliveryPricing.value = location;
  showDeliveryPricingDialog.value = true;
  await loadDeliveryPricingData();
};

const closeDeliveryPricingDialog = () => {
  showDeliveryPricingDialog.value = false;
  selectedLocationForDeliveryPricing.value = null;
  deliveryPricingTableData.value = [];
};

const goToLocations = () => {
  closeDeliveryPricingDialog();
  mainTab.value = 'locations';
};

const loadDeliveryPricingData = async () => {
  if (!selectedLocationForDeliveryPricing.value || !auth.tenant) return;
  
  loadingDeliveryPricing.value = true;
  try {
    // Load all locations for the tenant
    const { data: allLocations } = await http.get<LocationDto[]>('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });

    // Load existing delivery pricing
    const { data: existingPricing } = await http.get('/rentacar/location-delivery-pricing', {
      params: {
        locationId: selectedLocationForDeliveryPricing.value.id,
      },
    });

    // Create table data from all locations
    const tableData: DeliveryPricingTableItem[] = allLocations
      .filter(loc => loc.id !== selectedLocationForDeliveryPricing.value?.id) // Exclude current location
      .map(location => {
        const existing = existingPricing.find((p: any) => p.deliveryLocationId === location.id);
        
        const cityName = location.district 
          ? `${location.province} - ${location.district}`
          : location.province || getLocationName(location);

        return {
          deliveryLocationId: location.id,
          cityName,
          distance: existing ? Number(existing.distance) : 0,
          fee: existing ? Number(existing.fee) : 0,
          isActive: existing ? existing.isActive : true,
        };
      });

    deliveryPricingTableData.value = tableData;
  } catch (error) {
    console.error('Failed to load delivery pricing data:', error);
  } finally {
    loadingDeliveryPricing.value = false;
  }
};

const updateDeliveryPricingDistance = (item: DeliveryPricingTableItem, value: number | null) => {
  if (value === null || value < 0) {
    item.distance = 0;
  } else {
    item.distance = value;
  }
};

const updateDeliveryPricingFee = (item: DeliveryPricingTableItem, value: number | null) => {
  if (value === null || value < 0) {
    item.fee = 0;
  } else {
    item.fee = value;
  }
};

const updateDeliveryPricingStatus = (item: DeliveryPricingTableItem, value: boolean) => {
  item.isActive = value;
};

const saveDeliveryPricing = async () => {
  if (!selectedLocationForDeliveryPricing.value) return;
  
  savingDeliveryPricing.value = true;
  try {
    const pricings = deliveryPricingTableData.value.map(item => ({
      deliveryLocationId: item.deliveryLocationId,
      distance: item.distance || 0,
      fee: item.fee || 0,
      isActive: item.isActive,
    }));

    await http.post('/rentacar/location-delivery-pricing/bulk', {
      locationId: selectedLocationForDeliveryPricing.value.id,
      pricings,
    });

    await loadDeliveryPricingData();
    alert('Dönüş bölgesi ücretleri başarıyla kaydedildi');
  } catch (error: any) {
    alert(error.response?.data?.message || 'Dönüş bölgesi ücretleri kaydedilirken bir hata oluştu');
  } finally {
    savingDeliveryPricing.value = false;
  }
};

// Auto-translate location name and meta title
const locationDefaultLanguageId = computed(() => {
  return availableLanguages.value.find(l => l.isDefault)?.id || availableLanguages.value[0]?.id;
});

watch(
  () => {
    const defaultLangId = locationDefaultLanguageId.value;
    if (!defaultLangId) return { name: '', metaTitle: '' };
    return {
      name: locationForm.translations[defaultLangId]?.name || '',
      metaTitle: locationForm.translations[defaultLangId]?.metaTitle || '',
    };
  },
  async (newValue, oldValue) => {
    if (!newValue.name || (newValue.name === oldValue?.name && newValue.metaTitle === oldValue?.metaTitle)) return;
    
    const defaultLang = availableLanguages.value.find(l => l.id === locationDefaultLanguageId.value);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        
        if (!locationForm.translations[lang.id]) {
          locationForm.translations[lang.id] = { name: '', metaTitle: '' };
        }
        
        // Translate name
        if (newValue.name && (!locationForm.translations[lang.id].name || locationForm.translations[lang.id].name === '')) {
          try {
            const translated = await translateText(newValue.name, lang.code, defaultLang.code);
            locationForm.translations[lang.id].name = translated;
          } catch (error) {
            console.error(`Failed to translate location name to ${lang.code}:`, error);
          }
        }
        
        // Translate meta title
        if (newValue.metaTitle && (!locationForm.translations[lang.id].metaTitle || locationForm.translations[lang.id].metaTitle === '')) {
          try {
            const translated = await translateText(newValue.metaTitle, lang.code, defaultLang.code);
            locationForm.translations[lang.id].metaTitle = translated;
          } catch (error) {
            console.error(`Failed to translate meta title to ${lang.code}:`, error);
          }
        }
      }
    }, 1500);
  },
  { deep: true }
);

onMounted(async () => {
  if (isRentacarTenant.value) {
    await Promise.all([
      loadLanguages(),
      loadVehicleCategories(),
      loadVehicleBrands(),
      loadVehicles(),
      loadLocations(),
    ]);
    
    // Initialize location form translations
    availableLanguages.value.forEach(lang => {
      if (!locationForm.translations[lang.id]) {
        locationForm.translations[lang.id] = { name: '', metaTitle: '' };
      }
    });
  }
});
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  margin: 0 -16px;
  padding: 0 16px;
}

.location-table {
  width: 100%;
  min-width: 100%;
}

.location-table :deep(.v-data-table__wrapper) {
  width: 100%;
}

.location-table :deep(table) {
  width: 100%;
  table-layout: auto;
}

.location-table :deep(th),
.location-table :deep(td) {
  white-space: nowrap;
  padding: 10px 12px !important;
  vertical-align: middle;
}

.location-table :deep(th) {
  font-weight: 600;
  font-size: 0.875rem;
}

.location-table :deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-surface), 1);
}

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

.location-table :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}
</style>
