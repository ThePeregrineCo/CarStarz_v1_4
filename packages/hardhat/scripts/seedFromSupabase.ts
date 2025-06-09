import { ethers } from "hardhat";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Setup Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
  );

  const { data: vehicles, error } = await supabase
    .from("vehicle_profiles")
    .select("*");

  if (error) {
    throw new Error(`Supabase fetch failed: ${error.message}`);
  }

  console.log(`Found ${vehicles.length} vehicles in Supabase`);

  // Get the first signer to use for transactions
  const registry = await ethers.getContractAt(
    "VehicleRegistry",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // Address from deployment
  );

  for (const vehicle of vehicles) {
    const vin = vehicle.vin;
    const name = vehicle.name || "Unnamed Vehicle";
    const metadataURI = vehicle.metadata_uri || ""; // fallback if needed
    const tokenId = vehicle.token_id;

    console.log(`Minting vehicle VIN: ${vin}, Token ID: ${tokenId}...`);

    try {
      // Use mintVehicleWithId since that's the function in our contract
      const tx = await registry.mintVehicleWithId(
        tokenId,
        vin,
        name,
        metadataURI
      );
      await tx.wait();
      console.log(`✅ Minted token for VIN: ${vin}, Token ID: ${tokenId}`);
    } catch (err) {
      console.error(`❌ Failed to mint token for VIN: ${vin}`, err);
    }
  }

  // Check total supply after minting
  const totalSupply = await registry.totalSupply();
  console.log(`Total vehicles after seeding: ${totalSupply.toString()}`);

  console.log("🎉 Sync complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});