import { getSupabaseClient } from '../supabase';

// Type definitions for the unified identity system
export interface IdentityProfile {
  id: string;
  wallet_address: string;
  normalized_wallet: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  email: string | null;
  ens_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  wallet_address: string;
  platform: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  id: string;
  follower_wallet: string;
  followed_wallet: string;
  created_at: string;
}

// Helper function to get Supabase client
function getClient(useServiceRole = true) {
  console.log(`[DEBUG CLIENT] Getting Supabase client with useServiceRole=${useServiceRole}`);
  const client = getSupabaseClient(useServiceRole);
  if (!client) {
    console.error('[DEBUG CLIENT] Failed to get Supabase client. Check your environment variables.');
    throw new Error('Failed to get Supabase client. Check your environment variables.');
  }
  console.log('[DEBUG CLIENT] Successfully got Supabase client');
  return client;
}

// Helper function to normalize wallet address
function normalizeWalletAddress(walletAddress: string): string {
  return walletAddress.toLowerCase();
}

// Enhanced user profiles API
export const enhancedUserProfiles = {
  // Get a user profile by ID
  async getById(id: string): Promise<IdentityProfile | null> {
    try {
      const client = getClient();
      
      // First, check if the identity_registry table exists
      try {
        const { data, error } = await client
          .from('identity_registry')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching from identity_registry by id:', error);
          // If the table doesn't exist, try to create it
          if (error.message && error.message.includes('does not exist')) {
            console.log('identity_registry table does not exist, attempting to create it');
            
            // Call the setup endpoint to create the table
            const response = await fetch('/api/setup-identity-registry', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.error('Failed to create identity_registry table:', await response.text());
              return null;
            }
            
            // Try again after creating the table
            const { data: retryData, error: retryError } = await client
              .from('identity_registry')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            if (retryError) {
              console.error('Error fetching from identity_registry after creation:', retryError);
              return null;
            }
            
            return retryData;
          }
          
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Unexpected error fetching user profile by id:', error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile by id:', error);
      return null;
    }
  },
  
  // Get a user profile by wallet address
  async getByWalletAddress(walletAddress: string): Promise<IdentityProfile | null> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const client = getClient();
      
      // First, check if the identity_registry table exists
      try {
        const { data, error } = await client
          .from('identity_registry')
          .select('*')
          .eq('normalized_wallet', normalizedWallet)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching from identity_registry:', error);
          // If the table doesn't exist, try to create it
          if (error.message && error.message.includes('does not exist')) {
            console.log('identity_registry table does not exist, attempting to create it');
            
            // Call the setup endpoint to create the table
            const response = await fetch('/api/setup-identity-registry', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.error('Failed to create identity_registry table:', await response.text());
              return null;
            }
            
            // Try again after creating the table
            const { data: retryData, error: retryError } = await client
              .from('identity_registry')
              .select('*')
              .eq('normalized_wallet', normalizedWallet)
              .maybeSingle();
            
            if (retryError) {
              console.error('Error fetching from identity_registry after creation:', retryError);
              return null;
            }
            
            return retryData;
          }
          
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Unexpected error fetching user profile:', error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile by wallet address:', error);
      return null;
    }
  },
  
  // Get a user profile by username
  async getByUsername(username: string): Promise<IdentityProfile | null> {
    try {
      const client = getClient();
      
      // First, check if the identity_registry table exists
      try {
        const { data, error } = await client
          .from('identity_registry')
          .select('*')
          .eq('username', username)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching from identity_registry by username:', error);
          // If the table doesn't exist, try to create it
          if (error.message && error.message.includes('does not exist')) {
            console.log('identity_registry table does not exist, attempting to create it');
            
            // Call the setup endpoint to create the table
            const response = await fetch('/api/setup-identity-registry', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.error('Failed to create identity_registry table:', await response.text());
              return null;
            }
            
            // Try again after creating the table
            const { data: retryData, error: retryError } = await client
              .from('identity_registry')
              .select('*')
              .eq('username', username)
              .maybeSingle();
            
            if (retryError) {
              console.error('Error fetching from identity_registry by username after creation:', retryError);
              return null;
            }
            
            return retryData;
          }
          
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Unexpected error fetching user profile by username:', error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile by username:', error);
      return null;
    }
  },
  
  // Update a user profile by wallet address
  async update(walletAddress: string, data: Partial<IdentityProfile>): Promise<IdentityProfile | null> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const client = getClient(true); // Use service role for updates
      
      // Extract only the fields that should be updated
      const updateData = {
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_image_url: data.banner_image_url,
        email: data.email,
        ens_name: data.ens_name
      };
      
      try {
        const { data: updatedProfile, error } = await client
          .from('identity_registry')
          .update(updateData)
          .eq('normalized_wallet', normalizedWallet)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating profile:', error);
          // If the table doesn't exist, try to create it
          if (error.message && error.message.includes('does not exist')) {
            console.log('identity_registry table does not exist, attempting to create it');
            
            // Call the setup endpoint to create the table
            const response = await fetch('/api/setup-identity-registry', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.error('Failed to create identity_registry table:', await response.text());
              return null;
            }
            
            // After creating the table, we need to create the profile first
            const createResult = await this.create({
              wallet_address: walletAddress,
              ...data
            });
            
            return createResult;
          }
          
          throw error;
        }
        
        return updatedProfile;
      } catch (innerError) {
        console.error('Error in profile update process:', innerError);
        return null;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  },
  
  // Update a user profile by ID
  async updateById(id: string, data: Partial<IdentityProfile>): Promise<IdentityProfile | null> {
    try {
      const client = getClient(true); // Use service role for updates
      
      // Extract only the fields that should be updated
      const updateData = {
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_image_url: data.banner_image_url,
        email: data.email,
        ens_name: data.ens_name
      };
      
      try {
        const { data: updatedProfile, error } = await client
          .from('identity_registry')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating profile by ID:', error);
          // If the table doesn't exist, try to create it
          if (error.message && error.message.includes('does not exist')) {
            console.log('identity_registry table does not exist, attempting to create it');
            
            // Call the setup endpoint to create the table
            const response = await fetch('/api/setup-identity-registry', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.error('Failed to create identity_registry table:', await response.text());
              return null;
            }
            
            // After creating the table, we need to create the profile first
            const createResult = await this.create({
              id,
              ...data
            });
            
            return createResult;
          }
          
          throw error;
        }
        
        return updatedProfile;
      } catch (innerError) {
        console.error('Error in profile update by ID process:', innerError);
        return null;
      }
    } catch (error) {
      console.error('Error updating user profile by ID:', error);
      return null;
    }
  },
  
  // Create a new user profile
  async create(data: Partial<IdentityProfile>): Promise<IdentityProfile | null> {
    try {
      const client = getClient(true); // Use service role for creation
      
      // Normalize wallet address if provided
      const normalizedWallet = data.wallet_address ? normalizeWalletAddress(data.wallet_address) : null;
      
      try {
        // Check if profile already exists by wallet address if provided
        if (data.wallet_address) {
          const { data: existingProfile, error: checkError } = await client
            .from('identity_registry')
            .select('id')
            .eq('normalized_wallet', normalizedWallet)
            .maybeSingle();
          
          if (checkError) {
            console.error('Error checking if profile exists:', checkError);
            // If the table doesn't exist, try to create it
            if (checkError.message && checkError.message.includes('does not exist')) {
              console.log('identity_registry table does not exist, attempting to create it');
              
              // Call the setup endpoint to create the table
              const response = await fetch('/api/setup-identity-registry', {
                method: 'POST',
              });
              
              if (!response.ok) {
                console.error('Failed to create identity_registry table:', await response.text());
                return null;
              }
            } else {
              return null;
            }
          } else if (existingProfile) {
            throw new Error('Profile already exists for this wallet address');
          }
        }
        
        // Check if profile already exists by ID if provided
        if (data.id) {
          const { data: existingIdProfile, error: idCheckError } = await client
            .from('identity_registry')
            .select('id')
            .eq('id', data.id)
            .maybeSingle();
          
          if (idCheckError && !idCheckError.message.includes('does not exist')) {
            console.error('Error checking if profile exists by ID:', idCheckError);
            return null;
          } else if (existingIdProfile) {
            throw new Error('Profile already exists with this ID');
          }
        }
        
        // Create new profile
        const { data: newProfile, error } = await client
          .from('identity_registry')
          .insert([{
            ...data,
            normalized_wallet: normalizedWallet
          }])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating profile:', error);
          throw error;
        }
        
        return newProfile;
      } catch (innerError) {
        console.error('Error in profile creation process:', innerError);
        return null;
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  },
  
  // Check if a username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const client = getClient();
      
      try {
        const { data, error } = await client
          .from('identity_registry')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking username availability:', error);
          // If the table doesn't exist, try to create it
          if (error.message && error.message.includes('does not exist')) {
            console.log('identity_registry table does not exist, attempting to create it');
            
            // Call the setup endpoint to create the table
            const response = await fetch('/api/setup-identity-registry', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.error('Failed to create identity_registry table:', await response.text());
              return true; // Assume username is available if we can't check
            }
            
            // Try again after creating the table
            const { data: retryData, error: retryError } = await client
              .from('identity_registry')
              .select('id')
              .eq('username', username)
              .maybeSingle();
            
            if (retryError) {
              console.error('Error checking username availability after table creation:', retryError);
              return true; // Assume username is available if we can't check
            }
            
            return !retryData; // Username is available if no profile is found
          }
          
          return true; // Assume username is available if we can't check
        }
        
        return !data; // Username is available if no profile is found
      } catch (error) {
        console.error('Unexpected error checking username availability:', error);
        return true; // Assume username is available if we can't check
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      return true; // Assume username is available if we can't check
    }
  },
  
  // Get a user's followers
  async getFollowers(walletAddress: string): Promise<IdentityProfile[]> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const client = getClient();
      
      const { data, error } = await client
        .from('follows')
        .select(`
          follower_wallet,
          follower:identity_registry!follower_wallet(*)
        `)
        .eq('followed_wallet', normalizedWallet);
      
      if (error) throw error;
      
      // Extract follower profiles
      return (data || []).map(item => item.follower) as unknown as IdentityProfile[];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  },
  
  // Get a user's followers by ID
  async getFollowersById(id: string): Promise<IdentityProfile[]> {
    try {
      // First get the user's wallet address
      const profile = await this.getById(id);
      if (!profile || !profile.normalized_wallet) {
        return [];
      }
      
      return this.getFollowers(profile.wallet_address);
    } catch (error) {
      console.error('Error fetching followers by ID:', error);
      return [];
    }
  },
  
  // Get users that a user is following
  async getFollowing(walletAddress: string): Promise<IdentityProfile[]> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const client = getClient();
      
      const { data, error } = await client
        .from('follows')
        .select(`
          followed_wallet,
          followed:identity_registry!followed_wallet(*)
        `)
        .eq('follower_wallet', normalizedWallet);
      
      if (error) throw error;
      
      // Extract followed profiles
      return (data || []).map(item => item.followed) as unknown as IdentityProfile[];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  },
  
  // Get users that a user is following by ID
  async getFollowingById(id: string): Promise<IdentityProfile[]> {
    try {
      // First get the user's wallet address
      const profile = await this.getById(id);
      if (!profile || !profile.normalized_wallet) {
        return [];
      }
      
      return this.getFollowing(profile.wallet_address);
    } catch (error) {
      console.error('Error fetching following by ID:', error);
      return [];
    }
  },
  
  // Follow a user
  async follow(followerWallet: string, followedWallet: string): Promise<boolean> {
    try {
      const normalizedFollowerWallet = normalizeWalletAddress(followerWallet);
      const normalizedFollowedWallet = normalizeWalletAddress(followedWallet);
      const client = getClient(true); // Use service role for follows
      
      // Check if already following
      const { data: existingFollow } = await client
        .from('follows')
        .select('id')
        .eq('follower_wallet', normalizedFollowerWallet)
        .eq('followed_wallet', normalizedFollowedWallet)
        .maybeSingle();
      
      if (existingFollow) {
        return true; // Already following
      }
      
      // Create follow relationship
      const { error } = await client
        .from('follows')
        .insert([{
          follower_wallet: normalizedFollowerWallet,
          followed_wallet: normalizedFollowedWallet
        }]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  },
  
  // Follow a user by ID
  async followById(followerId: string, followedId: string): Promise<boolean> {
    try {
      // Get both users' wallet addresses
      const followerProfile = await this.getById(followerId);
      const followedProfile = await this.getById(followedId);
      
      if (!followerProfile || !followerProfile.wallet_address || !followedProfile || !followedProfile.wallet_address) {
        console.error('Could not find wallet addresses for users');
        return false;
      }
      
      return this.follow(followerProfile.wallet_address, followedProfile.wallet_address);
    } catch (error) {
      console.error('Error following user by ID:', error);
      return false;
    }
  },
  
  // Unfollow a user
  async unfollow(followerWallet: string, followedWallet: string): Promise<boolean> {
    try {
      const normalizedFollowerWallet = normalizeWalletAddress(followerWallet);
      const normalizedFollowedWallet = normalizeWalletAddress(followedWallet);
      const client = getClient(true); // Use service role for unfollows
      
      const { error } = await client
        .from('follows')
        .delete()
        .eq('follower_wallet', normalizedFollowerWallet)
        .eq('followed_wallet', normalizedFollowedWallet);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  },
  
  // Unfollow a user by ID
  async unfollowById(followerId: string, followedId: string): Promise<boolean> {
    try {
      // Get both users' wallet addresses
      const followerProfile = await this.getById(followerId);
      const followedProfile = await this.getById(followedId);
      
      if (!followerProfile || !followerProfile.wallet_address || !followedProfile || !followedProfile.wallet_address) {
        console.error('Could not find wallet addresses for users');
        return false;
      }
      
      return this.unfollow(followerProfile.wallet_address, followedProfile.wallet_address);
    } catch (error) {
      console.error('Error unfollowing user by ID:', error);
      return false;
    }
  },
  
  // Get social links for a user
  async getSocialLinks(walletAddress: string): Promise<SocialLink[]> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const client = getClient();
      
      const { data, error } = await client
        .from('social_links')
        .select('*')
        .eq('wallet_address', normalizedWallet);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching social links:', error);
      return [];
    }
  },
  
  // Get social links for a user by ID
  async getSocialLinksById(id: string): Promise<SocialLink[]> {
    try {
      // First get the user's wallet address
      const profile = await this.getById(id);
      if (!profile || !profile.wallet_address) {
        return [];
      }
      
      return this.getSocialLinks(profile.wallet_address);
    } catch (error) {
      console.error('Error fetching social links by ID:', error);
      return [];
    }
  },
  
  // Add a social link
  async addSocialLink(walletAddress: string, platform: string, url: string): Promise<SocialLink | null> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const client = getClient(true); // Use service role for adding social links
      
      const { data, error } = await client
        .from('social_links')
        .insert([{
          wallet_address: normalizedWallet,
          platform,
          url
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding social link:', error);
      return null;
    }
  },
  
  // Add a social link by user ID
  async addSocialLinkById(id: string, platform: string, url: string): Promise<SocialLink | null> {
    try {
      // First get the user's wallet address
      const profile = await this.getById(id);
      if (!profile || !profile.wallet_address) {
        console.error('Could not find wallet address for user');
        return null;
      }
      
      return this.addSocialLink(profile.wallet_address, platform, url);
    } catch (error) {
      console.error('Error adding social link by ID:', error);
      return null;
    }
  },
  
  // Remove a social link
  async removeSocialLink(id: string): Promise<boolean> {
    try {
      const client = getClient(true); // Use service role for removing social links
      
      const { error } = await client
        .from('social_links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing social link:', error);
      return false;
    }
  },
  
  // Get the primary wallet address for a user ID
  async getPrimaryWalletByUserId(userId: string): Promise<string | null> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('identity_registry')
        .select('wallet_address')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.wallet_address || null;
    } catch (error) {
      console.error('Error getting primary wallet by user ID:', error);
      return null;
    }
  },
  
  // Register a wallet address for a user ID
  async registerWallet(walletAddress: string, userId: string): Promise<boolean> {
    try {
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const client = getClient(true); // Use service role for registering wallets
      
      // Check if wallet is already registered
      const { data: existingWallet, error: checkError } = await client
        .from('identity_registry')
        .select('id')
        .eq('normalized_wallet', normalizedWallet)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingWallet) {
        // Update existing wallet with user ID
        const { error: updateError } = await client
          .from('identity_registry')
          .update({ user_id: userId })
          .eq('normalized_wallet', normalizedWallet);
        
        if (updateError) throw updateError;
      } else {
        // Create new wallet entry
        const { error: insertError } = await client
          .from('identity_registry')
          .insert([{
            wallet_address: walletAddress,
            normalized_wallet: normalizedWallet,
            user_id: userId
          }]);
        
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('Error registering wallet:', error);
      return false;
    }
  }
};