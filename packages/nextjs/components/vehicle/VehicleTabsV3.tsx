import React from 'react';
import type { CompleteVehicleProfile } from '../../lib/api/vehicleQueries';
import { VehicleDetailsTab } from '../vehicle/tabs/VehicleDetailsTab';
import { VehicleMediaTab } from '../vehicle/tabs/VehicleMediaTab';
import { VehiclePartsTab } from '../vehicle/tabs/VehiclePartsTab';
import { VehicleBuildersTab } from '../vehicle/tabs/VehicleBuildersTab';
import { VideoSection } from './VideoSection';

export type VehicleTabType = 'details' | 'media' | 'parts' | 'builders' | 'videos';

interface VehicleTabsV3Props {
  vehicle: CompleteVehicleProfile;
  activeTab: VehicleTabType;
  onTabChange: (tab: VehicleTabType) => void;
  isOwner: boolean;
}

/**
 * Tab navigation component for the vehicle profile
 * Handles switching between different sections of the vehicle profile
 * Compatible with the updated User interface from vehicleQueriesV3Fixed
 */
export function VehicleTabsV3({ 
  vehicle, 
  activeTab, 
  onTabChange,
  isOwner
}: VehicleTabsV3Props) {
  // Define tabs with their labels and counts
  const tabs: { id: VehicleTabType; label: string; count?: number }[] = [
    { id: 'details', label: 'Details' },
    {
      id: 'media',
      label: 'Media',
      count: vehicle.vehicle_media?.length || 0
    },
    {
      id: 'videos',
      label: 'YouTube',
      count: vehicle.vehicle_videos?.length || 0
    },
    {
      id: 'parts',
      label: 'Parts',
      count: vehicle.parts?.length || 0
    },
    {
      id: 'builders',
      label: 'Builders',
      count: vehicle.builders?.length || 0
    },
  ];
  
  return (
    <div className="bg-white">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Vehicle sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs
                    ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900'}
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <VehicleDetailsTab vehicle={vehicle as any} isOwner={isOwner} />
        )}
        
        {activeTab === 'media' && (
          <VehicleMediaTab vehicle={vehicle as any} isOwner={isOwner} />
        )}
        
        {activeTab === 'parts' && (
          <VehiclePartsTab vehicle={vehicle as any} isOwner={isOwner} />
        )}
        
        {activeTab === 'builders' && (
          <VehicleBuildersTab vehicle={vehicle as any} isOwner={isOwner} />
        )}
        
        {activeTab === 'videos' && (
          <VideoSection tokenId={vehicle.token_id} isOwner={isOwner} />
        )}
      </div>
    </div>
  );
}