import { NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../lib/supabase';
import { getWalletAddressFromRequest } from '../../../lib/utils/authHelpers';

export async function POST(request: Request) {
  try {
    // Get the wallet address from the request
    const walletAddress = getWalletAddressFromRequest(request);
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { tokenId, builderId, workType, buildDescription, buildDate } = body;

    if (!tokenId || !builderId) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId and builderId' },
        { status: 400 }
      );
    }

    // Get Supabase client with service role
    const client = getSupabaseClient(true);
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Verify the vehicle exists and is owned by the wallet
    const { data: vehicle, error: vehicleError } = await client
      .from('vehicle_profiles')
      .select('id')
      .eq('token_id', tokenId)
      .eq('owner_id', walletAddress.toLowerCase())
      .maybeSingle();

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError);
      return NextResponse.json(
        { error: 'Error fetching vehicle' },
        { status: 500 }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or not owned by you' },
        { status: 404 }
      );
    }

    // Verify the builder exists
    const { data: builder, error: builderError } = await client
      .from('businesses')
      .select('id')
      .eq('id', builderId)
      .maybeSingle();

    if (builderError) {
      console.error('Error fetching builder:', builderError);
      return NextResponse.json(
        { error: 'Error fetching builder' },
        { status: 500 }
      );
    }

    if (!builder) {
      return NextResponse.json(
        { error: 'Builder not found' },
        { status: 404 }
      );
    }

    // Create the builder-vehicle relationship
    const { data: relationship, error: relationshipError } = await client
      .from('builder_vehicles')
      .insert({
        business_id: builderId,
        token_id: tokenId,
        work_type: workType,
        build_description: buildDescription,
        build_date: buildDate || null,
      })
      .select()
      .single();

    if (relationshipError) {
      console.error('Error creating builder-vehicle relationship:', relationshipError);
      return NextResponse.json(
        { error: 'Error creating builder-vehicle relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: relationship,
    });
  } catch (error) {
    console.error('Error in vehicle-builders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const builderId = searchParams.get('builderId');

    if (!tokenId && !builderId) {
      return NextResponse.json(
        { error: 'Missing required parameter: tokenId or builderId' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    let query = client.from('builder_vehicles').select(`
      *,
      builder:businesses(*)
    `);

    // Apply filters
    if (tokenId) {
      query = query.eq('token_id', tokenId);
    }

    if (builderId) {
      query = query.eq('business_id', builderId);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching builder-vehicle relationships:', error);
      return NextResponse.json(
        { error: 'Error fetching builder-vehicle relationships' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in vehicle-builders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the wallet address from the request
    const walletAddress = getWalletAddressFromRequest(request);
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tokenId = searchParams.get('tokenId');

    if (!id && !tokenId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id or tokenId' },
        { status: 400 }
      );
    }

    // Get Supabase client with service role
    const client = getSupabaseClient(true);
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Verify ownership if tokenId is provided
    if (tokenId) {
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .eq('owner_id', walletAddress.toLowerCase())
        .maybeSingle();

      if (vehicleError) {
        console.error('Error fetching vehicle:', vehicleError);
        return NextResponse.json(
          { error: 'Error fetching vehicle' },
          { status: 500 }
        );
      }

      if (!vehicle) {
        return NextResponse.json(
          { error: 'Vehicle not found or not owned by you' },
          { status: 404 }
        );
      }
    }

    // Delete the relationship
    let query = client.from('builder_vehicles').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (tokenId) {
      query = query.eq('token_id', tokenId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting builder-vehicle relationship:', error);
      return NextResponse.json(
        { error: 'Error deleting builder-vehicle relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in vehicle-builders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}