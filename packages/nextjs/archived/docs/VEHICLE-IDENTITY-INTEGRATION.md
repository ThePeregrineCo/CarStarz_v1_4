# Vehicle Identity Integration

This document explains the integration between vehicle profiles and the identity registry system.

## Overview

The vehicle identity integration adds an `identity_id` field to the `vehicle_profiles` table, which references the `identity_registry` table. This creates a formal relationship between vehicles and their owners' identities, enabling:

1. Consistent owner information across the platform
2. Proper handling of vehicle ownership transfers
3. Preservation of base vehicle data during transfers
4. Automatic identity creation for new vehicle owners

## Key Components

### Database Changes

- New `identity_id` column in `vehicle_profiles` table
- Index on `identity_id` for faster lookups
- Triggers to maintain data integrity during ownership changes
- View joining vehicle profiles with owner identity information

### Automatic Processes

The integration includes several automatic processes:

1. **Owner Identity Synchronization**: When a vehicle's `owner_wallet` changes (due to an NFT transfer on the blockchain), the `identity_id` is automatically updated to match the new owner's identity.

2. **Identity Creation for New Owners**: If a vehicle is transferred to a wallet that doesn't have an identity registry entry, a basic identity is automatically created.

3. **Data Integrity Verification**: A function is provided to verify the integrity of the vehicle-identity relationships.

## Implementation Details

### Database Triggers

1. `sync_vehicle_owner_identity_trigger`: Updates the `identity_id` when `owner_wallet` changes
2. `set_initial_vehicle_identity_trigger`: Sets the initial `identity_id` for new vehicles
3. `ensure_vehicle_owner_has_identity_trigger`: Creates identity entries for new owners

### Views

- `vehicle_profiles_with_owner`: Joins vehicle profiles with owner identity information

## Migration Process

To implement this integration:

1. Run the migration script:
   ```bash
   ./run-vehicle-identity-migration.sh
   ```

2. The script will:
   - Add the `identity_id` column to the `vehicle_profiles` table
   - Create necessary triggers and functions
   - Update existing records to link them to identity registry entries
   - Verify the migration was successful

## Handling Blockchain Transfers

When a vehicle NFT is transferred on the blockchain:

1. The application should update the `owner_wallet` field in the `vehicle_profiles` table
2. The database triggers will automatically:
   - Update the `identity_id` to match the new owner
   - Create an identity registry entry for the new owner if needed

## Troubleshooting

If you encounter issues with the integration:

1. Run the verification function to identify problem records:
   ```sql
   SELECT * FROM verify_vehicle_identity_integrity();
   ```

2. Check for records with missing identity links:
   ```sql
   SELECT * FROM vehicle_profiles WHERE identity_id IS NULL AND owner_wallet IS NOT NULL;
   ```

3. Verify trigger functionality by updating a vehicle's owner_wallet and checking if identity_id is updated automatically.