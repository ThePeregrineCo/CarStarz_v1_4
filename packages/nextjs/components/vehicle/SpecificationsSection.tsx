"use client"

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useVehicle } from '../../lib/context/VehicleContext'

type Specification = {
  id: string
  category: string
  name: string
  value: string
  created_at: string
  updated_at: string
}

export function SpecificationsSection() {
  const { vehicle, isOwner } = useVehicle()
  const { address } = useAccount()
  const [isAdding, setIsAdding] = useState(false)
  const [specCategory, setSpecCategory] = useState('engine')
  const [specName, setSpecName] = useState('')
  const [specValue, setSpecValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [specToDelete, setSpecToDelete] = useState<Specification | null>(null)

  const tokenId = vehicle?.token_id || 0

  // Fetch specifications directly from Supabase
  const { 
    data: specifications, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['vehicle-specifications', tokenId],
    queryFn: async () => {
      try {
        console.log(`Fetching specifications for vehicle ${tokenId}`);
        
        // Use the API route instead of direct Supabase access
        const response = await fetch(`/api/vehicle-specifications?tokenId=${tokenId}`, {
          headers: {
            'x-wallet-address': address as string, // Explicitly add wallet address to headers
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch specifications');
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} specifications`);
        return data as Specification[];
      } catch (error: any) {
        console.error('Error fetching specifications:', error)
        setError(`Failed to fetch specifications: ${error.message}`)
        return []
      }
    },
    enabled: !!tokenId,
  })

  // Add specification mutation
  const addSpecMutation = useMutation({
    mutationFn: async (data: { category: string; name: string; value: string }) => {
      try {
        const response = await fetch('/api/vehicle-specifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': address as string, // Explicitly add wallet address to headers
          },
          body: JSON.stringify({
            tokenId,
            category: data.category,
            name: data.name,
            value: data.value,
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add specification')
        }
        
        return response.json()
      } catch (error: any) {
        console.error('Error adding specification:', error)
        setError(`Failed to add specification: ${error.message || 'Unknown error'}`)
        throw error
      }
    },
    onSuccess: () => {
      // Refetch specifications
      refetch()
      
      // Reset form
      setIsAdding(false)
      setSpecCategory('engine')
      setSpecName('')
      setSpecValue('')
      setError(null)
    },
  })

  // Delete specification mutation
  const deleteSpecMutation = useMutation({
    mutationFn: async (specId: string) => {
      const response = await fetch(`/api/vehicle-specifications?id=${specId}`, {
        method: 'DELETE',
        headers: {
          'x-wallet-address': address as string, // Explicitly add wallet address to headers
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete specification')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Refetch specifications
      refetch()
      
      // Close the delete modal
      setShowDeleteConfirm(false)
      setSpecToDelete(null)
    },
    onError: (error) => {
      console.error('Error deleting specification:', error)
      setError(`Failed to delete specification: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addSpecMutation.mutate({
      category: specCategory,
      name: specName,
      value: specValue,
    })
  }

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (specToDelete) {
      deleteSpecMutation.mutate(specToDelete.id)
    }
  }

  // Group specifications by category
  const groupedSpecs = (specifications || []).reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = []
    }
    acc[spec.category].push(spec)
    return acc
  }, {} as Record<string, Specification[]>)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading specifications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Specifications</h2>
      
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {isOwner && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          Add Specification
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={specCategory}
              onChange={(e) => setSpecCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="engine">Engine</option>
              <option value="transmission">Transmission</option>
              <option value="dimensions">Dimensions</option>
              <option value="performance">Performance</option>
              <option value="fuel">Fuel Economy</option>
              <option value="suspension">Suspension</option>
              <option value="brakes">Brakes</option>
              <option value="wheels">Wheels & Tires</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Specification Name
            </label>
            <input
              type="text"
              value={specName}
              onChange={(e) => setSpecName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Horsepower"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Value
            </label>
            <input
              type="text"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., 300 hp"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
              disabled={addSpecMutation.isPending}
            >
              {addSpecMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Add Specification'}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Display specifications by category */}
      {Object.keys(groupedSpecs).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSpecs).map(([category, specs]) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-medium text-gray-700 capitalize">
                {category}
              </div>
              <div className="divide-y divide-gray-200">
                {specs.map((spec) => (
                  <div key={spec.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="font-medium text-gray-700">{spec.name}</div>
                      <div className="text-gray-900">{spec.value}</div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setSpecToDelete(spec);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-red-500 hover:text-red-700 ml-4"
                        title="Delete specification"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No specifications added yet</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Specification</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete &ldquo;{specToDelete?.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleteSpecMutation.isPending}
              >
                {deleteSpecMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}