import {
  UserProfile
} from './profiles';

/**
 * Enhanced User Profile with additional fields from Identity Registry
 */
export interface EnhancedUserProfile extends UserProfile {
  // Additional fields from Identity Registry
  ens_name?: string;
  did?: string;
}

/**
 * Identity Registry Entry
 */
export interface IdentityRegistryEntry {
  id: string;
  wallet_address: string;
  normalized_wallet: string;
  user_id?: string;
  ens_name?: string;
  did?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Enhanced User Profile with all associated wallets
 */
export interface UserProfileWithWallets extends EnhancedUserProfile {
  associated_wallets: string[];
}