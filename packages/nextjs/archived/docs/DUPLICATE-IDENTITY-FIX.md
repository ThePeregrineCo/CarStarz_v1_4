# Duplicate Identity Fix

This document explains the issue with duplicate wallet addresses in the identity_registry table and provides a solution.

## Problem

We've identified that the identity_registry table contains duplicate entries for the same wallet address (e.g., 0xb49de4c63c667fb7afa445f821e83c57c0fca27d). This occurs because:

1. The `normalized_wallet` column in the identity_registry table was missing a UNIQUE constraint
2. Multiple processes or migrations may have created identity entries without proper checks
3. Race conditions could have occurred during concurrent operations

These duplicates can cause several issues:
- Inconsistent identity references from vehicle profiles
- Unpredictable behavior when querying by wallet address
- Data integrity problems during ownership transfers

## Solution

We've created a comprehensive fix that:

1. Identifies all duplicate wallet addresses in the identity_registry table
2. Keeps the oldest entry for each wallet address and updates any references
3. Deletes the duplicate entries
4. Adds a UNIQUE constraint to prevent future duplicates

## Implementation

The solution consists of three components:

1. **SQL Fix Script** (`fix-duplicate-identities.sql`):
   - Creates a temporary table to identify duplicates
   - Updates vehicle_profiles to reference the kept identity
   - Deletes duplicate identity entries
   - Adds a UNIQUE constraint to prevent future duplicates

2. **Node.js Execution Script** (`run-fix-duplicate-identities.mjs`):
   - Executes the SQL fix
   - Verifies the fix was successful
   - Reports any remaining issues

3. **Shell Script Wrapper** (`run-fix-duplicate-identities.sh`):
   - Provides an easy way to run the fix
   - Performs pre-fix checks
   - Makes the process user-friendly

## How to Run the Fix

To fix duplicate identities in your database:

1. Run the fix script:
   ```bash
   ./run-fix-duplicate-identities.sh
   ```

2. The script will:
   - Identify and fix duplicate wallet addresses
   - Add a UNIQUE constraint to prevent future duplicates
   - Report the results

3. If any issues are reported, you may need to investigate those specific cases manually.

## Prevention

To prevent this issue from occurring again:

1. We've updated the vehicle-identity-integration.sql script to check for duplicates before proceeding
2. We've added a UNIQUE constraint to the normalized_wallet column
3. All future identity creation should use INSERT ... ON CONFLICT to handle potential duplicates

## Verification

After running the fix, you can verify it worked by running:

```sql
SELECT normalized_wallet, COUNT(*)
FROM identity_registry
GROUP BY normalized_wallet
HAVING COUNT(*) > 1;
```

This query should return no results if the fix was successful.