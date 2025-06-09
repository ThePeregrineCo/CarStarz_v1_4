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
 * DELETE /api/vehicles/media/[mediaId]
 * Delete media
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  try {
    return await vehicleController.deleteMedia(request, { params });
  } catch (error) {
    console.error('Error in DELETE /api/vehicles/media/[mediaId]:', error);
    return ApiResponse.error(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      undefined,
      500
    );
  }
}