// Test script for media upload functionality
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:3000/api/vehicle-media';
const TOKEN_ID = '32'; // Replace with an actual token ID from your system
const TEST_IMAGE_PATH = path.join(__dirname, 'public/logo.svg'); // Using an existing image in the project

async function testMediaUpload() {
  try {
    console.log('Starting media upload test...');
    
    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`Test image not found at: ${TEST_IMAGE_PATH}`);
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('caption', 'Test image upload');
    formData.append('category', 'general');
    formData.append('is_featured', 'true');
    formData.append('tokenId', TOKEN_ID);
    
    console.log(`Uploading test image for token ID: ${TOKEN_ID}`);
    
    // Send request
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
    
    // Parse response
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Media upload successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      // Verify the uploaded media is accessible
      if (result.url) {
        console.log(`Media URL: ${result.url}`);
        console.log('You can verify the image by visiting this URL in your browser.');
      }
    } else {
      console.error('❌ Media upload failed!');
      console.error('Error:', result.error);
      console.error('Details:', result.details || 'No additional details provided');
    }
  } catch (error) {
    console.error('❌ Test failed with an exception:');
    console.error(error);
  }
}

// Run the test
testMediaUpload();