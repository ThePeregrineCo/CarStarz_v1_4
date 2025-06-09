"use client";

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useVehicle } from '../../lib/context/VehicleContext'

interface Comment {
  id: string
  user_wallet: string
  content: string
  created_at: string
}

export function CommentsSection() {
  const { vehicle, isLoading, refetch } = useVehicle()
  const { address } = useAccount()
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const tokenId = vehicle?.token_id || 0

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
        if (!address) {
          throw new Error('Please connect your wallet to comment')
        }
        
        // Use the API route instead of direct Supabase access
        console.log(`Sending comment add request for vehicle ${tokenId}`);
        
        const response = await fetch(`/api/vehicle-comments?tokenId=${tokenId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': address as string, // Explicitly add wallet address to headers
          },
          body: JSON.stringify({
            content
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add comment');
        }
        
        const responseData = await response.json();
        console.log('Comment add successful:', responseData);
        return responseData;
      } catch (error: any) {
        console.error('Error adding comment:', error)
        setError(`Failed to add comment: ${error.message || 'Unknown error'}`)
        throw error;
      }
    },
    onSuccess: () => {
      // Refetch vehicle data
      refetch();
      
      // Reset form
      setComment('');
      setError(null);
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading comments...</span>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      alert('Please connect your wallet to comment')
      return
    }
    if (comment.trim()) {
      addCommentMutation.mutate(comment)
    }
  }

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Comments</h2>
      
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Add a comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            placeholder="Share your thoughts about this vehicle..."
            required
          />
        </div>
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
            disabled={addCommentMutation.isPending || !address}
          >
            {addCommentMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : 'Post Comment'}
          </button>
          {!address && (
            <p className="mt-2 text-sm text-red-500">Connect your wallet to comment</p>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {vehicle?.vehicle_comments?.length ? (
          vehicle.vehicle_comments.map((comment: Comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="font-medium">{truncateAddress(comment.user_wallet)}</div>
                <div className="text-sm text-gray-500">{formatDate(comment.created_at)}</div>
              </div>
              <p className="mt-2 text-gray-700">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  )
}