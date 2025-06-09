import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  try {
    // Get the deployed contract address
    const registry = await ethers.getContractAt("VehicleRegistry", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    
    console.log("Connected to VehicleRegistry contract");
    
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    // Next token ID (based on current counter)
    const tokenId = 6;
    
    // Mint a new vehicle
    console.log(`Minting a new vehicle with token ID ${tokenId}...`);
    const tx = await registry.mintVehicleWithId(
      tokenId, // tokenId
      "VIN123456TEST", // VIN
      "Test Owner Vehicle", // name
      `https://example.com/metadata/${tokenId}` // metadataURI
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Vehicle minted successfully!");
    
    // Update token counter
    const counterPath = path.join(__dirname, "../../nextjs/data/tokenCounter.json");
    const counter = JSON.parse(fs.readFileSync(counterPath, "utf8"));
    counter.default = tokenId;
    fs.writeFileSync(counterPath, JSON.stringify(counter));
    console.log(`Updated token counter to ${tokenId}`);
    
    // Create a vehicle profile in the database
    console.log("Creating vehicle profile in database...");
    
    // Try to get the totalSupply
    try {
      const totalSupply = await registry.totalSupply();
      console.log("Total supply after minting:", totalSupply.toString());
    } catch (error) {
      console.error("Error getting totalSupply:", error);
    }
    
    console.log(`\nTest vehicle minted with token ID ${tokenId}`);
    console.log(`Owner: ${signer.address}`);
    console.log(`\nYou can now visit: http://localhost:3000/vehicle/${tokenId}`);
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