const { ethers } = require("hardhat");

const KEEPER_REGISTRY_ADDRESS_TESTNET = "0x6E73407c98b937edCd8833e3F2C4b9D4D0e97416";
const KEEPER_REGISTRY_ADDRESS_MAINNET = "";

const DEDICATED_CALLER = "0xd0B64C57c4D5AD7a404b057B160e41bfA853dbac";

const KEEPER_ADDRESS_TESTNET = "0x8a3D6Cea6A6b1E249D0a93C8d74647c087f2415e";
const KEEPER_ADDRESS_MAINNET = "";

const DOWN_ADDRESS_TESTNET = "0x459D1796dB1BF9AA41ca4028EEBF06eFf0249607";
const DOWN_ADDRESS_MAINNET = "";

const EMA_ADDRESS_TESTNET = "0x28309A84F4EFd630B91811C43D40F8C0cEAa5315";
const EMA_ADDRESS_MAINNET = "";

const LATEST_PRICE_ADDRESS_TESTNET = "0xd14FC7a369ED7D9D7f3664B211017A66220B393d";
const LATEST_PRICE_ADDRESS_MAINNET = "";

const SMA_ADDRESS_TESTNET = "0x01c7ddAC8484ed0e67d199DDd9Ae1e7e7377Af28";
const SMA_ADDRESS_MAINNET = "";

const UP_ADDRESS_TESTNET = "0xB13a574AebFCe262b47b768C79711B7a18E262AE";
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

async function cancelPreviousJobs() {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let KeeperRegistryFactory = await ethers.getContractFactory('KeeperRegistry');
  let keeperRegistry = KeeperRegistryFactory.attach(KEEPER_REGISTRY_ADDRESS_TESTNET);

  let tx = await keeperRegistry.cancelJob(1);
  await tx.wait();

  let tx2 = await keeperRegistry.cancelJob(2);
  await tx2.wait();

  let tx3 = await keeperRegistry.cancelJob(3);
  await tx3.wait();

  let tx4 = await keeperRegistry.cancelJob(4);
  await tx4.wait();

  let tx5 = await keeperRegistry.cancelJob(5);
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
  })/*
cancelPreviousJobs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/