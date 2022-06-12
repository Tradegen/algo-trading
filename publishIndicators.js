const { ethers } = require("hardhat");

const COMPONENTS_REGISTRY_ADDRESS_TESTNET = "0xe2d859a5F277dB56FFb5A9915B2D01F7e8DddFC2";
const COMPONENTS_REGISTRY_ADDRESS_MAINNET = "";

const DOWN_ADDRESS_TESTNET = "0x459D1796dB1BF9AA41ca4028EEBF06eFf0249607";
const DOWN_ADDRESS_MAINNET = "";

const EMA_ADDRESS_TESTNET = "0x28309A84F4EFd630B91811C43D40F8C0cEAa5315";
const EMA_ADDRESS_MAINNET = "";

const HIGH_OF_LAST_N_PRICE_UPDATES_ADDRESS_TESTNET = "0x2e70Cb26f8b09b539462A555b36e1A70DfCE9097";
const HIGH_OF_LAST_N_PRICE_UPDATES_ADDRESS_MAINNET = "";

const INTERVAL_ADDRESS_TESTNET = "0x21E2C6BEf45248F55f8Cb9E765CfDca2A9E7cf08";
const INTERVAL_ADDRESS_MAINNET = "";

const LATEST_PRICE_ADDRESS_TESTNET = "0xd14FC7a369ED7D9D7f3664B211017A66220B393d";
const LATEST_PRICE_ADDRESS_MAINNET = "";

const LOW_OF_LAST_N_PRICE_UPDATES_ADDRESS_TESTNET = "0xD88c432100fc7fba0c0E7B166Df9C542567d8EB8";
const LOW_OF_LAST_N_PRICE_UPDATES_ADDRESS_MAINNET = "";

const NPERCENT_ADDRESS_TESTNET = "0x6A8e0e1898E062Ac8EE4A3F8700AE228557d74FC";
const NPERCENT_ADDRESS_MAINNET = "";

const NTH_PRICE_UPDATE_ADDRESS_TESTNET = "0xED46424E5C0E4156B486e39d5e692060C9f8b5Ae";
const NTH_PRICE_UPDATE_ADDRESS_MAINNET = "";

const PREVIOUS_N_PRICE_UPDATES_ADDRESS_TESTNET = "0xEAA5536c02f918f7b4E294A50ED60b1D471Ae251";
const PREVIOUS_N_PRICE_UPDATES_ADDRESS_MAINNET = "";

const SMA_ADDRESS_TESTNET = "0x01c7ddAC8484ed0e67d199DDd9Ae1e7e7377Af28";
const SMA_ADDRESS_MAINNET = "";

const UP_ADDRESS_TESTNET = "0xB13a574AebFCe262b47b768C79711B7a18E262AE";
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