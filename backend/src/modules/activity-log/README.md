# System Activity Logger

A comprehensive activity logging system for the multi-tenant Rentacar SaaS platform. Records detailed logs for authentication, CRUD operations, business processes, integrations, and errors with built-in security, sanitization, and retention policies.

## Features

✅ **Comprehensive Logging**
- Authentication events (login, logout, token refresh)
- CRUD operations with before/after snapshots
- Business operations (vehicle pickup/return, payments)
- Integration calls and external API interactions
- Error tracking with stack traces

✅ **Multi-Tenant Support**
- Every log is tenant-scoped
- Admins can only view their tenant's logs
- Super-admins can view all logs

✅ **Security & Privacy**
- Automatic sanitization of sensitive data (passwords, tokens, API keys)
- PII masking (emails, phone numbers, ID numbers)
- Payload size limits to prevent database bloat
- Stack traces only visible to super-admins

✅ **Tracing & Correlation**
- Request ID tracking for debugging
- Correlation ID for distributed tracing
- IP address and user agent logging

✅ **Performance**
- Async queue-based logging (doesn't block business logic)
- Batch deletes for cleanup
- Indexed for fast queries

✅ **Admin Dashboard APIs**
- List logs with extensive filtering
- Full-text search
- Statistics and analytics
- Manual cleanup trigger

✅ **Automatic Retention**
- Scheduled cleanup (default: 180 days)
- Configurable retention period
- Manual cleanup via API or CLI

## Database Schema

```sql
activity_logs
├── id (UUID, PK)
├── tenant_id (UUID, FK, indexed)
├── created_at (timestamptz, indexed)
├── module (varchar, indexed) -- auth, reservations, vehicles, operations, etc.
├── action (varchar, indexed) -- login, create, update, delete, etc.
├── severity (enum: debug/info/warn/error, indexed)
├── status (enum: success/failure, indexed)
├── actor_type (enum: user/customer/system, indexed)
├── actor_id (UUID, indexed)
├── actor_label (varchar) -- email or name snapshot
├── entity_type (varchar, indexed)
├── entity_id (UUID, indexed)
├── entity_label (varchar) -- human-readable identifier
├── message (text, searchable)
├── request_id (varchar, indexed) -- for tracing
├── correlation_id (varchar, indexed) -- for distributed tracing
├── ip (inet)
├── user_agent (text)
├── path (text)
├── method (varchar)
├── http_status (int)
├── duration_ms (int)
├── metadata (jsonb, GIN indexed) -- structured data
├── before (jsonb) -- state before change
├── after (jsonb) -- state after change
├── diff (jsonb) -- only changed fields
├── error_code (varchar)
├── error_message (text)
├── stack_trace (text) -- truncated, admin-only
└── search_vector (tsvector) -- for full-text search
```

## Installation

The Activity Logger is automatically integrated into the application. No additional setup is required.

### Environment Variables

```env
# Retention period (default: 180 days)
ACTIVITY_LOG_RETENTION_DAYS=180

# Queue configuration (if using RabbitMQ for async logging)
QUEUE_ENABLED=true
RABBITMQ_URL=amqp://localhost:5672
```

## Usage

### Automatic Logging

The following are logged automatically:

1. **HTTP Requests**: Selected routes (admin, auth, operations) are logged with status, duration, and actor.
2. **Errors**: Unhandled errors are automatically logged with sanitized context and stack traces.
3. **Request Tracing**: Every request gets a unique `request_id` and `correlation_id` for debugging.

### Manual Logging

For business-specific actions, use `ActivityLoggerService.log()`:

```typescript
import { ActivityLoggerService } from '../modules/activity-log/services/activity-logger.service';
import { ActivityLogSeverity, ActivityLogStatus, ActivityLogActorType } from '../modules/activity-log/entities/activity-log.entity';

// Basic log
await ActivityLoggerService.log({
  tenantId: user.tenantId,
  module: 'reservations',
  action: 'create',
  message: `Reservation ${reservation.code} created`,
  actor: {
    type: ActivityLogActorType.USER,
    id: user.id,
    label: user.email,
  },
  entity: {
    type: 'Reservation',
    id: reservation.id,
    label: reservation.code,
  },
  after: {
    code: reservation.code,
    status: reservation.status,
    customerId: reservation.customerId,
  },
});

// Error log
await ActivityLoggerService.log({
  tenantId: tenant.id,
  module: 'payments',
  action: 'process',
  severity: ActivityLogSeverity.ERROR,
  status: ActivityLogStatus.FAILURE,
  message: `Payment failed: ${error.message}`,
  error: {
    code: 'PAYMENT_FAILED',
    message: error.message,
    stack: error.stack,
  },
});
```

See [MANUAL_LOGGING.md](./docs/MANUAL_LOGGING.md) for more examples.

## Admin API Endpoints

All endpoints require authentication and admin permissions.

### List Activity Logs

```http
GET /api/admin/activity-logs?tenantId=xxx&module=auth&page=1&limit=50
```

**Query Parameters:**
- `tenantId`: Filter by tenant (super-admins only)
- `dateFrom`: Start date (ISO 8601)
- `dateTo`: End date (ISO 8601)
- `module`: Filter by module (auth, reservations, etc.)
- `action`: Filter by action (login, create, etc.)
- `severity`: Filter by severity (debug, info, warn, error)
- `status`: Filter by status (success, failure)
- `actorId`: Filter by actor ID
- `entityType`: Filter by entity type
- `entityId`: Filter by entity ID
- `requestId`: Filter by request ID
- `correlationId`: Filter by correlation ID
- `q`: Full-text search keyword
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `sort`: Sort direction (`asc` or `desc`, default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "tenantId": "tenant-123",
      "createdAt": "2024-01-07T10:30:00Z",
      "module": "auth",
      "action": "login",
      "severity": "info",
      "status": "success",
      "actorType": "user",
      "actorId": "user-456",
      "actorLabel": "user@example.com",
      "message": "User logged in successfully",
      "requestId": "req-789",
      "ip": "192.168.1.1",
      "method": "POST",
      "path": "/api/auth/login",
      "httpStatus": 200,
      "durationMs": 150
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

### Get Single Activity Log

```http
GET /api/admin/activity-logs/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "tenantId": "tenant-123",
    "createdAt": "2024-01-07T10:30:00Z",
    "module": "vehicles",
    "action": "update",
    "message": "Vehicle status updated",
    "entityType": "Vehicle",
    "entityId": "vehicle-789",
    "entityLabel": "34ABC123",
    "before": {
      "status": "available",
      "odometer": 10000
    },
    "after": {
      "status": "maintenance",
      "odometer": 10500
    },
    "diff": {
      "status": "maintenance",
      "odometer": 10500
    },
    "metadata": {
      "reason": "Scheduled maintenance"
    },
    "stackTrace": "..." // Only for super-admins
  }
}
```

### Get Statistics

```http
GET /api/admin/activity-logs/stats?tenantId=xxx&dateFrom=2024-01-01&dateTo=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "severityCounts": [
      { "severity": "info", "count": 1500 },
      { "severity": "warn", "count": 200 },
      { "severity": "error", "count": 50 }
    ],
    "statusCounts": [
      { "status": "success", "count": 1600 },
      { "status": "failure", "count": 150 }
    ],
    "moduleCounts": [
      { "module": "auth", "count": 500 },
      { "module": "reservations", "count": 600 },
      { "module": "operations", "count": 400 }
    ]
  }
}
```

### Manual Cleanup

```http
POST /api/admin/activity-logs/cleanup
Content-Type: application/json

{
  "retentionDays": 90
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 5000,
    "retentionDays": 90
  }
}
```

## Scheduled Cleanup

Activity logs are automatically cleaned up by a scheduled job:

- **Schedule**: Daily at 2:00 AM
- **Default Retention**: 180 days
- **Configuration**: Set `ACTIVITY_LOG_RETENTION_DAYS` environment variable

The scheduler runs only in production environments.

## Security Considerations

1. **Automatic Sanitization**: Passwords, tokens, API keys, and other secrets are automatically masked with `[MASKED_SECRET]`.

2. **PII Protection**: Email addresses, phone numbers, and ID numbers are partially masked by default.

3. **Stack Trace Access**: Stack traces are only visible to super-admins to prevent exposure of internal implementation details.

4. **Tenant Isolation**: Tenant admins can only view logs for their own tenant. Super-admins can view all logs.

5. **Size Limits**: Payloads are automatically truncated to prevent database bloat (max 10KB per field).

6. **Non-Blocking**: Logging never blocks business logic. If logging fails, it falls back to console logging.

## Modules & Actions

### Common Modules
- `auth`: Authentication events
- `reservations`: Reservation CRUD
- `vehicles`: Vehicle management
- `operations`: Pickup/return operations
- `payments`: Payment processing
- `customers`: Customer management
- `users`: User management
- `notifications`: Email/SMS notifications
- `integrations`: External API calls
- `system`: System-level events
- `api`: HTTP requests

### Common Actions
- `login`, `logout`, `register`, `password_reset`
- `create`, `update`, `delete`, `read`
- `pickup_complete`, `return_complete`
- `process`, `refund`, `charge`
- `send`, `delivered`, `failed`
- `call`, `response`, `timeout`
- `error`, `crash`, `recovery`

## Performance

- **Async Logging**: If RabbitMQ is enabled, logs are queued and processed asynchronously.
- **Indexed Queries**: All common filters are indexed for fast lookups.
- **Pagination**: Large result sets are paginated to prevent memory issues.
- **Batch Deletes**: Cleanup jobs use batch deletes to avoid locking the database.

## Testing

Run the tests:

```bash
npm test -- activity-log
```

Tests cover:
- Sanitization utility (secrets, PII, size limits)
- Activity logger service (CRUD, filtering, pagination)
- Integration tests with real database

## Architecture

```
┌─────────────────┐
│  HTTP Request   │
└────────┬────────┘
         │
         ├─> Request ID Middleware (generates requestId)
         │
         ├─> Tenant Middleware (resolves tenant)
         │
         ├─> Auth Middleware (authenticates user)
         │
         ├─> Activity Log Middleware (logs selected routes)
         │
         ├─> Route Handlers (business logic)
         │
         ├─> Error Log Middleware (logs unhandled errors)
         │
         └─> Response

┌─────────────────────────────────┐
│  Manual Business Logic Logging  │
│  (e.g., reservation created)    │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│  ActivityLoggerService.log()    │
│  - Sanitizes data                │
│  - Prepares log entry            │
│  - Enqueues or writes directly   │
└────────┬────────────────────────┘
         │
         ├─> RabbitMQ Queue (if enabled)
         │   └─> Worker processes asynchronously
         │
         └─> Direct Database Write (fallback)

┌─────────────────────────────────┐
│  Scheduled Cleanup (Daily 2 AM) │
│  - Deletes logs older than       │
│    retention period              │
└──────────────────────────────────┘
```

## Troubleshooting

### Logs are not being created

1. Check if the database table exists: `SELECT * FROM activity_logs LIMIT 1;`
2. Verify TypeORM synchronization is enabled or migrations are run
3. Check application logs for errors during logging

### Logs are missing sanitization

1. Ensure you're using the latest version of `ActivityLoggerService`
2. Check that `sanitizeForLog()` is being called in `prepareLogEntry()`

### Performance issues with large log volumes

1. Increase `ACTIVITY_LOG_RETENTION_DAYS` to reduce logs
2. Consider archiving old logs to a separate table
3. Add more specific indexes for your most common queries

### Queue is not processing logs

1. Verify RabbitMQ is running and accessible
2. Check `QUEUE_ENABLED` environment variable is set to `true`
3. Ensure worker is started (`npm run worker`)

## Future Enhancements

- [ ] Export logs to external systems (Elasticsearch, Datadog)
- [ ] Real-time log streaming via WebSocket
- [ ] Advanced analytics dashboard
- [ ] Log archiving to cold storage (S3)
- [ ] Anomaly detection for security events
- [ ] Audit trails for compliance (GDPR, SOC 2)

## License

Proprietary - SaaS Tour Platform

