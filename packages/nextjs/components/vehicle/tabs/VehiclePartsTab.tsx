import React, { useState, useRef } from 'react';
import { useAddPart } from '../../../lib/hooks/useVehicleMutations';
import type { CompleteVehicleProfile } from '../../../lib/api/vehicleQueries';

interface VehiclePartsTabProps {
  vehicle: CompleteVehicleProfile;
  isOwner: boolean;
}

/**
 * Tab component for displaying and managing vehicle parts
 */
export function VehiclePartsTab({ vehicle, isOwner }: VehiclePartsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    category: 'engine',
    description: '',
    link: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addPartMutation = useAddPart(vehicle.token_id);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Include the image if one is selected
      const dataToSubmit = selectedImage
        ? { ...formData, image: selectedImage }
        : formData;
        
      await addPartMutation.mutateAsync(dataToSubmit);
      
      // Reset form
      setFormData({
        category: 'engine',
        description: '',
        link: '',
      });
      setSelectedImage(null);
      setImagePreview(null);
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding part:', error);
    }
  };
  
  // Group parts by category
  const partsByCategory = vehicle.parts?.reduce((acc, part) => {
    const category = part.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(part);
    return acc;
  }, {} as Record<string, typeof vehicle.parts>);
  
  // Get unique categories
  const categories = partsByCategory ? Object.keys(partsByCategory) : [];
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Parts & Modifications</h2>
        
        {/* Add part button (only shown to owner) */}
        {isOwner && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Part
          </button>
        )}
      </div>
      
      {/* Add part form */}
      {isOwner && isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Part</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="engine">Engine</option>
                  <option value="transmission">Transmission</option>
                  <option value="suspension">Suspension</option>
                  <option value="brakes">Brakes</option>
                  <option value="exhaust">Exhaust</option>
                  <option value="wheels">Wheels & Tires</option>
                  <option value="exterior">Exterior</option>
                  <option value="interior">Interior</option>
                  <option value="electronics">Electronics</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe the part or modification..."
                  required
                />
              </div>
            </div>
            
            {/* Link */}
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700">
                Link (Optional)
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="https://example.com/part"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Add a link to where this part can be purchased
              </p>
            </div>
            
            {/* Image Upload */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Image (Optional)
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <input
                  type="file"
                  id="image"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Choose Image
                </button>
                {selectedImage && (
                  <span className="text-sm text-gray-500">
                    {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
                  </span>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-auto object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addPartMutation.isPending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {addPartMutation.isPending ? 'Adding...' : 'Add Part'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Parts list */}
      {vehicle.parts && vehicle.parts.length > 0 ? (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 capitalize">{category}</h3>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {partsByCategory?.[category]?.map((part) => (
                    <li key={part.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {part.image_url && (
                              <img
                                src={part.image_url}
                                alt={part.description}
                                className="h-10 w-10 mr-3 object-cover rounded-md"
                              />
                            )}
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {part.description}
                            </p>
                          </div>
                          {part.link && (
                            <div className="ml-2 flex-shrink-0 flex">
                              <a
                                href={part.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                View Part
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No parts</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isOwner 
              ? 'Add parts and modifications to document your vehicle build.' 
              : 'This vehicle has no parts or modifications listed yet.'}
          </p>
          {isOwner && !isAdding && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add First Part
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}