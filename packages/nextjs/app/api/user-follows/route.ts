import { NextResponse } from 'next/server'
import { enhancedUserProfilesAdapter } from '../../../lib/types/unifiedIdentity'

// GET /api/user-follows?address=0x...&type=following|followers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')?.toLowerCase()
  const type = searchParams.get('type') || 'following' // Default to following
  
  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 })
  }

  try {
    if (type === 'following') {
      // Get users that this user follows
      const following = await enhancedUserProfilesAdapter.getFollowing(address);
      return NextResponse.json({ following: following || [] });
    } else {
      // Get users that follow this user
      const followers = await enhancedUserProfilesAdapter.getFollowers(address);
      return NextResponse.json({ followers: followers || [] });
    }
  } catch (error: any) {
    console.error('Failed to fetch user follows:', error)
    return NextResponse.json({
      error: 'Failed to fetch user follows',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// POST /api/user-follows
export async function POST(request: Request) {
  // Get the wallet address from the headers (set by BrowserProviders)
  const walletAddress = request.headers.get('x-wallet-address')?.toLowerCase()
  
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    const { followedWallet } = data
    
    if (!followedWallet) {
      return NextResponse.json({ error: 'Missing followedWallet in request body' }, { status: 400 })
    }
    
    // Add follow relationship using the adapter
    const success = await enhancedUserProfilesAdapter.follow(
      walletAddress,
      followedWallet.toLowerCase()
    );
    
    if (!success) {
      return NextResponse.json({
        error: 'Failed to follow user'
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to follow user:', error)
    return NextResponse.json({
      error: 'Failed to follow user',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// DELETE /api/user-follows?followedWallet=0x...
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const followedWallet = searchParams.get('followedWallet')?.toLowerCase()
  
  // Get the wallet address from the headers (set by BrowserProviders)
  const walletAddress = request.headers.get('x-wallet-address')?.toLowerCase()
  
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  if (!followedWallet) {
    return NextResponse.json({ error: 'Missing followedWallet parameter' }, { status: 400 })
  }
  
  try {
    // Remove follow relationship using the adapter
    const success = await enhancedUserProfilesAdapter.unfollow(
      walletAddress,
      followedWallet
    );
    
    if (!success) {
      return NextResponse.json({
        error: 'Failed to unfollow user'
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to unfollow user:', error)
    return NextResponse.json({
      error: 'Failed to unfollow user',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}