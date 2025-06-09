"use client";

import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { checkUserHasProfile } from "~~/lib/utils/profileHelpers";

// Dynamically import MintWithConfirmation with no SSR
const MintWithConfirmation = dynamic(() => import("~~/components/MintWithConfirmation").then(mod => mod.MintWithConfirmation), {
  ssr: false,
});

const Register = () => {
  const { address: connectedAddress } = useAccount();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if the user has a profile when the component mounts or the address changes
  useEffect(() => {
    const checkProfile = async () => {
      if (connectedAddress) {
        setIsLoading(true);
        try {
          // Check if the user has a profile
          const profileExists = await checkUserHasProfile(connectedAddress);
          setHasProfile(profileExists);
        } catch (error) {
          console.error("Error checking profile:", error);
          // Default to allowing minting if we can't check the profile
          setHasProfile(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setHasProfile(null);
      }
    };

    checkProfile();
  }, [connectedAddress]);

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 text-center max-w-4xl">
        <h1 className="text-4xl font-bold">Register Your Vehicle</h1>
        <p className="mt-4 text-xl">
          Register your vehicle as an NFT on the blockchain. Each vehicle is uniquely identified by its VIN number.
        </p>
      </div>
      
      {!connectedAddress ? (
        // Not connected - show connect wallet button
        <div className="flex flex-col justify-center items-center bg-base-300 w-full mt-8 px-8 pt-6 pb-12">
          <p className="text-xl font-bold">Please connect your wallet to register a vehicle.</p>
          <div className="mt-4">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      ) : isLoading ? (
        // Loading state
        <div className="flex flex-col justify-center items-center bg-base-300 w-full mt-8 px-8 pt-6 pb-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Checking your profile...</p>
        </div>
      ) : hasProfile === false ? (
        // No profile - show create profile message
        <div className="flex flex-col justify-center items-center bg-base-300 w-full mt-8 px-8 pt-6 pb-12">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <p className="font-bold">Profile Required</p>
            <p>You need to create a profile before you can mint a vehicle.</p>
            <p>This ensures your vehicles are properly linked to your identity.</p>
          </div>
          <Link
            href={`/profile/${connectedAddress}`}
            className="btn btn-primary"
          >
            Create Your Profile
          </Link>
        </div>
      ) : (
        // Has profile - show mint form
        <div className="flex flex-col justify-center items-center bg-base-300 w-full mt-8 px-8 pt-6 pb-12">
          <MintWithConfirmation />
        </div>
      )}
    </div>
  );
};

export default Register;