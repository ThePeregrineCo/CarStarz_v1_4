import { IdentityProfile } from '../api/unifiedProfileQueries';
import { EnhancedUserProfile } from './enhancedProfiles';
import { SocialLink } from './profiles';

/**
 * Convert an IdentityProfile to an EnhancedUserProfile
 * This function is used to maintain backward compatibility with the old API
 */
export function convertToEnhancedUserProfile(profile: IdentityProfile | null): EnhancedUserProfile | null {
  if (!profile) return null;
  
  return {
    id: profile.id,
    wallet_address: profile.wallet_address,
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    profile_image_url: profile.profile_image_url,
    banner_image_url: profile.banner_image_url,
    email: profile.email,
    user_type: 'owner', // Default to 'owner' for identity registry profiles
    subscription_tier: 'free', // Default to 'free' for identity registry profiles
    subscription_start_date: null,
    subscription_end_date: null,
    social_links: [], // Social links are stored in a separate table
    location: null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    ens_name: profile.ens_name || undefined,
    did: undefined, // DID is not stored in the identity registry
  };
}

/**
 * Convert an EnhancedUserProfile to an IdentityProfile
 * This function is used when updating an identity registry profile
 */
export function convertToIdentityProfile(profile: EnhancedUserProfile): Partial<IdentityProfile> {
  return {
    wallet_address: profile.wallet_address,
    normalized_wallet: profile.wallet_address.toLowerCase(),
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    profile_image_url: profile.profile_image_url,
    banner_image_url: profile.banner_image_url,
    email: profile.email,
    ens_name: profile.ens_name,
  };
}

/**
 * Enhanced user profiles API with type conversion
 * This is a wrapper around the enhancedUserProfiles API that converts between types
 */
export function createEnhancedUserProfilesAdapter(api: any) {
  return {
    async getByWalletAddress(walletAddress: string): Promise<EnhancedUserProfile | null> {
      const profile = await api.getByWalletAddress(walletAddress);
      return convertToEnhancedUserProfile(profile);
    },
    
    async getByUsername(username: string): Promise<EnhancedUserProfile | null> {
      const profile = await api.getByUsername(username);
      return convertToEnhancedUserProfile(profile);
    },
    
    async update(walletAddress: string, data: Partial<EnhancedUserProfile>): Promise<EnhancedUserProfile | null> {
      // Convert EnhancedUserProfile to IdentityProfile
      const identityProfileData = {
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_image_url: data.banner_image_url,
        email: data.email,
        ens_name: data.ens_name,
      };
      
      const profile = await api.update(walletAddress, identityProfileData);
      return convertToEnhancedUserProfile(profile);
    },
    
    async create(data: Partial<EnhancedUserProfile>): Promise<EnhancedUserProfile | null> {
      if (!data.wallet_address) {
        throw new Error('wallet_address is required');
      }
      
      // Convert EnhancedUserProfile to IdentityProfile
      const identityProfileData = {
        wallet_address: data.wallet_address,
        normalized_wallet: data.wallet_address.toLowerCase(),
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_image_url: data.banner_image_url,
        email: data.email,
        ens_name: data.ens_name,
      };
      
      const profile = await api.create(identityProfileData);
      return convertToEnhancedUserProfile(profile);
    },
    
    async isUsernameAvailable(username: string): Promise<boolean> {
      return api.isUsernameAvailable(username);
    },
    
    async getFollowers(walletAddress: string): Promise<EnhancedUserProfile[]> {
      const profiles = await api.getFollowers(walletAddress);
      return profiles.map(convertToEnhancedUserProfile).filter(Boolean) as EnhancedUserProfile[];
    },
    
    async getFollowing(walletAddress: string): Promise<EnhancedUserProfile[]> {
      const profiles = await api.getFollowing(walletAddress);
      return profiles.map(convertToEnhancedUserProfile).filter(Boolean) as EnhancedUserProfile[];
    },
    
    async follow(followerWallet: string, followedWallet: string): Promise<boolean> {
      return api.follow(followerWallet, followedWallet);
    },
    
    async unfollow(followerWallet: string, followedWallet: string): Promise<boolean> {
      return api.unfollow(followerWallet, followedWallet);
    },
    
    async getSocialLinks(walletAddress: string): Promise<SocialLink[]> {
      const links = await api.getSocialLinks(walletAddress);
      return links.map((link: any) => ({
        platform: link.platform,
        url: link.url,
        display_name: link.display_name,
      }));
    },
    
    async addSocialLink(walletAddress: string, platform: string, url: string): Promise<SocialLink | null> {
      const link = await api.addSocialLink(walletAddress, platform, url);
      if (!link) return null;
      
      return {
        platform: link.platform,
        url: link.url,
        display_name: link.display_name,
      };
    },
    
    async removeSocialLink(id: string): Promise<boolean> {
      return api.removeSocialLink(id);
    },
    
    async getPrimaryWalletByUserId(userId: string): Promise<string | null> {
      return api.getPrimaryWalletByUserId(userId);
    },
    
    async registerWallet(walletAddress: string, userId: string): Promise<boolean> {
      return api.registerWallet(walletAddress, userId);
    },
  };
}

// Create an adapter for the enhancedUserProfiles API
import { enhancedUserProfiles } from '../api/unifiedProfileQueries';
export const enhancedUserProfilesAdapter = createEnhancedUserProfilesAdapter(enhancedUserProfiles);