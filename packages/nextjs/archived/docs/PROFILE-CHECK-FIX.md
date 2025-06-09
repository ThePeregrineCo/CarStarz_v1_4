# Profile Required Error Fix

This document explains the changes made to fix the "Profile Required" error that occurs when trying to mint a vehicle.

## Problem

After resetting the database and blockchain for testing, users encountered an error when trying to mint a vehicle:

```
You need to create a profile before minting a vehicle
```

This error occurs because:

1. The database reset didn't properly preserve the identity registry tables
2. The profile check in the API was still active, preventing minting

## Solution

We implemented two solutions to address this issue:

### 1. Temporary Bypass (Previous Approach)

Initially, we implemented a temporary bypass by modifying the profile check in both the UI and API:

- In `app/api/mint/route.ts`, we commented out the profile check code
- This allowed minting to proceed without requiring a profile

### 2. Proper Identity Registry Setup (Current Approach)

The proper solution is to ensure the identity registry tables are correctly set up in the database:

1. We created a simplified schema for the identity registry tables in `identity-registry-schema-simplified.sql`
2. We developed a dedicated script `setup-identity-registry-only.mjs` that:
   - Creates the identity registry tables without affecting existing vehicle tables
   - Verifies that all tables were created successfully
3. We restored the profile check in `app/api/mint/route.ts`

## How to Use

If you encounter the "Profile Required" error:

1. Run the identity registry setup script:
   ```bash
   ./run-setup-identity-registry-only.sh
   ```

2. This will create the necessary identity registry tables without affecting your existing vehicle data

3. You should now be able to mint vehicles without encountering the "Profile Required" error

## Technical Details

The identity registry system consists of three main tables:

1. `identity_registry`: Stores user profile information
2. `follows`: Tracks user follow relationships
3. `social_links`: Stores links to social media profiles

When a user attempts to mint a vehicle, the system checks if they have a profile in the identity registry. If not, it returns the "Profile Required" error.

The `registerWalletInIdentityRegistry` function in `lib/auth/identityService.ts` is called during the minting process to automatically create a basic profile for the user if one doesn't exist.

## Related Files

- `packages/nextjs/identity-registry-schema-simplified.sql`: The simplified schema for identity registry tables
- `packages/nextjs/setup-identity-registry-only.mjs`: Script to set up only the identity registry tables
- `packages/nextjs/run-setup-identity-registry-only.sh`: Shell script to run the setup script
- `packages/nextjs/app/api/mint/route.ts`: API route for minting vehicles, includes profile check
- `packages/nextjs/lib/auth/identityService.ts`: Service for interacting with the identity registry
- `packages/nextjs/lib/utils/profileHelpers.ts`: Helper functions for checking user profiles

## Additional Fixes

### Preventing Duplicate Entries in Identity Registry

We identified and fixed an issue in the `registerWalletInIdentityRegistry` function that was causing duplicate entries in the identity_registry table:

1. **Problem**: The function was attempting to create the identity_registry table by inserting records in multiple places, which could lead to duplicate entries.

2. **Solution**: Modified the `registerWalletInIdentityRegistry` function in `lib/auth/identityService.ts` to:
   - Check if the identity_registry table exists
   - Return an error if the table doesn't exist instead of trying to create it
   - This ensures that the identity registry tables are properly set up before registration attempts

This change prevents the creation of duplicate entries in the identity_registry table during signup attempts.

## Future Improvements

For a more robust solution, consider:

1. Integrating the identity registry setup into the main database reset script
2. Adding a UI flow to guide users through creating a profile before minting
3. Implementing better error handling and recovery for database setup issues
4. Adding unique constraints to the identity_registry table to prevent duplicate entries