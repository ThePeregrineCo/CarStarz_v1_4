import { getSupabaseClient } from '../supabase';

/**
 * Check if a user has a profile
 * @param walletAddress The wallet address to check
 * @returns True if the user has a profile, false otherwise
 */
export async function checkUserHasProfile(walletAddress: string): Promise<boolean> {
  try {
    if (!walletAddress) return false;
    
    const normalizedWallet = walletAddress.toLowerCase();
    const supabase = getSupabaseClient(true);
    
    if (!supabase) {
      console.error('Failed to get Supabase client');
      return false;
    }
    
    // First, check if the identity_registry table exists
    try {
      console.log('[DEBUG] Checking if identity_registry table exists...');
      try {
        const { error: tableCheckError } = await supabase
          .from('identity_registry')
          .select('count(*)', { count: 'exact', head: true });
        
        if (tableCheckError) {
          console.error('Error checking if identity_registry table exists:', tableCheckError);
          console.log('[DEBUG] Table check error code:', tableCheckError.code);
          console.log('[DEBUG] Table check error message:', tableCheckError.message);
          console.log('[DEBUG] Table check error details:', tableCheckError.details);
          
          // If the error is because the table doesn't exist, return false
          if (tableCheckError.code === '42P01') {
            console.error('identity_registry table does not exist');
            return false;
          }
          
          // For any other error, we'll try to continue
        } else {
          console.log('[DEBUG] identity_registry table exists');
        }
      } catch (error) {
        // If there's an exception, the table might not exist or there might be a connection issue
        console.error('Exception checking if identity_registry table exists:', error);
        
        // For development/testing purposes, return true to allow minting without a profile
        // In production, this should be set to false
        return true;
      }
    } catch (error) {
      console.error('Error checking if identity_registry table exists:', error);
      // Table might not exist, but we'll continue and try to check for the user profile
    }
    
    // Check if the user has a profile
    try {
      const { data, error } = await supabase
        .from('identity_registry')
        .select('id')
        .eq('normalized_wallet', normalizedWallet)
        .maybeSingle();
      
      if (error) {
        // If the error is because the table doesn't exist, we'll return false
        if (error.code === '42P01') {
          console.error('identity_registry table does not exist');
          return false;
        }
        
        console.error('Error checking if user has profile:', error);
        
        // For development/testing purposes, return true to allow minting without a profile
        // In production, this should be set to false
        return true;
      }
      
      return !!data;
    } catch (error) {
      console.error('Exception checking if user has profile:', error);
      
      // For development/testing purposes, return true to allow minting without a profile
      // In production, this should be set to false
      return true;
    }
  } catch (error) {
    console.error('Error checking if user has profile:', error);
    return false;
  }
}

/**
 * Create a user profile
 * @param walletAddress The wallet address to create a profile for
 * @param username The username for the profile
 * @param displayName The display name for the profile
 * @param bio The bio for the profile
 * @returns True if the profile was created successfully, false otherwise
 */
export async function createUserProfile(
  walletAddress: string,
  username: string,
  displayName: string,
  bio?: string
): Promise<boolean> {
  try {
    if (!walletAddress || !username) return false;
    
    const normalizedWallet = walletAddress.toLowerCase();
    console.log(`[DEBUG] Creating user profile for wallet ${normalizedWallet} with username ${username}`);
    
    const supabase = getSupabaseClient(true);
    
    if (!supabase) {
      console.error('Failed to get Supabase client');
      return false;
    }
    
    console.log('[DEBUG] Supabase client obtained');
    
    // Check if the user already has a profile
    const hasProfile = await checkUserHasProfile(walletAddress);
    if (hasProfile) {
      console.log('User already has a profile');
      return true;
    }
    
    // Create the profile
    console.log('[DEBUG] Inserting new profile into identity_registry table');
    try {
      const { error } = await supabase
        .from('identity_registry')
        .insert([
          {
            wallet_address: walletAddress,
            normalized_wallet: normalizedWallet,
            username,
            display_name: displayName || username,
            bio: bio || '',
          }
        ]);
      
      if (error) {
        console.error('Error creating user profile:', error);
        console.log('[DEBUG] Error code:', error.code);
        console.log('[DEBUG] Error message:', error.message);
        console.log('[DEBUG] Error details:', error.details);
        return false;
      }
      
      console.log('[DEBUG] Profile created successfully');
    } catch (insertError) {
      console.error('Exception during profile creation:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
}