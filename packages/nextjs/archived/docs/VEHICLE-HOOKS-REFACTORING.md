# Vehicle Hooks Refactoring

This document outlines the refactoring of the vehicle-related hooks in the project to address the issue of multiple versions of hooks for vehicle ownership checks.

## Problem

The project had multiple versions of similar hooks, which was causing confusion and potential maintenance issues:

1. **Multiple Hook Versions**:
   - `useVehicleOwnership.ts` - Main version using vehicleQueriesV3Fixed
   - `useVehicleOwnership.v2.ts` - Older version using useVehicleData
   - `useVehicleOwnership.unified.ts` - Another version that's similar to the main one

2. **Multiple Data Fetching Hooks**:
   - `useVehicleData.ts` - Uses vehicleQueriesV2
   - `useVehicleDataV3.ts` - Uses vehicleQueries.unified

3. **Multiple API Query Modules**:
   - `vehicleQueriesV2.ts`
   - `vehicleQueries.unified.ts`
   - `vehicleQueriesV3Fixed.ts`

4. **Inconsistent Imports**:
   - Some components import from useVehicleOwnership.unified.ts
   - Others import directly from useVehicleOwnership.ts

## Solution

We've refactored the codebase to consolidate these hooks and provide a cleaner, more maintainable structure:

1. **Consolidated API Query Module**:
   - Created a single `vehicleQueries.ts` module that combines the best features from all previous versions
   - Removed the version-specific modules

2. **Consolidated Data Fetching Hook**:
   - Updated `useVehicleData.ts` to use the new unified vehicleQueries module
   - Added additional utility hooks for specific data fetching needs

3. **Consolidated Ownership Hook**:
   - Updated `useVehicleOwnership.ts` to be the single source of truth for vehicle ownership checks
   - Maintained backward compatibility by preserving the `vehicleProfile` property name

4. **Updated Component Imports**:
   - Updated all components to use the new, unified hooks

## Usage Guidelines

### Vehicle Data Fetching

Use the `useVehicleData` hook to fetch vehicle data:

```tsx
import { useVehicleData } from '../lib/hooks/useVehicleData';

function MyComponent({ tokenId }) {
  const { 
    data: vehicle, 
    isLoading, 
    error,
    refetch
  } = useVehicleData(tokenId);
  
  // Use vehicle data...
}
```

### Vehicle Ownership Checks

Use the `useVehicleOwnership` hook to check if the current user owns a vehicle:

```tsx
import { useVehicleOwnership } from '../lib/hooks/useVehicleOwnership';

function MyComponent({ tokenId }) {
  const { 
    isOwner,
    vehicle, // The vehicle data
    isLoading,
    error
  } = useVehicleOwnership(tokenId);
  
  // Use ownership status and vehicle data...
}
```

### Vehicle Mutations

Use the hooks in `useVehicleMutations.ts` to update vehicle data:

```tsx
import { useUpdateVehicle } from '../lib/hooks/useVehicleMutations';

function MyComponent({ tokenId }) {
  const updateMutation = useUpdateVehicle(tokenId);
  
  const handleUpdate = (data) => {
    updateMutation.mutate(data);
  };
  
  // Use mutation...
}
```

## Future Considerations

1. **Type Safety**: The refactoring maintains type safety throughout the application, ensuring that components receive the expected data types.

2. **Performance**: The hooks use React Query's caching and stale-time features to minimize unnecessary network requests.

3. **Extensibility**: The modular design makes it easy to add new features or modify existing ones without affecting the entire system.

4. **Backward Compatibility**: The refactoring maintains backward compatibility to ensure existing components continue to work without changes.

## Conclusion

This refactoring simplifies the codebase by consolidating multiple versions of similar hooks into a single, unified set of hooks. This makes the code more maintainable, easier to understand, and less prone to bugs.