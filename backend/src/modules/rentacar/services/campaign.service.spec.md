# Campaign Service - Test Specifications

## Unit Test Requirements

These tests should be implemented using Jest or Mocha. Install test dependencies:
```bash
npm install --save-dev jest @types/jest ts-jest
```

## Test Cases

### 1. Campaign Selection Logic

#### Test: Select Best Campaign - Highest Discount
```typescript
// Given: 3 campaigns with different discount percentages
// When: selectBestCampaign is called
// Then: Campaign with highest discount (20%) is selected
```

#### Test: Select Best Campaign - Priority Tie-Breaker
```typescript
// Given: 2 campaigns with same discount (10%) but different priorities (5 vs 10)
// When: selectBestCampaign is called
// Then: Campaign with higher priority (10) is selected
```

#### Test: Select Best Campaign - Created At Tie-Breaker
```typescript
// Given: 2 campaigns with same discount and priority but different createdAt
// When: selectBestCampaign is called
// Then: Earlier created campaign is selected (deterministic)
```

### 2. Discount Calculation

#### Test: Percentage Discount
```typescript
// Given: basePrice = 1000, discountPercent = 20
// When: calculateDiscount is called
// Then: discountAmount = 200, finalPrice = 800
```

#### Test: Fixed Discount
```typescript
// Given: basePrice = 1000, discountFixed = 150
// When: calculateDiscount is called
// Then: discountAmount = 150, finalPrice = 850
```

#### Test: Fixed Discount Exceeds Base Price
```typescript
// Given: basePrice = 1000, discountFixed = 1500
// When: calculateDiscount is called
// Then: discountAmount = 1000 (capped), finalPrice = 0
```

### 3. Date Range Validation

#### Test: Campaign Within Date Range
```typescript
// Given: Campaign (2024-06-01 to 2024-06-30), pickupDate = 2024-06-15
// When: findApplicableCampaigns is called
// Then: Campaign is included in results
```

#### Test: Campaign Outside Date Range
```typescript
// Given: Campaign (2024-06-01 to 2024-06-30), pickupDate = 2024-07-01
// When: findApplicableCampaigns is called
// Then: Campaign is NOT included in results
```

#### Test: Campaign On Start Date
```typescript
// Given: Campaign (2024-06-01 to 2024-06-30), pickupDate = 2024-06-01
// When: findApplicableCampaigns is called
// Then: Campaign is included (inclusive start)
```

#### Test: Campaign On End Date
```typescript
// Given: Campaign (2024-06-01 to 2024-06-30), pickupDate = 2024-06-30
// When: findApplicableCampaigns is called
// Then: Campaign is included (inclusive end)
```

### 4. Minimum Rental Days Validation

#### Test: Rental Days Meets Minimum
```typescript
// Given: Campaign (minRentalDays = 3), rentalDays = 5
// When: findApplicableCampaigns is called
// Then: Campaign is included in results
```

#### Test: Rental Days Below Minimum
```typescript
// Given: Campaign (minRentalDays = 5), rentalDays = 3
// When: findApplicableCampaigns is called
// Then: Campaign is NOT included in results
```

#### Test: No Minimum Requirement
```typescript
// Given: Campaign (minRentalDays = null), rentalDays = 1
// When: findApplicableCampaigns is called
// Then: Campaign is included in results
```

### 5. Vehicle/Category Matching

#### Test: Vehicle Match
```typescript
// Given: Campaign (vehicleId = 'vehicle-1'), vehicleId = 'vehicle-1'
// When: findApplicableCampaigns is called
// Then: Campaign is included in results
```

#### Test: Vehicle Mismatch
```typescript
// Given: Campaign (vehicleId = 'vehicle-1'), vehicleId = 'vehicle-2'
// When: findApplicableCampaigns is called
// Then: Campaign is NOT included in results
```

#### Test: Category Match
```typescript
// Given: Campaign (categoryId = 'category-1'), vehicleCategoryId = 'category-1'
// When: findApplicableCampaigns is called
// Then: Campaign is included in results
```

#### Test: No Vehicle/Category Filter (Applies to All)
```typescript
// Given: Campaign (vehicleId = null, categoryId = null)
// When: findApplicableCampaigns is called
// Then: Campaign is included (applies to all vehicles)
```

### 6. Tenant Isolation

#### Test: Tenant Isolation
```typescript
// Given: Campaigns for tenant-1 and tenant-2
// When: list is called with tenant-1
// Then: Only tenant-1 campaigns are returned
```

### 7. Edge Cases

#### Test: Empty Campaigns Array
```typescript
// Given: Empty campaigns array
// When: selectBestCampaign is called
// Then: Returns null
```

#### Test: Single Campaign
```typescript
// Given: Single campaign
// When: selectBestCampaign is called
// Then: Returns that campaign
```

#### Test: Rounding to 2 Decimals
```typescript
// Given: basePrice = 1000, discountPercent = 33.333
// When: calculateDiscount is called
// Then: discountAmount and finalPrice are rounded to 2 decimals
```

## Integration Test Requirements

### 1. Quote Calculation with Campaign
- Verify campaign discount is applied in VehicleService.searchVehicles
- Verify discount breakdown is returned in response
- Verify same discount is applied in reservation creation

### 2. Reservation Creation with Campaign
- Verify campaign discount is calculated during reservation creation
- Verify campaign info is stored in reservation metadata
- Verify final price includes discount

### 3. Reservation Update with Campaign
- Verify campaign discount is recalculated when reservation is updated
- Verify updated campaign info is stored in metadata

## Performance Tests

### 1. Campaign Matching Performance
- Test with 1000+ campaigns
- Verify query performance with indexes
- Verify in-memory filtering performance

