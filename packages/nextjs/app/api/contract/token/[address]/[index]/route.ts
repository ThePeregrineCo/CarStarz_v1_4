import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import deployedContractsData from "~~/contracts/deployedContracts";

export async function GET(
  request: Request,
  { params }: { params: { address: string; index: string } }
) {
  try {
    const { address, index } = params;
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

    const tokenId = await publicClient.readContract({
      address: deployedContract.address,
      abi: deployedContract.abi,
      functionName: "tokenByIndex",
      args: [BigInt(index)],
    });

    return NextResponse.json({ tokenId });
  } catch (error) {
    console.error("Error fetching token ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch token ID" },
      { status: 500 }
    );
  }
} 