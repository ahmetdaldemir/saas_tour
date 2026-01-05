<template>
  <div class="operations-list">
    <v-list v-if="items.length > 0" lines="two">
      <v-list-item
        v-for="item in items"
        :key="item.reservationId"
        :title="item.reference"
        :subtitle="`${item.customerName} • ${item.vehiclePlate || 'Plaka yok'} • ${item.vehicleModel || ''}`"
        class="operation-item"
        :class="{ completed: item.status === 'completed' }"
        @click="$emit('item-click', item, type)"
      >
        <template #prepend>
          <v-avatar
            :color="type === 'pickup' ? 'primary' : 'success'"
            size="40"
          >
            <v-icon color="white">
              {{ type === 'pickup' ? 'mdi-car-key' : 'mdi-car-check' }}
            </v-icon>
          </v-avatar>
        </template>

        <template #append>
          <div class="d-flex flex-column align-end gap-2">
            <v-chip
              :color="type === 'pickup' ? 'primary' : 'success'"
              size="small"
              variant="flat"
            >
              {{ type === 'pickup' ? 'ÇIKIŞ' : 'DÖNÜŞ' }}
            </v-chip>
            <v-chip
              :color="item.status === 'completed' ? 'success' : 'warning'"
              size="small"
              variant="flat"
            >
              {{ item.status === 'completed' ? 'Tamamlandı' : 'Bekliyor' }}
            </v-chip>
          </div>
        </template>

        <v-list-item-subtitle>
          <div class="mt-1">
            <v-icon size="16" class="mr-1">mdi-map-marker</v-icon>
            {{ item.pickupLocation || 'Lokasyon belirtilmemiş' }}
          </div>
          <div class="mt-1">
            <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
            {{ formatDateTime(type === 'pickup' ? item.pickupDateTime : item.returnDateTime) }}
          </div>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-empty-state
      v-else
      title="Operasyon bulunamadı"
      text="Seçilen tarih için operasyon bulunmamaktadır."
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

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
}

const props = defineProps<{
  items: OperationItem[];
  type: 'pickup' | 'return';
}>();

defineEmits<{
  'item-click': [item: OperationItem, type: 'pickup' | 'return'];
}>();

const formatDateTime = (dateTime?: string): string => {
  if (!dateTime) return 'Tarih belirtilmemiş';
  const date = new Date(dateTime);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.operations-list {
  width: 100%;
}

.operation-item {
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #e0e0e0;
}

.operation-item:hover {
  background-color: #f5f5f5;
}

.operation-item.completed {
  opacity: 0.7;
}
</style>

