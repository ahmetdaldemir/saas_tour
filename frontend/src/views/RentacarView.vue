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
          <v-tab value="categories">
            <v-icon start icon="mdi-tag" />
            Kategoriler
          </v-tab>
          <v-tab value="brands">
            <v-icon start icon="mdi-alpha-b-box" />
            Markalar
          </v-tab>
          <v-tab value="models">
            <v-icon start icon="mdi-shape" />
            Modeller
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
        <v-card-text class="pa-4">
          <!-- Filtre Seçici -->
          <div class="mb-4">
            <div class="d-flex align-center gap-4 flex-wrap">
              <div class="flex-grow-1">
                <v-radio-group v-model="vehicleFilter" inline hide-details>
                  <v-radio
                    label="Tüm Araçlar"
                    value="all"
                    color="primary"
                  />
                  <v-radio
                    label="Rezervasyondaki Araçlar"
                    value="reserved"
                    color="warning"
                  />
                  <v-radio
                    label="Boşta Olan Araçlar"
                    value="available"
                    color="success"
                  />
                </v-radio-group>
              </div>
              <div style="min-width: 200px;">
                <v-select
                  v-model="selectedBrandFilter"
                  :items="brandFilterOptions"
                  item-title="label"
                  item-value="value"
                  label="Marka Filtresi"
                  prepend-inner-icon="mdi-alpha-b-box"
                  density="compact"
                  clearable
                  hide-details
                />
              </div>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-text class="pa-0">
          <v-data-table
            :headers="tableHeaders"
            :items="filteredVehicles"
            :loading="loadingVehicles"
            :expanded="Array.from(expandedVehicles)"
            item-value="id"
            class="elevation-0"
          >
            <template #item.plate="{ item }">
              <div class="d-flex align-center flex-wrap gap-1">
                <template v-if="item.plates && item.plates.length > 0">
                  <v-chip
                    v-for="plate in item.plates"
                    :key="plate.id"
                    color="info"
                    variant="flat"
                    size="small"
                    prepend-icon="mdi-card-text"
                    style="cursor: pointer;"
                    @click="openPlateDialog(item.vehicle, plate)"
                  >
                    {{ plate.plateNumber }}
                  </v-chip>
                </template>
                <span v-else class="text-caption text-grey">Plaka yok</span>
                <v-btn
                  icon="mdi-plus"
                  variant="text"
                  size="small"
                  color="primary"
                  @click="openPlateDialog(item.vehicle)"
                  title="Yeni Plaka Ekle"
                />
              </div>
            </template>

            <template #item.name="{ item }">
              <div class="d-flex align-center gap-2" style="cursor: pointer;" @click="toggleVehicleDetails(item.id)">
                <v-icon 
                  :icon="expandedVehicles.has(item.id) ? 'mdi-chevron-down' : 'mdi-chevron-right'" 
                  size="16" 
                  color="primary"
                />
                <v-icon icon="mdi-car" size="20" color="primary" />
                <span class="font-weight-medium">{{ item.vehicle.name }}</span>
              </div>
            </template>

            <template #item.category="{ item }">
              <v-chip v-if="item.vehicle.category" size="small" color="primary" variant="tonal">
                {{ getCategoryName(item.vehicle.category) }}
              </v-chip>
              <span v-else class="text-grey">-</span>
            </template>

            <template #item.brand="{ item }">
              <span>{{ item.vehicle.brand?.name || item.vehicle.brandName || '-' }}</span>
            </template>

            <template #item.model="{ item }">
              <span>{{ item.vehicle.model?.name || item.vehicle.modelName || '-' }}</span>
            </template>

            <template #item.year="{ item }">
              <span>{{ item.vehicle.year || '-' }}</span>
            </template>

            <template #item.lastReturnLocation="{ item }">
              <v-select
                :model-value="item.vehicle.lastReturnLocationId || ''"
                :items="availableLocations"
                item-title="name"
                item-value="id"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 200px;"
                :placeholder="item.vehicle.lastReturnLocation ? getLocationName(item.vehicle.lastReturnLocation) : 'Lokasyon seçin'"
                @update:model-value="updateVehicleLastLocation(item.vehicle.id, $event)"
              >
                <template #prepend-inner>
                  <v-icon icon="mdi-map-marker" size="16" />
                </template>
              </v-select>
            </template>

            <template #item.status="{ item }">
              <v-btn
                :color="getVehicleStatus(item).color"
                :icon="getVehicleStatus(item).icon"
                :variant="getVehicleStatus(item).variant"
                size="small"
                :class="getVehicleStatus(item).class"
              />
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-image-multiple" variant="text" size="small" color="primary" @click="openImageDialog(item.vehicle)" title="Resimler" />
              <v-btn icon="mdi-pencil" variant="text" size="small" @click="editVehicle(item.vehicle)" />
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteVehicle(item.vehicle.id)" />
            </template>

            <!-- Expanded Details Row -->
            <template #expanded-row="{ item }">
              <tr>
                <td :colspan="tableHeaders.length" class="pa-4">
                  <v-card variant="outlined" class="pa-4">
                    <div class="d-flex flex-column gap-3">
                      <h4 class="text-subtitle-1 font-weight-bold mb-2">Araç Detayları</h4>
                      
                      <!-- Araç Bilgileri -->
                      <v-row>
                        <v-col cols="12" md="6">
                          <div class="d-flex align-center gap-2">
                            <v-icon icon="mdi-calendar-plus" size="20" color="primary" />
                            <span class="font-weight-medium">Giriş Tarihi:</span>
                            <span>{{ item.vehicle.createdAt ? new Date(item.vehicle.createdAt).toLocaleDateString('tr-TR') : '-' }}</span>
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="d-flex align-center gap-2">
                            <v-icon icon="mdi-map-marker" size="20" color="primary" />
                            <span class="font-weight-medium">Son Şehir:</span>
                            <span>-</span>
                          </div>
                        </v-col>
                      </v-row>

                      <!-- Plaka Bilgileri -->
                      <div v-if="item.plates && item.plates.length > 0">
                        <h5 class="text-subtitle-2 font-weight-bold mb-3">Plaka Bilgileri</h5>
                        <v-row v-for="(plate, index) in item.plates" :key="plate.id" class="mb-2">
                          <v-col cols="12">
                            <v-card variant="outlined" class="pa-3">
                              <div class="d-flex align-center gap-2 mb-2">
                                <v-icon icon="mdi-card-text" size="20" color="primary" />
                                <span class="font-weight-bold">Plaka {{ index + 1 }}: {{ plate.plateNumber }}</span>
                              </div>
                              <v-row>
                                <v-col cols="12" md="6">
                                  <div class="d-flex align-center gap-2">
                                    <v-icon icon="mdi-file-document" size="18" color="primary" />
                                    <span class="font-weight-medium">Belge Seri No:</span>
                                    <span>{{ plate.documentNumber || plate.serialNumber || '-' }}</span>
                                  </div>
                                </v-col>
                                <v-col cols="12" md="6">
                                  <div class="d-flex align-center gap-2">
                                    <v-icon icon="mdi-calendar-check" size="18" color="primary" />
                                    <span class="font-weight-medium">Tescil Tarihi:</span>
                                    <span>{{ plate.registrationDate ? new Date(plate.registrationDate).toLocaleDateString('tr-TR') : '-' }}</span>
                                  </div>
                                </v-col>
                                <v-col cols="12" md="6">
                                  <div class="d-flex align-center gap-2">
                                    <v-icon icon="mdi-speedometer" size="18" color="primary" />
                                    <span class="font-weight-medium">Son Km:</span>
                                    <span>{{ plate.km || '-' }}</span>
                                  </div>
                                </v-col>
                              </v-row>
                            </v-card>
                          </v-col>
                        </v-row>
                      </div>
                      <div v-else class="text-grey text-caption">Plaka bilgisi bulunmamaktadır.</div>
                    </div>
                  </v-card>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Kategoriler Sekmesi -->
          <v-window-item value="categories">
            <v-card elevation="0" class="mb-4">
              <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
                <span class="text-h6 font-weight-bold">Araç Kategorileri</span>
                <div class="d-flex align-center gap-2">
                  <v-btn icon="mdi-refresh" variant="text" @click="loadVehicleCategories" />
                  <v-btn color="primary" prepend-icon="mdi-plus" @click="showCategoryDialog = true">
                    Yeni Kategori Ekle
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="categoryTableHeaders"
                  :items="vehicleCategories"
                  :loading="loadingCategories"
                  item-value="id"
                  class="elevation-0"
                >
                  <template #item.name="{ item }">
                    {{ getCategoryName(item) }}
                  </template>
                  <template #item.translations="{ item }">
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="trans in item.translations"
                        :key="trans.id"
                        size="small"
                        color="primary"
                        variant="tonal"
                      >
                        {{ trans.language?.code?.toUpperCase() || 'N/A' }}: {{ trans.name }}
                      </v-chip>
                    </div>
                  </template>
                  <template #item.isActive="{ item }">
                    <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" variant="tonal">
                      {{ item.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </template>
                  <template #item.actions="{ item }">
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click="editCategory(item)" />
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteCategory(item.id)" />
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Markalar Sekmesi -->
          <v-window-item value="brands">
            <v-card elevation="0" class="mb-4">
              <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
                <span class="text-h6 font-weight-bold">Araç Markaları</span>
                <div class="d-flex align-center gap-2">
                  <v-btn icon="mdi-refresh" variant="text" @click="loadVehicleBrands" />
                  <v-btn color="primary" prepend-icon="mdi-plus" @click="showBrandDialog = true">
                    Yeni Marka Ekle
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="brandTableHeaders"
                  :items="vehicleBrands"
                  :loading="loadingBrands"
                  item-value="id"
                  class="elevation-0"
                >
                  <template #item.isActive="{ item }">
                    <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" variant="tonal">
                      {{ item.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </template>
                  <template #item.models="{ item }">
                    <v-chip size="small" color="info" variant="tonal">
                      {{ item.models?.length || 0 }} Model
                    </v-chip>
                  </template>
                  <template #item.actions="{ item }">
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click="editBrand(item)" />
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteBrand(item.id)" />
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Modeller Sekmesi -->
          <v-window-item value="models">
            <v-card elevation="0" class="mb-4">
              <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
                <span class="text-h6 font-weight-bold">Araç Modelleri</span>
                <div class="d-flex align-center gap-2">
                  <v-select
                    v-model="selectedBrandForModels"
                    :items="brandFilterOptions"
                    item-title="label"
                    item-value="value"
                    label="Marka Filtresi"
                    prepend-inner-icon="mdi-filter"
                    density="compact"
                    clearable
                    style="max-width: 250px;"
                    hide-details
                    @update:model-value="handleModelBrandFilter"
                  />
                  <v-btn icon="mdi-refresh" variant="text" @click="loadVehicleModels" />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="showModelDialog = true"
                    :disabled="!selectedBrandForModels"
                  >
                    Yeni Model Ekle
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="modelTableHeaders"
                  :items="filteredModelsForTable"
                  :loading="loadingModels"
                  item-value="id"
                  class="elevation-0"
                >
                  <template #item.brand="{ item }">
                    {{ getBrandName(item.brandId) }}
                  </template>
                  <template #item.isActive="{ item }">
                    <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" variant="tonal">
                      {{ item.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </template>
                  <template #item.actions="{ item }">
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click="editModel(item)" />
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteModel(item.id)" />
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
                    :items="displayedLocations"
                    :loading="loadingLocations"
                    item-value="id"
                    class="elevation-0 location-table"
                    density="compact"
                  >
                  <template #item.index="{ index }">
                    <span>{{ index + 1 }}</span>
                  </template>

                  <template #item.name="{ item }">
                    <div class="d-flex align-center gap-2" :style="{ paddingLeft: item.isChild ? '40px' : '0' }">
                      <v-icon 
                        v-if="item.type === 'merkez'"
                        :icon="expandedLocations.has(item.id) ? 'mdi-chevron-down' : 'mdi-chevron-right'" 
                        size="16" 
                        color="primary"
                        style="cursor: pointer;"
                        @click.stop="toggleLocationExpansion(item.id)"
                      />
                      <v-icon 
                        v-else
                        icon="mdi-map-marker-outline" 
                        size="16" 
                        color="grey"
                      />
                      <v-icon icon="mdi-map-marker" size="20" color="primary" />
                      <span class="font-weight-medium">{{ getLocationName(item) }}</span>
                    </div>
                  </template>

                  <template #item.parent="{ item }">
                    <span>{{ item.parent?.name || '-' }}</span>
                  </template>

                  <template #item.type="{ item }">
                    <v-chip size="small" color="info" variant="tonal">
                      {{ getLocationTypeLabel(item.type) }}
                    </v-chip>
                  </template>

                  <template #item.status="{ item }">
                    <v-switch
                      v-model="item.isActive"
                      color="success"
                      hide-details
                      density="compact"
                      @update:model-value="updateLocationStatus(item, $event as boolean)"
                    >
                  
                    </v-switch>
                  </template>

                  <template #item.pricing="{ item }">
                    <v-btn 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                      @click="openPricingDialog(item)"
                      class="text-uppercase"
                      :prepend-icon="getCurrencyIcon(defaultCurrency?.code || 'TRY')"
                      :suffix="getCurrencySymbol(defaultCurrency?.code || 'TRY')"
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

                  <template #item.sort="{ item }">
                    <v-text-field
                      v-model.number="item.sort"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @blur="updateLocationField(item, 'sort', item.sort)"
                      @keyup.enter="updateLocationField(item, 'sort', item.sort)"
                    />
                  </template>

                  <template #item.deliveryPricing="{ item }">
                    <v-btn 
                      v-if="!item.parentId"
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
                    <v-btn 
                      icon="mdi-delete" 
                      variant="text" 
                      size="small" 
                      color="error" 
                      :loading="deletingLocation === item.id"
                      @click="deleteLocation(item.id)" 
                    />
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
            </div>
            <v-btn icon="mdi-close" variant="text" @click="closeVehicleDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <v-progress-linear
              v-if="loadingCategories || loadingBrands"
              indeterminate
              color="primary"
              class="mb-0"
            />
            <div class="pa-6">

              <!-- Araç Detay Bilgileri -->
              <h3 class="text-h6 mb-4">Araç Detay Bilgileri</h3>
                  
              <v-form ref="vehicleFormRef" v-model="vehicleFormValid">
                    <v-row>
                      <!-- Kategori Seçimi -->
                      <v-col cols="12" md="4">
                        <v-autocomplete
                          v-model="form.categoryId"
                          :items="categoryOptions"
                          item-title="title"
                          item-value="value"
                          label="Araç Kategorisi *"
                          placeholder="Kategori seçiniz"
                          prepend-inner-icon="mdi-tag"
                          :rules="[rules.required]"
                          clearable
                          variant="outlined"
                          density="comfortable"
                        >
                          <template #append-inner>
                            <v-btn
                              icon="mdi-plus"
                              variant="text"
                              size="small"
                              @click.stop="showCategoryDialog = true"
                              title="Yeni Kategori Ekle"
                            />
                          </template>
                        </v-autocomplete>
                      </v-col>

                      <!-- Marka Seçimi -->
                      <v-col cols="12" md="4">
                        <v-autocomplete
                          v-model="form.brandId"
                          :items="brandOptions"
                          item-title="title"
                          item-value="value"
                          label="Araç Markası *"
                          placeholder="Marka seçiniz"
                          prepend-inner-icon="mdi-alpha-b-box"
                          :rules="[rules.required]"
                          clearable
                          variant="outlined"
                          density="comfortable"
                          @update:model-value="handleBrandChange"
                        >
                          <template #append-inner>
                            <v-btn
                              icon="mdi-plus"
                              variant="text"
                              size="small"
                              @click.stop="showBrandDialog = true"
                              title="Yeni Marka Ekle"
                            />
                          </template>
                        </v-autocomplete>
                      </v-col>

                      <!-- Model Seçimi -->
                      <v-col cols="12" md="4">
                        <v-autocomplete
                          v-model="form.modelId"
                          :items="filteredModelOptions"
                          item-title="title"
                          item-value="value"
                          label="Araç Modeli *"
                          placeholder="Model seçiniz"
                          prepend-inner-icon="mdi-shape"
                          :rules="[rules.required]"
                          :disabled="!form.brandId"
                          clearable
                          variant="outlined"
                          density="comfortable"
                          :hint="!form.brandId ? 'Önce marka seçiniz' : ''"
                          persistent-hint
                        >
                          <template #append-inner>
                            <v-btn
                              icon="mdi-plus"
                              variant="text"
                              size="small"
                              :disabled="!form.brandId"
                              @click.stop="showModelDialog = true"
                              title="Yeni Model Ekle"
                            />
                          </template>
                        </v-autocomplete>
                      </v-col>

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
                      <v-col cols="12" md="4">
                        <v-text-file-input  
                          v-model="form.imageUrl"
                          label="Resim"
                          prepend-inner-icon="mdi-image"
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
                    </v-row>
                  </v-form>
                </div>
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

      <!-- Category Add Dialog -->
      <v-dialog v-model="showCategoryDialog" max-width="600">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">{{ editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle' }}</span>
            <v-btn icon="mdi-close" variant="text" @click="closeCategoryDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-form ref="categoryFormRef" v-model="categoryFormValid">
              <v-tabs v-model="categoryLanguageTab" density="compact" class="mb-4">
                <v-tab
                  v-for="lang in availableLanguages"
                  :key="lang.id"
                  :value="lang.id"
                >
                  {{ lang.name }}
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
                    prepend-inner-icon="mdi-tag"
                    required
                  />
                </v-window-item>
              </v-window>
            </v-form>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeCategoryDialog">İptal</v-btn>
            <v-btn color="primary" @click="saveCategoryAndClose" :loading="savingCategory" :disabled="!categoryFormValid">
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Brand Add Dialog -->
      <v-dialog v-model="showBrandDialog" max-width="500">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">{{ editingBrand ? 'Marka Düzenle' : 'Yeni Marka Ekle' }}</span>
            <v-btn icon="mdi-close" variant="text" @click="closeBrandDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-form ref="brandFormRef" v-model="brandFormValid">
              <v-text-field
                v-model="brandForm.name"
                label="Marka Adı"
                prepend-inner-icon="mdi-alpha-b-box"
                required
              />
            </v-form>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeBrandDialog">İptal</v-btn>
            <v-btn color="primary" @click="saveBrandAndClose" :loading="savingBrand" :disabled="!brandFormValid">
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Model Add Dialog -->
      <v-dialog v-model="showModelDialog" max-width="500">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">{{ editingModel ? 'Model Düzenle' : 'Yeni Model Ekle' }}</span>
            <v-btn icon="mdi-close" variant="text" @click="closeModelDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-alert v-if="!form.brandId && !editingModel" type="warning" variant="tonal" class="mb-4">
              Önce bir marka seçmelisiniz.
            </v-alert>
            <v-form v-if="form.brandId || editingModel" ref="modelFormRef" v-model="modelFormValid">
              <v-select
                v-if="editingModel"
                v-model="form.brandId"
                :items="vehicleBrands"
                item-title="name"
                item-value="id"
                label="Marka"
                prepend-inner-icon="mdi-alpha-b-box"
                required
                class="mb-4"
              />
              <v-text-field
                v-model="modelForm.name"
                label="Model Adı"
                prepend-inner-icon="mdi-shape"
                required
              />
            </v-form>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeModelDialog">İptal</v-btn>
            <v-btn
              color="primary"
              @click="saveModelAndClose"
              :loading="savingModel"
              :disabled="!modelFormValid || (!form.brandId && !editingModel)"
            >
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
              <span class="text-h6">Plakalar</span>
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

            <!-- Mevcut Plakalar Listesi -->
            <div v-if="selectedVehicleForPlate && selectedVehicleForPlate.plates && selectedVehicleForPlate.plates.length > 0" class="mb-6">
              <h3 class="text-subtitle-1 mb-3">Mevcut Plakalar</h3>
              <v-list>
                <v-list-item
                  v-for="(plate, index) in selectedVehicleForPlate.plates"
                  :key="plate.id"
                  class="mb-2"
                  style="border: 1px solid rgba(0,0,0,0.12); border-radius: 4px;"
                >
                  <template #prepend>
                    <v-btn
                      icon="mdi-plus"
                      variant="text"
                      size="small"
                      color="primary"
                      @click="addNewPlateAfter(index)"
                    />
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ plate.plateNumber }}</v-list-item-title>
                  <v-list-item-subtitle v-if="plate.registrationDate">
                    Tescil: {{ plate.registrationDate }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center gap-1">
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        @click="editPlateInDialog(plate)"
                      />
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        size="small"
                        color="error"
                        @click="deletePlateInDialog(plate.id)"
                      />
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <!-- Yeni Plaka Ekleme Formu -->
            <div class="mb-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <h3 class="text-subtitle-1">{{ editingPlate ? 'Plaka Düzenle' : 'Yeni Plaka Ekle' }}</h3>
                <v-btn
                  v-if="editingPlate"
                  icon="mdi-close"
                  variant="text"
                  size="small"
                  @click="cancelPlateEdit"
                />
              </div>
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
            <v-btn variant="text" @click="closePlateDialog">Kapat</v-btn>
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
            <v-btn color="primary" @click="savePlate" :loading="savingPlate" :disabled="!plateFormValid">
              {{ editingPlate ? 'Güncelle' : 'Ekle' }}
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
                {{ selectedLocationForPricing ? `${getLocationName(selectedLocationForPricing)} => Fiyatlandırma` : 'Fiyatlandırma' }}
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
                      {{ item.brandName && item.brandName !== '-' ? item.brandName : 'Marka Seçilmemiş' }} | 
                      {{ item.modelName && item.modelName !== '-' ? item.modelName : 'Model Seçilmemiş' }}
                    </span>
                    <span class="text-caption text-grey">
                      {{ item.transmission ? (item.transmission === 'automatic' ? 'Automatic' : 'Manuel') : '' }}
                      {{ item.fuelType ? `| ${item.fuelType === 'gasoline' ? 'Benzin' : item.fuelType === 'diesel' ? 'Dizel' : item.fuelType === 'hybrid' ? 'Hibrit' : 'Elektrik'}` : '' }}
                      {{ item.year ? `| ${item.year}` : '' }}
                    </span>
                  </div>
                </template>

                <template #item.range1_3="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-text-field
                      v-model.number="item.prices['1-3']"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @update:model-value="updatePricing(item, '1-3', $event)"
                    />
                    <v-btn
                      icon="mdi-content-copy"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="copyPriceToAll(item, '1-3')"
                      title="Tamamına Kopyala"
                    />
                  </div>
                </template>

                <template #item.range4_6="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-text-field
                      v-model.number="item.prices['4-6']"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @update:model-value="updatePricing(item, '4-6', $event)"
                    />
                    <v-btn
                      icon="mdi-content-copy"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="copyPriceToAll(item, '4-6')"
                      title="Tamamına Kopyala"
                    />
                  </div>
                </template>

                <template #item.range7_10="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-text-field
                      v-model.number="item.prices['7-10']"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @update:model-value="updatePricing(item, '7-10', $event)"
                    />
                    <v-btn
                      icon="mdi-content-copy"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="copyPriceToAll(item, '7-10')"
                      title="Tamamına Kopyala"
                    />
                  </div>
                </template>

                <template #item.range11_13="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-text-field
                      v-model.number="item.prices['11-13']"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @update:model-value="updatePricing(item, '11-13', $event)"
                    />
                    <v-btn
                      icon="mdi-content-copy"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="copyPriceToAll(item, '11-13')"
                      title="Tamamına Kopyala"
                    />
                  </div>
                </template>

                <template #item.range14_20="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-text-field
                      v-model.number="item.prices['14-20']"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @update:model-value="updatePricing(item, '14-20', $event)"
                    />
                    <v-btn
                      icon="mdi-content-copy"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="copyPriceToAll(item, '14-20')"
                      title="Tamamına Kopyala"
                    />
                  </div>
                </template>

                <template #item.range21_29="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-text-field
                      v-model.number="item.prices['21-29']"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @update:model-value="updatePricing(item, '21-29', $event)"
                    />
                    <v-btn
                      icon="mdi-content-copy"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="copyPriceToAll(item, '21-29')"
                      title="Tamamına Kopyala"
                    />
                  </div>
                </template>

                <template #item.range30_plus="{ item }">
                  <div class="d-flex align-center gap-1">
                    <v-text-field
                      v-model.number="item.prices['30++']"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px;"
                      @update:model-value="updatePricing(item, '30++', $event)"
                    />
                    <v-btn
                      icon="mdi-content-copy"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="copyPriceToAll(item, '30++')"
                      title="Tamamına Kopyala"
                    />
                  </div>
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
      <v-dialog v-model="showDeliveryPricingDialog" fullscreen scrollable>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-map-marker-multiple" size="24" />
              <span class="text-h6">
                {{ selectedLocationForDeliveryPricing ? `${getLocationName(selectedLocationForDeliveryPricing)} => Dönüş Bölgesi Ücretleri` : 'Dönüş Bölgesi Ücretleri' }}
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
                  :suffix="getCurrencySymbol(defaultCurrency?.code || '₺')"
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
      <v-dialog v-model="showLocationDialog" scrollable>
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
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="locationForm.name"
                    label="Lokasyon Adı"
                    prepend-inner-icon="mdi-map-marker"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="locationForm.metaTitle"
                    label="Meta Title"
                    prepend-inner-icon="mdi-tag"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="locationForm.parentId"
                    :items="availableParentLocations"
                    item-title="name"
                    item-value="id"
                    label="Üst Lokasyon"
                    prepend-inner-icon="mdi-folder"
                    clearable
                    :placeholder="'Üst lokasyon seçin (opsiyonel)'"
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
                    v-model.number="locationForm.sort"
                    label="Sıralama"
                    type="number"
                    prepend-inner-icon="mdi-sort-numeric"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="locationForm.deliveryFee"
                    label="Teslim Ücreti"
                    type="number"
                    :prepend-inner-icon="getCurrencyIcon(defaultCurrency?.code || 'TRY')"
                    :suffix="getCurrencySymbol(defaultCurrency?.code || 'TRY')"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="locationForm.dropFee"
                    label="Drop Ücreti"
                    type="number"
                    :prepend-inner-icon="getCurrencyIcon(defaultCurrency?.code || 'TRY')"
                    :suffix="getCurrencySymbol(defaultCurrency?.code || 'TRY')"
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

      <!-- Vehicle Images Dialog -->
      <v-dialog v-model="showImageDialog" max-width="800px" scrollable>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">Araç Resimleri - {{ selectedVehicleForImages?.name }}</span>
            <v-btn icon="mdi-close" variant="text" @click="closeImageDialog" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <div v-if="loadingImages" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <div v-else>
              <!-- Image Upload Section -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">Yeni Resim Ekle (Maksimum 8 resim)</v-card-title>
                <v-card-text>
                  <v-file-input
                    v-model="imageFile"
                    label="Resim Seç"
                    prepend-inner-icon="mdi-image"
                    variant="outlined"
                    accept="image/*"
                    :disabled="vehicleImages.length >= 8 || uploadingImage"
                    :rules="[
                      (v: any) => {
                        if (!v) return true;
                        if (vehicleImages.length >= 8) return 'Maksimum 8 resim eklenebilir';
                        if (v && typeof v === 'object' && 'size' in v) {
                          return v.size < 5000000 || 'Dosya boyutu 5MB\'dan küçük olmalıdır';
                        }
                        return true;
                      }
                    ]"
                    show-size
                    clearable
                  />
                  <v-btn
                    v-if="imageFile && !uploadingImage && vehicleImages.length < 8"
                    color="primary"
                    prepend-icon="mdi-upload"
                    @click="uploadVehicleImage"
                    :loading="uploadingImage"
                    class="mt-2"
                  >
                    Resim Yükle
                  </v-btn>
                  <v-alert
                    v-if="vehicleImages.length >= 8"
                    type="warning"
                    variant="tonal"
                    class="mt-2"
                  >
                    Maksimum 8 resim eklenebilir. Yeni resim eklemek için önce bir resim silin.
                  </v-alert>
                </v-card-text>
              </v-card>

              <!-- Images Grid -->
              <div v-if="vehicleImages.length > 0" class="mb-4">
                <h3 class="text-subtitle-1 mb-3">Yüklenen Resimler ({{ vehicleImages.length }}/8)</h3>
                <v-row>
                  <v-col
                    v-for="(image, index) in vehicleImages"
                    :key="image.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card variant="outlined">
                      <v-img
                        :src="getImageUrl(image.url)"
                        height="200"
                        cover
                        class="bg-grey-lighten-2"
                      >
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular color="grey-lighten-5" indeterminate />
                          </div>
                        </template>
                      </v-img>
                      <v-card-actions>
                        <v-chip
                          v-if="image.isPrimary"
                          color="primary"
                          size="small"
                          prepend-icon="mdi-star"
                        >
                          Ana Resim
                        </v-chip>
                        <v-spacer />
                        <v-btn
                          icon="mdi-star"
                          variant="text"
                          size="small"
                          :color="image.isPrimary ? 'primary' : 'grey'"
                          @click="setPrimaryImage(image.id)"
                          :disabled="image.isPrimary"
                        />
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          size="small"
                          color="error"
                          @click="deleteVehicleImage(image.id)"
                          :loading="deletingImageId === image.id"
                        />
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
              <v-alert v-else type="info" variant="tonal">
                Bu araç için henüz resim eklenmemiş.
              </v-alert>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeImageDialog">Kapat</v-btn>
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

interface VehicleImageDto {
  id: string;
  vehicleId: string;
  url: string;
  alt?: string;
  order: number;
  isPrimary: boolean;
  createdAt?: string;
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
  images?: VehicleImageDto[];
  createdAt?: string;
  lastReturnLocationId?: string | null;
  lastReturnLocation?: LocationDto | null;
}

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

const auth = useAuthStore();
const isRentacarTenant = computed(() => auth.tenant?.category === 'rentacar');

// Data
const vehicles = ref<VehicleDto[]>([]);
const vehicleCategories = ref<VehicleCategoryDto[]>([]);
const vehicleBrands = ref<VehicleBrandDto[]>([]);
const vehicleModels = ref<VehicleModelDto[]>([]);
const availableLanguages = ref<LanguageDto[]>([]);
const locations = ref<LocationDto[]>([]);
const vehicleReservations = ref<Array<{ vehicleId: string; plateId: string; startDate: string; endDate: string }>>([]);

// UI State
const mainTab = ref('vehicles');
const vehicleFilter = ref<'all' | 'reserved' | 'available'>('all');
const selectedBrandFilter = ref<string | null>(null);
const selectedBrandForModels = ref<string | null>(null);
const expandedVehicles = ref<Set<string>>(new Set());
const expandedLocations = ref<Set<string>>(new Set());
const showVehicleDialog = ref(false);
const showPlateDialog = ref(false);
const showLocationDialog = ref(false);
const showPricingDialog = ref(false);
const showDeliveryPricingDialog = ref(false);
const showCategoryDialog = ref(false);
const showBrandDialog = ref(false);
const showModelDialog = ref(false);
const showImageDialog = ref(false);
const loadingVehicles = ref(false);
const loadingLocations = ref(false);
const loadingCategories = ref(false);
const loadingBrands = ref(false);
const loadingModels = ref(false);
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
const deletingLocation = ref<string | null>(null);
const selectedVehicleForPlate = ref<VehicleDto | null>(null);
const selectedVehicleForImages = ref<VehicleDto | null>(null);
const editingPlate = ref<VehiclePlateDto | null>(null);
const vehicleImages = ref<VehicleImageDto[]>([]);
const imageFile = ref<File | null>(null);
const uploadingImage = ref(false);
const loadingImages = ref(false);
const deletingImageId = ref<string | null>(null);
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

// Editing state
const editingVehicle = ref<VehicleDto | null>(null);
const editingCategory = ref<VehicleCategoryDto | null>(null);
const editingBrand = ref<VehicleBrandDto | null>(null);
const editingModel = ref<VehicleModelDto | null>(null);

// Location Form
const locationForm = reactive({
  name: '',
  metaTitle: '',
  parentId: null as string | null,
  type: 'merkez' as 'merkez' | 'otel' | 'havalimani' | 'adres',
  sort: 0,
  deliveryFee: 0,
  dropFee: 0,
  minDayCount: undefined as number | undefined,
  isActive: true,
});

// Default currency for location fees
const defaultCurrency = ref<{ code: string; symbol?: string } | null>(null);

// Available parent locations (excluding current location if editing)
// Only show locations with type='merkez' as parent options
const availableParentLocations = computed(() => {
  if (!editingLocation.value) {
    return locations.value
      .filter(loc => loc.isActive && loc.type === 'merkez')
      .map(loc => ({
        id: loc.id,
        name: loc.name || 'Lokasyon',
      }));
  }
  // Exclude current location and its children from parent selection
  const excludeIds = new Set<string>([editingLocation.value.id]);
  const findChildren = (parentId: string) => {
    locations.value.forEach(loc => {
      if (loc.parentId === parentId) {
        excludeIds.add(loc.id);
        findChildren(loc.id);
      }
    });
  };
  findChildren(editingLocation.value.id);
  return locations.value
    .filter(loc => loc.isActive && loc.type === 'merkez' && !excludeIds.has(loc.id))
    .map(loc => ({
      id: loc.id,
      name: loc.name || 'Lokasyon',
    }));
});

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

// Currency helper functions
const getCurrencyIcon = (code: string): string => {
  const icons: Record<string, string> = {
    TRY: 'mdi-currency-try',
    USD: 'mdi-currency-usd',
    EUR: 'mdi-currency-eur',
    GBP: 'mdi-currency-gbp',
  };
  return icons[code] || 'mdi-currency-usd';
};

const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return symbols[code] || '$';
};

// Validation rules
const rules = {
  required: (v: any) => !!v || 'Bu alan zorunludur',
};

// Table headers
const tableHeaders = [
  { title: 'Plaka', key: 'plate', sortable: false, width: '100px' },
  { title: 'Araç Adı', key: 'name' },
  { title: 'Kategori', key: 'category' },
  { title: 'Marka', key: 'brand' },
  { title: 'Model', key: 'model' },
  { title: 'Yıl', key: 'year' },
  { title: 'Son Lokasyon', key: 'lastReturnLocation', sortable: false, width: '200px' },
  { title: 'Durum', key: 'status', sortable: false, width: '120px' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const categoryTableHeaders = [
  { title: 'Kategori Adı', key: 'name' },
  { title: 'Çeviriler', key: 'translations' },
  { title: 'Sıra', key: 'sortOrder' },
  { title: 'Durum', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const brandTableHeaders = [
  { title: 'Marka Adı', key: 'name' },
  { title: 'Modeller', key: 'models' },
  { title: 'Sıra', key: 'sortOrder' },
  { title: 'Durum', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const modelTableHeaders = [
  { title: 'Model Adı', key: 'name' },
  { title: 'Marka', key: 'brand' },
  { title: 'Sıra', key: 'sortOrder' },
  { title: 'Durum', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const locationTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Alış Lokasyon Adı', key: 'name', width: '200px' },
  { title: 'Üst Lokasyon', key: 'parent', width: '150px' },
  { title: 'Tipi', key: 'type', width: '100px' },
  { title: 'Durum', key: 'status', sortable: false, width: '100px' },
  { title: 'Fiyatlandır', key: 'pricing', sortable: false, width: '140px' },
  { title: 'Min. Kiralama Süresi', key: 'minDayCount', width: '150px' },
  { title: 'Sıra', key: 'sort', sortable: false, width: '100px' },
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
// Computed options for dropdowns
const categoryOptions = computed(() => {
  return vehicleCategories.value.map(cat => ({
    title: getCategoryName(cat),
    value: cat.id,
  }));
});

const brandOptions = computed(() => {
  return vehicleBrands.value.map(brand => ({
    title: brand.name,
    value: brand.id,
  }));
});

const modelOptions = computed(() => {
  return vehicleModels.value.map(model => ({
    title: model.name,
    value: model.id,
  }));
});

// Filtered models based on selected brand
const filteredModelOptions = computed(() => {
  if (!form.brandId) {
    return [];
  }
  return vehicleModels.value
    .filter(model => model.brandId === form.brandId)
    .map(model => ({
      title: model.name,
      value: model.id,
    }));
});

// Selected names for display
const selectedCategoryName = computed(() => {
  const category = vehicleCategories.value.find(c => c.id === form.categoryId);
  return category ? getCategoryName(category) : '';
});

const selectedBrandName = computed(() => {
  const brand = vehicleBrands.value.find(b => b.id === form.brandId);
  return brand?.name || '';
});

const selectedModelName = computed(() => {
  const model = vehicleModels.value.find(m => m.id === form.modelId);
  return model?.name || '';
});

const brandFilterOptions = computed(() => {
  const options: Array<{ label: string; value: string | null }> = [
    { label: 'Tüm Markalar', value: null },
  ];
  vehicleBrands.value.forEach(brand => {
    options.push({
      label: brand.name,
      value: brand.id,
    });
  });
  return options;
});

const filteredModelsForTable = computed(() => {
  if (!selectedBrandForModels.value) {
    return vehicleModels.value;
  }
  return vehicleModels.value.filter(model => model.brandId === selectedBrandForModels.value);
});

const getBrandName = (brandId?: string | null): string => {
  if (!brandId) return '-';
  const brand = vehicleBrands.value.find(b => b.id === brandId);
  return brand?.name || '-';
};

const handleModelBrandFilter = (brandId: string | null) => {
  selectedBrandForModels.value = brandId;
  if (brandId) {
    loadVehicleModels(brandId);
  } else {
    loadVehicleModels();
  }
};

const availableLocations = computed(() => {
  return locations.value.filter(loc => loc.isActive).map(loc => ({
    id: loc.id,
    name: getLocationName(loc),
  }));
});

// Her araç için tek satır, tüm plakaları içerir
interface VehiclePlateRow {
  vehicle: VehicleDto;
  plates: VehiclePlateDto[]; // Tüm plakalar
  id: string; // unique id for row (vehicleId)
}

const filteredVehicles = computed(() => {
  let filteredVehicleList: VehicleDto[] = [];
  
  // Önce marka filtresini uygula
  if (selectedBrandFilter.value) {
    filteredVehicleList = vehicles.value.filter(vehicle => 
      vehicle.brandId === selectedBrandFilter.value
    );
  } else {
    filteredVehicleList = vehicles.value;
  }
  
  // Sonra durum filtresini uygula
  if (vehicleFilter.value !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (vehicleFilter.value === 'reserved') {
      // Rezervasyondaki araçlar: En az bir plakası aktif rezervasyonda olan araçlar
      filteredVehicleList = filteredVehicleList.filter(vehicle => {
        if (!vehicle.plates || vehicle.plates.length === 0) return false;
        
        return vehicle.plates.some(plate => {
          const plateReservations = vehicleReservations.value.filter(
            r => r.plateId === plate.id
          );
          
          return plateReservations.some(reservation => {
            const startDate = new Date(reservation.startDate);
            const endDate = new Date(reservation.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            
            return today >= startDate && today <= endDate;
          });
        });
      });
    } else if (vehicleFilter.value === 'available') {
      // Boşta olan araçlar: Hiçbir plakası aktif rezervasyonda olmayan araçlar
      filteredVehicleList = filteredVehicleList.filter(vehicle => {
        if (!vehicle.plates || vehicle.plates.length === 0) return true;
        
        return !vehicle.plates.some(plate => {
          const plateReservations = vehicleReservations.value.filter(
            r => r.plateId === plate.id
          );
          
          return plateReservations.some(reservation => {
            const startDate = new Date(reservation.startDate);
            const endDate = new Date(reservation.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            
            return today >= startDate && today <= endDate;
          });
        });
      });
    }
  }
  
  // Her araç için tek satır oluştur, tüm plakaları göster
  const rows: VehiclePlateRow[] = filteredVehicleList.map(vehicle => ({
    vehicle,
    plates: vehicle.plates || [],
    id: vehicle.id,
  }));
  
  return rows;
});

// Methods
const getCategoryName = (category: VehicleCategoryDto): string => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang) return 'Kategori';
  const translation = category.translations.find(t => t.languageId === defaultLang.id);
  return translation?.name || 'Kategori';
};

const toggleVehicleDetails = (vehicleId: string) => {
  if (expandedVehicles.value.has(vehicleId)) {
    expandedVehicles.value.delete(vehicleId);
  } else {
    expandedVehicles.value.add(vehicleId);
  }
};

const getVehicleStatus = (row: VehiclePlateRow): { color: string; icon: string; variant: string; class?: string } => {
  // Eğer plaka yoksa, araç boşta sayılır
  if (!row.plates || row.plates.length === 0) {
    return {
      color: 'success',
      icon: 'mdi-check-circle',
      variant: 'flat',
      class: 'rounded-circle',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tüm plakaların rezervasyonlarını kontrol et
  // Eğer herhangi bir plakada aktif rezervasyon varsa, araç rezervasyonda sayılır
  const hasActiveReservation = row.plates.some(plate => {
    const plateReservations = vehicleReservations.value.filter(
      r => r.plateId === plate.id
    );

    return plateReservations.some(reservation => {
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return today >= startDate && today <= endDate;
    });
  });

  if (hasActiveReservation) {
    // Rezervasyondaki araçlar için kırmızı buton
    return {
      color: 'error',
      icon: 'mdi-alert-circle',
      variant: 'flat',
    };
  } else {
    // Boşta olan araçlar için yeşil yuvarlak buton
    return {
      color: 'success',
      icon: 'mdi-check-circle',
      variant: 'flat',
      class: 'rounded-circle',
    };
  }
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
  loadingCategories.value = true;
  try {
    const { data } = await http.get<VehicleCategoryDto[]>('/vehicle-categories');
    vehicleCategories.value = data;
    console.log('Loaded categories:', data.length);
  } catch (error) {
    console.error('Failed to load vehicle categories:', error);
  } finally {
    loadingCategories.value = false;
  }
};

const loadVehicleBrands = async () => {
  loadingBrands.value = true;
  try {
    const { data } = await http.get<VehicleBrandDto[]>('/vehicle-brands');
    vehicleBrands.value = data;
    console.log('Loaded brands:', data.length);
  } catch (error) {
    console.error('Failed to load vehicle brands:', error);
  } finally {
    loadingBrands.value = false;
  }
};

const loadVehicleModels = async (brandId?: string) => {
  loadingModels.value = true;
  try {
    const params = brandId ? { brandId } : {};
    const { data } = await http.get<VehicleModelDto[]>('/vehicle-models', { params });
    vehicleModels.value = data;
    console.log('Loaded models:', data.length, brandId ? `for brand ${brandId}` : '');
  } catch (error) {
    console.error('Failed to load vehicle models:', error);
  } finally {
    loadingModels.value = false;
  }
};

const loadVehicleReservations = async () => {
  if (!auth.tenant) return;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // Şimdilik boş array döndürüyoruz
    // const { data } = await http.get('/rentacar/vehicle-reservations', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // vehicleReservations.value = data.map((r: any) => ({
    //   vehicleId: r.plate.vehicleId,
    //   plateId: r.plateId,
    //   startDate: r.startDate,
    //   endDate: r.endDate,
    // }));
    vehicleReservations.value = [];
  } catch (error) {
    console.error('Failed to load vehicle reservations:', error);
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
    // Rezervasyon bilgilerini de yükle
    await loadVehicleReservations();
  } catch (error) {
    console.error('Failed to load vehicles:', error);
  } finally {
    loadingVehicles.value = false;
  }
};

const openCreateDialog = async () => {
  editingVehicle.value = null;
  resetForm();
  showVehicleDialog.value = true; // Dialog'u hemen aç ki kullanıcı alanları görebilsin
  // Load all data for dropdowns (asenkron yüklenecek)
  Promise.all([
    loadVehicleCategories(),
    loadVehicleBrands(),
    loadVehicleModels(),
  ]).catch(err => {
    console.error('Error loading dropdown data:', err);
  });
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
    
    if (editingCategory.value) {
      // Update existing category
      await http.put(`/vehicle-categories/${editingCategory.value.id}`, { translations });
    } else {
      // Create new category
      await http.post('/vehicle-categories', { translations });
    }
    
    await loadVehicleCategories();
    
    // Reset form
    availableLanguages.value.forEach(lang => {
      categoryForm.translations[lang.id] = '';
    });
    editingCategory.value = null;
  } catch (error: any) {
    alert(error.response?.data?.message || 'Kategori eklenirken bir hata oluştu');
  } finally {
    savingCategory.value = false;
  }
};

const saveCategoryAndClose = async () => {
  await saveCategory();
  if (!savingCategory.value) {
    showCategoryDialog.value = false;
    editingCategory.value = null;
    // Reset form
    availableLanguages.value.forEach(lang => {
      categoryForm.translations[lang.id] = '';
    });
  }
};

const closeCategoryDialog = () => {
  showCategoryDialog.value = false;
  editingCategory.value = null;
  // Reset form
  availableLanguages.value.forEach(lang => {
    categoryForm.translations[lang.id] = '';
  });
};

const editCategory = (category: VehicleCategoryDto) => {
  editingCategory.value = category;
  // Load translations
  availableLanguages.value.forEach(lang => {
    const translation = category.translations?.find(t => t.languageId === lang.id);
    categoryForm.translations[lang.id] = translation?.name || '';
  });
  showCategoryDialog.value = true;
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

// Brand change handler
const handleBrandChange = (brandId: string | null) => {
  form.brandId = brandId;
  form.modelId = null; // Reset model when brand changes
  if (brandId) {
    loadVehicleModels(brandId);
  } else {
    vehicleModels.value = [];
  }
};

// Legacy methods (kept for backward compatibility if needed)
// selectBrand and selectModel are defined below in their respective sections

const saveBrandAndClose = async () => {
  await saveBrand();
  if (!savingBrand.value) {
    showBrandDialog.value = false;
    editingBrand.value = null;
    brandForm.name = '';
  }
};

const closeBrandDialog = () => {
  showBrandDialog.value = false;
  editingBrand.value = null;
  brandForm.name = '';
};

const saveBrand = async () => {
  const validated = await brandFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingBrand.value = true;
  try {
    if (editingBrand.value) {
      // Update existing brand
      await http.put(`/vehicle-brands/${editingBrand.value.id}`, { name: brandForm.name });
    } else {
      // Create new brand
      await http.post('/vehicle-brands', { name: brandForm.name });
    }
    await loadVehicleBrands();
    brandForm.name = '';
    editingBrand.value = null;
  } catch (error: any) {
    alert(error.response?.data?.message || 'Marka kaydedilirken bir hata oluştu');
  } finally {
    savingBrand.value = false;
  }
};

const editBrand = (brand: VehicleBrandDto) => {
  editingBrand.value = brand;
  brandForm.name = brand.name;
  showBrandDialog.value = true;
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

const saveModelAndClose = async () => {
  await saveModel();
  if (!savingModel.value) {
    showModelDialog.value = false;
    editingModel.value = null;
    modelForm.name = '';
  }
};

const closeModelDialog = () => {
  showModelDialog.value = false;
  editingModel.value = null;
  modelForm.name = '';
};

const saveModel = async () => {
  if (!form.brandId && !editingModel.value) {
    alert('Önce bir marka seçmelisiniz');
    return;
  }
  
  const validated = await modelFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingModel.value = true;
  try {
    const brandId = editingModel.value?.brandId || form.brandId;
    if (!brandId) {
      alert('Marka bilgisi bulunamadı');
      return;
    }
    
    if (editingModel.value) {
      // Update existing model
      await http.put(`/vehicle-models/${editingModel.value.id}`, {
        brandId,
        name: modelForm.name,
      });
    } else {
      // Create new model
      await http.post('/vehicle-models', {
        brandId,
        name: modelForm.name,
      });
    }
    await loadVehicleModels(selectedBrandForModels.value || undefined);
    modelForm.name = '';
    editingModel.value = null;
  } catch (error: any) {
    alert(error.response?.data?.message || 'Model kaydedilirken bir hata oluştu');
  } finally {
    savingModel.value = false;
  }
};

const editModel = (model: VehicleModelDto) => {
  editingModel.value = model;
  modelForm.name = model.name;
  form.brandId = model.brandId || null;
  showModelDialog.value = true;
};

const deleteModel = async (id: string) => {
  if (!confirm('Bu modeli silmek istediğinizden emin misiniz?')) return;
  try {
    await http.delete(`/vehicle-models/${id}`);
    await loadVehicleModels(form.brandId || undefined);
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

const editVehicle = async (vehicle: VehicleDto) => {
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
  });
  
  showVehicleDialog.value = true; // Dialog'u hemen aç ki kullanıcı alanları görebilsin
  // Load all data for dropdowns (asenkron yüklenecek)
  Promise.all([
    loadVehicleCategories(),
    loadVehicleBrands(),
    vehicle.brandId ? loadVehicleModels(vehicle.brandId || undefined) : loadVehicleModels(),
  ]).catch(err => {
    console.error('Error loading dropdown data:', err);
  });
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
  if (plate) {
    editingPlate.value = plate;
    loadPlateData(plate);
  } else {
    editingPlate.value = null;
    resetPlateForm();
  }
  showPlateDialog.value = true;
};

const loadPlateData = (plate: VehiclePlateDto) => {
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
};

const addNewPlateAfter = (index: number) => {
  editingPlate.value = null;
  resetPlateForm();
  // Scroll to form
  setTimeout(() => {
    const formElement = document.querySelector('.v-card-text');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const editPlateInDialog = (plate: VehiclePlateDto) => {
  editingPlate.value = plate;
  loadPlateData(plate);
  // Scroll to form
  setTimeout(() => {
    const formElement = document.querySelector('.v-card-text');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const deletePlateInDialog = async (plateId: string) => {
  if (!selectedVehicleForPlate.value) return;
  
  if (!confirm('Bu plakayı silmek istediğinizden emin misiniz?')) return;
  
  deletingPlate.value = true;
  try {
    await http.delete(`/rentacar/vehicles/${selectedVehicleForPlate.value.id}/plates/${plateId}`);
    await loadVehicles();
    // Reload vehicle data to update plates list
    if (selectedVehicleForPlate.value) {
      const { data } = await http.get<VehicleDto>(`/rentacar/vehicles/${selectedVehicleForPlate.value.id}`);
      selectedVehicleForPlate.value = data;
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Plaka silinirken bir hata oluştu');
  } finally {
    deletingPlate.value = false;
  }
};

const cancelPlateEdit = () => {
  editingPlate.value = null;
  resetPlateForm();
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
    
    // Reload vehicles and update selected vehicle
    await loadVehicles();
    if (selectedVehicleForPlate.value) {
      const { data } = await http.get<VehicleDto>(`/rentacar/vehicles/${selectedVehicleForPlate.value.id}`);
      selectedVehicleForPlate.value = data;
    }
    
    // Reset form after save
    editingPlate.value = null;
    resetPlateForm();
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
    // Reload vehicle data to update plates list
    if (selectedVehicleForPlate.value) {
      const { data } = await http.get<VehicleDto>(`/rentacar/vehicles/${selectedVehicleForPlate.value.id}`);
      selectedVehicleForPlate.value = data;
    }
    // Reset form after delete
    editingPlate.value = null;
    resetPlateForm();
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

// Vehicle Image Functions
const openImageDialog = async (vehicle: VehicleDto) => {
  selectedVehicleForImages.value = vehicle;
  showImageDialog.value = true;
  await loadVehicleImages(vehicle.id);
};

const closeImageDialog = () => {
  showImageDialog.value = false;
  selectedVehicleForImages.value = null;
  vehicleImages.value = [];
  imageFile.value = null;
};

const loadVehicleImages = async (vehicleId: string) => {
  loadingImages.value = true;
  try {
    const { data } = await http.get<VehicleImageDto[]>(`/rentacar/vehicles/${vehicleId}/images`);
    vehicleImages.value = data.sort((a, b) => a.order - b.order);
  } catch (error: any) {
    console.error('Failed to load vehicle images:', error);
    alert(error.response?.data?.message || 'Resimler yüklenirken bir hata oluştu');
  } finally {
    loadingImages.value = false;
  }
};

const uploadVehicleImage = async () => {
  if (!selectedVehicleForImages.value || !imageFile.value) return;

  uploadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append('file', imageFile.value);

    await http.post(`/rentacar/vehicles/${selectedVehicleForImages.value.id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Reload images
    await loadVehicleImages(selectedVehicleForImages.value.id);
    imageFile.value = null;
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    alert(error.response?.data?.message || 'Resim yüklenirken bir hata oluştu');
  } finally {
    uploadingImage.value = false;
  }
};

const deleteVehicleImage = async (imageId: string) => {
  if (!selectedVehicleForImages.value) return;

  if (!confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
    return;
  }

  deletingImageId.value = imageId;
  try {
    await http.delete(`/rentacar/vehicles/${selectedVehicleForImages.value.id}/images/${imageId}`);
    await loadVehicleImages(selectedVehicleForImages.value.id);
    // Also reload vehicles list to update image count
    await loadVehicles();
  } catch (error: any) {
    console.error('Failed to delete image:', error);
    alert(error.response?.data?.message || 'Resim silinirken bir hata oluştu');
  } finally {
    deletingImageId.value = null;
  }
};

const setPrimaryImage = async (imageId: string) => {
  if (!selectedVehicleForImages.value) return;

  try {
    // Note: This endpoint might not exist, you may need to add it to the backend
    // For now, we'll just reload and show a message
    await http.put(`/rentacar/vehicles/${selectedVehicleForImages.value.id}/images/${imageId}`, {
      isPrimary: true,
    });
    await loadVehicleImages(selectedVehicleForImages.value.id);
  } catch (error: any) {
    console.error('Failed to set primary image:', error);
    alert(error.response?.data?.message || 'Ana resim ayarlanırken bir hata oluştu');
  }
};

const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const origin = window.location.origin;
  if (url.startsWith('/')) {
    return origin + url;
  }
  return origin + '/' + url;
};

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

const getLocationTypeLabel = (type?: string): string => {
  const option = locationTypeOptions.find(o => o.value === type);
  return option?.label || type || '-';
};

const getLocationName = (location: LocationDto): string => {
  const locationName = location.name || 'Lokasyon';
  const typeLabel = getLocationTypeLabel(location.type);
  return typeLabel ? `${locationName} - ${typeLabel}` : locationName;
};

// Filtrelenmiş ve genişletilmiş lokasyon listesi
const displayedLocations = computed(() => {
  const result: Array<LocationDto & { isChild?: boolean }> = [];
  
  // Sadece merkez tipindeki lokasyonları al ve sırala
  const merkezLocations = locations.value
    .filter(loc => loc.type === 'merkez')
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  
  merkezLocations.forEach(merkez => {
    // Merkezi ekle
    result.push(merkez);
    
    // Eğer merkez expand edilmişse, alt lokasyonlarını ekle
    if (expandedLocations.value.has(merkez.id)) {
      const childLocations = locations.value
        .filter(loc => loc.parentId === merkez.id)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
      
      childLocations.forEach(child => {
        result.push({ ...child, isChild: true });
      });
    }
  });
  
  return result;
});

const toggleLocationExpansion = (locationId: string) => {
  if (expandedLocations.value.has(locationId)) {
    expandedLocations.value.delete(locationId);
  } else {
    expandedLocations.value.add(locationId);
  }
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
};

const closeLocationDialog = () => {
  showLocationDialog.value = false;
  resetLocationForm();
};

const resetLocationForm = () => {
  locationForm.name = '';
  locationForm.metaTitle = '';
  locationForm.parentId = null;
  locationForm.type = 'merkez';
  locationForm.sort = 0;
  locationForm.deliveryFee = 0;
  locationForm.dropFee = 0;
  locationForm.minDayCount = undefined;
  locationForm.isActive = true;
};

const saveLocation = async () => {
  if (!auth.tenant) return;
  
  const validated = await locationFormRef.value?.validate();
  if (!validated?.valid) return;
  
  if (!locationForm.name) {
    alert('Lokasyon adı gerekli');
    return;
  }
  
  // Check if location with same name and type already exists (only for new locations)
  if (!editingLocation.value) {
    const existingLocation = locations.value.find(
      loc => loc.name.toLowerCase().trim() === locationForm.name.toLowerCase().trim() 
        && loc.type === locationForm.type
    );
    
    if (existingLocation) {
      alert(`Aynı isim (${locationForm.name}) ve tip (${getLocationTypeLabel(locationForm.type)}) ile bir lokasyon zaten mevcut.`);
      return;
    }
  }
  
  savingLocation.value = true;
  try {
    const locationData = {
      tenantId: auth.tenant.id,
      name: locationForm.name,
      metaTitle: locationForm.metaTitle || undefined,
      parentId: locationForm.parentId || null,
      type: locationForm.type,
      sort: locationForm.sort || 0,
      deliveryFee: locationForm.deliveryFee || 0,
      dropFee: locationForm.dropFee || 0,
      minDayCount: locationForm.minDayCount,
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
  
  locationForm.name = location.name || '';
  locationForm.metaTitle = location.metaTitle || '';
  locationForm.parentId = location.parentId || null;
  locationForm.type = location.type || 'merkez';
  locationForm.sort = location.sort || 0;
  locationForm.deliveryFee = location.deliveryFee || 0;
  locationForm.dropFee = location.dropFee || 0;
  locationForm.minDayCount = location.minDayCount;
  locationForm.isActive = location.isActive !== undefined ? location.isActive : true;
  
  showLocationDialog.value = true;
};

const deleteLocation = async (id: string) => {
  if (!confirm('Bu lokasyonu silmek istediğinizden emin misiniz? Bu işlem lokasyonu pasif hale getirecektir.')) return;
  
  deletingLocation.value = id;
  try {
    await http.delete(`/rentacar/locations/${id}`);
    await loadLocations();
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lokasyon silinirken bir hata oluştu';
    alert(errorMessage);
    console.error('Failed to delete location:', error);
  } finally {
    deletingLocation.value = null;
  }
};

const updateLocationStatus = async (location: LocationDto, isActive: boolean) => {
  if (!location.id) return;
  
  try {
    const updateData = {
      isActive,
    };
    await http.put(`/rentacar/locations/${location.id}`, updateData);
    
    // Update local state - displayedLocations is computed, so updating locations will auto-update it
    const index = locations.value.findIndex(loc => loc.id === location.id);
    if (index !== -1) {
      locations.value[index].isActive = isActive;
    }
  } catch (error: any) {
    console.error('Failed to update location status:', error);
    // Revert the change on error
    location.isActive = !isActive;
    alert(error.response?.data?.message || 'Lokasyon durumu güncellenirken bir hata oluştu');
  }
};

const updateLocationField = async (location: LocationDto, field: 'minDayCount' | 'sort', value: number | undefined) => {
  if (!location.id) return;
  
  updatingLocationField.value = true;
  try {
    const updateData: any = {};
    if (field === 'minDayCount') {
      updateData.minDayCount = value !== undefined && value !== null ? value : null;
    } else if (field === 'sort') {
      updateData.sort = value !== undefined && value !== null ? value : 0;
    }

    await http.put(`/rentacar/locations/${location.id}`, updateData);
    
    // Update local data
    const index = locations.value.findIndex(l => l.id === location.id);
    if (index !== -1) {
      if (field === 'minDayCount') {
        locations.value[index].minDayCount = updateData.minDayCount;
      } else if (field === 'sort') {
        locations.value[index].sort = updateData.sort;
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
    // Ensure brands and models are loaded
    if (vehicleBrands.value.length === 0) {
      await loadVehicleBrands();
    }
    // Load all models (without brandId filter) to ensure we have all models available
    if (vehicleModels.value.length === 0) {
      await loadVehicleModels();
    }

    // Load vehicles
    if (!auth.tenant) return;
    const { data: vehiclesData } = await http.get<VehicleDto[]>('/rentacar/vehicles', {
      params: { tenantId: auth.tenant.id },
    });

    // Debug: log vehicle data to understand structure
    console.log('Vehicles data:', vehiclesData);
    console.log('Vehicle brands:', vehicleBrands.value);
    console.log('Vehicle models:', vehicleModels.value);

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
      
      // Get brand name - try multiple sources in order of preference
      let brandName: string | null = null;
      // First try: nested brand object (from relations)
      if (vehicle.brand && typeof vehicle.brand === 'object' && 'name' in vehicle.brand) {
        brandName = (vehicle.brand as any).name;
      }
      // Second try: brandName field (legacy)
      if (!brandName && vehicle.brandName) {
        brandName = vehicle.brandName;
      }
      // Third try: lookup from brands list using brandId
      if (!brandName && vehicle.brandId && vehicleBrands.value.length > 0) {
        const brand = vehicleBrands.value.find(b => String(b.id) === String(vehicle.brandId));
        brandName = brand?.name || null;
      }
      
      // Get model name - try multiple sources in order of preference
      let modelName: string | null = null;
      // First try: nested model object (from relations)
      if (vehicle.model && typeof vehicle.model === 'object' && 'name' in vehicle.model) {
        modelName = (vehicle.model as any).name;
      }
      // Second try: modelName field (legacy)
      if (!modelName && vehicle.modelName) {
        modelName = vehicle.modelName;
      }
      // Third try: lookup from models list using modelId
      if (!modelName && vehicle.modelId && vehicleModels.value.length > 0) {
        const model = vehicleModels.value.find(m => String(m.id) === String(vehicle.modelId));
        modelName = model?.name || null;
      }
      
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        brandName: brandName || '-',
        modelName: modelName || '-',
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

const copyPriceToAll = async (item: PricingTableItem, dayRange: string) => {
  if (!selectedLocationForPricing.value) return;
  
  const price = item.prices[dayRange];
  
  if (!price || price <= 0) {
    alert('Lütfen önce bir fiyat giriniz.');
    return;
  }

  const confirmMessage = `Bu fiyatı (${price} TL) tüm araçlar ve tüm aylar için "${dayRange}" gün aralığına kopyalamak istediğinizden emin misiniz?`;
  
  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    savingPricing.value = true;
    
    await http.post('/rentacar/location-pricing/bulk-copy', {
      locationId: selectedLocationForPricing.value.id,
      sourceVehicleId: item.vehicleId,
      sourceMonth: selectedMonth.value,
      dayRange: dayRange,
      price: price,
    });

    // Tüm aylar için veriyi yeniden yükle
    await loadPricingData();
    
    alert(`Fiyat başarıyla tüm araçlar ve tüm aylar için kopyalandı!`);
  } catch (error: any) {
    alert(error.response?.data?.message || 'Fiyat kopyalanırken bir hata oluştu');
  } finally {
    savingPricing.value = false;
  }
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
    // Load all locations for the tenant - filter only 'merkez' type
    const { data: allLocations } = await http.get<LocationDto[]>('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });
    
    // Filter only 'merkez' type locations
    const merkezLocations = allLocations.filter(loc => loc.type === 'merkez');

    // Load existing delivery pricing
    const { data: existingPricing } = await http.get('/rentacar/location-delivery-pricing', {
      params: {
        locationId: selectedLocationForDeliveryPricing.value.id,
      },
    });

    // Create table data from merkez locations only
    const tableData: DeliveryPricingTableItem[] = merkezLocations
      .filter(loc => loc.id !== selectedLocationForDeliveryPricing.value?.id) // Exclude current location
      .map(location => {
        const existing = existingPricing.find((p: any) => p.deliveryLocationId === location.id);
        
        const cityName = getLocationName(location);

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

const updateVehicleLastLocation = async (vehicleId: string, locationId: string | null) => {
  try {
    await http.put(`/rentacar/vehicles/${vehicleId}/last-return-location`, {
      locationId: locationId || null,
    });
    // Reload vehicles to get updated data
    await loadVehicles();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Son lokasyon güncellenirken bir hata oluştu');
  }
};


onMounted(async () => {
  if (isRentacarTenant.value) {
    await Promise.all([
      loadLanguages(),
      loadVehicleCategories(),
      loadVehicleBrands(),
      loadVehicleModels(), // Tüm modelleri yükle (marka filtresi olmadan)
      loadVehicles(),
      loadLocations(),
      loadDefaultCurrency(), // Load default currency for location fee icons
    ]);
    console.log('Initial data loaded:', {
      categories: vehicleCategories.value.length,
      brands: vehicleBrands.value.length,
      models: vehicleModels.value.length,
    });
  }
  
  // Watch for tab changes to load data when switching tabs
  watch(mainTab, (newTab) => {
    if (newTab === 'categories') {
      loadVehicleCategories();
    } else if (newTab === 'brands') {
      loadVehicleBrands();
    } else if (newTab === 'models') {
      loadVehicleModels(selectedBrandForModels.value || undefined);
    }
  });
});

// Load default currency from tenant
const loadDefaultCurrency = async () => {
  if (!auth.tenant) return;
  try {
    const { data } = await http.get<{ 
      defaultCurrency?: { 
        id?: string;
        code: string; 
        symbol?: string;
      } | null;
    }>(`/tenants/${auth.tenant.id}`);
    
    if (data?.defaultCurrency) {
      defaultCurrency.value = {
        code: data.defaultCurrency.code,
        symbol: data.defaultCurrency.symbol,
      };
    } else {
      // Fallback to TRY if no default currency is set
      defaultCurrency.value = { code: 'TRY', symbol: '₺' };
    }
  } catch (error) {
    console.error('Failed to load default currency:', error);
    // Fallback to TRY if API fails
    defaultCurrency.value = { code: 'TRY', symbol: '₺' };
  }
};

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
