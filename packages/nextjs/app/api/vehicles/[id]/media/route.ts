/**
 * Vehicle Media API Routes
 * 
 * This file implements the API routes for vehicle media operations.
 * It uses the VehicleController to handle requests.
 */

import { NextRequest } from 'next/server';
import { container } from '../../../../../infrastructure/di/container';
import { VehicleController } from '../../../../../core/controllers/VehicleController';
import { ApiResponse } from '../../../../../lib/api/response';

// Get the vehicle controller from the container
const vehicleController = container.resolve<VehicleController>('vehicleController');

/**
 * GET /api/vehicles/[id]/media
 * Get media for a vehicle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Pass the id as tokenId to maintain compatibility with the controller
    return await vehicleController.getMedia(request, { 
      params: { tokenId: params.id } 
    });
  } catch (error) {
    console.error('Error in GET /api/vehicles/[id]/media:', error);
    return ApiResponse.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}

/**
 * POST /api/vehicles/[id]/media
 * Add media to a vehicle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Pass the id as tokenId to maintain compatibility with the controller
    return await vehicleController.addMedia(request, { 
      params: { tokenId: params.id } 
    });
  } catch (error) {
    console.error('Error in POST /api/vehicles/[id]/media:', error);
    return ApiResponse.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}