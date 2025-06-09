# CARSTARZ Application Setup Guide

This guide will help you set up and configure the CARSTARZ Vehicle Profile Web App.

## 1. Database Setup

### 1.1 Supabase Configuration

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `packages/nextjs/supabase-setup.sql`
4. Run the script to set up all necessary tables, policies, and indexes

### 1.2 Environment Variables

Make sure your `.env.local` file contains the following variables:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NFT Contract Address
NEXT_PUBLIC_VEHICLE_NFT_ADDRESS=your_contract_address

# Optional: Alchemy API Key (for production)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# Optional: WalletConnect Project ID (for production)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

Replace the placeholder values with your actual credentials.

## 2. Storage Setup

1. In your Supabase dashboard, go to the Storage section
2. Create a new bucket named `vehicle-media` if it doesn't exist
3. Set the bucket's privacy to "Public"

## 3. Authentication Setup

1. In your Supabase dashboard, go to the Authentication section
2. Enable the "Email" provider for authentication
3. Configure any additional authentication providers as needed

## 4. Running the Application

1. Install dependencies:
   ```
   yarn install
   ```

2. Start the local blockchain:
   ```
   yarn chain
   ```
   This will start a local Hardhat network that you can interact with.

3. In a new terminal, start the development server:
   ```
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 5. Testing the Features

### 5.1 Minting a Vehicle

1. Connect your wallet
2. Navigate to the mint page
3. Fill in the vehicle details and submit
4. Confirm the transaction in your wallet

### 5.2 Adding Videos

1. Navigate to a vehicle profile page
2. Click "Add Video"
3. Enter the YouTube URL, title, and description
4. Submit the form

### 5.3 User Profile

1. Navigate to the profile page
2. View your owned vehicles
3. Test the "Collect" and "Follow" features

## 6. Troubleshooting

### 6.1 Database Issues

If you encounter database-related errors:
- Check that all tables were created correctly
- Verify that the RLS policies are properly configured
- Ensure your Supabase credentials are correct in the `.env.local` file

### 6.2 Contract Interaction Issues

If you have issues with contract interactions:
- Verify that the contract address is correct in the `.env.local` file
- Check that you're connected to the correct network
- Ensure you have enough funds for gas fees

### 6.3 Media Upload Issues

If media uploads fail:
- Check that the `vehicle-media` bucket exists in Supabase Storage
- Verify that the bucket permissions are set correctly
- Check the file size and format (should be image or video)

## 7. Additional Configuration

### 7.1 Network Configuration

By default, the application is configured to use the Hardhat local network. To use a different network:

1. Open `scaffold.config.ts`
2. Update the `targetNetworks` array with your desired networks
3. Restart the application

### 7.2 Contract Configuration

If you deploy a new version of the contract:

1. Update the `NEXT_PUBLIC_VEHICLE_NFT_ADDRESS` in your `.env.local` file
2. Update the ABI in `packages/nextjs/contracts/deployedContracts.ts` if needed

### 7.3 Deploying the Contract

To deploy the contract to the local Hardhat network:

1. Start the local blockchain:
   ```
   yarn chain
   ```

2. In a new terminal, deploy the contract:
   ```
   cd packages/hardhat
   yarn deploy
   ```

3. The deployment script will output the contract address. Update the `NEXT_PUBLIC_VEHICLE_NFT_ADDRESS` in your `.env.local` file with this address.