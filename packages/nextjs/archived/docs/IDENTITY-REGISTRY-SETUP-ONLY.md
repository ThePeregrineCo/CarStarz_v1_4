# Identity Registry Setup Instructions

This document explains how to set up only the identity registry tables without affecting existing vehicle tables.

## Purpose

The `setup-identity-registry-only.mjs` script is designed to create only the identity registry tables in your database without touching any existing vehicle-related tables. This is useful when:

1. You already have vehicle tables set up
2. You're experiencing the "Profile Required" error when minting vehicles
3. You need to add the identity registry system to an existing database

## What This Script Does

This script:

1. Creates the identity registry tables:
   - `identity_registry`: Stores user profile information
   - `follows`: Tracks user follow relationships
   - `social_links`: Stores links to social media profiles
2. Verifies that all tables were created successfully
3. Does NOT modify or delete any existing vehicle tables

## How to Use

### Using the Shell Script (Recommended)

1. Open a terminal in the project directory
2. Navigate to the nextjs package:
   ```bash
   cd packages/nextjs
   ```
3. Run the shell script:
   ```bash
   ./run-setup-identity-registry-only.sh
   ```
4. Confirm the setup when prompted

### Running the JavaScript File Directly

1. Open a terminal in the project directory
2. Navigate to the nextjs package:
   ```bash
   cd packages/nextjs
   ```
3. Run the JavaScript file:
   ```bash
   node setup-identity-registry-only.mjs
   ```

## After Running the Script

After running this script, you should:

1. Verify that the identity registry tables were created successfully
2. Start your Next.js development server:
   ```bash
   yarn dev
   ```
3. Try minting a vehicle to see if the "Profile Required" error is resolved

## Troubleshooting

If you encounter any issues:

1. Check that your `.env.local` file contains the correct Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Make sure the `exec_sql` RPC function exists in your Supabase database. If not, you can create it with:
   ```sql
   CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
   BEGIN
     EXECUTE sql;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

3. If specific tables are failing to create, check the error messages in the console output.

## Relationship with the Complete Reset Script

This script is a targeted version of the complete database reset script (`reset-all-db.mjs`). The key differences are:

- This script only creates identity registry tables
- It does not drop or modify any existing vehicle tables
- It's safer to use when you already have vehicle data you want to preserve

If you need a complete reset of all tables, use the `run-reset-all-db.sh` script instead.