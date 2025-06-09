"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ProfileAddressLink } from "./ProfileAddressLink";

interface Vehicle {
  vin: string;
  name: string;
  metadataURI: string;
}

interface VehicleWithOwnerAndMeta {
  id: number;
  vehicle: Vehicle;
  owner: string;
  image?: string;
  year?: string | number;
  make?: string;
  model?: string;
  description?: string;
  media?: any[];
  modifications?: any[];
  specifications?: any[];
  links?: any[];
}

export function VehicleCard({
  id,
  vehicle,
  owner,
  image,
  year,
  make,
  model,
  description,
  media,
  modifications,
  specifications,
  links
}: VehicleWithOwnerAndMeta) {
  const { address } = useAccount();
  const isOwner = address?.toLowerCase() === owner.toLowerCase();

  return (
    <div className="bg-base-100 dark:bg-base-300 rounded-lg p-6 shadow-xl flex flex-col items-center">
      {/* Try to find a featured image from media array first */}
      {media && media.find(m => m.is_featured && m.type === 'image') ? (
        <img
          src={media.find(m => m.is_featured && m.type === 'image')?.url}
          alt={vehicle.name}
          className="mb-4 rounded-lg h-40 w-full object-cover"
          style={{ maxWidth: 320, objectFit: "cover" }}
        />
      ) : image ? (
        <img
          src={image}
          alt={vehicle.name}
          className="mb-4 rounded-lg h-40 w-full object-cover"
          style={{ maxWidth: 320, objectFit: "cover" }}
        />
      ) : null}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-1">{vehicle.name}</h2>
        <div className="text-md mb-2">
          {year && make && model ? `${year} ${make} ${model}` : "Vehicle details not available"}
        </div>
        {vehicle.vin ? (
          <div className="text-sm opacity-70 mb-1">VIN: {vehicle.vin}</div>
        ) : (
          <div className="text-sm opacity-70 mb-1">VIN: Not available</div>
        )}
        <div className="text-sm font-bold mt-2">Owner</div>
        <div className="text-sm opacity-70 mb-2">
          <ProfileAddressLink address={owner} />
        </div>
        
        {description && (
          <div className="text-sm mt-2 mb-2 text-left">
            <p className="line-clamp-2">{description}</p>
          </div>
        )}
        
        {/* Show counts of available data */}
        <div className="flex justify-center gap-2 text-xs mt-2">
          {media && media.length > 0 && (
            <span className="badge badge-sm">{media.length} Photos</span>
          )}
          {modifications && modifications.length > 0 && (
            <span className="badge badge-sm">{modifications.length} Mods</span>
          )}
          {specifications && specifications.length > 0 && (
            <span className="badge badge-sm">{specifications.length} Specs</span>
          )}
          {links && links.length > 0 && (
            <span className="badge badge-sm">{links.length} Links</span>
          )}
        </div>
        
        <div className="flex flex-col gap-2 mt-4">
          <Link
            href={`/vehicle/${id}`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
          >
            View Vehicle
          </Link>
          
          {isOwner && (
            <div className="text-sm text-center mt-1 text-green-600 font-medium">
              You own this vehicle - edit its profile on the vehicle page
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { Vehicle, VehicleWithOwnerAndMeta };