# Vehicle Damage Detection (AI-lite) Feature

## Overview

The Vehicle Damage Detection feature automatically compares check-in and check-out photos to detect potential vehicle damage using image processing techniques (no external AI dependencies).

## Architecture

### Image Processing Techniques

1. **Pixel-by-Pixel Comparison**
   - Compares grayscale pixel values between images
   - Threshold: 20 (0-255 scale)
   - Calculates percentage of different pixels

2. **Edge Detection**
   - Uses Sobel edge detection kernel
   - Compares edge patterns between images
   - Identifies structural changes

3. **Difference Overlay**
   - Generates visual difference image
   - Highlights areas of change in red
   - Saved as JPEG for review

4. **Damage Region Detection**
   - Flood-fill algorithm to cluster different pixels
   - Identifies connected regions of damage
   - Calculates bounding boxes and confidence scores

### Detection Algorithm

```
damage_probability = (pixel_difference * 0.6) + (edge_difference * 0.4)
confidence_score = damage_probability * method_agreement
```

Where `method_agreement` = 1 - |pixel_difference - edge_difference| / 100

## Database Schema

### `vehicle_damage_detections`

**Columns:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK to tenants)
- `vehicle_id` (UUID, FK to vehicles)
- `reservation_id` (UUID, FK to reservations)
- `checkin_photo_urls` (JSONB array)
- `checkout_photo_urls` (JSONB array)
- `damage_probability` (DECIMAL 5,2) - 0-100
- `confidence_score` (DECIMAL 5,2) - 0-100
- `status` (ENUM: pending, processing, completed, failed, verified, false_positive)
- `damaged_areas` (JSONB array) - Regions with coordinates
- `difference_image_url` (VARCHAR 500)
- `processing_metadata` (JSONB)
- `verified_by_user_id` (UUID, nullable)
- `verified_at` (TIMESTAMP, nullable)
- `verification_notes` (TEXT, nullable)
- `error_message` (TEXT, nullable)

**Indexes:**
- `idx_vehicle_damage_detections_vehicle_id_reservation_id` on (vehicle_id, reservation_id)
- `idx_vehicle_damage_detections_tenant_id_vehicle_id` on (tenant_id, vehicle_id)
- `idx_vehicle_damage_detections_reservation_id` on (reservation_id)

## API Endpoints

### POST `/api/rentacar/vehicles/:vehicleId/reservations/:reservationId/damage-detection`

Process damage detection for a reservation.

**Request:**
```json
{
  "checkinPhotoUrls": ["/uploads/checkin-front.jpg"],
  "checkoutPhotoUrls": ["/uploads/checkout-front.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Damage detection completed",
  "data": {
    "id": "abc123",
    "damageProbability": 65.5,
    "confidenceScore": 72.3,
    "damagedAreas": [...],
    "differenceImageUrl": "/uploads/damage-diff-abc123.jpg",
    "status": "completed"
  }
}
```

### GET `/api/rentacar/damage-detections/:id`

Get detection by ID.

### GET `/api/rentacar/vehicles/:vehicleId/damage-detections`

Get all detections for a vehicle.

### GET `/api/rentacar/reservations/:reservationId/damage-detection`

Get detection for a reservation.

### POST `/api/rentacar/damage-detections/:id/verify`

Verify detection (human verification).

**Request:**
```json
{
  "isDamage": true,
  "notes": "Confirmed scratch on front bumper"
}
```

## Frontend Usage

### Component: `VehicleDamageDetection.vue`

```vue
<template>
  <VehicleDamageDetection
    :vehicle-id="vehicleId"
    :reservation-id="reservationId"
  />
</template>

<script setup>
import VehicleDamageDetection from '@/components/VehicleDamageDetection.vue';
</script>
```

### Features

1. **Photo Upload** - Upload check-in and check-out photos
2. **Automatic Processing** - Triggers damage detection
3. **Visual Comparison** - Side-by-side photo comparison
4. **Difference Overlay** - Shows detected differences
5. **Damage Regions** - Lists detected areas with coordinates
6. **Human Verification** - Mark as verified or false positive

## Processing Flow

1. **Upload Photos** → User uploads check-in and check-out photos
2. **Image Normalization** → Resize both images to same dimensions
3. **Pixel Comparison** → Compare pixel values
4. **Edge Detection** → Compare edge patterns
5. **Difference Overlay** → Generate visual difference image
6. **Region Detection** → Cluster different pixels into regions
7. **Probability Calculation** → Calculate damage probability and confidence
8. **Storage** → Save results to database
9. **Human Review** → Staff reviews and verifies results

## Performance Considerations

- **Image Size**: Images are normalized to max 1920x1080 for processing
- **Processing Time**: Typically 1-3 seconds per image pair
- **Storage**: Difference images are saved as JPEG (90% quality)
- **Caching**: Detection results are cached per reservation

## Limitations & Disclaimers

⚠️ **Important**: This is an automatic visual comparison system. It:
- Does NOT use AI/ML models
- Requires human verification
- May produce false positives
- Should be used as an aid, not a replacement for manual inspection

## Example Output

See `vehicle-damage-detection.example.json` for a complete example response.

