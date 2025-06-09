import { NextRequest, NextResponse } from 'next/server';
import { getWalletAddressFromRequest } from '../../../lib/utils/authHelpers';
import vehicleQueries from '../../../lib/api/vehicleQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const walletAddress = searchParams.get('wallet') || getWalletAddressFromRequest(request);
    
    console.log(`GET /api/vehicle-videos - TokenID: ${tokenId}, Wallet: ${walletAddress}`);
    
    if (!tokenId) {
      console.error('TokenID is required');
      return NextResponse.json({
        success: false,
        error: 'Token ID is required'
      }, { status: 400 });
    }
    
    // Use vehicleQueriesV2 to get videos for the token ID
    console.log(`Fetching videos for token ID ${tokenId}`);
    const videos = await vehicleQueries.getVehicleVideos(tokenId);
    
    console.log(`Found ${videos?.length || 0} videos`);
    return NextResponse.json({
      success: true,
      data: videos,
      count: videos.length
    });
  } catch (error: any) {
    console.error('Error in GET /api/vehicle-videos:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    
    if (!tokenId) {
      console.error('TokenID is required');
      return NextResponse.json({
        success: false,
        error: 'Token ID is required'
      }, { status: 400 });
    }
    
    // Authenticate user
    const userWallet = searchParams.get('wallet') || getWalletAddressFromRequest(request);
    console.log(`POST /api/vehicle-videos - TokenID: ${tokenId}, User: ${userWallet}`);
    
    if (!userWallet) {
      console.error('Unauthorized - No wallet address found');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No wallet address found'
      }, { status: 401 });
    }
    
    // Check if the user is the owner of the vehicle
    const vehicleProfile = await vehicleQueries.getCompleteProfile(tokenId);
    if (!vehicleProfile) {
      return NextResponse.json({
        success: false,
        error: 'Vehicle not found',
        details: `No vehicle found with token ID ${tokenId}`
      }, { status: 404 });
    }
    
    // Verify ownership
    if (userWallet.toLowerCase() !== vehicleProfile.owner_wallet.toLowerCase()) {
      console.error(`Unauthorized video upload attempt for token ID ${tokenId}. Requester: ${userWallet}, Owner: ${vehicleProfile.owner_wallet}`);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Only the vehicle owner can add videos for this vehicle'
      }, { status: 403 });
    }
    
    // Parse the request body
    const videoData = await request.json();
    
    // Validate the video data
    if (!videoData.title || !videoData.youtube_url) {
      return NextResponse.json({
        success: false,
        error: 'Title and YouTube URL are required'
      }, { status: 400 });
    }
    
    // Use vehicleQueries to add the video
    const newVideo = await vehicleQueries.addVideo(
      tokenId,
      {
        title: videoData.title,
        youtube_url: videoData.youtube_url,
        description: videoData.description
      },
      userWallet
    );
    
    if (!newVideo) {
      return NextResponse.json({
        success: false,
        error: 'Failed to add video'
      }, { status: 500 });
    }
    
    console.log(`Video added successfully: ${JSON.stringify(newVideo)}`);
    return NextResponse.json({
      success: true,
      data: newVideo
    });
  } catch (error: any) {
    console.error('Error in POST /api/vehicle-videos:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');
    
    if (!videoId) {
      console.error('Video ID is required');
      return NextResponse.json({
        success: false,
        error: 'Video ID is required'
      }, { status: 400 });
    }
    
    // Authenticate user
    const userWallet = searchParams.get('wallet') || getWalletAddressFromRequest(request);
    console.log(`DELETE /api/vehicle-videos - VideoID: ${videoId}, User: ${userWallet}`);
    
    if (!userWallet) {
      console.error('Unauthorized - No wallet address found');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No wallet address found'
      }, { status: 401 });
    }
    
    // Get the Supabase client
    const client = await import('../../../lib/supabase').then(m => m.getSupabaseClient(true));
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 500 });
    }
    
    // First, get the video record to check ownership
    const { data: videoRecord, error: videoError } = await client
      .from('vehicle_videos')
      .select('*, vehicle_profiles!inner(token_id, owner_wallet)')
      .eq('id', videoId)
      .single();
    
    if (videoError) {
      console.error('Error fetching video record:', videoError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch video record',
        details: videoError.message
      }, { status: 500 });
    }
    
    if (!videoRecord) {
      return NextResponse.json({
        success: false,
        error: 'Video not found',
        details: `No video found with ID ${videoId}`
      }, { status: 404 });
    }
    
    // Verify ownership
    if (userWallet.toLowerCase() !== videoRecord.vehicle_profiles.owner_wallet.toLowerCase()) {
      console.error(`Unauthorized video delete attempt for ID ${videoId}. Requester: ${userWallet}, Owner: ${videoRecord.vehicle_profiles.owner_wallet}`);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Only the vehicle owner can delete this video'
      }, { status: 403 });
    }
    
    // Use vehicleQueriesV2 to delete the video
    const success = await vehicleQueries.deleteVideo(videoId, userWallet);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete video'
      }, { status: 500 });
    }
    
    console.log(`Video deleted successfully`);
    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/vehicle-videos:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}