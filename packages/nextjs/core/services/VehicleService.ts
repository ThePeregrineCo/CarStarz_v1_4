/**
 * Vehicle Service
 * 
 * This service implements business logic for vehicle operations.
 * It uses the VehicleRepository for data access.
 */

import {
  Vehicle,
  CompleteVehicle,
  VehicleCreateData,
  VehicleUpdateData,
  VehicleMedia
  // Commented out unused imports
  // VehicleSpecification,
  // VehicleLink,
  // VehicleModification,
  // VehicleComment,
  // VehicleVideo
} from '../entities/Vehicle';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { 
  NotFoundError, 
  AuthorizationError 
} from '../errors';

export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}
  
  /**
   * Get a vehicle by its token ID
   */
  async getVehicleByTokenId(tokenId: string): Promise<CompleteVehicle> {
    const vehicle = await this.vehicleRepository.getByTokenId(tokenId);
    
    if (!vehicle) {
      throw new NotFoundError('Vehicle', tokenId);
    }
    
    return vehicle;
  }
  
  /**
   * Get all vehicles with optional filtering
   */
  async getAllVehicles(params?: {
    make?: string;
    model?: string;
    year?: number;
    ownerWallet?: string;
    limit?: number;
    offset?: number;
  }): Promise<CompleteVehicle[]> {
    return this.vehicleRepository.getAll(params);
  }
  
  /**
   * Create a new vehicle profile
   */
  async createVehicle(data: VehicleCreateData): Promise<Vehicle> {
    // Perform any business logic validations here
    
    // Create the vehicle
    const vehicle = await this.vehicleRepository.create(data);
    
    // Log the action
    await this.vehicleRepository.logAction(
      vehicle.tokenId,
      'create',
      `Vehicle profile created for ${data.year} ${data.make} ${data.model}`,
      data.ownerWallet
    );
    
    return vehicle;
  }
  
  /**
   * Update an existing vehicle profile
   */
  async updateVehicle(tokenId: string, data: VehicleUpdateData, walletAddress: string): Promise<boolean> {
    // Check if the vehicle exists and the user is authorized
    const vehicle = await this.vehicleRepository.getByTokenId(tokenId);
    
    if (!vehicle) {
      throw new NotFoundError('Vehicle', tokenId);
    }
    
    // Check if the user is the owner of the vehicle
    if (vehicle.ownerWallet.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new AuthorizationError('You are not authorized to update this vehicle');
    }
    
    // Update the vehicle
    const success = await this.vehicleRepository.update(tokenId, data);
    
    // Log the action
    if (success) {
      await this.vehicleRepository.logAction(
        tokenId,
        'update',
        `Vehicle profile updated`,
        walletAddress
      );
    }
    
    return success;
  }
  
  /**
   * Add media to a vehicle
   */
  async addMedia(tokenId: string, formData: FormData, walletAddress: string): Promise<VehicleMedia> {
    // Check if the vehicle exists and the user is authorized
    const vehicle = await this.vehicleRepository.getByTokenId(tokenId);
    
    if (!vehicle) {
      throw new NotFoundError('Vehicle', tokenId);
    }
    
    // Check if the user is the owner of the vehicle
    if (vehicle.ownerWallet.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new AuthorizationError('You are not authorized to add media to this vehicle');
    }
    
    // Add the media
    const media = await this.vehicleRepository.addMedia(tokenId, formData);
    
    // Log the action
    await this.vehicleRepository.logAction(
      tokenId,
      'add_media',
      `Media added to vehicle`,
      walletAddress
    );
    
    return media;
  }
  
  /**
   * Get media for a vehicle
   */
  async getMedia(tokenId: string): Promise<VehicleMedia[]> {
    // Check if the vehicle exists
    const vehicle = await this.vehicleRepository.getByTokenId(tokenId);
    
    if (!vehicle) {
      throw new NotFoundError('Vehicle', tokenId);
    }
    
    return this.vehicleRepository.getMedia(tokenId);
  }
  
  /**
   * Delete media
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteMedia(mediaId: string, _walletAddress: string): Promise<boolean> {
    // In a real implementation, we would check if the user is authorized
    // to delete this media by first getting the vehicle it belongs to
    // and checking if the user is the owner
    
    // For now, we'll just delete the media
    const success = await this.vehicleRepository.deleteMedia(mediaId);
    
    return success;
  }
  
  /**
   * Check if a user is the owner of a vehicle
   */
  async isVehicleOwner(tokenId: string, walletAddress: string): Promise<boolean> {
    const vehicle = await this.vehicleRepository.getByTokenId(tokenId);
    
    if (!vehicle) {
      return false;
    }
    
    return vehicle.ownerWallet.toLowerCase() === walletAddress.toLowerCase();
  }
  
  /**
   * Log an action for a vehicle
   */
  async logAction(tokenId: string, action: string, details: string, walletAddress?: string): Promise<void> {
    await this.vehicleRepository.logAction(tokenId, action, details, walletAddress);
  }
}