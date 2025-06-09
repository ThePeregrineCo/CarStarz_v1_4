import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("VehicleRegistry", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
};

func.tags = ["VehicleRegistry"];
export default func; 