/**
 * Vehicle Entity
 * 
 * Represents a vehicle in the system with its core properties.
 * This is the domain entity that encapsulates the business rules
 * and properties of a vehicle.
 */

export interface Vehicle {
  id: string;
  tokenId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  name?: string;
  description?: string;
  ownerWallet: string;
  primaryImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMedia {
  id: string;
  vehicleId: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  category?: string;
  isFeatured: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleSpecification {
  id: string;
  vehicleId: string;
  category: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleLink {
  id: string;
  vehicleId: string;
  title: string;
  url: string;
  type: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleModification {
  id: string;
  vehicleId: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleComment {
  id: string;
  vehicleId: string;
  userWallet: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleVideo {
  id: string;
  vehicleId: string;
  title: string;
  youtubeUrl: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteVehicle extends Vehicle {
  media?: VehicleMedia[];
  specifications?: VehicleSpecification[];
  links?: VehicleLink[];
  modifications?: VehicleModification[];
  comments?: VehicleComment[];
  videos?: VehicleVideo[];
}

// Data transfer objects for creating and updating vehicles
export interface VehicleCreateData {
  tokenId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  name?: string;
  description?: string;
  ownerWallet: string;
  primaryImageUrl?: string;
}

export interface VehicleUpdateData {
  name?: string;
  description?: string;
  primaryImageUrl?: string;
}