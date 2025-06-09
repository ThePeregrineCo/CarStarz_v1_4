import { NextResponse } from 'next/server';
import { getWalletAddressFromRequest } from '../../../lib/utils/authHelpers';
import { vehicleService } from '../../../lib/services/VehicleService';
import { VehicleProfile, VehicleSearchOptions } from '../../../lib/models/VehicleProfile';

/**
 * GET /api/vehicle-profiles
 * Get vehicle profiles
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');
  
  // Extract search parameters
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
  const owner = searchParams.get('owner');
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

  try {
    if (tokenId) {
      // Get a single profile
      const profile = await vehicleService.getVehicleByTokenId(tokenId);
      
      if (!profile) {
        return NextResponse.json({
          error: 'Vehicle profile not found',
          details: `No vehicle profile found with token ID ${tokenId}`
        }, { status: 404 });
      }
      
      return NextResponse.json(profile);
    }
    
    // Build search options
    const searchOptions: VehicleSearchOptions = {
      make: make || undefined,
      model: model || undefined,
      year,
      owner_wallet: owner || undefined,
      limit,
      offset
    };
    
    // Get all profiles with search options
    const profiles = await vehicleService.searchVehicles(searchOptions);
    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error('Failed to fetch vehicle profiles:', error);
    return NextResponse.json({
      error: 'Failed to fetch vehicle profiles',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

/**
 * POST /api/vehicle-profiles
 * Create a new vehicle profile
 */
export async function POST(request: Request) {
  try {
    // Get the wallet address from the request
    const walletAddress = getWalletAddressFromRequest(request);
    if (!walletAddress) {
      return NextResponse.json({
        error: 'Authentication required',
        details: 'You must be authenticated to create a vehicle profile'
      }, { status: 401 });
    }
    
    const data = await request.json();
    
    if (!data.token_id) {
      return NextResponse.json({
        error: 'Missing token_id in request body'
      }, { status: 400 });
    }
    
    // Create the vehicle profile using the service
    const newProfile = await vehicleService.createVehicle(data, walletAddress);
    
    return NextResponse.json({
      success: true,
      data: newProfile
    });
  } catch (error: any) {
    console.error('Failed to create vehicle profile:', error);
    
    // Handle specific error cases
    if (error.message?.includes('duplicate')) {
      return NextResponse.json({
        error: 'Duplicate vehicle profile',
        details: 'A vehicle with this token ID already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      error: 'Failed to create vehicle profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

/**
 * PATCH /api/vehicle-profiles?tokenId=123
 * Update a vehicle profile
 */
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return NextResponse.json({
      error: 'Missing tokenId parameter'
    }, { status: 400 });
  }

  try {
    // Get the wallet address from the request
    const walletAddress = getWalletAddressFromRequest(request);
    if (!walletAddress) {
      return NextResponse.json({
        error: 'Authentication required',
        details: 'You must be authenticated to update a vehicle profile'
      }, { status: 401 });
    }
    
    // Parse the update data
    const updates = await request.json();
    
    // Ensure the data format is correct
    if (typeof updates !== 'object' || updates === null) {
      return NextResponse.json({
        error: 'Invalid update data',
        details: 'Update data must be a valid JSON object'
      }, { status: 400 });
    }
    
    try {
      // Update the vehicle profile using the service
      const updatedProfile = await vehicleService.updateVehicle(
        tokenId,
        updates as Partial<VehicleProfile>,
        walletAddress
      );
      
      if (!updatedProfile) {
        return NextResponse.json({
          error: 'Vehicle profile not found',
          details: `No vehicle profile found with token ID ${tokenId}`
        }, { status: 404 });
      }
      
      // Fetch the complete updated profile
      const completeProfile = await vehicleService.getVehicleByTokenId(tokenId);
      
      return NextResponse.json({
        success: true,
        message: `Vehicle profile with token ID ${tokenId} updated successfully`,
        data: completeProfile
      });
    } catch (updateError: any) {
      // Handle specific error cases
      if (updateError.message?.includes('Only the vehicle owner')) {
        return NextResponse.json({
          error: 'Unauthorized',
          details: 'Only the vehicle owner can update this profile'
        }, { status: 403 });
      }
      
      console.error(`Error during update operation for token ID ${tokenId}:`, updateError);
      return NextResponse.json({
        error: 'Failed to update vehicle profile',
        details: updateError?.message || String(updateError)
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error updating vehicle profile for token ID ${tokenId}:`, error);
    return NextResponse.json({
      error: 'Failed to update vehicle profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

/**
 * DELETE /api/vehicle-profiles?tokenId=123
 * Delete a vehicle profile (not implemented)
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return NextResponse.json({
      error: 'Missing tokenId parameter'
    }, { status: 400 });
  }

  try {
    // Get the wallet address from the request
    const walletAddress = getWalletAddressFromRequest(request);
    if (!walletAddress) {
      return NextResponse.json({
        error: 'Authentication required',
        details: 'You must be authenticated to delete a vehicle profile'
      }, { status: 401 });
    }
    
    // First check if the vehicle profile exists
    const existingProfile = await vehicleService.getVehicleByTokenId(tokenId);
    if (!existingProfile) {
      return NextResponse.json({
        error: 'Vehicle profile not found',
        details: `No vehicle profile found with token ID ${tokenId}`
      }, { status: 404 });
    }
    
    // Normalize the wallet address for comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Check if the authenticated user is the owner of the vehicle
    if (normalizedWalletAddress !== existingProfile.owner_wallet.toLowerCase()) {
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'Only the vehicle owner can delete this profile'
      }, { status: 403 });
    }
    
    // We don't have a delete method, but we could implement one if needed
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Delete operation not implemented'
    });
  } catch (error: any) {
    console.error(`Error deleting vehicle profile for token ID ${tokenId}:`, error);
    return NextResponse.json({
      error: 'Failed to delete vehicle profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}