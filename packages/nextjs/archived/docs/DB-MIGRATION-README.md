# CarStarz Database Migration Guide

This guide explains how to migrate the CarStarz database to the new schema structure as part of the application redesign.

## Overview

The migration process:

1. Resets the database by dropping all existing tables
2. Creates new tables according to the redesigned schema
3. Sets up storage buckets and policies for media files
4. Establishes relationships between entities

## Prerequisites

Before running the migration, ensure you have:

1. Supabase project set up with admin access
2. Environment variables configured in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Node.js installed (v16 or higher)

## Migration Files

- `schema-restructure.sql`: Contains the new database schema definition
- `scripts/migrate-database.js`: JavaScript script that performs the migration
- `run-db-migration.sh`: Shell script to easily run the migration

## Running the Migration

### Option 1: Using the Shell Script

```bash
# Make sure you're in the project root directory
cd /path/to/carstarz_v1_4

# Run the migration script
./packages/nextjs/run-db-migration.sh
```

### Option 2: Running the JavaScript Script Directly

```bash
# Make sure you're in the project root directory
cd /path/to/carstarz_v1_4

# Run the migration script
node packages/nextjs/scripts/migrate-database.js
```

## Schema Changes

The new schema includes:

1. **Users Table**: Stores user information with wallet address to username mapping
2. **Vehicle Profiles**: Enhanced with additional fields and relationships
3. **Builders/Shops**: New entity for professional builders and shops
4. **Parts**: New entity for vehicle parts and modifications
5. **Relationships**: New junction tables for many-to-many relationships

## Post-Migration Steps

After running the migration:

1. Verify the database structure in the Supabase dashboard
2. Check that all tables were created correctly
3. Test the application with the new schema
4. If needed, manually add test data to verify relationships

## Troubleshooting

If you encounter issues during migration:

1. Check the console output for specific error messages
2. Verify your environment variables are correctly set
3. Ensure you have the necessary permissions in Supabase
4. Try running the SQL statements manually in the Supabase SQL editor

## Reverting the Migration

There is no automatic way to revert the migration. If you need to go back to the previous schema:

1. Use the Supabase dashboard to drop all tables
2. Run the original schema creation script (`reset-schema-carstarz.sql`)

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [CarStarz Redesign Plan](./CarStarz-Redesign-Plan.md)