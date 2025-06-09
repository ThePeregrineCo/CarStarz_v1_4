import { useVehicleOwnership } from '../lib/hooks/useVehicleOwnership'
import { ReactNode } from 'react'

interface VehicleOwnershipGateProps {
  tokenId: number
  children: ReactNode
}

export function VehicleOwnershipGate({ 
  tokenId, 
  children
}: VehicleOwnershipGateProps) {
  const { isLoading, isOwner } = useVehicleOwnership(tokenId)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Only show content if the user is the owner
  if (isOwner) {
    return <>{children}</>
  }

  // If not the owner and not in development, show access denied
  return (
    <div className="p-4 bg-red-50 border border-red-100 rounded text-center">
      <p className="text-red-700 font-medium">Access Denied</p>
      <p className="text-red-600 text-sm mt-1">You must be the owner of this vehicle to access this content.</p>
    </div>
  )
}