import React, { useState } from 'react';
import { useAddBuilder } from '../../../lib/hooks/useVehicleMutations';
import type { CompleteVehicleProfile } from '../../../lib/api/vehicleQueriesV2';

import type { Builder } from '../../../lib/api/vehicleQueriesV2';

// Extended type for builders with relationship data
// This needs to be compatible with Builder & Partial<BuilderVehicle> from vehicleQueriesV2.ts
interface BuilderWithRelationship extends Builder {
  // Fields from the builder_vehicles junction table
  work_type?: string;
  build_description?: string;
  build_date?: string | null;
}

interface VehicleBuildersTabProps {
  vehicle: CompleteVehicleProfile;
  isOwner: boolean;
}

/**
 * Tab component for displaying and managing vehicle builders/shops
 */
export function VehicleBuildersTab({ vehicle, isOwner }: VehicleBuildersTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    builderId: '',
    buildDate: '',
    buildDescription: '',
    workType: '', // What part of the vehicle they worked on
  });
  const [builderSearch, setBuilderSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string, business_name: string, business_type: string}>>([]);
  
  const addBuilderMutation = useAddBuilder(vehicle.token_id);
  
  // Handle builder search
  const handleSearch = async () => {
    if (!builderSearch.trim()) return;
    
    try {
      // Search for businesses using the API
      const response = await fetch(`/api/businesses?search=${encodeURIComponent(builderSearch)}&limit=5`);
      
      if (!response.ok) {
        throw new Error(`Error searching businesses: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data.businesses || []);
    } catch (error) {
      console.error('Error searching builders:', error);
    }
  };
  
  // Handle builder selection
  const selectBuilder = (builder: {id: string, business_name: string}) => {
    setFormData({
      ...formData,
      builderId: builder.id,
    });
    setSearchResults([]);
    setBuilderSearch(builder.business_name);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addBuilderMutation.mutateAsync(formData);
      
      // Reset form
      setFormData({
        builderId: '',
        buildDate: '',
        buildDescription: '',
        workType: '',
      });
      setBuilderSearch('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding builder:', error);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Builders & Shops</h2>
          <p className="text-sm text-gray-500 mt-1">
            Multiple builders can work on different parts of your vehicle
          </p>
        </div>
        
        {/* Add builder button (only shown to owner) */}
        {isOwner && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Builder
          </button>
        )}
      </div>
      
      {/* Add builder form */}
      {isOwner && isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Builder or Shop</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Builder search */}
            <div>
              <label htmlFor="builderSearch" className="block text-sm font-medium text-gray-700">
                Search for Builder
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <div className="relative flex items-stretch flex-grow">
                  <input
                    type="text"
                    id="builderSearch"
                    value={builderSearch}
                    onChange={(e) => setBuilderSearch(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                    placeholder="Enter builder name..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  Search
                </button>
              </div>
              
              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map((builder) => (
                      <li 
                        key={builder.id}
                        onClick={() => selectBuilder(builder)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">{builder.business_name}</p>
                          <p className="text-sm text-gray-500">{builder.business_type}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Build date */}
            <div>
              <label htmlFor="buildDate" className="block text-sm font-medium text-gray-700">
                Build Date (Optional)
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="buildDate"
                  value={formData.buildDate}
                  onChange={(e) => setFormData({ ...formData, buildDate: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* Work type */}
            <div>
              <label htmlFor="workType" className="block text-sm font-medium text-gray-700">
                Work Type
              </label>
              <div className="mt-1">
                <select
                  id="workType"
                  value={formData.workType}
                  onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select work type</option>
                  <option value="engine">Engine Work</option>
                  <option value="transmission">Transmission</option>
                  <option value="suspension">Suspension</option>
                  <option value="brakes">Brakes</option>
                  <option value="exhaust">Exhaust</option>
                  <option value="bodywork">Body Work</option>
                  <option value="paint">Paint</option>
                  <option value="interior">Interior</option>
                  <option value="electrical">Electrical</option>
                  <option value="tuning">Tuning</option>
                  <option value="full_build">Full Build</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Build description */}
            <div>
              <label htmlFor="buildDescription" className="block text-sm font-medium text-gray-700">
                Work Description
              </label>
              <div className="mt-1">
                <textarea
                  id="buildDescription"
                  value={formData.buildDescription}
                  onChange={(e) => setFormData({ ...formData, buildDescription: e.target.value })}
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe the specific work done by this builder..."
                  required
                />
              </div>
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
                disabled={!formData.builderId || !formData.workType || !formData.buildDescription || addBuilderMutation.isPending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {addBuilderMutation.isPending ? 'Adding...' : 'Add Builder'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Builders list */}
      {vehicle.builders && vehicle.builders.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {vehicle.builders.map((builder: BuilderWithRelationship) => (
              <li key={builder.id} className="border-b last:border-b-0">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {builder.business_name}
                      </h4>
                      <p className="text-sm text-gray-500">{builder.business_type}</p>
                      
                      {/* Work type badge */}
                      {builder.work_type && (
                        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                          {builder.work_type}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* Work description */}
                      {builder.build_description && (
                        <p className="text-sm text-gray-700">{builder.build_description}</p>
                      )}
                      
                      {/* Builder specialties */}
                      {builder.specialties && builder.specialties.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {builder.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Build date */}
                      {builder.build_date && (
                        <p className="mt-2 text-xs text-gray-500">
                          Work completed: {new Date(builder.build_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No builders</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isOwner
              ? 'Add builders and shops that have worked on different parts of your vehicle.'
              : 'This vehicle has no builders or shops listed yet.'}
          </p>
          {isOwner && !isAdding && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add First Builder
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}