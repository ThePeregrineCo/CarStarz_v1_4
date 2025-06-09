#!/bin/bash

# Script to clean up old hook files after refactoring

echo "Cleaning up old hook files and API query modules..."

# List of files to delete
FILES_TO_DELETE=(
  "lib/hooks/useVehicleOwnership.v2.ts"
  "lib/hooks/useVehicleOwnership.unified.ts"
  "lib/hooks/useVehicleDataV3.ts"
  "lib/api/vehicleQueriesV2.ts"
  "lib/api/vehicleQueries.unified.ts"
  "lib/api/vehicleQueriesV3Fixed.ts"
  "lib/api/vehicleQueriesV3.ts"
)

# Create backup directory
BACKUP_DIR="./hook-backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Backup and delete files
for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "Backing up $file to $BACKUP_DIR"
    cp "$file" "$BACKUP_DIR/"
    echo "Deleting $file"
    rm "$file"
  else
    echo "File $file not found, skipping"
  fi
done

echo "Cleanup complete. Old files have been backed up to $BACKUP_DIR"
echo "If you need to restore any files, you can find them in the backup directory."