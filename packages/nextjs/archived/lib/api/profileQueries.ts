import { getSupabaseClient } from '../supabase';
import type {
  UserProfile,
  BusinessProfile,
  ClubProfile,
  UserProfileStats,
  BusinessProfileStats,
  ClubProfileStats
} from '../types/profiles';

// Helper function to get Supabase client
function getClient(useServiceRole = true) {
  const client = getSupabaseClient(useServiceRole);
  if (!client) {
    throw new Error('Failed to get Supabase client. Check your environment variables.');
  }
  return client;
}

/**
 * User Profile API Functions
 */
export const userProfiles = {
  // Get a user profile by wallet address
  async getByWalletAddress(walletAddress: string): Promise<UserProfile | null> {
    try {
      const client = getClient();
      
      // Convert wallet address to lowercase for consistent lookup
      const normalizedAddress = walletAddress.toLowerCase();
      
      const { data, error } = await client
        .from('users')
        .select(`
          *,
          social_links(*)
        `)
        .eq('wallet_address', normalizedAddress)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      // Format the response to match our UserProfile type
      return {
        id: data.id,
        wallet_address: data.wallet_address,
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_image_url: data.banner_image_url,
        email: data.email,
        user_type: data.user_type,
        subscription_tier: data.subscription_tier,
        subscription_start_date: data.subscription_start_date,
        subscription_end_date: data.subscription_end_date,
        social_links: data.social_links || [],
        location: data.location,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  
  // Get a user profile by username
  async getByUsername(username: string): Promise<UserProfile | null> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('users')
        .select(`
          *,
          social_links(*)
        `)
        .eq('username', username)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      // Format the response to match our UserProfile type
      return {
        id: data.id,
        wallet_address: data.wallet_address,
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_image_url: data.banner_image_url,
        email: data.email,
        user_type: data.user_type,
        subscription_tier: data.subscription_tier,
        subscription_start_date: data.subscription_start_date,
        subscription_end_date: data.subscription_end_date,
        social_links: data.social_links || [],
        location: data.location,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching user profile by username:', error);
      return null;
    }
  },
  
  // Update a user profile
  async update(walletAddress: string, data: Partial<UserProfile>): Promise<boolean> {
    try {
      const client = getClient(true); // Use service role for updates
      
      // Convert wallet address to lowercase for consistent lookup
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Extract social links to update separately if provided
      const { social_links, ...profileData } = data;
      
      // Update the user profile
      const { error } = await client
        .from('users')
        .update(profileData)
        .eq('wallet_address', normalizedAddress);
      
      if (error) throw error;
      
      // Update social links if provided
      if (social_links && social_links.length > 0) {
        // First get the user ID
        const { data: userData, error: userError } = await client
          .from('users')
          .select('id')
          .eq('wallet_address', normalizedAddress)
          .single();
        
        if (userError) throw userError;
        
        // Delete existing social links
        const { error: deleteError } = await client
          .from('social_links')
          .delete()
          .eq('user_id', userData.id);
        
        if (deleteError) throw deleteError;
        
        // Insert new social links
        const socialLinksWithUserId = social_links.map(link => ({
          ...link,
          user_id: userData.id
        }));
        
        const { error: insertError } = await client
          .from('social_links')
          .insert(socialLinksWithUserId);
        
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
  
  // Get user profile stats
  async getStats(userId: string): Promise<UserProfileStats> {
    try {
      const client = getClient();
      
      // Get vehicle count - query vehicle_profiles directly
      const { data: vehicles, error: vehiclesError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('owner_wallet', userId);
      
      if (vehiclesError) throw vehiclesError;
      
      // Get follower count
      const { data: followers, error: followersError } = await client
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);
      
      if (followersError) throw followersError;
      
      // Get following count
      const { data: following, error: followingError } = await client
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (followingError) throw followingError;
      
      return {
        vehicle_count: vehicles?.length || 0,
        follower_count: followers?.length || 0,
        following_count: following?.length || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        vehicle_count: 0,
        follower_count: 0,
        following_count: 0
      };
    }
  },
  
  // Check if username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // PGRST116 means no rows returned, so username is available
        return true;
      }
      
      // If we got data back, username is taken
      return !data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  }
};

/**
 * Business Profile API Functions
 */
export const businessProfiles = {
  // Get a business profile by ID
  async getById(businessId: string): Promise<BusinessProfile | null> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('businesses')
        .select(`
          *,
          social_links(*),
          services(*)
        `)
        .eq('id', businessId)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        user_id: data.user_id,
        business_name: data.business_name,
        business_type: data.business_type,
        description: data.description,
        logo_url: data.logo_url,
        banner_image_url: data.banner_image_url,
        contact_info: data.contact_info,
        specialties: data.specialties || [],
        subscription_tier: data.subscription_tier,
        subscription_start_date: data.subscription_start_date,
        subscription_end_date: data.subscription_end_date,
        website_url: data.website_url,
        google_maps_url: data.google_maps_url || null,
        social_links: data.social_links || [],
        location: data.location,
        business_hours: data.business_hours,
        services: data.services || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching business profile:', error);
      return null;
    }
  },
  
  // Get business profiles by user ID
  async getByUserId(userId: string): Promise<BusinessProfile[]> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('businesses')
        .select(`
          *,
          social_links(*),
          services(*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      if (!data) return [];
      
      return data.map(business => ({
        id: business.id,
        user_id: business.user_id,
        business_name: business.business_name,
        business_type: business.business_type,
        description: business.description,
        logo_url: business.logo_url,
        banner_image_url: business.banner_image_url,
        contact_info: business.contact_info,
        specialties: business.specialties || [],
        subscription_tier: business.subscription_tier,
        subscription_start_date: business.subscription_start_date,
        subscription_end_date: business.subscription_end_date,
        website_url: business.website_url,
        google_maps_url: business.google_maps_url || null,
        social_links: business.social_links || [],
        location: business.location,
        business_hours: business.business_hours,
        services: business.services || [],
        created_at: business.created_at,
        updated_at: business.updated_at
      }));
    } catch (error) {
      console.error('Error fetching business profiles by user ID:', error);
      return [];
    }
  },
  
  // Create a business profile
  async create(data: Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BusinessProfile | null> {
    try {
      const client = getClient(true);
      
      // Extract services and social links to insert separately
      const { services, social_links, ...businessData } = data;
      
      // Insert business profile
      const { data: newBusiness, error } = await client
        .from('businesses')
        .insert([businessData])
        .select()
        .single();
      
      if (error) throw error;
      if (!newBusiness) return null;
      
      // Insert services if provided
      if (services && services.length > 0) {
        const servicesWithBusinessId = services.map(service => ({
          ...service,
          business_id: newBusiness.id
        }));
        
        const { error: servicesError } = await client
          .from('services')
          .insert(servicesWithBusinessId);
        
        if (servicesError) throw servicesError;
      }
      
      // Insert social links if provided
      if (social_links && social_links.length > 0) {
        const socialLinksWithBusinessId = social_links.map(link => ({
          ...link,
          business_id: newBusiness.id
        }));
        
        const { error: socialLinksError } = await client
          .from('social_links')
          .insert(socialLinksWithBusinessId);
        
        if (socialLinksError) throw socialLinksError;
      }
      
      // Return the complete business profile
      return await this.getById(newBusiness.id);
    } catch (error) {
      console.error('Error creating business profile:', error);
      throw error;
    }
  },
  
  // Update a business profile
  async update(businessId: string, data: Partial<BusinessProfile>): Promise<boolean> {
    try {
      const client = getClient(true);
      
      // Extract services and social links to update separately
      const { services, social_links, ...businessData } = data;
      
      // Update business profile
      const { error } = await client
        .from('businesses')
        .update(businessData)
        .eq('id', businessId);
      
      if (error) throw error;
      
      // Update services if provided
      if (services) {
        // Delete existing services
        const { error: deleteServicesError } = await client
          .from('services')
          .delete()
          .eq('business_id', businessId);
        
        if (deleteServicesError) throw deleteServicesError;
        
        // Insert new services
        if (services.length > 0) {
          const servicesWithBusinessId = services.map(service => ({
            ...service,
            business_id: businessId
          }));
          
          const { error: insertServicesError } = await client
            .from('services')
            .insert(servicesWithBusinessId);
          
          if (insertServicesError) throw insertServicesError;
        }
      }
      
      // Update social links if provided
      if (social_links) {
        // Delete existing social links
        const { error: deleteSocialLinksError } = await client
          .from('social_links')
          .delete()
          .eq('business_id', businessId);
        
        if (deleteSocialLinksError) throw deleteSocialLinksError;
        
        // Insert new social links
        if (social_links.length > 0) {
          const socialLinksWithBusinessId = social_links.map(link => ({
            ...link,
            business_id: businessId
          }));
          
          const { error: insertSocialLinksError } = await client
            .from('social_links')
            .insert(socialLinksWithBusinessId);
          
          if (insertSocialLinksError) throw insertSocialLinksError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating business profile:', error);
      throw error;
    }
  },
  
  // Get business profile stats
  async getStats(businessId: string): Promise<BusinessProfileStats> {
    try {
      const client = getClient();
      
      // Get portfolio count
      const { data: portfolio, error: portfolioError } = await client
        .from('vehicle_builders')
        .select('id')
        .eq('builder_id', businessId);
      
      if (portfolioError) throw portfolioError;
      
      // Get follower count
      const { data: followers, error: followersError } = await client
        .from('follows')
        .select('follower_id')
        .eq('following_id', businessId);
      
      if (followersError) throw followersError;
      
      // Get ratings
      const { data: ratings, error: ratingsError } = await client
        .from('recommendations')
        .select('rating')
        .eq('entity_id', businessId)
        .eq('entity_type', 'builder');
      
      if (ratingsError) throw ratingsError;
      
      // Calculate average rating
      const ratingSum = ratings?.reduce((sum, item) => sum + (item.rating || 0), 0) || 0;
      const ratingCount = ratings?.length || 0;
      const ratingAverage = ratingCount > 0 ? ratingSum / ratingCount : 0;
      
      return {
        portfolio_count: portfolio?.length || 0,
        follower_count: followers?.length || 0,
        rating_average: ratingAverage,
        rating_count: ratingCount
      };
    } catch (error) {
      console.error('Error fetching business stats:', error);
      return {
        portfolio_count: 0,
        follower_count: 0,
        rating_average: 0,
        rating_count: 0
      };
    }
  }
};

/**
 * Club Profile API Functions
 */
export const clubProfiles = {
  // Get a club profile by ID
  async getById(clubId: string): Promise<ClubProfile | null> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('clubs')
        .select(`
          *,
          social_links(*)
        `)
        .eq('id', clubId)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      // Get member count
      const { count: memberCount, error: memberError } = await client
        .from('club_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('membership_status', 'active');
      
      if (memberError) throw memberError;
      
      return {
        id: data.id,
        creator_id: data.creator_id,
        club_name: data.club_name,
        description: data.description,
        logo_url: data.logo_url,
        banner_image_url: data.banner_image_url,
        is_private: data.is_private,
        club_rules: data.club_rules,
        membership_requirements: data.membership_requirements,
        social_links: data.social_links || [],
        location: data.location,
        founding_date: data.founding_date,
        member_count: memberCount || 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching club profile:', error);
      return null;
    }
  },
  
  // Get club profiles by creator ID
  async getByCreatorId(creatorId: string): Promise<ClubProfile[]> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('clubs')
        .select(`
          *,
          social_links(*)
        `)
        .eq('creator_id', creatorId);
      
      if (error) throw error;
      if (!data) return [];
      
      // Get member counts for each club
      const clubIds = data.map(club => club.id);
      
      // Get member counts individually for each club
      const memberCountPromises = clubIds.map(async (clubId) => {
        const { count } = await client
          .from('club_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', clubId)
          .eq('membership_status', 'active');
        
        return { clubId, count: count || 0 };
      });
      
      const memberCounts = await Promise.all(memberCountPromises);
      
      // Create a map of club ID to member count
      const memberCountMap = memberCounts.reduce((map: Record<string, number>, item) => {
        map[item.clubId] = item.count;
        return map;
      }, {});
      
      return data.map(club => ({
        id: club.id,
        creator_id: club.creator_id,
        club_name: club.club_name,
        description: club.description,
        logo_url: club.logo_url,
        banner_image_url: club.banner_image_url,
        is_private: club.is_private,
        club_rules: club.club_rules,
        membership_requirements: club.membership_requirements,
        social_links: club.social_links || [],
        location: club.location,
        founding_date: club.founding_date,
        member_count: memberCountMap[club.id] || 0,
        created_at: club.created_at,
        updated_at: club.updated_at
      }));
    } catch (error) {
      console.error('Error fetching club profiles by creator ID:', error);
      return [];
    }
  },
  
  // Create a club profile
  async create(data: Omit<ClubProfile, 'id' | 'created_at' | 'updated_at' | 'member_count'>): Promise<ClubProfile | null> {
    try {
      const client = getClient(true);
      
      // Extract social links to insert separately
      const { social_links, ...clubData } = data;
      
      // Insert club profile
      const { data: newClub, error } = await client
        .from('clubs')
        .insert([clubData])
        .select()
        .single();
      
      if (error) throw error;
      if (!newClub) return null;
      
      // Insert social links if provided
      if (social_links && social_links.length > 0) {
        const socialLinksWithClubId = social_links.map(link => ({
          ...link,
          club_id: newClub.id
        }));
        
        const { error: socialLinksError } = await client
          .from('social_links')
          .insert(socialLinksWithClubId);
        
        if (socialLinksError) throw socialLinksError;
      }
      
      // Add creator as a member and admin
      const { error: membershipError } = await client
        .from('club_memberships')
        .insert([{
          user_id: data.creator_id,
          club_id: newClub.id,
          join_date: new Date().toISOString(),
          membership_status: 'active',
          membership_level: 'admin'
        }]);
      
      if (membershipError) throw membershipError;
      
      // Return the complete club profile
      return await this.getById(newClub.id);
    } catch (error) {
      console.error('Error creating club profile:', error);
      throw error;
    }
  },
  
  // Update a club profile
  async update(clubId: string, data: Partial<ClubProfile>): Promise<boolean> {
    try {
      const client = getClient(true);
      
      // Extract social links to update separately
      const { social_links, ...clubData } = data;
      
      // Update club profile
      const { error } = await client
        .from('clubs')
        .update(clubData)
        .eq('id', clubId);
      
      if (error) throw error;
      
      // Update social links if provided
      if (social_links) {
        // Delete existing social links
        const { error: deleteSocialLinksError } = await client
          .from('social_links')
          .delete()
          .eq('club_id', clubId);
        
        if (deleteSocialLinksError) throw deleteSocialLinksError;
        
        // Insert new social links
        if (social_links.length > 0) {
          const socialLinksWithClubId = social_links.map(link => ({
            ...link,
            club_id: clubId
          }));
          
          const { error: insertSocialLinksError } = await client
            .from('social_links')
            .insert(socialLinksWithClubId);
          
          if (insertSocialLinksError) throw insertSocialLinksError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating club profile:', error);
      throw error;
    }
  },
  
  // Get club profile stats
  async getStats(clubId: string): Promise<ClubProfileStats> {
    try {
      const client = getClient();
      
      // Get member count
      const { count: memberCount, error: memberError } = await client
        .from('club_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('membership_status', 'active');
      
      if (memberError) throw memberError;
      
      // Get follower count
      const { data: followers, error: followersError } = await client
        .from('follows')
        .select('follower_id')
        .eq('following_id', clubId);
      
      if (followersError) throw followersError;
      
      // Get vehicle count (vehicles associated with club members)
      const { count: vehicleCount, error: vehicleError } = await client
        .from('club_vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', clubId);
      
      if (vehicleError) throw vehicleError;
      
      // Get event count
      const { count: eventCount, error: eventError } = await client
        .from('club_events')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', clubId);
      
      if (eventError) throw eventError;
      
      return {
        member_count: memberCount || 0,
        follower_count: followers?.length || 0,
        vehicle_count: vehicleCount || 0,
        event_count: eventCount || 0
      };
    } catch (error) {
      console.error('Error fetching club stats:', error);
      return {
        member_count: 0,
        follower_count: 0,
        vehicle_count: 0,
        event_count: 0
      };
    }
  }
};