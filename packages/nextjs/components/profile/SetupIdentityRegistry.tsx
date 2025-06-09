"use client";

import React, { useState, useEffect } from 'react';

interface SetupIdentityRegistryProps {
  onSetupComplete?: () => void;
}

export const SetupIdentityRegistry: React.FC<SetupIdentityRegistryProps> = ({ onSetupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check if the identity registry exists
  useEffect(() => {
    const checkIdentityRegistry = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('/api/setup-identity-registry');
        const data = await response.json();
        
        setExists(data.exists);
        if (data.exists) {
          setMessage(`Identity registry exists with ${data.count} records.`);
          if (onSetupComplete) {
            onSetupComplete();
          }
        } else {
          setMessage('Identity registry does not exist. Click the button below to set it up.');
        }
      } catch (error) {
        console.error('Error checking identity registry:', error);
        setError('Failed to check if identity registry exists.');
      } finally {
        setIsChecking(false);
      }
    };

    checkIdentityRegistry();
  }, [onSetupComplete]);

  // Set up the identity registry
  const setupIdentityRegistry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/setup-identity-registry', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Identity registry set up successfully!');
        setExists(true);
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        setError(data.error || 'Failed to set up identity registry.');
      }
    } catch (error) {
      console.error('Error setting up identity registry:', error);
      setError('Failed to set up identity registry.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Checking Identity Registry...</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Identity Registry Setup</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {message && (
        <div className={`${exists ? 'bg-green-100 border-green-500 text-green-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'} border-l-4 p-4 mb-4`} role="alert">
          <p>{message}</p>
        </div>
      )}
      
      {!exists && (
        <button
          onClick={setupIdentityRegistry}
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Setting Up...' : 'Set Up Identity Registry'}
        </button>
      )}
      
      {exists && (
        <p className="text-green-600 font-semibold">
          ✅ Identity registry is set up and ready to use!
        </p>
      )}
    </div>
  );
};