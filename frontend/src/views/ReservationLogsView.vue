<template>
  <div>
    <v-card elevation="2" class="mb-4 main-container">
      <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
        <span class="text-h6 font-weight-bold">Rezervasyon Logları</span>
        <div class="d-flex align-center gap-2">
          <v-btn icon="mdi-refresh" variant="text" @click="loadLogs" :loading="loading" />
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            label="Durum Filtresi"
            density="compact"
            style="max-width: 200px"
            clearable
            @update:model-value="loadLogs"
          />
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="logs"
          :loading="loading"
          item-value="id"
          class="elevation-0"
          density="compact"
        >
          <template #item.index="{ index }">
            <span>{{ index + 1 }}</span>
          </template>
          <template #item.createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>
          <template #item.status="{ item }">
            <v-chip
              size="small"
              :color="getStatusColor(item.status)"
              variant="flat"
            >
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>
          <template #item.requestData="{ item }">
            <v-btn
              icon="mdi-eye"
              variant="text"
              size="small"
              @click="viewRequestData(item)"
            />
          </template>
          <template #item.reservationId="{ item }">
            <v-btn
              v-if="item.reservationId"
              icon="mdi-open-in-new"
              variant="text"
              size="small"
              color="primary"
              @click="viewReservation(item.reservationId)"
            />
            <span v-else>-</span>
          </template>
          <template #item.error="{ item }">
            <v-chip
              v-if="item.error"
              size="small"
              color="error"
              variant="tonal"
              @click="viewError(item)"
            >
              Hata Detayı
            </v-chip>
            <span v-else>-</span>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex align-center gap-1" @click.stop>
              <v-btn
                v-if="!item.reservationId && (item.status === 'pending' || item.status === 'failed')"
                icon="mdi-check-circle"
                variant="text"
                size="small"
                color="success"
                @click.stop="convertToReservation(item)"
                :loading="convertingId === item.id"
                title="Rezervasyona Çevir"
              />
              <v-btn
                v-else-if="item.reservationId"
                icon="mdi-check-circle"
                variant="text"
                size="small"
                color="success"
                disabled
                title="Zaten Rezervasyona Çevrilmiş"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Request Data Dialog -->
    <v-dialog v-model="showRequestDataDialog" max-width="800">
      <v-card>
        <v-card-title>İstek Verileri</v-card-title>
        <v-divider />
        <v-card-text>
          <pre class="pa-4" style="background: #f5f5f5; border-radius: 4px; overflow: auto; max-height: 500px;">{{ JSON.stringify(selectedLog?.requestData, null, 2) }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showRequestDataDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Error Dialog -->
    <v-dialog v-model="showErrorDialog" max-width="600">
      <v-card>
        <v-card-title class="text-error">Hata Detayı</v-card-title>
        <v-divider />
        <v-card-text>
          <p class="text-body-1">{{ selectedLog?.error }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showErrorDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '../services/api.service';
import { useSnackbar } from '../composables/useSnackbar';

const router = useRouter();
const { showSnackbar } = useSnackbar();

interface ReservationLog {
  id: string;
  tenantId: string;
  requestData: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'converted';
  error?: string;
  reservationId?: string | null;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

const logs = ref<ReservationLog[]>([]);
const loading = ref(false);
const statusFilter = ref<string | null>(null);
const convertingId = ref<string | null>(null);
const selectedLog = ref<ReservationLog | null>(null);
const showRequestDataDialog = ref(false);
const showErrorDialog = ref(false);

const statusOptions = [
  { title: 'Beklemede', value: 'pending' },
  { title: 'Başarılı', value: 'success' },
  { title: 'Başarısız', value: 'failed' },
  { title: 'Çevrildi', value: 'converted' },
];

const headers = [
  { title: '#', key: 'index', width: '50px' },
  { title: 'Tarih', key: 'createdAt', width: '180px' },
  { title: 'Durum', key: 'status', width: '120px' },
  { title: 'İstek Verisi', key: 'requestData', width: '120px' },
  { title: 'Rezervasyon ID', key: 'reservationId', width: '150px' },
  { title: 'Hata', key: 'error', width: '120px' },
  { title: 'IP Adresi', key: 'ipAddress', width: '150px' },
  { title: 'İşlemler', key: 'actions', width: '120px', sortable: false },
];

const loadLogs = async () => {
  try {
    loading.value = true;
    const params: any = {};
    if (statusFilter.value) {
      params.status = statusFilter.value;
    }
      const response = await http.get('/reservation-logs', { params });
    logs.value = response.data;
  } catch (error: any) {
    console.error('Failed to load reservation logs:', error);
    showSnackbar('Rezervasyon logları yüklenirken hata oluştu', 'error');
  } finally {
    loading.value = false;
  }
};

const convertToReservation = async (log: ReservationLog) => {
  if (!confirm('Bu log\'u rezervasyona çevirmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    convertingId.value = log.id;
      const response = await http.post(`/reservation-logs/${log.id}/convert`);
    showSnackbar('Rezervasyon başarıyla oluşturuldu', 'success');
    await loadLogs();
    // Rezervasyon detay sayfasına yönlendir
    if (response.data?.data?.id) {
      router.push(`/app/reservations/${response.data.data.id}`);
    }
  } catch (error: any) {
    console.error('Failed to convert log to reservation:', error);
    showSnackbar(error.response?.data?.message || 'Rezervasyon oluşturulurken hata oluştu', 'error');
  } finally {
    convertingId.value = null;
  }
};

const viewRequestData = (log: ReservationLog) => {
  selectedLog.value = log;
  showRequestDataDialog.value = true;
};

const viewError = (log: ReservationLog) => {
  selectedLog.value = log;
  showErrorDialog.value = true;
};

const viewReservation = (reservationId: string) => {
  router.push(`/app/reservations/${reservationId}`);
};

const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'converted':
      return 'info';
    default:
      return 'grey';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Beklemede';
    case 'success':
      return 'Başarılı';
    case 'failed':
      return 'Başarısız';
    case 'converted':
      return 'Çevrildi';
    default:
      return status;
  }
};

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.main-container {
  margin: 16px;
}
</style>

