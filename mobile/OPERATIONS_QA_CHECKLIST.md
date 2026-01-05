# Operations Module QA Checklist

## Offline Scenarios

### ✅ Airplane Mode Test
- [ ] Enable airplane mode
- [ ] Capture 8 photos for pickup
- [ ] Enter KM and fuel level
- [ ] Save draft
- [ ] Force close app
- [ ] Reopen app
- [ ] Verify all data is still present
- [ ] Disable airplane mode
- [ ] Verify photos upload automatically
- [ ] Verify completion succeeds

### ✅ Network Interruption Test
- [ ] Start capturing photos (online)
- [ ] Disable network mid-upload
- [ ] Continue capturing remaining photos
- [ ] Complete operation
- [ ] Verify job is queued
- [ ] Re-enable network
- [ ] Verify queue processes automatically
- [ ] Verify completion succeeds

### ✅ App Restart Test
- [ ] Create draft with photos offline
- [ ] Force close app
- [ ] Reopen app
- [ ] Verify draft loads correctly
- [ ] Verify photos are still accessible
- [ ] Complete operation when online
- [ ] Verify success

## Photo Management

### ✅ Auto-Slot Filling
- [ ] Tap "Foto Çek" button
- [ ] Verify next empty slot is filled automatically
- [ ] Capture 8 photos sequentially
- [ ] Verify all slots 1-8 are filled in order

### ✅ Photo Replacement
- [ ] Fill slot 3 with a photo
- [ ] Tap slot 3 again
- [ ] Verify "Tekrar Çek" option appears
- [ ] Capture new photo
- [ ] Verify slot 3 is replaced

### ✅ Photo Upload Status
- [ ] Capture photo offline
- [ ] Verify status shows "pending"
- [ ] Go online
- [ ] Verify status changes to "uploading"
- [ ] Verify status changes to "uploaded" when complete

## Completion Flow

### ✅ Pickup Completion
- [ ] Fill all required fields (KM, fuel, 8 photos)
- [ ] Verify "Tamamla" button is enabled
- [ ] Tap "Tamamla"
- [ ] Verify completion succeeds
- [ ] Verify draft is marked as completed

### ✅ Return Completion with Warnings
- [ ] Complete return with KM difference > 300
- [ ] Verify warning modal appears
- [ ] Verify warning messages are displayed
- [ ] Verify "Anladım" checkbox is required
- [ ] Check "Anladım" and continue
- [ ] Verify completion succeeds

### ✅ Offline Completion
- [ ] Complete operation offline
- [ ] Verify "Kuyruğa Eklendi" message
- [ ] Verify draft status is "pending_complete"
- [ ] Go online
- [ ] Verify queue processes completion
- [ ] Verify success

## Data Persistence

### ✅ Draft Auto-Save
- [ ] Enter KM value
- [ ] Verify draft saves automatically (check after 1 second)
- [ ] Capture a photo
- [ ] Verify draft updates automatically
- [ ] Change fuel level
- [ ] Verify draft updates automatically

### ✅ Draft Sync
- [ ] Create draft offline
- [ ] Go online
- [ ] Verify draft syncs to server
- [ ] Verify server_synced_at timestamp is set

## Queue Management

### ✅ Upload Queue
- [ ] Create multiple drafts offline
- [ ] Go online
- [ ] Verify queue processes jobs in order
- [ ] Verify retry logic works on failure
- [ ] Verify exponential backoff is applied

### ✅ Upload Center
- [ ] Open Upload Center screen
- [ ] Verify all jobs are listed
- [ ] Verify status badges are correct
- [ ] Tap "Yeniden Dene" on failed job
- [ ] Verify job status changes to "queued"
- [ ] Verify queue processes retry

## UI/UX

### ✅ One-Hand Use
- [ ] Verify bottom action bar is always visible
- [ ] Verify "Taslak" and "Tamamla" buttons are easily reachable
- [ ] Verify fuel selector buttons are large enough
- [ ] Verify photo grid is scrollable if needed

### ✅ Tablet Responsiveness
- [ ] Test on tablet device
- [ ] Verify layout scales appropriately
- [ ] Verify photo grid uses available space
- [ ] Verify text and buttons are readable

### ✅ Error Handling
- [ ] Trigger network error
- [ ] Verify error message is displayed
- [ ] Verify user can retry
- [ ] Verify data is not lost

## Performance

### ✅ Large Photo Handling
- [ ] Capture high-resolution photos
- [ ] Verify photos are compressed appropriately
- [ ] Verify upload doesn't timeout
- [ ] Verify app remains responsive

### ✅ Multiple Drafts
- [ ] Create 10+ drafts
- [ ] Verify app performance remains good
- [ ] Verify database queries are efficient
- [ ] Verify memory usage is reasonable

## Security

### ✅ Tenant Isolation
- [ ] Login as Tenant A
- [ ] Create draft
- [ ] Logout and login as Tenant B
- [ ] Verify Tenant A's draft is not visible
- [ ] Verify Tenant B can only see their own data

### ✅ Data Validation
- [ ] Enter invalid KM (negative, too large)
- [ ] Verify validation error
- [ ] Try to complete without required fields
- [ ] Verify completion is blocked

## Edge Cases

### ✅ Rapid Photo Capture
- [ ] Capture photos very quickly (one after another)
- [ ] Verify all photos are saved correctly
- [ ] Verify no photos are lost
- [ ] Verify slot order is maintained

### ✅ Concurrent Operations
- [ ] Open multiple operation screens
- [ ] Create drafts for different rentals
- [ ] Verify data doesn't mix
- [ ] Verify all drafts save correctly

### ✅ Date Switching
- [ ] Switch to previous day
- [ ] Verify operations list updates
- [ ] Switch to next day
- [ ] Verify operations list updates
- [ ] Switch back to today
- [ ] Verify operations list updates

## Integration

### ✅ API Integration
- [ ] Verify API endpoints match backend
- [ ] Verify authentication tokens are sent
- [ ] Verify tenant_id is included in requests
- [ ] Verify error responses are handled

### ✅ Database Integration
- [ ] Verify database initializes correctly
- [ ] Verify migrations run on first launch
- [ ] Verify data persists across app restarts
- [ ] Verify foreign key constraints work

## Accessibility

### ✅ Screen Reader
- [ ] Enable screen reader
- [ ] Navigate through operations screen
- [ ] Verify all elements are accessible
- [ ] Verify labels are descriptive

### ✅ High Contrast
- [ ] Enable high contrast mode
- [ ] Verify UI is still readable
- [ ] Verify buttons are visible
- [ ] Verify status indicators are clear

