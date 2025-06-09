#!/bin/bash

# Script to consolidate SQL migrations
# This script combines all SQL files into a single migration file

# Create migrations directory if it doesn't exist
mkdir -p infrastructure/database/migrations

# Create the consolidated migration file
MIGRATION_FILE="infrastructure/database/migrations/01-consolidated-schema.sql"

# Start with a header
echo "-- Consolidated Migration File" > $MIGRATION_FILE
echo "-- Generated on $(date)" >> $MIGRATION_FILE
echo "-- This file contains all database schema migrations" >> $MIGRATION_FILE
echo "" >> $MIGRATION_FILE

# Add the reset-schema-carstarz.sql file first (if it exists)
if [ -f "reset-schema-carstarz.sql" ]; then
  echo "-- Including reset-schema-carstarz.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  cat "reset-schema-carstarz.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
fi

# Add the identity-registry-schema.sql file next (if it exists)
if [ -f "identity-registry-schema.sql" ]; then
  echo "-- Including identity-registry-schema.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  cat "identity-registry-schema.sql" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
  echo "" >> $MIGRATION_FILE
fi

# Add any other SQL files
for sql_file in *.sql; do
  if [ "$sql_file" != "reset-schema-carstarz.sql" ] && [ "$sql_file" != "identity-registry-schema.sql" ]; then
    echo "-- Including $(basename $sql_file)" >> $MIGRATION_FILE
    echo "" >> $MIGRATION_FILE
    cat "$sql_file" >> $MIGRATION_FILE
    echo "" >> $MIGRATION_FILE
    echo "" >> $MIGRATION_FILE
  fi
done

echo "Migration file created at $MIGRATION_FILE"