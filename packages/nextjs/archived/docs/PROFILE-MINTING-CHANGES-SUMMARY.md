# Profile System Changes to Preserve Minting Functionality

This document summarizes the key changes made to ensure the profile system doesn't break the existing minting functionality.

## Key Changes

### 1. Safe Schema Design

We created a safer version of the schema (`schema-profile-updates-safe.sql`) that:

- Uses `token_id` instead of foreign key references to `vehicle_profiles(id)`
- Doesn't modify any existing tables
- Doesn't add constraints to existing tables that could affect minting

#### Before (Potentially Problematic):
```sql
CREATE TABLE club_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicle_profiles(id) NOT NULL, -- Direct foreign key
  ...
);
```

#### After (Safe):
```sql
CREATE TABLE club_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) NOT NULL,
  token_id INTEGER NOT NULL, -- Using token_id instead of foreign key
  ...
);
```

### 2. Updated API Queries

We modified the vehicle queries in `vehicleQueriesV2.ts` to work with the safer schema:

- Changed queries to join on `token_id` instead of `vehicle_id`
- Updated references from `builder_id` to `business_id`
- Updated references from `builders` table to `businesses` table

#### Before:
```typescript
const { data: builderRelationships } = await client
  .from('builder_vehicles')
  .select(`
    *,
    builder:builders(*)
  `)
  .eq('vehicle_id', vehicle.id);
```

#### After:
```typescript
const { data: builderRelationships } = await client
  .from('builder_vehicles')
  .select(`
    *,
    builder:businesses(*)
  `)
  .eq('token_id', vehicle.token_id);
```

### 3. Safe Seeding Script

We created a safer version of the seeding script (`seed-test-profiles-safe.ts`) that:

- Uses simpler conflict handling (`onConflict: 'user_id'` instead of `onConflict: 'user_id, business_name'`)
- Adds test relationships using `token_id` instead of `vehicle_id`
- Adds explicit test data for builder-vehicle and club-vehicle relationships

### 4. Safe Setup Script

We created a safer setup script (`run-profile-setup-safe.sh`) that:

- Uses the safer schema file
- Uses the safer seeding script
- Provides clear instructions and warnings

## How These Changes Preserve Minting

1. **No Modification to Existing Tables**: The minting process relies on the `vehicle_profiles` table structure. By not modifying this table, we ensure the minting process continues to work as expected.

2. **No Foreign Key Constraints**: By avoiding foreign key constraints that reference the `vehicle_profiles` table, we prevent potential issues where constraints could block the minting process.

3. **Using Token ID as Reference**: By using `token_id` (which is the primary identifier in the NFT contract) instead of database-generated UUIDs for relationships, we maintain a direct connection to the blockchain representation without adding dependencies.

4. **Preserving Authentication Flow**: The wallet authentication flow used for minting remains unchanged. The profile system extends this flow but doesn't modify the core functionality.

## Testing Approach

The manual testing guide provides a step-by-step approach to verify that:

1. The profile system works correctly
2. The minting process still works
3. The integration between profiles and vehicles works as expected

By following this testing approach, you can ensure that the profile system enhances the application without breaking the core minting functionality.