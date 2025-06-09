import { NextResponse } from 'next/server'
import vehicleQueries from '../../../lib/api/vehicleQueries'
import { getWalletAddressFromRequest } from '../../../lib/utils/authHelpers'

// GET /api/vehicle-media?vehicleId=123 or /api/vehicle-media?tokenId=123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const tokenId = searchParams.get('tokenId')

  if (!vehicleId && !tokenId) {
    return NextResponse.json({ error: 'Missing vehicleId or tokenId parameter' }, { status: 400 })
  }

  try {
    if (tokenId) {
      console.log(`Fetching media for token ID ${tokenId}`);
      
      // Use vehicleQueriesV2 to get media for the token ID
      const media = await vehicleQueries.getVehicleMedia(tokenId);
      console.log(`Found ${media?.length || 0} media items for token ID ${tokenId}`);
      
      return NextResponse.json({
        success: true,
        data: media,
        count: media.length
      });
    } else if (vehicleId) {
      // This branch is kept for backward compatibility
      console.log(`Fetching media for vehicle ID ${vehicleId} (legacy mode)`);
      
      // For direct vehicleId access, we need to find the token ID first
      // This is a temporary solution until all clients are updated
      return NextResponse.json({
        error: 'Direct vehicleId access is deprecated. Please use tokenId instead.'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Failed to fetch media:', error);
    return NextResponse.json({
      error: 'Failed to fetch media',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// POST /api/vehicle-media
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tokenId = formData.get('tokenId');
    const userWallet = getWalletAddressFromRequest(request) || formData.get('user_wallet')?.toString();
    
    if (!tokenId) {
      return NextResponse.json({
        success: false,
        error: 'Missing tokenId in form data'
      }, { status: 400 });
    }
    
    if (!userWallet) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        details: 'You must be authenticated to upload media'
      }, { status: 401 });
    }
    
    // Check if the user is the owner of the vehicle
    const vehicleProfile = await vehicleQueries.getCompleteProfile(tokenId.toString());
    if (!vehicleProfile) {
      return NextResponse.json({
        success: false,
        error: 'Vehicle not found',
        details: `No vehicle found with token ID ${tokenId}`
      }, { status: 404 });
    }
    
    // Verify ownership
    if (userWallet.toLowerCase() !== vehicleProfile.owner_wallet.toLowerCase()) {
      console.error(`Unauthorized media upload attempt for token ID ${tokenId}. Requester: ${userWallet}, Owner: ${vehicleProfile.owner_wallet}`);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Only the vehicle owner can upload media for this vehicle'
      }, { status: 403 });
    }
    
    console.log(`Processing media upload for token ID ${tokenId}`);
    
    // Add user wallet to form data for audit logging
    if (userWallet && !formData.has('user_wallet')) {
      formData.append('user_wallet', userWallet);
    }
    
    // Use vehicleQueriesV2 to add media
    const newMedia = await vehicleQueries.addMedia(tokenId.toString(), formData);
    
    if (!newMedia) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload media'
      }, { status: 500 });
    }
    
    console.log(`Media upload successful for token ID ${tokenId}:`, newMedia);
    
    return NextResponse.json({
      success: true,
      data: newMedia
    });
  } catch (error: any) {
    console.error('Failed to create media:', error);
    return NextResponse.json({
      error: 'Failed to create media',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

// PATCH /api/vehicle-media?id=123
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const userWallet = getWalletAddressFromRequest(request);

  if (!id) {
    return NextResponse.json({
      success: false,
      error: 'Missing id parameter'
    }, { status: 400 })
  }

  if (!userWallet) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required',
      details: 'You must be authenticated to update media'
    }, { status: 401 });
  }

  try {
    const updates = await request.json()
    console.log(`Update media request for ID ${id} with data:`, updates);
    
    // Get the Supabase client
    const client = await import('../../../lib/supabase').then(m => m.getSupabaseClient(true));
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 500 });
    }
    
    // First, get the media record to check ownership
    const { data: mediaRecord, error: mediaError } = await client
      .from('vehicle_media')
      .select('*, vehicle_profiles!inner(token_id, owner_wallet)')
      .eq('id', id)
      .single();
    
    if (mediaError) {
      console.error('Error fetching media record:', mediaError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch media record',
        details: mediaError.message
      }, { status: 500 });
    }
    
    if (!mediaRecord) {
      return NextResponse.json({
        success: false,
        error: 'Media not found',
        details: `No media found with ID ${id}`
      }, { status: 404 });
    }
    
    // Verify ownership
    if (userWallet.toLowerCase() !== mediaRecord.vehicle_profiles.owner_wallet.toLowerCase()) {
      console.error(`Unauthorized media update attempt for ID ${id}. Requester: ${userWallet}, Owner: ${mediaRecord.vehicle_profiles.owner_wallet}`);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Only the vehicle owner can update this media'
      }, { status: 403 });
    }
    
    // Update the media record
    const { error } = await client
      .from('vehicle_media')
      .update({
        caption: updates.caption,
        category: updates.category,
        is_featured: updates.is_featured
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating media:', error);
      throw error;
    }
    
    // Get the updated record
    const { data: updatedMedia } = await client
      .from('vehicle_media')
      .select('*, vehicle_profiles!inner(token_id)')
      .eq('id', id)
      .single();
    
    if (updatedMedia && updatedMedia.vehicle_profiles) {
      // Log the action
      await vehicleQueries.logAction(
        updatedMedia.vehicle_profiles.token_id,
        'update_media',
        `Updated media: ${updates.caption || 'No caption'}`,
        userWallet
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedMedia
    });
  } catch (error: any) {
    console.error('Failed to update media:', error);
    return NextResponse.json({
      error: 'Failed to update media',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// DELETE /api/vehicle-media?id=123
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const userWallet = getWalletAddressFromRequest(request);

  if (!id) {
    return NextResponse.json({
      success: false,
      error: 'Missing id parameter'
    }, { status: 400 })
  }

  if (!userWallet) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required',
      details: 'You must be authenticated to delete media'
    }, { status: 401 });
  }

  try {
    console.log(`Deleting media with ID ${id}`);
    
    // Get the Supabase client
    const client = await import('../../../lib/supabase').then(m => m.getSupabaseClient(true));
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 500 });
    }
    
    // First, get the media record to check ownership
    const { data: mediaRecord, error: mediaError } = await client
      .from('vehicle_media')
      .select('*, vehicle_profiles!inner(token_id, owner_wallet)')
      .eq('id', id)
      .single();
    
    if (mediaError) {
      console.error('Error fetching media record:', mediaError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch media record',
        details: mediaError.message
      }, { status: 500 });
    }
    
    if (!mediaRecord) {
      return NextResponse.json({
        success: false,
        error: 'Media not found',
        details: `No media found with ID ${id}`
      }, { status: 404 });
    }
    
    // Verify ownership
    if (userWallet.toLowerCase() !== mediaRecord.vehicle_profiles.owner_wallet.toLowerCase()) {
      console.error(`Unauthorized media delete attempt for ID ${id}. Requester: ${userWallet}, Owner: ${mediaRecord.vehicle_profiles.owner_wallet}`);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Only the vehicle owner can delete this media'
      }, { status: 403 });
    }
    
    // Use vehicleQueriesV2 to delete media
    const success = await vehicleQueries.deleteMedia(id, userWallet);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete media'
      }, { status: 500 });
    }
    
    console.log(`Successfully deleted media with ID ${id}`);
    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete media:', error);
    return NextResponse.json({
      error: 'Failed to delete media',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}