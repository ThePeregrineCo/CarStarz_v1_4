import { NextResponse } from 'next/server'
import vehicleQueries from '../../../lib/api/vehicleQueries'
import { getSupabaseClient } from '../../../lib/supabase'

// GET /api/vehicle-specifications?vehicleId=123 or /api/vehicle-specifications?tokenId=123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const tokenId = searchParams.get('tokenId')

  if (!vehicleId && !tokenId) {
    return NextResponse.json({ error: 'Missing vehicleId or tokenId parameter' }, { status: 400 })
  }

  try {
    if (tokenId) {
      console.log(`Fetching specifications for token ID ${tokenId}`);
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
      
      console.log(`Fetching specifications for token ID ${tokenId}`);
      const specifications = await vehicleQueries.getVehicleSpecifications(tokenId);
      console.log(`Found ${specifications?.length || 0} specifications for token ID ${tokenId}`);
      return NextResponse.json(specifications);
    } else {
      // For vehicle ID, we need to get the token ID first
      console.log(`Fetching specifications for vehicle ID ${vehicleId}`);
      
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
      
      console.log(`Fetching specifications for token ID ${vehicle.token_id}`);
      const specifications = await vehicleQueries.getVehicleSpecifications(vehicle.token_id);
      console.log(`Found ${specifications?.length || 0} specifications for token ID ${vehicle.token_id}`);
      return NextResponse.json(specifications);
    }
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to fetch specifications: ${error.message}` }, { status: 500 })
  }
}

// POST /api/vehicle-specifications?tokenId=123
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const spec = await request.json();
    
    if (!tokenId) {
      // For backward compatibility, convert vehicleId to tokenId
      if (spec.vehicleId) {
        const { vehicleId, ...specData } = spec;
        
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
        
        console.log(`Adding specification for token ID ${vehicle.token_id} (converted from vehicle ID ${vehicleId}):`, specData);
        const newSpecification = await vehicleQueries.addSpecification(vehicle.token_id, specData);
        console.log(`Specification added successfully:`, newSpecification);
        return NextResponse.json(newSpecification);
      }
      
      return NextResponse.json({ error: 'Missing tokenId parameter in URL or vehicleId in body' }, { status: 400 });
    }
    
    console.log(`Adding specification for token ID ${tokenId} (from URL):`, spec);
    console.log(`Adding specification for token ID ${tokenId}`);
    const newSpecification = await vehicleQueries.addSpecification(tokenId, spec);
    console.log(`Specification added successfully:`, newSpecification);
    return NextResponse.json(newSpecification);
  } catch (error: any) {
    console.error('Failed to create specification:', error);
    return NextResponse.json({
      error: 'Failed to create specification',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

// DELETE /api/vehicle-specifications?id=123
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    console.log(`Deleting specification with ID ${id}`);
    
    console.log(`Deleting specification for ID ${id}`);
    const success = await vehicleQueries.deleteSpecification(id);
    console.log(`Specification deleted successfully: ${success}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete specification:', error);
    return NextResponse.json({
      error: 'Failed to delete specification',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}