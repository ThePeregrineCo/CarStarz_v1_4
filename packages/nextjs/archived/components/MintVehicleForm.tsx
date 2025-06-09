/**
 * ARCHIVED: May 29, 2025
 * 
 * This component has been archived as part of implementing the commit-confirm pattern for NFT minting.
 * 
 * Reasons for archiving:
 * - Similar to MintForm.tsx but with a different UI
 * - Does not implement the commit-confirm pattern
 * - Directly calls the blockchain after getting metadata from the API
 * - Has been replaced by the new MintWithConfirmation.tsx component
 * 
 * The new implementation separates the minting process into two steps:
 * 1. Prepare metadata and get token ID
 * 2. Mint on blockchain and verify before creating database records
 */

"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

export const MintVehicleForm = () => {
  const [formData, setFormData] = useState({
    vin: "",
    name: "",
    make: "",
    model: "",
    year: "",
    image: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const { writeContract } = useScaffoldWriteContract({ contractName: "VehicleRegistry" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value);
        }
      });
      
      // Add the connected wallet address
      if (connectedAddress) {
        formDataToSend.append("ownerWallet", connectedAddress.toLowerCase());
      }

      // Call the mint API
      const response = await fetch("/api/mint", {
        method: "POST",
        body: formDataToSend,
        headers: {
          'x-wallet-address': connectedAddress || '',
        }
      });

      // Handle response
      const responseData = await response.json();

      if (!response.ok) {
        // Check if the error is due to missing profile
        if (responseData.code === "PROFILE_REQUIRED") {
          setError("You need to create a profile before minting a vehicle.");
          
          // Redirect to profile page after a short delay
          setTimeout(() => {
            if (connectedAddress) {
              router.push(`/profile/${connectedAddress}`);
            }
          }, 3000);
          
          return;
        }
        
        throw new Error(responseData.error || "Failed to mint vehicle");
      }

      const { tokenId, metadataURI } = responseData;

      console.log("Minting with tokenId:", tokenId, "type:", typeof tokenId);
      console.log("Minting with vin:", formData.vin, "type:", typeof formData.vin);
      console.log("Minting with name:", formData.name, "type:", typeof formData.name);
      console.log("Minting with metadataURI:", metadataURI, "type:", typeof metadataURI);

      // Convert tokenId to BigInt
      const tokenIdBigInt = BigInt(tokenId);

      // Call the smart contract
      await writeContract({
        functionName: "mintVehicleWithId",
        args: [tokenIdBigInt, formData.vin, formData.name, metadataURI],
      });

      // Reset form
      setFormData({
        vin: "",
        name: "",
        make: "",
        model: "",
        year: "",
        image: null,
      });

      alert("Vehicle minted successfully!");
    } catch (error) {
      console.error("Error minting vehicle:", error);
      setError(error instanceof Error ? error.message : "Failed to mint vehicle. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-base-200 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Mint New Vehicle</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">VIN</label>
          <input
            type="text"
            name="vin"
            value={formData.vin}
            onChange={handleInputChange}
            required
            className="input input-bordered w-full"
            placeholder="Enter VIN number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="input input-bordered w-full"
            placeholder="Enter vehicle name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            required
            className="input input-bordered w-full"
            placeholder="Enter vehicle year"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Make</label>
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleInputChange}
            required
            className="input input-bordered w-full"
            placeholder="Enter vehicle make"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleInputChange}
            required
            className="input input-bordered w-full"
            placeholder="Enter vehicle model"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
            className="file-input file-input-bordered w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? "Minting..." : "Mint Vehicle"}
        </button>
      </form>
    </div>
  );
};