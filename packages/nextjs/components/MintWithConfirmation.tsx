import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { ErrorDisplay } from "./ui/ErrorDisplay";

interface MintFormData {
  vin: string;
  name: string;
  make: string;
  model: string;
  year: string;
  image: File | null;
}

export const MintWithConfirmation = () => {
  const { address } = useAccount();
  const [formData, setFormData] = useState<MintFormData>({
    vin: "",
    name: "",
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    image: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mintStep, setMintStep] = useState<"initial" | "minting" | "complete">("initial");
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<any | null>(null);
  const [identityId, setIdentityId] = useState<string | null>(null);

  // Get contract info and write function for minting
  const { data: contractData } = useDeployedContractInfo({
    contractName: "VehicleRegistry",
  });
  
  console.log("VehicleRegistry contract address:", contractData?.address);
  
  const { writeContract } = useScaffoldWriteContract({
    contractName: "VehicleRegistry",
  });

  // We don't need to read the contract for this component
  /*
  const { data } = useScaffoldReadContract({
    contractName: "VehicleRegistry",
    functionName: "totalSupply",
    watch: true,
  });
  */

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  // Step 1: Prepare the mint by getting a token ID and metadata from the server
  const prepareMint = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate form data
      if (!formData.vin || !formData.name || !formData.make || !formData.model || !formData.year || !formData.image) {
        throw new Error("Please fill in all required fields");
      }

      // Create form data to send to the server
      const apiFormData = new FormData();
      apiFormData.append("vin", formData.vin);
      apiFormData.append("name", formData.name);
      apiFormData.append("make", formData.make);
      apiFormData.append("model", formData.model);
      apiFormData.append("year", formData.year);
      apiFormData.append("image", formData.image);

      // Add wallet address to headers
      const headers = new Headers();
      if (address) {
        headers.append("x-wallet-address", address);
      }

      // Call the mint API to get token ID and metadata
      const response = await fetch("/api/mint", {
        method: "POST",
        body: apiFormData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to prepare mint");
      }

      const data = await response.json();
      console.log("Mint preparation successful:", data);

      // Store the token ID, vehicle data, and identity ID for later use
      setTokenId(data.tokenId);
      setVehicleData(data.vehicleData);
      setIdentityId(data.identityId);
      console.log("Identity ID received from mint API:", data.identityId);
      setMintStep("minting");
      
    } catch (error: any) {
      console.error("Error preparing mint:", error);
      setError(error.message || "Failed to prepare mint");
      setMintStep("initial");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Execute the blockchain mint transaction
  const executeMint = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!tokenId || !address) {
        throw new Error("Missing token ID or wallet address");
      }

      // Call the contract to mint the NFT
      const tx = await writeContract({
        functionName: "mintVehicleWithId",
        args: [
          BigInt(tokenId || "0"),
          formData.vin,
          formData.name,
          `/metadata/${tokenId}.json`
        ],
      });
      
      if (tx) {
        console.log("Mint transaction successful:", tx);
        setTxHash(tx);
        // Automatically confirm the mint
        await confirmMint(tx);
      }
      
      // Note: The onSuccess callback will set txHash and update mintStep to "confirming"
      
    } catch (error: any) {
      console.error("Error executing mint transaction:", error);
      setError(error.message || "Failed to execute mint transaction");
      setMintStep("initial");
      setIsLoading(false);
    }
  };

  // Step 3: Confirm the mint with the server
  const confirmMint = async (transactionHash?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const hashToUse = transactionHash || txHash;
      
      if (!tokenId || !hashToUse || !vehicleData || !address || !identityId) {
        throw new Error("Missing required data for confirmation");
      }

      console.log("Confirming mint with the following data:");
      console.log("- Token ID:", tokenId);
      console.log("- Transaction Hash:", hashToUse);
      console.log("- Vehicle Data:", vehicleData);
      console.log("- Wallet Address:", address);
      console.log("- Identity ID:", identityId);

      // Add wallet address to headers
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      if (address) {
        headers.append("x-wallet-address", address);
      }

      console.log("Sending request to /api/mint-confirm...");
      
      // Call the mint-confirm API to create database records
      let response;
      try {
        response = await fetch("/api/mint-confirm", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tokenId,
            txHash,
            vehicleData,
            identityId,
          }),
        });
        
        console.log("Response status:", response.status);
      } catch (fetchError: any) {
        console.error("Network error during fetch:", fetchError);
        throw new Error(`Network error: ${fetchError.message || String(fetchError)}`);
      }
      
      // Get the response body as text first to debug
      let responseText;
      try {
        responseText = await response.text();
        console.log("Response body:", responseText);
      } catch (textError: any) {
        console.error("Error getting response text:", textError);
        throw new Error(`Error reading response: ${textError.message || String(textError)}`);
      }
      
      // Parse the response as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        console.error("Error response from server:", data);
        let errorMessage = "Failed to confirm mint";
        
        if (data.error) {
          errorMessage = data.error;
          if (data.details) {
            errorMessage += `: ${data.details}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      console.log("Mint confirmation successful:", data);

      setSuccess(`Vehicle successfully minted with token ID ${tokenId}. The vehicle profile and featured image have been created.`);
      setMintStep("complete");
      
    } catch (error: any) {
      console.error("Error confirming mint:", error);
      setError(error.message || "Failed to confirm mint");
      
      // Don't get stuck in the confirming state if there's an error
      // Instead, allow the user to try again
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await prepareMint();
  };

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (mintStep) {
      case "initial":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">VIN</label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Image</label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                className="mt-1 block w-full"
                accept="image/*"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : "Start Minting Process"}
            </button>
          </form>
        );
      
      case "minting":
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <h3 className="text-lg font-medium">Ready to mint your vehicle</h3>
              <p className="mt-2">Token ID: {tokenId}</p>
              <p className="mt-1">{formData.year} {formData.make} {formData.model}</p>
            </div>
            <button
              onClick={executeMint}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : "Mint on Blockchain"}
            </button>
          </div>
        );
      
      case "complete":
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-green-600">Minting Complete!</h3>
              <p className="mt-2">Your vehicle has been successfully minted and recorded.</p>
              <p className="mt-1">Token ID: {tokenId}</p>
              <p className="mt-1">Transaction Hash: {txHash}</p>
              <p className="mt-3 text-sm text-gray-600">Your vehicle profile and featured image have been created successfully.</p>
              <p className="mt-1 text-sm text-gray-600">You can view your vehicle with its image on the dashboard now.</p>
            </div>
            <button
              onClick={() => {
                setMintStep("initial");
                setTokenId(null);
                setTxHash(null);
                setVehicleData(null);
                setIdentityId(null);
                setSuccess(null);
                setError(null);
                setFormData({
                  vin: "",
                  name: "",
                  make: "",
                  model: "",
                  year: new Date().getFullYear().toString(),
                  image: null,
                });
              }}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Mint Another Vehicle
            </button>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Mint Vehicle NFT</h2>
      
      {error && <ErrorDisplay error={error} />}
      {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">{success}</div>}
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Vehicle Minting Process</h3>
          <span className="text-sm text-gray-500">Step {
            mintStep === "initial" ? "1/3" :
            mintStep === "minting" ? "2/3" :
            "3/3"
          }</span>
        </div>
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
              style={{
                width:
                  mintStep === "initial" ? "0%" :
                  mintStep === "minting" ? "50%" :
                  "100%"
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {renderStepContent()}
    </div>
  );
};

export default MintWithConfirmation;