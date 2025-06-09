# Blockchain Event Listener

This module provides a blockchain event listener that automatically processes events from the blockchain, such as NFT mints and transfers. It's designed to keep the database in sync with the blockchain state.

## Features

- Listens for Transfer events from the NFT contract
- Automatically detects mint events (transfers from the zero address)
- Creates vehicle profiles in the database when a new NFT is minted
- Updates vehicle ownership when an NFT is transferred
- Processes pending events that might have been missed

## How It Works

1. The listener is initialized when the application starts in the `ScaffoldEthAppWithProviders` component.
2. It sets up a watcher for Transfer events from the NFT contract.
3. When a mint event is detected (transfer from the zero address), it:
   - Checks if the wallet has an identity in the identity registry
   - If the wallet has an identity, it creates a vehicle profile associated with that identity
   - If the wallet doesn't have an identity, it skips creating the vehicle profile
4. When a transfer event is detected, it updates the vehicle ownership in the database.

## Integration with Identity Registry

The blockchain event listener is integrated with the identity registry system:

1. Users must create a profile in the identity registry before minting a vehicle (enforced by the mint API).
2. When a mint event is detected, the listener checks if the wallet has an identity in the identity registry.
3. If the wallet has an identity, the vehicle profile is created and associated with that identity.
4. If the wallet doesn't have an identity, the vehicle profile creation is skipped.

This ensures that all vehicle profiles are associated with an identity in the identity registry.

## Fallback Mechanism

The blockchain event listener serves as a fallback mechanism for the mint-confirm API endpoint. If the mint-confirm API fails to create a vehicle profile, the blockchain event listener will create it when it detects the mint event.

## Configuration

The listener is configured to connect to the local Hardhat node by default. To use a different blockchain network, update the `NFT_CONTRACT_ADDRESS` and the `publicClient` configuration in `blockchainEventListener.ts`.