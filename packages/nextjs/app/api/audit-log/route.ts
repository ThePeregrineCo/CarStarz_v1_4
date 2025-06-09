import { NextResponse } from 'next/server'
import { vehicleQueries } from '../../../lib/api/vehicleQueries'
import { getSupabaseClient } from '../../../lib/supabase'

// GET /api/audit-log?vehicleId=123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const tokenId = searchParams.get('tokenId')

  if (!vehicleId && !tokenId) {
    return NextResponse.json({ error: 'Missing vehicleId or tokenId parameter' }, { status: 400 })
  }

  try {
    if (tokenId) {
      console.log(`Fetching audit logs for token ID ${tokenId}`);
      const logs = await vehicleQueries.getAuditLog(tokenId);
      console.log(`Found ${logs?.length || 0} audit logs for token ID ${tokenId}`);
      return NextResponse.json(logs);
    } else {
      // For vehicle ID, we need to get the token ID first
      console.log(`Fetching audit logs for vehicle ID ${vehicleId}`);
      
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
      
      console.log(`Fetching audit logs for token ID ${vehicle.token_id}`);
      const logs = await vehicleQueries.getAuditLog(vehicle.token_id);
      console.log(`Found ${logs?.length || 0} audit logs for token ID ${vehicle.token_id}`);
      return NextResponse.json(logs);
    }
  } catch (error: any) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({
      error: 'Failed to fetch audit logs',
      details: error?.message || String(error)
    }, { status: 500 })
  }
} 