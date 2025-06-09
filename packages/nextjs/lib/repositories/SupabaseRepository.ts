import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from './BaseRepository';
import { getSupabaseClient } from '../supabase';

/**
 * Base Supabase Repository
 * Implements common database operations using Supabase
 */
export abstract class SupabaseRepository<T, ID> implements BaseRepository<T, ID> {
  protected client: SupabaseClient;
  protected tableName: string;
  
  /**
   * Constructor
   * @param tableName The database table name
   * @param useServiceRole Whether to use the service role for admin privileges
   */
  constructor(tableName: string, useServiceRole = true) {
    const client = getSupabaseClient(useServiceRole);
    this.tableName = tableName;
    
    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    this.client = client;
  }
  
  /**
   * Get the ID column name for the table
   * Override this in subclasses if the ID column is not 'id'
   */
  protected getIdColumn(): string {
    return 'id';
  }
  
  /**
   * Get additional select columns for related data
   * Override this in subclasses to include related data
   */
  protected getSelectQuery(): string {
    return '*';
  }
  
  /**
   * Find an entity by its ID
   * @param id The entity ID
   * @returns The entity or null if not found
   */
  async findById(id: ID): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(this.getSelectQuery())
        .eq(this.getIdColumn(), id)
        .maybeSingle();
      
      if (error) throw error;
      return data as T;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error);
      return null;
    }
  }
  
  /**
   * Find all entities
   * @param options Optional query parameters
   * @returns Array of entities
   */
  async findAll(options?: any): Promise<T[]> {
    try {
      let query = this.client
        .from(this.tableName)
        .select(this.getSelectQuery());
      
      // Apply filters if provided
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }
      
      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? false 
        });
      } else {
        // Default ordering by created_at desc
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as T[];
    } catch (error) {
      console.error(`Error finding all ${this.tableName}:`, error);
      return [];
    }
  }
  
  /**
   * Create a new entity
   * @param data The entity data
   * @returns The created entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const { data: createdData, error } = await this.client
        .from(this.tableName)
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return createdData as T;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing entity
   * @param id The entity ID
   * @param data The updated entity data
   * @returns The updated entity
   */
  async update(id: ID, data: Partial<T>): Promise<T | null> {
    try {
      const { data: updatedData, error } = await this.client
        .from(this.tableName)
        .update(data)
        .eq(this.getIdColumn(), id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData as T;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return null;
    }
  }
  
  /**
   * Delete an entity by its ID
   * @param id The entity ID
   * @returns True if deleted, false otherwise
   */
  async delete(id: ID): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq(this.getIdColumn(), id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return false;
    }
  }
}