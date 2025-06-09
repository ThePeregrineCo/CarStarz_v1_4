# Identity Registry System

This document explains the Identity Registry system that has been implemented to enhance the existing Burner Wallet authentication in CarStarz.

## Overview

The Identity Registry is a new system that:

1. Works alongside the existing Burner Wallet authentication
2. Normalizes wallet addresses to lowercase for consistent querying
3. Associates wallet addresses with user profiles
4. Prepares the system for future SIWE (Sign-In With Ethereum) integration

## How It Works

The Identity Registry consists of:

1. A new database table (`identity_registry`) that stores wallet addresses and their associations
2. Enhanced authentication functions that register wallet addresses in the registry
3. Utility functions for managing the registry

The system is designed to work seamlessly with the existing Burner Wallet authentication, without breaking any functionality.

## Implementation Details

### Database Schema

The Identity Registry uses a new table with the following structure:

```sql
CREATE TABLE identity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  normalized_wallet TEXT NOT NULL,
  user_id UUID,
  ens_name TEXT,
  did TEXT,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Authentication Flow

1. When a user authenticates with their wallet, the system:
   - Normalizes the wallet address to lowercase
   - Checks if the wallet is already registered in the identity registry
   - If not, registers the wallet in the registry
   - Associates the wallet with the user's profile (if available)

2. The existing authentication flow is preserved:
   - Burner Wallets continue to work as before
   - The service role client is used as a fallback when needed
   - No changes to the minting process

## Setup Instructions

To set up the Identity Registry:

1. Make sure your environment variables are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the setup script:
   ```bash
   cd packages/nextjs
   chmod +x run-identity-setup.sh
   ./run-identity-setup.sh
   ```

This will:
- Create the identity registry table if it doesn't exist
- Populate the registry with existing users
- Set up the necessary indexes for performance

## Using the Identity Registry

The Identity Registry is used automatically by the enhanced authentication functions. You don't need to make any changes to your code to use it.

When a user authenticates with their wallet, their wallet address will be automatically registered in the identity registry.

## Future Enhancements

The Identity Registry is designed to be extended in the future:

1. **SIWE Integration**: The system can be extended to use Sign-In With Ethereum (EIP-4361) for more secure authentication.

2. **ENS Integration**: The system can be extended to resolve and store ENS names for wallet addresses.

3. **Smart Wallet Support**: The system can be extended to support smart contract wallets (ERC-4337).

4. **Delegated Access**: The system can be extended to support delegated access to vehicles.

## Troubleshooting

If you encounter any issues with the Identity Registry:

1. Check the console logs for error messages.
2. Verify that the identity_registry table exists in your database.
3. Make sure your environment variables are set correctly.
4. Try running the setup script again.

## Notes for Developers

- The Identity Registry is designed to be non-intrusive. It works alongside the existing authentication system without breaking any functionality.
- Wallet addresses are normalized to lowercase for consistent querying.
- The system is designed to be extended in the future with more advanced authentication methods.
- The existing Burner Wallet functionality is preserved, so you can continue to use it for development and testing.