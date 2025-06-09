"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider, useTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { useGlobalState } from "~~/services/store/store";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-eth/useNativeCurrencyPrice";
import { useDarkMode } from "~~/hooks/scaffold-eth/useDarkMode";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { Header } from "~~/components/Header";
import { Footer } from "~~/components/Footer";
import { BrowserProviders } from "~~/components/BrowserProviders";
// import { initializeBlockchainEventListener } from "~~/lib/listeners";

// Create query client outside of component to avoid recreation on each render
const queryClient = new QueryClient();

// Separate component to handle wagmi hooks
function NativeCurrencyPriceUpdater() {
  const setNativeCurrencyPrice = useGlobalState(state => state.setNativeCurrencyPrice);
  const setIsNativeCurrencyFetching = useGlobalState(state => state.setIsNativeCurrencyFetching);
  
  useNativeCurrencyPrice(setNativeCurrencyPrice, setIsNativeCurrencyFetching);
  return null;
}

// Create a separate component for browser-only rendering
function BrowserOnlyContent({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  useDarkMode();
  
  useEffect(() => {
    setMounted(true);
    
    // Blockchain event listener initialization is disabled
    // This was causing issues with the mint confirmation process
    // We're now using a direct server-side approach for profile creation
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('Blockchain event listener is disabled');
      // Uncomment to re-enable:
      // try {
      //   initializeBlockchainEventListener();
      // } catch (error) {
      //   console.error('Error initializing blockchain event listener:', error);
      // }
    }
  }, []);
  
  // Show a simple loading state until the component is mounted on the client
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-center flex-grow">
          <div className="animate-pulse text-lg">Loading app...</div>
        </div>
      </div>
    );
  }
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={resolvedTheme === "dark" ? darkTheme() : lightTheme()}
          modalSize="compact"
          initialChain={31337} // Hardhat chain ID
        >
          <ThemeProvider enableSystem={true} attribute="data-theme">
            <NativeCurrencyPriceUpdater />
            <BrowserProviders>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="relative flex flex-col flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
            </BrowserProviders>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function ScaffoldEthAppWithProviders({ children }: { children: ReactNode }) {
  // Critical check: Don't even try to render on the server
  if (typeof window === "undefined") {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-center flex-grow">
          <div className="text-lg">Loading app...</div>
        </div>
      </div>
    );
  }

  // Only render the browser-specific content on the client
  return <BrowserOnlyContent>{children}</BrowserOnlyContent>;
}
