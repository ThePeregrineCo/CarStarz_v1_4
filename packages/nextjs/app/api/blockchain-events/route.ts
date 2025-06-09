import { NextResponse } from 'next/server';
import { blockchainEventService, BlockchainEventType } from '../../../lib/services/BlockchainEventService';

/**
 * POST /api/blockchain-events
 * Process blockchain events such as NFT transfers
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.event_type || !body.token_id || !body.transaction_hash) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: 'event_type, token_id, and transaction_hash are required'
      }, { status: 400 });
    }
    
    // Validate the event type
    if (!Object.values(BlockchainEventType).includes(body.event_type)) {
      return NextResponse.json({
        error: 'Invalid event type',
        details: `event_type must be one of: ${Object.values(BlockchainEventType).join(', ')}`
      }, { status: 400 });
    }
    
    // Process the event based on its type
    let event;
    switch (body.event_type) {
      case BlockchainEventType.TRANSFER:
        // For transfers, both from_address and to_address are required
        if (!body.to_address) {
          return NextResponse.json({
            error: 'Invalid request body',
            details: 'to_address is required for transfer events'
          }, { status: 400 });
        }
        
        event = await blockchainEventService.processTransferEvent(
          body.token_id,
          body.from_address || null, // from_address can be null for mints
          body.to_address,
          body.transaction_hash
        );
        break;
        
      case BlockchainEventType.MINT:
        // For mints, to_address is required
        if (!body.to_address) {
          return NextResponse.json({
            error: 'Invalid request body',
            details: 'to_address is required for mint events'
          }, { status: 400 });
        }
        
        event = await blockchainEventService.processMintEvent(
          body.token_id,
          body.to_address,
          body.transaction_hash
        );
        break;
        
      case BlockchainEventType.BURN:
        // For burns, from_address is required
        if (!body.from_address) {
          return NextResponse.json({
            error: 'Invalid request body',
            details: 'from_address is required for burn events'
          }, { status: 400 });
        }
        
        event = await blockchainEventService.processBurnEvent(
          body.token_id,
          body.from_address,
          body.transaction_hash
        );
        break;
        
      default:
        return NextResponse.json({
          error: 'Unsupported event type',
          details: `Unsupported event type: ${body.event_type}`
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `${body.event_type} event processed successfully`,
      event
    });
  } catch (error: any) {
    console.error('Error processing blockchain event:', error);
    return NextResponse.json({
      error: 'Failed to process blockchain event',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/blockchain-events/process-pending
 * Process pending blockchain events
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;
    
    // Process pending events
    const processedCount = await blockchainEventService.processPendingEvents(limit);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} pending events`,
      processedCount
    });
  } catch (error: any) {
    console.error('Error processing pending blockchain events:', error);
    return NextResponse.json({
      error: 'Failed to process pending blockchain events',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}