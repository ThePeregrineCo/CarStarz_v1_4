/**
 * Dependency Injection Container
 * 
 * This file provides a simple dependency injection container
 * to wire up the application's dependencies.
 */

import { getSupabaseClient } from '../database/supabaseClient';
import { SupabaseVehicleRepository } from '../database/repositories/SupabaseVehicleRepository';
import { VehicleService } from '../../core/services/VehicleService';
import { VehicleController } from '../../core/controllers/VehicleController';

/**
 * Container class for dependency injection
 */
class Container {
  private instances: Map<string, any> = new Map();
  
  /**
   * Register an instance with the container
   */
  register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }
  
  /**
   * Resolve an instance from the container
   */
  resolve<T>(key: string): T {
    const instance = this.instances.get(key);
    
    if (!instance) {
      throw new Error(`No instance registered for key: ${key}`);
    }
    
    return instance as T;
  }
  
  /**
   * Initialize the container with all dependencies
   */
  initialize(): void {
    // Initialize database client
    const supabaseClient = getSupabaseClient(true);
    
    // Initialize repositories
    const vehicleRepository = new SupabaseVehicleRepository(supabaseClient);
    
    // Initialize services
    const vehicleService = new VehicleService(vehicleRepository);
    
    // Initialize controllers
    const vehicleController = new VehicleController(vehicleService);
    
    // Register instances
    this.register('supabaseClient', supabaseClient);
    this.register('vehicleRepository', vehicleRepository);
    this.register('vehicleService', vehicleService);
    this.register('vehicleController', vehicleController);
  }
}

// Create and initialize the container
const container = new Container();

try {
  container.initialize();
  console.log('Dependency injection container initialized successfully');
} catch (error) {
  console.error('Error initializing dependency injection container:', error);
}

export { container };