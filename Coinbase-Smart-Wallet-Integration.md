# Phase 2: Coinbase Smart Wallet Integration

## Overview

For Phase 2 of the CarStarz authentication system, we recommend integrating Coinbase Smart Wallet to enhance user experience while maintaining our progressive decentralization roadmap. This document outlines the benefits, implementation approach, and technical details for this integration.

## Why Coinbase Smart Wallet?

Coinbase Smart Wallet is an account abstraction wallet built on ERC-4337 that offers several advantages for CarStarz:

1. **Improved User Experience**
   - Simplified onboarding for non-crypto users
   - No seed phrases to manage (uses passkeys instead)
   - Familiar authentication methods (biometrics, social login)
   - Gasless transactions through paymasters

2. **Account Abstraction Benefits**
   - Batch transactions for complex operations
   - Sponsored transactions (gas can be paid by CarStarz)
   - Session keys for temporary permissions
   - Programmable security rules

3. **Enhanced Security**
   - Passkey authentication (FIDO2 standard)
   - Social recovery options
   - No single point of failure
   - Threshold signatures for multi-factor security

4. **Multi-Chain Support**
   - Works across multiple EVM chains
   - Unified user experience across chains
   - Future-proof for cross-chain operations

5. **Alignment with Progressive Decentralization**
   - Maintains web3 native authentication
   - Prepares for full on-chain operations
   - Compatible with The Graph and IPFS
   - Supports gradual migration from centralized components

## Technical Implementation

### 1. Integration with Wagmi and RainbowKit

Coinbase Smart Wallet can be integrated with our existing Wagmi setup:

```typescript
// packages/nextjs/services/web3/wagmiConnectors.tsx
import { coinbaseWalletConnector } from '@coinbase/wallet-sdk';
import { coinbaseSmartWallet } from '@coinbase/smart-wallet-sdk';

// Update wagmi connectors to include Coinbase Smart Wallet
export const wagmiConnectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        coinbaseSmartWallet({ chains, projectId: scaffoldConfig.walletConnectProjectId }),
        metaMaskWallet({ chains, projectId: scaffoldConfig.walletConnectProjectId }),
      ],
    },
    {
      groupName: "Other Wallets",
      wallets: [
        walletConnectWallet({ chains, projectId: scaffoldConfig.walletConnectProjectId }),
        ledgerWallet({ chains, projectId: scaffoldConfig.walletConnectProjectId }),
        coinbaseWallet({ chains, appName: "CarStarz" }),
        rainbowWallet({ chains, projectId: scaffoldConfig.walletConnectProjectId }),
        safeWallet({ chains }),
        ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
          ? [rainbowkitBurnerWallet({ chains })]
          : []),
      ],
    },
  ],
  {
    appName: "CarStarz",
    projectId: scaffoldConfig.walletConnectProjectId,
  },
);
```

### 2. Smart Wallet Authentication Flow

The authentication flow with Coinbase Smart Wallet involves:

```typescript
// packages/nextjs/lib/auth/smartWalletAuth.ts
import { SmartWalletClient } from '@coinbase/smart-wallet-sdk';
import { SiweMessage } from 'siwe';

export async function authenticateWithSmartWallet(client: SmartWalletClient) {
  try {
    // Get the smart wallet address
    const address = await client.getAddress();
    
    // Create a SIWE message
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in to CarStarz with your Coinbase Smart Wallet',
      uri: window.location.origin,
      version: '1',
      chainId: 1, // Ethereum mainnet
      nonce: generateNonce(),
    });
    
    const messageToSign = message.prepareMessage();
    
    // Sign the message with the smart wallet
    const signature = await client.signMessage(messageToSign);
    
    // Verify on server
    const { data, error } = await supabaseClient.functions.invoke('verify-siwe', {
      body: { 
        message: messageToSign,
        signature,
        walletType: 'smart-wallet'
      }
    });
    
    if (error || !data.valid) {
      throw new Error('Invalid signature');
    }
    
    // Create session with custom claims
    return supabaseClient.auth.signInWithCustomToken({
      token: data.token
    });
  } catch (error) {
    console.error('Error authenticating with smart wallet:', error);
    throw error;
  }
}
```

### 3. Enhanced AuthContext with Smart Wallet Support

Update the AuthContext to support Coinbase Smart Wallet:

```typescript
// packages/nextjs/lib/auth/AuthContext.tsx
import { SmartWalletClient } from '@coinbase/smart-wallet-sdk';

type WalletType = 'standard' | 'smart-wallet';

type AuthContextType = {
  user: User | null;
  userType: UserType | null;
  subscriptionTier: SubscriptionTier | null;
  loading: boolean;
  walletAddress: string | null;
  walletType: WalletType | null;
  isWalletConnected: boolean;
  ownedVehicles: number[]; // NFT token IDs
  signIn: (walletAddress: string, walletType?: WalletType) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserType: (userType: UserType) => Promise<void>;
  updateSubscriptionTier: (tier: SubscriptionTier) => Promise<void>;
  verifyVehicleOwnership: (tokenId: number) => Promise<boolean>;
  getSmartWalletClient: () => SmartWalletClient | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [loading, setLoading] = useState(true);
  const [smartWalletClient, setSmartWalletClient] = useState<SmartWalletClient | null>(null);
  
  // ... existing code ...
  
  // Sign in with wallet
  const signIn = async (walletAddress: string, type: WalletType = 'standard') => {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Set wallet type
      setWalletType(type);
      
      // Authentication logic based on wallet type
      if (type === 'smart-wallet') {
        // Initialize smart wallet client
        const client = new SmartWalletClient({
          address: normalizedAddress,
          // Additional configuration
        });
        
        setSmartWalletClient(client);
        
        // Authenticate with smart wallet
        await authenticateWithSmartWallet(client);
      } else {
        // Standard wallet authentication
        // ... existing authentication code ...
      }
      
      // ... rest of sign in logic ...
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };
  
  // ... rest of AuthProvider ...
  
  const getSmartWalletClient = () => smartWalletClient;
  
  const value = {
    user,
    userType,
    subscriptionTier,
    loading,
    walletAddress: user?.id?.toLowerCase() || null,
    walletType,
    isWalletConnected: !!user,
    ownedVehicles: [], // Populate from contract
    signIn,
    signOut,
    updateUserType,
    updateSubscriptionTier,
    verifyVehicleOwnership,
    getSmartWalletClient,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

### 4. Gasless Transactions with Paymasters

One of the key benefits of Coinbase Smart Wallet is the ability to sponsor transactions for users:

```typescript
// packages/nextjs/hooks/scaffold-eth/useSmartWalletTransaction.ts
import { useAuth } from '~/lib/auth/AuthContext';

export function useSmartWalletTransaction() {
  const { getSmartWalletClient, walletType } = useAuth();
  
  const sendTransaction = async (
    to: string,
    value: bigint,
    data: string,
    options?: {
      sponsorGas?: boolean;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }
  ) => {
    if (walletType !== 'smart-wallet') {
      throw new Error('Smart wallet not connected');
    }
    
    const client = getSmartWalletClient();
    if (!client) {
      throw new Error('Smart wallet client not available');
    }
    
    try {
      // Create transaction
      const tx = {
        to,
        value,
        data,
        maxFeePerGas: options?.maxFeePerGas,
        maxPriorityFeePerGas: options?.maxPriorityFeePerGas,
      };
      
      // If sponsoring gas, use paymaster
      if (options?.sponsorGas) {
        // Add CarStarz paymaster URL
        const paymaster = 'https://api.carstarz.com/paymaster';
        
        // Send transaction with paymaster
        return await client.sendTransaction(tx, { paymaster });
      }
      
      // Regular transaction
      return await client.sendTransaction(tx);
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };
  
  return { sendTransaction };
}
```

### 5. Passkey Authentication

Implement passkey authentication for enhanced security:

```typescript
// packages/nextjs/components/PasskeyAuth.tsx
import { useAuth } from '~/lib/auth/AuthContext';
import { SmartWalletClient } from '@coinbase/smart-wallet-sdk';

export function PasskeyAuth() {
  const { signIn } = useAuth();
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCreatePasskey = async () => {
    try {
      setIsCreatingPasskey(true);
      setError(null);
      
      // Create a new smart wallet with passkey
      const client = await SmartWalletClient.create({
        name: 'CarStarz Wallet',
        passkey: true,
      });
      
      // Get the wallet address
      const address = await client.getAddress();
      
      // Sign in with the new wallet
      await signIn(address, 'smart-wallet');
      
      // Success!
    } catch (error) {
      console.error('Error creating passkey:', error);
      setError('Failed to create passkey. Please try again.');
    } finally {
      setIsCreatingPasskey(false);
    }
  };
  
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Create a Secure Wallet</h2>
        <p>Create a wallet secured by your device's biometrics - no seed phrase needed!</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div className="card-actions justify-end mt-4">
          <button 
            className="btn btn-primary"
            onClick={handleCreatePasskey}
            disabled={isCreatingPasskey}
          >
            {isCreatingPasskey ? 'Creating...' : 'Create Secure Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6. Social Recovery Setup

Implement social recovery for enhanced security:

```typescript
// packages/nextjs/components/SocialRecovery.tsx
import { useAuth } from '~/lib/auth/AuthContext';

export function SocialRecovery() {
  const { getSmartWalletClient, walletType } = useAuth();
  const [guardians, setGuardians] = useState<string[]>([]);
  const [newGuardian, setNewGuardian] = useState('');
  const [threshold, setThreshold] = useState(2);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAddGuardian = () => {
    if (newGuardian && !guardians.includes(newGuardian)) {
      setGuardians([...guardians, newGuardian]);
      setNewGuardian('');
    }
  };
  
  const handleRemoveGuardian = (guardian: string) => {
    setGuardians(guardians.filter(g => g !== guardian));
  };
  
  const handleSetupRecovery = async () => {
    if (walletType !== 'smart-wallet') {
      setError('Smart wallet not connected');
      return;
    }
    
    if (guardians.length < threshold) {
      setError(`You need at least ${threshold} guardians`);
      return;
    }
    
    const client = getSmartWalletClient();
    if (!client) {
      setError('Smart wallet client not available');
      return;
    }
    
    try {
      setIsSettingUp(true);
      setError(null);
      
      // Setup social recovery
      await client.setupSocialRecovery({
        guardians,
        threshold,
      });
      
      // Success!
    } catch (error) {
      console.error('Error setting up social recovery:', error);
      setError('Failed to setup social recovery. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };
  
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Setup Account Recovery</h2>
        <p>Add trusted friends or family members who can help you recover your account if you lose access.</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Guardian Address</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={newGuardian}
              onChange={(e) => setNewGuardian(e.target.value)}
            />
            <button 
              className="btn btn-square btn-outline"
              onClick={handleAddGuardian}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Recovery Threshold</span>
          </label>
          <input
            type="number"
            min="1"
            max={guardians.length}
            className="input input-bordered w-full"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
          />
          <label className="label">
            <span className="label-text-alt">Number of guardians needed to recover your account</span>
          </label>
        </div>
        
        {guardians.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold">Guardians</h3>
            <ul className="mt-2">
              {guardians.map((guardian) => (
                <li key={guardian} className="flex justify-between items-center py-2">
                  <span className="text-sm">{guardian}</span>
                  <button 
                    className="btn btn-xs btn-error"
                    onClick={() => handleRemoveGuardian(guardian)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="card-actions justify-end mt-4">
          <button 
            className="btn btn-primary"
            onClick={handleSetupRecovery}
            disabled={isSettingUp || guardians.length < threshold}
          >
            {isSettingUp ? 'Setting Up...' : 'Setup Recovery'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 7. Session Keys for Temporary Permissions

Implement session keys for temporary permissions:

```typescript
// packages/nextjs/hooks/scaffold-eth/useSessionKey.ts
import { useAuth } from '~/lib/auth/AuthContext';

export function useSessionKey() {
  const { getSmartWalletClient, walletType } = useAuth();
  
  const createSessionKey = async (
    permissions: {
      target: string;
      functionSelector: string;
      valueLimit?: bigint;
    }[],
    expirySeconds: number = 3600 // 1 hour default
  ) => {
    if (walletType !== 'smart-wallet') {
      throw new Error('Smart wallet not connected');
    }
    
    const client = getSmartWalletClient();
    if (!client) {
      throw new Error('Smart wallet client not available');
    }
    
    try {
      // Generate a new session key
      const sessionKey = await client.createSessionKey({
        permissions,
        expirySeconds,
      });
      
      return sessionKey;
    } catch (error) {
      console.error('Error creating session key:', error);
      throw error;
    }
  };
  
  return { createSessionKey };
}
```

## Integration with The Graph and IPFS

Coinbase Smart Wallet integration complements our planned migration to The Graph and IPFS:

### The Graph Integration

```typescript
// packages/nextjs/hooks/scaffold-eth/useSmartWalletWithGraph.ts
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '~/lib/auth/AuthContext';

const GET_USER_VEHICLES = gql`
  query GetUserVehicles($owner: String!) {
    vehicles(where: { owner: $owner }) {
      id
      tokenId
      make
      model
      year
    }
  }
`;

export function useUserVehicles() {
  const { walletAddress } = useAuth();
  
  const { data, loading, error } = useQuery(GET_USER_VEHICLES, {
    variables: { owner: walletAddress?.toLowerCase() || '' },
    skip: !walletAddress,
  });
  
  return {
    vehicles: data?.vehicles || [],
    loading,
    error
  };
}
```

### IPFS Integration

```typescript
// packages/nextjs/hooks/scaffold-eth/useSmartWalletWithIPFS.ts
import { create } from 'ipfs-http-client';
import { useAuth } from '~/lib/auth/AuthContext';

export function useIPFSUpload() {
  const { walletType, getSmartWalletClient } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadToIPFS = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Connect to IPFS
      const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });
      
      // Upload file
      const result = await ipfs.add(file);
      
      // If using smart wallet, sign the upload
      if (walletType === 'smart-wallet') {
        const client = getSmartWalletClient();
        if (client) {
          // Sign the IPFS hash to verify ownership
          const signature = await client.signMessage(result.path);
          
          // Store the signature in our database
          await supabaseClient
            .from('ipfs_signatures')
            .insert({
              ipfs_hash: result.path,
              wallet_address: await client.getAddress(),
              signature,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            });
        }
      }
      
      return `ipfs://${result.path}`;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  return { uploadToIPFS, isUploading };
}
```

## User Experience Improvements

### 1. Simplified Onboarding

```typescript
// packages/nextjs/components/OnboardingFlow.tsx
import { useState } from 'react';
import { PasskeyAuth } from './PasskeyAuth';
import { UserTypeSelector } from './UserTypeSelector';
import { SocialRecovery } from './SocialRecovery';

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  
  return (
    <div className="max-w-md mx-auto">
      <div className="steps steps-vertical lg:steps-horizontal w-full mb-8">
        <div className={`step ${step >= 1 ? 'step-primary' : ''}`}>Create Wallet</div>
        <div className={`step ${step >= 2 ? 'step-primary' : ''}`}>Account Type</div>
        <div className={`step ${step >= 3 ? 'step-primary' : ''}`}>Security</div>
      </div>
      
      {step === 1 && (
        <div>
          <PasskeyAuth onComplete={() => setStep(2)} />
        </div>
      )}
      
      {step === 2 && (
        <div>
          <UserTypeSelector onComplete={() => setStep(3)} />
        </div>
      )}
      
      {step === 3 && (
        <div>
          <SocialRecovery onComplete={() => setStep(4)} />
        </div>
      )}
    </div>
  );
}
```

### 2. Gasless Experience for New Users

```typescript
// packages/nextjs/components/GaslessTransactionButton.tsx
import { useSmartWalletTransaction } from '~/hooks/scaffold-eth/useSmartWalletTransaction';

export function GaslessTransactionButton({ 
  contractAddress, 
  functionName, 
  args, 
  abi,
  children
}: {
  contractAddress: string;
  functionName: string;
  args: any[];
  abi: any[];
  children: React.ReactNode;
}) {
  const { sendTransaction } = useSmartWalletTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Encode function call
      const iface = new ethers.utils.Interface(abi);
      const data = iface.encodeFunctionData(functionName, args);
      
      // Send transaction with gas sponsorship
      const tx = await sendTransaction(
        contractAddress,
        BigInt(0), // No ETH value
        data,
        { sponsorGas: true }
      );
      
      // Wait for transaction
      await tx.wait();
      
      // Success!
    } catch (error) {
      console.error('Transaction error:', error);
      setError('Transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : children}
      </button>
      
      {error && <div className="text-error text-sm mt-2">{error}</div>}
    </>
  );
}
```

## Implementation Roadmap

### Phase 2a: Initial Integration (Weeks 1-4)

1. **Week 1: Setup and Configuration**
   - Add Coinbase Smart Wallet SDK dependencies
   - Configure wagmi connectors
   - Update authentication context

2. **Week 2: Core Authentication Flow**
   - Implement smart wallet authentication
   - Add passkey support
   - Update middleware

3. **Week 3: Enhanced Features**
   - Implement gasless transactions
   - Add social recovery
   - Create session keys

4. **Week 4: Testing and Refinement**
   - Test on multiple devices
   - Optimize user experience
   - Fix any integration issues

### Phase 2b: Advanced Features (Weeks 5-8)

5. **Week 5: The Graph Integration**
   - Create subgraph for vehicle data
   - Implement GraphQL queries
   - Optimize data fetching

6. **Week 6: IPFS Integration**
   - Implement IPFS uploads
   - Add content addressing
   - Create migration path for existing media

7. **Week 7: User Experience Improvements**
   - Enhance onboarding flow
   - Add progressive disclosure of features
   - Implement gasless experience for new users

8. **Week 8: Final Testing and Launch**
   - Comprehensive testing
   - Performance optimization
   - Launch Phase 2 features

## Conclusion

Integrating Coinbase Smart Wallet in Phase 2 of our authentication system provides significant benefits for CarStarz:

1. **Improved User Experience**: Simplified onboarding, no seed phrases, and gasless transactions make the platform more accessible to mainstream users.

2. **Enhanced Security**: Passkeys and social recovery provide robust security without the complexity of traditional wallets.

3. **Future-Proof Architecture**: Account abstraction and compatibility with The Graph and IPFS ensure we're prepared for full decentralization in Phase 3.

4. **Competitive Advantage**: Being an early adopter of smart wallet technology positions CarStarz as an innovative platform in the automotive NFT space.

By implementing this integration, we maintain our commitment to web3 principles while providing a user experience that can compete with traditional web2 applications.