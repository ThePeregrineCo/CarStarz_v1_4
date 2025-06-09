import { NextResponse } from 'next/server'
import vehicleQueries from '../../../lib/api/vehicleQueries'
import { getSupabaseClient } from '../../../lib/supabase'

// GET /api/vehicle-comments?vehicleId=123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const tokenId = searchParams.get('tokenId')

  if (!vehicleId && !tokenId) {
    return NextResponse.json({ error: 'Missing vehicleId or tokenId parameter' }, { status: 400 })
  }

  try {
    if (tokenId) {
      console.log(`Fetching comments for token ID ${tokenId}`);
      const comments = await vehicleQueries.getVehicleComments(tokenId);
      console.log(`Found ${comments?.length || 0} comments for token ID ${tokenId}`);
      return NextResponse.json(comments);
    } else {
      // For vehicle ID, we need to get the token ID first
      console.log(`Fetching comments for vehicle ID ${vehicleId}`);
      
      // Get token ID from vehicle ID
      const client = getSupabaseClient();
      if (!client) {
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
      }
      
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('token_id')
        .eq('id', vehicleId)
        .maybeSingle();
        
      if (vehicleError) {
        console.error('Error fetching vehicle:', vehicleError);
        return NextResponse.json({ error: 'Error fetching vehicle' }, { status: 500 });
      }
      
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      
      console.log(`Fetching comments for token ID ${vehicle.token_id}`);
      const comments = await vehicleQueries.getVehicleComments(vehicle.token_id);
      console.log(`Found ${comments?.length || 0} comments for token ID ${vehicle.token_id}`);
      return NextResponse.json(comments);
    }
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to fetch comments: ${error.message}` }, { status: 500 })
  }
}

// POST /api/vehicle-comments?tokenId=123
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const comment = await request.json();
    
    if (!tokenId) {
      // For backward compatibility, convert vehicleId to tokenId
      if (comment.vehicleId) {
        const { vehicleId, ...commentData } = comment;
        
        // Get token ID from vehicle ID
        const client = getSupabaseClient();
        if (!client) {
          return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
        }
        
        const { data: vehicle, error: vehicleError } = await client
          .from('vehicle_profiles')
          .select('token_id')
          .eq('id', vehicleId)
          .maybeSingle();
          
        if (vehicleError) {
          console.error('Error fetching vehicle:', vehicleError);
          return NextResponse.json({ error: 'Error fetching vehicle' }, { status: 500 });
        }
        
        if (!vehicle) {
          return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }
        
        console.log(`Adding comment for token ID ${vehicle.token_id} (converted from vehicle ID ${vehicleId}):`, commentData);
        const newComment = await vehicleQueries.addComment(vehicle.token_id, commentData);
        console.log(`Comment added successfully:`, newComment);
        return NextResponse.json(newComment);
      }
      
      return NextResponse.json({ error: 'Missing tokenId parameter in URL or vehicleId in body' }, { status: 400 });
    }
    
    console.log(`Adding comment for token ID ${tokenId} (from URL):`, comment);
    console.log(`Adding comment for token ID ${tokenId}`);
    // Check the structure of the comment object
    const commentData = {
      content: comment.content,
      user_wallet: comment.user_wallet
    };
    const newComment = await vehicleQueries.addComment(tokenId, commentData);
    console.log(`Comment added successfully:`, newComment);
    return NextResponse.json(newComment);
  } catch (error: any) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({
      error: 'Failed to create comment',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

// DELETE /api/vehicle-comments?id=123
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    console.log(`Deleting comment with ID ${id}`);
    
    console.log(`Deleting comment for ID ${id}`);
    const success = await vehicleQueries.deleteComment(id);
    console.log(`Comment deleted successfully: ${success}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({
      error: 'Failed to delete comment',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}