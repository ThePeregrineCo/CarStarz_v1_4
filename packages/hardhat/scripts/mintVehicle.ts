import { ethers } from "hardhat";

async function main() {
  try {
    // Get the deployed contract address
    const registry = await ethers.getContractAt("VehicleRegistry", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    
    console.log("Connected to VehicleRegistry contract");
    
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    // Mint a new vehicle
    console.log("Minting a new vehicle...");
    const tx = await registry.mintVehicleWithId(
      1, // tokenId
      "VIN123456789", // VIN
      "Test Vehicle", // name
      "https://example.com/metadata/1" // metadataURI
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Vehicle minted successfully!");
    
    // Try to get the totalSupply
    try {
      const totalSupply = await registry.totalSupply();
      console.log("Total supply after minting:", totalSupply.toString());
    } catch (error) {
      console.error("Error getting totalSupply:", error);
    }
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });