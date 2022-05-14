const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("RisesTo", () => {
  let deployer;
  let otherUser;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let latestPrice;
  let latestPriceAddress;
  let LatestPriceFactory;

  let ema;
  let emaAddress;
  let EMAFactory;

  let comparator;
  let comparatorAddress;
  let ComparatorFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');
    LatestPriceFactory = await ethers.getContractFactory('TestLatestPrice');
    EMAFactory = await ethers.getContractFactory('TestEMA');
    ComparatorFactory = await ethers.getContractFactory('TestRisesTo');

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;
  });

  beforeEach(async () => {
    latestPrice = await LatestPriceFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await latestPrice.deployed();
    latestPriceAddress = latestPrice.address;

    ema = await EMAFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await ema.deployed();
    emaAddress = ema.address;

    comparator = await ComparatorFactory.deploy(deployer.address, deployer.address);
    await comparator.deployed();
    comparatorAddress = comparator.address;
  });
  
  describe("#setKeeper", () => {
    it("onlyKeeperRegistry", async () => {
      let tx = comparator.connect(otherUser).setKeeper(1, otherUser.address);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await comparator.setKeeper(1, otherUser.address);
        await tx.wait();

        let keeper = await comparator.keepers(1);
        expect(keeper).to.equal(otherUser.address);
    });
  });

  describe("#createInstance", () => {
    it("onlyComponentRegistry", async () => {
      let tx = comparator.connect(otherUser).createInstance(latestPriceAddress, emaAddress, 1, 1);
      await expect(tx).to.be.reverted;
    });

    it("indicators are the same", async () => {
        let tx = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx.wait();

        let tx2 = comparator.createInstance(latestPriceAddress, latestPriceAddress, 1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("invalid timeframe", async () => {
        let tx = await ema.createInstance("BTC", 1, 1, [3]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx2.wait();

        let tx3 = comparator.createInstance(latestPriceAddress, emaAddress, 2, 2);
        await expect(tx3).to.be.reverted;
    });

    it("meets requirements; same timeframe", async () => {
        let tx = await ema.createInstance("BTC", 1, 1, [3]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx2.wait();

        let tx3 = await comparator.createInstance(latestPriceAddress, emaAddress, 1, 1);
        await tx3.wait();

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;

        let comparatorTimeframe = await comparator.comparatorTimeframe(1);
        expect(comparatorTimeframe).to.equal(1);

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.true;

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.false;

        let state = await comparator.getState(1);
        expect(state[0]).to.equal(latestPriceAddress);
        expect(state[1]).to.equal(emaAddress);
        expect(state[2]).to.equal(1);
        expect(state[3]).to.equal(1);
        expect(state[4].length).to.equal(2);
        expect(state[4][0]).to.equal(0);
        expect(state[4][1]).to.equal(0);
    });

    it("meets requirements; different timeframe", async () => {
        let tx = await ema.createInstance("BTC", 10, 10, [3]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 5, 5, []);
        await tx2.wait();

        let tx3 = await comparator.createInstance(latestPriceAddress, emaAddress, 1, 1);
        await tx3.wait();

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;

        let comparatorTimeframe = await comparator.comparatorTimeframe(1);
        expect(comparatorTimeframe).to.equal(5);

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.true;

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.false;

        let state = await comparator.getState(1);
        expect(state[0]).to.equal(latestPriceAddress);
        expect(state[1]).to.equal(emaAddress);
        expect(state[2]).to.equal(1);
        expect(state[3]).to.equal(1);
        expect(state[4].length).to.equal(2);
        expect(state[4][0]).to.equal(0);
        expect(state[4][1]).to.equal(0);
    });
  });

  describe("#checkConditions", () => {
    it("onlyDedicatedKeeper", async () => {
        let tx = await comparator.setKeeper(1, otherUser.address);
        await tx.wait();

        let tx2 = await ema.createInstance("BTC", 10, 10, [3]);
        await tx2.wait();

        let tx3 = await latestPrice.createInstance("BTC", 5, 5, []);
        await tx3.wait();

        let tx4 = await comparator.createInstance(latestPriceAddress, emaAddress, 1, 1);
        await tx4.wait();

        let tx5 = comparator.checkConditions(1);
        await expect(tx5).to.be.reverted;

        let lastUpdated = await comparator.lastUpdated(1);
        expect(lastUpdated).to.equal(0);
    });

    it("One update; starts above second indicator", async () => {
        let tx = await ema.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await ema.createInstance("BTC", 1, 1, [3]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, emaAddress, 1, 1);
        await tx6.wait();

        let tx7 = await ema.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let tx11 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("2500"));
        await tx11.wait();

        let tx12 = await latestPrice.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await latestPrice.update(1);
        await tx13.wait();

        let tx14 = await ema.setLastUpdated(1, 0);
        await tx14.wait();

        let tx15 = await ema.update(1);
        await tx15.wait();

        let tx16 = await comparator.setLastUpdated(1, 0);
        await tx16.wait();

        let tx17 = await comparator.checkConditions(1);
        await tx17.wait();

        let currentTime = await candlestickDataFeedRegistry.getCurrentTimestamp();

        let lastUpdated = await comparator.lastUpdated(1);
        expect(lastUpdated).to.equal(Number(currentTime));

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;

        let comparatorTimeframe = await comparator.comparatorTimeframe(1);
        expect(comparatorTimeframe).to.equal(1);
    });

    it("One update; starts below second indicator, rises too much", async () => {
        let tx = await ema.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await ema.createInstance("BTC", 1, 1, [3]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, emaAddress, 1, 1);
        await tx6.wait();

        let tx7 = await ema.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let tx11 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("995"));
        await tx11.wait();

        let tx12 = await latestPrice.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await latestPrice.update(1);
        await tx13.wait();

        let tx14 = await ema.setLastUpdated(1, 0);
        await tx14.wait();

        let tx15 = await ema.update(1);
        await tx15.wait();

        let tx16 = await comparator.setLastUpdated(1, 0);
        await tx16.wait();

        let tx17 = await comparator.checkConditions(1);
        await tx17.wait();

        let tx18 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1100"));
        await tx18.wait();

        let tx19 = await latestPrice.setLastUpdated(1, 0);
        await tx19.wait();

        let tx20 = await latestPrice.update(1);
        await tx20.wait();

        let tx21 = await ema.setLastUpdated(1, 0);
        await tx21.wait();

        let tx22 = await ema.update(1);
        await tx22.wait();

        let tx23 = await comparator.setLastUpdated(1, 0);
        await tx23.wait();

        let tx24 = await comparator.checkConditions(1);
        await tx24.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;
    });

    it("One update; starts below second indicator, meets conditions", async () => {
        let tx = await ema.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await ema.createInstance("BTC", 1, 1, [3]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, emaAddress, 1, 1);
        await tx6.wait();

        let tx7 = await ema.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let tx11 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("995"));
        await tx11.wait();

        let tx12 = await latestPrice.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await latestPrice.update(1);
        await tx13.wait();

        let tx14 = await ema.setLastUpdated(1, 0);
        await tx14.wait();

        let tx15 = await ema.update(1);
        await tx15.wait();

        let tx16 = await comparator.setLastUpdated(1, 0);
        await tx16.wait();

        let tx17 = await comparator.checkConditions(1);
        await tx17.wait();

        let tx18 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx18.wait();

        let tx19 = await latestPrice.setLastUpdated(1, 0);
        await tx19.wait();

        let tx20 = await latestPrice.update(1);
        await tx20.wait();

        let tx21 = await ema.setLastUpdated(1, 0);
        await tx21.wait();

        let tx22 = await ema.update(1);
        await tx22.wait();

        let tx23 = await comparator.setLastUpdated(1, 0);
        await tx23.wait();

        let tx24 = await comparator.checkConditions(1);
        await tx24.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.true;
    });
  });
});