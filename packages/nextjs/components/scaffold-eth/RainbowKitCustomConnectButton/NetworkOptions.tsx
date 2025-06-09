import { useAccount, useSwitchChain } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

export const NetworkOptions = () => {
  const { targetNetwork } = useTargetNetwork();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  return (
    <div className="flex flex-col gap-2 p-4 bg-base-200 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Network</span>
        <span className="text-sm">{chain?.name || "Not Connected"}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Target Network</span>
        <span className="text-sm">{targetNetwork.name}</span>
      </div>
      {chain && chain.id !== targetNetwork.id && (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => switchChain?.({ chainId: targetNetwork.id })}
        >
          Switch to {targetNetwork.name}
        </button>
      )}
      {chain && (
        <a
          href={getBlockExplorerAddressLink(chain.id, chain.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-ghost"
        >
          View on Explorer
        </a>
      )}
    </div>
  );
};
