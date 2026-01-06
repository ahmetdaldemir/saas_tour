<template>
  <div class="bottom-sticky-bar">
    <v-container class="pa-0">
      <v-row no-gutters>
        <v-col cols="6" class="pr-1">
          <v-btn
            color="grey"
            
            block
            size="large"
            :disabled="loading"
            @click="$emit('save-draft')"
          >
            <v-icon start>mdi-content-save</v-icon>
            Taslak Kaydet
          </v-btn>
        </v-col>
        <v-col cols="6" class="pl-1">
          <v-btn
            color="primary"
            variant="elevated"
            block
            size="large"
            :disabled="!canComplete || loading"
            :loading="loading"
            @click="$emit('complete')"
          >
            <v-icon start>{{ completeIcon }}</v-icon>
            {{ completeText }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canComplete: boolean;
  loading?: boolean;
  completeText?: string;
  completeIcon?: string;
}>();

defineEmits<{
  'save-draft': [];
  'complete': [];
}>();
</script>

<style scoped>
.bottom-sticky-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* Add padding to content when sticky bar is present */
:deep(.v-main) {
  padding-bottom: 80px !important;
}
</style>

