# CarStarz API Layer Documentation

This document provides an overview of the API layer architecture for the CarStarz application, which follows the repository pattern and service layer approach.

## Architecture Overview

The API layer is structured using the following components:

1. **Models**: Define the data structures used throughout the application
2. **Repositories**: Handle data access and persistence
3. **Services**: Implement business logic and orchestrate operations
4. **API Routes**: Handle HTTP requests and responses

This architecture provides several benefits:
- Separation of concerns
- Improved testability
- Code reusability
- Maintainable and scalable codebase

## Directory Structure

```
lib/
├── models/              # Data models and interfaces
│   ├── VehicleProfile.ts
│   ├── IdentityProfile.ts
│   └── index.ts
│
├── repositories/        # Data access layer
│   ├── BaseRepository.ts
│   ├── SupabaseRepository.ts
│   ├── VehicleProfileRepository.ts
│   ├── IdentityProfileRepository.ts
│   └── index.ts
│
├── services/            # Business logic layer
│   ├── VehicleService.ts
│   ├── IdentityService.ts
│   ├── BlockchainEventService.ts
│   └── index.ts
│
└── utils/               # Utility functions
    └── authHelpers.ts

app/api/                 # API routes
├── vehicle-profiles/
│   └── route.ts
├── user-profiles/
│   └── route.ts
└── blockchain-events/
    └── route.ts
```

## Models

The models define the data structures used throughout the application:

- **VehicleProfile**: Represents a vehicle profile with its properties
- **IdentityProfile**: Represents a user identity with its properties

## Repositories

Repositories handle data access and persistence:

- **BaseRepository**: Defines the common interface for all repositories
- **SupabaseRepository**: Implements the base repository using Supabase
- **VehicleProfileRepository**: Handles vehicle profile data operations
- **IdentityProfileRepository**: Handles identity profile data operations

## Services

Services implement business logic and orchestrate operations:

- **VehicleService**: Handles vehicle-related business logic
- **IdentityService**: Handles identity-related business logic
- **BlockchainEventService**: Handles blockchain event processing

## API Routes

API routes handle HTTP requests and responses:

- **/api/vehicle-profiles**: Handles vehicle profile operations
- **/api/user-profiles**: Handles user profile operations
- **/api/blockchain-events**: Handles blockchain event processing

## Identity-Vehicle Integration

The integration between identity profiles and vehicle profiles is implemented through:

1. The `identity_id` field in the `vehicle_profiles` table
2. Database triggers that maintain data consistency during ownership transfers
3. Services that handle the relationship between identities and vehicles

## Blockchain Event Handling

Blockchain events (such as NFT transfers) are processed through:

1. The `blockchain_events` table that stores event data
2. The `BlockchainEventService` that processes these events
3. The `/api/blockchain-events` endpoint that receives events from external sources

## Usage Examples

### Fetching a Vehicle Profile

```typescript
// API route
const profile = await vehicleService.getVehicleByTokenId(tokenId);

// Component
const { data } = await fetch(`/api/vehicle-profiles?tokenId=${tokenId}`);
```

### Creating a User Profile

```typescript
// API route
const newUser = await identityService.createIdentity(profileData, walletAddress);

// Component
const response = await fetch('/api/user-profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profileData)
});
```

### Processing a Blockchain Event

```typescript
// API route
const event = await blockchainEventService.processTransferEvent(
  tokenId,
  fromAddress,
  toAddress,
  transactionHash
);

// External service
await fetch('/api/blockchain-events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'transfer',
    token_id: tokenId,
    from_address: fromAddress,
    to_address: toAddress,
    transaction_hash: transactionHash
  })
});
```

## Error Handling

The API layer implements consistent error handling:

1. Services throw specific errors with descriptive messages
2. API routes catch these errors and return appropriate HTTP status codes
3. Error details are included in the response for debugging

## Future Improvements

Potential improvements to the API layer:

1. Implement caching for frequently accessed data
2. Add request validation middleware
3. Implement rate limiting for API endpoints
4. Add comprehensive logging and monitoring
5. Implement API versioning