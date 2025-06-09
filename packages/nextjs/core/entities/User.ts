/**
 * User Entity
 * 
 * Represents a user in the system with their identity information.
 * This is the domain entity that encapsulates the business rules
 * and properties of a user.
 */

export interface User {
  id: string;
  walletAddress: string;
  normalizedWallet: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
  ensName?: string;
  did?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserIdentity {
  id: string;
  walletAddress: string;
  normalizedWallet: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
  ensName?: string;
  did?: string;
  lastLogin?: string;
}

export interface SocialLink {
  id: string;
  walletAddress: string;
  platform: string;
  url: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Follow {
  id: string;
  followerWallet: string;
  followedWallet: string;
  createdAt: string;
}

export interface UserCollection {
  id: string;
  userWallet: string;
  tokenId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteUser extends User {
  socialLinks?: SocialLink[];
  following?: Follow[];
  followers?: Follow[];
  collections?: UserCollection[];
}

// Data transfer objects for creating and updating users
export interface UserCreateData {
  walletAddress: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
}

export interface UserUpdateData {
  username?: string;
  displayName?: string;
  profileImage?: string;
}