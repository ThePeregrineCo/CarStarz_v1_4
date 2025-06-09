import { NextResponse } from 'next/server';
import { blockchainEventService } from '../../../lib/services/BlockchainEventService';

/**
 * POST /api/process-events
 * Process blockchain events on the server side
 */
export async function POST(request: Request) {
  try {
    // Get the event data from the request
    const body = await request.json();
    const { tokenId, txHash, vehicleData, identityId, ownerWallet } = body;
    
    if (!tokenId || !txHash || !vehicleData || !ownerWallet) {
      return NextResponse.json(
        { error: "Missing required fields", details: "tokenId, txHash, vehicleData, and ownerWallet are required" },
        { status: 400 }
      );
    }
    
    // Process the event on the server side
    const result = await blockchainEventService.processMintEventServerSide(
      parseInt(tokenId),
      ownerWallet,
      txHash,
      vehicleData,
      identityId
    );
    
    return NextResponse.json({
      success: true,
      message: "Vehicle profile created successfully on server side",
      result
    });
  } catch (error: any) {
    console.error("Error processing event:", error);
    return NextResponse.json(
      { error: "Failed to process event", details: error.message },
      { status: 500 }
    );
  }
}