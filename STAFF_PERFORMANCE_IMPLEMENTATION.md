# Staff Performance Scoring System - Implementation Guide

## Overview
This document describes the complete implementation of the Staff Performance Scoring system for the field-operations mobile app.

## Architecture

### Backend Components

#### 1. Entities
- **`StaffPerformanceScore`** (`backend/src/modules/ops/entities/staff-performance-score.entity.ts`)
  - Stores performance scores per staff member per period
  - Tenant-isolated
  - Tracks timeliness, completeness, and accuracy scores
  - Stores detailed metrics and breakdowns

- **`OpsTask`** (Updated)
  - Added performance tracking fields:
    - `scheduledStartTime`, `actualStartTime`
    - `completionDelayMinutes`
    - `checklistCompleted`, `checklistItemsTotal`, `checklistItemsCompleted`
    - `requiredPhotos`, `uploadedPhotos`, `requiredVideos`, `uploadedVideos`
    - `hasErrors`, `errorCount`, `errorDetails`

#### 2. Services
- **`StaffPerformanceService`** (`backend/src/modules/ops/services/staff-performance.service.ts`)
  - Calculates scores based on:
    - **Timeliness**: On-time completion rate, average delay
    - **Completeness**: Missing photos, videos, license, checklist items
    - **Accuracy**: Error frequency and types
  - Scoring algorithm:
    - Timeliness: 30% weight
    - Completeness: 40% weight
    - Accuracy: 30% weight
  - Supports monthly, weekly, and daily periods

- **`OpsTaskService`** (Updated)
  - Added methods:
    - `startTask()`: Track task start time
    - `updateChecklist()`: Track checklist progress
    - `updateMediaCounts()`: Track photo/video uploads
    - `recordError()`: Track errors
  - Auto-calculates performance metrics on task completion

#### 3. Controllers & Routes
- **`StaffPerformanceController`** (`backend/src/modules/ops/controllers/staff-performance.controller.ts`)
  - `GET /api/ops/performance/my-scores`: Get current user's scores
  - `GET /api/ops/performance/tenant-scores`: Get all staff scores (admin)
  - `GET /api/ops/performance/user/:userId/score`: Get detailed score for user
  - `POST /api/ops/performance/recalculate`: Recalculate scores for period

- **`OpsTaskController`** (Updated)
  - `POST /api/ops/tasks/:id/start`: Start task tracking
  - `POST /api/ops/tasks/:id/checklist`: Update checklist
  - `POST /api/ops/tasks/:id/media-counts`: Update media counts
  - `POST /api/ops/tasks/:id/error`: Record error

### Mobile App Components

#### 1. Services
- **`ops.service.ts`** (Updated)
  - Added performance tracking methods
  - Integrated with API endpoints

- **`performance.service.ts`** (New)
  - `getMyScores()`: Get user's performance scores
  - `getTenantScores()`: Get all staff scores (admin)
  - `getUserScoreDetails()`: Get detailed score breakdown

#### 2. Screens
- **`CheckoutFlowScreen.tsx`** (Updated)
  - Auto-starts task tracking on mount
  - Updates media counts as photos are captured
  - Updates checklist on completion
  - Tracks all required data

### Frontend (Admin Dashboard)

#### 1. Views
- **`StaffPerformanceView.vue`** (New)
  - Displays all staff scores in a table
  - Shows summary cards (total staff, avg score, top performer, needs improvement)
  - Filter by period type (monthly/weekly/daily) and period
  - Detailed view dialog for each staff member
  - Recalculate scores functionality

## Scoring Algorithm

### Timeliness Score (0-100)
- Base: 100 points
- Calculation: On-time completion rate
- Penalty: -0.5 points per minute late (max -30 points)
- Weight: 30%

### Completeness Score (0-100)
- Base: 100 points
- Penalty: -5 points per missing item
  - Missing photos
  - Missing videos
  - Missing license verification
  - Missing checklist items
- Max penalty: -50 points
- Weight: 40%

### Accuracy Score (0-100)
- Base: 100 points
- Penalty: -10 points per error (max -50 points)
- Error types:
  - Data entry errors
  - Verification errors
  - Other errors
- Weight: 30%

### Overall Score
- Weighted average: `(Timeliness × 0.3) + (Completeness × 0.4) + (Accuracy × 0.3)`

## API Endpoints

### Performance Endpoints
```
GET    /api/ops/performance/my-scores
GET    /api/ops/performance/tenant-scores?period=2024-01&periodType=monthly
GET    /api/ops/performance/user/:userId/score?period=2024-01&periodType=monthly
POST   /api/ops/performance/recalculate
```

### Task Tracking Endpoints
```
POST   /api/ops/tasks/:id/start
POST   /api/ops/tasks/:id/checklist
POST   /api/ops/tasks/:id/media-counts
POST   /api/ops/tasks/:id/error
```

## Database Migration

You'll need to create a migration for the new `staff_performance_scores` table:

```sql
CREATE TABLE staff_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  period VARCHAR(10) NOT NULL,
  period_type VARCHAR(10) NOT NULL DEFAULT 'monthly',
  timeliness_score DECIMAL(5,2) DEFAULT 0,
  completeness_score DECIMAL(5,2) DEFAULT 0,
  accuracy_score DECIMAL(5,2) DEFAULT 0,
  overall_score DECIMAL(5,2) DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  on_time_completions INTEGER DEFAULT 0,
  late_completions INTEGER DEFAULT 0,
  missing_data_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  timeliness_details JSONB,
  completeness_details JSONB,
  accuracy_details JSONB,
  last_calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, period, period_type)
);

CREATE INDEX idx_staff_performance_tenant_period ON staff_performance_scores(tenant_id, period);
CREATE INDEX idx_staff_performance_user_period ON staff_performance_scores(tenant_id, user_id, period);
```

Also update `ops_tasks` table:

```sql
ALTER TABLE ops_tasks ADD COLUMN scheduled_start_time TIMESTAMP;
ALTER TABLE ops_tasks ADD COLUMN actual_start_time TIMESTAMP;
ALTER TABLE ops_tasks ADD COLUMN completion_delay_minutes INTEGER;
ALTER TABLE ops_tasks ADD COLUMN checklist_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE ops_tasks ADD COLUMN checklist_items_total INTEGER DEFAULT 0;
ALTER TABLE ops_tasks ADD COLUMN checklist_items_completed INTEGER DEFAULT 0;
ALTER TABLE ops_tasks ADD COLUMN required_photos INTEGER DEFAULT 0;
ALTER TABLE ops_tasks ADD COLUMN uploaded_photos INTEGER DEFAULT 0;
ALTER TABLE ops_tasks ADD COLUMN required_videos INTEGER DEFAULT 0;
ALTER TABLE ops_tasks ADD COLUMN uploaded_videos INTEGER DEFAULT 0;
ALTER TABLE ops_tasks ADD COLUMN has_errors BOOLEAN DEFAULT FALSE;
ALTER TABLE ops_tasks ADD COLUMN error_count INTEGER DEFAULT 0;
ALTER TABLE ops_tasks ADD COLUMN error_details JSONB;
```

## Usage Examples

### Mobile App - Track Task Start
```typescript
// Automatically called when CheckoutFlowScreen mounts
await opsService.startTask(taskId);
```

### Mobile App - Update Media Counts
```typescript
// Called when photos are captured
await opsService.updateMediaCounts(taskId, {
  uploadedPhotos: photos.length,
});
```

### Mobile App - View My Scores
```typescript
const scores = await performanceService.getMyScores('monthly', 12);
```

### Admin Dashboard - View All Scores
```typescript
// In StaffPerformanceView.vue
const scores = await http.get('/ops/performance/tenant-scores', {
  params: { period: '2024-01', periodType: 'monthly' }
});
```

## Tenant Isolation

All scores are tenant-isolated:
- `StaffPerformanceScore` has `tenantId` foreign key
- All queries filter by `tenantId`
- Mobile app users only see their own scores
- Admin users see all scores for their tenant

## Future Enhancements

1. **Real-time Score Updates**: WebSocket notifications when scores change
2. **Score History Charts**: Visual representation of score trends
3. **Performance Alerts**: Notify admins when scores drop below threshold
4. **Custom Scoring Weights**: Allow tenants to customize scoring weights
5. **Team Leaderboards**: Compare staff performance
6. **Export Reports**: PDF/Excel export of performance reports

## Testing

### Test Scenarios
1. Complete task on-time with all required data → High scores
2. Complete task late → Timeliness penalty
3. Missing photos → Completeness penalty
4. Record errors → Accuracy penalty
5. View scores in admin dashboard
6. Recalculate scores for period

## Notes

- Scores are calculated asynchronously on task completion
- Scores can be recalculated manually via admin dashboard
- Period format:
  - Monthly: `YYYY-MM` (e.g., "2024-01")
  - Weekly: `YYYY-WW` (e.g., "2024-W01")
  - Daily: `YYYY-MM-DD` (e.g., "2024-01-15")

