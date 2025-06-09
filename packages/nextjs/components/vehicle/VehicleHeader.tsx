"use client"

import { useContractRead } from 'wagmi'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { blo } from 'blo'
import { useVehicle } from '../../lib/context/VehicleContext'

const VEHICLE_NFT_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getVehicleByTokenId',
    outputs: [
      { name: 'make', type: 'string' },
      { name: 'model', type: 'string' },
      { name: 'year', type: 'uint256' },
      { name: 'vin', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function VehicleHeader() {
  const { vehicle, isLoading, isOwner } = useVehicle();
  const [metadata, setMetadata] = useState<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  
  // Get tokenId from the vehicle context
  const tokenId = vehicle?.token_id || 0;
  
  // Read tokenURI from NFT contract
  const { data: tokenURI } = useContractRead({
    address: process.env.NEXT_PUBLIC_VEHICLE_NFT_ADDRESS as `0x${string}`,
    abi: VEHICLE_NFT_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  })

  // Read vehicle data directly from contract
  const { data: vehicleData } = useContractRead({
    address: process.env.NEXT_PUBLIC_VEHICLE_NFT_ADDRESS as `0x${string}`,
    abi: VEHICLE_NFT_ABI,
    functionName: 'getVehicleByTokenId',
    args: [BigInt(tokenId)],
  })

  // Read owner address
  const { data: ownerAddress } = useContractRead({
    address: process.env.NEXT_PUBLIC_VEHICLE_NFT_ADDRESS as `0x${string}`,
    abi: VEHICLE_NFT_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  })

  // Fetch metadata from IPFS
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenURI) return;
      try {
        const response = await fetch(tokenURI);
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    
    fetchMetadata();
  }, [tokenURI]);

  // Extract vehicle details from metadata or contract data
  const getVehicleDetails = () => {
    const details = {
      name: '',
      make: '',
      model: '',
      year: '',
      image: '/images/vehicles/default.png',
    }

    // Try to get data from metadata
    if (metadata) {
      details.name = metadata.name || ''
      details.image = metadata.image || details.image
      
      if (metadata.attributes) {
        const makeAttr = metadata.attributes.find((a: any) => a.trait_type === 'Make')
        const modelAttr = metadata.attributes.find((a: any) => a.trait_type === 'Model')
        const yearAttr = metadata.attributes.find((a: any) => a.trait_type === 'Year')
        
        if (makeAttr) details.make = makeAttr.value
        if (modelAttr) details.model = modelAttr.value
        if (yearAttr) details.year = yearAttr.value
      }
    }

    // If we have contract data, use it as fallback
    if (vehicleData) {
      if (!details.make && vehicleData[0]) details.make = vehicleData[0]
      if (!details.model && vehicleData[1]) details.model = vehicleData[1]
      if (!details.year && vehicleData[2]) details.year = vehicleData[2].toString()
    }

    // Use vehicle profile data if available
    if (vehicle) {
      if (!details.make && vehicle.make) details.make = vehicle.make
      if (!details.model && vehicle.model) details.model = vehicle.model
      if (!details.year && vehicle.year) details.year = vehicle.year.toString()
      
      // If there's a featured image in the profile, use it
      const featuredMedia = vehicle.vehicle_media?.find(m => m.is_featured)
      if (featuredMedia && featuredMedia.url) {
        details.image = featuredMedia.url
      }
    }

    // Construct a name if we don't have one from metadata
    if (!details.name && details.year && details.make && details.model) {
      details.name = `${details.year} ${details.make} ${details.model}`
    } else if (!details.name) {
      details.name = 'Unknown Vehicle'
    }

    return details
  }

  const vehicleDetails = getVehicleDetails()

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  if (isLoading || (!metadata && !vehicleData)) {
    return (
      <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Top navigation bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
        <Link href="/" className="bg-white bg-opacity-80 p-2 rounded-full shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        
        <div className="flex items-center space-x-3">
          <button className="bg-white bg-opacity-80 p-2 rounded-full shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          
          <button className="bg-white bg-opacity-80 p-2 rounded-full shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* CARSTARZ logo */}
      <div className="absolute top-16 left-4 z-10">
        <div className="flex items-center">
          <span className="text-red-600 text-2xl mr-1">★</span>
          <span className="text-white font-bold text-xl tracking-wider shadow-sm">CARSTARZ</span>
        </div>
      </div>
      
      {/* Hero image */}
      <div className="w-full h-[400px] bg-gray-200">
        {vehicleDetails.image && (
          <img
            src={vehicleDetails.image}
            alt={vehicleDetails.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {/* Vehicle details section - Single column layout with adjusted padding */}
      <div className="bg-white px-8 py-6 rounded-t-3xl -mt-6 relative z-10 shadow-md">
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Vehicle Name */}
          <h1 className="text-3xl font-bold text-gray-900 break-normal">{vehicleDetails.name}</h1>
          
          {/* Year, Make, Model - without label */}
          <div>
            <p className="text-gray-900 text-lg whitespace-normal">{vehicleDetails.year} {vehicleDetails.make} {vehicleDetails.model}</p>
          </div>
          
          {/* VIN (if available) - inline display */}
          {vehicle?.vin && (
            <div className="flex items-center">
              <p className="text-gray-700 font-medium mr-2">VIN:</p>
              <p className="text-gray-900">{vehicle.vin}</p>
            </div>
          )}
          
          {/* Owner info */}
          <div className="flex items-center pt-3 mt-1">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-white rounded-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src={blo(ownerAddress as `0x${string}` || "0x0000000000000000000000000000000000000000")}
                  alt="Owner"
                />
              </div>
              <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <div className="ml-3">
              <span className="text-sm text-gray-500">Verified Owner</span>
              <p className="text-sm font-medium text-blue-600">
                {ownerAddress ?
                  `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}` :
                  'Unknown Owner'}
              </p>
            </div>
          </div>
          
          {/* Owner indicator */}
          {isOwner && (
            <div className="p-2 bg-blue-50 rounded-md text-sm text-blue-700">
              You are the owner of this vehicle
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${isLiked ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>Like</span>
            </button>
            
            <button
              onClick={handleSave}
              className={`flex items-center space-x-1 ${isSaved ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Save to Collection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}