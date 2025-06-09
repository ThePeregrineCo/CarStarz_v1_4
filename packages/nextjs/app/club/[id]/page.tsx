"use client";

import React from 'react';
import { ClubProfileV2 } from '../../../components/profile/ClubProfileV2';

export default function ClubProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Club Profile</h1>
      <ClubProfileV2 clubId={params.id} />
    </div>
  );
}