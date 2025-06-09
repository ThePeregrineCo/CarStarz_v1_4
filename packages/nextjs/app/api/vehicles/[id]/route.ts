/**
 * Vehicle API Routes
 * 
 * This file implements the API routes for vehicle operations.
 * It uses the VehicleController to handle requests.
 */

import { NextRequest } from 'next/server';
import { container } from '../../../../infrastructure/di/container';
import { VehicleController } from '../../../../core/controllers/VehicleController';
import { ApiResponse } from '../../../../lib/api/response';

// Get the vehicle controller from the container
const vehicleController = container.resolve<VehicleController>('vehicleController');

/**
 * GET /api/vehicles/[id]
 * Get a vehicle by token ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Pass the id as tokenId to maintain compatibility with the controller
    return await vehicleController.getVehicleByTokenId(request, { 
      params: { tokenId: params.id } 
    });
  } catch (error) {
    console.error('Error in GET /api/vehicles/[id]:', error);
    return ApiResponse.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}

/**
 * PUT /api/vehicles/[id]
 * Update a vehicle
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Pass the id as tokenId to maintain compatibility with the controller
    return await vehicleController.updateVehicle(request, { 
      params: { tokenId: params.id } 
    });
  } catch (error) {
    console.error('Error in PUT /api/vehicles/[id]:', error);
    return ApiResponse.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}