#!/bin/bash

# Run the database migration script
echo "Running database migration script..."
node scripts/migrate-database.js

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "Database migration completed successfully!"
else
  echo "Database migration failed. Check the logs for details."
  exit 1
fi

echo "Your database has been reset and migrated to the new schema."
echo "You can now start the application with the new database structure."