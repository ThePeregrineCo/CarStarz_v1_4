import { ethers } from "hardhat";

async function main() {
  try {
    // Get the deployed contract addresses
    const vehicleRegistryAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const yourContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    console.log("Checking contracts...");
    
    // Try to connect to VehicleRegistry at both addresses
    try {
      const vehicleRegistry1 = await ethers.getContractAt("VehicleRegistry", vehicleRegistryAddress);
      console.log(`Connected to VehicleRegistry at ${vehicleRegistryAddress}`);
      
      try {
        // Try to call a VehicleRegistry-specific function
        const name = await vehicleRegistry1.name();
        console.log(`Contract name at ${vehicleRegistryAddress}: ${name}`);
      } catch (error: any) {
        console.error(`Error calling name() on ${vehicleRegistryAddress}:`, error.message || error);
      }
    } catch (error: any) {
      console.error(`Error connecting to VehicleRegistry at ${vehicleRegistryAddress}:`, error.message || error);
    }
    
    try {
      const vehicleRegistry2 = await ethers.getContractAt("VehicleRegistry", yourContractAddress);
      console.log(`Connected to VehicleRegistry at ${yourContractAddress}`);
      
      try {
        // Try to call a VehicleRegistry-specific function
        const name = await vehicleRegistry2.name();
        console.log(`Contract name at ${yourContractAddress}: ${name}`);
      } catch (error: any) {
        console.error(`Error calling name() on ${yourContractAddress}:`, error.message || error);
      }
    } catch (error: any) {
      console.error(`Error connecting to VehicleRegistry at ${yourContractAddress}:`, error.message || error);
    }
    
    // Try to connect to YourContract at both addresses
    try {
      const yourContract1 = await ethers.getContractAt("YourContract", vehicleRegistryAddress);
      console.log(`Connected to YourContract at ${vehicleRegistryAddress}`);
      
      try {
        // Try to call a YourContract-specific function
        const greeting = await yourContract1.greeting();
        console.log(`Greeting at ${vehicleRegistryAddress}: ${greeting}`);
      } catch (error: any) {
        console.error(`Error calling greeting() on ${vehicleRegistryAddress}:`, error.message || error);
      }
    } catch (error: any) {
      console.error(`Error connecting to YourContract at ${vehicleRegistryAddress}:`, error.message || error);
    }
    
    try {
      const yourContract2 = await ethers.getContractAt("YourContract", yourContractAddress);
      console.log(`Connected to YourContract at ${yourContractAddress}`);
      
      try {
        // Try to call a YourContract-specific function
        const greeting = await yourContract2.greeting();
        console.log(`Greeting at ${yourContractAddress}: ${greeting}`);
      } catch (error: any) {
        console.error(`Error calling greeting() on ${yourContractAddress}:`, error.message || error);
      }
    } catch (error: any) {
      console.error(`Error connecting to YourContract at ${yourContractAddress}:`, error.message || error);
    }
    
  } catch (error: any) {
    console.error("Error in main function:", error.message || error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });