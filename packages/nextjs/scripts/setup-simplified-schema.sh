#!/bin/bash

# Script to set up the simplified schema tools
# This script makes the run-simplified-schema.sh script executable

# Make the run script executable
chmod +x run-simplified-schema.sh

echo "Setup complete! You can now run the simplified schema using one of these methods:"
echo ""
echo "1. Using the Supabase Dashboard:"
echo "   - Open the Supabase dashboard for your project"
echo "   - Navigate to the SQL Editor"
echo "   - Open the file 'infrastructure/database/migrations/simplified-wallet-identity-schema.sql'"
echo "   - Copy the entire contents and paste into the SQL Editor"
echo "   - Run the script"
echo ""
echo "2. Using the Shell Script:"
echo "   SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key ./run-simplified-schema.sh"
echo ""
echo "3. Using the Node.js Script:"
echo "   cd .."
echo "   SUPABASE_URL=https://your-project-ref.supabase.co SUPABASE_KEY=your-service-role-key node run-simplified-schema.mjs"
echo ""
echo "For more information, see the README.md file in the infrastructure/database/migrations directory."