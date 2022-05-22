const { ethers } = require("hardhat");

const COMPONENTS_REGISTRY_ADDRESS_TESTNET = "0xe2d859a5F277dB56FFb5A9915B2D01F7e8DddFC2";
const COMPONENTS_REGISTRY_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0x1f19A758382F51811C5D429F30Ad78192C377383";
const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const KEEPER_REGISTRY_ADDRESS_TESTNET = "0x6E73407c98b937edCd8833e3F2C4b9D4D0e97416";
const KEEPER_REGISTRY_ADDRESS_MAINNET = "";

async function deployIndicators() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let DownFactory = await ethers.getContractFactory('Down');
    let EMAFactory = await ethers.getContractFactory('EMA');
    let HighOfLastNPriceUpdatesFactory = await ethers.getContractFactory('HighOfLastNPriceUpdates');
    let IntervalFactory = await ethers.getContractFactory('Interval');
    let LatestPriceFactory = await ethers.getContractFactory('LatestPrice');
    let LowOfLastNPriceUpdatesFactory = await ethers.getContractFactory('LowOfLastNPriceUpdates');
    let NPercentFactory = await ethers.getContractFactory('NPercent');
    let NthPriceUpdateFactory = await ethers.getContractFactory('NthPriceUpdate');
    let PreviousNPriceUpdatesFactory = await ethers.getContractFactory('PreviousNPriceUpdates');
    let SMAFactory = await ethers.getContractFactory('SMA');
    let UpFactory = await ethers.getContractFactory('Down');
    
    let down = await DownFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await down.deployed();
    let downAddress = down.address;
    console.log("Down: " + downAddress);

    let ema = await EMAFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await ema.deployed();
    let emaAddress = ema.address;
    console.log("EMA: " + emaAddress);

    let highOfLastNPriceUpdates = await HighOfLastNPriceUpdatesFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await highOfLastNPriceUpdates.deployed();
    let highOfLastNPriceUpdatesAddress = highOfLastNPriceUpdates.address;
    console.log("HighOfLastNPriceUpdates: " + highOfLastNPriceUpdatesAddress);

    let interval = await IntervalFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await interval.deployed();
    let intervalAddress = interval.address;
    console.log("Interval: " + intervalAddress);

    let latestPrice = await LatestPriceFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await latestPrice.deployed();
    let latestPriceAddress = latestPrice.address;
    console.log("LatestPrice: " + latestPriceAddress);

    let lowOfLastNPriceUpdates = await LowOfLastNPriceUpdatesFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await lowOfLastNPriceUpdates.deployed();
    let lowOfLastNPriceUpdatesAddress = lowOfLastNPriceUpdates.address;
    console.log("LowOfLastNPriceUpdates: " + lowOfLastNPriceUpdatesAddress);

    let nPercent = await NPercentFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await nPercent.deployed();
    let nPercentAddress = nPercent.address;
    console.log("NPercent: " + nPercentAddress);

    let nthPriceUpdate = await NthPriceUpdateFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await nthPriceUpdate.deployed();
    let nthPriceUpdateAddress = nthPriceUpdate.address;
    console.log("NthPriceUpdate: " + nthPriceUpdateAddress);

    let previousNPriceUpdates = await PreviousNPriceUpdatesFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await previousNPriceUpdates.deployed();
    let previousNPriceUpdatesAddress = previousNPriceUpdates.address;
    console.log("PreviousNPriceUpdates: " + previousNPriceUpdatesAddress);

    let sma = await SMAFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await sma.deployed();
    let smaAddress = sma.address;
    console.log("SMA: " + smaAddress);

    let up = await UpFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await up.deployed();
    let upAddress = up.address;
    console.log("Up: " + upAddress);
}

deployIndicators()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })