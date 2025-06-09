"use client";

import { useEffect, useState } from "react";
import { VehicleCard, type VehicleWithOwnerAndMeta } from "~~/components/VehicleCard";
import { ClientOnly } from "~~/components/ClientOnly";
import { vehicleQueries } from "~~/lib/api/vehicleQueries";

const CommunityPage = () => {
  const [vehicles, setVehicles] = useState<VehicleWithOwnerAndMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehiclesDirectly = async () => {
      try {
        console.log("[DEBUG] Fetching vehicles directly from Supabase");
        setIsLoading(true);
        
        // Fetch vehicles directly using the consolidated queries
        const vehicleData = await vehicleQueries.searchVehicles({});
        
        console.log(`[DEBUG] Fetched ${vehicleData.length} vehicles directly`);
        if (vehicleData.length > 0) {
          console.log('[DEBUG] First vehicle:', JSON.stringify(vehicleData[0], null, 2));
        }
        
        // Transform the data to match the expected format for VehicleCard
        const formattedVehicles = vehicleData.map((vehicleData: any) => {
          // Find image from media if available
          let imagePath = null;
          if (vehicleData.vehicle_media && vehicleData.vehicle_media.length > 0) {
            // Try to find a featured image first
            const featuredImage = vehicleData.vehicle_media.find((media: any) => media.is_featured);
            if (featuredImage) {
              imagePath = featuredImage.url;
            } else if (vehicleData.vehicle_media[0]) {
              // Otherwise use the first image
              imagePath = vehicleData.vehicle_media[0].url;
            }
          }
          
          // If no image found in media, use a fallback based on token ID
          if (!imagePath && vehicleData.token_id) {
            imagePath = `/metadata/${vehicleData.token_id}.jpg`;
          } else if (!imagePath) {
            // Default fallback image
            imagePath = `/images/vehicle-placeholder.jpg`;
          }
          
          return {
            id: vehicleData.token_id,
            vehicle: {
              vin: vehicleData.vin || '',
              name: vehicleData.name || 'Unnamed Vehicle',
              metadataURI: '',
            },
            owner: vehicleData.owner_wallet || '0x0000000000000000000000000000000000000000',
            image: imagePath,
            year: vehicleData.year || 'N/A',
            make: vehicleData.make || 'Unknown',
            model: vehicleData.model || 'Unknown',
            description: vehicleData.description || 'No description available',
            // Include additional data if available
            media: vehicleData.vehicle_media || [],
            parts: vehicleData.parts || [],
            specifications: vehicleData.vehicle_specifications || [],
            links: vehicleData.vehicle_links || [],
            videos: vehicleData.vehicle_videos || [],
          };
        });
        
        console.log("[DEBUG] Formatted vehicles:", formattedVehicles);
        
        setVehicles(formattedVehicles);
      } catch (error) {
        console.error("[DEBUG] Error loading vehicles:", error);
        setError("Failed to load vehicles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehiclesDirectly();
  }, []);

  // Error state can be shown outside ClientOnly
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Community Vehicles</h1>
      <ClientOnly
        fallback={
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">Loading vehicles...</span>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center text-lg">No vehicles registered yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} {...vehicle} />
            ))}
          </div>
        )}
      </ClientOnly>
    </div>
  );
};

export default CommunityPage;