import { useState } from 'react'
import { useVehicleOwnership } from '../lib/hooks/useVehicleOwnership'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface EditableVehicleProfileProps {
  tokenId: number
}

export function EditableVehicleProfile({ tokenId }: EditableVehicleProfileProps) {
  const { vehicle: vehicleProfile, isLoading, isOwner } = useVehicleOwnership(tokenId)
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Clear any previous errors
      setErrorMessage(null)
      
      console.log(`Sending update request for vehicle ${tokenId}:`, data)
      
      // Use the API route instead of direct Supabase access
      const response = await fetch(`/api/vehicle-profiles?tokenId=${tokenId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Update failed:', responseData)
        throw new Error(responseData.error || responseData.details || 'Failed to update profile');
      }
      
      console.log('Update successful:', responseData)
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Mutation success, updating cache with:', data);
      
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenId] });
      
      // Force a refetch to ensure we have the latest data
      queryClient.refetchQueries({ queryKey: ['vehicle', tokenId] });
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error)
      setErrorMessage(error.message || 'An error occurred while updating the profile')
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!vehicleProfile) {
    return <div className="p-4 text-red-500">Vehicle profile not found</div>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {errorMessage}
          </div>
        )}
        
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
              setIsEditing(false)
              setErrorMessage(null)
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{vehicleProfile.name || 'Unnamed Vehicle'}</h2>
        <p className="text-gray-600">{vehicleProfile.description || 'No description available'}</p>
      </div>
      {isOwner && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFormData({
                name: vehicleProfile.name || '',
                description: vehicleProfile.description || '',
              })
              setIsEditing(true)
              setErrorMessage(null)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  )
}