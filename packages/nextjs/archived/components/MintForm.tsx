/**
 * ARCHIVED: May 29, 2025
 * 
 * This component has been archived as part of implementing the commit-confirm pattern for NFT minting.
 * 
 * Reasons for archiving:
 * - Does not implement the commit-confirm pattern
 * - Calls the /api/mint endpoint and then immediately mints the NFT without verification
 * - Has been replaced by the new MintWithConfirmation.tsx component
 * 
 * The new implementation separates the minting process into two steps:
 * 1. Prepare metadata and get token ID
 * 2. Mint on blockchain and verify before creating database records
 */

import { useState } from "react";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const MintForm = () => {
  const [formData, setFormData] = useState({
    vin: "",
    name: "",
    make: "",
    model: "",
    year: "",
    image: null as File | null,
  });

  const { writeAsync: mintVehicle } = useScaffoldContractWrite({
    contractName: "VehicleRegistry",
    functionName: "mintVehicleWithId",
  });

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
    
    try {
      // Create form data for the API
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          submitData.append(key, value);
        }
      });

      // Call the mint API
      const response = await fetch("/api/mint", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        throw new Error("Failed to mint vehicle");
      }

      const { tokenId, metadataURI } = await response.json();

      // Call the contract to mint
      await mintVehicle({
        args: [tokenId, formData.vin, formData.name, metadataURI],
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
      alert("Failed to mint vehicle. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-base-200 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Mint New Vehicle</h2>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">VIN</span>
        </label>
        <input
          type="text"
          name="vin"
          value={formData.vin}
          onChange={handleInputChange}
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Make</span>
        </label>
        <input
          type="text"
          name="make"
          value={formData.make}
          onChange={handleInputChange}
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Model</span>
        </label>
        <input
          type="text"
          name="model"
          value={formData.model}
          onChange={handleInputChange}
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Year</span>
        </label>
        <input
          type="text"
          name="year"
          value={formData.year}
          onChange={handleInputChange}
          className="input input-bordered"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Vehicle Image</span>
        </label>
        <input
          type="file"
          name="image"
          onChange={handleImageChange}
          className="file-input file-input-bordered"
          accept="image/*"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary w-full">
        Mint Vehicle
      </button>
    </form>
  );
};