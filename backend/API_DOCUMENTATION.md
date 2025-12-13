# API Documentation

## Overview

The SaaS Tour API provides endpoints for managing tours, vehicle rentals, transfers, reservations, and tenant settings.

## Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.saastour.com/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `INVALID_INPUT` | 400 | Invalid input data |
| `RESOURCE_CONFLICT` | 409 | Resource conflict |

## Endpoints

### Health Check

#### GET `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok"
}
```

### Authentication

#### POST `/api/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "tenantId": "uuid"
  }
}
```

### Rent a Car

#### GET `/api/rentacar/vehicles`

List all vehicles for a tenant.

**Query Parameters:**
- `tenantId` (required): Tenant ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "BMW 320i",
      "category": {...},
      "brand": {...},
      "model": {...}
    }
  ]
}
```

#### POST `/api/rentacar/vehicles`

Create a new vehicle.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "name": "BMW 320i",
  "categoryId": "uuid",
  "brandId": "uuid",
  "modelId": "uuid",
  "year": 2023,
  "seats": 5,
  "luggage": 2
}
```

### Transfer

#### GET `/api/transfer/vehicles`

List all transfer vehicles.

**Query Parameters:**
- `tenantId` (required): Tenant ID

#### POST `/api/transfer/vehicles`

Create a new transfer vehicle.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "name": "Mercedes Vito VIP",
  "type": "vip",
  "passengerCapacity": 8,
  "luggageCapacity": 4,
  "hasDriver": true,
  "features": ["wifi", "baby_seat"]
}
```

#### GET `/api/transfer/routes`

List all transfer routes.

#### POST `/api/transfer/routes`

Create a new transfer route.

#### GET `/api/transfer/reservations`

List all transfer reservations.

#### POST `/api/transfer/reservations`

Create a new transfer reservation.

### Reservations

#### GET `/api/reservations`

List all reservations.

**Query Parameters:**
- `tenantId` (required): Tenant ID
- `status` (optional): Filter by status

#### POST `/api/reservations`

Create a new reservation.

#### GET `/api/reservations/:id`

Get reservation by ID.

#### PUT `/api/reservations/:id`

Update reservation.

### Settings

#### GET `/api/settings`

Get tenant settings.

**Query Parameters:**
- `tenantId` (required): Tenant ID

#### PUT `/api/settings`

Update tenant settings.

## API Documentation Endpoints

### GET `/api/docs`

Returns OpenAPI/Swagger JSON specification.

### GET `/api/docs/readme`

Returns API documentation in markdown format.

## Logging

All API requests are logged with:
- Request method and path
- Response status code
- Request duration
- IP address
- User agent

Errors are logged with full context including stack traces.

## Rate Limiting

API requests may be rate-limited. Check response headers for rate limit information.

## Support

For API support, contact: support@saastour.com

