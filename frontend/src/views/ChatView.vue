<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5">Chat / Agency</h2>
      <div class="d-flex align-center gap-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          variant="outlined"
          @click="loadRooms"
          :loading="loading"
        >
          Yenile
        </v-btn>
        <v-btn
          color="success"
          prepend-icon="mdi-key-variant"
          @click="showTokenDialog = true"
        >
          Widget Kodu
        </v-btn>
      </div>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-h6">{{ stats.active }}</div>
            <div class="text-caption text-medium-emphasis">Aktif Sohbetler</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-h6">{{ stats.unread }}</div>
            <div class="text-caption text-medium-emphasis">Okunmamış Mesaj</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-h6">{{ stats.total }}</div>
            <div class="text-caption text-medium-emphasis">Toplam Sohbet</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Chat Rooms List -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Sohbetler</span>
            <v-text-field
              v-model="searchQuery"
              density="compact"
              prepend-inner-icon="mdi-magnify"
              placeholder="Ara..."
              variant="outlined"
              hide-details
              class="mt-2"
              style="max-width: 200px"
            />
          </v-card-title>
          <v-divider />
          <v-list>
            <v-list-item
              v-for="room in filteredRooms"
              :key="room.id"
              :active="selectedRoom?.id === room.id"
              @click="selectRoom(room)"
              class="mb-2"
            >
              <template #prepend>
                <v-avatar color="primary" size="40">
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ room.visitorName || 'İsimsiz Ziyaretçi' }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ room.lastMessageAt ? formatTime(room.lastMessageAt) : 'Yeni' }}
              </v-list-item-subtitle>
              <template #append>
                <v-chip
                  v-if="room.unreadCount > 0"
                  color="error"
                  size="small"
                  class="mr-2"
                >
                  {{ room.unreadCount }}
                </v-chip>
                <v-chip
                  :color="getStatusColor(room.status)"
                  size="small"
                  variant="tonal"
                >
                  {{ getStatusLabel(room.status) }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Chat Messages -->
      <v-col cols="12" md="8">
        <v-card class="chat-container">
          <v-card-title v-if="selectedRoom" class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h6">{{ selectedRoom.visitorName || 'İsimsiz Ziyaretçi' }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ selectedRoom.visitorEmail || selectedRoom.visitorPhone || 'İletişim bilgisi yok' }}
              </div>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="selectedRoom = null"
            />
          </v-card-title>
          <v-divider v-if="selectedRoom" />

          <div v-if="!selectedRoom" class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
            <div class="text-h6 mt-4 text-medium-emphasis">Bir sohbet seçin</div>
          </div>

          <div v-else class="chat-messages-container" ref="messagesContainer">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['chat-message', message.senderType === 'admin' ? 'admin' : 'visitor']"
            >
              <div class="chat-message-bubble">
                {{ message.content }}
              </div>
              <div class="chat-message-time">
                {{ formatTime(message.createdAt) }}
              </div>
            </div>
          </div>

          <v-divider v-if="selectedRoom" />
          <v-card-actions v-if="selectedRoom" class="pa-4">
            <v-text-field
              v-model="newMessage"
              placeholder="Mesajınızı yazın..."
              variant="outlined"
              density="comfortable"
              hide-details
              @keypress.enter="sendMessage"
              :loading="sending"
            />
            <v-btn
              color="primary"
              icon="mdi-send"
              @click="sendMessage"
              :disabled="!newMessage.trim() || sending"
              :loading="sending"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Widget Token Dialog -->
    <v-dialog v-model="showTokenDialog" max-width="700">
      <v-card>
        <v-card-title>Widget Embed Kodu</v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <div class="mb-4">
            <p class="text-body-2 mb-2">Aşağıdaki kodu web sitenizin HTML'ine ekleyin:</p>
            <pre class="pa-4" style="display: block; background: #f5f5f5; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-family: monospace;" v-text="embedCode"></pre>
          </div>
          <v-alert type="info" variant="tonal" class="mb-4">
            Widget'ı ekledikten sonra sitenizde canlı chat butonu görünecektir.
          </v-alert>
          <div class="d-flex gap-2">
            <v-btn
              color="warning"
              prepend-icon="mdi-refresh"
              @click="regenerateToken"
              :loading="regenerating"
            >
              Token'ı Yenile
            </v-btn>
            <v-btn
              color="primary"
              prepend-icon="mdi-content-copy"
              @click="copyEmbedCode"
            >
              Kodu Kopyala
            </v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showTokenDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '../stores/auth';
import { http } from '../modules/http';
import { io, Socket } from 'socket.io-client';

const auth = useAuthStore();
const loading = ref(false);
const rooms = ref<any[]>([]);
const selectedRoom = ref<any>(null);
const messages = ref<any[]>([]);
const newMessage = ref('');
const sending = ref(false);
const searchQuery = ref('');
const showTokenDialog = ref(false);
const widgetToken = ref<any>(null);
const regenerating = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
let socket: Socket | null = null;

const stats = computed(() => {
  return {
    active: rooms.value.filter(r => r.status === 'active').length,
    unread: rooms.value.reduce((sum, r) => sum + (r.unreadCount || 0), 0),
    total: rooms.value.length,
  };
});

const filteredRooms = computed(() => {
  if (!searchQuery.value) return rooms.value;
  const query = searchQuery.value.toLowerCase();
  return rooms.value.filter(room => 
    (room.visitorName || '').toLowerCase().includes(query) ||
    (room.visitorEmail || '').toLowerCase().includes(query) ||
    (room.title || '').toLowerCase().includes(query)
  );
});

const embedCode = computed(() => {
  if (!widgetToken.value) {
    return '<script\n  src="https://chat.saastour360.com/widget.js"\n  data-tenant="TENANT_ID"\n  data-key="PUBLIC_KEY">\n<' + '/script>';
  }
  return `<script
  src="https://chat.saastour360.com/widget.js"
  data-tenant="${widgetToken.value.tenantId}"
  data-key="${widgetToken.value.publicKey}">
<` + `/script>`;
});

const loadRooms = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get('/chat/rooms', {
      params: { tenantId: auth.tenant.id },
    });
    if (data.success) {
      rooms.value = data.data || [];
    }
  } catch (error) {
    console.error('Failed to load rooms:', error);
  } finally {
    loading.value = false;
  }
};

const loadMessages = async (roomId: string) => {
  try {
    const { data } = await http.get(`/chat/rooms/${roomId}`, {
      params: { tenantId: auth.tenant?.id },
    });
    if (data.success && data.data) {
      messages.value = data.data.messages || [];
      await nextTick();
      scrollToBottom();
      
      // Mark as read
      await http.post(`/chat/rooms/${roomId}/read`, {}, {
        params: { tenantId: auth.tenant?.id },
      });
    }
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
};

const selectRoom = async (room: any) => {
  selectedRoom.value = room;
  await loadMessages(room.id);
  
  // Join room via socket
  if (socket && socket.connected) {
    socket.emit('join_room', { roomId: room.id });
  }
};

const sendMessage = async () => {
  if (!selectedRoom.value || !newMessage.value.trim() || sending.value) return;
  
  const messageText = newMessage.value.trim();
  newMessage.value = '';
  sending.value = true;

  try {
    // Send via socket for real-time
    if (socket && socket.connected) {
      socket.emit('send_message', {
        roomId: selectedRoom.value.id,
        content: messageText,
        messageType: 'text',
      });
      
      // Optimistically add message to UI
      messages.value.push({
        id: 'temp_' + Date.now(),
        content: messageText,
        senderType: 'admin',
        createdAt: new Date(),
      });
      await nextTick();
      scrollToBottom();
    } else {
      // Fallback to REST API
      const { data } = await http.post(`/chat/rooms/${selectedRoom.value.id}/messages`, {
        content: messageText,
        messageType: 'text',
      }, {
        params: { tenantId: auth.tenant?.id },
      });
      
      if (data.success) {
        messages.value.push(data.data);
        await nextTick();
        scrollToBottom();
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  } finally {
    sending.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const loadWidgetToken = async () => {
  try {
    const { data } = await http.get('/chat/widget-token');
    if (data.success) {
      widgetToken.value = data.data;
    }
  } catch (error) {
    console.error('Failed to load widget token:', error);
  }
};

const regenerateToken = async () => {
  regenerating.value = true;
  try {
    const { data } = await http.post('/chat/widget-token/regenerate');
    if (data.success) {
      widgetToken.value = data.data;
    }
  } catch (error) {
    console.error('Failed to regenerate token:', error);
  } finally {
    regenerating.value = false;
  }
};

const copyEmbedCode = () => {
  const scriptTag = '<' + 'script';
  const scriptClose = '<' + '/' + 'script>';
  const code = scriptTag + `
  src="https://chat.saastour360.com/widget.js"
  data-tenant="${widgetToken.value?.tenantId}"
  data-key="${widgetToken.value?.publicKey}">
` + scriptClose;
  
  navigator.clipboard.writeText(code);
  // Show snackbar or toast
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    closed: 'grey',
    archived: 'default',
  };
  return colors[status] || 'default';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Aktif',
    closed: 'Kapalı',
    archived: 'Arşivlendi',
  };
  return labels[status] || status;
};

const formatTime = (date: string | Date) => {
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const connectSocket = () => {
  if (!auth.token || !auth.tenant) return;

  const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4001';
  
  socket = io(socketUrl, {
    auth: {
      token: auth.token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Chat socket connected');
  });

  socket.on('joined_room', (data: any) => {
    if (selectedRoom.value && selectedRoom.value.id === data.roomId) {
      // Room joined, messages will come via room_messages event
    }
  });

  socket.on('room_messages', (data: any) => {
    if (selectedRoom.value && selectedRoom.value.id === data.roomId) {
      messages.value = data.messages || [];
      nextTick(() => scrollToBottom());
    }
  });

  socket.on('new_message', (data: any) => {
    if (selectedRoom.value && selectedRoom.value.id === data.roomId) {
      messages.value.push(data.message);
      nextTick(() => scrollToBottom());
    } else {
      // Update room in list
      const room = rooms.value.find(r => r.id === data.roomId);
      if (room) {
        room.unreadCount = (room.unreadCount || 0) + 1;
        room.lastMessageAt = new Date();
      }
    }
  });

  socket.on('room_new_message', (data: any) => {
    // Refresh rooms list if new message from visitor
    if (!selectedRoom.value || selectedRoom.value.id !== data.roomId) {
      loadRooms();
    }
  });

  socket.on('typing:start', (data: any) => {
    // Handle typing indicator
  });

  socket.on('typing:stop', (data: any) => {
    // Handle typing indicator
  });
};

onMounted(() => {
  loadRooms();
  loadWidgetToken();
  connectSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
}

.chat-message {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.chat-message.admin {
  align-self: flex-start;
}

.chat-message.visitor {
  align-self: flex-end;
}

.chat-message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
}

.chat-message.admin .chat-message-bubble {
  background: #f1f3f5;
  color: #212529;
}

.chat-message.visitor .chat-message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-message-time {
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
  padding: 0 4px;
}
</style>

