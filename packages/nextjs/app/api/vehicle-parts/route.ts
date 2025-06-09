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

    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    let tokenId, category, description, link, image;

    if (contentType.includes('multipart/form-data')) {
      // Parse FormData
      const formData = await request.formData();
      tokenId = formData.get('tokenId') as string;
      category = formData.get('category') as string;
      description = formData.get('description') as string || '';
      link = formData.get('link') as string || null;
      image = formData.get('image') as File || null;
    } else {
      // Parse JSON
      const body = await request.json();
      tokenId = body.tokenId;
      category = body.category;
      description = body.description || '';
      link = body.link || null;
    }

    if (!tokenId || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId and category' },
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

    // Create the part
    let part;
    let partError;
    
    if (image) {
      // If there's an image, upload it first
      const fileName = `${Date.now()}_${image.name}`;
      const filePath = `parts/${vehicle.id}/${fileName}`;
      
      // Upload the image to Supabase Storage
      const { error: uploadError } = await client.storage
        .from('vehicle-parts')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) {
        console.error('Error uploading part image:', uploadError);
        return NextResponse.json(
          { error: 'Error uploading part image' },
          { status: 500 }
        );
      }
      
      // Get the public URL for the uploaded image
      const { data: urlData } = client.storage
        .from('vehicle-parts')
        .getPublicUrl(filePath);
      
      // Create the part with the image URL
      const result = await client
        .from('parts')
        .insert({
          vehicle_id: vehicle.id,
          category,
          description: description || '',
          link: link || null,
          image_url: urlData.publicUrl,
        })
        .select()
        .single();
      
      part = result.data;
      partError = result.error;
    } else {
      // Create the part without an image
      const result = await client
        .from('parts')
        .insert({
          vehicle_id: vehicle.id,
          category,
          description: description || '',
          link: link || null,
        })
        .select()
        .single();
      
      part = result.data;
      partError = result.error;
    }

    if (partError) {
      console.error('Error creating part:', partError);
      return NextResponse.json(
        { error: 'Error creating part' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: part,
    });
  } catch (error) {
    console.error('Error in vehicle-parts API:', error);
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
    const vehicleId = searchParams.get('vehicleId');

    if (!tokenId && !vehicleId) {
      return NextResponse.json(
        { error: 'Missing required parameter: tokenId or vehicleId' },
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

    // If tokenId is provided, get the vehicleId first
    let actualVehicleId = vehicleId;
    if (tokenId && !vehicleId) {
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
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
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }

      actualVehicleId = vehicle.id;
    }

    // Get parts for the vehicle
    const { data, error } = await client
      .from('parts')
      .select('*')
      .eq('vehicle_id', actualVehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parts:', error);
      return NextResponse.json(
        { error: 'Error fetching parts' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in vehicle-parts API:', error);
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

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
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

    // Verify ownership
    const { data: part, error: partError } = await client
      .from('parts')
      .select('vehicle_id')
      .eq('id', id)
      .maybeSingle();

    if (partError) {
      console.error('Error fetching part:', partError);
      return NextResponse.json(
        { error: 'Error fetching part' },
        { status: 500 }
      );
    }

    if (!part) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }

    // Verify the vehicle is owned by the wallet
    const { data: vehicle, error: vehicleError } = await client
      .from('vehicle_profiles')
      .select('owner_id')
      .eq('id', part.vehicle_id)
      .maybeSingle();

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError);
      return NextResponse.json(
        { error: 'Error fetching vehicle' },
        { status: 500 }
      );
    }

    if (!vehicle || vehicle.owner_id.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this part' },
        { status: 403 }
      );
    }

    // Delete the part
    const { error: deleteError } = await client
      .from('parts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting part:', deleteError);
      return NextResponse.json(
        { error: 'Error deleting part' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in vehicle-parts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}