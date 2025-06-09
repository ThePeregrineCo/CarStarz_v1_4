# Database Schema Verification Plan

This document outlines our systematic approach to verify and improve the CarStarz database schema based on the verification questions in `DB-VERIFICATION-QUESTIONS.md`.

## Overall Process

1. Start with the clean schema (`01-clean-schema.sql`)
2. Address each verification question one by one
3. Create targeted fixes for each issue identified
4. Apply these fixes to ensure the database is robust
5. Add verification functions to validate data integrity
6. Test each aspect of the database functionality
7. Apply all fixes with the combined verification script

## Quick Start

To apply all verification fixes at once:

```bash
# Make the script executable
chmod +x packages/nextjs/scripts/run-verification-fixes.sh

# Run the script
bash packages/nextjs/scripts/run-verification-fixes.sh
```

This will:
1. Apply all fixes in `combined-verification-fixes.sql`
2. Run verification checks to ensure database integrity
3. Report any remaining issues that need to be addressed

## Progress Tracker

| # | Verification Question | Status | Fix File | Notes |
|---|----------------------|--------|----------|-------|
| 1 | Wallet Ownership Verification | ✅ Addressed | `wallet-normalization-fixes.sql` | Added wallet normalization trigger and case-insensitive RLS policies |
| 2 | Vehicle-Media Relationship | ✅ Addressed | `vehicle-media-relationship-fixes.sql` | Added functions to check/fix orphaned media and verify cascade delete |
| 3 | Identity Registry Integration | ✅ Addressed | `identity-registry-integration-fixes.sql` | Added functions to ensure identity registry is source of truth |
| 4 | Row-Level Security Effectiveness | ✅ Addressed | `wallet-normalization-fixes.sql` | Updated RLS policies for case-insensitive comparisons |
| 5 | Storage Bucket Configuration | ⏳ Pending | | |
| 6 | Vehicle Modifications Relationship | ⏳ Pending | | |
| 7 | User Collections Functionality | ⏳ Pending | | |
| 8 | Trigger Functionality | ⏳ Pending | | |
| 9 | Foreign Key Constraints | ⏳ Pending | | |
| 10 | Identity Registry and Social Links | ⏳ Pending | | |

## Detailed Steps for Each Verification Question

### 1. Wallet Ownership Verification ✅

**Issues Identified:**
- No automatic mechanism to ensure `normalized_wallet` is always lowercase
- RLS policies using direct comparison without case normalization

**Fixes Implemented:**
- Added trigger to automatically set `normalized_wallet` to lowercase
- Updated RLS policies to use case-insensitive comparisons
- Added function to check and fix wallet address inconsistencies

**Test SQL:**
```sql
-- Test wallet normalization trigger
INSERT INTO identity_registry (wallet_address, normalized_wallet)
VALUES ('0xAbC123', 'NOT_NORMALIZED');

SELECT wallet_address, normalized_wallet 
FROM identity_registry
WHERE wallet_address = '0xAbC123';
-- Should show normalized_wallet as '0xabc123'

-- Test case-insensitive RLS policy
-- As user with wallet '0xabc123'
UPDATE vehicle_profiles
SET description = 'Updated description'
WHERE owner_wallet = '0xAbC123';
-- Should succeed even with different case
```

### 2. Vehicle-Media Relationship ✅

**Issues Addressed:**
- Verified foreign key relationship between `vehicle_media` and `vehicle_profiles`
- Ensured indexes on `vehicle_id` are working correctly
- Verified cascade delete functionality

**Fixes Implemented:**
- Added `check_orphaned_media()` function to identify orphaned media records
- Added `fix_orphaned_media()` function to clean up orphaned records
- Created `test_cascade_delete()` function to verify cascade delete works
- Added `check_media_query_efficiency()` to analyze query performance
- Created `get_vehicle_media()` function for efficient media retrieval
- Added validation trigger to ensure media records have valid vehicle_id

**Test SQL:**
```sql
-- Check for orphaned media records
SELECT vm.id, vm.vehicle_id
FROM vehicle_media vm
LEFT JOIN vehicle_profiles vp ON vm.vehicle_id = vp.id
WHERE vp.id IS NULL;

-- Test cascade delete
BEGIN;
DELETE FROM vehicle_profiles WHERE id = 'specific_vehicle_uuid';
SELECT COUNT(*) FROM vehicle_media WHERE vehicle_id = 'specific_vehicle_uuid';
ROLLBACK;
```

### 3. Identity Registry Integration ✅

**Issues Addressed:**
- Ensured vehicle profiles are correctly linked to identity registry entries
- Verified that `owner_id` in vehicle_profiles is correctly set
- Made identity registry the source of truth for wallet addresses

**Fixes Implemented:**
- Added `check_missing_identity_links()` function to identify vehicles without identity links
- Added `create_missing_identity_entries()` function to create missing identity registry entries
- Added `update_vehicle_owner_ids()` function to update vehicle owner_id based on identity registry
- Created `set_owner_id_from_wallet()` trigger to automatically set owner_id when owner_wallet is updated
- Added `check_wallet_address_mismatches()` function to identify wallet address mismatches
- Added `fix_wallet_address_mismatches()` function to fix wallet address mismatches
- Created `verify_identity_source_of_truth()` function to verify identity registry is the source of truth

**Test SQL:**
```sql
-- Check for vehicles with missing identity links
SELECT * FROM check_missing_identity_links();

-- Create missing identity registry entries
SELECT create_missing_identity_entries();

-- Update vehicle owner_ids
SELECT update_vehicle_owner_ids();

-- Test owner_id setting trigger
UPDATE vehicle_profiles
SET owner_wallet = '0xNewWallet'
WHERE id = 'specific_vehicle_uuid';

SELECT owner_wallet, owner_id
FROM vehicle_profiles
WHERE id = 'specific_vehicle_uuid';

-- Verify identity registry is source of truth
SELECT * FROM verify_identity_source_of_truth();
```

## Combined Verification Fixes

We've created a combined verification script that applies all fixes at once:

- **File**: `infrastructure/database/migrations/combined-verification-fixes.sql`
- **Runner**: `packages/nextjs/scripts/run-verification-fixes.sh`

This combined approach:
1. Applies all fixes in a single transaction
2. Runs verification checks to ensure database integrity
3. Reports any remaining issues that need to be addressed

## Next Steps

1. Continue addressing the remaining verification questions (5-10)
2. Add those fixes to the combined verification script
3. Run the verification script to ensure all issues are fixed
4. Document any additional test cases

## How to Use This Plan

1. Follow the progress tracker to see which verification questions have been addressed
2. For each question, review the detailed steps and fixes
3. Apply the fixes using the combined verification script
4. Run the verification checks to ensure all issues are fixed
5. Update the progress tracker as you complete each step

## Verification Results

After running the verification script, you should see output similar to:

```
Checking wallet address consistency:
No wallet inconsistencies found.

Checking for orphaned media:
No orphaned media found.

Verifying identity registry integration:
┌─────────┬──────────────────────────┬────────┬───────┐
│ (index) │        check_name        │ status │ count │
├─────────┼──────────────────────────┼────────┼───────┤
│    0    │  'Missing identity links' │  'OK'  │   0   │
│    1    │'Mismatched wallet addresses'│  'OK'  │   0   │
│    2    │ 'Mismatched identity IDs' │  'OK'  │   0   │
└─────────┴──────────────────────────┴────────┴───────┘

Verification complete!
```

If any issues are found, the script will show details about the problems that need to be fixed.