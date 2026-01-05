# Vehicle Timeline Feature

## Overview

The Vehicle Timeline feature provides a unified chronological view of all events related to a vehicle, including rentals, damages, maintenance, penalties, and revenue.

## Database Schema

### New Tables Created

#### 1. `vehicle_damages`
Stores vehicle damage records.

**Columns:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK to tenants)
- `vehicle_id` (UUID, FK to vehicles)
- `reservation_id` (UUID, FK to reservations, nullable)
- `date` (DATE)
- `title` (VARCHAR 200)
- `description` (TEXT, nullable)
- `severity` (ENUM: minor, moderate, major, critical)
- `status` (ENUM: reported, inspected, repaired, written_off)
- `repair_cost` (DECIMAL 10,2, nullable)
- `currency_code` (VARCHAR 3, default: EUR)
- `reported_by` (VARCHAR 120, nullable)
- `repaired_at` (TIMESTAMP, nullable)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_vehicle_damages_vehicle_id_date` on (vehicle_id, date)
- `idx_vehicle_damages_tenant_id_vehicle_id` on (tenant_id, vehicle_id)

#### 2. `vehicle_maintenances`
Stores vehicle maintenance records.

**Columns:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK to tenants)
- `vehicle_id` (UUID, FK to vehicles)
- `date` (DATE)
- `title` (VARCHAR 200)
- `description` (TEXT, nullable)
- `type` (ENUM: oil_change, filter_replacement, tire_replacement, brake_service, battery_replacement, engine_service, transmission_service, inspection, repair, other)
- `status` (ENUM: scheduled, in_progress, completed, cancelled)
- `cost` (DECIMAL 10,2, nullable)
- `currency_code` (VARCHAR 3, default: EUR)
- `service_provider` (VARCHAR 200, nullable)
- `odometer_reading` (INT, nullable)
- `next_service_date` (DATE, nullable)
- `next_service_odometer` (INT, nullable)
- `performed_by` (VARCHAR 120, nullable)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_vehicle_maintenances_vehicle_id_date` on (vehicle_id, date)
- `idx_vehicle_maintenances_tenant_id_vehicle_id` on (tenant_id, vehicle_id)

#### 3. `vehicle_penalties`
Stores vehicle penalties (HGS, traffic fines, etc.).

**Columns:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK to tenants)
- `vehicle_id` (UUID, FK to vehicles)
- `reservation_id` (UUID, FK to reservations, nullable)
- `date` (DATE)
- `title` (VARCHAR 200)
- `description` (TEXT, nullable)
- `type` (ENUM: hgs, traffic_fine, parking_fine, speeding_fine, other)
- `status` (ENUM: pending, paid, contested, waived)
- `amount` (DECIMAL 10,2)
- `currency_code` (VARCHAR 3, default: EUR)
- `fine_number` (VARCHAR 100, nullable)
- `location` (VARCHAR 200, nullable)
- `paid_at` (TIMESTAMP, nullable)
- `paid_by` (VARCHAR 120, nullable)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_vehicle_penalties_vehicle_id_date` on (vehicle_id, date)
- `idx_vehicle_penalties_tenant_id_vehicle_id` on (tenant_id, vehicle_id)

#### 4. `vehicle_timeline_media`
Stores media files (images, documents, videos) associated with timeline events.

**Columns:**
- `id` (UUID, PK)
- `damage_id` (UUID, FK to vehicle_damages, nullable)
- `maintenance_id` (UUID, FK to vehicle_maintenances, nullable)
- `penalty_id` (UUID, FK to vehicle_penalties, nullable)
- `type` (ENUM: image, document, video)
- `url` (VARCHAR 500)
- `filename` (VARCHAR 200, nullable)
- `mime_type` (VARCHAR 100, nullable)
- `size` (INT, nullable)
- `description` (TEXT, nullable)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_vehicle_timeline_media_damage_id` on (damage_id)
- `idx_vehicle_timeline_media_maintenance_id` on (maintenance_id)
- `idx_vehicle_timeline_media_penalty_id` on (penalty_id)

### Existing Tables Used

- `reservations` - Rental periods, check-in/check-out events, revenue
- `vehicles` - Vehicle information

## API Endpoint

### GET `/api/rentacar/vehicles/:id/timeline`

Returns a unified timeline of all events for a vehicle.

**Authentication:** Required (Bearer token)

**Authorization:** `VEHICLE_VIEW` permission

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rental-start-abc123",
      "type": "rental_start",
      "title": "Kiralama Başladı - Ahmet Yılmaz",
      "description": "Rezervasyon: RAC-2024-001\nMüşteri: Ahmet Yılmaz",
      "date": "2024-01-15T10:00:00.000Z",
      "media": [],
      "metadata": {
        "reservationId": "abc123",
        "reference": "RAC-2024-001",
        "customerName": "Ahmet Yılmaz"
      }
    }
  ]
}
```

**Event Types:**
- `rental_start` - Rental period started
- `rental_end` - Rental period ended
- `checkout` - Vehicle handed over to customer
- `checkin` - Vehicle returned from customer
- `damage` - Damage reported
- `maintenance` - Maintenance performed
- `penalty` - Penalty/fine incurred
- `revenue` - Revenue from completed reservation

## Frontend Usage

### Component: `VehicleTimeline.vue`

```vue
<template>
  <VehicleTimeline :vehicle-id="vehicleId" />
</template>

<script setup>
import VehicleTimeline from '@/components/VehicleTimeline.vue';

const vehicleId = 'your-vehicle-id';
</script>
```

### Features

1. **Chronological Display** - Events sorted by date
2. **Color-Coded Events** - Different colors for different event types
3. **Media Gallery** - Display images, documents, and videos
4. **Expandable Details** - Metadata shown in expandable panels
5. **Responsive Design** - Works on all screen sizes

## Performance Optimization

1. **Indexed Queries** - All queries use indexed columns (vehicle_id, date, tenant_id)
2. **Single Query per Source** - One query for reservations, one for damages, etc.
3. **Efficient Sorting** - Sorting done in-memory after aggregation
4. **Lazy Media Loading** - Media loaded only when displayed

## Example Timeline Events

See `vehicle-timeline.example.json` for a complete example response with all event types.

