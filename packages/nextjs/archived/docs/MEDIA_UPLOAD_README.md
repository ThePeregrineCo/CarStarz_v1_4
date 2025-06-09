# Media Upload Functionality

This document explains how media uploads work in the CarStarz application and provides instructions for testing the functionality.

## How Media Uploads Work

When a user uploads an image or video through the MediaGallery component, the following process occurs:

1. **Client-Side (MediaGallery Component)**:
   - User selects a file and provides metadata (caption, featured status)
   - The file and metadata are sent to the `/api/vehicle-media` endpoint as FormData
   - The component shows a preview of the image/video before upload
   - A loading spinner is displayed during the upload process

2. **API Route (`/api/vehicle-media`)**:
   - Receives the FormData with the file and metadata
   - Extracts the tokenId and passes it along with the FormData to the vehicleMedia.create function

3. **Backend (vehicleMedia.create)**:
   - Verifies the vehicle profile exists in the database
   - Extracts the file from the FormData
   - Uploads the file to Supabase Storage in a folder named after the tokenId
   - Gets the public URL for the uploaded file
   - Creates a record in the vehicle_media table with the file metadata
   - Logs the action in the audit log

4. **Storage**:
   - Files are stored in Supabase Storage in the 'vehicle-media' bucket
   - Each vehicle's media is stored in a folder named after its tokenId
   - Files are named with a timestamp to ensure uniqueness

## Testing Media Upload

A test script is provided to verify the media upload functionality without using the UI.

### Prerequisites

1. The Next.js development server must be running (`yarn dev`)
2. You need to have Node.js installed

### Installation

Run the installation script to install the required dependencies:

```bash
cd packages/nextjs
./install-test-deps.sh
```

### Running the Test

Execute the test script:

```bash
cd packages/nextjs
node test-media-upload.mjs
```

The script will:
1. Upload the logo.svg file as a test image
2. Display the response from the server
3. Show the URL where the uploaded image can be accessed

### Customizing the Test

You can modify the following variables in the test script:
- `TOKEN_ID`: The ID of the vehicle to upload media for
- `TEST_IMAGE_PATH`: The path to the image file to upload

## Troubleshooting

If you encounter issues with the media upload:

1. Check that the Next.js server is running
2. Verify that Supabase is properly configured in `.env.local`
3. Check the console logs for error messages
4. Ensure the vehicle with the specified tokenId exists in the database