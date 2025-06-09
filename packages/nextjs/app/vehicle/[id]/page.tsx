'use client';

import { useParams } from 'next/navigation';
import React from 'react';
import { VehicleProfileCascade } from '../../../components/VehicleProfileCascade';
import { AuthProvider } from '../../../lib/auth/AuthContext';

/**
 * Vehicle profile page
 */
export default function VehiclePage() {
  const params = useParams();
  const id = params?.id as string;

  if (!id) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <h2 className="text-xl font-bold">Error</h2>
          <p>No token ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="container mx-auto p-4 max-w-6xl">
        <VehicleProfileCascade tokenId={id} />
      </div>
    </AuthProvider>
  );
}