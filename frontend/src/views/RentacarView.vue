<template>
  <div>
    <v-alert type="warning" variant="tonal" class="mb-4" v-if="!isRentacarTenant">
      Bu modül yalnızca rent a car tenantlar için aktiftir.
    </v-alert>

    <template v-else>
      <!-- Araç Listesi -->
      <v-card elevation="2" class="mb-4">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import { translateText } from '../services/deepl';

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

const auth = useAuthStore();
const isRentacarTenant = computed(() => auth.tenant?.category === 'rentacar');

// Data
const vehicles = ref<VehicleDto[]>([]);
const vehicleCategories = ref<VehicleCategoryDto[]>([]);
const vehicleBrands = ref<VehicleBrandDto[]>([]);
const vehicleModels = ref<VehicleModelDto[]>([]);
const availableLanguages = ref<LanguageDto[]>([]);

// UI State
const showVehicleDialog = ref(false);
const showPlateDialog = ref(false);
const activeTab = ref('category');
const loadingVehicles = ref(false);
const savingVehicle = ref(false);
const savingCategory = ref(false);
const savingBrand = ref(false);
const savingModel = ref(false);
const savingPlate = ref(false);
const deletingPlate = ref(false);
const selectedVehicleForPlate = ref<VehicleDto | null>(null);
const editingPlate = ref<VehiclePlateDto | null>(null);

// Form Refs
const vehicleFormRef = ref();
const categoryFormRef = ref();
const brandFormRef = ref();
const modelFormRef = ref();
const plateFormRef = ref();
const vehicleFormValid = ref(false);
const categoryFormValid = ref(false);
const brandFormValid = ref(false);
const modelFormValid = ref(false);
const plateFormValid = ref(false);

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

// Editing state
const editingVehicle = ref<VehicleDto | null>(null);

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

onMounted(async () => {
  if (isRentacarTenant.value) {
    await Promise.all([
      loadLanguages(),
      loadVehicleCategories(),
      loadVehicleBrands(),
      loadVehicles(),
    ]);
  }
});
</script>
