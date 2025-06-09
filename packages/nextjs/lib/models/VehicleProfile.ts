/**
 * Vehicle Profile Model
 * Represents a vehicle profile in the system
 */
export interface VehicleProfile {
  id: string;
  token_id: string;
  owner_id: string; // Reference to identity_registry.id
  name: string | null;
  description: string | null;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  primary_image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle Media Model
 * Represents media associated with a vehicle
 */
export interface VehicleMedia {
  id: string;
  vehicle_id: string;
  url: string;
  type: 'image' | 'video';
  caption: string | null;
  category: string | null;
  is_featured: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle Specification Model
 * Represents specifications for a vehicle
 */
export interface VehicleSpecification {
  id: string;
  vehicle_id: string;
  category: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle Link Model
 * Represents external links associated with a vehicle
 */
export interface VehicleLink {
  id: string;
  vehicle_id: string;
  title: string;
  url: string;
  type: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle Video Model
 * Represents videos associated with a vehicle
 */
export interface VehicleVideo {
  id: string;
  vehicle_id: string;
  title: string;
  youtube_url: string;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle Part Model
 * Represents parts associated with a vehicle
 */
export interface VehiclePart {
  id: string;
  vehicle_id: string;
  category: string;
  description: string;
  link: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Complete Vehicle Profile Model
 * Represents a vehicle profile with all its related data
 */
export interface CompleteVehicleProfile extends VehicleProfile {
  owner?: IdentityProfile;
  vehicle_media?: VehicleMedia[];
  vehicle_specifications?: VehicleSpecification[];
  vehicle_links?: VehicleLink[];
  vehicle_videos?: VehicleVideo[];
  parts?: VehiclePart[];
}

/**
 * Vehicle Search Options
 * Options for searching vehicle profiles
 */
export interface VehicleSearchOptions {
  make?: string;
  model?: string;
  year?: number;
  owner_id?: string;
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

// Import the IdentityProfile to resolve the circular dependency
import { IdentityProfile } from './IdentityProfile';