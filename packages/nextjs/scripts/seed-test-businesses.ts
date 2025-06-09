import { getSupabaseClient } from '../lib/supabase';

/**
 * Script to seed test businesses in the database
 * This will create a few test businesses that can be used for testing the builder search functionality
 */
async function seedTestBusinesses() {
  console.log('Starting to seed test businesses...');
  
  // Log environment variables for debugging (without showing full values)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set (hidden)' : 'not set');
  
  const client = getSupabaseClient(true);
  if (!client) {
    console.error('Failed to get Supabase client');
    console.error('Please check your environment variables and try again');
    return;
  }
  
  try {
    // First, get or create a test user
    console.log('Creating test user...');
    const testWalletAddress = '0x1234567890123456789012345678901234567890';
    
    // Check if the test user already exists
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('wallet_address', testWalletAddress)
      .maybeSingle();
    
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      console.log('Using existing test user:', userId);
    } else {
      // Create a test user
      const { data: newUser, error: userError } = await client
        .from('users')
        .insert({
          wallet_address: testWalletAddress,
          username: 'testuser',
          display_name: 'Test User',
        })
        .select()
        .single();
      
      if (userError) {
        throw new Error(`Error creating test user: ${userError.message}`);
      }
      
      userId = newUser.id;
      console.log('Created new test user:', userId);
    }
    
    // Create test businesses
    console.log('Creating test businesses...');
    const testBusinesses = [
      {
        user_id: userId,
        business_name: 'Custom Auto Shop',
        business_type: 'Mechanic',
        description: 'Specializing in custom automotive work',
        specialties: ['Engine Swaps', 'Custom Fabrication', 'Performance Tuning'],
        location: 'Detroit, MI',
      },
      {
        user_id: userId,
        business_name: 'Performance Tuning',
        business_type: 'Tuner',
        description: 'Expert ECU tuning and performance upgrades',
        specialties: ['ECU Tuning', 'Dyno Testing', 'Turbo Installation'],
        location: 'Los Angeles, CA',
      },
      {
        user_id: userId,
        business_name: 'Body Works',
        business_type: 'Body Shop',
        description: 'Custom body work and paint',
        specialties: ['Custom Paint', 'Body Kits', 'Restoration'],
        location: 'Miami, FL',
      },
      {
        user_id: userId,
        business_name: 'Classic Restoration',
        business_type: 'Restoration Shop',
        description: 'Specializing in classic car restoration',
        specialties: ['Full Restoration', 'Fabrication', 'Upholstery'],
        location: 'Chicago, IL',
      },
      {
        user_id: userId,
        business_name: 'Off-Road Specialists',
        business_type: 'Off-Road Shop',
        description: 'Custom off-road builds and modifications',
        specialties: ['Lift Kits', 'Suspension', 'Armor'],
        location: 'Denver, CO',
      },
    ];
    
    // Insert businesses, ignoring conflicts
    const { data: businesses, error: businessError } = await client
      .from('businesses')
      .upsert(testBusinesses, { onConflict: 'user_id,business_name' })
      .select();
    
    if (businessError) {
      throw new Error(`Error creating test businesses: ${businessError.message}`);
    }
    
    console.log(`Successfully created/updated ${businesses?.length || 0} test businesses`);
    
    // Log the business IDs for reference
    businesses?.forEach(business => {
      console.log(`- ${business.business_name}: ${business.id}`);
    });
    
    console.log('Test businesses seeded successfully!');
  } catch (error) {
    console.error('Error seeding test businesses:', error);
  }
}

// Run the seed function
seedTestBusinesses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });