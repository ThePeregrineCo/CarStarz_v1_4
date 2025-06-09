# CarStarz Reset Instructions

This document provides instructions for completely resetting the CarStarz application for testing purposes. The reset process will:

1. Clean wipe the Supabase database
2. Reset the token counter to 1
3. Clean the Hardhat blockchain
4. Redeploy the contracts

## Prerequisites

Before running any reset scripts, ensure you have the following:

1. Supabase project set up with the necessary credentials
2. `.env.local` file in the `packages/nextjs` directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Node.js and npm/yarn installed
4. Hardhat installed

## Reset Options

### Option 1: One-Command Reset (Recommended)

This option will handle the entire reset process in a single command, including restarting the Hardhat node and redeploying contracts.

```bash
# From the project root directory
./packages/nextjs/one-command-reset.sh
```

This script will:
1. Kill any running Hardhat node
2. Reset the database using the comprehensive schema
3. Reset the token counter to 1
4. Clean the Hardhat artifacts
5. Start a fresh Hardhat node in the background
6. Deploy the contracts to the local network

After running this script, you can start the Next.js development server:

```bash
cd packages/nextjs
yarn dev
```

### Option 2: Step-by-Step Reset

If you prefer more control over the reset process, you can use the clean-reset.sh script and manually handle the Hardhat node and contract deployment.

```bash
# From the packages/nextjs directory
./clean-reset.sh
```

This script will:
1. Reset the database using the comprehensive schema
2. Reset the token counter to 1
3. Clean the Hardhat artifacts

After running this script, you'll need to:

1. Kill any running Hardhat node:
   ```bash
   pkill -f "hardhat node"
   ```

2. Start a fresh Hardhat node:
   ```bash
   cd ../hardhat
   npx hardhat node
   ```

3. In a new terminal, deploy the contracts:
   ```bash
   cd packages/hardhat
   npx hardhat deploy --network localhost
   ```

4. Start the Next.js development server:
   ```bash
   cd ../nextjs
   yarn dev
   ```

## Troubleshooting

### Supabase Connection Issues

If you encounter issues connecting to Supabase, ensure that:

1. Your Supabase URL and service role key are correct in the `.env.local` file
2. The environment variables are properly exported in your terminal
3. Your IP address is allowed in the Supabase project settings

### Hardhat Node Issues

If the Hardhat node fails to start or you encounter contract deployment issues:

1. Ensure no other Hardhat node is running:
   ```bash
   pkill -f "hardhat node"
   ```

2. Check the Hardhat configuration in `packages/hardhat/hardhat.config.ts`

3. Try running the Hardhat node manually to see any error messages:
   ```bash
   cd packages/hardhat
   npx hardhat node
   ```

### Database Reset Issues

If the database reset fails:

1. Check the Supabase logs for any error messages
2. Ensure your service role key has the necessary permissions
3. Try running the SQL script directly in the Supabase SQL editor:
   - Copy the content of `packages/nextjs/complete-reset-script.sql`
   - Open the Supabase dashboard
   - Go to the SQL editor
   - Paste the SQL script and run it

## Manual Database Reset

If you need to manually reset the database:

1. Open the Supabase dashboard
2. Go to the SQL editor
3. Run the following SQL to drop all tables:
   ```sql
   DO $$ 
   DECLARE
       r RECORD;
   BEGIN
       -- Disable all triggers
       FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
           EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE TRIGGER ALL;';
       END LOOP;

       -- Drop all foreign key constraints
       FOR r IN (SELECT tc.constraint_name, tc.table_name 
                 FROM information_schema.table_constraints tc 
                 JOIN information_schema.constraint_column_usage ccu 
                 ON tc.constraint_name = ccu.constraint_name 
                 WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public') LOOP
           EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name) || ';';
       END LOOP;

       -- Drop all tables
       FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
           EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
       END LOOP;
   END $$;
   ```

4. Run the complete reset script:
   - Copy the content of `packages/nextjs/complete-reset-script.sql`
   - Paste it into the SQL editor and run it

## Conclusion

After completing the reset process, your CarStarz application will be in a clean state with:
- Empty database with the latest schema
- Token counter set to 1
- Clean blockchain with freshly deployed contracts

This provides an ideal environment for testing new features or reproducing issues.