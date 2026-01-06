<template>
  <div class="operations-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Operasyonlar</h1>
        <p class="page-subtitle">Bugünkü çıkış ve dönüş işlemleri</p>
      </div>
      <v-date-picker
        v-model="selectedDate"
        :max="new Date().toISOString().split('T')[0]"
        density="compact"
        
        hide-header
        @update:model-value="loadOperations"
      />
    </div>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" color="primary" class="operations-tabs">
      <v-tab value="pickups">
        <v-badge
          :content="pickups.length"
          :model-value="pickups.length > 0"
          color="primary"
          inline
        >
          Çıkışlar
        </v-badge>
      </v-tab>
      <v-tab value="returns">
        <v-badge
          :content="returns.length"
          :model-value="returns.length > 0"
          color="primary"
          inline
        >
          Dönüşler
        </v-badge>
      </v-tab>
    </v-tabs>

    <!-- Content -->
    <div class="operations-content">
      <v-window v-model="activeTab">
        <!-- Pickups Tab -->
        <v-window-item value="pickups">
          <div v-if="loading" class="loading-state">
            <v-progress-circular indeterminate color="primary" />
            <p class="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
          
          <div v-else-if="pickups.length === 0" class="empty-state">
            <v-icon size="64" color="grey-lighten-1">mdi-calendar-remove</v-icon>
            <p class="mt-4 text-h6 text-gray-600">Bugün çıkış yok</p>
            <p class="text-body-2 text-gray-500">Seçilen tarihte çıkış yapılacak rezervasyon bulunmuyor.</p>
          </div>

          <div v-else class="operations-list">
            <div
              v-for="item in pickups"
              :key="item.reservationId"
              class="operation-item"
              :class="{ 'completed': item.status === 'completed' }"
              @click="handleItemClick(item, 'pickup')"
            >
              <div class="operation-item-content">
                <div class="operation-main">
                  <div class="operation-header">
                    <span class="operation-code">{{ item.reference }}</span>
                    <v-chip
                      :color="item.status === 'completed' ? 'success' : 'primary'"
                      size="small"
                      variant="flat"
                    >
                      {{ item.status === 'completed' ? 'Tamamlandı' : 'Beklemede' }}
                    </v-chip>
                  </div>
                  <p class="operation-customer">{{ item.customerName }}</p>
                  <div class="operation-details">
                    <div v-if="item.vehiclePlate || item.vehicleModel" class="detail-item">
                      <v-icon size="16" class="mr-1">mdi-car</v-icon>
                      <span>{{ item.vehiclePlate || '' }} {{ item.vehicleModel || '' }}</span>
                    </div>
                    <div v-if="item.pickupLocation" class="detail-item">
                      <v-icon size="16" class="mr-1">mdi-map-marker</v-icon>
                      <span>{{ item.pickupLocation }}</span>
                    </div>
                    <div v-if="item.pickupDateTime" class="detail-item">
                      <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                      <span>{{ formatDateTime(item.pickupDateTime) }}</span>
                    </div>
                  </div>
                </div>
                <v-icon color="grey">mdi-chevron-right</v-icon>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- Returns Tab -->
        <v-window-item value="returns">
          <div v-if="loading" class="loading-state">
            <v-progress-circular indeterminate color="primary" />
            <p class="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
          
          <div v-else-if="returns.length === 0" class="empty-state">
            <v-icon size="64" color="grey-lighten-1">mdi-calendar-remove</v-icon>
            <p class="mt-4 text-h6 text-gray-600">Bugün dönüş yok</p>
            <p class="text-body-2 text-gray-500">Seçilen tarihte dönüş yapılacak rezervasyon bulunmuyor.</p>
          </div>

          <div v-else class="operations-list">
            <div
              v-for="item in returns"
              :key="item.reservationId"
              class="operation-item"
              :class="{ 'completed': item.status === 'completed' }"
              @click="handleItemClick(item, 'return')"
            >
              <div class="operation-item-content">
                <div class="operation-main">
                  <div class="operation-header">
                    <span class="operation-code">{{ item.reference }}</span>
                    <v-chip
                      :color="item.status === 'completed' ? 'success' : 'warning'"
                      size="small"
                      variant="flat"
                    >
                      {{ item.status === 'completed' ? 'Tamamlandı' : 'Beklemede' }}
                    </v-chip>
                  </div>
                  <p class="operation-customer">{{ item.customerName }}</p>
                  <div class="operation-details">
                    <div v-if="item.vehiclePlate || item.vehicleModel" class="detail-item">
                      <v-icon size="16" class="mr-1">mdi-car</v-icon>
                      <span>{{ item.vehiclePlate || '' }} {{ item.vehicleModel || '' }}</span>
                    </div>
                    <div v-if="item.pickupLocation" class="detail-item">
                      <v-icon size="16" class="mr-1">mdi-map-marker</v-icon>
                      <span>{{ item.pickupLocation }}</span>
                    </div>
                    <div v-if="item.returnDateTime" class="detail-item">
                      <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                      <span>{{ formatDateTime(item.returnDateTime) }}</span>
                    </div>
                  </div>
                </div>
                <v-icon color="grey">mdi-chevron-right</v-icon>
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '../services/api.service';

interface OperationItem {
  reservationId: string;
  reference: string;
  customerName: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  pickupLocation?: string;
  pickupDateTime?: string;
  returnDateTime?: string;
  status: 'pending' | 'completed';
  pickupRecordId?: string;
  returnRecordId?: string;
}

const router = useRouter();
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const activeTab = ref('pickups');
const pickups = ref<OperationItem[]>([]);
const returns = ref<OperationItem[]>([]);
const loading = ref(false);

const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const loadOperations = async () => {
  loading.value = true;
  try {
    const response = await http.get('/api/rentacar/operations', {
      params: { date: selectedDate.value },
    });
    pickups.value = response.data.pickups || [];
    returns.value = response.data.returns || [];
  } catch (error: any) {
    console.error('Error loading operations:', error);
  } finally {
    loading.value = false;
  }
};

const handleItemClick = (item: OperationItem, type: 'pickup' | 'return') => {
  if (type === 'pickup') {
    router.push(`/app/operations/pickup/${item.reservationId}`);
  } else {
    router.push(`/app/operations/return/${item.reservationId}`);
  }
};

onMounted(() => {
  loadOperations();
});
</script>

<style scoped>
/* ============================================
   CORPORATE OPERATIONS PAGE
   ============================================ */

.operations-page {
  padding: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--color-background);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

.operations-tabs {
  margin-bottom: var(--spacing-xl);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.operations-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
}

.operations-tabs :deep(.v-tab--selected) {
  color: var(--color-primary-600);
}

.operations-content {
  min-height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  text-align: center;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.empty-state :deep(.v-icon) {
  color: var(--color-gray-300);
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.operation-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.operation-item:hover {
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.operation-item:active {
  transform: translateY(0);
}

.operation-item.completed {
  opacity: 0.65;
  background: var(--color-gray-50);
}

.operation-item.completed:hover {
  opacity: 0.8;
}

.operation-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  gap: var(--spacing-lg);
}

.operation-main {
  flex: 1;
  min-width: 0;
}

.operation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.operation-code {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.operation-customer {
  font-size: 14px;
  color: var(--color-text-primary);
  margin: var(--spacing-xs) 0 var(--spacing-sm) 0;
  font-weight: 500;
}

.operation-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-sm);
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.detail-item .v-icon {
  margin-right: var(--spacing-xs);
  color: var(--color-primary-500);
}

.operation-item:hover .detail-item .v-icon {
  color: var(--color-primary-600);
}

/* Badge styles */
.operations-tabs :deep(.v-badge__badge) {
  background-color: var(--color-primary-600);
  color: white;
  font-weight: 500;
  font-size: 11px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
}

/* Date picker corporate style */
.page-header :deep(.v-date-picker) {
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

/* Responsive Design */
@media (max-width: 768px) {
  .operations-page {
    padding: var(--spacing-lg);
  }

  .page-header {
    flex-direction: column;
    padding: var(--spacing-lg);
  }

  .operation-item-content {
    padding: var(--spacing-md);
  }

  .operation-details {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .operations-tabs {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }
  
  .operation-code {
    font-size: 14px;
  }
  
  .operation-customer {
    font-size: 13px;
  }
}
</style>
