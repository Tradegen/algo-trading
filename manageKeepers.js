const { ethers } = require("hardhat");

const KEEPER_REGISTRY_ADDRESS_TESTNET = "0x6E73407c98b937edCd8833e3F2C4b9D4D0e97416";
const KEEPER_REGISTRY_ADDRESS_MAINNET = "";

const DEDICATED_CALLER = "0xd0B64C57c4D5AD7a404b057B160e41bfA853dbac";

const KEEPER_ADDRESS_TESTNET = "0x8a3D6Cea6A6b1E249D0a93C8d74647c087f2415e";
const KEEPER_ADDRESS_MAINNET = "";

const DOWN_ADDRESS_TESTNET = "0x0cBfE317d330eF5067C95fa280b7C410eDabc701";
const DOWN_ADDRESS_MAINNET = "";

const EMA_ADDRESS_TESTNET = "0x7Af596dd1e5aA107c4ecBc9a3Ecf2CE00eEd1776";
const EMA_ADDRESS_MAINNET = "";

const LATEST_PRICE_ADDRESS_TESTNET = "0xB9Cbe994Ca46Be1137bd9892eaAEF68542E2bbE0";
const LATEST_PRICE_ADDRESS_MAINNET = "";

const SMA_ADDRESS_TESTNET = "0x12dDDd28ac80194ef491A626aA4229c6766EC3Df";
const SMA_ADDRESS_MAINNET = "";

const UP_ADDRESS_TESTNET = "0x22A02fCfcC57f305273908c63f2Cd7A17861F93a";
const UP_ADDRESS_MAINNET = "";

async function registerInitialKeeper() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let KeeperRegistryFactory = await ethers.getContractFactory('KeeperRegistry');
    let keeperRegistry = KeeperRegistryFactory.attach(KEEPER_REGISTRY_ADDRESS_TESTNET);

    let tx = await keeperRegistry.registerKeeper(DEDICATED_CALLER, deployer.address, 0);
    await tx.wait();

    let keeperAddress = await keeperRegistry.userToKeeper(deployer.address);
    console.log("Keeper address: " + keeperAddress);

    let keeperInfo = await keeperRegistry.keepers(keeperAddress);
    console.log(keeperInfo);
}

async function createInitialJobs() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let KeeperRegistryFactory = await ethers.getContractFactory('KeeperRegistry');
    let keeperRegistry = KeeperRegistryFactory.attach(KEEPER_REGISTRY_ADDRESS_TESTNET);

    let tx = await keeperRegistry.createJob(0, KEEPER_ADDRESS_TESTNET, DOWN_ADDRESS_TESTNET, 1);
    await tx.wait();

    let tx2 = await keeperRegistry.createJob(0, KEEPER_ADDRESS_TESTNET, UP_ADDRESS_TESTNET, 1);
    await tx2.wait();

    let tx3 = await keeperRegistry.createJob(0, KEEPER_ADDRESS_TESTNET, EMA_ADDRESS_TESTNET, 1);
    await tx3.wait();

    let tx4 = await keeperRegistry.createJob(0, KEEPER_ADDRESS_TESTNET, LATEST_PRICE_ADDRESS_TESTNET, 1);
    await tx4.wait();

    let tx5 = await keeperRegistry.createJob(0, KEEPER_ADDRESS_TESTNET, SMA_ADDRESS_TESTNET, 1);
    await tx5.wait();

    let availableJobs = await keeperRegistry.getAvailableJobs(KEEPER_ADDRESS_TESTNET);
    console.log(availableJobs);
}
/*
registerInitialKeeper()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/

createInitialJobs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })