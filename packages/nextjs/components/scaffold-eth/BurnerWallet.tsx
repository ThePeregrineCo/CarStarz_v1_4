import { useAccount, useBalance, useDisconnect } from "wagmi";

export const BurnerWallet = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
  });

  if (!address) return null;

  return (
    <div className="flex flex-col gap-2 p-4 bg-base-200 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Burner Wallet</span>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Balance:</span>
        <span className="text-sm font-medium">
          {balance?.formatted} {balance?.symbol}
        </span>
      </div>
    </div>
  );
};