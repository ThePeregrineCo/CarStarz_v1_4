/**
 * Supabase Client Utility
 * 
 * This file provides a centralized way to access the Supabase client.
 * It ensures that only one instance of the client is created and used
 * throughout the application.
 */

import { createClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../core/errors';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a Supabase client with the service role key if available
// This is used for API routes to bypass Row Level Security (RLS)
const serviceRoleClient = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

// Create a Supabase client with the anon key for client-side usage
const anonClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Get the appropriate Supabase client
 * 
 * @param useServiceRole Whether to use the service role client
 * @returns The Supabase client
 * @throws DatabaseError if the client is not available
 */
export function getSupabaseClient(useServiceRole = false) {
  // Check if we're on the client side
  const isClient = typeof window !== 'undefined';
  
  if (useServiceRole) {
    // Service role key should only be used on the server side
    if (isClient) {
      console.warn('Service role Supabase client not available on client side - use anon key instead');
      // Fall back to anon key on client side
      if (!anonClient) {
        throw new DatabaseError('Supabase client not available - missing environment variables');
      }
      return anonClient;
    }
    
    if (!serviceRoleClient) {
      throw new DatabaseError('Service role Supabase client not available - missing environment variables');
    }
    
    return serviceRoleClient;
  } else {
    if (!anonClient) {
      throw new DatabaseError('Anon Supabase client not available - missing environment variables');
    }
    
    return anonClient;
  }
}

/**
 * Create a mock client for testing
 * 
 * @returns A mock Supabase client
 */
export function createMockClient() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    from: (table: string) => ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      select: (columns?: string) => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        eq: (column: string, value: any) => ({
          single: async () => ({ data: null, error: null }),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          order: (column: string, options?: any) => ({ data: [], error: null }),
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        order: (column: string, options?: any) => ({ data: [], error: null }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      insert: (values: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        select: (columns?: string) => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      update: (values: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        eq: (column: string, value: any) => ({ error: null }),
      }),
      delete: () => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        eq: (column: string, value: any) => ({ error: null }),
      }),
    }),
    storage: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      from: (bucket: string) => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        upload: async (path: string, file: any) => ({ data: null, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
      }),
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rpc: (func: string, params?: any) => ({ data: null, error: null }),
  } as any;
}

/**
 * Unit of Work class for transaction management
 */
export class UnitOfWork {
  constructor(private readonly supabase = getSupabaseClient(true)) {}
  
  /**
   * Execute a callback within a transaction
   * 
   * @param callback The callback to execute
   * @returns The result of the callback
   */
  async transaction<T>(callback: (supabase: any) => Promise<T>): Promise<T> {
    try {
      // Start transaction
      // Note: Supabase doesn't have built-in transaction support yet,
      // so this is a placeholder for future implementation
      
      // Execute the callback
      const result = await callback(this.supabase);
      
      // Commit transaction
      return result;
    } catch (error) {
      // Rollback transaction
      throw error;
    }
  }
}