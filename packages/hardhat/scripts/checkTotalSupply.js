const { ethers } = require("hardhat");

async function main() {
  // Get the deployed contract address
  const registry = await ethers.getContractAt("VehicleRegistry", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  
  // Check totalSupply
  const totalSupply = await registry.totalSupply();
  console.log("Total supply:", totalSupply.toString());
  
  // If totalSupply > 0, try to get the first token
  if (totalSupply > 0) {
    try {
      const tokenId = await registry.tokenByIndex(0);
      console.log("First token ID:", tokenId.toString());
      
      const vehicle = await registry.getVehicleByTokenId(tokenId);
      console.log("Vehicle data:", vehicle);
    } catch (error) {
      console.error("Error fetching token data:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });