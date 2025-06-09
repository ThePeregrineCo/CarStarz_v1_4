import React, { useState } from 'react';
import Image from 'next/image';
import { useAddMedia, useDeleteMedia, useUpdateMedia } from '../../../lib/hooks/useVehicleMutations';
import type { CompleteVehicleProfile, VehicleMedia } from '../../../lib/api/vehicleQueriesV3Fixed';

interface VehicleMediaTabProps {
  vehicle: CompleteVehicleProfile;
  isOwner: boolean;
}

/**
 * Tab component for displaying and managing vehicle media
 */
export function VehicleMediaTab({ vehicle, isOwner }: VehicleMediaTabProps) {
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('general');
  const [isFeatured, setIsFeatured] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingMedia, setEditingMedia] = useState<VehicleMedia | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Mutations
  const addMediaMutation = useAddMedia(vehicle.token_id);
  const deleteMediaMutation = useDeleteMedia(vehicle.token_id);
  const updateMediaMutation = useUpdateMedia(vehicle.token_id);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadFile(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle media upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('caption', caption);
      formData.append('category', category);
      formData.append('is_featured', isFeatured.toString());
      
      await addMediaMutation.mutateAsync(formData);
      
      // Reset form
      setUploadFile(null);
      setCaption('');
      setCategory('general');
      setIsFeatured(false);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle edit button click
  const handleEditClick = (media: VehicleMedia) => {
    setEditingMedia(media);
    setEditCaption(media.caption || '');
    setEditCategory(media.category || 'general');
    setEditIsFeatured(media.is_featured || false);
    setIsEditing(true);
    setError(null);
  };
  
  // Handle delete button click
  const handleDeleteClick = (mediaId: string) => {
    if (confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      deleteMediaMutation.mutate(mediaId, {
        onError: (error: any) => {
          console.error('Error deleting media:', error);
          setError(`Failed to delete media: ${error.message || 'Unknown error'}`);
        }
      });
    }
  };
  
  // Handle update media form submission
  const handleUpdateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMedia) return;
    
    updateMediaMutation.mutate({
      mediaId: editingMedia.id,
      caption: editCaption,
      category: editCategory,
      is_featured: editIsFeatured
    }, {
      onSuccess: () => {
        setIsEditing(false);
        setEditingMedia(null);
      },
      onError: (error: any) => {
        console.error('Error updating media:', error);
        setError(`Failed to update media: ${error.message || 'Unknown error'}`);
      }
    });
  };
  
  // Group media by category
  const mediaByCategory = vehicle.vehicle_media?.reduce((acc, media) => {
    const category = media.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(media);
    return acc;
  }, {} as Record<string, typeof vehicle.vehicle_media>);
  
  // Get unique categories
  const categories = mediaByCategory ? Object.keys(mediaByCategory) : [];
  
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">Media Gallery</h2>
      
      {/* Upload form (only shown to owner) */}
      {isOwner && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Media</h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            {/* File input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Image or Video
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>
            
            {/* Preview */}
            {previewUrl && (
              <div className="mt-2">
                <div className="relative h-40 w-40 rounded-md overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>
            )}
            
            {/* Caption */}
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700">
                Caption
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="general">General</option>
                  <option value="exterior">Exterior</option>
                  <option value="interior">Interior</option>
                  <option value="engine">Engine</option>
                  <option value="modifications">Modifications</option>
                </select>
              </div>
            </div>
            
            {/* Featured checkbox */}
            <div className="flex items-center">
              <input
                id="featured"
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                Set as featured image
              </label>
            </div>
            
            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={!uploadFile || isUploading || addMediaMutation.isPending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {isUploading || addMediaMutation.isPending ? 'Uploading...' : 'Upload Media'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Media gallery */}
      {vehicle.vehicle_media && vehicle.vehicle_media.length > 0 ? (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 capitalize">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaByCategory?.[category]?.map((media) => (
                  <div key={media.id} className="group relative">
                    {/* Media item */}
                    <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {media.type === 'image' ? (
                        <Image
                          src={media.url}
                          alt={media.caption || 'Vehicle image'}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="relative h-full w-full bg-black">
                          <iframe
                            src={media.url}
                            title={media.caption || 'Vehicle video'}
                            className="absolute inset-0 w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      )}
                      
                      {/* Featured badge */}
                      {media.is_featured && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          Featured
                        </div>
                      )}
                      
                      {/* Owner controls */}
                      {isOwner && (
                        <div className="absolute top-2 left-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(media)}
                            className="bg-white text-blue-600 p-1 rounded-full hover:bg-blue-50"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(media.id)}
                            className="bg-white text-red-600 p-1 rounded-full hover:bg-red-50"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Caption */}
                    {media.caption && (
                      <div className="mt-2 text-sm text-gray-700">
                        {media.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No media</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isOwner 
              ? 'Upload images or videos to showcase your vehicle.' 
              : 'This vehicle has no media yet.'}
          </p>
        </div>
      )}
      
      {/* Edit Media Modal */}
      {isEditing && editingMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Media</h3>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleUpdateMedia} className="space-y-4">
              {/* Media preview */}
              <div className="relative h-40 w-full rounded-md overflow-hidden bg-gray-100">
                {editingMedia.type === 'image' ? (
                  <Image
                    src={editingMedia.url}
                    alt={editingMedia.caption || 'Vehicle image'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="relative h-full w-full bg-black">
                    <iframe
                      src={editingMedia.url}
                      title={editingMedia.caption || 'Vehicle video'}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
              
              {/* Caption */}
              <div>
                <label htmlFor="edit-caption" className="block text-sm font-medium text-gray-700">
                  Caption
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="edit-caption"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1">
                  <select
                    id="edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="general">General</option>
                    <option value="exterior">Exterior</option>
                    <option value="interior">Interior</option>
                    <option value="engine">Engine</option>
                    <option value="modifications">Modifications</option>
                  </select>
                </div>
              </div>
              
              {/* Featured checkbox */}
              <div className="flex items-center">
                <input
                  id="edit-featured"
                  type="checkbox"
                  checked={editIsFeatured}
                  onChange={(e) => setEditIsFeatured(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-featured" className="ml-2 block text-sm text-gray-900">
                  Set as featured image
                </label>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMediaMutation.isPending}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {updateMediaMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}