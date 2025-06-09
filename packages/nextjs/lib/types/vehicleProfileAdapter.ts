import type { CompleteVehicleProfile, User } from '../api/vehicleQueries';

/**
 * Type adapter to handle vehicle profile types
 * 
 * This adapter has been simplified since we now have a unified vehicle profile type.
 * It maintains the same API for backward compatibility but now simply passes through
 * the data without any transformation.
 */

// Basic user type for backward compatibility
interface LegacyUser {
  id: string;
  wallet_address: string;
  username?: string | null;
  email?: string | null;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Generic adapter function that maintains the same API for backward compatibility
export function adaptVehicleProfile(
  profile: CompleteVehicleProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetVersion: 'v2' | 'v3' // Kept for backward compatibility
): CompleteVehicleProfile {
  // With our unified types, we no longer need to convert between versions
  return profile;
}

// These functions are kept for backward compatibility but now simply return the input
export function adaptUserV3ToV2(user?: User): LegacyUser | undefined {
  if (!user) return undefined;
  
  return {
    id: user.id,
    wallet_address: user.wallet_address,
    username: user.normalized_wallet, // Use normalized wallet as username
    email: null,
    profile_image_url: null,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

export function adaptUserV2ToV3(user?: LegacyUser): User | undefined {
  if (!user) return undefined;
  
  return {
    id: user.id,
    wallet_address: user.wallet_address,
    normalized_wallet: user.wallet_address.toLowerCase(),
    user_id: null,
    ens_name: null,
    did: null,
    last_login: user.updated_at,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

// These functions are kept for backward compatibility but now simply return the input
export function adaptVehicleProfileV3ToV2(profile: CompleteVehicleProfile): CompleteVehicleProfile {
  return profile;
}

export function adaptVehicleProfileV2ToV3(profile: CompleteVehicleProfile): CompleteVehicleProfile {
  return profile;
}

// Type guards are simplified since we now have a unified type
export function isVehicleProfileV2(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _profile: CompleteVehicleProfile
): boolean {
  return true;
}

export function isVehicleProfileV3(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _profile: CompleteVehicleProfile
): boolean {
  return true;
}