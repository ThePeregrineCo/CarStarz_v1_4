#!/bin/bash

# This script runs the RLS bypass policy migration

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Supabase variables - set these explicitly
SUPABASE_URL="https://ksgwenadavjvakpdhhzi.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZ3dlbmFkYXZqdmFrcGRoaHppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMxNjM3MywiZXhwIjoyMDYyODkyMzczfQ.tuGOj9xcJGm7yQg4erxJ761libuqUI5Q-1aXF8M30Q4"

# Run the migration using the Supabase REST API
echo "Running RLS bypass policy migration..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "sql": "$(cat ../../infrastructure/database/migrations/rls-bypass-policy.sql)"
}
EOF

echo -e "\nRLS bypass policy migration completed"