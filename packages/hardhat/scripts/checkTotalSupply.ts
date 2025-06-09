import { ethers } from "hardhat";

async function main() {
  // Use the deployed contract address on localhost
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const registry = await ethers.getContractAt("VehicleRegistry", contractAddress);
  const total = await registry.totalSupply();

  console.log(`✅ Total NFTs on-chain: ${total.toString()}`);
}

main().catch((error) => {
  console.error("❌ Error running script:", error);
  process.exit(1);
});