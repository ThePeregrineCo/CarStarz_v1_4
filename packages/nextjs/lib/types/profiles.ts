/**
 * Core profile types for users, businesses, and clubs
 */

// Base profile interface with common properties
export interface BaseProfile {
  id: string;
  created_at: string;
  updated_at: string;
}

// User profile
export interface UserProfile extends BaseProfile {
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  email: string | null;
  user_type: 'owner' | 'builder' | 'manufacturer';
  subscription_tier: 'free' | 'standard' | 'collector' | 'investor';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  social_links: SocialLink[];
  location: string | null;
}

// Business profile
export interface BusinessProfile extends BaseProfile {
  user_id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  logo_url: string | null;
  banner_image_url: string | null;
  contact_info: ContactInfo;
  specialties: string[];
  subscription_tier: 'standard' | 'pro' | 'enterprise';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  social_links: SocialLink[];
  location: string | null;
  business_hours: BusinessHours | null;
  services: Service[];
}

// Club profile
export interface ClubProfile extends BaseProfile {
  creator_id: string;
  club_name: string;
  description: string | null;
  logo_url: string | null;
  banner_image_url: string | null;
  is_private: boolean;
  club_rules: string | null;
  membership_requirements: string | null;
  social_links: SocialLink[];
  location: string | null;
  founding_date: string | null;
  member_count: number;
}

// Supporting types
export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'website' | 'other';
  url: string;
  display_name?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface BusinessHours {
  monday: TimeRange | null;
  tuesday: TimeRange | null;
  wednesday: TimeRange | null;
  thursday: TimeRange | null;
  friday: TimeRange | null;
  saturday: TimeRange | null;
  sunday: TimeRange | null;
}

export interface TimeRange {
  open: string; // Format: "HH:MM" in 24-hour format
  close: string; // Format: "HH:MM" in 24-hour format
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
}

// Relationship types
export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ClubMembership {
  user_id: string;
  club_id: string;
  join_date: string;
  membership_status: 'pending' | 'active' | 'featured';
  membership_level: string | null;
  invited_by: string | null;
}

export interface BusinessPortfolioItem {
  business_id: string;
  vehicle_id: string;
  work_type: string;
  work_description: string | null;
  work_date: string | null;
  featured: boolean;
}

// Profile stats
export interface UserProfileStats {
  vehicle_count: number;
  follower_count: number;
  following_count: number;
}

export interface BusinessProfileStats {
  portfolio_count: number;
  follower_count: number;
  rating_average: number;
  rating_count: number;
}

export interface ClubProfileStats {
  member_count: number;
  follower_count: number;
  vehicle_count: number;
  event_count: number;
}