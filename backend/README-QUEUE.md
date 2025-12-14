# Email Queue System (RabbitMQ)

Bu proje email gönderme işlemlerini RabbitMQ kuyruk sistemi üzerinden yönetir.

## Kurulum

### 1. Docker Stack'i Başlat

```bash
cd docker-datatabse-stack
docker-compose up -d
```

Bu komut RabbitMQ'yu da başlatacak. RabbitMQ Management UI'ya erişmek için:
- URL: http://localhost:15672
- Username: admin
- Password: admin_pass

### 2. Backend Dependencies

```bash
cd backend
npm install
```

### 3. Environment Variables

Backend `.env` dosyanıza şu değişkenleri ekleyin:

```env
# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin_pass
RABBITMQ_VHOST=/

# Email Queue (true/false)
USE_EMAIL_QUEUE=true
```

## Kullanım

### Development Mode

1. **API Server'ı başlat:**
```bash
npm run dev
```

2. **Worker'ı ayrı terminalde başlat:**
```bash
npm run dev:worker
```

### Production Mode

1. **Build:**
```bash
npm run build
```

2. **API Server:**
```bash
npm start
```

3. **Worker (ayrı process):**
```bash
npm run start:worker
```

## Email Gönderme

Email gönderme işlemleri otomatik olarak kuyruğa eklenir:

- **Customer Welcome Email**: Yeni müşteri oluşturulduğunda
- **Reservation Confirmation**: Rezervasyon onaylandığında
- **Reservation Cancelled**: Rezervasyon iptal edildiğinde
- **Reservation Completed**: Rezervasyon tamamlandığında

## Queue Yapısı

- **Exchange**: `email_exchange` (direct type)
- **Queues**:
  - `email_queue`: Normal priority email'ler
  - `email_queue_high_priority`: Yüksek öncelikli email'ler

## RabbitMQ Management UI

RabbitMQ Management UI'da:
- Queue'ları izleyebilirsiniz
- Mesaj sayılarını görebilirsiniz
- Consumer'ları kontrol edebilirsiniz
- Mesajları manuel olarak publish/consume edebilirsiniz

## Troubleshooting

### Email gönderilmiyor

1. RabbitMQ'nun çalıştığından emin olun:
```bash
docker ps | grep rabbitmq
```

2. Worker'ın çalıştığından emin olun (log'larda "Email worker started" görmelisiniz)

3. Queue'da mesaj var mı kontrol edin (RabbitMQ Management UI)

### Kuyruk sistemi devre dışı

`USE_EMAIL_QUEUE=false` yaparsanız, email'ler direkt gönderilir (fallback mode).

