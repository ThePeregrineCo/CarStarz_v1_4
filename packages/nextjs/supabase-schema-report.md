# Supabase Database Schema Report

Generated: 6/3/2025, 10:57:17 AM
Database URL: https://ksgwenadavjvakpdhhzi.supabase.co

## Existing Tables

### blockchain_events (Required)

Row count: 0

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | uuid | NO | uuid_generate_v4() |
| event_type | text | NO |  |
| token_id | integer | NO |  |
| from_address | text | YES |  |
| to_address | text | YES |  |
| transaction_hash | text | NO |  |
| status | text | NO |  |
| metadata | jsonb | YES |  |

#### Foreign Keys

No foreign keys found.

#### Indexes

No indexes found.

### identity_registry (Required)

Row count: 0

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | uuid | NO | uuid_generate_v4() |
| wallet_address | text | NO |  |
| normalized_wallet | text | NO |  |

#### Foreign Keys

No foreign keys found.

#### Indexes

No indexes found.

### vehicle_audit_log (Required)

Row count: 0

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | uuid | NO | uuid_generate_v4() |
| vehicle_id | uuid | NO |  |
| action | text | NO |  |
| details | jsonb | YES |  |

#### Foreign Keys

No foreign keys found.

#### Indexes

No indexes found.

### vehicle_media (Required)

Row count: 0

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | uuid | NO | uuid_generate_v4() |
| vehicle_id | uuid | NO |  |
| url | text | NO |  |
| type | text | NO |  |
| is_featured | boolean | YES | false |

#### Foreign Keys

No foreign keys found.

#### Indexes

No indexes found.

### vehicle_profiles (Required)

Row count: 0

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | uuid | NO | uuid_generate_v4() |
| token_id | integer | NO |  |
| owner_wallet | text | NO |  |
| identity_id | uuid | YES |  |
| name | text | YES |  |
| vin | text | NO |  |
| make | text | NO |  |
| model | text | NO |  |
| year | integer | NO |  |

#### Foreign Keys

No foreign keys found.

#### Indexes

No indexes found.

## Required Schema Analysis

### blockchain_events

✅ Table structure looks good.

### vehicle_profiles

✅ Table structure looks good.

### vehicle_media

✅ Table structure looks good.

### identity_registry

✅ Table structure looks good.

