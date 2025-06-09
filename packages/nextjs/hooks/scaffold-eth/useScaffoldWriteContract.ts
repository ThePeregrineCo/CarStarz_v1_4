import { useEffect, useState } from "react";
import { Abi, ExtractAbiFunctionNames } from "abitype";
import { useAccount, useWriteContract } from "wagmi";
import { WriteContractReturnType } from "wagmi/actions";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo, useTransactor } from "~~/hooks/scaffold-eth";
import { AllowedChainIds, notification } from "~~/utils/scaffold-eth";
import {
  ContractAbi,
  ContractName,
  ScaffoldWriteContractOptions,
  ScaffoldWriteContractVariables,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-eth/contract";

import type {
  WriteContractParameters as WagmiWriteContractVariables,
} from "wagmi/actions";

type ScaffoldWriteContractReturnType<TContractName extends ContractName> = Omit<
  ReturnType<typeof useWriteContract>,
  "writeContract" | "writeContractAsync"
> & {
  isMining: boolean;
  writeContract: <TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, "nonpayable" | "payable">>(
    variables: ScaffoldWriteContractVariables<TContractName, TFunctionName>,
    options?: ScaffoldWriteContractOptions,
  ) => Promise<WriteContractReturnType | undefined>;
};

export function useScaffoldWriteContract<TContractName extends ContractName>(
  config: UseScaffoldWriteConfig<TContractName>,
): ScaffoldWriteContractReturnType<TContractName>;
/**
 * @deprecated Use object parameter version instead: useScaffoldWriteContract({ contractName: "YourContract" })
 */
export function useScaffoldWriteContract<TContractName extends ContractName>(
  contractName: TContractName,
  writeContractParams?: WagmiWriteContractVariables,
): ScaffoldWriteContractReturnType<TContractName>;

export function useScaffoldWriteContract<TContractName extends ContractName>(
  configOrName: UseScaffoldWriteConfig<TContractName> | TContractName,
  writeContractParams?: WagmiWriteContractVariables,
): ScaffoldWriteContractReturnType<TContractName> {
  const finalConfig =
    typeof configOrName === "string"
      ? { contractName: configOrName, writeContractParams, chainId: undefined }
      : configOrName;

  const { contractName, chainId, writeContractParams: finalWriteContractParams } = finalConfig;

  const { chain: accountChain } = useAccount();
  const writeTx = useTransactor();
  const [isMining, setIsMining] = useState(false);
  const selectedNetwork = useSelectedNetwork(chainId);

  const { data: deployedContractData } = useDeployedContractInfo({
    contractName,
    chainId: selectedNetwork.id as AllowedChainIds,
  });

  // We're not using the simulation result directly, but we'll use it for error handling
  // const { data: simulation, error: simulateError } = useSimulateContract({
  //   address: deployedContractData?.address,
  //   abi: deployedContractData?.abi,
  // });

  // @ts-ignore - Type issues with wagmi v2
  const wagmiContractWrite = useWriteContract(finalWriteContractParams);
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    if (typeof configOrName === "string") {
      console.warn(
        "Using `useScaffoldWriteContract` with a string parameter is deprecated. Please use the object parameter version instead.",
      );
    }
  }, [configOrName]);

  const writeContract = async <
    TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, "nonpayable" | "payable">,
  >(
    variables: ScaffoldWriteContractVariables<TContractName, TFunctionName>,
    options?: ScaffoldWriteContractOptions,
  ) => {
    if (!deployedContractData) {
      notification.error("Target contract is not deployed — did you forget to run `yarn deploy`?");
      return;
    }

    if (!accountChain?.id) {
      notification.error("Please connect your wallet");
      return;
    }

    if (accountChain?.id !== selectedNetwork.id) {
      notification.error(`Wrong network. Please switch to ${selectedNetwork.name}`);
      return;
    }

    try {
      setIsMining(true);

      const { blockConfirmations, onBlockConfirmation } = options || {};

      const writeContractObject = {
        abi: deployedContractData.abi as Abi,
        address: deployedContractData.address,
        ...variables,
      } as WagmiWriteContractVariables;

      const tx = await writeTx(
        () => writeContractAsync(writeContractObject),
        { blockConfirmations, onBlockConfirmation }
      );

      return tx;
    } catch (e: any) {
      throw e;
    } finally {
      setIsMining(false);
    }
  };

  return {
    ...wagmiContractWrite,
    isMining,
    writeContract,
  };
}
