import React from 'react';
import Image from 'next/image';
import type { CompleteVehicleProfile } from '../../lib/api/vehicleQueries';

interface VehicleHeaderV3Props {
  vehicle: CompleteVehicleProfile;
  isOwner: boolean;
  onEdit?: () => void;
}

/**
 * Enhanced vehicle header component that displays the vehicle's featured image,
 * name, make, model, year, and owner information
 * Compatible with the updated User interface from vehicleQueriesV3Fixed
 */
export function VehicleHeaderV3({ vehicle, isOwner, onEdit }: VehicleHeaderV3Props) {
  // Format the vehicle title
  const vehicleTitle = vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  
  // Get owner display name (truncated wallet address)
  const ownerName = `${vehicle.owner_wallet.substring(0, 6)}...${vehicle.owner_wallet.substring(38)}`;
  
  return (
    <div className="relative">
      {/* Featured Image */}
      <div className="relative h-64 w-full bg-gray-200">
        {/* Try to find a featured image from vehicle_media first */}
        {vehicle.vehicle_media && vehicle.vehicle_media.find(media => media.is_featured && media.type === 'image') ? (
          <Image
            src={vehicle.vehicle_media.find(media => media.is_featured && media.type === 'image')?.url || ''}
            alt={vehicleTitle}
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="rounded-t-lg"
          />
        ) : vehicle.primary_image_url ? (
          <Image
            src={vehicle.primary_image_url}
            alt={vehicleTitle}
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="rounded-t-lg"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      {/* Vehicle Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-shadow">{vehicleTitle}</h1>
            <p className="text-lg text-shadow">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            
            {/* Owner info */}
            <div className="mt-2 flex items-center">
              <span className="text-sm opacity-90 mr-1">Owned by:</span>
              <span className="font-medium">{ownerName}</span>
            </div>
          </div>
          
          {/* Edit button (only shown to owner) */}
          {isOwner && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Edit Vehicle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}