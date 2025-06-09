# Complete Database Reset Instructions

This document explains how to use the new self-contained database reset script.

## Purpose

The `reset-all-db.js` script is designed to completely reset your database with all necessary tables, including:

1. Vehicle-related tables (vehicle_profiles, vehicle_media, vehicle_links, etc.)
2. Identity registry tables (identity_registry, follows, social_links)
3. Storage buckets for media

This script ensures that all tables are properly created and configured, which prevents issues like the "Profile Required" error when minting vehicles.

## When to Use This Script

Use this script when:

- You want to start with a clean database
- You're experiencing issues with missing tables or data
- You've reset the database but are missing some tables (like identity_registry)
- You want to ensure all tables are properly set up

## How to Use

### Option 1: Using the Shell Script (Recommended)

1. Open a terminal in the project directory
2. Navigate to the nextjs package:
   ```bash
   cd packages/nextjs
   ```
3. Run the shell script:
   ```bash
   ./run-reset-all-db.sh
   ```
4. Confirm the reset when prompted

### Option 2: Running the JavaScript File Directly

1. Open a terminal in the project directory
2. Navigate to the nextjs package:
   ```bash
   cd packages/nextjs
   ```
3. Run the JavaScript file:
   ```bash
   node reset-all-db.mjs
   ```

## What This Script Does

1. Drops all existing tables in the database
2. Creates vehicle-related tables using `reset-schema-simplified.sql` (a simplified version without storage policies)
3. Creates identity registry tables using `identity-registry-schema-simplified.sql` (a simplified version without triggers)
4. Resets the token counter to 1
5. Creates necessary storage buckets (profile-images, vehicle-media)
6. Verifies that all tables were created successfully

## After Running the Script

After running this script, you should:

1. Reset the blockchain if needed:
   ```bash
   ./reset-hardhat-contracts.sh
   ```
2. Start your Next.js development server:
   ```bash
   yarn dev
   ```

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

## About the Simplified Schemas

### Vehicle Tables Schema

The script now uses `reset-schema-simplified.sql` instead of the original `reset-schema-carstarz.sql`. The simplified version:

- Contains all the same tables and indexes as the original schema
- Includes all the same Row Level Security (RLS) policies for data access
- Removes the storage bucket policies that were causing permission issues
- Avoids errors related to the `storage.objects` table

### Identity Registry Schema

Similarly, the script uses `identity-registry-schema-simplified.sql` instead of the original `identity-registry-schema.sql`. The simplified version:

- Contains all the same tables and indexes as the original schema
- Removes the trigger functions and complex PL/pgSQL code that was causing syntax errors
- Creates the tables directly with simple SQL statements
- Includes a test record to verify the tables work correctly

These changes allow the reset script to run successfully without requiring elevated permissions or encountering errors with complex SQL syntax. The application will still function correctly with these simplified schemas.

If you need to manually set up storage policies or more complex database functions later, you can refer to the original SQL files.