# Unified Identity System Migration Guide

This guide explains how to migrate from the current dual-table identity system (users + identity_registry) to a unified identity system that uses only the identity_registry table.

## Background

Currently, the CarStarz application uses two tables for user identity:

1. `users` - Stores basic user profile information
2. `identity_registry` - Normalizes wallet addresses and associates them with user profiles

This dual-table approach creates complexity and potential inconsistencies. The migration will consolidate all user data into the `identity_registry` table, making it the single source of truth for user identity.

## Migration Process

### Step 1: Run the Migration Script

The migration script will:

1. Add necessary columns to the `identity_registry` table
2. Migrate data from the `users` table to the `identity_registry` table
3. Update foreign key references in related tables
4. (Optionally) Drop the `users` table after confirming the migration was successful

To run the migration:

```bash
cd packages/nextjs
chmod +x run-unified-identity-migration.sh
./run-unified-identity-migration.sh --confirm
```

### Step 2: Update Application Code

After running the migration, you need to update the application code to use the `identity_registry` table directly instead of the `users` table.

We've provided a new implementation in `unifiedProfileQueries.ts` that replaces the existing `enhancedProfileQueries.ts`. This implementation uses the `identity_registry` table directly for all user profile operations.

To update your application code:

1. Import from the new module:

```typescript
// Before
import { enhancedUserProfiles } from '../lib/api/enhancedProfileQueries';

// After
import { enhancedUserProfiles } from '../lib/api/unifiedProfileQueries';
```

The API remains the same, so no other changes are needed in your application code.

### Step 3: Test the Migration

After updating the application code, thoroughly test the following functionality:

1. User profile display
2. User profile updates
3. User authentication
4. Social links
5. Follows and followers
6. Vehicle ownership

### Step 4: Drop the Users Table

Once you've confirmed that everything is working correctly, you can drop the `users` table:

1. Edit the `migrate-to-unified-identity.sql` file
2. Uncomment the `DROP TABLE users CASCADE;` line
3. Run the migration script again:

```bash
./run-unified-identity-migration.sh --confirm
```

## Benefits of the Unified Identity System

1. **Simplified Data Model**: One table for all user identity data
2. **Reduced Complexity**: No need to join tables or maintain foreign key relationships
3. **Improved Performance**: Fewer database queries and joins
4. **Better Consistency**: Single source of truth for user identity
5. **Enhanced Flexibility**: Easier to add new identity-related features

## Troubleshooting

### Missing User Data

If you notice that some user data is missing after the migration:

1. Check if the user has an entry in the `identity_registry` table:

```sql
SELECT * FROM identity_registry WHERE normalized_wallet = 'user_wallet_address';
```

2. If the user exists but data is missing, you can manually update the entry:

```sql
UPDATE identity_registry
SET display_name = 'User Name', bio = 'User Bio', ...
WHERE normalized_wallet = 'user_wallet_address';
```

### Foreign Key Errors

If you encounter foreign key errors after the migration:

1. Check if the related tables have been updated to reference the `identity_registry` table:

```sql
SELECT * FROM social_links WHERE wallet_address = 'user_wallet_address';
SELECT * FROM follows WHERE follower_wallet = 'user_wallet_address';
```

2. If the references are missing, you can manually update them:

```sql
UPDATE social_links
SET wallet_address = 'user_wallet_address'
WHERE user_id = 'user_id';
```

## Reverting the Migration

If you need to revert the migration:

1. Restore the database from a backup
2. Or, if you haven't dropped the `users` table, you can continue using the original implementation