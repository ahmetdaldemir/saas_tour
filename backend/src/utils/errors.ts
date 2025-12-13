/**
 * Standardized Error Handling
 * Custom error classes and error response utilities
 */

import { Response } from 'express';
import { logger } from './logger';

export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Business logic errors
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_INPUT = 'INVALID_INPUT',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(ErrorCode.FORBIDDEN, message, 403);
  }
}

export class DuplicateEntryError extends AppError {
  constructor(resource: string, field: string, value: string) {
    super(
      ErrorCode.DUPLICATE_ENTRY,
      `${resource} with ${field} '${value}' already exists`,
      409,
      { resource, field, value }
    );
  }
}

/**
 * Standard error response handler
 */
export const sendErrorResponse = (res: Response, error: Error | AppError): void => {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
    };

    logger.error(`Error ${error.code}: ${error.message}`, error, {
      statusCode: error.statusCode,
      details: error.details,
    });

    res.status(error.statusCode).json(response);
  } else {
    // Unknown/unexpected errors
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: process.env.NODE_ENV === 'production' 
          ? 'An internal server error occurred'
          : error.message,
        timestamp: new Date().toISOString(),
      },
    };

    logger.error('Unexpected error', error, {
      stack: error.stack,
    });

    res.status(500).json(response);
  }
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      sendErrorResponse(res, error);
    });
  };
};

