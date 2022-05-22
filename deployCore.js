const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "0xa9e37D0DC17C8B8Ed457Ab7cCC40b5785d4d11C0";
const TGEN_ADDRESS_MAINNET = "";

const TGEN_STAKING_ADDRESS_TESTNET = "0x4a03DBf1A734BfE935347cccd3CC57f770c59C28";
const TGEN_STAKING_ADDRESS_MAINNET = "";

const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0x8F51B3Ce8c8752077c81873d2CAd65a1b8e1156d";
const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0x1f19A758382F51811C5D429F30Ad78192C377383";
const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const COMPONENTS_REGISTRY_ADDRESS_TESTNET = "0xe2d859a5F277dB56FFb5A9915B2D01F7e8DddFC2";
const COMPONENTS_REGISTRY_ADDRESS_MAINNET = "";

const COMPONENTS_ADDRESS_TESTNET = "0x89fb208Af691eCef441c6Bc3202Ad35592a24deF";
const COMPONENTS_ADDRESS_MAINNET = "";

const COMPONENT_INSTANCES_FACTORY_ADDRESS_TESTNET = "0xD19264D1bBdc9Ee4C17e7C8FE4667F6c46f95DF0";
const COMPONENT_INSTANCES_FACTORY_ADDRESS_MAINNET = "";

const TRADING_BOTS_ADDRESS_TESTNET = "0x3F9b9C9e8b13c1f99eEF90097a8E2601477C21F1";
const TRADING_BOTS_ADDRESS_MAINNET = "";

const TRADING_BOT_FACTORY_ADDRESS_TESTNET = "0x09fD2d3bB97f4C246978A3Ee30CD001044A9cb73";
const TRADING_BOT_FACTORY_ADDRESS_MAINNET = "";

const TRADING_BOT_REGISTRY_ADDRESS_TESTNET = "0xF37B01Bb1F0025656ca4435664C052cd0b5A8aFB";
const TRADING_BOT_REGISTRY_ADDRESS_MAINNET = "";

const KEEPER_FACTORY_ADDRESS_TESTNET = "0xfff4475075A3EF4d0b670d43e09d2E4b44F96A5F";
const KEEPER_FACTORY_ADDRESS_MAINNET = "";

const KEEPER_REGISTRY_ADDRESS_TESTNET = "0x6E73407c98b937edCd8833e3F2C4b9D4D0e97416";
const KEEPER_REGISTRY_ADDRESS_MAINNET = "";

async function deployComponentsRegistry() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ComponentsRegistryFactory = await ethers.getContractFactory('ComponentsRegistry');
    
    let componentsRegistry = await ComponentsRegistryFactory.deploy(TGEN_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET);
    await componentsRegistry.deployed();
    let componentsRegistryAddress = componentsRegistry.address;
    console.log("ComponentsRegistry: " + componentsRegistryAddress);
}

async function deployComponents() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ComponentsFactory = await ethers.getContractFactory('Components');
    
    let components = await ComponentsFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, TGEN_ADDRESS_TESTNET);
    await components.deployed();
    let componentsAddress = components.address;
    console.log("Components: " + componentsAddress);
}

async function deployComponentInstancesFactory() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ComponentInstancesFactoryFactory = await ethers.getContractFactory('ComponentInstancesFactory');
    
    let componentInstancesFactory = await ComponentInstancesFactoryFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, TGEN_ADDRESS_TESTNET);
    await componentInstancesFactory.deployed();
    let componentInstancesFactoryAddress = componentInstancesFactory.address;
    console.log("ComponentInstancesFactory: " + componentInstancesFactoryAddress);
}

async function initializeComponentsRegistry() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ComponentsRegistryFactory = await ethers.getContractFactory('ComponentsRegistry');
    let componentsRegistry = ComponentsRegistryFactory.attach(COMPONENTS_REGISTRY_ADDRESS_TESTNET);
    
    let tx = await componentsRegistry.initializeContracts(COMPONENT_INSTANCES_FACTORY_ADDRESS_TESTNET, COMPONENTS_ADDRESS_TESTNET);
    await tx.wait();

    let deployedAddress1 = await componentsRegistry.componentInstancesFactory();
    let deployedAddress2 = await componentsRegistry.componentsFactory();
    console.log(deployedAddress1);
    console.log(deployedAddress2);
}

async function deployTradingBots() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let TradingBotsFactory = await ethers.getContractFactory('TradingBots');
    
    let tradingBots = await TradingBotsFactory.deploy();
    await tradingBots.deployed();
    let tradingBotsAddress = tradingBots.address;
    console.log("TradingBots: " + tradingBotsAddress);
}

async function deployTradingBotFactory() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let TradingBotFactoryFactory = await ethers.getContractFactory('TradingBotFactory');
    
    let tradingBotFactory = await TradingBotFactoryFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, TRADING_BOTS_ADDRESS_TESTNET);
    await tradingBotFactory.deployed();
    let tradingBotFactoryAddress = tradingBotFactory.address;
    console.log("TradingBotFactory: " + tradingBotFactoryAddress);
}

async function deployTradingBotRegistry() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let TradingBotRegistryFactory = await ethers.getContractFactory('TradingBotRegistry');
    
    let tradingBotRegistry = await TradingBotRegistryFactory.deploy(TRADING_BOTS_ADDRESS_TESTNET, BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_TESTNET, COMPONENTS_REGISTRY_ADDRESS_TESTNET, TRADING_BOT_FACTORY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, TGEN_ADDRESS_TESTNET, TGEN_STAKING_ADDRESS_TESTNET);
    await tradingBotRegistry.deployed();
    let tradingBotRegistryAddress = tradingBotRegistry.address;
    console.log("TradingBotRegistry: " + tradingBotRegistryAddress);
}

async function initializeTradingBots() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let TradingBotsFactory = await ethers.getContractFactory('TradingBots');
    let tradingBots = TradingBotsFactory.attach(TRADING_BOTS_ADDRESS_TESTNET);
    
    let tx = await tradingBots.setTradingBotRegistryAddress(TRADING_BOT_REGISTRY_ADDRESS_TESTNET);
    await tx.wait();

    let deployedAddress1 = await tradingBots.tradingBotRegistry();
    console.log(deployedAddress1);
}

async function deployKeeperFactory() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let KeeperFactoryFactory = await ethers.getContractFactory('KeeperFactory');
    
    let keeperFactory = await KeeperFactoryFactory.deploy();
    await keeperFactory.deployed();
    let keeperFactoryAddress = keeperFactory.address;
    console.log("KeeperFactory: " + keeperFactoryAddress);
}

async function deployKeeperRegistry() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let KeeperRegistryFactory = await ethers.getContractFactory('KeeperRegistry');
    
    let keeperRegistry = await KeeperRegistryFactory.deploy(TGEN_ADDRESS_TESTNET, COMPONENTS_REGISTRY_ADDRESS_TESTNET, TRADING_BOT_REGISTRY_ADDRESS_TESTNET, KEEPER_FACTORY_ADDRESS_TESTNET);
    await keeperRegistry.deployed();
    let keeperRegistryAddress = keeperRegistry.address;
    console.log("KeeperRegistry: " + keeperRegistryAddress);
}

async function initializeKeeperFactory() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let KeeperFactoryFactory = await ethers.getContractFactory('KeeperFactory');
    let keeperFactory = KeeperFactoryFactory.attach(KEEPER_FACTORY_ADDRESS_TESTNET);
    
    let tx = await keeperFactory.setKeeperRegistry(KEEPER_REGISTRY_ADDRESS_TESTNET);
    await tx.wait();

    let deployedAddress1 = await keeperFactory.keeperRegistry();
    console.log(deployedAddress1);
}

async function initializeTradingBotFactory() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let TradingBotFactoryFactory = await ethers.getContractFactory('TradingBotFactory');
    let tradingBotFactory = TradingBotFactoryFactory.attach(TRADING_BOT_FACTORY_ADDRESS_TESTNET);
    
    let tx = await tradingBotFactory.initializeContracts(TRADING_BOT_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await tx.wait();
}

async function deployMarketplace() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let MarketplaceFactory = await ethers.getContractFactory('Marketplace');
    
    let marketplace = await MarketplaceFactory.deploy(COMPONENTS_ADDRESS_TESTNET, TRADING_BOTS_ADDRESS_TESTNET, TGEN_ADDRESS_TESTNET, TGEN_STAKING_ADDRESS_TESTNET);
    await marketplace.deployed();
    let marketplaceAddress = marketplace.address;
    console.log("Marketplace: " + marketplaceAddress);
}

/*
deployComponentsRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployComponents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployComponentInstancesFactory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

initializeComponentsRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployTradingBots()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployTradingBotFactory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployTradingBotRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

initializeTradingBots()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  

deployKeeperFactory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployKeeperRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

initializeKeeperFactory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

initializeTradingBotFactory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/

deployMarketplace()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })