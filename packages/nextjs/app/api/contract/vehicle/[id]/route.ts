import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import deployedContractsData from "~~/contracts/deployedContracts";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tokenId = params.id;
    if (!tokenId) {
      return NextResponse.json(
        { error: "Invalid tokenId" },
        { status: 400 }
      );
    }

    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http(),
    });

    const deployedContract = deployedContractsData[hardhat.id]?.VehicleRegistry;
    if (!deployedContract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    try {
      // Get vehicle data
      const vehicle = await publicClient.readContract({
        address: deployedContract.address,
        abi: deployedContract.abi,
        functionName: "getVehicleByTokenId",
        args: [BigInt(tokenId)],
      });

      // Get owner
      const owner = await publicClient.readContract({
        address: deployedContract.address,
        abi: deployedContract.abi,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });

      return NextResponse.json({
        vehicle: {
          vin: vehicle.vin,
          name: vehicle.name,
          imageURI: vehicle.imageURI,
          tokenId: vehicle.tokenId,
        },
        owner,
      });
    } catch (error: any) {
      // If token doesn't exist, return 404
      if (error.message?.includes("Token does not exist")) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle data" },
      { status: 500 }
    );
  }
} 