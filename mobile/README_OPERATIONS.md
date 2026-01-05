# Operations Module - Quick Reference

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Database auto-initializes** on app start (in `App.tsx`)

3. **Queue processor starts automatically** (in `App.tsx`)

4. **Navigate to Operations tab** in the app

## 📱 User Flow

### Operations Home
1. Open app → "Operasyonlar" tab
2. See today's pickups/returns
3. Use date switcher for different days
4. Tap operation → Opens detail screen

### Complete Operation
1. Enter KM (numeric keypad)
2. Select fuel level (quick buttons)
3. Capture 8 photos:
   - Tap "Foto Çek" → Fills next empty slot
   - Or tap a slot → Replace photo
4. Tap "Tamamla" when ready
5. If offline → Queued automatically
6. If online → Completes immediately

### Upload Center
1. Go to Settings → "Yükleme Merkezi"
2. See all queued jobs
3. Retry failed jobs
4. Monitor upload progress

## 🔧 Technical Details

### Database Tables
- **drafts**: Operation drafts (KM, fuel, status)
- **draft_photos**: Photo metadata (8 slots, upload status)
- **upload_jobs**: Background upload queue

### Queue Processing
- Runs every 5 seconds when online
- Exponential backoff: 1s → 2s → 4s → 8s → max 5min
- Max 5 attempts per job
- Auto-retries on network recovery

### Photo Management
- Exactly 8 photos required (slots 1-8)
- Auto-slot filling
- Upload status: pending → uploading → uploaded
- Local storage until uploaded

## 📋 API Requirements

Backend must implement:
- `GET /operations?date=YYYY-MM-DD`
- `POST /operations/pickup/:rentalId/complete`
- `POST /operations/return/:rentalId/complete`
- `POST /operations/media/upload`

See `OPERATIONS_SETUP.md` for full API contract.

## ✅ Features

- ✅ Offline-first (zero data loss)
- ✅ Auto-save drafts
- ✅ Background upload queue
- ✅ One-hand use (big buttons, bottom bar)
- ✅ Tablet responsive
- ✅ Warning system (return operations)
- ✅ Photo slot order preserved (1-8)

## 🐛 Troubleshooting

**Photos not uploading?**
- Check network connectivity
- Go to Upload Center → Check failed jobs
- Verify API endpoint is correct

**Draft not saving?**
- Check console for errors
- Verify database initialized
- Check tenant ID is set

**Queue not processing?**
- Verify queue processor started (check App.tsx)
- Check network status
- Manually trigger in Upload Center

## 📚 Full Documentation

- **Setup**: `OPERATIONS_SETUP.md`
- **Architecture**: `OPERATIONS_IMPLEMENTATION.md`
- **QA Checklist**: `OPERATIONS_QA_CHECKLIST.md`
- **Complete Summary**: `OPERATIONS_COMPLETE.md`

