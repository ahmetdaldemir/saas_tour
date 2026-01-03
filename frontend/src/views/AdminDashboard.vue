<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div>
              <v-icon icon="mdi-monitor-dashboard" class="mr-2" />
              <span class="text-h5">Admin Dashboard</span>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="refreshAll"
              :loading="loading"
            >
              Yenile
            </v-btn>
          </v-card-title>
          <v-divider />
          
          <v-tabs v-model="activeTab" class="px-4">
            <v-tab value="services">
              <v-icon start icon="mdi-server" />
              Servisler
            </v-tab>
            <v-tab value="tenants">
              <v-icon start icon="mdi-office-building" />
              Tenants
            </v-tab>
            <v-tab value="stats">
              <v-icon start icon="mdi-chart-line" />
              Sistem İstatistikleri
            </v-tab>
            <v-tab value="email-test">
              <v-icon start icon="mdi-email-send" />
              Email Test
            </v-tab>
            <v-tab value="advertisement">
              <v-icon start icon="mdi-bullhorn" />
              Reklam Alanı
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Servisler Tab -->
            <v-window-item value="services">
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4">
                    <v-card color="primary" variant="tonal">
                      <v-card-text>
                        <div class="text-h6">Toplam Servis</div>
                        <div class="text-h4">{{ servicesStats.total || 0 }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-card color="success" variant="tonal">
                      <v-card-text>
                        <div class="text-h6">Çalışan</div>
                        <div class="text-h4">{{ servicesStats.running || 0 }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-card color="error" variant="tonal">
                      <v-card-text>
                        <div class="text-h6">Durdurulmuş</div>
                        <div class="text-h4">{{ (servicesStats.total || 0) - (servicesStats.running || 0) }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-data-table
                  :headers="serviceHeaders"
                  :items="services"
                  :loading="loadingServices"
                  class="mt-4"
                >
                  <template #item.status="{ item }">
                    <v-chip
                      :color="item.isRunning ? 'success' : 'error'"
                      size="small"
                    >
                      {{ item.status }}
                    </v-chip>
                  </template>
                  <template #item.actions="{ item }">
                    <v-btn
                      icon
                      size="small"
                      :color="item.isRunning ? 'warning' : 'success'"
                      @click="toggleService(item.name)"
                      :loading="item.loading"
                    >
                      <v-icon>
                        {{ item.isRunning ? 'mdi-pause' : 'mdi-play' }}
                      </v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      color="primary"
                      @click="restartService(item.name)"
                      :loading="item.loading"
                      class="ml-2"
                    >
                      <v-icon>mdi-restart</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      color="info"
                      @click="viewLogs(item.name)"
                      class="ml-2"
                    >
                      <v-icon>mdi-file-document-outline</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-window-item>

            <!-- Tenants Tab -->
            <v-window-item value="tenants">
              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h6">Tenant Yönetimi</div>
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="showTenantDialog = true"
                  >
                    Yeni Tenant Ekle
                  </v-btn>
                </div>

                <v-data-table
                  :headers="tenantHeaders"
                  :items="tenants"
                  :loading="loadingTenants"
                >
                  <template #item.isActive="{ item }">
                    <v-chip
                      :color="item.isActive ? 'success' : 'error'"
                      size="small"
                    >
                      {{ item.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </template>
                  <template #item.category="{ item }">
                    <v-chip size="small" variant="outlined">
                      {{ item.category }}
                    </v-chip>
                  </template>
                  <template #item.stats="{ item }">
                    <div class="text-body-2">
                      <div>Rezervasyonlar: {{ item.stats.reservations }}</div>
                      <div>Müşteriler: {{ item.stats.customers }}</div>
                    </div>
                  </template>
                  <template #item.features="{ item }">
                    <div class="d-flex gap-1">
                      <v-chip
                        v-if="item.features?.finance"
                        size="x-small"
                        color="success"
                        variant="flat"
                      >
                        Finance
                      </v-chip>
                      <v-chip
                        v-if="item.features?.vehicleTracking"
                        size="x-small"
                        color="info"
                        variant="flat"
                      >
                        Vehicle
                      </v-chip>
                      <v-chip
                        v-if="item.features?.chat"
                        size="x-small"
                        color="purple"
                        variant="flat"
                      >
                        Chat
                      </v-chip>
                      <v-chip
                        v-if="item.features?.ai"
                        size="x-small"
                        color="orange"
                        variant="flat"
                      >
                        AI
                      </v-chip>
                    </div>
                  </template>
                  <template #item.actions="{ item }">
                    <v-btn
                      icon
                      size="small"
                      color="info"
                      @click="viewTenantDetails(item.id)"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      color="primary"
                      @click="viewTenantActivity(item.id)"
                      class="ml-2"
                    >
                      <v-icon>mdi-history</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      color="success"
                      @click="editTenantFeatures(item.id)"
                      class="ml-2"
                    >
                      <v-icon>mdi-cog</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-window-item>

            <!-- Stats Tab -->
            <v-window-item value="stats">
              <v-card-text>
                <!-- Servis Grafikleri -->
                <v-row v-if="servicesWithStats.length > 0">
                  <v-col
                    v-for="service in servicesWithStats"
                    :key="service.name"
                    cols="12"
                    md="6"
                    lg="6"
                  >
                    <v-card variant="outlined" class="service-stats-card">
                      <v-card-title class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                          <v-chip
                            :color="service.isRunning ? 'success' : 'error'"
                            size="small"
                            class="mr-2"
                          >
                            {{ service.isRunning ? 'Çalışıyor' : 'Durduruldu' }}
                          </v-chip>
                          <span class="text-h6">{{ service.name }}</span>
                        </div>
                        <v-icon icon="mdi-server" />
                      </v-card-title>
                      <v-divider />
                      <v-card-text>
                        <!-- CPU Kullanımı Grafiği -->
                        <div class="mb-4">
                          <div class="d-flex justify-space-between align-center mb-2">
                            <span class="text-subtitle-2 font-weight-bold">CPU Kullanımı</span>
                            <span class="text-h6" :class="getCpuTextColor(service.currentCpu)">
                              {{ service.currentCpu }}%
                            </span>
                          </div>
                          <div style="height: 150px; position: relative;">
                            <Line
                              :data="getCpuChartData(service)"
                              :options="cpuChartOptions"
                              v-if="service.cpuHistory.length > 0"
                            />
                            <div v-else class="d-flex align-center justify-center" style="height: 100%">
                              <span class="text-medium-emphasis">Veri toplanıyor...</span>
                            </div>
                          </div>
                        </div>

                        <!-- RAM Kullanımı Grafiği -->
                        <div class="mb-4">
                          <div class="d-flex justify-space-between align-center mb-2">
                            <span class="text-subtitle-2 font-weight-bold">RAM Kullanımı</span>
                            <span class="text-h6" :class="getMemoryTextColor(service.currentMemory)">
                              {{ service.currentMemory }}%
                            </span>
                          </div>
                          <div style="height: 150px; position: relative;">
                            <Line
                              :data="getMemoryChartData(service)"
                              :options="memoryChartOptions"
                              v-if="service.memoryHistory.length > 0"
                            />
                            <div v-else class="d-flex align-center justify-center" style="height: 100%">
                              <span class="text-medium-emphasis">Veri toplanıyor...</span>
                            </div>
                          </div>
                        </div>

                        <!-- Detaylı Bilgiler -->
                        <v-expansion-panels variant="accordion" class="mt-2">
                          <v-expansion-panel>
                            <v-expansion-panel-title>
                              <v-icon icon="mdi-information" class="mr-2" />
                              Detaylı Bilgiler
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                              <v-row dense>
                                <v-col cols="6">
                                  <div class="text-caption text-medium-emphasis">Bellek Kullanımı</div>
                                  <div class="text-body-1 font-weight-medium">
                                    {{ service.stats?.memoryUsage || 'N/A' }}
                                  </div>
                                </v-col>
                                <v-col cols="6">
                                  <div class="text-caption text-medium-emphasis">Network I/O</div>
                                  <div class="text-body-1 font-weight-medium">
                                    {{ service.stats?.networkIO || 'N/A' }}
                                  </div>
                                </v-col>
                                <v-col cols="6">
                                  <div class="text-caption text-medium-emphasis">Block I/O</div>
                                  <div class="text-body-1 font-weight-medium">
                                    {{ service.stats?.blockIO || 'N/A' }}
                                  </div>
                                </v-col>
                                <v-col cols="6">
                                  <div class="text-caption text-medium-emphasis">Durum</div>
                                  <div class="text-body-1 font-weight-medium">
                                    {{ service.status || 'N/A' }}
                                  </div>
                                </v-col>
                              </v-row>
                            </v-expansion-panel-text>
                          </v-expansion-panel>
                        </v-expansion-panels>

                        <!-- Health Status Indicator -->
                        <div class="mt-3 pt-3" style="border-top: 1px solid rgba(0,0,0,0.12);">
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-caption text-medium-emphasis">Sağlık Durumu</span>
                            <v-chip
                              :color="getHealthStatusColor(service)"
                              size="small"
                              variant="flat"
                            >
                              {{ getHealthStatusText(service) }}
                            </v-chip>
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Servis bulunamadığında -->
                <div v-else-if="!loadingStats && servicesWithStats.length === 0" class="text-center py-8">
                  <v-icon icon="mdi-server-off" size="64" color="grey" />
                  <p class="text-medium-emphasis mt-4">Çalışan servis bulunamadı</p>
                </div>

                <!-- Yükleniyor -->
                <div v-else class="text-center py-8">
                  <v-progress-circular indeterminate color="primary" />
                  <p class="text-medium-emphasis mt-4">Servis istatistikleri yükleniyor...</p>
                </div>
              </v-card-text>
            </v-window-item>

            <!-- Email Test Tab -->
            <v-window-item value="email-test">
              <v-card-text>
                <v-card variant="outlined">
                  <v-card-title>
                    <v-icon icon="mdi-email-send" class="mr-2" />
                    Email Test Gönder
                  </v-card-title>
                  <v-divider />
                  <v-card-text>
                    <v-form ref="emailTestFormRef" v-model="emailTestFormValid">
                      <v-text-field
                        v-model="emailTestForm.email"
                        label="E-posta Adresi"
                        type="email"
                        prepend-inner-icon="mdi-email"
                        required
                        :rules="[
                          v => !!v || 'E-posta adresi gereklidir',
                          v => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz'
                        ]"
                        placeholder="test@example.com"
                      />
                      <v-alert
                        v-if="emailTestResult.message"
                        :type="emailTestResult.success ? 'success' : 'error'"
                        class="mt-4"
                        closable
                        @click:close="emailTestResult.message = ''"
                      >
                        {{ emailTestResult.message }}
                      </v-alert>
                    </v-form>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-send"
                      @click="sendTestEmail"
                      :loading="sendingTestEmail"
                      :disabled="!emailTestFormValid"
                    >
                      Mail Gönder
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Logs Dialog -->
    <v-dialog v-model="showLogsDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title>
          {{ selectedServiceName }} - Logs
        </v-card-title>
        <v-divider />
        <v-card-text>
          <pre class="log-content">{{ serviceLogs }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showLogsDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tenant Dialog -->
    <v-dialog v-model="showTenantDialog" max-width="600">
      <v-card>
        <v-card-title>Yeni Tenant Ekle</v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="tenantFormRef" v-model="tenantFormValid">
            <v-text-field
              v-model="tenantForm.name"
              label="Tenant Adı"
              required
              :rules="[v => !!v || 'Tenant adı gereklidir']"
            />
            <v-text-field
              v-model="tenantForm.slug"
              label="Slug"
              required
              :rules="[v => !!v || 'Slug gereklidir']"
            />
            <v-select
              v-model="tenantForm.category"
              :items="categoryOptions"
              label="Kategori"
              required
            />
            <v-text-field
              v-model="tenantForm.supportEmail"
              label="Destek Email"
              type="email"
            />
            <v-select
              v-model="tenantForm.defaultLanguage"
              :items="languageOptions"
              label="Varsayılan Dil"
            />
            <v-switch
              v-model="tenantForm.isActive"
              label="Aktif"
              color="success"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showTenantDialog = false">İptal</v-btn>
          <v-btn
            color="primary"
            @click="createTenant"
            :loading="creatingTenant"
            :disabled="!tenantFormValid"
          >
            Oluştur
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tenant Details Dialog -->
    <v-dialog v-model="showTenantDetailsDialog" max-width="1000" scrollable>
      <v-card v-if="selectedTenant">
        <v-card-title>
          {{ selectedTenant.tenant.name }} - Detaylar
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Bilgiler</v-card-title>
                <v-card-text>
                  <div><strong>Slug:</strong> {{ selectedTenant.tenant.slug }}</div>
                  <div><strong>Kategori:</strong> {{ selectedTenant.tenant.category }}</div>
                  <div><strong>Durum:</strong> 
                    <v-chip :color="selectedTenant.tenant.isActive ? 'success' : 'error'" size="small">
                      {{ selectedTenant.tenant.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>İstatistikler</v-card-title>
                <v-card-text>
                  <div><strong>Rezervasyonlar:</strong> {{ selectedTenant.stats.reservations }}</div>
                  <div><strong>Müşteriler:</strong> {{ selectedTenant.stats.customers }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-card class="mt-4" variant="outlined">
            <v-card-title>Son Rezervasyonlar</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="reservation in selectedTenant.recentReservations"
                  :key="reservation.id"
                >
                  <v-list-item-title>{{ reservation.reference }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ reservation.customerName }} - {{ reservation.status }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showTenantDetailsDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tenant Activity Dialog -->
    <v-dialog v-model="showActivityDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title>
          Tenant Aktivite Logları
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-timeline v-if="tenantActivity.activities">
            <v-timeline-item
              v-for="activity in tenantActivity.activities"
              :key="`${activity.type}-${activity.entityId}`"
              :dot-color="activity.type === 'reservation' ? 'primary' : 'success'"
            >
              <template #icon>
                <v-icon>
                  {{ activity.type === 'reservation' ? 'mdi-calendar' : 'mdi-account' }}
                </v-icon>
              </template>
              <div>
                <strong>{{ activity.description }}</strong>
                <div class="text-caption">{{ formatDate(activity.timestamp) }}</div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showActivityDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tenant Features Dialog -->
    <v-dialog v-model="showFeaturesDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-cog" class="mr-2" />
          Tenant Özellikleri
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            Tenant için özellikleri açıp kapatabilirsiniz. Bu özellikler SaaS kullanıcılarının hangi modüllere erişebileceğini belirler.
          </v-alert>
          
          <v-list>
            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-cash" color="success" />
              </template>
              <v-list-item-title>On Muhasebe (Finance)</v-list-item-title>
              <v-list-item-subtitle>Finans modülüne erişim</v-list-item-subtitle>
              <template #append>
                <v-switch
                  v-model="tenantFeatures.finance"
                  color="success"
                  hide-details
                />
              </template>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-car" color="info" />
              </template>
              <v-list-item-title>Araç Takip Sistemi (Vehicle Tracking)</v-list-item-title>
              <v-list-item-subtitle>Araç takip modülüne erişim</v-list-item-subtitle>
              <template #append>
                <v-switch
                  v-model="tenantFeatures.vehicleTracking"
                  color="info"
                  hide-details
                />
              </template>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-message-text" color="purple" />
              </template>
              <v-list-item-title>Chat Sistemi</v-list-item-title>
              <v-list-item-subtitle>Chat modülüne erişim</v-list-item-subtitle>
              <template #append>
                <v-switch
                  v-model="tenantFeatures.chat"
                  color="purple"
                  hide-details
                />
              </template>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-robot" color="orange" />
              </template>
              <v-list-item-title>Yapay Zeka (AI)</v-list-item-title>
              <v-list-item-subtitle>AI içerik üretimi özelliği</v-list-item-subtitle>
              <template #append>
                <v-switch
                  v-model="tenantFeatures.ai"
                  color="orange"
                  hide-details
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showFeaturesDialog = false">İptal</v-btn>
          <v-btn
            color="primary"
            @click="saveTenantFeatures"
            :loading="savingFeatures"
          >
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { http } from '../modules/http';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const activeTab = ref('services');
const loading = ref(false);
const loadingServices = ref(false);
const loadingTenants = ref(false);
const loadingStats = ref(false);
const creatingTenant = ref(false);
const sendingTestEmail = ref(false);

const services = ref<any[]>([]);
const servicesStats = ref({ total: 0, running: 0 });
const tenants = ref<any[]>([]);
const systemStats = ref<any[]>([]);
const serviceLogs = ref('');
const selectedServiceName = ref('');
const showLogsDialog = ref(false);
const showTenantDialog = ref(false);
const showTenantDetailsDialog = ref(false);
const showActivityDialog = ref(false);
const showFeaturesDialog = ref(false);
const selectedTenant = ref<any>(null);
const selectedTenantId = ref<string>('');
const tenantActivity = ref<any>({ activities: [] });
const tenantFeatures = ref({
  finance: false,
  vehicleTracking: false,
  chat: false,
  ai: false,
});
const savingFeatures = ref(false);

// Servis istatistikleri için geçmiş veriler (her servis için)
interface ServiceStatsHistory {
  name: string;
  isRunning: boolean;
  status: string;
  currentCpu: number;
  currentMemory: number;
  cpuHistory: { time: string; value: number }[];
  memoryHistory: { time: string; value: number }[];
  stats?: {
    memoryUsage: string;
    networkIO: string;
    blockIO: string;
  };
}

const servicesWithStats = ref<ServiceStatsHistory[]>([]);
let statsInterval: NodeJS.Timeout | null = null;
const maxHistoryPoints = 30; // Son 30 veri noktası

const tenantFormRef = ref();
const tenantFormValid = ref(false);
const tenantForm = ref({
  name: '',
  slug: '',
  category: 'tour',
});

const emailTestFormRef = ref();
const emailTestFormValid = ref(false);
const emailTestForm = ref({
  email: '',
});

const emailTestResult = ref({
  success: false,
  message: '',
  supportEmail: '',
  defaultLanguage: 'tr',
  isActive: true,
});

const categoryOptions = [
  { title: 'Tur', value: 'tour' },
  { title: 'Rent a Car', value: 'rentacar' },
];

const languageOptions = [
  { title: 'Türkçe', value: 'tr' },
  { title: 'English', value: 'en' },
];

const serviceHeaders = [
  { title: 'Servis Adı', key: 'name' },
  { title: 'Durum', key: 'status' },
  { title: 'Portlar', key: 'ports' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const tenantHeaders = [
  { title: 'Ad', key: 'name' },
  { title: 'Slug', key: 'slug' },
  { title: 'Kategori', key: 'category' },
  { title: 'Durum', key: 'isActive' },
  { title: 'Özellikler', key: 'features' },
  { title: 'İstatistikler', key: 'stats' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const statsHeaders = [
  { title: 'Servis', key: 'name' },
  { title: 'CPU', key: 'cpu' },
  { title: 'Bellek Kullanımı', key: 'memoryUsage' },
  { title: 'Bellek %', key: 'memoryPercent' },
  { title: 'Network I/O', key: 'networkIO' },
  { title: 'Block I/O', key: 'blockIO' },
];

const loadServices = async () => {
  loadingServices.value = true;
  try {
    const { data } = await http.get('/admin/monitoring/services');
    services.value = data.services.map((s: any) => ({ ...s, loading: false }));
    servicesStats.value = {
      total: data.total,
      running: data.running,
    };
  } catch (error) {
    console.error('Failed to load services:', error);
  } finally {
    loadingServices.value = false;
  }
};

const loadTenants = async () => {
  loadingTenants.value = true;
  try {
    const { data } = await http.get('/admin/tenants');
    tenants.value = data;
  } catch (error) {
    console.error('Failed to load tenants:', error);
  } finally {
    loadingTenants.value = false;
  }
};

const loadStats = async () => {
  loadingStats.value = true;
  try {
    const { data } = await http.get('/admin/monitoring/stats');
    systemStats.value = data.stats;
    
    // Servis istatistiklerini güncelle
    const now = new Date().toLocaleTimeString('tr-TR');
    
    data.stats.forEach((stat: any) => {
      const existingService = servicesWithStats.value.find(s => s.name === stat.name);
      const cpuValue = parseFloat(stat.cpu.replace('%', '')) || 0;
      const memoryValue = parseFloat(stat.memoryPercent.replace('%', '')) || 0;
      
      if (existingService) {
        // Mevcut servis - geçmişe ekle
        existingService.currentCpu = cpuValue;
        existingService.currentMemory = memoryValue;
        existingService.stats = {
          memoryUsage: stat.memoryUsage,
          networkIO: stat.networkIO,
          blockIO: stat.blockIO,
        };
        
        // CPU geçmişi
        existingService.cpuHistory.push({ time: now, value: cpuValue });
        if (existingService.cpuHistory.length > maxHistoryPoints) {
          existingService.cpuHistory.shift();
        }
        
        // Memory geçmişi
        existingService.memoryHistory.push({ time: now, value: memoryValue });
        if (existingService.memoryHistory.length > maxHistoryPoints) {
          existingService.memoryHistory.shift();
        }
        
        // Running durumunu güncelle
        const service = services.value.find(s => s.name === stat.name);
        if (service) {
          existingService.isRunning = service.isRunning;
          existingService.status = service.status;
        }
      } else {
        // Yeni servis - başlat
        const service = services.value.find(s => s.name === stat.name);
        servicesWithStats.value.push({
          name: stat.name,
          isRunning: service?.isRunning || false,
          status: service?.status || 'Unknown',
          currentCpu: cpuValue,
          currentMemory: memoryValue,
          cpuHistory: [{ time: now, value: cpuValue }],
          memoryHistory: [{ time: now, value: memoryValue }],
          stats: {
            memoryUsage: stat.memoryUsage,
            networkIO: stat.networkIO,
            blockIO: stat.blockIO,
          },
        });
      }
    });
    
    // Artık çalışmayan servisleri kaldır (opsiyonel - veya durumlarını güncelle)
    servicesWithStats.value = servicesWithStats.value.filter(serviceStat => {
      return data.stats.some((stat: any) => stat.name === serviceStat.name);
    });
  } catch (error) {
    console.error('Failed to load stats:', error);
  } finally {
    loadingStats.value = false;
  }
};

const toggleService = async (serviceName: string) => {
  const service = services.value.find(s => s.name === serviceName);
  if (!service) return;

  service.loading = true;
  try {
    const action = service.isRunning ? 'stop' : 'start';
    await http.post(`/admin/monitoring/services/${serviceName}/${action}`);
    await loadServices();
  } catch (error) {
    console.error('Failed to toggle service:', error);
    alert('Servis işlemi başarısız oldu');
  } finally {
    service.loading = false;
  }
};

const restartService = async (serviceName: string) => {
  const service = services.value.find(s => s.name === serviceName);
  if (!service) return;

  service.loading = true;
  try {
    await http.post(`/admin/monitoring/services/${serviceName}/restart`);
    await loadServices();
  } catch (error) {
    console.error('Failed to restart service:', error);
    alert('Servis yeniden başlatma başarısız oldu');
  } finally {
    service.loading = false;
  }
};

const viewLogs = async (serviceName: string) => {
  selectedServiceName.value = serviceName;
  showLogsDialog.value = true;
  try {
    const { data } = await http.get(`/admin/monitoring/services/${serviceName}/logs`);
    serviceLogs.value = data.logs;
  } catch (error) {
    console.error('Failed to load logs:', error);
    serviceLogs.value = 'Loglar yüklenemedi';
  }
};

const createTenant = async () => {
  creatingTenant.value = true;
  try {
    await http.post('/tenants', tenantForm.value);
    showTenantDialog.value = false;
    tenantForm.value = {
      name: '',
      slug: '',
      category: 'tour',
      supportEmail: '',
      defaultLanguage: 'tr',
      isActive: true,
    };
    await loadTenants();
  } catch (error: any) {
    console.error('Failed to create tenant:', error);
    alert(error.response?.data?.message || 'Tenant oluşturulamadı');
  } finally {
    creatingTenant.value = false;
  }
};

const viewTenantDetails = async (tenantId: string) => {
  try {
    const { data } = await http.get(`/admin/tenants/${tenantId}`);
    selectedTenant.value = data;
    showTenantDetailsDialog.value = true;
  } catch (error) {
    console.error('Failed to load tenant details:', error);
  }
};

const viewTenantActivity = async (tenantId: string) => {
  try {
    const { data } = await http.get(`/admin/tenants/${tenantId}/activity`);
    tenantActivity.value = data;
    showActivityDialog.value = true;
  } catch (error) {
    console.error('Failed to load tenant activity:', error);
  }
};

const editTenantFeatures = async (tenantId: string) => {
  selectedTenantId.value = tenantId;
  try {
    const { data } = await http.get(`/admin/tenants/${tenantId}/features`);
    tenantFeatures.value = {
      finance: data.finance || false,
      vehicleTracking: data.vehicleTracking || false,
      chat: data.chat || false,
      ai: data.ai || false,
    };
    showFeaturesDialog.value = true;
  } catch (error) {
    console.error('Failed to load tenant features:', error);
    alert('Özellikler yüklenemedi');
  }
};

const saveTenantFeatures = async () => {
  savingFeatures.value = true;
  try {
    await http.put(`/admin/tenants/${selectedTenantId.value}/features`, {
      features: tenantFeatures.value,
    });
    showFeaturesDialog.value = false;
    await loadTenants(); // Refresh tenant list
    alert('Özellikler başarıyla güncellendi');
  } catch (error: any) {
    console.error('Failed to save tenant features:', error);
    alert(error.response?.data?.message || 'Özellikler kaydedilemedi');
  } finally {
    savingFeatures.value = false;
  }
};

const sendTestEmail = async () => {
  sendingTestEmail.value = true;
  emailTestResult.value.message = '';
  
  try {
    const { data } = await http.post('/admin/monitoring/test-email', {
      email: emailTestForm.value.email,
    });
    
    emailTestResult.value = {
      success: true,
      message: `Test email başarıyla gönderildi! (${data.data.to})`,
    };
    
    // Formu temizle
    emailTestForm.value.email = '';
    emailTestFormValid.value = false;
  } catch (error: any) {
    console.error('Failed to send test email:', error);
    emailTestResult.value = {
      success: false,
      message: error.response?.data?.error?.message || error.response?.data?.message || 'Test email gönderilemedi',
    };
  } finally {
    sendingTestEmail.value = false;
  }
};

const refreshAll = async () => {
  loading.value = true;
  await Promise.all([
    loadServices(),
    loadTenants(),
    loadStats(),
  ]);
  loading.value = false;
};

const getCpuColor = (cpu: number) => {
  if (cpu > 80) return 'error';
  if (cpu > 50) return 'warning';
  return 'success';
};

const getMemoryColor = (mem: number) => {
  if (mem > 80) return 'error';
  if (mem > 50) return 'warning';
  return 'success';
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('tr-TR');
};

// Chart color helpers
const getCpuChartColor = (cpu: number): string => {
  if (cpu > 80) return '#f44336'; // red
  if (cpu > 50) return '#ff9800'; // orange
  return '#4caf50'; // green
};

const getMemoryChartColor = (mem: number): string => {
  if (mem > 80) return '#f44336'; // red
  if (mem > 50) return '#ff9800'; // orange
  return '#4caf50'; // green
};

// Chart data generators
const getCpuChartData = (service: ServiceStatsHistory) => {
  const color = getCpuChartColor(service.currentCpu);
  return {
    labels: service.cpuHistory.map(h => h.time),
    datasets: [
      {
        label: 'CPU %',
        data: service.cpuHistory.map(h => h.value),
        borderColor: color,
        backgroundColor: color + '33',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };
};

const getMemoryChartData = (service: ServiceStatsHistory) => {
  const color = getMemoryChartColor(service.currentMemory);
  return {
    labels: service.memoryHistory.map(h => h.time),
    datasets: [
      {
        label: 'RAM %',
        data: service.memoryHistory.map(h => h.value),
        borderColor: color,
        backgroundColor: color + '33',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };
};

const cpuChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function(value: any) {
          return value + '%';
        },
      },
    },
    x: {
      ticks: {
        maxTicksLimit: 10,
        callback: function(value: any, index: number, values: any[]) {
          // Her 3. etiketi göster
          if (index % Math.ceil(values.length / 10) === 0) {
            return values[index].label;
          }
          return '';
        },
      },
    },
  },
};

const memoryChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function(value: any) {
          return value + '%';
        },
      },
    },
    x: {
      ticks: {
        maxTicksLimit: 10,
        callback: function(value: any, index: number, values: any[]) {
          // Her 3. etiketi göster
          if (index % Math.ceil(values.length / 10) === 0) {
            return values[index].label;
          }
          return '';
        },
      },
    },
  },
};

const getCpuTextColor = (cpu: number) => {
  if (cpu > 80) return 'text-error';
  if (cpu > 50) return 'text-warning';
  return 'text-success';
};

const getMemoryTextColor = (memory: number) => {
  if (memory > 80) return 'text-error';
  if (memory > 50) return 'text-warning';
  return 'text-success';
};

const getHealthStatusColor = (service: ServiceStatsHistory): string => {
  if (!service.isRunning) return 'error';
  
  const cpu = service.currentCpu;
  const memory = service.currentMemory;
  
  if (cpu > 90 || memory > 90) return 'error';
  if (cpu > 70 || memory > 70) return 'warning';
  return 'success';
};

const getHealthStatusText = (service: ServiceStatsHistory): string => {
  if (!service.isRunning) return 'Durduruldu';
  
  const cpu = service.currentCpu;
  const memory = service.currentMemory;
  
  if (cpu > 90 || memory > 90) return 'Kritik';
  if (cpu > 70 || memory > 70) return 'Uyarı';
  return 'Sağlıklı';
};

onMounted(() => {
  refreshAll();
  
  // Auto-refresh every 30 seconds
  setInterval(() => {
    if (activeTab.value === 'services') loadServices();
    if (activeTab.value === 'tenants') loadTenants();
    if (activeTab.value === 'stats') loadStats();
  }, 30000);
  
  // Stats için daha sık güncelleme (her 5 saniyede bir)
  statsInterval = setInterval(() => {
    if (activeTab.value === 'stats') {
      loadStats();
    }
  }, 5000);
});

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval);
  }
});
</script>

<style scoped>
.log-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Roboto', monospace;
  font-size: 12px;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

