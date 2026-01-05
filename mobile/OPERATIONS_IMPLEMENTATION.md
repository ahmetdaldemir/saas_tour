# Operations Module Implementation Guide

## Overview

This document describes the complete implementation of the offline-first Operations module for the React Native mobile app.

## Architecture

### Tech Stack
- **React Native** with Expo
- **TypeScript** for type safety
- **Zustand** for state management
- **React Query** (TanStack Query) for data fetching
- **expo-sqlite** for local persistence
- **AsyncStorage** for simple key/value storage
- **Axios** for HTTP requests
- **expo-image-picker** for camera access

### Folder Structure

```
mobile/
├── src/
│   ├── api/
│   │   └── operations.api.ts          # API client
│   ├── components/
│   │   └── operations/
│   │       ├── FuelSelector.tsx        # Fuel level selector
│   │       ├── PhotoSlot.tsx           # Single photo slot
│   │       └── PhotoGrid.tsx           # 2x4 photo grid
│   ├── screens/
│   │   ├── OperationsHomeScreen.tsx    # Main operations list
│   │   ├── OperationDetailScreen.tsx   # Pickup/Return completion
│   │   └── UploadCenterScreen.tsx      # Queue monitor
│   ├── store/
│   │   └── operations.store.ts         # Zustand store
│   ├── storage/
│   │   └── database.ts                 # SQLite database
│   ├── queue/
│   │   └── upload-queue.ts             # Upload queue processor
│   ├── types/
│   │   └── operations.ts               # Type definitions
│   └── utils/
│       └── operations.test.ts           # Unit tests
├── package.json
└── OPERATIONS_QA_CHECKLIST.md
```

## Database Schema

### Tables

1. **drafts**
   - Stores draft operation data
   - Unique constraint on (tenant_id, rental_id, type)
   - Auto-saves on every change

2. **draft_photos**
   - Stores photo metadata
   - Unique constraint on (draft_id, slot_index)
   - Tracks upload status

3. **upload_jobs**
   - Queue for background uploads
   - Exponential backoff retry logic
   - Status tracking

## Key Features

### 1. Offline-First Design
- All data saved locally first
- Queue system for background uploads
- Zero data loss guarantee
- Auto-sync when online

### 2. Auto-Slot Filling
- "Foto Çek" button fills next empty slot
- Maintains slot order (1-8)
- Visual indicators for missing slots

### 3. One-Hand Use
- Bottom sticky action bar
- Large touch targets
- Quick fuel selector buttons
- Minimal scrolling required

### 4. Warning System
- Return operations check for warnings
- KM difference > 300 triggers warning
- Fuel mismatch detection
- User acknowledgment required

## API Integration

### Endpoints

All endpoints are defined in `mobile/src/services/api-endpoints.ts`:

```typescript
ops: {
  operations: {
    list: '/operations',
    getPickup: (rentalId: string) => `/operations/pickup/${rentalId}`,
    savePickupDraft: (rentalId: string) => `/operations/pickup/${rentalId}/draft`,
    completePickup: (rentalId: string) => `/operations/pickup/${rentalId}/complete`,
    getReturn: (rentalId: string) => `/operations/return/${rentalId}`,
    saveReturnDraft: (rentalId: string) => `/operations/return/${rentalId}/draft`,
    completeReturn: (rentalId: string) => `/operations/return/${rentalId}/complete`,
    getDamageCompare: (rentalId: string) => `/operations/damage-compare/${rentalId}`,
    uploadMedia: '/operations/media/upload',
  },
}
```

### Request/Response Formats

See `mobile/src/types/operations.ts` for complete type definitions.

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

Required packages (add to package.json if not present):
- `expo-sqlite`
- `@react-native-community/netinfo`
- `zustand`
- `@tanstack/react-query`
- `expo-image-picker`
- `uuid`
- `@types/uuid`

### 2. Initialize Database

In your App.tsx or main entry point:

```typescript
import { initDatabase } from './src/storage/database';

// Initialize on app start
initDatabase().catch(console.error);
```

### 3. Start Queue Processor

In App.tsx:

```typescript
import { startQueueProcessor } from './src/queue/upload-queue';

// Start queue on app start
startQueueProcessor();
```

### 4. Add Navigation Routes

In your navigation setup:

```typescript
import OperationsHomeScreen from './src/screens/OperationsHomeScreen';
import OperationDetailScreen from './src/screens/OperationDetailScreen';
import UploadCenterScreen from './src/screens/UploadCenterScreen';

// Add routes
<Stack.Screen name="OperationsHome" component={OperationsHomeScreen} />
<Stack.Screen name="OperationDetail" component={OperationDetailScreen} />
<Stack.Screen name="UploadCenter" component={UploadCenterScreen} />
```

## Usage

### Operations Home Screen

- Auto-loads today's operations on mount
- Date switcher for different days
- Segmented control for pickups/returns
- Pull-to-refresh support
- Offline banner when disconnected

### Operation Detail Screen

- Shared component for both pickup and return
- Auto-saves draft on every change
- Photo grid with auto-slot filling
- Fuel selector with quick buttons
- KM input with numeric keypad
- Bottom action bar (Taslak / Tamamla)

### Upload Center

- Monitor all queued jobs
- Retry failed jobs
- View error messages
- Manual queue trigger

## Testing

Run unit tests:

```bash
npm test -- operations.test.ts
```

See `OPERATIONS_QA_CHECKLIST.md` for comprehensive QA scenarios.

## Troubleshooting

### Database Not Initialized
- Ensure `initDatabase()` is called before using database
- Check for migration errors in console

### Photos Not Uploading
- Check network connectivity
- Verify queue processor is running
- Check Upload Center for failed jobs
- Verify photo file URIs are valid

### Draft Not Saving
- Check database permissions
- Verify tenant ID is set
- Check console for errors

## Performance Considerations

- Photos are compressed to 0.8 quality
- Database queries use indexes
- Queue processes one job at a time
- Debounced auto-save (1 second)

## Security

- All data is tenant-isolated
- Tenant ID from auth token (never user input)
- Local database is encrypted (SQLite encryption if available)
- Photos stored locally until uploaded

## Future Enhancements

1. Background task support (Expo TaskManager)
2. Photo compression optimization
3. Batch upload support
4. Damage detection AI integration
5. Offline map integration for locations
6. Barcode scanning for vehicle plates

