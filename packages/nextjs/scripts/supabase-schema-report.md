# Supabase Database Schema Report

Generated: 6/3/2025, 10:34:17 AM
Database URL: https://ksgwenadavjvakpdhhzi.supabase.co

## Missing Required Tables

- `blockchain_events`
- `vehicle_profiles`
- `vehicle_media`
- `identity_registry`
- `vehicle_audit_log`

## Existing Tables

## Required Schema Analysis

### blockchain_events

**Missing Table**

This table is required to store blockchain events like minting and transfers. It should have the following structure:

- `id`: UUID (Primary Key)
- `event_type`: TEXT (e.g., 'mint', 'transfer')
- `token_id`: INTEGER
- `from_address`: TEXT
- `to_address`: TEXT
- `transaction_hash`: TEXT
- `status`: TEXT (e.g., 'pending', 'completed', 'failed')
- `metadata`: JSONB (for storing additional event data)
- `created_at`: TIMESTAMPTZ
- `processed_at`: TIMESTAMPTZ
### vehicle_profiles

**Missing Table**

This table is required to store vehicle profile information. It should have the following structure:

- `id`: UUID (Primary Key)
- `token_id`: TEXT (unique)
- `owner_wallet`: TEXT
- `identity_id`: UUID (Foreign Key to identity_registry)
- `name`: TEXT
- `description`: TEXT
- `vin`: TEXT
- `make`: TEXT
- `model`: TEXT
- `year`: INTEGER
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ
### vehicle_media

**Missing Table**

This table is required to store vehicle images and other media. It should have the following structure:

- `id`: UUID (Primary Key)
- `vehicle_id`: UUID (Foreign Key to vehicle_profiles)
- `url`: TEXT
- `type`: TEXT (e.g., 'image', 'video')
- `caption`: TEXT
- `category`: TEXT
- `is_featured`: BOOLEAN
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ
### identity_registry

**Missing Table**

This table is required to store user identities. It should have the following structure:

- `id`: UUID (Primary Key)
- `wallet_address`: TEXT
- `normalized_wallet`: TEXT (unique, lowercase wallet address)
- `user_id`: UUID (optional, Foreign Key to auth.users)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ
