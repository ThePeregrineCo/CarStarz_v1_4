/**
 * Identity Profile Model
 * Represents a user identity in the system
 */
export interface IdentityProfile {
  id: string;
  wallet_address: string;
  normalized_wallet: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  ens_name: string | null;
  did: string | null;
  last_login: string | null;
  is_profile_complete?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Identity Search Options
 * Options for searching identity profiles
 */
export interface IdentitySearchOptions {
  wallet_address?: string;
  normalized_wallet?: string;
  username?: string;
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

// Import the VehicleProfile to resolve the circular dependency
import { VehicleProfile } from './VehicleProfile';

/**
 * Complete Identity Profile
 * Represents an identity profile with all related data
 */
export interface CompleteIdentityProfile extends IdentityProfile {
  vehicles?: VehicleProfile[];
}