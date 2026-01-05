# Operations Module - Setup & Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

New dependencies added:
- `expo-sqlite`: SQLite database
- `@react-native-community/netinfo`: Network status
- `@tanstack/react-query`: Data fetching (optional, can use Zustand)
- `uuid`: Generate unique IDs
- `@types/uuid`: TypeScript types

### 2. Database Initialization

The database is automatically initialized in `App.tsx`:

```typescript
import { initDatabase } from './storage/database';

useEffect(() => {
  initDatabase().catch(console.error);
  startQueueProcessor();
  checkAuth();
}, []);
```

### 3. Queue Processor

The upload queue processor starts automatically in `App.tsx`:

```typescript
import { startQueueProcessor } from './queue/upload-queue';

startQueueProcessor();
```

### 4. Navigation Integration

Routes are already added to `App.tsx`:
- `OperationsHome` - Main operations list
- `OperationDetail` - Pickup/Return completion
- `UploadCenter` - Queue monitor

Also added to `HomeTabs.tsx` as a tab:
- "Operasyonlar" tab with car icon

## API Backend Requirements

The backend must implement these endpoints:

### Operations Endpoints

```
GET    /api/operations?date=YYYY-MM-DD
       Response: { pickups: [], returns: [] }

GET    /api/operations/pickup/:rentalId
       Response: { draft data, media slots }

POST   /api/operations/pickup/:rentalId/draft
       Body: { km?, fuelLevel?, photoMediaIds?[] }

POST   /api/operations/pickup/:rentalId/complete
       Body: { km, fuelLevel, photoMediaIds[], acknowledgedWarnings? }
       Response: { success, warnings?, requiresAcknowledgment? }

GET    /api/operations/return/:rentalId
       Response: { draft data, media slots }

POST   /api/operations/return/:rentalId/draft
       Body: { km?, fuelLevel?, photoMediaIds?[] }

POST   /api/operations/return/:rentalId/complete
       Body: { km, fuelLevel, photoMediaIds[], acknowledgedWarnings? }
       Response: { success, warnings?, requiresAcknowledgment? }

GET    /api/operations/damage-compare/:rentalId
       Response: { pickupPhotos, returnPhotos, differences? }

POST   /api/operations/media/upload
       Body: FormData { file, rentalId, slotIndex }
       Response: { mediaId, url }
```

### Authentication

All requests must include:
```
Authorization: Bearer <token>
```

Tenant ID is extracted from the JWT token.

## Database Schema

The SQLite database is created automatically with these tables:

### drafts
- Stores draft operation data
- Unique: (tenant_id, rental_id, type)

### draft_photos
- Stores photo metadata
- Unique: (draft_id, slot_index)
- Tracks upload status

### upload_jobs
- Queue for background uploads
- Exponential backoff retry
- Status tracking

## Usage Flow

### 1. Operations Home
- User opens app → Operations tab
- Today's pickups/returns auto-load
- Date switcher for different days
- Tap operation → Opens detail screen

### 2. Operation Detail
- User enters KM, selects fuel
- Captures 8 photos (auto-slot filling)
- Draft auto-saves on every change
- "Tamamla" button enabled when complete
- If offline → Queued for later
- If online → Completes immediately

### 3. Upload Center
- Monitor queued jobs
- Retry failed uploads
- View error messages
- Manual queue trigger

## Offline Behavior

### Draft Saving
- Every change (KM, fuel, photo) triggers auto-save
- Saved to SQLite immediately
- Attempts to sync to server if online (debounced 1s)

### Photo Upload
- Photos saved locally with file URI
- Upload job queued automatically
- Queue processor uploads when online
- Status updates: pending → uploading → uploaded

### Completion
- If online: Completes immediately
- If offline: Queues completion job
- Job processes when online
- Warnings handled on return operations

## Testing

### Unit Tests
```bash
npm test -- operations.test.ts
```

### Manual Testing
See `OPERATIONS_QA_CHECKLIST.md` for comprehensive test scenarios.

### Key Test Cases
1. **Offline Capture**: Airplane mode → Capture 8 photos → App restart → Data persists
2. **Auto-Sync**: Create draft offline → Go online → Verify sync
3. **Queue Processing**: Create multiple drafts offline → Go online → Verify all upload
4. **Warning Flow**: Return with KM diff > 300 → Verify warning modal → Acknowledge → Complete

## Troubleshooting

### Database Errors
- Ensure `initDatabase()` is called before use
- Check console for migration errors
- Database file: `operations.db` in app data directory

### Upload Failures
- Check network connectivity
- Verify queue processor is running
- Check Upload Center for failed jobs
- Verify API endpoints are correct

### Photo Issues
- Check camera permissions
- Verify photo file URIs are valid
- Check storage space
- Photos are compressed to 0.8 quality

### Performance
- Large number of drafts may slow queries
- Consider pagination for operations list
- Photo compression helps with upload speed

## Production Considerations

1. **Photo Storage**: Consider cloud storage (S3, etc.) for production
2. **Queue Limits**: Set max concurrent uploads
3. **Error Reporting**: Integrate error tracking (Sentry, etc.)
4. **Analytics**: Track completion rates, offline usage
5. **Background Tasks**: Use Expo TaskManager for true background uploads
6. **Database Encryption**: Consider SQLCipher for sensitive data

## Security

- All data tenant-isolated
- Tenant ID from JWT (never user input)
- Local database in app sandbox
- Photos stored locally until uploaded
- No sensitive data in logs

## Performance Tips

1. **Photo Compression**: Already set to 0.8 quality
2. **Debounced Saves**: 1 second delay prevents excessive writes
3. **Indexed Queries**: Database indexes on common queries
4. **Batch Operations**: Queue processes one at a time to avoid overload

## Support

For issues or questions:
1. Check `OPERATIONS_QA_CHECKLIST.md` for known scenarios
2. Review `OPERATIONS_IMPLEMENTATION.md` for architecture details
3. Check console logs for errors
4. Verify API endpoints match backend

