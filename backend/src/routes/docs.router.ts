/**
 * API Documentation Routes
 * Serves OpenAPI/Swagger documentation
 */

import { Router, Request, Response } from 'express';
import { getApiDocs } from '../docs/api-docs';

const router = Router();

/**
 * GET /api/docs
 * Returns OpenAPI/Swagger JSON specification
 */
router.get('/docs', (req: Request, res: Response) => {
  res.json(getApiDocs());
});

/**
 * GET /api/docs/readme
 * Returns API documentation in markdown format
 */
router.get('/docs/readme', (req: Request, res: Response) => {
  const readme = `# SaaS Tour API Documentation

## Base URL
- Development: http://localhost:3000/api
- Production: https://api.saastour.com/api

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Error Response Format
All errors follow a standardized format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

## Success Response Format
Successful responses:
\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`

## Error Codes
- \`INTERNAL_ERROR\`: Internal server error
- \`VALIDATION_ERROR\`: Request validation failed
- \`NOT_FOUND\`: Resource not found
- \`UNAUTHORIZED\`: Authentication required
- \`FORBIDDEN\`: Access denied
- \`DUPLICATE_ENTRY\`: Resource already exists
- \`INVALID_INPUT\`: Invalid input data
- \`RESOURCE_CONFLICT\`: Resource conflict

## Main Endpoints

### Authentication
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/register\` - User registration

### Tenants
- \`GET /api/tenants\` - List tenants
- \`POST /api/tenants\` - Create tenant

### Rent a Car
- \`GET /api/rentacar/vehicles\` - List vehicles
- \`POST /api/rentacar/vehicles\` - Create vehicle
- \`GET /api/rentacar/vehicles/:id\` - Get vehicle
- \`PUT /api/rentacar/vehicles/:id\` - Update vehicle
- \`DELETE /api/rentacar/vehicles/:id\` - Delete vehicle

### Transfer
- \`GET /api/transfer/vehicles\` - List transfer vehicles
- \`POST /api/transfer/vehicles\` - Create transfer vehicle
- \`GET /api/transfer/routes\` - List transfer routes
- \`POST /api/transfer/routes\` - Create transfer route
- \`GET /api/transfer/reservations\` - List transfer reservations
- \`POST /api/transfer/reservations\` - Create transfer reservation

### Reservations
- \`GET /api/reservations\` - List reservations
- \`POST /api/reservations\` - Create reservation
- \`GET /api/reservations/:id\` - Get reservation
- \`PUT /api/reservations/:id\` - Update reservation

### Settings
- \`GET /api/settings\` - Get tenant settings
- \`PUT /api/settings\` - Update tenant settings

## Rate Limiting
API requests are rate-limited. Check response headers for rate limit information.

## Support
For API support, contact: support@saastour.com
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.send(readme);
});

export default router;

