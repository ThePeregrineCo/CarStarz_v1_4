import { useEffect } from "react";
import { usePublicClient } from "wagmi";
import { mainnet } from "viem/chains";

export const useNativeCurrencyPrice = (
  setNativeCurrencyPrice: (price: number) => void,
  setIsNativeCurrencyFetching: (isFetching: boolean) => void,
) => {
  const publicClient = usePublicClient({ chainId: mainnet.id });

  useEffect(() => {
    const fetchPrice = async () => {
      if (!publicClient) return;
      
      try {
        setIsNativeCurrencyFetching(true);
        const price = await publicClient.getGasPrice();
        setNativeCurrencyPrice(Number(price));
      } catch (error) {
        console.error("Error fetching native currency price:", error);
      } finally {
        setIsNativeCurrencyFetching(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [publicClient, setNativeCurrencyPrice, setIsNativeCurrencyFetching]);
}; 