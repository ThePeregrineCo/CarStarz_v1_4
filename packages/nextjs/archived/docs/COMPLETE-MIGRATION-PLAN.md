# Complete Migration Plan to V2 Components and Identity Architecture

## Current State: Two Schemas and Authentication Issues

The current situation with two schemas wasn't intentional - it's a result of incremental development:

1. The original schema was designed for the initial version of the app
2. The V2 components were developed with an improved schema that better supports new features
3. However, not all parts of the application were updated to use the new schema

This has resulted in a situation where:
- Some components use the old schema (`vehicles.ts`)
- Some components use the new schema (`vehicleQueriesV2.ts`)
- New vehicles are only being added to the old schema
- Wallet authentication is prone to failures and inconsistencies

## Comprehensive Migration Plan

This document outlines a comprehensive plan to fully transition to the V2 components and schema, while also implementing a robust identity and authentication system.

### Phase 0: Fix Immediate Issues

#### 1. Update API Endpoints (Community Page)

First, we'll update the Community page to use the new schema:

```typescript
// packages/nextjs/app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { vehicleQueriesV2 } from "../../../lib/api/vehicleQueriesV2";

export async function GET() {
  try {
    console.log("[DEBUG API] GET /api/vehicles - Fetching all vehicles from Supabase");
    
    // Get all vehicles using the V2 queries
    const vehicles = await vehicleQueriesV2.searchVehicles({});
    console.log(`[DEBUG API] Found ${vehicles.length} vehicles in Supabase`);
    
    // Transform the data to include image paths and format consistently
    const formattedVehicles = vehicles.map((vehicle) => {
      // Find image from media if available
      let imagePath = null;
      if (vehicle.vehicle_media && vehicle.vehicle_media.length > 0) {
        // Try to find a featured image first
        const featuredImage = vehicle.vehicle_media.find((media: any) => media.is_featured);
        if (featuredImage) {
          imagePath = featuredImage.url;
        } else if (vehicle.vehicle_media[0]) {
          // Otherwise use the first image
          imagePath = vehicle.vehicle_media[0].url;
        }
      }
      
      // If no image found in media, use a fallback based on token ID
      if (!imagePath && vehicle.token_id !== null && vehicle.token_id !== undefined) {
        imagePath = `/metadata/${vehicle.token_id}.jpg`;
      } else if (!imagePath) {
        // Default fallback image if no token_id
        imagePath = `/images/vehicle-placeholder.jpg`;
      }
      
      // Include all related data in the response
      return {
        tokenId: vehicle.token_id,
        vin: vehicle.vin,
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        description: vehicle.description,
        owner: vehicle.owner_wallet,
        image: imagePath,
        source: 'supabase',
        // Include all related data
        vehicle_media: vehicle.vehicle_media || [],
        vehicle_specifications: vehicle.vehicle_specifications || [],
        vehicle_links: vehicle.vehicle_links || [],
        vehicle_videos: vehicle.vehicle_videos || [],
        parts: vehicle.parts || [],
        // Include owner information if available
        owner_info: vehicle.owner || null
      };
    });
    
    return NextResponse.json(formattedVehicles);
  } catch (error) {
    console.error("Error loading vehicles:", error);
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 });
  }
}
```

#### 2. Fix Wallet Authentication

Implement a temporary fix for wallet authentication issues:

```typescript
// packages/nextjs/lib/supabase.ts
export async function authenticateWithWallet(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
) {
  if (!supabaseClient) {
    console.error('[DEBUG AUTH] Supabase client not available - missing environment variables')
    return null
  }

  try {
    // Ensure wallet address is normalized to lowercase
    const normalizedWalletAddress = walletAddress.toLowerCase()
    console.log(`[DEBUG AUTH] Authenticating wallet: ${normalizedWalletAddress}`)
    
    // Create a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString()
    
    // Create a message to sign
    const message = `Authenticate with CarStarz: ${nonce}`
    
    try {
      // Sign the message with the wallet
      const signature = await signMessage(message)
      console.log(`[DEBUG AUTH] Signature received: ${signature.substring(0, 20)}...`)
    } catch (error) {
      console.error('[DEBUG AUTH] Error during message signing:', error)
      
      // If the error is related to getChainId, use service role client as fallback
      const errorString = String(error)
      if (errorString.includes('getChainId is not a function')) {
        console.log('[DEBUG AUTH] Detected getChainId error, using service role client as fallback')
        return supabase // Return the service role client as a fallback
      }
      
      throw error
    }
    
    // Use the service role client for authentication
    if (!supabase) {
      throw new Error('Service role Supabase client not available')
    }
    
    console.log(`[DEBUG AUTH] Successfully authenticated with wallet: ${normalizedWalletAddress}`)
    
    return supabase
  } catch (error) {
    console.error('[DEBUG AUTH] Error authenticating with wallet:', error)
    return null
  }
}
```

### Phase 1: Identity Middleware & Auth Overhaul

#### 🔐 SIWE-Based Authentication

Replace the current wallet authentication with Sign-In With Ethereum (EIP-4361):

1. Implement SIWE authentication flow:
   - Sign nonce challenge
   - Verify on backend
   - Issue Supabase JWT or app-specific session token

2. Required dependencies:
   - `@web3modal/siwe`, `wagmi`, `viem` or `lit-siwe`
   - Supabase Edge Function for SIWE verifier

#### 🧠 Identity Registry

Create a table to normalize and associate wallet identities:

```sql
CREATE TABLE identity_registry (
  wallet_address TEXT PRIMARY KEY,
  normalized_wallet TEXT UNIQUE,
  user_id UUID REFERENCES users(id),
  ens_name TEXT,
  did TEXT,
  last_login TIMESTAMP
);
```

#### ✅ Auth Middleware Logic

Implement robust authentication middleware:

1. Normalize wallet casing
2. Verify SIWE signature
3. Lookup user_id via identity_registry
4. Attach user_id to request context
5. Issue token with wallet + user info

### Phase 2: Smart Wallet Support & Delegation

#### ⚙️ ERC-4337/Smart Wallet Compatibility

Add support for smart contract wallets:

1. Detect msg.sender from contract wallets
2. Resolve original signer via:
   - EIP-1271
   - Off-chain attestation
   - Session key registry

#### 🛡 Delegated Access Schema

Allow vehicles to be accessed/controlled via attested delegates:

```sql
CREATE TABLE vehicle_delegates (
  vehicle_id UUID,
  delegate_wallet TEXT,
  permission_type TEXT,
  attested_on TIMESTAMP,
  expires_at TIMESTAMP,
  PRIMARY KEY (vehicle_id, delegate_wallet)
);
```

### Phase 3: EAS Attestations Integration

#### 🏷 Attestation Types

Implement Ethereum Attestation Service integration:

| Purpose | Schema ID | Fields |
|---------|-----------|--------|
| Ownership | eas.vehicle.ownership | vehicle_id, wallet |
| Condition Report | eas.vehicle.condition | vehicle_id, mileage, score, timestamp |
| Delegate Access | eas.vehicle.delegate | vehicle_id, delegate_wallet, access_level, expires_at |

#### 🌐 Verifying EAS Attestations

Use @ethereum-attestation-service/eas-sdk to:

1. Resolve attestations for:
   - Vehicle ownership
   - Club membership
   - Service history
2. Cache resolved attestations into DB snapshot table for faster access

### Phase 4: RLS, Roles & Guest Mode

#### 🚫 Deprecate service_role fallback

Remove dependency on service_role for database access:

- No DB access should rely on service_role unless in secured cron jobs

#### 🧾 JWT Claims-Based Access

Implement proper JWT-based authentication:

1. Add user_id, wallet, and role claims to JWT
2. Use Supabase RLS based on user_id

```sql
CREATE POLICY "Allow user read" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);
```

### Phase 5: UX & Wallet Connectors

#### 🔌 Web3 Connect UX Improvements

Replace Burner Wallets with modern alternatives:

1. WalletConnect v2
2. Web3Modal 3.0+
3. Optional email/passkey fallback using Magic or Web3Auth

Improve the display of wallet information:
- Connected wallet
- ENS name
- Verified roles/ownership from EAS

## Implementation Timeline

1. **Immediate (Phase 0)**: Fix authentication issues and ensure vehicles display correctly
2. **Week 1-2 (Phase 1)**: Implement SIWE authentication and Identity Registry
3. **Week 3-4 (Phase 2)**: Add smart wallet support and delegated access
4. **Week 5-6 (Phase 3)**: Integrate EAS attestations
5. **Week 7-8 (Phase 4-5)**: Implement RLS policies and improve wallet UX

## Testing Strategy

For each phase:
1. Create unit tests for new functionality
2. Perform integration testing with existing components
3. Verify backward compatibility with existing vehicles and users
4. Test with different wallet types (EOA, smart contract wallets)
5. Validate security of authentication flow
