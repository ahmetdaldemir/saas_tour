<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h1 class="text-h4">Operasyonlar</h1>
          <v-date-picker
            v-model="selectedDate"
            :max="new Date().toISOString().split('T')[0]"
            density="compact"
            variant="outlined"
            @update:model-value="loadOperations"
          />
        </div>

        <v-tabs v-model="activeTab" color="primary" class="mb-4">
          <v-tab value="pickups">
            <v-badge
              :content="pickups.length"
              :model-value="pickups.length > 0"
              color="primary"
            >
              Çıkışlar
            </v-badge>
          </v-tab>
          <v-tab value="returns">
            <v-badge
              :content="returns.length"
              :model-value="returns.length > 0"
              color="primary"
            >
              Dönüşler
            </v-badge>
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <v-window-item value="pickups">
            <OperationsList
              :items="pickups"
              type="pickup"
              @item-click="handleItemClick"
            />
          </v-window-item>
          <v-window-item value="returns">
            <OperationsList
              :items="returns"
              type="return"
              @item-click="handleItemClick"
            />
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
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

<script lang="ts">
import OperationsList from '../components/OperationsList.vue';

export default {
  components: {
    OperationsList,
  },
};
</script>

