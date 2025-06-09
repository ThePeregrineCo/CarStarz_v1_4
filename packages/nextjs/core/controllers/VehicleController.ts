/**
 * Vehicle Controller
 * 
 * This controller handles API requests related to vehicles.
 * It uses the VehicleService for business logic.
 */

import { NextRequest } from 'next/server';
import { VehicleService } from '../services/VehicleService';
import { ApiResponse } from '../../lib/api/response';
import { validateRequest } from '../../lib/api/validation';
import {
  vehicleProfileSchema,
  vehicleUpdateSchema,
  // vehicleMediaSchema, // Commented out unused import
  VehicleProfileInput,
  VehicleUpdateInput
} from '../../lib/api/validation';
import { requireAuth } from '../../lib/utils/authHelpers';
import { 
  NotFoundError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  DatabaseError 
} from '../errors';

export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}
  
  /**
   * Get a vehicle by token ID
   */
  async getVehicleByTokenId(request: NextRequest, { params }: { params: { tokenId: string } }) {
    try {
      const { tokenId } = params;
      
      const vehicle = await this.vehicleService.getVehicleByTokenId(tokenId);
      
      return ApiResponse.success(vehicle);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get all vehicles with optional filtering
   */
  async getAllVehicles(request: NextRequest) {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const make = url.searchParams.get('make') || undefined;
      const model = url.searchParams.get('model') || undefined;
      const yearParam = url.searchParams.get('year');
      const year = yearParam ? parseInt(yearParam, 10) : undefined;
      const ownerWallet = url.searchParams.get('owner') || undefined;
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : undefined;
      const offsetParam = url.searchParams.get('offset');
      const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;
      
      const vehicles = await this.vehicleService.getAllVehicles({
        make,
        model,
        year,
        ownerWallet,
        limit,
        offset
      });
      
      return ApiResponse.success(vehicles);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Create a new vehicle profile
   */
  async createVehicle(request: NextRequest) {
    try {
      // Require authentication
      const walletAddress = requireAuth(request);
      
      // Validate request body
      const data = await validateRequest<VehicleProfileInput>(request, vehicleProfileSchema);
      
      // Ensure the owner wallet matches the authenticated user
      if (data.ownerWallet.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new AuthorizationError('You can only create vehicles for your own wallet');
      }
      
      // Create the vehicle
      const vehicle = await this.vehicleService.createVehicle(data);
      
      return ApiResponse.success(vehicle, 201);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Update an existing vehicle profile
   */
  async updateVehicle(request: NextRequest, { params }: { params: { tokenId: string } }) {
    try {
      // Require authentication
      const walletAddress = requireAuth(request);
      
      const { tokenId } = params;
      
      // Validate request body
      const data = await validateRequest<VehicleUpdateInput>(request, vehicleUpdateSchema);
      
      // Update the vehicle
      const success = await this.vehicleService.updateVehicle(tokenId, data, walletAddress);
      
      return ApiResponse.success({ success });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Add media to a vehicle
   */
  async addMedia(request: NextRequest, { params }: { params: { tokenId: string } }) {
    try {
      // Require authentication
      const walletAddress = requireAuth(request);
      
      const { tokenId } = params;
      
      // Parse the form data
      const formData = await request.formData();
      
      // We're not validating these fields explicitly, but they're used by the service
      // const caption = formData.get('caption') as string;
      // const category = formData.get('category') as string;
      // const isFeatured = formData.get('is_featured') === 'true';
      
      // Validate the file
      const file = formData.get('file') as File;
      if (!file) {
        throw new ValidationError('No file provided');
      }
      
      // Add the media
      const media = await this.vehicleService.addMedia(tokenId, formData, walletAddress);
      
      return ApiResponse.success(media, 201);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get media for a vehicle
   */
  async getMedia(request: NextRequest, { params }: { params: { tokenId: string } }) {
    try {
      const { tokenId } = params;
      
      const media = await this.vehicleService.getMedia(tokenId);
      
      return ApiResponse.success(media);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Delete media
   */
  async deleteMedia(request: NextRequest, { params }: { params: { mediaId: string } }) {
    try {
      // Require authentication
      const walletAddress = requireAuth(request);
      
      const { mediaId } = params;
      
      // Delete the media
      const success = await this.vehicleService.deleteMedia(mediaId, walletAddress);
      
      return ApiResponse.success({ success });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Handle errors
   */
  private handleError(error: unknown) {
    console.error('Vehicle controller error:', error);
    
    if (error instanceof NotFoundError) {
      return ApiResponse.error(error.message, error.code, undefined, 404);
    }
    
    if (error instanceof ValidationError) {
      return ApiResponse.error(error.message, error.code, error.details, 400);
    }
    
    if (error instanceof AuthenticationError) {
      return ApiResponse.error(error.message, error.code, undefined, 401);
    }
    
    if (error instanceof AuthorizationError) {
      return ApiResponse.error(error.message, error.code, undefined, 403);
    }
    
    if (error instanceof DatabaseError) {
      return ApiResponse.error(error.message, error.code, undefined, 500);
    }
    
    // Default error handling
    return ApiResponse.error(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}