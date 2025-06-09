"use client";

import React, { useState } from 'react';
import { useVehicleData } from '../lib/hooks/useVehicleData';
import { useVehicleOwnership } from '../lib/hooks/useVehicleOwnership';
import { VehicleHeaderV3 } from './vehicle/VehicleHeaderV3';
import { VehicleTabsV3, VehicleTabType } from './vehicle/VehicleTabsV3';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorDisplay } from './ui/ErrorDisplay';

interface VehicleProfileV3Props {
  tokenId: string | number;
}

/**
 * Enhanced vehicle profile component that displays all vehicle information
 * and provides editing capabilities for owners
 * Uses the fixed V3 vehicle queries that don't rely on foreign key relationships
 */
export function VehicleProfileV3({ tokenId }: VehicleProfileV3Props) {
  const [activeTab, setActiveTab] = useState<VehicleTabType>('details');
  
  // Get vehicle data using our unified hook
  const {
    data: vehicle,
    isLoading: isLoadingVehicle,
    error: vehicleError,
    refetch
  } = useVehicleData(tokenId);
  
  // Check ownership
  const {
    isOwner,
    isLoading: isLoadingOwnership,
    error: ownershipError
  } = useVehicleOwnership(tokenId);
  
  // Combined loading state
  const isLoading = isLoadingVehicle || isLoadingOwnership;
  
  // Combined error state
  const error = vehicleError || ownershipError;
  
  // Handle edit button click
  const handleEdit = () => {
    setActiveTab('details');
  };
  
  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Vehicle"
        onRetry={() => refetch()}
      />
    );
  }
  
  if (!vehicle) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle Not Found</h2>
        <p className="mt-2 text-gray-600">
          The vehicle with token ID {tokenId} could not be found.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      {/* Vehicle header with featured image and basic info */}
      <VehicleHeaderV3
        vehicle={vehicle}
        isOwner={isOwner}
        onEdit={handleEdit}
      />
      
      {/* Tabs for different sections */}
      <VehicleTabsV3
        vehicle={vehicle}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOwner={isOwner}
      />
    </div>
  );
}