"use client";

import React from 'react';
import { BusinessProfileV2 } from '../../../components/profile/BusinessProfileV2';

export default function BusinessPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Business Profile</h1>
      <BusinessProfileV2 businessId={params.id} />
    </div>
  );
}