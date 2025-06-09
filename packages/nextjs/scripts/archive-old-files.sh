#!/bin/bash

# Script to archive old files after refactoring
# This script moves old files to the archived directory

# Create archive directories if they don't exist
mkdir -p archived/api
mkdir -p archived/lib/api
mkdir -p archived/lib/auth
mkdir -p archived/lib/utils

# Archive old API files
echo "Archiving old API files..."
mv app/api/mint-confirm/route.ts archived/api/mint-confirm-route.ts 2>/dev/null || true
mv app/api/vehicle-profiles/route.ts archived/api/vehicle-profiles-route.ts 2>/dev/null || true
mv app/api/vehicle-media/route.ts archived/api/vehicle-media-route.ts 2>/dev/null || true
mv app/api/vehicle-specifications/route.ts archived/api/vehicle-specifications-route.ts 2>/dev/null || true
mv app/api/vehicle-links/route.ts archived/api/vehicle-links-route.ts 2>/dev/null || true
mv app/api/vehicle-modifications/route.ts archived/api/vehicle-modifications-route.ts 2>/dev/null || true
mv app/api/vehicle-comments/route.ts archived/api/vehicle-comments-route.ts 2>/dev/null || true
mv app/api/vehicle-videos/route.ts archived/api/vehicle-videos-route.ts 2>/dev/null || true

# Archive old lib files
echo "Archiving old lib files..."
mv lib/api/vehicleQueries.ts archived/lib/api/vehicleQueries.ts 2>/dev/null || true
mv lib/api/vehicles.ts archived/lib/api/vehicles.ts 2>/dev/null || true
mv lib/api/vehicles.fix.ts archived/lib/api/vehicles.fix.ts 2>/dev/null || true
mv lib/api/enhancedProfileQueries.ts archived/lib/api/enhancedProfileQueries.ts 2>/dev/null || true
mv lib/api/profileQueries.ts archived/lib/api/profileQueries.ts 2>/dev/null || true
mv lib/api/unifiedProfileQueries.ts archived/lib/api/unifiedProfileQueries.ts 2>/dev/null || true
mv lib/auth/identityService.ts archived/lib/auth/identityService.ts 2>/dev/null || true
mv lib/utils/authHelpers.ts archived/lib/utils/authHelpers.ts.old 2>/dev/null || true

# Archive SQL scripts
echo "Archiving old SQL scripts..."
mkdir -p archived/sql
mv *.sql archived/sql/ 2>/dev/null || true

# Archive test scripts
echo "Archiving old test scripts..."
mkdir -p archived/tests
mv test-*.js archived/tests/ 2>/dev/null || true
mv test-*.mjs archived/tests/ 2>/dev/null || true

# Archive setup scripts
echo "Archiving old setup scripts..."
mkdir -p archived/setup
mv run-*.sh archived/setup/ 2>/dev/null || true
mv setup-*.mjs archived/setup/ 2>/dev/null || true
mv reset-*.mjs archived/setup/ 2>/dev/null || true
mv check-*.mjs archived/setup/ 2>/dev/null || true

# Archive documentation
echo "Archiving old documentation..."
mkdir -p archived/docs
mv *.md archived/docs/ 2>/dev/null || true

echo "Archiving complete!"