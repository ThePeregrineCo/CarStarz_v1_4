import { getSupabaseClient } from '../supabase';
import { Database } from '../types/database';
import { enhancedUserProfilesAdapter } from '../types/unifiedIdentity';

type User = Database['public']['Tables']['users']['Row'];

export class AuthService {
  /**
   * Authenticates a user based on their wallet address
   * This function will:
   * 1. Check if the user exists in the database
   * 2. If not, create a new user record with wallet address only (no username yet)
   * 3. Return the user data
   */
  static async authenticateWithWallet(walletAddress: string): Promise<User | null> {
    try {
      if (!walletAddress) {
        console.error('No wallet address provided for authentication');
        return null;
      }

      // Normalize wallet address to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();
      
      const supabase = getSupabaseClient(true); // Use service role for auth operations
      if (!supabase) {
        console.error('Failed to get Supabase client');
        return null;
      }
      
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching user:', fetchError);
        return null;
      }
      
      // If user exists, return the user data
      if (existingUser) {
        return existingUser;
      }
      
      // If user doesn't exist, create a new user with wallet address only
      // Username will be set later during onboarding
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            wallet_address: normalizedAddress,
            user_type: 'owner',
            subscription_tier: 'free',
            profile_data: {}
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
        return null;
      }
      
      // Register the wallet in the identity registry
      if (newUser) {
        try {
          await enhancedUserProfilesAdapter.registerWallet(normalizedAddress, newUser.id);
        } catch (error) {
          console.error('Error registering wallet in identity registry:', error);
          // Don't fail authentication if identity registry registration fails
        }
      }
      
      return newUser;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Checks if a username is available
   * @returns true if username is available, false if already taken
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      if (!username) {
        return false;
      }
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Failed to get Supabase client');
        return false;
      }
      
      // Check if username exists
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking username availability:', error);
        return false;
      }
      
      // If data exists, username is taken
      return data === null;
    } catch (error) {
      console.error('Check username availability error:', error);
      return false;
    }
  }

  /**
   * Registers a username for a wallet address
   * This is typically called during the onboarding process
   * @returns true if successful, false if username is taken or other error
   */
  static async registerUsername(walletAddress: string, username: string): Promise<boolean> {
    try {
      if (!walletAddress || !username) {
        return false;
      }

      // Normalize wallet address to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();
      
      // First check if username is available
      const isAvailable = await this.isUsernameAvailable(username);
      if (!isAvailable) {
        console.error('Username is already taken:', username);
        return false;
      }
      
      const supabase = getSupabaseClient(true);
      if (!supabase) {
        console.error('Failed to get Supabase client');
        return false;
      }
      
      // Update the username
      const { error } = await supabase
        .from('users')
        .update({ username })
        .eq('wallet_address', normalizedAddress);
      
      if (error) {
        console.error('Error registering username:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Register username error:', error);
      return false;
    }
  }

  /**
   * Updates a user's username
   * This is used when a user wants to change their username
   */
  static async updateUsername(walletAddress: string, username: string): Promise<boolean> {
    // This is essentially the same as registerUsername
    return this.registerUsername(walletAddress, username);
  }

  /**
   * Updates a user's profile data
   */
  static async updateProfileData(walletAddress: string, profileData: any): Promise<boolean> {
    try {
      if (!walletAddress) {
        return false;
      }

      // Normalize wallet address to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();
      
      const supabase = getSupabaseClient(true);
      if (!supabase) {
        console.error('Failed to get Supabase client');
        return false;
      }
      
      // Update the profile data
      const { error } = await supabase
        .from('users')
        .update({ profile_data: profileData })
        .eq('wallet_address', normalizedAddress);
      
      if (error) {
        console.error('Error updating profile data:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Update profile data error:', error);
      return false;
    }
  }

  /**
   * Gets a user by wallet address
   */
  static async getUserByWallet(walletAddress: string): Promise<User | null> {
    try {
      if (!walletAddress) {
        return null;
      }

      // Normalize wallet address to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Failed to get Supabase client');
        return null;
      }
      
      // Get the user
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Gets a user by username
   * This allows looking up users by their human-readable username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      if (!username) {
        return null;
      }
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Failed to get Supabase client');
        return null;
      }
      
      // Get the user
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user by username:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Get user by username error:', error);
      return null;
    }
  }

  /**
   * Checks if a user has completed onboarding (has a username)
   */
  static async hasCompletedOnboarding(walletAddress: string): Promise<boolean> {
    try {
      const user = await this.getUserByWallet(walletAddress);
      return user !== null && user.username !== null;
    } catch (error) {
      console.error('Check onboarding status error:', error);
      return false;
    }
  }

  /**
   * Registers a builder profile for a user
   */
  static async registerBuilderProfile(
    walletAddress: string, 
    builderData: {
      business_name: string;
      business_type: string;
      contact_info?: any;
      specialties?: string[];
    }
  ): Promise<boolean> {
    try {
      if (!walletAddress || !builderData.business_name || !builderData.business_type) {
        return false;
      }

      // Normalize wallet address to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();
      
      const supabase = getSupabaseClient(true);
      if (!supabase) {
        console.error('Failed to get Supabase client');
        return false;
      }
      
      // First, get the user ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      if (userError || !user) {
        console.error('Error fetching user for builder registration:', userError);
        return false;
      }
      
      // Create the builder profile
      const { error: builderError } = await supabase
        .from('builders')
        .insert([
          {
            user_id: user.id,
            business_name: builderData.business_name,
            business_type: builderData.business_type,
            contact_info: builderData.contact_info || {},
            specialties: builderData.specialties || [],
            subscription_tier: 'standard'
          }
        ]);
      
      if (builderError) {
        console.error('Error creating builder profile:', builderError);
        return false;
      }
      
      // Update the user type
      const { error: updateError } = await supabase
        .from('users')
        .update({ user_type: 'builder' })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating user type:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Register builder profile error:', error);
      return false;
    }
  }
}