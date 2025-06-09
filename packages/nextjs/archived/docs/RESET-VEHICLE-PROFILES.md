# Resetting or Deleting Vehicle Profiles in Supabase

This document provides instructions on how to reset or delete vehicle profiles in the Supabase database.

## Overview

The CarStarz application stores vehicle profiles in the Supabase database. Sometimes, you may need to reset or delete these profiles for testing or development purposes. This document explains how to do that.

## Database Structure

Vehicle profiles are stored in the following tables:

- `vehicle_profiles`: Contains the main vehicle profile information
- `vehicle_media`: Contains media (images) associated with vehicles
- `vehicle_videos`: Contains videos associated with vehicles

These tables are related through foreign keys, so deleting a vehicle profile will also delete its associated media and videos.

## Methods for Deleting Vehicle Profiles

### 1. Using the Delete All Vehicle Profiles Script

We've created a script that will delete all vehicle profiles from the database. This is the easiest way to reset the database.

```bash
# Run the script
node delete-all-vehicle-profiles.mjs
```

This script will:
1. Delete all records from the `vehicle_media` table
2. Delete all records from the `vehicle_videos` table
3. Delete all records from the `vehicle_profiles` table

### 2. Using the Supabase Dashboard

You can also delete vehicle profiles manually through the Supabase dashboard:

1. Log in to your Supabase dashboard
2. Go to the "Table Editor" section
3. Select the `vehicle_profiles` table
4. Select the records you want to delete
5. Click the "Delete" button

Note: This method will not automatically delete associated media and videos due to RLS (Row Level Security) policies. You'll need to delete those separately.

### 3. Using SQL Queries

If you have direct SQL access to the database, you can use the following SQL queries to delete all vehicle profiles:

```sql
-- Delete all vehicle media
DELETE FROM vehicle_media;

-- Delete all vehicle videos
DELETE FROM vehicle_videos;

-- Delete all vehicle profiles
DELETE FROM vehicle_profiles;
```

### 4. Using the Supabase API

You can also use the Supabase API to delete vehicle profiles programmatically:

```javascript
// Delete all vehicle media
await supabase
  .from('vehicle_media')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000');

// Delete all vehicle videos
await supabase
  .from('vehicle_videos')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000');

// Delete all vehicle profiles
await supabase
  .from('vehicle_profiles')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000');
```

## Deleting Specific Vehicle Profiles

If you want to delete a specific vehicle profile, you can use the token ID to identify it:

```javascript
// Get the vehicle ID for the token ID
const { data: vehicle } = await supabase
  .from('vehicle_profiles')
  .select('id')
  .eq('token_id', tokenId)
  .single();

if (vehicle) {
  // Delete associated media
  await supabase
    .from('vehicle_media')
    .delete()
    .eq('vehicle_id', vehicle.id);

  // Delete associated videos
  await supabase
    .from('vehicle_videos')
    .delete()
    .eq('vehicle_id', vehicle.id);

  // Delete the vehicle profile
  await supabase
    .from('vehicle_profiles')
    .delete()
    .eq('id', vehicle.id);
}
```

## Caution

Be careful when deleting vehicle profiles, especially in a production environment. Make sure you have backups of your data before performing any deletion operations.

## Troubleshooting

If you encounter any issues when deleting vehicle profiles, check the following:

1. Make sure you have the correct permissions to delete records from the database
2. Check if there are any RLS (Row Level Security) policies that might be preventing deletion
3. Check if there are any foreign key constraints that might be preventing deletion

If you're still having issues, you can try using the Supabase dashboard to inspect the database and identify any problems.