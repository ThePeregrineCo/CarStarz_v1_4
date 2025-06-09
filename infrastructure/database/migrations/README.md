# CarStarz Database Setup Guide

## Overview

This directory contains various database schema files for the CarStarz application. To simplify the setup process, we've created a streamlined approach using the wallet-identity schema, which is the most recent and well-designed schema.

## Quick Start

### Option 1: Using Supabase Dashboard (Recommended)

1. Open the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Open the file `simplified-wallet-identity-schema.sql`
4. Copy the entire contents and paste into the SQL Editor
5. Run the script
6. Verify the setup by running: `SELECT verify_setup();`

### Option 2: Using the Shell Script

```bash
# Navigate to the scripts directory
cd packages/nextjs/scripts

# Make the script executable
chmod +x run-simplified-schema.sh

# Run the script (replace with your actual Supabase credentials)
SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key ./run-simplified-schema.sh
```

### Option 3: Using the Node.js Script

```bash
# Navigate to the nextjs directory
cd packages/nextjs

# Install dependencies if needed
npm install @supabase/supabase-js

# Run the script (replace with your actual Supabase credentials)
SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key node run-simplified-schema.mjs
```

## Key Files

- `simplified-wallet-identity-schema.sql`: The main schema file, organized into clear sections with comments
- `SIMPLE-SETUP-GUIDE.md`: A detailed explanation of the schema design and its benefits
- `packages/nextjs/scripts/run-simplified-schema.sh`: Shell script to run the schema
- `packages/nextjs/run-simplified-schema.mjs`: Node.js script to run the schema

## Schema Design

The wallet-identity schema uses a clean design where:

1. Wallet addresses are stored **only once** in the `identity_registry` table
2. Vehicles are linked to owners through the `owner_id` field
3. NFT transfers are handled by updating the `owner_id` in the `vehicle_profiles` table
4. Row-Level Security (RLS) policies ensure users can only modify their own data

For more details, see the [SIMPLE-SETUP-GUIDE.md](./SIMPLE-SETUP-GUIDE.md) file.

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

## Troubleshooting

If you encounter any issues:

1. Make sure your Supabase credentials are correct
2. Check that you have the necessary permissions to execute SQL
3. Verify that the SQL script is being executed in its entirety
4. Look for any error messages in the Supabase dashboard

### Common Issues

- **Syntax error at or near "to"**: This was fixed in the latest version of the schema files. The issue was using "to" as a table alias, which is a reserved keyword in SQL. The fix was to change the alias to "tok_own".

- **Permission denied: "RI_ConstraintTrigger_a_XXXXX" is a system trigger**: This was fixed by replacing the dynamic trigger disabling approach with direct table drops. Supabase doesn't allow disabling system triggers, so we now use a simpler approach that just drops tables directly in the correct order.

- **Check constraint "check_wallet_format" violation**: This was fixed by changing the admin wallet address to a valid Ethereum address format (0x followed by 40 hex characters). The constraint requires wallet addresses to match the pattern '^0x[a-fA-F0-9]{40}$'.

For more detailed troubleshooting, check the Supabase logs in the dashboard.