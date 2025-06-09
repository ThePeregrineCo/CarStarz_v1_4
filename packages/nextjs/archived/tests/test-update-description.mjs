// Test script to verify vehicle description updates
import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:3000/api/vehicle-profiles';
const TOKEN_ID = '29'; // Replace with a valid token ID in your database

async function testUpdateDescription() {
  try {
    console.log('=== Testing Vehicle Description Update ===');
    
    // Step 1: Get the current vehicle profile
    console.log(`\nFetching current profile for token ID ${TOKEN_ID}...`);
    const getResponse = await fetch(`${API_URL}?tokenId=${TOKEN_ID}`);
    
    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      throw new Error(`Failed to fetch vehicle profile: ${JSON.stringify(errorData)}`);
    }
    
    const currentProfile = await getResponse.json();
    console.log('Current profile:', currentProfile);
    console.log('Current description:', currentProfile.description);
    
    // Step 2: Update the vehicle description
    const newDescription = `Updated description from test script - ${new Date().toISOString()}`;
    console.log(`\nUpdating description to: "${newDescription}"`);
    
    const updateData = {
      description: newDescription
    };
    
    console.log('Sending update request...');
    const updateResponse = await fetch(`${API_URL}?tokenId=${TOKEN_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${JSON.stringify(updateResult)}`);
    }
    
    console.log('Update response:', updateResult);
    
    // Step 3: Verify the update by fetching the profile again
    console.log('\nVerifying update by fetching profile again...');
    const verifyResponse = await fetch(`${API_URL}?tokenId=${TOKEN_ID}`);
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(`Failed to fetch updated vehicle profile: ${JSON.stringify(errorData)}`);
    }
    
    const updatedProfile = await verifyResponse.json();
    console.log('Updated profile description:', updatedProfile.description);
    
    // Check if the description was updated
    if (updatedProfile.description === newDescription) {
      console.log('\n✅ SUCCESS: Description was updated successfully in the database!');
    } else {
      console.log('\n❌ ERROR: Description was not updated in the database.');
      console.log(`Expected: "${newDescription}"`);
      console.log(`Actual: "${updatedProfile.description}"`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run the test
testUpdateDescription();