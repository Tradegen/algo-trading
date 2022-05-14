const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("IsBelow", () => {
  let deployer;
  let otherUser;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let latestPrice;
  let latestPriceAddress;
  let LatestPriceFactory;

  let interval;
  let intervalAddress;
  let IntervalFactory;

  let previousNPriceUpdates;
  let previousNPriceUpdatesAddress;
  let PreviousNPriceUpdatesFactory;

  let comparator;
  let comparatorAddress;
  let ComparatorFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');
    LatestPriceFactory = await ethers.getContractFactory('TestLatestPrice');
    IntervalFactory = await ethers.getContractFactory('TestInterval');
    PreviousNPriceUpdatesFactory = await ethers.getContractFactory('TestPreviousNPriceUpdates');
    ComparatorFactory = await ethers.getContractFactory('TestIsBelow');

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;
  });

  beforeEach(async () => {
    latestPrice = await LatestPriceFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await latestPrice.deployed();
    latestPriceAddress = latestPrice.address;

    interval = await IntervalFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await interval.deployed();
    intervalAddress = interval.address;

    previousNPriceUpdates = await PreviousNPriceUpdatesFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await previousNPriceUpdates.deployed();
    previousNPriceUpdatesAddress = previousNPriceUpdates.address;

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
      let tx = comparator.connect(otherUser).createInstance(latestPriceAddress, intervalAddress, 1, 1);
      await expect(tx).to.be.reverted;
    });

    it("indicators are the same", async () => {
        let tx = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx.wait();

        let tx2 = comparator.createInstance(latestPriceAddress, latestPriceAddress, 1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("invalid timeframe", async () => {
        let tx = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx2.wait();

        let tx3 = comparator.createInstance(latestPriceAddress, intervalAddress, 2, 2);
        await expect(tx3).to.be.reverted;
    });

    it("meets requirements; same timeframe", async () => {
        let tx = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx2.wait();

        let tx3 = await comparator.createInstance(latestPriceAddress, intervalAddress, 1, 1);
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
        expect(state[1]).to.equal(intervalAddress);
        expect(state[2]).to.equal(1);
        expect(state[3]).to.equal(1);
        expect(state[4].length).to.equal(0);
    });

    it("meets requirements; different timeframe", async () => {
        let tx = await interval.createInstance("BTC", 10, 10, [parseEther("1000"), 1]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 5, 5, []);
        await tx2.wait();

        let tx3 = await comparator.createInstance(latestPriceAddress, intervalAddress, 1, 1);
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
        expect(state[1]).to.equal(intervalAddress);
        expect(state[2]).to.equal(1);
        expect(state[3]).to.equal(1);
        expect(state[4].length).to.equal(0);
    });
  });

  describe("#checkConditions", () => {
    it("onlyDedicatedKeeper", async () => {
        let tx = await comparator.setKeeper(1, otherUser.address);
        await tx.wait();

        let tx2 = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx2.wait();

        let tx3 = await latestPrice.createInstance("BTC", 5, 5, []);
        await tx3.wait();

        let tx4 = await comparator.createInstance(latestPriceAddress, intervalAddress, 1, 1);
        await tx4.wait();

        let tx5 = comparator.checkConditions(1);
        await expect(tx5).to.be.reverted;

        let lastUpdated = await comparator.lastUpdated(1);
        expect(lastUpdated).to.equal(0);
    });

    it("One price history; one update; fails conditions", async () => {
        let tx = await interval.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, intervalAddress, 1, 1);
        await tx6.wait();

        let tx7 = await interval.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

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

    it("One price history; one update; meets conditions", async () => {
        let tx = await interval.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 0]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, intervalAddress, 1, 1);
        await tx6.wait();

        let tx7 = await interval.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let currentTime = await candlestickDataFeedRegistry.getCurrentTimestamp();

        let lastUpdated = await comparator.lastUpdated(1);
        expect(lastUpdated).to.equal(Number(currentTime));

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.true;

        let comparatorTimeframe = await comparator.comparatorTimeframe(1);
        expect(comparatorTimeframe).to.equal(1);
    });

    it("One price history; multi update; fails twice", async () => {
        let tx = await interval.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, intervalAddress, 1, 1);
        await tx6.wait();

        let tx7 = await interval.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let tx11 = await latestPrice.setLastUpdated(1, 0);
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1900"));
        await tx12.wait();

        let tx13 = await latestPrice.update(1);
        await tx13.wait();

        let tx14 = await comparator.setLastUpdated(1, 0);
        await tx14.wait();

        let tx15 = await comparator.checkConditions(1);
        await tx15.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;
    });

    it("Multi price history; one update; each value fails conditions", async () => {
        let tx = await interval.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, intervalAddress, 1, 1);
        await tx6.wait();

        let tx7 = await interval.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1900"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1950"));
        await tx13.wait();

        let tx14 = await previousNPriceUpdates.update(1);
        await tx14.wait();

        let tx15 = await comparator.setKeeper(1, deployer.address);
        await tx15.wait();

        let tx16 = await comparator.checkConditions(1);
        await tx16.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;
    });

    it("Multi price history; one update; one value fails conditions", async () => {
        let tx = await interval.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, intervalAddress, 1, 1);
        await tx6.wait();

        let tx7 = await interval.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("100"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("150"));
        await tx13.wait();

        let tx14 = await previousNPriceUpdates.update(1);
        await tx14.wait();

        let tx15 = await comparator.setKeeper(1, deployer.address);
        await tx15.wait();

        let tx16 = await comparator.checkConditions(1);
        await tx16.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;
    });

    it("Multi price history; one update; meets conditions", async () => {
        let tx = await interval.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await interval.createInstance("BTC", 1, 1, [parseEther("1000"), 0]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, intervalAddress, 1, 1);
        await tx6.wait();

        let tx7 = await interval.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1900"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1950"));
        await tx13.wait();

        let tx14 = await previousNPriceUpdates.update(1);
        await tx14.wait();

        let tx15 = await comparator.setKeeper(1, deployer.address);
        await tx15.wait();

        let tx16 = await comparator.checkConditions(1);
        await tx16.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.true;
    });
  });
});