import { getSupabaseClient } from '../lib/supabase';

async function seedTestData() {
  console.log('Starting to seed test profile data...');
  const client = getSupabaseClient(true);
  if (!client) {
    console.error('Failed to get Supabase client');
    return;
  }
  
  try {
    // Create test user
    console.log('Creating test user...');
    const { data: user, error: userError } = await client
      .from('users')
      .upsert([{
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        username: 'testuser',
        display_name: 'Test User',
        bio: 'This is a test user profile for development purposes.',
        profile_image_url: 'https://i.pravatar.cc/300?u=testuser',
        banner_image_url: 'https://picsum.photos/1200/400',
        user_type: 'owner',
        subscription_tier: 'standard',
        location: 'Detroit, MI'
      }], { onConflict: 'wallet_address' })
      .select()
      .single();
      
    if (userError) {
      console.error('Error creating test user:', userError);
      return;
    }
    
    console.log('Created test user:', user);
    
    // Add social links for user
    console.log('Adding social links for user...');
    await client
      .from('social_links')
      .delete()
      .eq('user_id', user.id);
      
    const { error: socialLinksError } = await client
      .from('social_links')
      .insert([
        {
          user_id: user.id,
          platform: 'instagram',
          url: 'https://instagram.com/testuser',
          display_name: 'testuser'
        },
        {
          user_id: user.id,
          platform: 'twitter',
          url: 'https://twitter.com/testuser',
          display_name: '@testuser'
        }
      ]);
      
    if (socialLinksError) {
      console.error('Error adding social links for user:', socialLinksError);
    }
    
    // Create test business
    console.log('Creating test business...');
    const { data: business, error: businessError } = await client
      .from('businesses')
      .upsert([{
        user_id: user.id,
        business_name: 'Test Auto Shop',
        business_type: 'Mechanic',
        description: 'A test auto shop for development purposes. We specialize in engine swaps, custom paint jobs, and performance upgrades.',
        logo_url: 'https://picsum.photos/300/300?business',
        banner_image_url: 'https://picsum.photos/1200/400?business',
        contact_info: {
          email: 'contact@testautoshop.com',
          phone: '555-123-4567',
          address: {
            street: '123 Main St',
            city: 'Detroit',
            state: 'MI',
            postal_code: '48201',
            country: 'USA'
          }
        },
        specialties: ['Engine Swaps', 'Custom Paint', 'Performance Upgrades'],
        subscription_tier: 'standard',
        website_url: 'https://testautoshop.com',
        google_maps_url: 'https://www.google.com/maps/place/Detroit,+MI',
        location: 'Detroit, MI'
      }], { onConflict: 'user_id, business_name' })
      .select()
      .single();
      
    if (businessError) {
      console.error('Error creating test business:', businessError);
      return;
    }
    
    console.log('Created test business:', business);
    
    // Add social links for business
    console.log('Adding social links for business...');
    await client
      .from('social_links')
      .delete()
      .eq('business_id', business.id);
      
    const { error: businessSocialLinksError } = await client
      .from('social_links')
      .insert([
        {
          business_id: business.id,
          platform: 'instagram',
          url: 'https://instagram.com/testautoshop',
          display_name: 'testautoshop'
        },
        {
          business_id: business.id,
          platform: 'facebook',
          url: 'https://facebook.com/testautoshop',
          display_name: 'Test Auto Shop'
        }
      ]);
      
    if (businessSocialLinksError) {
      console.error('Error adding social links for business:', businessSocialLinksError);
    }
    
    // Add services for business
    console.log('Adding services for business...');
    await client
      .from('services')
      .delete()
      .eq('business_id', business.id);
      
    const { error: servicesError } = await client
      .from('services')
      .insert([
        {
          business_id: business.id,
          name: 'Engine Swap',
          description: 'Complete engine replacement with performance upgrades',
          category: 'Performance',
          price_range: {
            min: 5000,
            max: 15000,
            currency: 'USD'
          }
        },
        {
          business_id: business.id,
          name: 'Custom Paint Job',
          description: 'Full vehicle custom paint with premium materials',
          category: 'Appearance',
          price_range: {
            min: 3000,
            max: 8000,
            currency: 'USD'
          }
        },
        {
          business_id: business.id,
          name: 'Performance Tuning',
          description: 'ECU tuning and performance optimization',
          category: 'Performance',
          price_range: {
            min: 500,
            max: 2000,
            currency: 'USD'
          }
        }
      ]);
      
    if (servicesError) {
      console.error('Error adding services for business:', servicesError);
    }
    
    // Create test club
    console.log('Creating test club...');
    const { data: club, error: clubError } = await client
      .from('clubs')
      .upsert([{
        creator_id: user.id,
        club_name: 'Test Car Club',
        description: 'A test car club for development purposes. We meet every Saturday for drives and car shows.',
        logo_url: 'https://picsum.photos/300/300?club',
        banner_image_url: 'https://picsum.photos/1200/400?club',
        is_private: false,
        club_rules: '1. Be respectful to all members\n2. No burnouts in the parking lot\n3. Have fun!',
        membership_requirements: 'Open to all car enthusiasts',
        location: 'Detroit, MI',
        founding_date: new Date().toISOString()
      }], { onConflict: 'creator_id, club_name' })
      .select()
      .single();
      
    if (clubError) {
      console.error('Error creating test club:', clubError);
      return;
    }
    
    console.log('Created test club:', club);
    
    // Add social links for club
    console.log('Adding social links for club...');
    await client
      .from('social_links')
      .delete()
      .eq('club_id', club.id);
      
    const { error: clubSocialLinksError } = await client
      .from('social_links')
      .insert([
        {
          club_id: club.id,
          platform: 'instagram',
          url: 'https://instagram.com/testcarclub',
          display_name: 'testcarclub'
        },
        {
          club_id: club.id,
          platform: 'facebook',
          url: 'https://facebook.com/groups/testcarclub',
          display_name: 'Test Car Club Group'
        }
      ]);
      
    if (clubSocialLinksError) {
      console.error('Error adding social links for club:', clubSocialLinksError);
    }
    
    // Add club membership for creator
    console.log('Adding club membership for creator...');
    const { error: membershipError } = await client
      .from('club_memberships')
      .upsert([{
        club_id: club.id,
        user_id: user.id,
        membership_status: 'active',
        membership_level: 'admin'
      }], { onConflict: 'club_id, user_id' });
      
    if (membershipError) {
      console.error('Error adding club membership:', membershipError);
    }
    
    console.log('Test data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

// Execute the seeding function
seedTestData()
  .catch(console.error)
  .finally(() => {
    console.log('Seeding script finished');
    process.exit(0);
  });