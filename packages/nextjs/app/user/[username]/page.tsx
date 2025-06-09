"use client";

import React from 'react';
import { UserProfileV2 } from '../../../components/profile/UserProfileV2';

export default function UserProfilePage({ params }: { params: { username: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <UserProfileV2 username={params.username} />
    </div>
  );
}