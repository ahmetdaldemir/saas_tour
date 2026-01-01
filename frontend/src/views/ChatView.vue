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
            <v-skeleton-loader v-if="loadingToken" type="text" class="mb-2" />
            <v-alert v-else-if="!widgetToken?.publicKey" type="warning" variant="tonal" class="mb-2">
              Widget token yükleniyor...
            </v-alert>
            <pre v-else class="pa-4" style="display: block; background: #f5f5f5; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-family: 'Roboto', monospace;" v-text="embedCode"></pre>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
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
const loadingToken = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
let socket: Socket | null = null;

const stats = computed(() => {
  if (!Array.isArray(rooms.value)) {
    return {
      active: 0,
      unread: 0,
      total: 0,
    };
  }
  return {
    active: rooms.value.filter(r => r.status === 'active').length,
    unread: rooms.value.reduce((sum, r) => sum + (r.unreadCount || 0), 0),
    total: rooms.value.length,
  };
});

const filteredRooms = computed(() => {
  if (!Array.isArray(rooms.value)) {
    return [];
  }
  if (!searchQuery.value) return rooms.value;
  const query = searchQuery.value.toLowerCase();
  return rooms.value.filter(room => 
    (room.visitorName || '').toLowerCase().includes(query) ||
    (room.visitorEmail || '').toLowerCase().includes(query) ||
    (room.title || '').toLowerCase().includes(query)
  );
});

const embedCode = computed(() => {
  // Token varsa ve publicKey varsa kullan, yoksa placeholder göster
  const tenantId = widgetToken.value?.tenantId || auth.tenant?.id || 'TENANT_ID';
  const publicKey = widgetToken.value?.publicKey;
  
  // Eğer publicKey yoksa, loading mesajı göster
  if (!publicKey) {
    return 'Loading widget token...';
  }
  
  // Script tag'lerini string olarak oluştur (Vue compiler için - script kelimesini parçalara böl)
  const s1 = 'sc';
  const s2 = 'ript';
  const s3 = '/' + s1 + s2;
  return '<' + s1 + s2 + '\n' +
    '  src="https://chat.saastour360.com/widget.js"\n' +
    `  data-tenant="${tenantId}"\n` +
    `  data-key="${publicKey}">\n` +
    '<' + s3 + '>';
});

const embedCodeHtml = computed(() => {
  // HTML escape için - karakterleri string olarak kullan
  const lessThan = String.fromCharCode(60);
  const greaterThan = String.fromCharCode(62);
  const ampersand = String.fromCharCode(38);
  const quote = String.fromCharCode(34);
  const apostrophe = String.fromCharCode(39);
  
  return embedCode.value
    .split(ampersand).join('&amp;')
    .split(lessThan).join('&lt;')
    .split(greaterThan).join('&gt;')
    .split(quote).join('&quot;')
    .split(apostrophe).join('&#39;');
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
  loadingToken.value = true;
  try {
    const { data } = await http.get('/chat/widget-token');
    if (data.success) {
      widgetToken.value = data.data;
    }
  } catch (error) {
    console.error('Failed to load widget token:', error);
  } finally {
    loadingToken.value = false;
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
  // Eğer publicKey yoksa, kopyalama yapma
  if (!widgetToken.value?.publicKey) {
    alert('Widget token henüz yüklenmedi. Lütfen bekleyin.');
    return;
  }
  
  // embedCode computed property'sini kullan
  navigator.clipboard.writeText(embedCode.value);
  // Show snackbar or toast
};

// Dialog açıldığında her zaman token'ı yükle
watch(showTokenDialog, async (isOpen) => {
  if (isOpen) {
    // Token yoksa veya publicKey yoksa yükle
    if (!widgetToken.value || !widgetToken.value.publicKey) {
      await loadWidgetToken();
    }
  }
});

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
  if (!auth.token || !auth.tenant) {
    console.warn('⚠️ Cannot connect socket: missing token or tenant');
    return;
  }

  // Determine WebSocket URL based on environment
  // Frontend uses subdomain-based routing (berg.saastour360.com)
  // Mobile uses api.saastour360.com
  let socketUrl: string;
  if (import.meta.env.VITE_WS_URL) {
    socketUrl = import.meta.env.VITE_WS_URL;
  } else if (import.meta.env.MODE === 'development') {
    // Development: use localhost
    socketUrl = 'http://localhost:4001';
  } else {
    // Production: use current host with same subdomain (berg.saastour360.com)
    // Frontend always uses subdomain, so use current origin
    socketUrl = window.location.origin;
  }
  
  console.log('🔌 Connecting to Socket.io server:', {
    url: socketUrl,
    token: auth.token ? 'Bearer ***' : 'missing',
    tenantId: auth.tenant?.id,
  });
  
  socket = io(socketUrl, {
    // Send JWT token in both auth object (for polling) and extraHeaders (for websocket)
    auth: {
      token: auth.token,
    },
    extraHeaders: {
      Authorization: `Bearer ${auth.token}`,
    },
    // Use polling first due to Cloudflare WebSocket issues, then try websocket
    transports: ['polling', 'websocket'],
    path: '/socket.io/',
    // WebSocket connection options
    upgrade: true,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    // Allow upgrade to websocket after polling connection established
    forceNew: false,
    timeout: 20000,
    // Cloudflare compatibility: allow polling to work
    withCredentials: true,
  });

  socket.on('connect', () => {
    console.log('✅ Chat socket connected', { socketId: socket.id, transport: socket.io.engine.transport.name });
  });

  socket.on('connect_error', (error: any) => {
    console.error('❌ Chat socket connection error:', error);
    console.error('Error details:', {
      message: error.message,
      description: error.description,
      context: error.context,
      type: error.type,
      transport: socket.io.engine?.transport?.name,
    });
  });

  socket.on('disconnect', (reason: string) => {
    console.warn('⚠️ Chat socket disconnected:', reason);
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

