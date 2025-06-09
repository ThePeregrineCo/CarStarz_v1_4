#!/bin/bash

# Script to document the Supabase database schema
# This script runs the document-supabase-schema.mjs file

# Function to print colored text
print_colored() {
  local color=$1
  local text=$2
  
  case $color in
    "red") echo -e "\033[0;31m$text\033[0m" ;;
    "green") echo -e "\033[0;32m$text\033[0m" ;;
    "yellow") echo -e "\033[0;33m$text\033[0m" ;;
    "blue") echo -e "\033[0;34m$text\033[0m" ;;
    *) echo "$text" ;;
  esac
}

# Function to print a header
print_header() {
  echo ""
  print_colored "blue" "=== $1 ==="
  echo ""
}

# Function to print a success message
print_success() {
  print_colored "green" "✓ $1"
}

# Function to print an error message
print_error() {
  print_colored "red" "✗ $1"
}

# Function to print a warning message
print_warning() {
  print_colored "yellow" "! $1"
}

# Load environment variables from .env.local or .env
# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Calculate the path to the parent directory (should be packages/nextjs)
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PARENT_DIR/.env.local" ]; then
  print_header "Loading environment variables from $PARENT_DIR/.env.local"
  export $(cat "$PARENT_DIR/.env.local" | grep -v '^#' | xargs)
  print_success "Environment variables loaded successfully"
elif [ -f "$PARENT_DIR/.env" ]; then
  print_header "Loading environment variables from $PARENT_DIR/.env"
  export $(cat "$PARENT_DIR/.env" | grep -v '^#' | xargs)
  print_success "Environment variables loaded successfully"
else
  print_warning "Could not find .env.local or .env in $PARENT_DIR"
  print_warning "Checking alternative locations..."
  
  # Try one directory up (in case script is run from a different location)
  if [ -f "$PARENT_DIR/../.env.local" ]; then
    print_header "Loading environment variables from $PARENT_DIR/../.env.local"
    export $(cat "$PARENT_DIR/../.env.local" | grep -v '^#' | xargs)
    print_success "Environment variables loaded successfully"
  elif [ -f "$PARENT_DIR/../.env" ]; then
    print_header "Loading environment variables from $PARENT_DIR/../.env"
    export $(cat "$PARENT_DIR/../.env" | grep -v '^#' | xargs)
    print_success "Environment variables loaded successfully"
  else
    print_warning "No .env file found in common locations"
  fi
fi

# Check if the required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  print_error "Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  echo ""
  echo "You can set them temporarily for this script by running:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key ./scripts/document-supabase-schema.sh"
  exit 1
fi

print_header "Documenting Supabase Database Schema"
echo "This script will connect to your Supabase database and document its schema."
echo "It will generate two files:"
echo "  - supabase-schema-doc.json: A JSON file with the complete schema information"
echo "  - supabase-schema-report.md: A Markdown report comparing the schema with what's needed"
echo ""

# Run the Node.js script
print_header "Running Documentation Script"
# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Calculate the path to the Node.js script
NODE_SCRIPT_PATH="$SCRIPT_DIR/../document-supabase-schema.mjs"

# Check if the Node.js script exists
if [ ! -f "$NODE_SCRIPT_PATH" ]; then
  print_error "Could not find the Node.js script at $NODE_SCRIPT_PATH"
  print_warning "Trying alternative path..."
  NODE_SCRIPT_PATH="$SCRIPT_DIR/../../nextjs/document-supabase-schema.mjs"
  
  if [ ! -f "$NODE_SCRIPT_PATH" ]; then
    print_error "Could not find the Node.js script at $NODE_SCRIPT_PATH either"
    print_warning "Trying one more path..."
    NODE_SCRIPT_PATH="$SCRIPT_DIR/../document-supabase-schema.mjs"
    
    if [ ! -f "$NODE_SCRIPT_PATH" ]; then
      print_error "Could not find the Node.js script. Please check the path."
      exit 1
    fi
  fi
fi

print_success "Found Node.js script at $NODE_SCRIPT_PATH"
node "$NODE_SCRIPT_PATH"

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  print_success "Documentation completed successfully!"
  echo ""
  echo "You can now review the following files:"
  # Get the directory where the output files are created
  OUTPUT_DIR="$(dirname "$NODE_SCRIPT_PATH")"
  echo "  - $OUTPUT_DIR/supabase-schema-doc.json"
  echo "  - $OUTPUT_DIR/supabase-schema-report.md"
  
  # Check if the report file exists and display missing tables
  if [ -f "$OUTPUT_DIR/supabase-schema-report.md" ]; then
    print_header "Missing Tables Summary"
    
    # Extract missing tables section from the report
    missing_tables=$(grep -A 20 "## Missing Required Tables" "$OUTPUT_DIR/supabase-schema-report.md" | grep -E "^- \`.*\`$" | sed 's/- `//' | sed 's/`//')
    
    if [ -n "$missing_tables" ]; then
      print_warning "The following required tables are missing:"
      echo "$missing_tables" | while read table; do
        echo "  - $table"
      done
      echo ""
      echo "To create these tables, you should run one of the migration scripts:"
      echo "  - ./scripts/run-clean-migration.sh (resets and recreates all tables)"
      echo "  - ./scripts/run-consolidated-migration.sh (preserves existing data)"
    else
      print_success "All required tables exist!"
    fi
  fi
else
  print_error "Documentation failed. See error messages above."
  exit 1
fi