import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    // Get the current signer's wallet address
    const walletAddress = process.argv[2];
    if (!walletAddress) {
      console.error('Please provide your wallet address as an argument');
      console.error('Usage: node createTestVehicleProfile.mjs 0xYourWalletAddress');
      process.exit(1);
    }

    // Token ID for the test vehicle
    const tokenId = 6;
    
    console.log(`Creating vehicle profile for token ID ${tokenId} with owner ${walletAddress}...`);
    
    // Check if the vehicle profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('vehicle_profiles')
      .select('id')
      .eq('token_id', tokenId.toString())
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing profile:', checkError);
      process.exit(1);
    }
    
    if (existingProfile) {
      console.log(`Vehicle profile for token ID ${tokenId} already exists. Updating owner...`);
      
      // Update the owner
      const { error: updateError } = await supabase
        .from('vehicle_profiles')
        .update({ owner_wallet: walletAddress })
        .eq('token_id', tokenId.toString());
        
      if (updateError) {
        console.error('Error updating vehicle profile:', updateError);
        process.exit(1);
      }
      
      console.log(`Updated owner of vehicle profile for token ID ${tokenId} to ${walletAddress}`);
    } else {
      // Create a new vehicle profile
      const { data, error } = await supabase
        .from('vehicle_profiles')
        .insert([
          {
            token_id: tokenId.toString(),
            name: 'Test Owner Vehicle',
            description: 'This is a test vehicle for testing owner functionality',
            make: 'Test',
            model: 'Owner',
            year: 2025,
            owner_wallet: walletAddress,
            is_verified: true
          }
        ])
        .select();
        
      if (error) {
        console.error('Error creating vehicle profile:', error);
        process.exit(1);
      }
      
      console.log(`Created vehicle profile for token ID ${tokenId}:`, data[0]);
    }
    
    console.log(`\nTest vehicle profile created/updated with token ID ${tokenId}`);
    console.log(`Owner: ${walletAddress}`);
    console.log(`\nYou can now visit: http://localhost:3000/vehicle/${tokenId}`);
    
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

main();