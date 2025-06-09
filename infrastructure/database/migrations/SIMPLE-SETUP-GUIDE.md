# CarStarz Database: Simple Setup Guide

## The Problem

You have multiple schema files and it's confusing to understand which one to use and how they differ.

## The Solution

**Use the `wallet-identity-schema.sql` file.** This is the most recent and well-designed schema that solves the key issues with the database structure.

## Key Concepts

### 1. Identity Registry as Single Source of Truth

The main improvement in this schema is that wallet addresses are stored **only once** in the `identity_registry` table, rather than being duplicated across multiple tables.

```sql
-- This is the only table that stores wallet addresses
CREATE TABLE identity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  normalized_wallet TEXT NOT NULL UNIQUE,  -- For case-insensitive lookups
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  -- other profile fields...
);
```

### 2. Vehicle Ownership via Foreign Key

Vehicles are linked to owners through the `owner_id` field, which references the `identity_registry` table:

```sql
CREATE TABLE vehicle_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL UNIQUE,
    -- other vehicle fields...
    owner_id UUID NOT NULL REFERENCES identity_registry(id), -- Link to identity
    -- more fields...
);
```

### 3. NFT Transfer Handling

When an NFT is transferred on the blockchain, the system:
1. Looks up the new owner's identity (or creates one if it doesn't exist)
2. Updates the `owner_id` in the `vehicle_profiles` table
3. Records the transfer in the `ownership_transfers` table

This is handled by the `process_blockchain_transfer` function.

### 4. Row-Level Security (RLS)

Security policies ensure users can only modify their own data:

```sql
CREATE POLICY "Users can update their own vehicle profiles"
    ON vehicle_profiles FOR UPDATE
    USING (
        owner_id = current_user_identity_id() OR is_admin()
    );
```

## How to Run This Schema

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `wallet-identity-schema.sql`
4. Paste into the SQL Editor
5. Run the script

## Verification

After running the schema, you can verify it worked by checking:

```sql
-- Check if tables were created
SELECT * FROM identity_registry LIMIT 5;
SELECT * FROM vehicle_profiles LIMIT 5;

-- Check if the admin user was created
SELECT * FROM identity_registry WHERE is_admin = true;

-- Check if the views were created
SELECT * FROM vehicle_profiles_with_owner LIMIT 5;
```

## Why This Schema Is Better

1. **No Redundancy**: Wallet addresses are stored only once
2. **Clean Authentication**: Uses identity_id consistently for authorization
3. **NFT Transfer Support**: Properly handles ownership changes
4. **Better Security**: Row-level security based on identity_id
5. **Maintainability**: Easier to update user profiles in one place