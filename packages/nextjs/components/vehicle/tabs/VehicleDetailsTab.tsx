import React, { useState } from 'react';
import { useUpdateVehicle } from '../../../lib/hooks/useVehicleMutations';
import type { CompleteVehicleProfile } from '../../../lib/api/vehicleQueriesV2';

interface VehicleDetailsTabProps {
  vehicle: CompleteVehicleProfile;
  isOwner: boolean;
}

/**
 * Tab component for displaying and editing vehicle details
 */
export function VehicleDetailsTab({ vehicle, isOwner }: VehicleDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: vehicle.name || '',
    description: vehicle.description || '',
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: vehicle.year || 0,
    vin: vehicle.vin || '',
  });
  
  const updateMutation = useUpdateVehicle(vehicle.token_id);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData, {
      onSuccess: () => setIsEditing(false),
    });
  };
  
  // Display mode
  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">About This Vehicle</h2>
          <p className="mt-2 text-gray-700 whitespace-pre-line">
            {vehicle.description || 'No description available.'}
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Vehicle Information</h3>
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Make</dt>
              <dd className="mt-1 text-sm text-gray-900">{vehicle.make}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Model</dt>
              <dd className="mt-1 text-sm text-gray-900">{vehicle.model}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Year</dt>
              <dd className="mt-1 text-sm text-gray-900">{vehicle.year}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">VIN</dt>
              <dd className="mt-1 text-sm text-gray-900">{vehicle.vin}</dd>
            </div>
          </dl>
        </div>
        
        {/* Specifications section */}
        {vehicle.vehicle_specifications && vehicle.vehicle_specifications.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900">Specifications</h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {vehicle.vehicle_specifications.map((spec) => (
                <div key={spec.id} className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{spec.name}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        
        {/* Edit button (only shown to owner) */}
        {isOwner && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Details
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Edit mode
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Edit Vehicle Details</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Vehicle Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
            VIN
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="vin"
              id="vin"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="make" className="block text-sm font-medium text-gray-700">
            Make
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="make"
              id="make"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            Model
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="model"
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="year"
              id="year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="sm:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}