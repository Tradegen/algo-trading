const { ethers } = require("hardhat");

const COMPONENTS_REGISTRY_ADDRESS_TESTNET = "0xe2d859a5F277dB56FFb5A9915B2D01F7e8DddFC2";
const COMPONENTS_REGISTRY_ADDRESS_MAINNET = "";

const DOWN_ADDRESS_TESTNET = "0x0cBfE317d330eF5067C95fa280b7C410eDabc701";
const DOWN_ADDRESS_MAINNET = "";

const EMA_ADDRESS_TESTNET = "0x7Af596dd1e5aA107c4ecBc9a3Ecf2CE00eEd1776";
const EMA_ADDRESS_MAINNET = "";

const HIGH_OF_LAST_N_PRICE_UPDATES_ADDRESS_TESTNET = "0xC838ee54763adEEF24202Ff31310e3770C6eB554";
const HIGH_OF_LAST_N_PRICE_UPDATES_ADDRESS_MAINNET = "";

const INTERVAL_ADDRESS_TESTNET = "0x1043A2fA35a415A839d02e44BbaE0C32D7804a6F";
const INTERVAL_ADDRESS_MAINNET = "";

const LATEST_PRICE_ADDRESS_TESTNET = "0xB9Cbe994Ca46Be1137bd9892eaAEF68542E2bbE0";
const LATEST_PRICE_ADDRESS_MAINNET = "";

const LOW_OF_LAST_N_PRICE_UPDATES_ADDRESS_TESTNET = "0xC46D49a04E47574FEE03Bf78026A44FAFB7eEAF1";
const LOW_OF_LAST_N_PRICE_UPDATES_ADDRESS_MAINNET = "";

const NPERCENT_ADDRESS_TESTNET = "0x1aDf59851200eE4350bA2e34FEFd43D6D5e044Ed";
const NPERCENT_ADDRESS_MAINNET = "";

const NTH_PRICE_UPDATE_ADDRESS_TESTNET = "0x80DCAF8FDBfC803f17879C26EC5964541776568d";
const NTH_PRICE_UPDATE_ADDRESS_MAINNET = "";

const PREVIOUS_N_PRICE_UPDATES_ADDRESS_TESTNET = "0xd34334917f942221809bD610EEe356cf71218Fb6";
const PREVIOUS_N_PRICE_UPDATES_ADDRESS_MAINNET = "";

const SMA_ADDRESS_TESTNET = "0x12dDDd28ac80194ef491A626aA4229c6766EC3Df";
const SMA_ADDRESS_MAINNET = "";

const UP_ADDRESS_TESTNET = "0x22A02fCfcC57f305273908c63f2Cd7A17861F93a";
const UP_ADDRESS_MAINNET = "";

async function publishInitialIndicators() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ComponentsRegistryFactory = await ethers.getContractFactory('ComponentsRegistry');
    let componentsRegistry = ComponentsRegistryFactory.attach(COMPONENTS_REGISTRY_ADDRESS_TESTNET);

    let tx = await componentsRegistry.publishComponent(DOWN_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx.wait();

    let tx2 = await componentsRegistry.publishComponent(EMA_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx2.wait();

    let tx3 = await componentsRegistry.publishComponent(HIGH_OF_LAST_N_PRICE_UPDATES_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx3.wait();

    let tx4 = await componentsRegistry.publishComponent(INTERVAL_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx4.wait();

    let tx5 = await componentsRegistry.publishComponent(LATEST_PRICE_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx5.wait();

    let tx6 = await componentsRegistry.publishComponent(LOW_OF_LAST_N_PRICE_UPDATES_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx6.wait();

    let tx7 = await componentsRegistry.publishComponent(NPERCENT_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx7.wait();

    let tx8 = await componentsRegistry.publishComponent(NTH_PRICE_UPDATE_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx8.wait();

    let tx9 = await componentsRegistry.publishComponent(PREVIOUS_N_PRICE_UPDATES_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx9.wait();

    let tx10 = await componentsRegistry.publishComponent(SMA_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx10.wait();

    let tx11 = await componentsRegistry.publishComponent(UP_ADDRESS_TESTNET, true, deployer.address, 0);
    await tx11.wait();

    let lastIndex = await componentsRegistry.components(UP_ADDRESS_TESTNET);
    console.log(lastIndex);
}

publishInitialIndicators()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })