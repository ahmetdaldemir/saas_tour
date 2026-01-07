<template>
  <div class="photo-grid-8-slots">
    <div class="grid-header">
      <h3 class="text-h6 mb-2">Fotoğraflar (8 adet zorunlu)</h3>
      <v-progress-linear
        :model-value="(filledSlots / 8) * 100"
        color="primary"
        height="8"
        rounded
        class="mb-2"
      />
      <p class="text-caption text-medium-emphasis">
        {{ filledSlots }} / 8 fotoğraf yüklendi
      </p>
    </div>

    <div class="photo-grid">
      <div
        v-for="slot in 8"
        :key="slot"
        class="photo-slot"
        :class="{ filled: photos[slot - 1] }"
        @click="handleSlotClick(slot)"
      >
        <div v-if="photos[slot - 1]" class="photo-preview">
          <img
            :src="getPhotoUrl(photos[slot - 1])"
            :alt="`Slot ${slot}`"
            class="photo-image"
          />
          <div class="photo-overlay">
            <v-icon color="white" size="24">mdi-camera</v-icon>
            <span class="text-caption text-white">Değiştir</span>
          </div>
        </div>
        <div v-else class="photo-placeholder">
          <v-icon size="48" color="grey-lighten-1">mdi-camera-plus</v-icon>
          <span class="text-caption text-grey">Slot {{ slot }}</span>
        </div>
        <input
          :ref="(el) => (fileInputs[slot - 1] = el as HTMLInputElement)"
          type="file"
          accept="image/*"
          capture="environment"
          class="file-input"
          @change="(e) => handleFileSelect(e, slot)"
        />
      </div>
    </div>

    <v-btn
      color="primary"
      
      block
      class="mt-4"
      :disabled="filledSlots === 8"
      @click="handleCaptureNext"
    >
      <v-icon start>mdi-camera</v-icon>
      {{ filledSlots === 8 ? 'Tüm fotoğraflar yüklendi' : 'Fotoğraf Çek' }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { http } from '../services/api.service';

interface PhotoSlot {
  slotIndex: number;
  mediaUrl: string;
  uploading?: boolean;
  uploadError?: string;
}

const props = defineProps<{
  modelValue?: PhotoSlot[];
  reservationId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PhotoSlot[]];
  'upload-progress': [slotIndex: number, progress: number];
  'upload-complete': [slotIndex: number, url: string];
  'upload-error': [slotIndex: number, error: string];
}>();

const photos = ref<(PhotoSlot | null)[]>(Array(8).fill(null));
const fileInputs = ref<(HTMLInputElement | null)[]>(Array(8).fill(null));
const uploadingSlots = ref<Set<number>>(new Set());

const filledSlots = computed(() => {
  return photos.value.filter(p => p !== null).length;
});

const getPhotoUrl = (photo: PhotoSlot | null): string => {
  if (!photo) return '';
  // If it's already a full URL, return it
  if (photo.mediaUrl.startsWith('http')) {
    return photo.mediaUrl;
  }
  // Otherwise, assume it's a relative path
  return photo.mediaUrl.startsWith('/') ? photo.mediaUrl : `/${photo.mediaUrl}`;
};

const findNextEmptySlot = (): number | null => {
  for (let i = 0; i < 8; i++) {
    if (!photos.value[i]) {
      return i + 1;
    }
  }
  return null;
};

const handleSlotClick = (slotIndex: number) => {
  const input = fileInputs.value[slotIndex - 1];
  if (input) {
    input.click();
  }
};

const handleCaptureNext = () => {
  const nextSlot = findNextEmptySlot();
  if (nextSlot) {
    handleSlotClick(nextSlot);
  }
};

const handleFileSelect = async (event: Event, slotIndex: number) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    emit('upload-error', slotIndex, 'Sadece resim dosyaları yüklenebilir');
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    emit('upload-error', slotIndex, 'Dosya boyutu 10MB\'dan küçük olmalıdır');
    return;
  }

  uploadingSlots.value.add(slotIndex);
  emit('upload-progress', slotIndex, 0);

  try {
    // Upload file
    const formData = new FormData();
    formData.append('file', file);

    const response = await http.post('/settings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          emit('upload-progress', slotIndex, progress);
        }
      },
    });

    const photoUrl = response.data.url || response.data.fullUrl;
    if (!photoUrl) {
      throw new Error('Upload response missing URL');
    }

    // Update photos array
    photos.value[slotIndex - 1] = {
      slotIndex,
      mediaUrl: photoUrl,
    };

    emit('upload-complete', slotIndex, photoUrl);
    emit('update:modelValue', photos.value.filter(p => p !== null) as PhotoSlot[]);

    // Reset input
    if (input) {
      input.value = '';
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    emit('upload-error', slotIndex, error.response?.data?.message || 'Yükleme hatası');
  } finally {
    uploadingSlots.value.delete(slotIndex);
  }
};

// Initialize from modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      photos.value = Array(8).fill(null);
      newValue.forEach((photo) => {
        if (photo.slotIndex >= 1 && photo.slotIndex <= 8) {
          photos.value[photo.slotIndex - 1] = photo;
        }
      });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.photo-grid-8-slots {
  width: 100%;
}

.grid-header {
  margin-bottom: 16px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.photo-slot {
  aspect-ratio: 1;
  border: 2px dashed #ccc;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #f5f5f5;
}

.photo-slot:hover {
  border-color: #1976d2;
  background: #e3f2fd;
}

.photo-slot.filled {
  border-style: solid;
  border-color: #4caf50;
}

.photo-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  gap: 4px;
}

.photo-slot:hover .photo-overlay {
  opacity: 1;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.file-input {
  display: none;
}

@media (max-width: 600px) {
  .photo-grid {
    gap: 8px;
  }
}
</style>

