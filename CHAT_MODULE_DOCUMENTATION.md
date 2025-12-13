# Chat / Agency Module Documentation

## Overview

Live Chat modülü, multi-tenant Rent a Car SaaS yazılımına entegre edilmiş gerçek zamanlı chat sistemidir. Web sitesi ziyaretçileri ile admin panel arasında canlı mesajlaşma sağlar.

## Architecture

### 1. Backend Service
- **WebSocket Server**: Socket.io ile gerçek zamanlı iletişim
- **REST API**: Chat room ve mesaj yönetimi
- **Widget Authentication**: Public key ile widget doğrulaması

### 2. Admin Panel
- **Chat / Agency Menüsü**: Sohbetleri listeleme ve yönetme
- **Real-time Messaging**: WebSocket ile canlı mesajlaşma
- **Widget Token Management**: Widget embed kodu oluşturma

### 3. Client Widget
- **Standalone JavaScript**: Bağımsız çalışan embed script
- **Auto-connect**: Otomatik WebSocket bağlantısı
- **Responsive UI**: Mobil uyumlu arayüz

## Database Schema

### ChatRoom
- `tenantId`: Tenant ID (zorunlu)
- `title`: Room başlığı
- `status`: active, closed, archived
- `visitorId`: Ziyaretçi benzersiz ID
- `visitorName`, `visitorEmail`, `visitorPhone`: Ziyaretçi bilgileri
- `lastMessageAt`: Son mesaj zamanı
- `unreadCount`: Okunmamış mesaj sayısı

### ChatMessage
- `roomId`: Chat room ID
- `senderType`: admin, visitor, system
- `adminUserId`: Admin user ID (admin mesajlarında)
- `messageType`: text, file, system
- `content`: Mesaj içeriği
- `isRead`: Okundu mu?

### ChatWidgetToken
- `tenantId`: Tenant ID (unique)
- `publicKey`: Widget embed için public key
- `secretKey`: Backend doğrulama için secret key
- `isActive`: Aktif mi?
- `lastUsedAt`: Son kullanım zamanı

## Widget Embed

### Embed Kodu

Admin panel'den widget token'ı alındıktan sonra:

```html
<script
  src="https://chat.saastour360.com/widget.js"
  data-tenant="TENANT_ID"
  data-key="PUBLIC_WIDGET_KEY">
</script>
```

### Widget Özellikleri

- ✅ Otomatik bağlantı
- ✅ Mesaj geçmişi yükleme
- ✅ Gerçek zamanlı mesajlaşma
- ✅ Typing indicator
- ✅ Responsive tasarım
- ✅ Visitor ID persistence (localStorage)

## API Endpoints

### Admin Endpoints (Authentication Required)

```
GET    /api/chat/rooms              - List chat rooms
GET    /api/chat/rooms/:id          - Get room with messages
POST   /api/chat/rooms/:id/messages - Send message
POST   /api/chat/rooms/:id/read     - Mark as read
GET    /api/chat/widget-token       - Get widget token
POST   /api/chat/widget-token/regenerate - Regenerate token
```

### Widget Endpoints (Public, validated via publicKey)

```
POST   /api/chat/widget/rooms                    - Create/get visitor room
GET    /api/chat/widget/rooms/:id/messages       - Get messages
```

### WebSocket Events

**Client → Server:**
- `admin:join-room` - Admin room'a katıl
- `visitor:init` - Visitor room oluştur/katıl
- `message:send` - Mesaj gönder
- `typing:start` - Yazıyor başladı
- `typing:stop` - Yazıyor durdu
- `mark_read` - Okundu işaretle

**Server → Client:**
- `room:created` - Room oluşturuldu
- `room:joined` - Room'a katıldı
- `message:new` - Yeni mesaj
- `typing:start` - Biri yazıyor
- `typing:stop` - Yazma durdu
- `error` - Hata

## Security

### Widget Authentication

1. Her tenant için unique `publicKey` ve `secretKey` çifti oluşturulur
2. Widget `publicKey` ile authenticate olur
3. Backend `secretKey` ile doğrular
4. Token yeniden üretilebilir (eski token geçersiz olur)

### WebSocket Authentication

**Admin:**
- JWT token ile authenticate olur
- `Authorization: Bearer <token>` header'ında gönderilir

**Widget/Visitor:**
- `publicKey` ve `tenantId` ile authenticate olur
- Socket.io `auth` object'inde gönderilir

## Usage Examples

### Admin Panel

1. Admin panel'e giriş yap
2. "Chat / Agency" menüsüne git
3. Gelen mesajları görüntüle
4. Mesaj gönder/cevap ver
5. "Widget Kodu" butonundan embed kodu al

### Widget Integration

1. Admin panel'den widget token'ı al
2. Embed kodunu web sitesine ekle
3. Widget otomatik olarak yüklenecek ve bağlanacak
4. Ziyaretçiler mesaj gönderebilir

## File Structure

```
backend/src/modules/chat/
├── entities/
│   ├── chat-room.entity.ts
│   ├── chat-message.entity.ts
│   ├── chat-participant.entity.ts
│   └── chat-widget-token.entity.ts
├── services/
│   ├── chat-room.service.ts
│   ├── chat-message.service.ts
│   └── chat-widget-token.service.ts
├── controllers/
│   ├── chat.controller.ts (Admin)
│   └── chat-widget.controller.ts (Public)
├── routes/
│   ├── chat.router.ts (Admin routes)
│   └── chat-widget.router.ts (Public routes)
└── websocket/
    └── chat-socket.server.ts

frontend/src/
└── views/
    └── ChatView.vue (Admin panel)

backend/public/
└── widget.js (Standalone widget script)
```

## Configuration

### Environment Variables

```env
# WebSocket URL (Widget için)
VITE_WS_URL=ws://localhost:3000  # Development
VITE_WS_URL=wss://api.saastour360.com  # Production

# API URL (Widget için)
# Auto-detected from current domain
```

### Widget Configuration

Widget otomatik olarak current domain'e göre API ve WebSocket URL'lerini belirler:

- `http://` → `ws://` ve `http://`
- `https://` → `wss://` ve `https://`

## Testing

### Manual Testing

1. Admin panel'e giriş yap
2. Widget token'ı al
3. Test HTML sayfası oluştur ve embed kodunu ekle
4. Widget'ı aç ve mesaj gönder
5. Admin panel'de mesajın göründüğünü kontrol et
6. Admin panel'den cevap gönder
7. Widget'ta cevabın göründüğünü kontrol et

## Troubleshooting

### Widget bağlanamıyor
- `data-tenant` ve `data-key` attribute'larını kontrol et
- Widget token'ın aktif olduğunu kontrol et
- WebSocket URL'in doğru olduğunu kontrol et

### Mesajlar görünmüyor
- WebSocket bağlantısını kontrol et
- Room ID'nin doğru olduğunu kontrol et
- Tenant ID'nin eşleştiğini kontrol et

### Admin panel'de mesajlar görünmüyor
- Socket.io bağlantısını kontrol et
- JWT token'ın geçerli olduğunu kontrol et
- Browser console'da hata var mı kontrol et

