"use client";

import React, { useState } from 'react';
import { useVehicleData } from '../lib/hooks/useVehicleData';
import { CompleteVehicleProfile } from '../lib/api/vehicleQueries';
import { VehicleHeaderV3 } from './vehicle/VehicleHeaderV3';
import { VehicleDetailsTab } from './vehicle/tabs/VehicleDetailsTab';
import { VehicleMediaTab } from './vehicle/tabs/VehicleMediaTab';
import { VehiclePartsTab } from './vehicle/tabs/VehiclePartsTab';
import { VehicleBuildersTab } from './vehicle/tabs/VehicleBuildersTab';
import { VideoSection } from './vehicle/VideoSection';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorDisplay } from './ui/ErrorDisplay';
import { VehicleProvider, useVehicle } from '../lib/context/VehicleContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface VehicleProfileCascadeProps {
  tokenId: string | number;
}

/**
 * Enhanced vehicle profile component that displays all vehicle information
 * in a cascading layout rather than tabs
 */
export function VehicleProfileCascade({ tokenId }: VehicleProfileCascadeProps) {
  // This component now serves as a wrapper that provides the VehicleContext
  // to all child components, ensuring consistent ownership verification
  
  return (
    <VehicleProvider tokenId={tokenId}>
      <VehicleProfileContent tokenId={tokenId} />
    </VehicleProvider>
  );
}

/**
 * Inner component that uses the VehicleContext
 */
function VehicleProfileContent({ tokenId }: { tokenId: string | number }) {
  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Get vehicle data and ownership status from the VehicleContext
  const {
    vehicle,
    isLoading: isLoadingContext,
    error: contextError,
    isOwner,
    refetch
  } = useVehicle();
  
  // Get vehicle data using the V3 hook as a fallback
  const {
    data: vehicleData,
    isLoading: isLoadingVehicle,
    error: vehicleError,
  } = useVehicleData(tokenId) as { data: CompleteVehicleProfile | null, isLoading: boolean, error: Error | null };
  
  // Use context vehicle data if available, otherwise use the data from the hook
  const vehicleToUse = vehicle || vehicleData as CompleteVehicleProfile;
  
  // Combined loading state
  const isLoading = isLoadingContext || isLoadingVehicle;
  
  // Combined error state
  const error = contextError || vehicleError;
  
  // Update vehicle mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Clear any previous errors
      setErrorMessage(null);
      
      console.log(`Sending update request for vehicle ${tokenId}:`, data);
      
      // Use the API route to update the vehicle
      const response = await fetch(`/api/vehicle-profiles?tokenId=${tokenId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Update failed:', responseData);
        throw new Error(responseData.error || responseData.details || 'Failed to update profile');
      }
      
      console.log('Update successful:', responseData);
      return responseData;
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenId.toString()] });
      
      // Force a refetch to ensure we have the latest data
      refetch();
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      setErrorMessage(error.message || 'An error occurred while updating the profile');
    }
  });
  
  // Handle edit button click
  const handleEdit = () => {
    if (vehicleToUse) {
      setFormData({
        name: vehicleToUse.name || '',
        description: vehicleToUse.description || ''
      });
      setIsEditing(true);
      setErrorMessage(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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
  
  if (!vehicleToUse) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle Not Found</h2>
        <p className="mt-2 text-gray-600">
          The vehicle with token ID {tokenId} could not be found.
        </p>
      </div>
    );
  }
  
  // Render edit form if in editing mode
  if (isEditing) {
    return (
      <div className="bg-white shadow-xl rounded-lg overflow-hidden p-6">
        <h2 className="text-2xl font-bold mb-4">Edit Vehicle Profile</h2>
        
        {errorMessage && (
          <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setErrorMessage(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      {/* Vehicle header with featured image and basic info */}
      <VehicleHeaderV3
        vehicle={vehicleToUse as any}
        isOwner={isOwner}
        onEdit={handleEdit}
      />
      
      {/* Cascading sections */}
      <div className="p-6 space-y-12">
        {/* Details Section */}
        <section id="details" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Vehicle Details</h2>
          <VehicleDetailsTab vehicle={vehicleToUse as any} isOwner={isOwner} />
        </section>
        
        {/* Media Section - Always show this section regardless of media count */}
        <section id="media" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
            Media Gallery
            {(vehicleToUse as CompleteVehicleProfile).vehicle_media && (vehicleToUse as CompleteVehicleProfile).vehicle_media!.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({(vehicleToUse as CompleteVehicleProfile).vehicle_media!.length} items)
              </span>
            )}
          </h2>
          <VehicleMediaTab vehicle={vehicleToUse as any} isOwner={isOwner} />
        </section>
        
        {/* Videos Section - Always show this section regardless of video count */}
        <section id="videos" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
            YouTube Videos
            {(vehicleToUse as CompleteVehicleProfile).vehicle_videos && (vehicleToUse as CompleteVehicleProfile).vehicle_videos!.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({(vehicleToUse as CompleteVehicleProfile).vehicle_videos!.length} videos)
              </span>
            )}
          </h2>
          {/* Pass the isOwner prop directly to VideoSection instead of creating a new VehicleProvider context */}
          <VideoSection tokenId={tokenId} isOwner={isOwner} />
        </section>
        
        {/* Parts Section - Always show this section regardless of parts count */}
        <section id="parts" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
            Parts & Modifications
            {(vehicleToUse as any).parts && (vehicleToUse as any).parts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({(vehicleToUse as any).parts.length} items)
              </span>
            )}
          </h2>
          <VehiclePartsTab vehicle={vehicleToUse as any} isOwner={isOwner} />
        </section>
        
        {/* Builders Section - Always show this section regardless of builders count */}
        <section id="builders" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
            Builders & Shops
            {(vehicleToUse as any).builders && (vehicleToUse as any).builders.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({(vehicleToUse as any).builders.length} builders)
              </span>
            )}
          </h2>
          <VehicleBuildersTab vehicle={vehicleToUse as any} isOwner={isOwner} />
        </section>
      </div>
    </div>
  );
}