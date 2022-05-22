const { ethers } = require("hardhat");

const COMPONENTS_REGISTRY_ADDRESS_TESTNET = "0xe2d859a5F277dB56FFb5A9915B2D01F7e8DddFC2";
const COMPONENTS_REGISTRY_ADDRESS_MAINNET = "";

const TGEN_ADDRESS_TESTNET = "0xa9e37D0DC17C8B8Ed457Ab7cCC40b5785d4d11C0";
const TGEN_ADDRESS_MAINNET = "";

async function createInitialIndicatorInstances() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ComponentsRegistryFactory = await ethers.getContractFactory('ComponentsRegistry');
    let TokenFactory = await ethers.getContractFactory('TradegenToken');

    let componentsRegistry = ComponentsRegistryFactory.attach(COMPONENTS_REGISTRY_ADDRESS_TESTNET);
    let tradegenToken = TokenFactory.attach(TGEN_ADDRESS_TESTNET);

    // Down.
    let tx = await componentsRegistry.createIndicatorInstance(0, true, 1, "BTC", 1, 1, []);
    await tx.wait();

    // Up.
    let tx2 = await componentsRegistry.createIndicatorInstance(0, true, 11, "BTC", 1, 1, []);
    await tx2.wait();

    // EMA 20.
    let tx3 = await componentsRegistry.createIndicatorInstance(0, true, 2, "BTC", 1, 1, [20]);
    await tx3.wait();

    // Latest price.
    let tx4 = await componentsRegistry.createIndicatorInstance(0, true, 5, "BTC", 1, 1, []);
    await tx4.wait();

    // SMA 20.
    let tx5 = await componentsRegistry.createIndicatorInstance(0, true, 10, "BTC", 1, 1, [20]);
    await tx5.wait();

    let instanceInfo1 = await componentsRegistry.getComponentInstanceInfo(1, 1);
    console.log(instanceInfo1);

    let instanceInfo2 = await componentsRegistry.getComponentInstanceInfo(11, 1);
    console.log(instanceInfo2);

    let instanceInfo3 = await componentsRegistry.getComponentInstanceInfo(2, 1);
    console.log(instanceInfo3);

    let instanceInfo4 = await componentsRegistry.getComponentInstanceInfo(5, 1);
    console.log(instanceInfo4);

    let instanceInfo5 = await componentsRegistry.getComponentInstanceInfo(10, 1);
    console.log(instanceInfo5);
}

createInitialIndicatorInstances()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })