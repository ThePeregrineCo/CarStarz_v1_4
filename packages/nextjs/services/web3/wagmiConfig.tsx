"use client";

import { wagmiConnectors } from "./wagmiConnectors";
import { createConfig } from "wagmi";
import { fallback, http, type Chain } from "viem";
import { mainnet, hardhat } from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

export const enabledChains = targetNetworks.find((net: Chain) => net.id === mainnet.id)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// For wagmi 2.14.11, chains must be readonly [Chain, ...Chain[]]
export const chains = enabledChains as readonly [Chain, ...Chain[]];

// Use 'as any' to bypass the type error for now
export const wagmiConfig = createConfig({
  chains: chains as any,
  connectors: wagmiConnectors as any,
  transports: {
    [mainnet.id]: fallback([
      http(getAlchemyHttpUrl(mainnet.id) ?? ''),
      http()
    ]),
    [hardhat.id]: http(),
    ...Object.fromEntries(
      (chains as unknown as Chain[])
        .filter(chain => chain.id !== mainnet.id && chain.id !== hardhat.id)
        .map(chain => [
          chain.id,
          fallback([
            http(getAlchemyHttpUrl(chain.id) ?? ''),
            http()
          ])
        ])
    )
  }
});

// Legacy function for backward compatibility
export function getWagmiConfig() {
  return wagmiConfig;
}
