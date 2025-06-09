import { NextResponse } from 'next/server'
import { vehicleMods, VehicleModification } from '../../../lib/api/vehicles'
import { getSupabaseClient } from '../../../lib/supabase'

// GET /api/vehicle-modifications?vehicleId=123 or /api/vehicle-modifications?tokenId=123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const tokenId = searchParams.get('tokenId')

  if (!vehicleId && !tokenId) {
    return NextResponse.json({ error: 'Missing vehicleId or tokenId parameter' }, { status: 400 })
  }

  try {
    if (tokenId) {
      console.log(`Fetching modifications for token ID ${tokenId}`);
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
      
      const modifications = await vehicleMods.getByVehicleId(vehicle.id);
      console.log(`Found ${modifications?.length || 0} modifications for token ID ${tokenId}`);
      return NextResponse.json(modifications);
    } else {
      console.log(`Fetching modifications for vehicle ID ${vehicleId}`);
      const modifications = await vehicleMods.getByVehicleId(vehicleId as string);
      console.log(`Found ${modifications?.length || 0} modifications for vehicle ID ${vehicleId}`);
      return NextResponse.json(modifications);
    }
  } catch (error) {
    console.error('Error fetching modifications:', error);
    return NextResponse.json({ error: 'Failed to fetch modifications' }, { status: 500 })
  }
}

// POST /api/vehicle-modifications?tokenId=123
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    
    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId parameter' }, { status: 400 });
    }
    
    const modData = await request.json();
    const modification: VehicleModification = {
      name: modData.name,
      description: modData.description,
      category: modData.category
    };
    
    const newModification = await vehicleMods.create(parseInt(tokenId), modification);
    return NextResponse.json(newModification);
  } catch (error) {
    console.error('Error creating modification:', error);
    return NextResponse.json({ error: 'Failed to create modification' }, { status: 500 });
  }
}

// DELETE /api/vehicle-modifications?id=123
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    await vehicleMods.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting modification:', error);
    return NextResponse.json({ error: 'Failed to delete modification' }, { status: 500 })
  }
}