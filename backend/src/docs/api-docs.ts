/**
 * API Documentation
 * OpenAPI/Swagger specification for the API
 * Can be extended with swagger-ui-express for interactive docs
 */

export const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'SaaS Tour API',
    version: '1.0.0',
    description: 'API documentation for SaaS Tour platform - Rent a Car and Transfer management system',
    contact: {
      name: 'API Support',
      email: 'support@saastour.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:4001/api',
      description: 'Development server',
    },
    {
      url: 'https://api.saastour.com/api',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Tenants', description: 'Tenant management' },
    { name: 'Tours', description: 'Tour management' },
    { name: 'Rent a Car', description: 'Vehicle rental management' },
    { name: 'Transfer', description: 'VIP Transfer management' },
    { name: 'Reservations', description: 'Reservation management' },
    { name: 'Surveys', description: 'Survey management' },
    { name: 'Settings', description: 'Tenant settings' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['INTERNAL_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'DUPLICATE_ENTRY'],
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Validation failed',
              },
              details: {
                type: 'object',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Unauthorized access',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: {
                  field: 'email',
                  message: 'Invalid email format',
                },
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check if the API is running',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User login',
        description: 'Authenticate user and get JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'password123',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    user: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedError',
          },
        },
      },
    },
  },
};

/**
 * Generate API documentation endpoint
 * Can be used with swagger-ui-express for interactive docs
 */
export const getApiDocs = () => {
  return apiDocumentation;
};

