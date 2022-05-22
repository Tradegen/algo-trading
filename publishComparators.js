const { ethers } = require("hardhat");

const COMPONENTS_REGISTRY_ADDRESS_TESTNET = "0xe2d859a5F277dB56FFb5A9915B2D01F7e8DddFC2";
const COMPONENTS_REGISTRY_ADDRESS_MAINNET = "";

const CLOSES_ADDRESS_TESTNET = "0x8F4F19f277bE6c398cB0982EA439777efECE72E3";
const CLOSES_ADDRESS_MAINNET = "";

const CROSSES_ABOVE_ADDRESS_TESTNET = "0x52bE49Db4eC1279aF5F71C7fC517D90c7E7238fa";
const CROSSES_ABOVE_ADDRESS_MAINNET = "";

const CROSSES_BELOW_ADDRESS_TESTNET = "0x924BEE1D4C081E26FE7501a350152C501b288841";
const CROSSES_BELOW_ADDRESS_MAINNET = "";

const FALL_BY_AT_LEAST_ADDRESS_TESTNET = "0x10163E1298E57afC3c7b37ceb66ef50e79a6b20B";
const FALL_BY_AT_LEAST_ADDRESS_MAINNET = "";

const FALL_BY_AT_MOST_ADDRESS_TESTNET = "0xCF9794e66649cE85886cC8A78AFA48F32e82F3aE";
const FALL_BY_AT_MOST_ADDRESS_MAINNET = "";

const FALLS_TO_ADDRESS_TESTNET = "0xad0452a9813591DD8dc74aA88E18DCAaD6940A5b";
const FALLS_TO_ADDRESS_MAINNET = "";

const IS_ABOVE_ADDRESS_TESTNET = "0x7dbE2C785E45B94577F6C3D121991B2B674553B2";
const IS_ABOVE_ADDRESS_MAINNET = "";

const IS_BELOW_ADDRESS_TESTNET = "0x78F3e4074eBA248341af06368c340665FDb7B00A";
const IS_BELOW_ADDRESS_MAINNET = "";

const RISE_BY_AT_LEAST_ADDRESS_TESTNET = "0xeb9d667b388b742cBc9b9a2528EB90111028240D";
const RISE_BY_AT_LEAST_ADDRESS_MAINNET = "";

const RISE_BY_AT_MOST_ADDRESS_TESTNET = "0x7ffB81a288BebecbBb1353FB947db476f8BDd677";
const RISE_BY_AT_MOST_ADDRESS_MAINNET = "";

const RISES_TO_ADDRESS_TESTNET = "0x56CE18642908aF2fe8e5D112eE504CD822B675d1";
const RISES_TO_ADDRESS_MAINNET = "";

async function publishInitialComparators() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ComponentsRegistryFactory = await ethers.getContractFactory('ComponentsRegistry');
    let componentsRegistry = ComponentsRegistryFactory.attach(COMPONENTS_REGISTRY_ADDRESS_TESTNET);

    let tx = await componentsRegistry.publishComponent(CLOSES_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx.wait();

    let tx2 = await componentsRegistry.publishComponent(CROSSES_ABOVE_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx2.wait();

    let tx3 = await componentsRegistry.publishComponent(CROSSES_BELOW_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx3.wait();

    let tx4 = await componentsRegistry.publishComponent(FALL_BY_AT_LEAST_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx4.wait();

    let tx5 = await componentsRegistry.publishComponent(FALL_BY_AT_MOST_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx5.wait();

    let tx6 = await componentsRegistry.publishComponent(FALLS_TO_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx6.wait();

    let tx7 = await componentsRegistry.publishComponent(IS_ABOVE_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx7.wait();

    let tx8 = await componentsRegistry.publishComponent(IS_BELOW_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx8.wait();

    let tx9 = await componentsRegistry.publishComponent(RISE_BY_AT_LEAST_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx9.wait();

    let tx10 = await componentsRegistry.publishComponent(RISE_BY_AT_MOST_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx10.wait();

    let tx11 = await componentsRegistry.publishComponent(RISES_TO_ADDRESS_TESTNET, false, deployer.address, 0);
    await tx11.wait();

    let lastIndex = await componentsRegistry.components(RISES_TO_ADDRESS_TESTNET);
    console.log(lastIndex);
}

publishInitialComparators()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })