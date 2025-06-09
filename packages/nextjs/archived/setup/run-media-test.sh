#!/bin/bash

# Run the media upload test script
echo "Running media upload test..."
echo "Make sure the Next.js development server is running!"
echo ""

# Check if node-fetch and form-data are installed
if ! npm list node-fetch > /dev/null 2>&1 || ! npm list form-data > /dev/null 2>&1; then
  echo "Required dependencies not found. Installing them now..."
  ./install-test-deps.sh
fi

# Run the test script
node test-media-upload.mjs

echo ""
echo "Test completed. Check the output above for results."
echo "For more information, see MEDIA_UPLOAD_README.md"