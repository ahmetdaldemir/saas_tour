# E-Fatura (Invoice) System Implementation

## Overview
This document describes the implementation of a tenant-based invoicing system with modular e-Fatura integrator support.

## Architecture

### PART A - Tenant Settings
- **Location**: `backend/src/modules/shared/entities/tenant-settings.entity.ts`
- **Settings Category**: `INVOICE`
- **Fields stored in metadata JSONB**:
  - `depositAmount` (number, default: 0)
  - `vatRate` (number, 0-100, default: 0)
  - `eInvoiceIntegrator` (string, default: 'none')

**API Endpoints**:
- `GET /api/settings/invoice?tenantId=xxx` - Get invoice settings
- `PUT /api/settings/invoice` - Update invoice settings (requires auth + SETTINGS_UPDATE permission)

### PART B - Invoice Entity
- **Location**: `backend/src/modules/shared/entities/reservation-invoice.entity.ts`
- **Table**: `reservation_invoices`
- **Unique Constraint**: `(tenantId, reservationId)` - prevents duplicate invoices
- **Status**: `draft`, `sent`, `failed`

### PART C - Modular Integrator Architecture
- **Interface**: `backend/src/modules/shared/services/invoice/integrator.interface.ts`
- **Registry**: `backend/src/modules/shared/services/invoice/integrator-registry.ts`
- **Mock Integrator**: `backend/src/modules/shared/services/invoice/mock-integrator.ts`
- **Service**: `backend/src/modules/shared/services/invoice/invoice.service.ts`

**Registered Integrators**:
- `mock` - MockIntegrator (for dev/testing)
- `none` - No integrator (creates draft invoice)

**Adding a New Integrator**:
1. Create a new class implementing `Integrator` interface
2. Register it in `backend/src/server.ts`:
   ```typescript
   IntegratorRegistry.register(new YourIntegrator());
   ```

### PART D - Integrator Configuration
- **Entity**: `backend/src/modules/shared/entities/reservation-invoice-config.entity.ts`
- **Table**: `reservation_invoice_configs`
- **Service**: `backend/src/modules/shared/services/invoice/invoice-config.service.ts`

**API Endpoints**:
- `GET /api/invoices/integrators/:integratorKey/config` - Get config (masked)
- `PUT /api/invoices/integrators/:integratorKey/config` - Save config (admin only)

### PART E - Invoice Issuance
**API Endpoints**:
- `POST /api/invoices/issue` - Issue invoice for a reservation
  - Body: `{ reservationId, forceReissue?: boolean }`
  - Requires: Auth + RESERVATION_UPDATE permission
  - Role check: Only admins can issue invoices

- `GET /api/invoices/reservation/:reservationId` - Get invoice for reservation
- `GET /api/invoices` - Get all invoices for tenant (paginated)
- `GET /api/invoices/integrators` - Get available integrators

## Invoice Calculation Logic

**Subtotal**: Extracted from `reservation.metadata.totalPrice` (VAT-exclusive)
**VAT Amount**: `subtotal * (vatRate / 100)`
**Total**: `subtotal + vatAmount`

**Note**: Deposit is NOT included in invoice total by default (stored separately in settings).

## Security

- All endpoints require authentication
- Invoice issuance requires `RESERVATION_UPDATE` permission
- Role check: Only `admin` or `super_admin` can issue invoices
- Tenant isolation enforced on all queries
- Sensitive config fields (API keys, passwords) are masked in responses

## Frontend Integration

### Settings Page
- New tab: "Fatura Ayarları"
- Fields:
  - Deposit Amount (TRY)
  - VAT Rate (%)
  - E-Invoice Integrator (dropdown)

### Reservation Detail Page
- Button: "Fatura Kes" (Issue Invoice)
- Confirmation modal showing:
  - Subtotal
  - VAT Rate
  - VAT Amount
  - Total
  - Integrator
- Status display after issuance
- PDF link if available

## Testing

**Unit Tests** (to be implemented):
- Settings validation
- VAT calculation
- Integrator resolution
- Idempotent behavior

**Integration Tests** (to be implemented):
- Issue invoice with MockIntegrator
- Verify invoice record persisted
- Verify duplicate prevention

## Example API Payloads

### Issue Invoice Request
```json
POST /api/invoices/issue
{
  "reservationId": "uuid",
  "forceReissue": false
}
```

### Issue Invoice Response
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "reservationId": "uuid",
  "integratorKey": "mock",
  "status": "sent",
  "vatRateUsed": 20,
  "subtotal": 1000.00,
  "vatAmount": 200.00,
  "total": 1200.00,
  "externalInvoiceId": "MOCK-1234567890-ABC123",
  "pdfUrl": "https://mock-integrator.example.com/invoices/MOCK-1234567890-ABC123.pdf",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Notes

- Deposit is stored as 0 when not set (never null)
- Invoice issuance is idempotent (prevents duplicates unless `forceReissue=true`)
- All queries are tenant-scoped
- Integrator configs are stored securely (should be encrypted at rest in production)

