# Profile Check Bypass Documentation

This document explains the temporary changes made to bypass the profile check when minting vehicles.

## Issue Description

After resetting the database and blockchain for testing, the system is not recognizing existing user profiles when trying to mint vehicles. This is causing the error message "Profile Required" even though a profile has been created.

## Root Cause

The issue occurs because:

1. The database reset script (`reset-carstarz-db.js` using `reset-schema-carstarz.sql`) might not have properly preserved the identity registry tables.
2. The profile check in both the UI and API is failing to recognize existing profiles.

## Changes Made

### 1. Modified `packages/nextjs/app/register/page.tsx`

Changed the profile check in the useEffect hook to always return true, bypassing the check:

```javascript
useEffect(() => {
  const checkProfile = async () => {
    if (connectedAddress) {
      setIsLoading(true);
      try {
        // Force hasProfile to true to bypass the check
        // const profileExists = await checkUserHasProfile(connectedAddress);
        // setHasProfile(profileExists);
        console.log("Bypassing profile check - setting hasProfile to true");
        setHasProfile(true);
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
```

Also commented out the import:

```javascript
// import { checkUserHasProfile } from "~~/lib/utils/profileHelpers";
```

### 2. Modified `packages/nextjs/app/api/mint/route.ts`

Commented out the profile check in the API endpoint to allow minting without a profile:

1. Commented out the import:
```javascript
// TEMPORARY BYPASS: Import commented out but kept for when bypass is removed
// import { checkUserHasProfile } from "../../../lib/utils/profileHelpers";
```

2. Commented out the profile check code:
```javascript
// TEMPORARY BYPASS: Profile check is temporarily disabled for testing
// See PROFILE-CHECK-BYPASS.md for documentation on this change
// This should be reverted after testing is complete by uncommenting the code below
console.log("BYPASS: Skipping profile check for wallet:", ownerWallet);

// Original code (commented out for testing):
// const hasProfile = await checkUserHasProfile(ownerWallet);
//
// if (!hasProfile) {
//   return NextResponse.json(
//     {
//       error: "You need to create a profile before minting a vehicle",
//       code: "PROFILE_REQUIRED"
//     },
//     { status: 403 }
//   );
// }
```

## How to Revert Changes

To revert these changes after testing:

1. In `packages/nextjs/app/register/page.tsx`:
   - Uncomment the import: `import { checkUserHasProfile } from "~~/lib/utils/profileHelpers";`
   - Restore the original profile check code:
   ```javascript
   const profileExists = await checkUserHasProfile(connectedAddress);
   setHasProfile(profileExists);
   ```

2. In `packages/nextjs/app/api/mint/route.ts`:
   - Uncomment the import: `import { checkUserHasProfile } from "../../../lib/utils/profileHelpers";`
   - Restore the original profile check code by removing the bypass comments and uncommenting the original code:
   ```javascript
   // Check if the user has a profile
   const hasProfile = await checkUserHasProfile(ownerWallet);
   
   if (!hasProfile) {
     return NextResponse.json(
       {
         error: "You need to create a profile before minting a vehicle",
         code: "PROFILE_REQUIRED"
       },
       { status: 403 }
     );
   }
   ```

## Long-term Solution

For a proper fix, ensure that when resetting the database:

1. Run the complete reset script that includes the identity registry tables: `complete-reset-script.sql`
2. Or run the identity registry setup script after resetting the database: `node packages/nextjs/setup-identity-registry.mjs`