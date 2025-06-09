import { ethers } from "hardhat";
import fs from "fs";

const VEHICLES = [
  {
    tokenId: 1,
    vin: "1G6DW5ED0B0123456",
    name: "Cadillac CTS-V Wagon",
    imageURI: "ipfs://Qm.../cadillac.jpg",
    year: "2011",
    make: "Cadillac",
    model: "CTS-V Wagon",
  },
  {
    tokenId: 2,
    vin: "5YJSA1E26FF101234",
    name: "Tesla Model S",
    imageURI: "ipfs://Qm.../tesla.jpg",
    year: "2022",
    make: "Tesla",
    model: "Model S",
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  const VehicleRegistry = await ethers.getContractFactory("VehicleRegistry");
  const registry = await VehicleRegistry.deploy();
  await registry.deployed();

  console.log("VehicleRegistry deployed to:", registry.address);

  const metadata: Record<string, any> = {};

  for (const v of VEHICLES) {
    await registry.mintVehicleWithId(
      v.tokenId,
      v.vin,
      v.name,
      v.imageURI
    );

    console.log(`Minted ${v.name} as token ID ${v.tokenId}`);

    metadata[v.tokenId.toString()] = {
      vin: v.vin,
      make: v.make,
      model: v.model,
      year: v.year,
      image: v.imageURI,
    };
  }

  fs.writeFileSync(
    "./packages/nextjs/data/vehicleMetadata.ts",
    `export const VEHICLE_METADATA = ${JSON.stringify(metadata, null, 2)};`
  );

  console.log("Wrote metadata to frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 