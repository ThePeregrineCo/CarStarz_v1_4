import { ethers } from "hardhat";

async function main() {
  try {
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("Wallet address:", signer.address);
  } catch (error) {
    console.error("Error getting wallet address:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });