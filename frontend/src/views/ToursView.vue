<template>
  <div>
    <v-alert type="warning" variant="tonal" class="mb-4" v-if="!isTourTenant">
      Bu modül yalnızca tur operatörü tenantlar için aktiftir.
    </v-alert>

    <!-- Tur Özellikleri Modülü -->
    <v-row v-if="isTourTenant" class="mb-4">
      <v-col cols="12">
        <v-card elevation="2" class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">Tur Özellikleri</h2>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showFeatureDialog = true">
              Yeni Özellik Ekle
            </v-btn>
          </div>

          <v-row v-if="tourFeatures.length > 0">
            <v-col cols="12" sm="6" md="4" lg="3" v-for="feature in tourFeatures" :key="feature.id">
              <v-card variant="outlined" class="pa-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center gap-2">
                    <v-icon :icon="feature.icon" size="24" />
                    <span class="font-weight-medium">{{ getFeatureName(feature) }}</span>
                  </div>
                  <v-menu>
                    <template #activator="{ props }">
                      <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                    </template>
                    <v-list>
                      <v-list-item @click="editFeature(feature)">
                        <template #prepend>
                          <v-icon icon="mdi-pencil" />
                        </template>
                        <v-list-item-title>Düzenle</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="deleteFeature(feature.id)">
                        <template #prepend>
                          <v-icon icon="mdi-delete" color="error" />
                        </template>
                        <v-list-item-title>Sil</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
                <v-chip size="x-small" :color="feature.isActive ? 'success' : 'warning'" variant="tonal">
                  {{ feature.isActive ? 'Aktif' : 'Pasif' }}
                </v-chip>
              </v-card>
            </v-col>
          </v-row>
          <v-alert v-else type="info" variant="tonal">
            Henüz özellik eklenmemiş. Yeni özellik eklemek için yukarıdaki butona tıklayın.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>

    <!-- Özellik Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showFeatureDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingFeature ? 'Özellik Düzenle' : 'Yeni Özellik Ekle' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="featureFormRef" v-model="featureFormValid">
            <div class="mb-4">
              <label class="text-body-2 font-weight-medium mb-2 d-block">İkon Seçimi *</label>
              <v-card variant="outlined" class="pa-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center gap-2">
                    <v-icon :icon="featureForm.icon || 'mdi-help-circle'" size="32" color="primary" />
                    <div>
                      <div class="font-weight-medium">{{ featureForm.icon || 'İkon seçin' }}</div>
                      <div class="text-caption text-grey">{{ featureForm.icon ? 'Seçili ikon' : 'Henüz ikon seçilmedi' }}</div>
                    </div>
                  </div>
                  <v-btn color="primary" prepend-icon="mdi-palette" @click="showIconPicker = true">
                    İkon Seç
            </v-btn>
                </div>
              </v-card>
            </div>

            <v-divider class="my-4" />

            <h3 class="text-subtitle-1 font-weight-medium mb-3">Çoklu Dil Desteği</h3>
            <div v-for="lang in availableLanguages" :key="lang.id" class="mb-3">
              <v-text-field
                v-model="featureForm.translations[lang.id]"
                :label="`${lang.name} (${lang.code})`"
                :placeholder="`${lang.name} için özellik adı`"
                density="compact"
                required
                :hint="lang.id === featureDefaultLanguageId ? 'Varsayılan dil - diğer diller otomatik çevrilecek' : 'Bu dil için özellik adı'"
                persistent-hint
              />
            </div>

            <v-switch
              v-model="featureForm.isActive"
              label="Aktif"
              color="primary"
              inset
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFeatureDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveFeature" :loading="savingFeature" :disabled="!featureFormValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- İkon Seçici Dialog -->
    <v-dialog v-model="showIconPicker" max-width="800" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>İkon Seç</span>
          <v-btn icon="mdi-close" variant="text" @click="showIconPicker = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="iconSearchQuery"
            label="İkon Ara"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
          />
          <v-tabs v-model="iconCategory" density="compact" class="mb-4">
            <v-tab value="all">Tümü</v-tab>
            <v-tab value="wifi">WiFi & İnternet</v-tab>
            <v-tab value="food">Yemek & İçecek</v-tab>
            <v-tab value="pool">Havuz & Spor</v-tab>
            <v-tab value="transport">Ulaşım</v-tab>
            <v-tab value="entertainment">Eğlence</v-tab>
            <v-tab value="other">Diğer</v-tab>
          </v-tabs>
          <div class="icon-grid" style="max-height: 400px; overflow-y: auto;">
            <div
              v-for="icon in filteredIcons"
              :key="icon"
              class="icon-item"
              :class="{ 'icon-selected': featureForm.icon === icon }"
              @click="selectIcon(icon)"
            >
              <v-icon :icon="icon" size="32" />
              <div class="text-caption mt-1">{{ icon }}</div>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showIconPicker = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tur Listesi -->
    <v-row v-if="isTourTenant">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6 font-weight-bold">Turlar</span>
            <div class="d-flex align-center gap-2">
              <v-btn icon="mdi-refresh" variant="text" @click="loadTours" :loading="loadingTours" />
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
                Yeni Tur Ekle
              </v-btn>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <v-data-table
              :headers="tableHeaders"
              :items="tours"
              :loading="loadingTours"
              item-value="id"
              class="elevation-0"
            >
              <template #item.title="{ item }">
                <div
                  class="d-flex align-center gap-2 cursor-pointer"
                  @click="$router.push(`/app/tours/${item.id}`)"
                  style="cursor: pointer;"
                >
                  <v-icon icon="mdi-compass" size="20" color="primary" />
                  <span class="font-weight-medium text-primary">{{ item.title }}</span>
                </div>
              </template>

              <template #item.slug="{ item }">
                <code class="text-caption">{{ item.slug }}</code>
              </template>

              <template #item.basePrice="{ item }">
                <span class="font-weight-medium">
                  {{ getTourPrice(item) }}
                </span>
              </template>

              <template #item.languages="{ item }">
                <div v-if="item.languages?.length" class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="lang in item.languages"
                    :key="lang.id"
                    size="x-small"
                    variant="tonal"
                    color="primary"
                  >
                    {{ lang.name }}
                  </v-chip>
                  <v-chip
                    v-if="item.defaultLanguage"
                    size="x-small"
                    color="primary"
                    variant="flat"
                  >
                    ⭐ {{ item.defaultLanguage.name }}
                  </v-chip>
                </div>
                <span v-else class="text-grey text-caption">-</span>
              </template>

              <template #item.features="{ item }">
                <div v-if="item.features?.length" class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="feature in item.features"
                    :key="feature.id"
                    size="x-small"
                    variant="outlined"
                  >
                    <v-icon :icon="feature.icon" size="14" class="mr-1" />
                    {{ getFeatureName(feature) }}
                  </v-chip>
                </div>
                <span v-else class="text-grey text-caption">-</span>
              </template>

              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="editTour(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteTour(item.id)"
                />
              </template>

              <template #no-data>
                <div class="text-center py-8">
                  <v-icon icon="mdi-compass-off" size="48" color="grey-lighten-1" class="mb-2" />
                  <p class="text-grey">Henüz tur kaydı bulunmuyor.</p>
                  <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="mt-2">
                    İlk Turu Oluştur
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tur Ekleme/Düzenleme Modal -->
    <v-dialog v-model="showTourDialog" max-width="1400" fullscreen scrollable persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between bg-primary text-white">
          <div class="d-flex align-center gap-2">
            <span class="text-h6 font-weight-bold">
              {{ editingTour ? 'Tur Düzenle' : 'Yeni Tur Ekle' }}
            </span>
            <v-divider vertical class="mx-2" style="height: 24px;" />
            <span class="text-body-1 font-weight-medium">
              {{ currentTabName }}
            </span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeTourDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-form ref="formRef" v-model="isValid" @submit.prevent="handleCreate">
            <v-tabs v-model="formTab" bg-color="primary" slider-color="white" show-arrows>
              <v-tab value="basic">
                <v-icon icon="mdi-information" class="mr-2" />
                Temel Bilgiler
              </v-tab>
              <v-tab value="services">Hizmetler ve Özellikler</v-tab>
              <v-tab value="schedule">Program & Süre</v-tab>
              <v-tab value="media">Medya</v-tab>
              <v-tab value="pricing">Fiyatlandırma</v-tab>
              <v-tab value="other">Diğer</v-tab>
            </v-tabs>

            <v-window v-model="formTab" class="pa-6">
              <!-- Temel Bilgiler Tab -->
              <v-window-item value="basic">
                <v-row>
                  <!-- 1. Destinasyon Seçimi -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-map-marker" class="mr-2" color="primary" />
                      Destinasyon Seçimi
                    </h3>
                    <v-alert v-if="destinations.length === 0 && !loadingDestinations" type="warning" variant="tonal" class="mb-4">
                      Henüz destinasyon eklenmemiş. Önce <router-link to="/app/destinations">Destinasyonlar</router-link> sayfasından destinasyon ekleyin.
                    </v-alert>
                    <v-select
                      v-model="form.destinationId"
                      :items="destinations"
                      :item-title="item => `${item.name} - ${item.city}, ${item.country}`"
                      item-value="id"
                      label="Destinasyon *"
                      prepend-inner-icon="mdi-map-marker"
                      required
                      variant="outlined"
                      density="comfortable"
                      :loading="loadingDestinations"
                      :disabled="destinations.length === 0"
                      hint="Turun yapılacağı destinasyonu seçin"
                      persistent-hint
                      clearable
                    />
                  </v-col>

                  <!-- 2. Dil Tabs ile İçerikler -->
                  <v-col cols="12" v-if="availableLanguages.length > 0">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-translate" class="mr-2" color="primary" />
                      Tur İçerikleri (Dillere Göre)
                    </h3>
                    <v-tabs v-model="contentLanguageTab" density="comfortable" class="mb-4">
                      <v-tab
                        v-for="lang in availableLanguages"
                        :key="lang.id"
                        :value="lang.id"
                        :prepend-icon="lang.id === form.defaultLanguageId ? 'mdi-star' : undefined"
                      >
                        {{ getLanguageName(lang.id) }}
                        <v-chip v-if="lang.id === form.defaultLanguageId" size="x-small" color="primary" class="ml-2">Varsayılan</v-chip>
                      </v-tab>
                    </v-tabs>
                    <v-window v-model="contentLanguageTab">
                      <v-window-item
                        v-for="lang in availableLanguages"
                        :key="lang.id"
                        :value="lang.id"
                      >
                        <v-row>
                          <!-- Tur Adı -->
                          <v-col cols="12">
                            <v-text-field
                              :model-value="form.translations[lang.id]?.title || ''"
                              @update:model-value="(val) => updateTranslationField(lang.id, 'title', val)"
                              label="Tur Adı *"
                              prepend-inner-icon="mdi-format-title"
                              required
                              variant="outlined"
                              density="comfortable"
                              :hint="lang.id === form.defaultLanguageId ? 'Varsayılan dil - diğer diller otomatik çevrilecek' : 'Bu dil için tur adı'"
                              persistent-hint
                            />
                          </v-col>

                          <!-- Slug (Otomatik) -->
                          <v-col cols="12">
                            <v-text-field
                              :model-value="form.translations[lang.id]?.slug || slugify(form.translations[lang.id]?.title || '')"
                              @update:model-value="(val) => updateTranslationField(lang.id, 'slug', val)"
                              label="Slug"
                              prepend-inner-icon="mdi-link-variant"
                              variant="outlined"
                              density="comfortable"
                              hint="Tur adından otomatik oluşturulur (değiştirilebilir)"
                              persistent-hint
                            />
                          </v-col>

                          <!-- Tur Açıklaması -->
                          <v-col cols="12">
                            <v-textarea
                              :model-value="form.translations[lang.id]?.description || ''"
                              @update:model-value="(val) => updateTranslationField(lang.id, 'description', val)"
                              label="Tur Açıklaması"
                              prepend-inner-icon="mdi-text"
                              rows="6"
                              variant="outlined"
                              density="comfortable"
                              :hint="lang.id === form.defaultLanguageId ? 'Varsayılan dil - diğer diller otomatik çevrilecek' : 'Bu dil için tur açıklaması'"
                              persistent-hint
                            />
                          </v-col>
                        </v-row>
                      </v-window-item>
                    </v-window>
                  </v-col>
                  <v-col cols="12" v-else>
                    <v-alert type="info" variant="tonal">
                      Henüz dil eklenmemiş. Önce <router-link to="/app/languages">Diller</router-link> sayfasından dil ekleyin.
                    </v-alert>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Hizmetler ve Özellikler Tab -->
              <v-window-item value="services">
                <v-row>
                  <!-- 1. Tur Özellikleri -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-star" class="mr-2" color="primary" />
                      Tur Özellikleri
                    </h3>
                    <v-select
                      v-model="form.featureIds"
                      :items="tourFeatures.filter(f => f.isActive).map(f => ({
                        value: f.id,
                        title: getFeatureName(f),
                        icon: f.icon
                      }))"
                      item-title="title"
                      item-value="value"
                      label="Tur Özellikleri"
                      multiple
                      chips
                      prepend-inner-icon="mdi-star"
                      variant="outlined"
                      density="comfortable"
                    >
                      <template #item="{ item, props }">
                        <v-list-item v-bind="props" :prepend-icon="item.raw.icon">
                          <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                        </v-list-item>
                      </template>
                      <template #selection="{ item, index }">
                        <v-chip
                          v-if="index < 2"
                          :prepend-icon="item.raw.icon"
                          size="small"
                          class="me-2"
                        >
                          {{ item.raw.title }}
                        </v-chip>
                        <span
                          v-else-if="index === 2"
                          class="text-grey text-caption align-self-center"
                        >
                          (+{{ form.featureIds.length - 2 }} diğer)
                        </span>
                      </template>
                    </v-select>
                  </v-col>

                  <!-- 2. Tura Dahil Hizmetler (Çoklu Dil) -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-check-circle" class="mr-2" color="primary" />
                      Tura Dahil Hizmetler
                    </h3>
                    <div v-if="availableLanguages.length > 0">
                      <v-tabs v-model="servicesTab" density="compact" class="mb-4">
                        <v-tab v-for="lang in availableLanguages" :key="lang.id" :value="lang.id">
                          {{ getLanguageName(lang.id) }}
                        </v-tab>
                      </v-tabs>
                      <v-window v-model="servicesTab">
                        <v-window-item
                          v-for="lang in availableLanguages"
                          :key="lang.id"
                          :value="lang.id"
                        >
                          <div v-for="(service, index) in form.translations[lang.id]?.includedServices || []" :key="index" class="d-flex align-center gap-2 mb-2">
                            <v-text-field
                              v-model="form.translations[lang.id].includedServices[index]"
                              density="compact"
                              variant="outlined"
                              hide-details
                              class="flex-grow-1"
                            />
                            <v-btn
                              v-if="form.defaultLanguageId && lang.id !== form.defaultLanguageId && form.translations[form.defaultLanguageId]?.includedServices?.[index]"
                              icon="mdi-auto-fix"
                              variant="text"
                              size="small"
                              @click="translateService('included', index, lang.id)"
                              :loading="translatingFields[lang.id]?.[`included_${index}`]"
                            />
                            <v-btn icon="mdi-delete" variant="text" size="small" @click="form.translations[lang.id].includedServices.splice(index, 1)" />
                          </div>
                          <v-btn prepend-icon="mdi-plus" variant="outlined" size="small" @click="addIncludedService(lang.id)">
                            Hizmet Ekle
                          </v-btn>
                        </v-window-item>
                      </v-window>
                    </div>
                    <v-alert v-else type="info" variant="tonal">
                      Henüz dil eklenmemiş. Önce <router-link to="/app/languages">Diller</router-link> sayfasından dil ekleyin.
                    </v-alert>
                  </v-col>

                  <!-- 3. Hariç Hizmetler (Çoklu Dil) -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-close-circle" class="mr-2" color="primary" />
                      Hariç Hizmetler
                    </h3>
                    <div v-if="availableLanguages.length > 0">
                      <v-tabs v-model="excludedServicesTab" density="compact" class="mb-4">
                        <v-tab v-for="lang in availableLanguages" :key="lang.id" :value="lang.id">
                          {{ getLanguageName(lang.id) }}
                        </v-tab>
                      </v-tabs>
                      <v-window v-model="excludedServicesTab">
                        <v-window-item
                          v-for="lang in availableLanguages"
                          :key="lang.id"
                          :value="lang.id"
                        >
                          <div v-for="(service, index) in form.translations[lang.id]?.excludedServices || []" :key="index" class="d-flex align-center gap-2 mb-2">
                            <v-text-field
                              v-model="form.translations[lang.id].excludedServices[index]"
                              density="compact"
                              variant="outlined"
                              hide-details
                              class="flex-grow-1"
                            />
                            <v-btn
                              v-if="form.defaultLanguageId && lang.id !== form.defaultLanguageId && form.translations[form.defaultLanguageId]?.excludedServices?.[index]"
                              icon="mdi-auto-fix"
                              variant="text"
                              size="small"
                              @click="translateService('excluded', index, lang.id)"
                              :loading="translatingFields[lang.id]?.[`excluded_${index}`]"
                            />
                            <v-btn icon="mdi-delete" variant="text" size="small" @click="form.translations[lang.id].excludedServices.splice(index, 1)" />
                          </div>
                          <v-btn prepend-icon="mdi-plus" variant="outlined" size="small" @click="addExcludedService(lang.id)">
                            Hizmet Ekle
                          </v-btn>
                        </v-window-item>
                      </v-window>
                    </div>
                    <v-alert v-else type="info" variant="tonal">
                      Henüz dil eklenmemiş. Önce <router-link to="/app/languages">Diller</router-link> sayfasından dil ekleyin.
                    </v-alert>
                  </v-col>

                  <!-- 4. Tur Hakkında Bilgiler (Maddeler) (Çoklu Dil) -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-information" class="mr-2" color="primary" />
                      Tur Hakkında Bilgiler (Maddeler)
                    </h3>
                    <div v-if="availableLanguages.length > 0">
                      <v-tabs v-model="infoItemsTab" density="compact" class="mb-4">
                        <v-tab v-for="lang in availableLanguages" :key="lang.id" :value="lang.id">
                          {{ getLanguageName(lang.id) }}
                        </v-tab>
                      </v-tabs>
                      <v-window v-model="infoItemsTab">
                        <v-window-item
                          v-for="lang in availableLanguages"
                          :key="lang.id"
                          :value="lang.id"
                        >
                          <div v-for="(item, index) in form.translations[lang.id]?.infoItems || []" :key="index" class="d-flex align-center gap-2 mb-2">
                            <v-text-field
                              v-model="form.translations[lang.id].infoItems[index]"
                              density="compact"
                              variant="outlined"
                              hide-details
                              class="flex-grow-1"
                            />
                            <v-btn
                              v-if="form.defaultLanguageId && lang.id !== form.defaultLanguageId && form.translations[form.defaultLanguageId]?.infoItems?.[index]"
                              icon="mdi-auto-fix"
                              variant="text"
                              size="small"
                              @click="translateInfoItem(index, lang.id)"
                              :loading="translatingFields[lang.id]?.[`info_${index}`]"
                            />
                            <v-btn icon="mdi-delete" variant="text" size="small" @click="form.translations[lang.id].infoItems.splice(index, 1)" />
                          </div>
                          <v-btn prepend-icon="mdi-plus" variant="outlined" size="small" @click="addInfoItem(lang.id)">
                            Madde Ekle
                          </v-btn>
                        </v-window-item>
                      </v-window>
                    </div>
                    <v-alert v-else type="info" variant="tonal">
                      Henüz dil eklenmemiş. Önce <router-link to="/app/languages">Diller</router-link> sayfasından dil ekleyin.
                    </v-alert>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Medya Tab -->
              <v-window-item value="media">
                <v-row>
                  <!-- Resim Ekleme -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-image" class="mr-2" color="primary" />
                      Resim Ekle
                    </h3>
                    <div v-for="(image, index) in form.images" :key="index" class="mb-4 pa-4 border rounded">
                      <div class="d-flex align-center gap-2 mb-2">
                        <v-tabs v-model="imageUploadType[index]" density="compact" class="flex-grow-1">
                          <v-tab value="url">URL</v-tab>
                          <v-tab value="upload">Yükle</v-tab>
                        </v-tabs>
                        <v-btn icon="mdi-delete" variant="text" size="small" @click="form.images.splice(index, 1)" />
                      </div>
                      <v-window v-model="imageUploadType[index]">
                        <v-window-item value="url">
                          <v-text-field
                            v-model="form.images[index].url"
                            label="Resim URL"
                            prepend-inner-icon="mdi-link"
                            variant="outlined"
                            density="comfortable"
                            class="mb-2"
                          />
                        </v-window-item>
                        <v-window-item value="upload">
                          <v-file-input
                            v-model="form.images[index].file"
                            label="Resim Dosyası"
                            prepend-inner-icon="mdi-upload"
                            variant="outlined"
                            density="comfortable"
                            accept="image/*"
                            @change="handleImageUpload(index, $event)"
                            class="mb-2"
                          />
                          <v-progress-linear
                            v-if="uploadingImages[index]"
                            :model-value="imageUploadProgress[index]"
                            color="primary"
                            class="mb-2"
                          />
                        </v-window-item>
                      </v-window>
                      <v-text-field
                        v-model="form.images[index].alt"
                        label="Alt Text"
                        prepend-inner-icon="mdi-text"
                        variant="outlined"
                        density="comfortable"
                        class="mb-2"
                      />
                      <v-checkbox
                        v-model="form.images[index].isPrimary"
                        label="Ana Resim"
                        density="compact"
                      />
                    </div>
                    <v-btn prepend-icon="mdi-plus" variant="outlined" @click="addImageField">
                      Resim Ekle
                    </v-btn>
                  </v-col>

                  <!-- Video Ekleme -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-video" class="mr-2" color="primary" />
                      Video Ekle
                    </h3>
                    <v-tabs v-model="videoUploadType" density="compact" class="mb-4">
                      <v-tab value="url">URL</v-tab>
                      <v-tab value="upload">Yükle</v-tab>
                    </v-tabs>
                    <v-window v-model="videoUploadType">
                      <v-window-item value="url">
                        <v-text-field
                          v-model="form.video"
                          label="Video URL"
                          prepend-inner-icon="mdi-link"
                          variant="outlined"
                          density="comfortable"
                          hint="YouTube, Vimeo vb. video URL'i"
                          persistent-hint
                        />
                      </v-window-item>
                      <v-window-item value="upload">
                        <v-file-input
                          v-model="videoFile"
                          label="Video Dosyası"
                          prepend-inner-icon="mdi-upload"
                          variant="outlined"
                          density="comfortable"
                          accept="video/*"
                          @change="handleVideoUpload"
                        />
                        <v-progress-linear
                          v-if="uploadingVideo"
                          :model-value="videoUploadProgress"
                          color="primary"
                          class="mt-2"
                        />
                      </v-window-item>
                    </v-window>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Program & Süre Tab -->
              <v-window-item value="schedule">
                <v-row>
                  <!-- 1. Kişi Sayısı -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-account-group" class="mr-2" color="primary" />
                      Kişi Sayısı
                    </h3>
                    <v-text-field
                      v-model.number="form.maxCapacity"
                      label="Kişi Sayısı (0 = Sınırsız)"
                      type="number"
                      prepend-inner-icon="mdi-account-group"
                      variant="outlined"
                      density="comfortable"
                      hint="0 girilirse sınırsız olur. 0'dan farklı ise gelen rezervasyona göre gün/tarih baz alınarak tur satışa kapatılacak."
                      persistent-hint
                    />
                  </v-col>

                  <!-- 2. Tur Süresi ve Süre Birimi -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-clock-outline" class="mr-2" color="primary" />
                      Tur Süresi
                    </h3>
                    <v-row>
      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="form.duration"
                          label="Tur Süresi"
                          type="number"
                          prepend-inner-icon="mdi-clock-outline"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="form.durationUnit"
                          :items="[
                            { value: 'minute', title: 'Dakika' },
                            { value: 'hour', title: 'Saat' },
                            { value: 'day', title: 'Gün' }
                          ]"
                          label="Süre Birimi"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                    </v-row>
                  </v-col>

                  <!-- 3. Tur Günleri -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-calendar" class="mr-2" color="primary" />
                      Tur Günleri
                    </h3>
                    <v-select
                      v-model="form.days"
                      :items="[
                        { value: 'monday', title: 'Pazartesi' },
                        { value: 'tuesday', title: 'Salı' },
                        { value: 'wednesday', title: 'Çarşamba' },
                        { value: 'thursday', title: 'Perşembe' },
                        { value: 'friday', title: 'Cuma' },
                        { value: 'saturday', title: 'Cumartesi' },
                        { value: 'sunday', title: 'Pazar' }
                      ]"
                      label="Tur Günleri"
                      multiple
                      chips
                      prepend-inner-icon="mdi-calendar"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <!-- 4. Tur Başlangıç - Bitiş Saatleri -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-clock-time-four" class="mr-2" color="primary" />
                      Tur Başlangıç - Bitiş Saatleri (Opsiyonel)
                    </h3>
                    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                      Gün içerisinde birden fazla saat dilimi tanımlayabilirsiniz.
                    </v-alert>
                    <div v-for="(slot, index) in form.timeSlots" :key="index" class="d-flex align-center gap-2 mb-2">
                      <v-text-field
                        v-model="form.timeSlots[index].startTime"
                        label="Başlangıç"
                        type="time"
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                      <v-text-field
                        v-model="form.timeSlots[index].endTime"
                        label="Bitiş"
                        type="time"
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                      <v-btn icon="mdi-delete" variant="text" size="small" @click="form.timeSlots.splice(index, 1)" />
          </div>
                    <v-btn prepend-icon="mdi-plus" variant="outlined" @click="form.timeSlots.push({ startTime: '09:00', endTime: '17:00' })">
                      Saat Dilimi Ekle
                    </v-btn>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Fiyatlandırma Tab -->
              <v-window-item value="pricing">
                <v-row>
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-cash" class="mr-2" color="primary" />
                      Fiyatlandırma
                    </h3>
                    
                    <!-- Yetişkin Fiyatlandırması -->
                    <div class="mb-4">
                      <h4 class="text-subtitle-1 mb-3">Yetişkin Fiyatlandırması</h4>
                      <div v-for="(price, index) in adultPricing" :key="`adult-${index}`" class="mb-3 pa-3 border rounded">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <span class="font-weight-medium">Yetişkin Fiyatı</span>
                          <v-btn icon="mdi-delete" variant="text" size="small" @click="removeAdultPricing(index)" />
                        </div>
                        <v-row>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model.number="price.price"
                              label="Fiyat *"
                              type="number"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.currencyCode"
                              label="Para Birimi *"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.description"
                              label="Açıklama (Opsiyonel)"
                              variant="outlined"
                              density="comfortable"
                            />
      </v-col>
    </v-row>
                      </div>
                      <v-btn prepend-icon="mdi-plus" variant="outlined" size="small" @click="addAdultPricing">
                        Yetişkin Fiyatı Ekle
                      </v-btn>
                    </div>

                    <!-- Çocuk Fiyatlandırması -->
                    <div class="mb-4">
                      <h4 class="text-subtitle-1 mb-3">Çocuk Fiyatlandırması</h4>
                      <div v-for="(price, index) in childPricing" :key="`child-${index}`" class="mb-3 pa-3 border rounded">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <span class="font-weight-medium">Çocuk Fiyatı</span>
                          <v-btn icon="mdi-delete" variant="text" size="small" @click="removeChildPricing(index)" />
                        </div>
                        <v-row>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model.number="price.price"
                              label="Fiyat *"
                              type="number"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.currencyCode"
                              label="Para Birimi *"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.description"
                              label="Açıklama (Opsiyonel)"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                        </v-row>
                      </div>
                      <v-btn prepend-icon="mdi-plus" variant="outlined" size="small" @click="addChildPricing">
                        Çocuk Fiyatı Ekle
                      </v-btn>
                    </div>

                    <!-- Bebek Fiyatlandırması -->
                    <div class="mb-4">
                      <h4 class="text-subtitle-1 mb-3">Bebek Fiyatlandırması</h4>
                      <div v-for="(price, index) in infantPricing" :key="`infant-${index}`" class="mb-3 pa-3 border rounded">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <span class="font-weight-medium">Bebek Fiyatı</span>
                          <v-btn icon="mdi-delete" variant="text" size="small" @click="removeInfantPricing(index)" />
                        </div>
                        <v-row>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model.number="price.price"
                              label="Fiyat *"
                              type="number"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.currencyCode"
                              label="Para Birimi *"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.description"
                              label="Açıklama (Opsiyonel)"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                        </v-row>
                      </div>
                      <v-btn prepend-icon="mdi-plus" variant="outlined" size="small" @click="addInfantPricing">
                        Bebek Fiyatı Ekle
                      </v-btn>
                    </div>

                    <!-- Diğer Fiyatlandırmalar (Ekstra Motor, 1+1 Tur, vb.) -->
                    <div class="mb-4">
                      <h4 class="text-subtitle-1 mb-3">Diğer Fiyatlandırmalar</h4>
                      <div v-for="(price, index) in otherPricing" :key="`other-${index}`" class="mb-3 pa-3 border rounded">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <v-select
                            v-model="price.type"
                            :items="[
                              { value: 'extra_motor', title: 'Ekstra Motor' },
                              { value: 'one_plus_one', title: '1+1 Tur' }
                            ]"
                            label="Fiyat Tipi"
                            variant="outlined"
                            density="comfortable"
                            class="flex-grow-1 mr-2"
                          />
                          <v-btn icon="mdi-delete" variant="text" size="small" @click="removeOtherPricing(index)" />
                        </div>
                        <v-row>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model.number="price.price"
                              label="Fiyat *"
                              type="number"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.currencyCode"
                              label="Para Birimi *"
                              variant="outlined"
                              density="comfortable"
                              required
                            />
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field
                              v-model="price.description"
                              label="Açıklama (Opsiyonel)"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                        </v-row>
                      </div>
                      <v-btn prepend-icon="mdi-plus" variant="outlined" size="small" @click="addOtherPricing">
                        Fiyatlandırma Ekle
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Diğer Tab -->
              <v-window-item value="other">
                <v-row>
                  <!-- 1. Varsayılan Para Birimi -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-wallet" class="mr-2" color="primary" />
                      Varsayılan Para Birimi
                    </h3>
                    <v-select
                      v-model="form.currencyCode"
                      :items="currencyOptions"
                      item-title="title"
                      item-value="value"
                      label="Varsayılan Para Birimi"
                      prepend-inner-icon="mdi-wallet"
                      variant="outlined"
                      density="comfortable"
                      hint="Tur için varsayılan para birimini seçin"
                      persistent-hint
                    >
                      <template #item="{ item, props }">
                        <v-list-item v-bind="props">
                          <template #prepend>
                            <span class="text-h6 mr-3">{{ item.raw.symbol }}</span>
                          </template>
                          <v-list-item-subtitle>{{ item.raw.value }}</v-list-item-subtitle>
                        </v-list-item>
                      </template>
                      <template #selection="{ item }">
                        <div class="d-flex align-center">
                          <span class="text-h6 mr-2">{{ item.raw.symbol }}</span>
                          <span>{{ item.raw.title }}</span>
                        </div>
                      </template>
                    </v-select>
                  </v-col>

                  <!-- 2. Etiketler -->
                  <v-col cols="12">
                    <h3 class="text-h6 mb-4">
                      <v-icon icon="mdi-tag" class="mr-2" color="primary" />
                      Etiketler
                    </h3>
                    <v-textarea
                      v-model="form.tags"
                      label="Etiketler (virgülle ayırın)"
                      rows="3"
                      prepend-inner-icon="mdi-tag-multiple"
                      variant="outlined"
                      density="comfortable"
                      hint="Örn: kültür, tarih, doğa"
                      persistent-hint
                    />
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" @click="closeTourDialog">İptal</v-btn>
          <v-btn color="primary" @click="handleCreate" :loading="loading" :disabled="!isValid">
            {{ editingTour ? 'Güncelle' : 'Oluştur' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import { translateText, translateMultiple } from '../services/deepl';

interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface DestinationDto {
  id: string;
  name: string;
  country: string;
  city: string;
}

interface TourFeatureTranslationDto {
  id: string;
  languageId: string;
  languageCode: string;
  name: string;
}

interface TourFeatureDto {
  id: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  translations: TourFeatureTranslationDto[];
}

interface TourTranslationDto {
  id: string;
  languageId: string;
  title: string;
  slug?: string;
  description?: string;
  includedServices?: string;
  excludedServices?: string;
}

interface TourInfoItemDto {
  id: string;
  languageId: string;
  text: string;
  order: number;
}

interface TourImageDto {
  id: string;
  url: string;
  alt?: string;
  order: number;
  isPrimary: boolean;
}

interface TourTimeSlotDto {
  id: string;
  startTime: string;
  endTime: string;
  order: number;
}

interface TourPricingDto {
  id: string;
  type: string;
  price: number;
  currencyCode: string;
  description?: string;
}

interface TourDto {
  id: string;
  title: string;
  slug: string;
  destinationId: string;
  duration?: number;
  durationUnit?: 'minute' | 'hour' | 'day';
  maxCapacity?: number;
  days?: string[];
  video?: string;
  currencyCode: string;
  tags?: string[];
  languages?: LanguageDto[];
  defaultLanguage?: LanguageDto | null;
  features?: TourFeatureDto[];
  translations?: TourTranslationDto[];
  infoItems?: TourInfoItemDto[];
  images?: TourImageDto[];
  timeSlots?: TourTimeSlotDto[];
  pricing?: TourPricingDto[];
}

const auth = useAuthStore();
const isTourTenant = computed(() => auth.tenant?.category === 'tour');

const form = reactive({
  destinationId: '',
  slug: '',
  languageIds: [] as string[],
  defaultLanguageId: undefined as string | undefined,
  translations: {} as Record<string, {
    title: string;
    slug?: string;
    description: string;
    includedServices: string[];
    excludedServices: string[];
    infoItems: string[];
  }>,
  duration: undefined as number | undefined,
  durationUnit: 'hour' as 'minute' | 'hour' | 'day',
  maxCapacity: 0,
  days: [] as string[],
  video: '',
  featureIds: [] as string[],
  images: [] as Array<{ url: string; alt: string; isPrimary: boolean; file?: File | null }>,
  timeSlots: [] as Array<{ startTime: string; endTime: string }>,
  pricing: [] as Array<{ type: string; price: number; currencyCode: string; description?: string }>,
  currencyCode: 'EUR',
  tags: '',
});

const formTab = ref('basic');
const contentLanguageTab = ref<string>('');
const translationTab = ref<string>('');
const servicesTab = ref<string>('');
const excludedServicesTab = ref<string>('');
const infoItemsTab = ref<string>('');
const imageUploadType = ref<Record<number, string>>({});
const videoUploadType = ref('url');
const videoFile = ref<File[] | null>(null);
const uploadingImages = ref<Record<number, boolean>>({});
const imageUploadProgress = ref<Record<number, number>>({});
const uploadingVideo = ref(false);
const videoUploadProgress = ref(0);
const translating = ref(false);
const translatingFields = ref<Record<string, Record<string, boolean>>>({});
let translationTimeout: ReturnType<typeof setTimeout> | null = null;
let featureTranslationTimeout: ReturnType<typeof setTimeout> | null = null;

const tours = ref<TourDto[]>([]);
const availableLanguages = ref<LanguageDto[]>([]);
const tourFeatures = ref<TourFeatureDto[]>([]);
const destinations = ref<DestinationDto[]>([]);
const loading = ref(false);
const loadingTours = ref(false);
const loadingDestinations = ref(false);
const formRef = ref();
const isValid = ref(false);

// Tour dialog
const showTourDialog = ref(false);
const editingTour = ref<TourDto | null>(null);

// Table headers
const tableHeaders = [
  { title: 'Tur Başlığı', key: 'title', sortable: true },
  { title: 'Slug', key: 'slug', sortable: true },
  { title: 'Fiyat', key: 'basePrice', sortable: true },
  { title: 'Diller', key: 'languages', sortable: false },
  { title: 'Özellikler', key: 'features', sortable: false },
  { title: 'İşlemler', key: 'actions', sortable: false, align: 'end' },
];

// Feature dialog
const showFeatureDialog = ref(false);
const editingFeature = ref<TourFeatureDto | null>(null);
const savingFeature = ref(false);
const featureFormValid = ref(false);
const featureFormRef = ref();
const featureForm = reactive<{
  icon: string;
  translations: Record<string, string>;
  isActive: boolean;
}>({
  icon: '',
  translations: {},
  isActive: true,
});

// Icon picker
const showIconPicker = ref(false);
const iconSearchQuery = ref('');
const iconCategory = ref('all');

// İkon kategorileri
const iconCategories = {
  all: [
    'mdi-wifi', 'mdi-wifi-off', 'mdi-pool', 'mdi-food', 'mdi-coffee', 'mdi-restaurant',
    'mdi-car', 'mdi-bus', 'mdi-airplane', 'mdi-train', 'mdi-ship', 'mdi-bike',
    'mdi-music', 'mdi-movie', 'mdi-gamepad-variant', 'mdi-dumbbell', 'mdi-yoga',
    'mdi-beach', 'mdi-ski', 'mdi-snowflake', 'mdi-umbrella', 'mdi-sunglasses',
    'mdi-camera', 'mdi-camera-enhance', 'mdi-video', 'mdi-microphone',
    'mdi-shield-check', 'mdi-lock', 'mdi-key', 'mdi-account', 'mdi-account-group',
    'mdi-heart', 'mdi-star', 'mdi-thumb-up', 'mdi-fire', 'mdi-lightning-bolt',
    'mdi-home', 'mdi-hotel', 'mdi-bed', 'mdi-sofa', 'mdi-shower', 'mdi-bathtub',
    'mdi-air-conditioner', 'mdi-fan', 'mdi-radiator', 'mdi-fireplace',
    'mdi-television', 'mdi-radio', 'mdi-speaker', 'mdi-headphones',
    'mdi-book', 'mdi-library', 'mdi-school', 'mdi-graduation-cap',
    'mdi-hospital', 'mdi-medical-bag', 'mdi-pill', 'mdi-stethoscope',
    'mdi-briefcase', 'mdi-office-building', 'mdi-domain', 'mdi-city',
    'mdi-map', 'mdi-map-marker', 'mdi-compass', 'mdi-navigation',
    'mdi-phone', 'mdi-email', 'mdi-message', 'mdi-chat', 'mdi-forum',
    'mdi-calendar', 'mdi-clock', 'mdi-timer', 'mdi-alarm',
    'mdi-weather-sunny', 'mdi-weather-rainy', 'mdi-weather-cloudy', 'mdi-weather-night',
    'mdi-paw', 'mdi-dog', 'mdi-cat', 'mdi-bird',
    'mdi-tree', 'mdi-flower', 'mdi-leaf', 'mdi-seed',
    'mdi-water', 'mdi-water-pump', 'mdi-fountain', 'mdi-waves',
    'mdi-lightbulb', 'mdi-lamp', 'mdi-candle', 'mdi-flashlight',
    'mdi-battery', 'mdi-power', 'mdi-plug', 'mdi-outlet',
    'mdi-toolbox', 'mdi-wrench', 'mdi-hammer', 'mdi-screwdriver',
    'mdi-gift', 'mdi-party-popper', 'mdi-cake', 'mdi-candy',
    'mdi-shopping', 'mdi-cart', 'mdi-store', 'mdi-cash',
    'mdi-credit-card', 'mdi-wallet', 'mdi-bank', 'mdi-currency-usd',
    'mdi-tag', 'mdi-label', 'mdi-bookmark', 'mdi-flag',
    'mdi-palette', 'mdi-brush', 'mdi-pencil', 'mdi-pen',
    'mdi-image', 'mdi-image-multiple', 'mdi-folder-image', 'mdi-panorama',
    'mdi-file', 'mdi-folder', 'mdi-archive', 'mdi-database',
    'mdi-cloud', 'mdi-cloud-upload', 'mdi-cloud-download', 'mdi-cloud-sync',
    'mdi-download', 'mdi-upload', 'mdi-share', 'mdi-link',
    'mdi-printer', 'mdi-scanner', 'mdi-fax', 'mdi-copier',
    'mdi-security', 'mdi-shield', 'mdi-shield-lock', 'mdi-fingerprint',
    'mdi-eye', 'mdi-eye-off', 'mdi-search', 'mdi-filter',
    'mdi-sort', 'mdi-sort-ascending', 'mdi-sort-descending', 'mdi-swap-vertical',
    'mdi-refresh', 'mdi-reload', 'mdi-sync', 'mdi-update',
    'mdi-check', 'mdi-check-circle', 'mdi-check-all', 'mdi-checkbox-marked',
    'mdi-close', 'mdi-close-circle', 'mdi-cancel', 'mdi-delete',
    'mdi-plus', 'mdi-minus', 'mdi-plus-circle', 'mdi-minus-circle',
    'mdi-help', 'mdi-help-circle', 'mdi-information', 'mdi-alert',
    'mdi-alert-circle', 'mdi-alert-outline', 'mdi-warning', 'mdi-error',
    'mdi-menu', 'mdi-dots-vertical', 'mdi-dots-horizontal', 'mdi-view-grid',
    'mdi-view-list', 'mdi-view-module', 'mdi-view-dashboard',
    'mdi-settings', 'mdi-cog', 'mdi-tune', 'mdi-wrench',
    'mdi-play', 'mdi-pause', 'mdi-stop', 'mdi-skip-next',
    'mdi-skip-previous', 'mdi-fast-forward', 'mdi-rewind', 'mdi-repeat',
    'mdi-volume-high', 'mdi-volume-medium', 'mdi-volume-low', 'mdi-volume-off',
    'mdi-mute', 'mdi-unmute', 'mdi-sound', 'mdi-music-note',
    'mdi-arrow-up', 'mdi-arrow-down', 'mdi-arrow-left', 'mdi-arrow-right',
    'mdi-chevron-up', 'mdi-chevron-down', 'mdi-chevron-left', 'mdi-chevron-right',
    'mdi-page-first', 'mdi-page-last', 'mdi-skip-forward', 'mdi-skip-backward',
  ],
  wifi: [
    'mdi-wifi', 'mdi-wifi-off', 'mdi-wifi-strength-1', 'mdi-wifi-strength-2',
    'mdi-wifi-strength-3', 'mdi-wifi-strength-4', 'mdi-router-wireless',
    'mdi-access-point', 'mdi-access-point-network', 'mdi-network',
  ],
  food: [
    'mdi-food', 'mdi-food-variant', 'mdi-restaurant', 'mdi-coffee', 'mdi-coffee-outline',
    'mdi-cup', 'mdi-cup-outline', 'mdi-glass-wine', 'mdi-beer', 'mdi-cocktail',
    'mdi-silverware', 'mdi-silverware-fork-knife', 'mdi-silverware-variant',
    'mdi-bowl', 'mdi-bowl-outline', 'mdi-pot', 'mdi-pot-steam',
    'mdi-fridge', 'mdi-fridge-outline', 'mdi-stove', 'mdi-microwave',
    'mdi-cake', 'mdi-cake-variant', 'mdi-candy', 'mdi-candy-outline',
    'mdi-ice-cream', 'mdi-pizza', 'mdi-hamburger', 'mdi-sausage',
  ],
  pool: [
    'mdi-pool', 'mdi-swim', 'mdi-water', 'mdi-water-pump', 'mdi-fountain',
    'mdi-waves', 'mdi-beach', 'mdi-umbrella-beach', 'mdi-sun-screen',
    'mdi-dumbbell', 'mdi-weight-lifter', 'mdi-yoga', 'mdi-meditation',
    'mdi-bike', 'mdi-bike-fast', 'mdi-run', 'mdi-walk',
    'mdi-ski', 'mdi-ski-cross-country', 'mdi-snowboard', 'mdi-skate',
    'mdi-soccer', 'mdi-football', 'mdi-basketball', 'mdi-tennis',
    'mdi-golf', 'mdi-baseball', 'mdi-volleyball', 'mdi-badminton',
  ],
  transport: [
    'mdi-car', 'mdi-car-sports', 'mdi-car-convertible', 'mdi-car-estate',
    'mdi-bus', 'mdi-bus-double-decker', 'mdi-bus-articulated-end', 'mdi-bus-articulated-front',
    'mdi-train', 'mdi-train-variant', 'mdi-subway', 'mdi-subway-variant',
    'mdi-airplane', 'mdi-airplane-takeoff', 'mdi-airplane-landing', 'mdi-helicopter',
    'mdi-ship', 'mdi-ferry', 'mdi-sail-boat', 'mdi-yacht',
    'mdi-bike', 'mdi-bike-fast', 'mdi-moped', 'mdi-scooter',
    'mdi-taxi', 'mdi-truck', 'mdi-truck-delivery', 'mdi-truck-fast',
  ],
  entertainment: [
    'mdi-music', 'mdi-music-note', 'mdi-music-box', 'mdi-music-box-outline',
    'mdi-movie', 'mdi-movie-open', 'mdi-movie-outline', 'mdi-film',
    'mdi-gamepad-variant', 'mdi-controller-classic', 'mdi-controller',
    'mdi-television', 'mdi-television-classic', 'mdi-monitor', 'mdi-projector',
    'mdi-camera', 'mdi-camera-enhance', 'mdi-camera-iris', 'mdi-camera-outline',
    'mdi-video', 'mdi-video-outline', 'mdi-video-stabilization', 'mdi-videocam',
    'mdi-microphone', 'mdi-microphone-outline', 'mdi-microphone-variant',
    'mdi-headphones', 'mdi-headphones-box', 'mdi-earbuds', 'mdi-speaker',
    'mdi-palette', 'mdi-palette-outline', 'mdi-brush', 'mdi-pencil',
    'mdi-book', 'mdi-book-open', 'mdi-book-outline', 'mdi-library',
  ],
  other: [
    'mdi-heart', 'mdi-heart-outline', 'mdi-star', 'mdi-star-outline',
    'mdi-thumb-up', 'mdi-thumb-down', 'mdi-fire', 'mdi-lightning-bolt',
    'mdi-shield-check', 'mdi-lock', 'mdi-key', 'mdi-account',
    'mdi-home', 'mdi-hotel', 'mdi-bed', 'mdi-sofa',
    'mdi-calendar', 'mdi-clock', 'mdi-timer', 'mdi-alarm',
    'mdi-phone', 'mdi-email', 'mdi-message', 'mdi-chat',
    'mdi-map', 'mdi-map-marker', 'mdi-compass', 'mdi-navigation',
    'mdi-settings', 'mdi-cog', 'mdi-tune', 'mdi-wrench',
    'mdi-shopping', 'mdi-cart', 'mdi-store', 'mdi-cash',
    'mdi-gift', 'mdi-party-popper', 'mdi-cake', 'mdi-candy',
  ],
};

const filteredIcons = computed(() => {
  let icons = iconCategories[iconCategory.value as keyof typeof iconCategories] || iconCategories.all;
  
  if (iconSearchQuery.value) {
    const query = iconSearchQuery.value.toLowerCase();
    icons = icons.filter(icon => icon.toLowerCase().includes(query));
  }
  
  return icons;
});

const selectIcon = (icon: string) => {
  featureForm.icon = icon;
  showIconPicker.value = false;
  iconSearchQuery.value = '';
};

const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
    console.log('Languages loaded:', availableLanguages.value);
    
    // Auto-set default language if not set
    if (availableLanguages.value.length > 0 && !form.defaultLanguageId) {
      const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
      if (defaultLang) {
        form.defaultLanguageId = defaultLang.id;
      }
    }
  } catch (error) {
    console.error('Failed to load languages:', error);
    // Show error to user
    alert('Diller yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
  }
};

const loadDestinations = async () => {
  loadingDestinations.value = true;
  try {
    const { data } = await http.get<DestinationDto[]>('/destinations');
    destinations.value = data || [];
    console.log('Destinations loaded:', destinations.value.length, destinations.value);
    if (destinations.value.length === 0) {
      console.warn('No destinations found. Please add destinations first.');
    }
  } catch (error) {
    console.error('Failed to load destinations:', error);
    destinations.value = [];
  } finally {
    loadingDestinations.value = false;
  }
};

const getLanguageName = (langId: string): string => {
  const lang = availableLanguages.value.find(l => l.id === langId);
  return lang ? `${lang.name} (${lang.code})` : langId;
};

// Slugify function
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Auto-translate function - called directly from updateTranslationField
const triggerAutoTranslation = async (defaultLangId: string) => {
  console.log(`[triggerAutoTranslation] Triggered for default lang: ${defaultLangId}`);
  
  if (!defaultLangId || availableLanguages.value.length <= 1) {
    console.log('[triggerAutoTranslation] Skipping - no default lang or only one language');
    return;
  }
  
  const translation = form.translations[defaultLangId];
  if (!translation) {
    console.log('[triggerAutoTranslation] No translation object for default language');
    return;
  }
  
  const currentTitle = translation.title || '';
  const currentDescription = translation.description || '';
  
  console.log(`[triggerAutoTranslation] Current values - Title: "${currentTitle}", Description: "${currentDescription.substring(0, 50)}..."`);
  
  // Skip if both are empty
  if (!currentTitle.trim() && !currentDescription.trim()) {
    console.log('[triggerAutoTranslation] Both title and description are empty, skipping');
    return;
  }
  
  const defaultLang = availableLanguages.value.find(l => l.id === defaultLangId);
  if (!defaultLang) {
    console.log('[triggerAutoTranslation] Default language not found in available languages');
    return;
  }

  const otherLanguages = availableLanguages.value.filter(l => l.id !== defaultLangId);
  if (otherLanguages.length === 0) {
    console.log('[triggerAutoTranslation] No other languages to translate to');
    return;
  }
  
  // Clear previous timeout
  if (translationTimeout) {
    clearTimeout(translationTimeout);
  }
  
  // Debounce: wait a bit before translating (user might still be typing)
  translationTimeout = setTimeout(async () => {
    // Re-check values after debounce (user might have changed them)
    const finalTitle = form.translations[defaultLangId]?.title || '';
    const finalDescription = form.translations[defaultLangId]?.description || '';
    
    console.log(`[triggerAutoTranslation] Debounce completed - Final Title: "${finalTitle}", Final Description: "${finalDescription.substring(0, 50)}..."`);
    
    if (!finalTitle.trim() && !finalDescription.trim()) {
      console.log('[triggerAutoTranslation] Final values are empty, skipping translation');
      return;
    }
    
    translating.value = true;
    try {
      for (const targetLang of otherLanguages) {
        // Ensure translation object exists
        if (!form.translations[targetLang.id]) {
          form.translations[targetLang.id] = {
            title: '',
            slug: '',
            description: '',
            includedServices: [],
            excludedServices: [],
            infoItems: [],
          };
        }

        // Translate title if it exists
        if (finalTitle && finalTitle.trim()) {
          try {
            console.log(`[triggerAutoTranslation] Translating title from ${defaultLang.code} to ${targetLang.code}:`, finalTitle);
            const translated = await translateText(finalTitle, targetLang.code, defaultLang.code);
            console.log('[triggerAutoTranslation] Translated title:', translated);
            form.translations[targetLang.id].title = translated;
            form.translations[targetLang.id].slug = slugify(translated);
            console.log(`[triggerAutoTranslation] Successfully set translated title for ${targetLang.code}`);
          } catch (error) {
            console.error('[triggerAutoTranslation] Translation error for title:', error);
            alert('Başlık çevirisi sırasında bir hata oluştu: ' + (error as Error).message);
          }
        }

        // Translate description if it exists
        if (finalDescription && finalDescription.trim()) {
          try {
            console.log(`[triggerAutoTranslation] Translating description from ${defaultLang.code} to ${targetLang.code}`);
            const translated = await translateText(finalDescription, targetLang.code, defaultLang.code);
            console.log('[triggerAutoTranslation] Translated description:', translated);
            form.translations[targetLang.id].description = translated;
            console.log(`[triggerAutoTranslation] Successfully set translated description for ${targetLang.code}`);
          } catch (error) {
            console.error('[triggerAutoTranslation] Translation error for description:', error);
            alert('Açıklama çevirisi sırasında bir hata oluştu: ' + (error as Error).message);
          }
        }
      }
    } catch (error) {
      console.error('[triggerAutoTranslation] Auto-translation error:', error);
      alert('Otomatik çeviri sırasında bir hata oluştu: ' + (error as Error).message);
    } finally {
      translating.value = false;
    }
  }, 1500); // 1.5 second debounce
};

// Update translation field helper
const updateTranslationField = (langId: string, field: string, value: any) => {
  console.log(`[updateTranslationField] Updating ${field} for lang ${langId}:`, value);
  console.log(`[updateTranslationField] Current defaultLanguageId:`, form.defaultLanguageId);
  console.log(`[updateTranslationField] Is this default language?`, langId === form.defaultLanguageId);
  console.log(`[updateTranslationField] Is field title or description?`, field === 'title' || field === 'description');
  
  if (!form.translations[langId]) {
    form.translations[langId] = {
      title: '',
      slug: '',
      description: '',
      includedServices: [],
      excludedServices: [],
      infoItems: [],
    };
  }
  // Use direct property assignment to ensure Vue reactivity
  if (field === 'title') {
    form.translations[langId].title = value;
    form.translations[langId].slug = slugify(value);
    console.log(`[updateTranslationField] Set title and slug for lang ${langId}`);
  } else if (field === 'description') {
    form.translations[langId].description = value;
    console.log(`[updateTranslationField] Set description for lang ${langId}`);
  } else {
    (form.translations[langId] as any)[field] = value;
  }
  
  // If this is the default language and we're updating title or description, trigger auto-translation
  const isDefaultLang = form.defaultLanguageId && langId === form.defaultLanguageId;
  const isTitleOrDescription = field === 'title' || field === 'description';
  
  console.log(`[updateTranslationField] Check: isDefaultLang=${isDefaultLang}, isTitleOrDescription=${isTitleOrDescription}`);
  
  if (isDefaultLang && isTitleOrDescription) {
    console.log(`[updateTranslationField] ✓ Default language field changed, triggering auto-translation`);
    triggerAutoTranslation(form.defaultLanguageId);
  } else {
    console.log(`[updateTranslationField] ✗ Skipping auto-translation - isDefaultLang: ${isDefaultLang}, isTitleOrDescription: ${isTitleOrDescription}`);
  }
};

// Add service/item helpers
const addIncludedService = (langId: string) => {
  if (!form.translations[langId]) {
    form.translations[langId] = {
      title: '',
      description: '',
      includedServices: [],
      excludedServices: [],
      infoItems: [],
    };
  }
  form.translations[langId].includedServices.push('');
};

const addExcludedService = (langId: string) => {
  if (!form.translations[langId]) {
    form.translations[langId] = {
      title: '',
      description: '',
      includedServices: [],
      excludedServices: [],
      infoItems: [],
    };
  }
  form.translations[langId].excludedServices.push('');
};

const addInfoItem = (langId: string) => {
  if (!form.translations[langId]) {
    form.translations[langId] = {
      title: '',
      description: '',
      includedServices: [],
      excludedServices: [],
      infoItems: [],
    };
  }
  form.translations[langId].infoItems.push('');
};

const getFeatureName = (feature: TourFeatureDto): string => {
  // Önce varsayılan dili (isDefault) bul, yoksa ilk dili kullan
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (!defaultLang) return feature.icon;
  
  const translation = feature.translations.find(t => t.languageId === defaultLang.id);
  return translation?.name || feature.icon;
};

const getTourPrice = (tour: TourDto): string => {
  if (!tour.pricing || tour.pricing.length === 0) {
    return `0.00 ${tour.currencyCode || 'EUR'}`;
  }
  
  // Önce yetişkin fiyatını bul
  const adultPrice = tour.pricing.find(p => p.type === 'adult');
  if (adultPrice) {
    return `${Number(adultPrice.price).toFixed(2)} ${adultPrice.currencyCode || tour.currencyCode || 'EUR'}`;
  }
  
  // Yetişkin fiyatı yoksa ilk fiyatı göster
  const firstPrice = tour.pricing[0];
  return `${Number(firstPrice.price).toFixed(2)} ${firstPrice.currencyCode || tour.currencyCode || 'EUR'}`;
};

// Feature form için varsayılan dil
const featureDefaultLanguageId = computed(() => {
  if (availableLanguages.value.length === 0) return undefined;
  const defaultLang = availableLanguages.value.find(l => l.isDefault);
  return defaultLang?.id || availableLanguages.value[0]?.id;
});

// Feature form için otomatik çeviri fonksiyonu
const triggerFeatureAutoTranslation = async (defaultLangId: string) => {
  console.log(`[triggerFeatureAutoTranslation] Triggered for default lang: ${defaultLangId}`);
  
  if (!defaultLangId || availableLanguages.value.length <= 1) {
    console.log('[triggerFeatureAutoTranslation] Skipping - no default lang or only one language');
    return;
  }
  
  const defaultTranslation = featureForm.translations[defaultLangId];
  if (!defaultTranslation || !defaultTranslation.trim()) {
    console.log('[triggerFeatureAutoTranslation] No translation text for default language');
    return;
  }
  
  const defaultLang = availableLanguages.value.find(l => l.id === defaultLangId);
  if (!defaultLang) {
    console.log('[triggerFeatureAutoTranslation] Default language not found in available languages');
    return;
  }

  const otherLanguages = availableLanguages.value.filter(l => l.id !== defaultLangId);
  if (otherLanguages.length === 0) {
    console.log('[triggerFeatureAutoTranslation] No other languages to translate to');
    return;
  }
  
  // Clear previous timeout
  if (featureTranslationTimeout) {
    clearTimeout(featureTranslationTimeout);
  }
  
  // Debounce: wait a bit before translating (user might still be typing)
  featureTranslationTimeout = setTimeout(async () => {
    // Re-check value after debounce (user might have changed it)
    const finalText = featureForm.translations[defaultLangId] || '';
    
    console.log(`[triggerFeatureAutoTranslation] Debounce completed - Final text: "${finalText}"`);
    
    if (!finalText.trim()) {
      console.log('[triggerFeatureAutoTranslation] Final value is empty, skipping translation');
      return;
    }
    
    translating.value = true;
    try {
      for (const targetLang of otherLanguages) {
        // Only translate if target is empty or significantly different
        const currentTarget = featureForm.translations[targetLang.id] || '';
        if (!currentTarget.trim() || currentTarget.trim() !== finalText.trim()) {
          try {
            console.log(`[triggerFeatureAutoTranslation] Translating from ${defaultLang.code} to ${targetLang.code}:`, finalText);
            const translated = await translateText(finalText, targetLang.code, defaultLang.code);
            console.log('[triggerFeatureAutoTranslation] Translated:', translated);
            featureForm.translations[targetLang.id] = translated;
            console.log(`[triggerFeatureAutoTranslation] Successfully set translated text for ${targetLang.code}`);
          } catch (error) {
            console.error('[triggerFeatureAutoTranslation] Translation error:', error);
            alert('Özellik adı çevirisi sırasında bir hata oluştu: ' + (error as Error).message);
          }
        } else {
          console.log(`[triggerFeatureAutoTranslation] Skipping ${targetLang.code} - already has content`);
        }
      }
    } catch (error) {
      console.error('[triggerFeatureAutoTranslation] Auto-translation error:', error);
      alert('Otomatik çeviri sırasında bir hata oluştu: ' + (error as Error).message);
    } finally {
      translating.value = false;
    }
  }, 1500); // 1.5 second debounce
};

const getTabName = (tabValue: string): string => {
  const tabNames: Record<string, string> = {
    basic: 'Temel Bilgiler',
    services: 'Hizmetler ve Özellikler',
    schedule: 'Program & Süre',
    media: 'Medya',
    pricing: 'Fiyatlandırma',
    other: 'Diğer',
  };
  return tabNames[tabValue] || '';
};

const currentTabName = computed(() => getTabName(formTab.value));

// Currency options
const currencyOptions = [
  { value: 'TRY', title: 'Türk Lirası', symbol: '₺' },
  { value: 'USD', title: 'Amerikan Doları', symbol: '$' },
  { value: 'EUR', title: 'Euro', symbol: '€' },
];

// Fiyatlandırma computed properties
const adultPricing = computed({
  get: () => form.pricing.filter(p => p.type === 'adult'),
  set: (value) => {
    form.pricing = [
      ...value,
      ...form.pricing.filter(p => p.type !== 'adult')
    ];
  }
});

const childPricing = computed({
  get: () => form.pricing.filter(p => p.type === 'child'),
  set: (value) => {
    form.pricing = [
      ...form.pricing.filter(p => p.type !== 'adult' && p.type !== 'child'),
      ...value
    ];
  }
});

const infantPricing = computed({
  get: () => form.pricing.filter(p => p.type === 'infant'),
  set: (value) => {
    form.pricing = [
      ...form.pricing.filter(p => p.type !== 'adult' && p.type !== 'child' && p.type !== 'infant'),
      ...value
    ];
  }
});

const otherPricing = computed({
  get: () => form.pricing.filter(p => !['adult', 'child', 'infant'].includes(p.type)),
  set: (value) => {
    form.pricing = [
      ...form.pricing.filter(p => ['adult', 'child', 'infant'].includes(p.type)),
      ...value
    ];
  }
});

// Fiyatlandırma fonksiyonları
const addAdultPricing = () => {
  form.pricing.push({ type: 'adult', price: 0, currencyCode: form.currencyCode || 'EUR' });
};

const removeAdultPricing = (index: number) => {
  const adultPrices = form.pricing.filter(p => p.type === 'adult');
  const toRemove = adultPrices[index];
  const globalIndex = form.pricing.findIndex(p => p === toRemove);
  if (globalIndex !== -1) form.pricing.splice(globalIndex, 1);
};

const addChildPricing = () => {
  form.pricing.push({ type: 'child', price: 0, currencyCode: form.currencyCode || 'EUR' });
};

const removeChildPricing = (index: number) => {
  const childPrices = form.pricing.filter(p => p.type === 'child');
  const toRemove = childPrices[index];
  const globalIndex = form.pricing.findIndex(p => p === toRemove);
  if (globalIndex !== -1) form.pricing.splice(globalIndex, 1);
};

const addInfantPricing = () => {
  form.pricing.push({ type: 'infant', price: 0, currencyCode: form.currencyCode || 'EUR' });
};

const removeInfantPricing = (index: number) => {
  const infantPrices = form.pricing.filter(p => p.type === 'infant');
  const toRemove = infantPrices[index];
  const globalIndex = form.pricing.findIndex(p => p === toRemove);
  if (globalIndex !== -1) form.pricing.splice(globalIndex, 1);
};

const addOtherPricing = () => {
  form.pricing.push({ type: 'extra_motor', price: 0, currencyCode: form.currencyCode || 'EUR' });
};

const removeOtherPricing = (index: number) => {
  const otherPrices = form.pricing.filter(p => !['adult', 'child', 'infant'].includes(p.type));
  const toRemove = otherPrices[index];
  const globalIndex = form.pricing.findIndex(p => p === toRemove);
  if (globalIndex !== -1) form.pricing.splice(globalIndex, 1);
};

// DeepL Çeviri fonksiyonları
const translateFromDefault = async () => {
  if (!form.defaultLanguageId || form.languageIds.length <= 1) return;
  
  translating.value = true;
  try {
    const defaultLang = availableLanguages.value.find(l => l.id === form.defaultLanguageId);
    if (!defaultLang) return;

    const otherLanguages = form.languageIds.filter(id => id !== form.defaultLanguageId);
    
    for (const langId of otherLanguages) {
      const targetLang = availableLanguages.value.find(l => l.id === langId);
      if (!targetLang) continue;

      // Translate title
      if (form.translations[form.defaultLanguageId]?.title) {
        const translated = await translateText(
          form.translations[form.defaultLanguageId].title,
          targetLang.code,
          defaultLang.code
        );
        if (!form.translations[langId]) {
          form.translations[langId] = { title: '', description: '', includedServices: [], excludedServices: [], infoItems: [] };
        }
        form.translations[langId].title = translated;
      }

      // Translate description
      if (form.translations[form.defaultLanguageId]?.description) {
        const translated = await translateText(
          form.translations[form.defaultLanguageId].description,
          targetLang.code,
          defaultLang.code
        );
        form.translations[langId].description = translated;
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
    alert('Çeviri sırasında bir hata oluştu.');
  } finally {
    translating.value = false;
  }
};

const translateField = async (field: 'title' | 'description', langId: string) => {
  if (!form.defaultLanguageId) return;
  
  const defaultLang = availableLanguages.value.find(l => l.id === form.defaultLanguageId);
  const targetLang = availableLanguages.value.find(l => l.id === langId);
  if (!defaultLang || !targetLang) return;

  if (!translatingFields.value[langId]) {
    translatingFields.value[langId] = {};
  }
  translatingFields.value[langId][field] = true;

  try {
    const sourceText = form.translations[form.defaultLanguageId]?.[field];
    if (!sourceText) return;

    const translated = await translateText(sourceText, targetLang.code, defaultLang.code);
    if (!form.translations[langId]) {
      form.translations[langId] = { title: '', description: '', includedServices: [], excludedServices: [], infoItems: [] };
    }
    form.translations[langId][field] = translated;
  } catch (error) {
    console.error('Translation error:', error);
    alert('Çeviri sırasında bir hata oluştu.');
  } finally {
    translatingFields.value[langId][field] = false;
  }
};

const translateService = async (type: 'included' | 'excluded', index: number, langId: string) => {
  if (!form.defaultLanguageId) return;
  
  const defaultLang = availableLanguages.value.find(l => l.id === form.defaultLanguageId);
  const targetLang = availableLanguages.value.find(l => l.id === langId);
  if (!defaultLang || !targetLang) return;

  const fieldKey = `${type}_${index}`;
  if (!translatingFields.value[langId]) {
    translatingFields.value[langId] = {};
  }
  translatingFields.value[langId][fieldKey] = true;

  try {
    const sourceText = form.translations[form.defaultLanguageId]?.[type === 'included' ? 'includedServices' : 'excludedServices']?.[index];
    if (!sourceText) return;

    const translated = await translateText(sourceText, targetLang.code, defaultLang.code);
    if (!form.translations[langId]) {
      form.translations[langId] = { title: '', description: '', includedServices: [], excludedServices: [], infoItems: [] };
    }
    const services = form.translations[langId][type === 'included' ? 'includedServices' : 'excludedServices'];
    if (!services[index]) {
      services[index] = '';
    }
    services[index] = translated;
  } catch (error) {
    console.error('Translation error:', error);
    alert('Çeviri sırasında bir hata oluştu.');
  } finally {
    translatingFields.value[langId][fieldKey] = false;
  }
};

const translateInfoItem = async (index: number, langId: string) => {
  if (!form.defaultLanguageId) return;
  
  const defaultLang = availableLanguages.value.find(l => l.id === form.defaultLanguageId);
  const targetLang = availableLanguages.value.find(l => l.id === langId);
  if (!defaultLang || !targetLang) return;

  const fieldKey = `info_${index}`;
  if (!translatingFields.value[langId]) {
    translatingFields.value[langId] = {};
  }
  translatingFields.value[langId][fieldKey] = true;

  try {
    const sourceText = form.translations[form.defaultLanguageId]?.infoItems?.[index];
    if (!sourceText) return;

    const translated = await translateText(sourceText, targetLang.code, defaultLang.code);
    if (!form.translations[langId]) {
      form.translations[langId] = { title: '', description: '', includedServices: [], excludedServices: [], infoItems: [] };
    }
    if (!form.translations[langId].infoItems[index]) {
      form.translations[langId].infoItems[index] = '';
    }
    form.translations[langId].infoItems[index] = translated;
  } catch (error) {
    console.error('Translation error:', error);
    alert('Çeviri sırasında bir hata oluştu.');
  } finally {
    translatingFields.value[langId][fieldKey] = false;
  }
};

// Dosya upload fonksiyonları
const addImageField = () => {
  const index = form.images.length;
  form.images.push({ url: '', alt: '', isPrimary: false, file: null });
  imageUploadType.value[index] = 'url';
};

const handleImageUpload = async (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadingImages.value[index] = true;
  imageUploadProgress.value[index] = 0;

  try {
    // TODO: Implement actual file upload to server
    // For now, create a local URL
    const url = URL.createObjectURL(file);
    form.images[index].url = url;
    form.images[index].file = file;
    imageUploadProgress.value[index] = 100;
  } catch (error) {
    console.error('Image upload error:', error);
    alert('Resim yüklenirken bir hata oluştu.');
  } finally {
    uploadingImages.value[index] = false;
  }
};

const handleVideoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadingVideo.value = true;
  videoUploadProgress.value = 0;

  try {
    // TODO: Implement actual file upload to server
    // For now, create a local URL
    const url = URL.createObjectURL(file);
    form.video = url;
    videoFile.value = [file];
    videoUploadProgress.value = 100;
  } catch (error) {
    console.error('Video upload error:', error);
    alert('Video yüklenirken bir hata oluştu.');
  } finally {
    uploadingVideo.value = false;
  }
};

const loadTourFeatures = async () => {
  try {
    const { data } = await http.get<TourFeatureDto[]>('/tour-features');
    tourFeatures.value = data;
  } catch (error) {
    console.error('Failed to load tour features:', error);
  }
};

const closeFeatureDialog = () => {
  showFeatureDialog.value = false;
  editingFeature.value = null;
  featureForm.icon = '';
  featureForm.translations = {};
  featureForm.isActive = true;
  showIconPicker.value = false;
  iconSearchQuery.value = '';
  iconCategory.value = 'all';
  // Clear feature translation timeout
  if (featureTranslationTimeout) {
    clearTimeout(featureTranslationTimeout);
    featureTranslationTimeout = null;
  }
};

const editFeature = (feature: TourFeatureDto) => {
  editingFeature.value = feature;
  featureForm.icon = feature.icon;
  featureForm.isActive = feature.isActive;
  featureForm.translations = {};
  
  // Populate translations
  feature.translations.forEach(t => {
    featureForm.translations[t.languageId] = t.name;
  });
  
  // Initialize empty translations for missing languages
  availableLanguages.value.forEach(lang => {
    if (!featureForm.translations[lang.id]) {
      featureForm.translations[lang.id] = '';
    }
  });
  
  // Clear feature translation timeout
  if (featureTranslationTimeout) {
    clearTimeout(featureTranslationTimeout);
    featureTranslationTimeout = null;
  }
  
  showFeatureDialog.value = true;
};

const saveFeature = async () => {
  const validation = await featureFormRef.value?.validate();
  if (!validation?.valid) return;

  savingFeature.value = true;
  try {
    const translations = Object.entries(featureForm.translations)
      .filter(([_, name]) => name.trim())
      .map(([languageId, name]) => ({
        languageId,
        name: name.trim(),
      }));

    if (translations.length === 0) {
      alert('En az bir dil için özellik adı girmelisiniz.');
      savingFeature.value = false;
      return;
    }

    const payload = {
      icon: featureForm.icon.trim(),
      translations,
      isActive: featureForm.isActive,
    };

    if (editingFeature.value) {
      await http.put(`/tour-features/${editingFeature.value.id}`, payload);
    } else {
      await http.post('/tour-features', payload);
    }

    await loadTourFeatures();
    closeFeatureDialog();
  } catch (error: any) {
    console.error('Failed to save feature:', error);
    alert(error.response?.data?.message || 'Özellik kaydedilemedi');
  } finally {
    savingFeature.value = false;
  }
};

const deleteFeature = async (id: string) => {
  if (!confirm('Bu özelliği silmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await http.delete(`/tour-features/${id}`);
    await loadTourFeatures();
  } catch (error: any) {
    console.error('Failed to delete feature:', error);
    alert(error.response?.data?.message || 'Özellik silinemedi');
  }
};

const deleteTour = async (id: string) => {
  if (!confirm('Bu turu silmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await http.delete(`/tours/${id}`);
    await loadTours();
  } catch (error: any) {
    console.error('Failed to delete tour:', error);
    alert(error.response?.data?.message || 'Tur silinemedi');
  }
};

const loadTours = async () => {
  if (!auth.tenant) return;
  loadingTours.value = true;
  try {
  const { data } = await http.get<TourDto[]>('/tours', { params: { tenantId: auth.tenant.id } });
  tours.value = data;
  } catch (error) {
    console.error('Failed to load tours:', error);
    alert('Turlar yüklenirken bir hata oluştu.');
  } finally {
    loadingTours.value = false;
  }
};

const openCreateDialog = () => {
  editingTour.value = null;
  resetForm();
  
  // Set default language after reset
  if (availableLanguages.value.length > 0) {
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    if (defaultLang) {
      form.defaultLanguageId = defaultLang.id;
      console.log('[openCreateDialog] Set defaultLanguageId to:', defaultLang.id, defaultLang.name);
    }
  }
  
  showTourDialog.value = true;
};

const editTour = async (tour: TourDto) => {
  editingTour.value = tour;
  
  // Load full tour data
  try {
    const { data } = await http.get<TourDto>(`/tours/${tour.id}`);
    const fullTour = data;
    
    form.destinationId = fullTour.destinationId || '';
    form.slug = fullTour.slug;
    // Use all available languages, but mark tour's languages as selected
    form.languageIds = availableLanguages.value.map(l => l.id);
    form.defaultLanguageId = fullTour.defaultLanguage?.id || availableLanguages.value.find(l => l.isDefault)?.id || availableLanguages.value[0]?.id;
    form.duration = fullTour.duration;
    form.durationUnit = fullTour.durationUnit || 'hour';
    form.maxCapacity = fullTour.maxCapacity || 0;
    form.days = fullTour.days || [];
    form.video = fullTour.video || '';
    form.featureIds = fullTour.features?.map(f => f.id) || [];
    form.currencyCode = fullTour.currencyCode || 'EUR';
    form.tags = fullTour.tags?.join(', ') || '';
    
    // Load translations
    if (fullTour.translations) {
      fullTour.translations.forEach(trans => {
        try {
          form.translations[trans.languageId] = {
            title: trans.title,
            slug: trans.slug,
            description: trans.description || '',
            includedServices: trans.includedServices 
              ? (typeof trans.includedServices === 'string' ? JSON.parse(trans.includedServices) : trans.includedServices)
              : [],
            excludedServices: trans.excludedServices
              ? (typeof trans.excludedServices === 'string' ? JSON.parse(trans.excludedServices) : trans.excludedServices)
              : [],
            infoItems: [],
          };
        } catch (e) {
          form.translations[trans.languageId] = {
            title: trans.title,
            slug: trans.slug,
            description: trans.description || '',
            includedServices: [],
            excludedServices: [],
            infoItems: [],
          };
        }
      });
    }
    
    // Load info items
    if (fullTour.infoItems) {
      fullTour.infoItems.forEach(item => {
        if (!form.translations[item.languageId]) {
          form.translations[item.languageId] = {
            title: '',
            description: '',
            includedServices: [],
            excludedServices: [],
            infoItems: [],
          };
        }
        if (!form.translations[item.languageId].infoItems) {
          form.translations[item.languageId].infoItems = [];
        }
        form.translations[item.languageId].infoItems.push(item.text);
      });
    }
    
    // Load images
    form.images = fullTour.images?.map(img => ({
      url: img.url,
      alt: img.alt || '',
      isPrimary: img.isPrimary || false,
    })) || [];
    
    // Load time slots
    form.timeSlots = fullTour.timeSlots?.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
    })) || [];
    
    // Load pricing
    form.pricing = fullTour.pricing?.map(p => ({
      type: p.type,
      price: p.price,
      currencyCode: p.currencyCode,
      description: p.description || '',
    })) || [];
    
    if (availableLanguages.value.length > 0) {
      const firstLangId = form.defaultLanguageId || availableLanguages.value[0].id;
      contentLanguageTab.value = firstLangId;
      translationTab.value = firstLangId;
      servicesTab.value = firstLangId;
      excludedServicesTab.value = firstLangId;
      infoItemsTab.value = firstLangId;
    }
  } catch (error) {
    console.error('Failed to load tour details:', error);
    alert('Tur detayları yüklenirken bir hata oluştu.');
  }
  
  showTourDialog.value = true;
};

const closeTourDialog = () => {
  showTourDialog.value = false;
  editingTour.value = null;
  resetForm();
};

const resetForm = () => {
  form.destinationId = '';
  form.slug = '';
  form.languageIds = [];
  form.defaultLanguageId = undefined;
  form.translations = {};
  form.duration = undefined;
  form.durationUnit = 'hour';
  form.maxCapacity = 0;
  form.days = [];
  form.video = '';
  form.featureIds = [];
  form.images = [];
  form.timeSlots = [];
  form.pricing = [];
  form.currencyCode = 'EUR';
  form.tags = '';
  formTab.value = 'basic';
  contentLanguageTab.value = '';
  translationTab.value = '';
  servicesTab.value = '';
  excludedServicesTab.value = '';
  infoItemsTab.value = '';
  imageUploadType.value = {};
  videoUploadType.value = 'url';
  videoFile.value = null;
};

// Watch availableLanguages to initialize translations and set default language
watch(
  () => availableLanguages.value,
  (newLangs) => {
    if (newLangs.length === 0) return;

    // Initialize translations for all available languages
    newLangs.forEach(lang => {
      if (!form.translations[lang.id]) {
        form.translations[lang.id] = {
          title: '',
          description: '',
          includedServices: [],
          excludedServices: [],
          infoItems: [],
        };
      }
    });

    // Set default language (first language or system default)
    const defaultLang = newLangs.find(l => l.isDefault) || newLangs[0];
    if (defaultLang && !form.defaultLanguageId) {
      form.defaultLanguageId = defaultLang.id;
    }

    // Set all available languages as selected
    form.languageIds = newLangs.map(l => l.id);

    // Set default content language tab
    if (newLangs.length > 0) {
      if (!contentLanguageTab.value || !newLangs.find(l => l.id === contentLanguageTab.value)) {
        contentLanguageTab.value = form.defaultLanguageId || newLangs[0].id;
      }
    }

    // Set default tabs
    if (newLangs.length > 0) {
      const firstLangId = newLangs[0].id;
      if (!translationTab.value || !newLangs.find(l => l.id === translationTab.value)) {
        translationTab.value = firstLangId;
      }
      if (!servicesTab.value || !newLangs.find(l => l.id === servicesTab.value)) {
        servicesTab.value = firstLangId;
      }
      if (!excludedServicesTab.value || !newLangs.find(l => l.id === excludedServicesTab.value)) {
        excludedServicesTab.value = firstLangId;
      }
      if (!infoItemsTab.value || !newLangs.find(l => l.id === infoItemsTab.value)) {
        infoItemsTab.value = firstLangId;
      }
    }
  },
  { immediate: true }
);

// Watch default language title/description for auto-translation
// Watch form.translations object directly with deep watch
watch(
  () => {
    // Watch the entire translations object and defaultLanguageId
    const defaultLangId = form.defaultLanguageId;
    if (!defaultLangId) return { translations: {}, defaultLangId: null };
    const translation = form.translations[defaultLangId];
    if (!translation) return { translations: {}, defaultLangId: null };
    // Return the translation object itself to trigger on any nested change
    return {
      translations: form.translations,
      defaultLangId: defaultLangId,
      title: translation.title || '',
      description: translation.description || '',
    };
  },
  async (newVal, oldVal) => {
    console.log('[Auto-Translate] Watch callback triggered', { 
      newVal: newVal ? { defaultLangId: newVal.defaultLangId, title: newVal.title, description: newVal.description?.substring(0, 30) } : null,
      oldVal: oldVal ? { defaultLangId: oldVal.defaultLangId, title: oldVal.title, description: oldVal.description?.substring(0, 30) } : null
    });
    
    if (!newVal || !newVal.defaultLangId) {
      console.log('[Auto-Translate] No default language translation data');
      return;
    }
    
    const defaultLangId = newVal.defaultLangId;
    if (availableLanguages.value.length <= 1) {
      console.log('[Auto-Translate] Skipping - only one language available');
      return;
    }
    
    // Skip if values haven't actually changed
    if (oldVal && oldVal.defaultLangId === newVal.defaultLangId && oldVal.title === newVal.title && oldVal.description === newVal.description) {
      console.log('[Auto-Translate] Values unchanged, skipping');
      return;
    }
    
    const currentTitle = newVal.title || '';
    const currentDescription = newVal.description || '';
    
    console.log(`[Auto-Translate] Processing - Title: "${currentTitle}", Description: "${currentDescription.substring(0, 50)}..."`);
    
    // Skip if both are empty
    if (!currentTitle.trim() && !currentDescription.trim()) {
      console.log('[Auto-Translate] Both title and description are empty, skipping');
      return;
    }
    
    const defaultLang = availableLanguages.value.find(l => l.id === defaultLangId);
    if (!defaultLang) {
      console.log('[Auto-Translate] Default language not found in available languages');
      return;
    }

    const otherLanguages = availableLanguages.value.filter(l => l.id !== defaultLangId);
    if (otherLanguages.length === 0) {
      console.log('[Auto-Translate] No other languages to translate to');
      return;
    }
    
    // Clear previous timeout
    if (translationTimeout) {
      clearTimeout(translationTimeout);
    }
    
    // Debounce: wait a bit before translating (user might still be typing)
    translationTimeout = setTimeout(async () => {
      // Re-check values after debounce (user might have changed them)
      const finalTitle = form.translations[defaultLangId]?.title || '';
      const finalDescription = form.translations[defaultLangId]?.description || '';
      
      console.log(`[Auto-Translate] Debounce completed - Final Title: "${finalTitle}", Final Description: "${finalDescription.substring(0, 50)}..."`);
      
      if (!finalTitle.trim() && !finalDescription.trim()) {
        console.log('[Auto-Translate] Final values are empty, skipping translation');
        return;
      }
      
      translating.value = true;
      try {
        for (const targetLang of otherLanguages) {
          // Ensure translation object exists
          if (!form.translations[targetLang.id]) {
            form.translations[targetLang.id] = {
              title: '',
              slug: '',
              description: '',
              includedServices: [],
              excludedServices: [],
              infoItems: [],
            };
          }

          // Translate title if it exists
          if (finalTitle && finalTitle.trim()) {
            try {
              console.log(`[Auto-Translate] Translating title from ${defaultLang.code} to ${targetLang.code}:`, finalTitle);
              const translated = await translateText(finalTitle, targetLang.code, defaultLang.code);
              console.log('[Auto-Translate] Translated title:', translated);
              form.translations[targetLang.id].title = translated;
              form.translations[targetLang.id].slug = slugify(translated);
              console.log(`[Auto-Translate] Successfully set translated title for ${targetLang.code}`);
            } catch (error) {
              console.error('[Auto-Translate] Translation error for title:', error);
              alert('Başlık çevirisi sırasında bir hata oluştu: ' + (error as Error).message);
            }
          }

          // Translate description if it exists
          if (finalDescription && finalDescription.trim()) {
            try {
              console.log(`[Auto-Translate] Translating description from ${defaultLang.code} to ${targetLang.code}`);
              const translated = await translateText(finalDescription, targetLang.code, defaultLang.code);
              console.log('[Auto-Translate] Translated description:', translated);
              form.translations[targetLang.id].description = translated;
              console.log(`[Auto-Translate] Successfully set translated description for ${targetLang.code}`);
            } catch (error) {
              console.error('[Auto-Translate] Translation error for description:', error);
              alert('Açıklama çevirisi sırasında bir hata oluştu: ' + (error as Error).message);
            }
          }
        }
      } catch (error) {
        console.error('[Auto-Translate] Auto-translation error:', error);
        alert('Otomatik çeviri sırasında bir hata oluştu: ' + (error as Error).message);
      } finally {
        translating.value = false;
      }
    }, 1500); // 1.5 second debounce
  },
  { deep: true, immediate: false }
);

// Watch default language services and info items for auto-translation
let servicesTranslationTimeout: ReturnType<typeof setTimeout> | null = null;
let infoItemsTranslationTimeout: ReturnType<typeof setTimeout> | null = null;

// Watch included services - watch the array directly
watch(
  () => {
    const defaultLangId = form.defaultLanguageId;
    if (!defaultLangId) return { defaultLangId: null, services: [] };
    const translation = form.translations[defaultLangId];
    if (!translation) return { defaultLangId: null, services: [] };
    // Return array length and a string representation to detect changes
    return {
      defaultLangId,
      length: translation.includedServices?.length || 0,
      services: [...(translation.includedServices || [])], // Create a copy to trigger reactivity
    };
  },
  async (newVal, oldVal) => {
    console.log('[Auto-Translate-Services] Watch triggered for included services', { newVal, oldVal });
    
    if (!newVal || !newVal.defaultLangId || availableLanguages.value.length <= 1) {
      console.log('[Auto-Translate-Services] Skipping - no default lang or only one language');
      return;
    }
    
    // Skip initial watch (oldVal is undefined)
    if (!oldVal) {
      console.log('[Auto-Translate-Services] Initial watch, skipping');
      return;
    }
    
    // Skip if length and content haven't changed
    if (oldVal.defaultLangId === newVal.defaultLangId && 
        oldVal.length === newVal.length && 
        JSON.stringify(oldVal.services) === JSON.stringify(newVal.services)) {
      console.log('[Auto-Translate-Services] Values unchanged, skipping');
      return;
    }
    
    const defaultLang = availableLanguages.value.find(l => l.id === newVal.defaultLangId);
    if (!defaultLang) {
      console.log('[Auto-Translate-Services] Default language not found');
      return;
    }
    
    const otherLanguages = availableLanguages.value.filter(l => l.id !== newVal.defaultLangId);
    if (otherLanguages.length === 0) {
      console.log('[Auto-Translate-Services] No other languages to translate to');
      return;
    }
    
    // Clear previous timeout
    if (servicesTranslationTimeout) {
      clearTimeout(servicesTranslationTimeout);
    }
    
    // Debounce: wait a bit before translating
    servicesTranslationTimeout = setTimeout(async () => {
      const finalServices = form.translations[newVal.defaultLangId]?.includedServices || [];
      console.log(`[Auto-Translate-Services] Debounce completed - Final services:`, finalServices);
      
      if (finalServices.length === 0) {
        console.log('[Auto-Translate-Services] No services to translate');
        return;
      }
      
      translating.value = true;
      try {
        for (const targetLang of otherLanguages) {
          if (!form.translations[targetLang.id]) {
            form.translations[targetLang.id] = {
              title: '',
              slug: '',
              description: '',
              includedServices: [],
              excludedServices: [],
              infoItems: [],
            };
          }
          
          // Ensure array has same length
          while (form.translations[targetLang.id].includedServices.length < finalServices.length) {
            form.translations[targetLang.id].includedServices.push('');
          }
          while (form.translations[targetLang.id].includedServices.length > finalServices.length) {
            form.translations[targetLang.id].includedServices.pop();
          }
          
          // Translate each service (only if it has content and target is empty or different)
          for (let i = 0; i < finalServices.length; i++) {
            if (finalServices[i] && finalServices[i].trim()) {
              const currentTarget = form.translations[targetLang.id].includedServices[i] || '';
              // Only translate if target is empty or significantly different
              if (!currentTarget.trim() || currentTarget.trim() !== finalServices[i].trim()) {
                try {
                  console.log(`[Auto-Translate-Services] Translating included service ${i} from ${defaultLang.code} to ${targetLang.code}:`, finalServices[i]);
                  const translated = await translateText(finalServices[i], targetLang.code, defaultLang.code);
                  console.log(`[Auto-Translate-Services] Translated:`, translated);
                  form.translations[targetLang.id].includedServices[i] = translated;
                } catch (error) {
                  console.error(`[Auto-Translate-Services] Translation error for included service ${i}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[Auto-Translate-Services] Auto-translation error for included services:', error);
      } finally {
        translating.value = false;
      }
    }, 1500);
  },
  { deep: true, immediate: false }
);

// Watch excluded services - watch the array directly
watch(
  () => {
    const defaultLangId = form.defaultLanguageId;
    if (!defaultLangId) return { defaultLangId: null, services: [] };
    const translation = form.translations[defaultLangId];
    if (!translation) return { defaultLangId: null, services: [] };
    // Return array length and a string representation to detect changes
    return {
      defaultLangId,
      length: translation.excludedServices?.length || 0,
      services: [...(translation.excludedServices || [])], // Create a copy to trigger reactivity
    };
  },
  async (newVal, oldVal) => {
    console.log('[Auto-Translate-Services] Watch triggered for excluded services', { newVal, oldVal });
    
    if (!newVal || !newVal.defaultLangId || availableLanguages.value.length <= 1) {
      console.log('[Auto-Translate-Services] Skipping - no default lang or only one language');
      return;
    }
    
    // Skip initial watch (oldVal is undefined)
    if (!oldVal) {
      console.log('[Auto-Translate-Services] Initial watch, skipping');
      return;
    }
    
    // Skip if length and content haven't changed
    if (oldVal.defaultLangId === newVal.defaultLangId && 
        oldVal.length === newVal.length && 
        JSON.stringify(oldVal.services) === JSON.stringify(newVal.services)) {
      console.log('[Auto-Translate-Services] Values unchanged, skipping');
      return;
    }
    
    const defaultLang = availableLanguages.value.find(l => l.id === newVal.defaultLangId);
    if (!defaultLang) {
      console.log('[Auto-Translate-Services] Default language not found');
      return;
    }
    
    const otherLanguages = availableLanguages.value.filter(l => l.id !== newVal.defaultLangId);
    if (otherLanguages.length === 0) {
      console.log('[Auto-Translate-Services] No other languages to translate to');
      return;
    }
    
    // Clear previous timeout
    if (servicesTranslationTimeout) {
      clearTimeout(servicesTranslationTimeout);
    }
    
    // Debounce: wait a bit before translating
    servicesTranslationTimeout = setTimeout(async () => {
      const finalServices = form.translations[newVal.defaultLangId]?.excludedServices || [];
      console.log(`[Auto-Translate-Services] Debounce completed - Final excluded services:`, finalServices);
      
      if (finalServices.length === 0) {
        console.log('[Auto-Translate-Services] No excluded services to translate');
        return;
      }
      
      translating.value = true;
      try {
        for (const targetLang of otherLanguages) {
          if (!form.translations[targetLang.id]) {
            form.translations[targetLang.id] = {
              title: '',
              slug: '',
              description: '',
              includedServices: [],
              excludedServices: [],
              infoItems: [],
            };
          }
          
          // Ensure array has same length
          while (form.translations[targetLang.id].excludedServices.length < finalServices.length) {
            form.translations[targetLang.id].excludedServices.push('');
          }
          while (form.translations[targetLang.id].excludedServices.length > finalServices.length) {
            form.translations[targetLang.id].excludedServices.pop();
          }
          
          // Translate each service (only if it has content and target is empty or different)
          for (let i = 0; i < finalServices.length; i++) {
            if (finalServices[i] && finalServices[i].trim()) {
              const currentTarget = form.translations[targetLang.id].excludedServices[i] || '';
              // Only translate if target is empty or significantly different
              if (!currentTarget.trim() || currentTarget.trim() !== finalServices[i].trim()) {
                try {
                  console.log(`[Auto-Translate-Services] Translating excluded service ${i} from ${defaultLang.code} to ${targetLang.code}:`, finalServices[i]);
                  const translated = await translateText(finalServices[i], targetLang.code, defaultLang.code);
                  console.log(`[Auto-Translate-Services] Translated:`, translated);
                  form.translations[targetLang.id].excludedServices[i] = translated;
                } catch (error) {
                  console.error(`[Auto-Translate-Services] Translation error for excluded service ${i}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[Auto-Translate-Services] Auto-translation error for excluded services:', error);
      } finally {
        translating.value = false;
      }
    }, 1500);
  },
  { deep: true, immediate: false }
);

// Watch info items - watch the array directly
watch(
  () => {
    const defaultLangId = form.defaultLanguageId;
    if (!defaultLangId) return { defaultLangId: null, items: [] };
    const translation = form.translations[defaultLangId];
    if (!translation) return { defaultLangId: null, items: [] };
    // Return array length and a string representation to detect changes
    return {
      defaultLangId,
      length: translation.infoItems?.length || 0,
      items: [...(translation.infoItems || [])], // Create a copy to trigger reactivity
    };
  },
  async (newVal, oldVal) => {
    console.log('[Auto-Translate-InfoItems] Watch triggered', { newVal, oldVal });
    
    if (!newVal || !newVal.defaultLangId || availableLanguages.value.length <= 1) {
      console.log('[Auto-Translate-InfoItems] Skipping - no default lang or only one language');
      return;
    }
    
    // Skip initial watch (oldVal is undefined)
    if (!oldVal) {
      console.log('[Auto-Translate-InfoItems] Initial watch, skipping');
      return;
    }
    
    // Skip if length and content haven't changed
    if (oldVal.defaultLangId === newVal.defaultLangId && 
        oldVal.length === newVal.length && 
        JSON.stringify(oldVal.items) === JSON.stringify(newVal.items)) {
      console.log('[Auto-Translate-InfoItems] Values unchanged, skipping');
      return;
    }
    
    const defaultLang = availableLanguages.value.find(l => l.id === newVal.defaultLangId);
    if (!defaultLang) {
      console.log('[Auto-Translate-InfoItems] Default language not found');
      return;
    }
    
    const otherLanguages = availableLanguages.value.filter(l => l.id !== newVal.defaultLangId);
    if (otherLanguages.length === 0) {
      console.log('[Auto-Translate-InfoItems] No other languages to translate to');
      return;
    }
    
    // Clear previous timeout
    if (infoItemsTranslationTimeout) {
      clearTimeout(infoItemsTranslationTimeout);
    }
    
    // Debounce: wait a bit before translating
    infoItemsTranslationTimeout = setTimeout(async () => {
      const finalItems = form.translations[newVal.defaultLangId]?.infoItems || [];
      console.log(`[Auto-Translate-InfoItems] Debounce completed - Final items:`, finalItems);
      
      if (finalItems.length === 0) {
        console.log('[Auto-Translate-InfoItems] No items to translate');
        return;
      }
      
      translating.value = true;
      try {
        for (const targetLang of otherLanguages) {
          if (!form.translations[targetLang.id]) {
            form.translations[targetLang.id] = {
              title: '',
              slug: '',
              description: '',
              includedServices: [],
              excludedServices: [],
              infoItems: [],
            };
          }
          
          // Ensure array has same length
          while (form.translations[targetLang.id].infoItems.length < finalItems.length) {
            form.translations[targetLang.id].infoItems.push('');
          }
          while (form.translations[targetLang.id].infoItems.length > finalItems.length) {
            form.translations[targetLang.id].infoItems.pop();
          }
          
          // Translate each item (only if it has content and target is empty or different)
          for (let i = 0; i < finalItems.length; i++) {
            if (finalItems[i] && finalItems[i].trim()) {
              const currentTarget = form.translations[targetLang.id].infoItems[i] || '';
              // Only translate if target is empty or significantly different
              if (!currentTarget.trim() || currentTarget.trim() !== finalItems[i].trim()) {
                try {
                  console.log(`[Auto-Translate-InfoItems] Translating info item ${i} from ${defaultLang.code} to ${targetLang.code}:`, finalItems[i]);
                  const translated = await translateText(finalItems[i], targetLang.code, defaultLang.code);
                  console.log(`[Auto-Translate-InfoItems] Translated:`, translated);
                  form.translations[targetLang.id].infoItems[i] = translated;
                } catch (error) {
                  console.error(`[Auto-Translate-InfoItems] Translation error for info item ${i}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[Auto-Translate-InfoItems] Auto-translation error for info items:', error);
      } finally {
        translating.value = false;
      }
    }, 1500);
  },
  { deep: true, immediate: false }
);

// Watch feature form default language translation for auto-translation
watch(
  () => {
    const defaultLangId = featureDefaultLanguageId.value;
    if (!defaultLangId) return { defaultLangId: null, text: '' };
    const translation = featureForm.translations[defaultLangId];
    return {
      defaultLangId,
      text: translation || '',
    };
  },
  async (newVal, oldVal) => {
    console.log('[Auto-Translate-Feature] Watch callback triggered', { 
      newVal: newVal ? { defaultLangId: newVal.defaultLangId, text: newVal.text } : null,
      oldVal: oldVal ? { defaultLangId: oldVal.defaultLangId, text: oldVal.text } : null
    });
    
    if (!newVal || !newVal.defaultLangId) {
      console.log('[Auto-Translate-Feature] No default language');
      return;
    }
    
    if (availableLanguages.value.length <= 1) {
      console.log('[Auto-Translate-Feature] Skipping - only one language available');
      return;
    }
    
    // Skip if value hasn't actually changed
    if (oldVal && oldVal.defaultLangId === newVal.defaultLangId && oldVal.text === newVal.text) {
      console.log('[Auto-Translate-Feature] Values unchanged, skipping');
      return;
    }
    
    const currentText = newVal.text || '';
    
    console.log(`[Auto-Translate-Feature] Processing - Text: "${currentText}"`);
    
    // Skip if empty
    if (!currentText.trim()) {
      console.log('[Auto-Translate-Feature] Text is empty, skipping');
      return;
    }
    
    await triggerFeatureAutoTranslation(newVal.defaultLangId);
  },
  { deep: true, immediate: false }
);

const handleCreate = async () => {
  if (!auth.tenant) return;
  const validation = await formRef.value?.validate();
  if (!validation?.valid) return;

  // Validate required fields
  if (!form.destinationId || availableLanguages.value.length === 0) {
    alert('Lütfen tüm zorunlu alanları doldurun.');
    return;
  }

  // Validate translations - check all available languages
  const missingTranslations = availableLanguages.value.filter(lang => !form.translations[lang.id]?.title);
  if (missingTranslations.length > 0) {
    alert('Lütfen tüm diller için tur adı girin.');
    formTab.value = 'basic';
    return;
  }

  loading.value = true;
  try {
    // Prepare translations - use all available languages
    const translations = availableLanguages.value.map(lang => ({
      languageId: lang.id,
      title: form.translations[lang.id].title,
      slug: form.translations[lang.id].slug || slugify(form.translations[lang.id].title),
      description: form.translations[lang.id].description || undefined,
      includedServices: form.translations[lang.id].includedServices.filter(s => s.trim()),
      excludedServices: form.translations[lang.id].excludedServices.filter(s => s.trim()),
    }));
    
    // Use default language slug for main tour slug
    const defaultTranslation = translations.find(t => t.languageId === form.defaultLanguageId);
    const mainSlug = defaultTranslation?.slug || slugify(defaultTranslation?.title || '');

    // Prepare info items
    const infoItems: Array<{ languageId: string; text: string; order: number }> = [];
    availableLanguages.value.forEach(lang => {
      form.translations[lang.id]?.infoItems?.forEach((text, index) => {
        if (text.trim()) {
          infoItems.push({
            languageId: lang.id,
            text: text.trim(),
            order: index,
          });
        }
      });
    });

    // Prepare images
    const images = form.images
      .filter(img => img.url.trim())
      .map((img, index) => ({
        url: img.url.trim(),
        alt: img.alt || undefined,
        order: index,
        isPrimary: img.isPrimary,
      }));

    // Prepare time slots
    const timeSlots = form.timeSlots
      .filter(slot => slot.startTime && slot.endTime)
      .map((slot, index) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        order: index,
      }));

    // Prepare pricing
    const pricing = form.pricing
      .filter(p => p.price > 0)
      .map(p => ({
        type: p.type,
        price: p.price,
        currencyCode: p.currencyCode || form.currencyCode,
        description: p.description || undefined,
      }));

    // Prepare tags
    const tags = form.tags
      ? form.tags.split(',').map(t => t.trim()).filter(t => t)
      : undefined;

    const payload: any = {
      tenantId: auth.tenant.id,
      destinationId: form.destinationId,
      slug: mainSlug,
      languageIds: availableLanguages.value.map(l => l.id),
      defaultLanguageId: form.defaultLanguageId || availableLanguages.value[0]?.id,
      translations,
      currencyCode: form.currencyCode,
    };

    if (form.duration) payload.duration = form.duration;
    if (form.durationUnit) payload.durationUnit = form.durationUnit;
    if (form.maxCapacity !== undefined) payload.maxCapacity = form.maxCapacity;
    if (form.days.length > 0) payload.days = form.days;
    if (form.video) payload.video = form.video;
    if (form.featureIds.length > 0) payload.featureIds = form.featureIds;
    if (infoItems.length > 0) payload.infoItems = infoItems;
    if (images.length > 0) payload.images = images;
    if (timeSlots.length > 0) payload.timeSlots = timeSlots;
    if (pricing.length > 0) payload.pricing = pricing;
    if (tags && tags.length > 0) payload.tags = tags;

    if (editingTour.value) {
      await http.put(`/tours/${editingTour.value.id}`, payload);
    } else {
      await http.post('/tours', payload);
    }
    
    closeTourDialog();
    await loadTours();
  } catch (error: any) {
    console.error('Failed to create tour:', error);
    alert(error.response?.data?.message || 'Tur oluşturulamadı');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (isTourTenant.value) {
    await Promise.all([
      loadLanguages(),
      loadDestinations(),
      loadTourFeatures(),
      loadTours(),
    ]);
    
    // Check if there's an edit query parameter
    const route = useRoute();
    const editId = route.query.edit as string;
    if (editId) {
      const tourToEdit = tours.value.find(t => t.id === editId);
      if (tourToEdit) {
        editTour(tourToEdit);
      }
    }
  }
});
</script>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  padding: 8px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 100px;
}

.icon-item:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.icon-selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.1);
  box-shadow: 0 2px 4px rgba(var(--v-theme-primary), 0.3);
}

.icon-item .text-caption {
  word-break: break-all;
  font-size: 10px;
  line-height: 1.2;
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.6);
}
</style>
