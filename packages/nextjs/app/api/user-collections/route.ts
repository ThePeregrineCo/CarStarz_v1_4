import { NextResponse } from 'next/server'
import { getSupabaseClient } from '../../../lib/supabase'

// GET /api/user-collections?address=0x...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')?.toLowerCase()
  
  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 })
  }

  try {
    // Always use the service role client for API routes
    const supabase = getSupabaseClient(true)
    
    if (!supabase) {
      console.error('Supabase client not available - missing environment variables')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }
    
    console.log(`Fetching collections for address: ${address}`)
    
    // Get collected vehicles (token IDs)
    const { data: collections, error: collectionsError } = await supabase
      .from('user_collections')
      .select('token_id')
      .eq('user_wallet', address)
    
    if (collectionsError) {
      console.error('Error fetching user collections:', collectionsError)
      return NextResponse.json({ 
        error: 'Failed to fetch user collections',
        details: collectionsError.message
      }, { status: 500 })
    }
    
    if (!collections || collections.length === 0) {
      return NextResponse.json({ collections: [] })
    }
    
    // Get the actual vehicle data for the collected token IDs
    const tokenIds = collections.map(item => item.token_id)
    
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicle_profiles')
      .select('*, vehicle_media(*)')
      .in('token_id', tokenIds)
    
    if (vehiclesError) {
      console.error('Error fetching collected vehicles:', vehiclesError)
      return NextResponse.json({ 
        error: 'Failed to fetch collected vehicles',
        details: vehiclesError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ collections: vehicles || [] })
  } catch (error: any) {
    console.error('Failed to fetch user collections:', error)
    return NextResponse.json({
      error: 'Failed to fetch user collections',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// POST /api/user-collections
export async function POST(request: Request) {
  // Get the wallet address from the headers (set by BrowserProviders)
  const walletAddress = request.headers.get('x-wallet-address')?.toLowerCase()
  
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    const { tokenId } = data
    
    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId in request body' }, { status: 400 })
    }
    
    // Always use the service role client for API routes
    const supabase = getSupabaseClient(true)
    
    if (!supabase) {
      console.error('Supabase client not available - missing environment variables')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }
    
    // Add to collection
    const { data: collection, error } = await supabase
      .from('user_collections')
      .insert([
        { user_wallet: walletAddress, token_id: tokenId }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error adding to collection:', error)
      return NextResponse.json({ 
        error: 'Failed to add to collection',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data: collection })
  } catch (error: any) {
    console.error('Failed to add to collection:', error)
    return NextResponse.json({
      error: 'Failed to add to collection',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// DELETE /api/user-collections?tokenId=123
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const tokenId = searchParams.get('tokenId')
  
  // Get the wallet address from the headers (set by BrowserProviders)
  const walletAddress = request.headers.get('x-wallet-address')?.toLowerCase()
  
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  if (!tokenId) {
    return NextResponse.json({ error: 'Missing tokenId parameter' }, { status: 400 })
  }
  
  try {
    // Always use the service role client for API routes
    const supabase = getSupabaseClient(true)
    
    if (!supabase) {
      console.error('Supabase client not available - missing environment variables')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }
    
    // Remove from collection
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('user_wallet', walletAddress)
      .eq('token_id', tokenId)
    
    if (error) {
      console.error('Error removing from collection:', error)
      return NextResponse.json({ 
        error: 'Failed to remove from collection',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to remove from collection:', error)
    return NextResponse.json({
      error: 'Failed to remove from collection',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}