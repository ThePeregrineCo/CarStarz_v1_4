import { NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../lib/supabase';

/**
 * API endpoint for searching businesses
 * GET /api/businesses?search=term
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    console.log(`Searching businesses with term: "${searchTerm}"`);
    
    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    
    let query = client
      .from('businesses')
      .select(`
        id,
        business_name,
        business_type,
        description,
        logo_url,
        specialties,
        location
      `);
    
    // Apply search filter if provided
    if (searchTerm) {
      query = query.ilike('business_name', `%${searchTerm}%`);
    }
    
    // Apply pagination
    query = query
      .order('business_name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error searching businesses:', error);
      return NextResponse.json({ error: 'Error searching businesses' }, { status: 500 });
    }
    
    console.log(`Found ${data?.length || 0} businesses matching "${searchTerm}"`);
    
    return NextResponse.json({
      businesses: data || [],
      count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in businesses API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * API endpoint for creating a new business
 * POST /api/businesses
 */
export async function POST(request: Request) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const businessData = await request.json();
    
    // Validate required fields
    if (!businessData.business_name || !businessData.business_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: business_name and business_type are required' 
      }, { status: 400 });
    }
    
    const client = getSupabaseClient(true); // Use service role for writes
    if (!client) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    
    // First, get the user ID from the wallet address
    const { data: user, error: userError } = await client
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create the business
    const { data: business, error: businessError } = await client
      .from('businesses')
      .insert({
        user_id: user.id,
        business_name: businessData.business_name,
        business_type: businessData.business_type,
        description: businessData.description || null,
        logo_url: businessData.logo_url || null,
        banner_image_url: businessData.banner_image_url || null,
        contact_info: businessData.contact_info || {},
        specialties: businessData.specialties || [],
        website_url: businessData.website_url || null,
        google_maps_url: businessData.google_maps_url || null,
        location: businessData.location || null,
        business_hours: businessData.business_hours || null,
      })
      .select()
      .single();
    
    if (businessError) {
      console.error('Error creating business:', businessError);
      return NextResponse.json({ error: 'Error creating business' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error('Error in businesses API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}