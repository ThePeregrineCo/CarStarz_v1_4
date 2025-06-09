"use client";

import Link from "next/link";
import { Address as AddressType } from "viem";
import { Address } from "~~/components/scaffold-eth";

type ProfileAddressLinkProps = {
  address?: AddressType;
  format?: "short" | "long";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  onlyEnsOrAddress?: boolean;
};

export const ProfileAddressLink = ({
  address,
  format,
  size = "base",
  onlyEnsOrAddress = false,
}: ProfileAddressLinkProps) => {
  if (!address) {
    return <Address address={address} format={format} size={size} onlyEnsOrAddress={onlyEnsOrAddress} />;
  }

  return (
    <Link href={`/profile/${address}`} className="hover:underline">
      <Address 
        address={address} 
        format={format} 
        size={size} 
        onlyEnsOrAddress={onlyEnsOrAddress} 
        disableAddressLink={true} 
      />
    </Link>
  );
};