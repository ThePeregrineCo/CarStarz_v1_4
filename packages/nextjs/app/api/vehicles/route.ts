/**
 * Vehicles API Routes
 * 
 * This file implements the API routes for vehicle operations.
 * It uses the VehicleController to handle requests.
 */

import { NextRequest } from 'next/server';
import { container } from '../../../infrastructure/di/container';
import { VehicleController } from '../../../core/controllers/VehicleController';
import { ApiResponse } from '../../../lib/api/response';

// Get the vehicle controller from the container
const vehicleController = container.resolve<VehicleController>('vehicleController');

/**
 * GET /api/vehicles
 * Get all vehicles with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    return await vehicleController.getAllVehicles(request);
  } catch (error) {
    console.error('Error in GET /api/vehicles:', error);
    return ApiResponse.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
export async function POST(request: NextRequest) {
  try {
    return await vehicleController.createVehicle(request);
  } catch (error) {
    console.error('Error in POST /api/vehicles:', error);
    return ApiResponse.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}