# Profile System and Minting Integration

This document explains how the profile system has been designed to work seamlessly with the existing minting functionality in CarStarz.

## Potential Issues and Solutions

When integrating the new profile system with the existing minting functionality, we identified several potential issues:

1. **Foreign Key Constraints**: Direct foreign key references to `vehicle_profiles` could prevent minting if constraints are violated.
2. **Schema Modifications**: Any changes to the existing `vehicle_profiles` table could break the minting process.
3. **Authentication Flow**: Changes to the wallet authentication flow could affect the minting process.

## Safe Schema Design

We've created a safer version of the schema that avoids these issues:

### 1. Using Token IDs Instead of Foreign Keys

Instead of using direct foreign key references to `vehicle_profiles(id)`, we use `token_id` as a reference:

```sql
-- Original (potentially problematic)
CREATE TABLE club_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicle_profiles(id) NOT NULL, -- Direct foreign key
  ...
);

-- Safe version
CREATE TABLE club_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) NOT NULL,
  token_id INTEGER NOT NULL, -- Using token_id instead of foreign key
  ...
);
```

This approach:
- Avoids adding constraints to the `vehicle_profiles` table
- Prevents cascading effects if a vehicle profile is deleted
- Maintains the relationship through the token ID, which is the primary identifier in the NFT contract

### 2. No Modifications to Existing Tables

The safe schema:
- Creates new tables only
- Doesn't modify existing tables
- Doesn't add constraints to existing tables

### 3. Preserving the Minting Flow

The minting process in `app/api/mint/route.ts` works by:
1. Getting the next token ID
2. Creating metadata and saving the image
3. Saving to Supabase using `vehicleProfiles.create()`

Our changes preserve this flow by:
- Not modifying the `vehicleProfiles.create()` function
- Not adding constraints that would prevent insertion into `vehicle_profiles`
- Maintaining the same authentication flow for minting

## Integration Points

### Vehicle-Builder Relationships

We've created a `builder_vehicles` table that links businesses to vehicles using `token_id`:

```sql
CREATE TABLE builder_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  token_id INTEGER NOT NULL,
  work_type TEXT,
  build_description TEXT,
  ...
);
```

This allows businesses to claim work on vehicles without affecting the minting process.

### Club-Vehicle Relationships

Similarly, the `club_vehicles` table uses `token_id` instead of a direct foreign key:

```sql
CREATE TABLE club_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) NOT NULL,
  token_id INTEGER NOT NULL,
  ...
);
```

This allows clubs to associate with vehicles without affecting the minting process.

## Testing the Integration

To test that the profile system doesn't break minting:

1. Run the safe setup script:
   ```bash
   cd packages/nextjs
   chmod +x run-profile-setup-safe.sh
   ./run-profile-setup-safe.sh
   ```

2. Test minting a new vehicle:
   ```bash
   npm run dev
   # Navigate to the minting page and mint a vehicle
   ```

3. Verify that the vehicle appears in both systems:
   - Check the vehicle profile page
   - Check that the vehicle can be associated with businesses and clubs

## Wallet Authentication Integration

The profile system integrates with the existing wallet authentication:

1. When a user connects their wallet, we check if a user profile exists for that wallet address
2. If not, we create a new user profile
3. The same wallet address is used for both on-chain (minting) and off-chain (profiles) operations

This ensures a seamless experience where:
- Vehicle ownership is determined by NFT ownership on the blockchain
- Profile ownership is determined by wallet address
- The same wallet can be used for all operations

## Conclusion

By using token IDs instead of direct foreign keys and avoiding modifications to existing tables, we've ensured that the profile system can be added without breaking the existing minting functionality.

The safe schema and setup scripts provide a way to test and deploy the profile system with minimal risk to the core minting functionality.