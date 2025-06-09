import { NextResponse } from "next/server";
import { getWalletAddressFromRequest } from "../../../lib/utils/authHelpers";
import { identityService } from "../../../lib/services/IdentityService";
import { IdentityProfile } from "../../../lib/models/IdentityProfile";
import { getSupabaseClient } from "../../../lib/supabase";

/**
 * POST /api/user-profiles
 * Create a new user profile
 */
export async function POST(request: Request) {
  try {
    // Get the wallet address from the request headers
    const walletAddress = getWalletAddressFromRequest(request);
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }
    
    // Check if the request is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    let profileData: Partial<IdentityProfile> = {};
    let headshot: File | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      // Parse FormData
      const formData = await request.formData();
      profileData.username = formData.get('username') as string;
      profileData.bio = formData.get('bio') as string;
      profileData.display_name = formData.get('display_name') as string || profileData.username;
      headshot = formData.get('headshot') as File | null;
    } else {
      // Parse JSON
      const body = await request.json();
      profileData = {
        username: body.username,
        display_name: body.display_name || body.username,
        bio: body.bio
      };
    }
    
    if (!profileData.username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    
    // Handle profile image upload if provided
    if (headshot) {
      try {
        const normalizedWallet = walletAddress.toLowerCase();
        const fileExt = headshot.name.split('.').pop();
        const fileName = `${normalizedWallet}_${Date.now()}.${fileExt}`;
        const filePath = `profile-images/${normalizedWallet}/${fileName}`;
        
        // Convert the file to an ArrayBuffer
        const arrayBuffer = await headshot.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        // Get the Supabase client for storage operations
        const supabase = getSupabaseClient(true);
        if (!supabase) {
          throw new Error("Failed to connect to storage");
        }
        
        // Check if the profile-images bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'profile-images');
        
        // Create the bucket if it doesn't exist
        if (!bucketExists) {
          await supabase.storage.createBucket('profile-images', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
        }
        
        // Upload the file to Supabase Storage
        const { error: uploadError } = await supabase
          .storage
          .from('profile-images')
          .upload(filePath, buffer, {
            contentType: headshot.type,
            upsert: true
          });
        
        if (uploadError) {
          console.error('Error uploading profile image:', uploadError);
          // Continue without the image
        } else {
          // Get the public URL
          const { data: urlData } = supabase
            .storage
            .from('profile-images')
            .getPublicUrl(filePath);
          
          profileData.profile_image_url = urlData.publicUrl;
        }
      } catch (uploadError) {
        console.error('Error processing profile image:', uploadError);
        // Continue without the image
      }
    }
    
    try {
      // Create the identity profile using the service
      const newUser = await identityService.createIdentity(profileData, walletAddress);
      
      return NextResponse.json({
        success: true,
        user: newUser
      });
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Username is already taken')) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
      
      if (error.message?.includes('Wallet already has an identity profile')) {
        return NextResponse.json(
          { error: "Wallet already has a profile" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to create user profile: " + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in user profile creation:', error);
    return NextResponse.json(
      { error: "Failed to create user profile" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user-profiles
 * Get user profiles
 */
export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    const username = url.searchParams.get('username');
    const id = url.searchParams.get('id');
    
    // At least one parameter is required
    if (!address && !username && !id) {
      return NextResponse.json(
        { error: "At least one parameter (address, username, or id) is required" },
        { status: 400 }
      );
    }
    
    try {
      let completeProfile = null;
      
      // Get the profile based on the provided parameter
      if (id) {
        completeProfile = await identityService.getCompleteProfile(id);
      } else if (address) {
        completeProfile = await identityService.getCompleteProfileByWalletAddress(address);
      } else if (username) {
        const profile = await identityService.getIdentityByUsername(username);
        if (profile) {
          completeProfile = await identityService.getCompleteProfile(profile.id);
        }
      }
      
      if (!completeProfile) {
        return NextResponse.json({
          userProfile: null,
          ownedVehicles: []
        });
      }
      
      return NextResponse.json({
        userProfile: completeProfile,
        ownedVehicles: completeProfile.vehicles || []
      });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: "Failed to fetch user profile: " + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in user profiles API:', error);
    return NextResponse.json(
      { error: "Failed to fetch user profiles" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-profiles
 * Update a user profile
 */
export async function PATCH(request: Request) {
  try {
    // Get the wallet address from the request
    const walletAddress = getWalletAddressFromRequest(request);
    if (!walletAddress) {
      return NextResponse.json({
        error: 'Authentication required',
        details: 'You must be authenticated to update a user profile'
      }, { status: 401 });
    }
    
    // Get the URL parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        error: 'Missing id parameter'
      }, { status: 400 });
    }
    
    // Parse the update data
    const updates = await request.json();
    
    // Ensure the data format is correct
    if (typeof updates !== 'object' || updates === null) {
      return NextResponse.json({
        error: 'Invalid update data',
        details: 'Update data must be a valid JSON object'
      }, { status: 400 });
    }
    
    try {
      // Update the identity profile using the service
      const updatedProfile = await identityService.updateIdentity(
        id,
        updates as Partial<IdentityProfile>,
        walletAddress
      );
      
      if (!updatedProfile) {
        return NextResponse.json({
          error: 'Identity profile not found',
          details: `No identity profile found with ID ${id}`
        }, { status: 404 });
      }
      
      // Fetch the complete updated profile
      const completeProfile = await identityService.getCompleteProfile(id);
      
      return NextResponse.json({
        success: true,
        message: `Identity profile with ID ${id} updated successfully`,
        data: completeProfile
      });
    } catch (updateError: any) {
      // Handle specific error cases
      if (updateError.message?.includes('Only the identity owner')) {
        return NextResponse.json({
          error: 'Unauthorized',
          details: 'Only the identity owner can update this profile'
        }, { status: 403 });
      }
      
      if (updateError.message?.includes('Username is already taken')) {
        return NextResponse.json({
          error: 'Username is already taken',
          details: 'Please choose a different username'
        }, { status: 400 });
      }
      
      console.error(`Error during update operation for ID ${id}:`, updateError);
      return NextResponse.json({
        error: 'Failed to update identity profile',
        details: updateError?.message || String(updateError)
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error updating identity profile:', error);
    return NextResponse.json({
      error: 'Failed to update identity profile',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}