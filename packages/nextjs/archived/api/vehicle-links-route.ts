import { NextResponse } from 'next/server'
import vehicleQueries from '../../../lib/api/vehicleQueries'
import { getSupabaseClient } from '../../../lib/supabase'

// GET /api/vehicle-links?vehicleId=123 or /api/vehicle-links?tokenId=123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const tokenId = searchParams.get('tokenId')

  if (!vehicleId && !tokenId) {
    return NextResponse.json({ error: 'Missing vehicleId or tokenId parameter' }, { status: 400 })
  }

  try {
    if (tokenId) {
      console.log(`Fetching links for token ID ${tokenId}`);
      // First get the vehicle ID from the token ID
      const client = getSupabaseClient();
      if (!client) {
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
      }
      
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
        
      if (vehicleError) {
        console.error('Error fetching vehicle:', vehicleError);
        return NextResponse.json({ error: 'Error fetching vehicle' }, { status: 500 });
      }
      
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      
      console.log(`Fetching links for token ID ${tokenId}`);
      const links = await vehicleQueries.getVehicleLinks(tokenId);
      console.log(`Found ${links?.length || 0} links for token ID ${tokenId}`);
      return NextResponse.json(links);
    } else {
      // For vehicle ID, we need to get the token ID first
      console.log(`Fetching links for vehicle ID ${vehicleId}`);
      
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
      
      console.log(`Fetching links for token ID ${vehicle.token_id}`);
      const links = await vehicleQueries.getVehicleLinks(vehicle.token_id);
      console.log(`Found ${links?.length || 0} links for token ID ${vehicle.token_id}`);
      return NextResponse.json(links);
    }
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to fetch links: ${error.message}` }, { status: 500 })
  }
}

// POST /api/vehicle-links?tokenId=123
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const link = await request.json();
    
    if (!tokenId) {
      // For backward compatibility, convert vehicleId to tokenId
      if (link.vehicleId) {
        const { vehicleId, ...linkData } = link;
        
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
        
        console.log(`Adding link for token ID ${vehicle.token_id} (converted from vehicle ID ${vehicleId}):`, linkData);
        const newLink = await vehicleQueries.addLink(vehicle.token_id, linkData);
        console.log(`Link added successfully:`, newLink);
        return NextResponse.json(newLink);
      }
      
      return NextResponse.json({ error: 'Missing tokenId parameter in URL or vehicleId in body' }, { status: 400 });
    }
    
    console.log(`Adding link for token ID ${tokenId} (from URL):`, link);
    
    console.log(`Adding link for token ID ${tokenId}`);
    const newLink = await vehicleQueries.addLink(tokenId, link);
    console.log(`Link added successfully:`, newLink);
    return NextResponse.json(newLink);
  } catch (error: any) {
    console.error('Failed to create link:', error);
    return NextResponse.json({
      error: 'Failed to create link',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

// DELETE /api/vehicle-links?id=123
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    console.log(`Deleting link with ID ${id}`);
    
    console.log(`Deleting link for ID ${id}`);
    const success = await vehicleQueries.deleteLink(id);
    console.log(`Link deleted successfully: ${success}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete link:', error);
    return NextResponse.json({
      error: 'Failed to delete link',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}