/**
 * Base Repository Interface
 * Defines the common operations that all repositories should implement
 */
export interface BaseRepository<T, ID> {
  /**
   * Find an entity by its ID
   * @param id The entity ID
   * @returns The entity or null if not found
   */
  findById(id: ID): Promise<T | null>;
  
  /**
   * Find all entities
   * @param options Optional query parameters
   * @returns Array of entities
   */
  findAll(options?: any): Promise<T[]>;
  
  /**
   * Create a new entity
   * @param data The entity data
   * @returns The created entity
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update an existing entity
   * @param id The entity ID
   * @param data The updated entity data
   * @returns The updated entity
   */
  update(id: ID, data: Partial<T>): Promise<T | null>;
  
  /**
   * Delete an entity by its ID
   * @param id The entity ID
   * @returns True if deleted, false otherwise
   */
  delete(id: ID): Promise<boolean>;
}