/**
 * Application Error Classes
 * 
 * This file defines custom error classes for the application.
 * These error classes help standardize error handling and provide
 * more context about errors that occur.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string, 
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found`, 'NOT_FOUND', 404);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: any) {
    super(message, 'VALIDATION_ERROR', 400);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when a user is not authorized to perform an action
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(message, 'UNAUTHORIZED', 403);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Error thrown when a user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHENTICATED', 401);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when a database operation fails
 */
export class DatabaseError extends AppError {
  constructor(message: string, public readonly originalError?: any) {
    super(message, 'DATABASE_ERROR', 500);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Error thrown when a blockchain operation fails
 */
export class BlockchainError extends AppError {
  constructor(message: string, public readonly originalError?: any) {
    super(message, 'BLOCKCHAIN_ERROR', 500);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, BlockchainError.prototype);
  }
}

/**
 * Error thrown when a duplicate resource is detected
 */
export class DuplicateError extends AppError {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} '${value}' already exists`, 'DUPLICATE_ERROR', 409);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, DuplicateError.prototype);
  }
}

/**
 * Error thrown when an external service fails
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, public readonly originalError?: any) {
    super(`${service} service error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
    
    // This is necessary for proper error handling with TypeScript
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}