# Activity Logger - Manual Logging Guide

This guide demonstrates how to manually log activities in your application code for various scenarios.

## Basic Usage

```typescript
import { ActivityLoggerService } from '../modules/activity-log/services/activity-logger.service';
import { ActivityLogSeverity, ActivityLogStatus, ActivityLogActorType } from '../modules/activity-log/entities/activity-log.entity';

// Simple info log
await ActivityLoggerService.log({
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
  module: 'auth',
  action: 'login',
  message: 'User logged in successfully',
});
```

## Authentication Examples

### Successful Login
```typescript
await ActivityLoggerService.log({
  tenantId: user.tenantId,
  module: 'auth',
  action: 'login',
  severity: ActivityLogSeverity.INFO,
  status: ActivityLogStatus.SUCCESS,
  message: `User ${user.email} logged in successfully`,
  actor: {
    type: ActivityLogActorType.USER,
    id: user.id,
    label: user.email,
  },
  request: {
    requestId: req.requestId,
    correlationId: req.correlationId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    method: 'POST',
    path: '/api/auth/login',
  },
});
```

### Failed Login Attempt
```typescript
await ActivityLoggerService.log({
  tenantId: null, // May not have tenant for failed login
  module: 'auth',
  action: 'login_failed',
  severity: ActivityLogSeverity.WARN,
  status: ActivityLogStatus.FAILURE,
  message: `Failed login attempt for email: ${email}`,
  request: {
    requestId: req.requestId,
    ip: req.ip,
  },
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
});
```

### Logout
```typescript
await ActivityLoggerService.log({
  tenantId: req.auth.tenantId,
  module: 'auth',
  action: 'logout',
  message: `User logged out`,
  actor: {
    type: ActivityLogActorType.USER,
    id: req.auth.sub,
    label: req.auth.email,
  },
  request: {
    requestId: req.requestId,
    ip: req.ip,
  },
});
```

## CRUD Operations

### Create Entity
```typescript
await ActivityLoggerService.log({
  tenantId: reservation.tenantId,
  module: 'reservations',
  action: 'create',
  severity: ActivityLogSeverity.INFO,
  status: ActivityLogStatus.SUCCESS,
  message: `Reservation created: ${reservation.code}`,
  actor: {
    type: ActivityLogActorType.USER,
    id: req.auth.sub,
    label: req.auth.email,
  },
  entity: {
    type: 'Reservation',
    id: reservation.id,
    label: reservation.code,
  },
  request: {
    requestId: req.requestId,
    correlationId: req.correlationId,
    ip: req.ip,
    method: 'POST',
    path: '/api/reservations',
  },
  after: {
    // Sanitized snapshot of created entity
    code: reservation.code,
    status: reservation.status,
    customerId: reservation.customerId,
    vehicleId: reservation.vehicleId,
  },
});
```

### Update Entity
```typescript
await ActivityLoggerService.log({
  tenantId: vehicle.tenantId,
  module: 'vehicles',
  action: 'update',
  message: `Vehicle updated: ${vehicle.plate}`,
  actor: {
    type: ActivityLogActorType.USER,
    id: req.auth.sub,
    label: req.auth.email,
  },
  entity: {
    type: 'Vehicle',
    id: vehicle.id,
    label: vehicle.plate,
  },
  request: {
    requestId: req.requestId,
  },
  before: {
    status: 'available',
    odometer: 10000,
  },
  after: {
    status: 'maintenance',
    odometer: 10500,
  },
  diff: {
    status: 'maintenance', // Only changed fields
    odometer: 10500,
  },
});
```

### Delete Entity
```typescript
await ActivityLoggerService.log({
  tenantId: customer.tenantId,
  module: 'customers',
  action: 'delete',
  severity: ActivityLogSeverity.WARN,
  message: `Customer deleted: ${customer.email}`,
  actor: {
    type: ActivityLogActorType.USER,
    id: req.auth.sub,
    label: req.auth.email,
  },
  entity: {
    type: 'Customer',
    id: customer.id,
    label: customer.email,
  },
  request: {
    requestId: req.requestId,
  },
  before: {
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  },
});
```

## Business Operations

### Vehicle Pickup
```typescript
await ActivityLoggerService.log({
  tenantId: reservation.tenantId,
  module: 'operations',
  action: 'pickup_complete',
  severity: ActivityLogSeverity.INFO,
  status: ActivityLogStatus.SUCCESS,
  message: `Vehicle picked up for reservation ${reservation.code}`,
  actor: {
    type: ActivityLogActorType.USER,
    id: req.auth.sub,
    label: req.auth.email,
  },
  entity: {
    type: 'Reservation',
    id: reservation.id,
    label: reservation.code,
  },
  request: {
    requestId: req.requestId,
    method: 'POST',
    path: `/api/rentacar/operations/pickup/${reservation.id}/complete`,
  },
  metadata: {
    vehicleId: vehicle.id,
    vehiclePlate: vehicle.plate,
    pickupLocation: location.name,
    pickupTime: new Date().toISOString(),
    odometer: pickupData.odometer,
  },
});
```

### Payment Processing
```typescript
await ActivityLoggerService.log({
  tenantId: payment.tenantId,
  module: 'payments',
  action: 'process',
  severity: paymentSuccess ? ActivityLogSeverity.INFO : ActivityLogSeverity.ERROR,
  status: paymentSuccess ? ActivityLogStatus.SUCCESS : ActivityLogStatus.FAILURE,
  message: paymentSuccess 
    ? `Payment processed: ${payment.amount} ${payment.currency}`
    : `Payment failed: ${error.message}`,
  actor: {
    type: ActivityLogActorType.CUSTOMER,
    id: customer.id,
    label: customer.email,
  },
  entity: {
    type: 'Payment',
    id: payment.id,
    label: payment.transactionId,
  },
  request: {
    requestId: req.requestId,
  },
  metadata: {
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    gateway: 'stripe', // or iyzico, etc.
  },
  error: !paymentSuccess ? {
    code: error.code,
    message: error.message,
  } : undefined,
});
```

## Integration Logging

### External API Call
```typescript
await ActivityLoggerService.log({
  tenantId: tenant.id,
  module: 'integrations',
  action: 'api_call',
  severity: ActivityLogSeverity.INFO,
  status: ActivityLogStatus.SUCCESS,
  message: `Called external API: ${apiName}`,
  actor: {
    type: ActivityLogActorType.SYSTEM,
  },
  request: {
    requestId: req.requestId,
  },
  metadata: {
    apiName: 'VehicleTracking',
    endpoint: '/api/v1/vehicles/location',
    responseTime: 250, // ms
  },
});
```

### Email Sent
```typescript
await ActivityLoggerService.log({
  tenantId: tenant.id,
  module: 'notifications',
  action: 'email_sent',
  message: `Email sent: ${emailTemplate}`,
  actor: {
    type: ActivityLogActorType.SYSTEM,
  },
  entity: {
    type: 'Customer',
    id: customer.id,
    label: customer.email,
  },
  metadata: {
    template: emailTemplate,
    subject: emailSubject,
    to: customer.email,
  },
});
```

## Error Logging

### Business Logic Error
```typescript
await ActivityLoggerService.log({
  tenantId: req.tenant?.id,
  module: 'reservations',
  action: 'validate',
  severity: ActivityLogSeverity.ERROR,
  status: ActivityLogStatus.FAILURE,
  message: `Reservation validation failed: ${error.message}`,
  actor: {
    type: ActivityLogActorType.USER,
    id: req.auth.sub,
    label: req.auth.email,
  },
  request: {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    httpStatus: 400,
  },
  error: {
    code: 'VALIDATION_ERROR',
    message: error.message,
    stack: error.stack,
  },
  metadata: {
    validationErrors: validationResult.errors,
  },
});
```

### System Error
```typescript
await ActivityLoggerService.log({
  tenantId: null,
  module: 'system',
  action: 'database_error',
  severity: ActivityLogSeverity.ERROR,
  status: ActivityLogStatus.FAILURE,
  message: `Database connection error`,
  actor: {
    type: ActivityLogActorType.SYSTEM,
  },
  error: {
    code: 'DB_CONNECTION_ERROR',
    message: error.message,
    stack: error.stack,
  },
});
```

## Best Practices

1. **Always use try-catch around log calls** in critical paths:
   ```typescript
   try {
     await ActivityLoggerService.log({ ... });
   } catch (error) {
     // Log to console as fallback, don't break business flow
     console.error('Failed to log activity:', error);
   }
   ```

2. **Use appropriate severity levels**:
   - `DEBUG`: Development/troubleshooting info
   - `INFO`: Normal operations (logins, CRUD, successful operations)
   - `WARN`: Potentially problematic (failed login, validation errors)
   - `ERROR`: Actual errors (exceptions, integration failures)

3. **Always sanitize sensitive data**:
   - The service automatically sanitizes, but avoid logging passwords, tokens, full card numbers
   - Use metadata for structured data, before/after for state changes

4. **Include context**:
   - Always include `requestId` and `correlationId` for tracing
   - Include `actor` to track who performed the action
   - Include `entity` for entity-related actions

5. **Keep messages concise but informative**:
   - Good: `"Reservation RES-2024-001 created by user@example.com"`
   - Bad: `"Created"` (too vague)
   - Bad: `"The reservation with code RES-2024-001 was successfully created by the user with email user@example.com at 2024-01-07 10:30:45"` (too verbose, use metadata instead)

6. **Use module names consistently**:
   - `auth`, `reservations`, `vehicles`, `operations`, `payments`, `notifications`, `integrations`, `system`
   - Keep them short and lowercase

7. **Don't log everything**:
   - Focus on important actions (auth, CRUD, operations, errors)
   - Don't log read operations unless critical (e.g., accessing sensitive data)

