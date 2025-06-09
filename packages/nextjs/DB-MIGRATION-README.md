# CarStarz Database Migration & Verification Guide

This guide explains how to reset, set up, and verify the database for the CarStarz application.

## Prerequisites

Before running the migration, make sure you have:

1. A Supabase project set up
2. Your Supabase project URL and service role key

## Database Setup Options

You have two options for setting up the database:

1. **Consolidated Migration**: Combines multiple SQL files into a single migration
2. **Clean Schema**: Uses a clean, comprehensive schema file with all tables and relationships

### Option 1: Running the Consolidated Migration

The consolidated migration script combines multiple SQL files into a single migration and executes it against your Supabase database. This ensures that all tables, functions, and initial data are set up correctly.

### What the Migration Includes

The consolidated migration includes:

1. **Base Schema Setup**: Creates all necessary tables for vehicle profiles, media, specifications, etc.
2. **Identity Registry**: Sets up the identity registry system for user authentication
3. **Vehicle-Identity Integration**: Links vehicles to the identity registry
4. **Video Support**: Adds support for vehicle videos

### Step 1: Set Up Environment Variables

Before running the migration, you need to set up your Supabase credentials as environment variables:

1. Make sure you have a `.env.local` file in the `packages/nextjs` directory
2. Add your Supabase URL and service role key to the file:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The migration scripts will automatically read these environment variables.

### Step 2: Run the Migration Script

To run the migration:

```bash
# Navigate to the project directory
cd /Users/jonathanpalmer/carstarz_v1_4

# Make the script executable (if not already)
chmod +x packages/nextjs/scripts/run-consolidated-migration.sh

# Run the script
bash packages/nextjs/scripts/run-consolidated-migration.sh
```

The script will:
1. Create a consolidated migration file at `infrastructure/database/migrations/01-consolidated-schema.sql`
2. Create the migration runner script at `packages/nextjs/run-consolidated-migration.mjs`
3. Ask if you want to run the migration immediately

If you choose not to run the migration immediately, you can run it later with:

```bash
# Make sure you're in the project root directory
cd /Users/jonathanpalmer/carstarz_v1_4

# Run the migration
node packages/nextjs/run-consolidated-migration.mjs
```

## Verifying the Migration

After running the migration, you can verify that it was successful by:

1. Checking your Supabase dashboard to see if the tables were created
2. Running a test query to check if the tables exist:

```javascript
const { data, error } = await supabase.from('vehicle_profiles').select('count');
console.log('Vehicle profiles count:', data);
```

## Troubleshooting

If you encounter any issues:

1. **Migration fails with permission errors**: Make sure you're using the service role key, not the anon key
2. **Tables already exist**: The migration includes DROP TABLE IF EXISTS statements, but you may need to manually drop tables if there are foreign key constraints
3. **exec_sql function not found**: Make sure your Supabase project has the pgSQL extension enabled
4. **File not found errors**: Make sure you're running the script from the project root directory (`/Users/jonathanpalmer/carstarz_v1_4`)
5. **Environment variable errors**: Make sure your `.env.local` file exists in the `packages/nextjs` directory and contains the correct Supabase credentials
6. **"Supabase credentials not found" error**: Double-check that your environment variables are named correctly: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Manual Reset

If you need to manually reset the database, you can:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `infrastructure/database/migrations/01-consolidated-schema.sql`
4. Paste it into the SQL Editor and run it

### Option 2: Running the Clean Schema Migration

The clean schema migration uses a single, comprehensive SQL file that includes all tables, relationships, and policies in a clean, organized format.

```bash
# Navigate to the project directory
cd /Users/jonathanpalmer/carstarz_v1_4

# Make the script executable (if not already)
chmod +x packages/nextjs/scripts/run-clean-migration.sh

# Run the script
bash packages/nextjs/scripts/run-clean-migration.sh
```

## Database Verification

After setting up the database, it's important to verify that it's correctly configured and that all relationships and security policies are working as expected.

### Running the Verification Fixes

We've created a verification script that checks for common issues and applies fixes to ensure database integrity:

```bash
# Make the script executable
chmod +x packages/nextjs/scripts/run-verification-fixes.sh

# Run the script
bash packages/nextjs/scripts/run-verification-fixes.sh
```

The verification script checks for and fixes:

1. **Wallet Address Normalization**: Ensures wallet addresses are consistently handled
2. **Vehicle-Media Relationships**: Verifies media is correctly linked to vehicles
3. **Identity Registry Integration**: Ensures identity registry is the source of truth

### Verification Plan

For a detailed verification plan, see `packages/nextjs/DB-SCHEMA-VERIFICATION-PLAN.md`. This document outlines:

- The systematic approach to verifying the database
- Progress tracking for each verification question
- Detailed steps for each verification area
- Test SQL queries to verify fixes

## Next Steps

After setting up and verifying the database, you should:

1. Seed the database with test data (if needed)
2. Run the verification script to ensure database integrity
3. Configure authentication settings in your Supabase dashboard
4. Test the application with the new database setup