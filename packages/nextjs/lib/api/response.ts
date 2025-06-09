/**
 * API Response Utilities
 * 
 * This file provides utility functions for standardizing API responses.
 * It ensures consistent response formats across all API endpoints.
 */

import { AppError } from '../../core/errors';

/**
 * Standard API response format
 */
export interface ApiResponseFormat<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * API Response utility class
 */
export class ApiResponse {
  /**
   * Create a success response
   * 
   * @param data The data to include in the response
   * @param status The HTTP status code (default: 200)
   * @returns A Response object with the standardized format
   */
  static success<T>(data: T, status = 200): Response {
    const responseBody: ApiResponseFormat<T> = {
      success: true,
      data
    };
    
    return Response.json(responseBody, { status });
  }
  
  /**
   * Create an error response
   * 
   * @param message The error message
   * @param code The error code
   * @param details Additional error details
   * @param status The HTTP status code (default: 400)
   * @returns A Response object with the standardized format
   */
  static error(message: string, code = 'UNKNOWN_ERROR', details?: any, status = 400): Response {
    const responseBody: ApiResponseFormat<null> = {
      success: false,
      error: {
        message,
        code,
        details
      }
    };
    
    return Response.json(responseBody, { status });
  }
  
  /**
   * Create an error response from an AppError
   * 
   * @param error The AppError instance
   * @returns A Response object with the standardized format
   */
  static fromError(error: AppError): Response {
    return this.error(
      error.message,
      error.code,
      error instanceof Error && 'details' in error ? (error as any).details : undefined,
      error instanceof AppError ? error.statusCode : 500
    );
  }
  
  /**
   * Handle unknown errors
   * 
   * @param error The unknown error
   * @returns A Response object with the standardized format
   */
  static handleUnknownError(error: unknown): Response {
    console.error('Unhandled API error:', error);
    
    if (error instanceof AppError) {
      return this.fromError(error);
    }
    
    if (error instanceof Error) {
      return this.error(
        error.message,
        'INTERNAL_SERVER_ERROR',
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
        500
      );
    }
    
    return this.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}