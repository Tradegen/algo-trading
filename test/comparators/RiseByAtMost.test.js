const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("RiseByAtMost", () => {
  let deployer;
  let otherUser;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let latestPrice;
  let latestPriceAddress;
  let LatestPriceFactory;

  let nPercent;
  let nPercentAddress;
  let NPercentFactory;

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
    PreviousNPriceUpdatesFactory = await ethers.getContractFactory('TestPreviousNPriceUpdates');
    NPercentFactory = await ethers.getContractFactory('TestNPercent');
    ComparatorFactory = await ethers.getContractFactory('TestRiseByAtMost');

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;
  });

  beforeEach(async () => {
    latestPrice = await LatestPriceFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await latestPrice.deployed();
    latestPriceAddress = latestPrice.address;

    previousNPriceUpdates = await PreviousNPriceUpdatesFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await previousNPriceUpdates.deployed();
    previousNPriceUpdatesAddress = previousNPriceUpdates.address;

    nPercent = await NPercentFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await nPercent.deployed();
    nPercentAddress = nPercent.address;

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
      let tx = comparator.connect(otherUser).createInstance(latestPriceAddress, latestPriceAddress, 1, 1);
      await expect(tx).to.be.reverted;
    });

    it("indicators are the same", async () => {
        let tx = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx.wait();

        let tx2 = comparator.createInstance(latestPriceAddress, latestPriceAddress, 1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("invalid timeframe", async () => {
        let tx = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx2.wait();

        let tx3 = comparator.createInstance(latestPriceAddress, nPercentAddress, 2, 2);
        await expect(tx3).to.be.reverted;
    });

    it("meets requirements; same timeframe", async () => {
        let tx = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx2.wait();

        let tx3 = await comparator.createInstance(latestPriceAddress, nPercentAddress, 1, 1);
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
        expect(state[1]).to.equal(nPercentAddress);
        expect(state[2]).to.equal(1);
        expect(state[3]).to.equal(1);
        expect(state[4].length).to.equal(1);
    });

    it("meets requirements; different timeframe", async () => {
        let tx = await nPercent.createInstance("BTC", 10, 10, [1000]);
        await tx.wait();

        let tx2 = await latestPrice.createInstance("BTC", 5, 5, []);
        await tx2.wait();

        let tx3 = await comparator.createInstance(latestPriceAddress, nPercentAddress, 1, 1);
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
        expect(state[1]).to.equal(nPercentAddress);
        expect(state[2]).to.equal(1);
        expect(state[3]).to.equal(1);
        expect(state[4].length).to.equal(1);
    });
  });

  describe("#checkConditions", () => {
    it("onlyDedicatedKeeper", async () => {
      let tx = await comparator.setKeeper(1, otherUser.address);
      await tx.wait();

      let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
      await tx2.wait();

        let tx3 = await latestPrice.createInstance("BTC", 5, 5, []);
        await tx3.wait();

        let tx4 = await comparator.createInstance(latestPriceAddress, nPercentAddress, 1, 1);
        await tx4.wait();

      let tx5 = comparator.checkConditions(1);
      await expect(tx5).to.be.reverted;

      let lastUpdated = await comparator.lastUpdated(1);
      expect(lastUpdated).to.equal(0);
    });

    it("One price history; one update; rose in value", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
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

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("800"));
    });

    it("One price history; multi update; fell in value", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let tx11 = await latestPrice.setLastUpdated(1, 0);
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("100"));
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

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("100"));
    });

    it("One price history; multi update; rose in value but too much", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let tx11 = await latestPrice.setLastUpdated(1, 0);
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("950"));
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

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("950"));
    });

    it("One price history; multi update; meets conditions", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await latestPrice.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await latestPrice.createInstance("BTC", 1, 1, []);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(latestPriceAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await latestPrice.update(1);
        await tx8.wait();

        let tx9 = await comparator.setKeeper(1, deployer.address);
        await tx9.wait();

        let tx10 = await comparator.checkConditions(1);
        await tx10.wait();

        let tx11 = await latestPrice.setLastUpdated(1, 0);
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("850"));
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
        expect(meetsConditions).to.be.true;

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("850"));
    });

    it("Multi price history; one update; fell in value", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("800"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("900"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("700"));
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

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("800"));
    });

    it("Multi price history; one update; rose in value but too much", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1050"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1250"));
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

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("1000"));
    });

    it("Multi price history; one update; meets conditions", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1250"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1050"));
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

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("1000"));
    });

    it("Multi price history; multi update; meets conditions then fall in value", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1150"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1050"));
        await tx13.wait();

        let tx14 = await previousNPriceUpdates.update(1);
        await tx14.wait();

        let tx15 = await comparator.setKeeper(1, deployer.address);
        await tx15.wait();

        let tx16 = await comparator.checkConditions(1);
        await tx16.wait();

        let tx17 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx17.wait();

        let tx18 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("900"));
        await tx18.wait();

        let tx19 = await previousNPriceUpdates.update(1);
        await tx19.wait();

        let tx20 = await comparator.setLastUpdated(1, 0);
        await tx20.wait();

        let tx21 = await comparator.checkConditions(1);
        await tx21.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("1150"));
    });

    it("Multi price history; multi update; meets conditions then rises but too much", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1130"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1050"));
        await tx13.wait();

        let tx14 = await previousNPriceUpdates.update(1);
        await tx14.wait();

        let tx15 = await comparator.setKeeper(1, deployer.address);
        await tx15.wait();

        let tx16 = await comparator.checkConditions(1);
        await tx16.wait();

        let tx17 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx17.wait();

        let tx18 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1340"));
        await tx18.wait();

        let tx19 = await previousNPriceUpdates.update(1);
        await tx19.wait();

        let tx20 = await comparator.setLastUpdated(1, 0);
        await tx20.wait();

        let tx21 = await comparator.checkConditions(1);
        await tx21.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions = await comparator.meetsConditions(1);
        expect(meetsConditions).to.be.false;

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("1130"));
    });

    it("Multi price history; multi update; meets conditions then fails then meets again", async () => {
        let tx = await nPercent.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await nPercent.createInstance("BTC", 1, 1, [1000]);
        await tx2.wait();

        let tx3 = await previousNPriceUpdates.setKeeper(1, deployer.address);
        await tx3.wait();

        let tx4 = await previousNPriceUpdates.createInstance("BTC", 1, 1, [3]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1000"));
        await tx5.wait();

        let tx6 = await comparator.createInstance(previousNPriceUpdatesAddress, nPercentAddress, 1, 1);
        await tx6.wait();

        let tx7 = await nPercent.update(1);
        await tx7.wait();

        let tx8 = await previousNPriceUpdates.update(1);
        await tx8.wait();

        let tx9 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx9.wait();

        let tx10 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1020"));
        await tx10.wait();

        let tx11 = await previousNPriceUpdates.update(1);
        await tx11.wait();

        let tx12 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx12.wait();

        let tx13 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1050"));
        await tx13.wait();

        let tx14 = await previousNPriceUpdates.update(1);
        await tx14.wait();

        let tx15 = await comparator.setKeeper(1, deployer.address);
        await tx15.wait();

        let tx16 = await comparator.checkConditions(1);
        await tx16.wait();

        let meetsConditions1 = await comparator.meetsConditions(1);
        expect(meetsConditions1).to.be.true;

        let tx17 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx17.wait();

        let tx18 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("980"));
        await tx18.wait();

        let tx19 = await previousNPriceUpdates.update(1);
        await tx19.wait();

        let tx20 = await comparator.setLastUpdated(1, 0);
        await tx20.wait();

        let tx21 = await comparator.checkConditions(1);
        await tx21.wait();

        let meetsConditions2 = await comparator.meetsConditions(1);
        expect(meetsConditions2).to.be.false;

        let tx22 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1100"));
        await tx22.wait();

        let tx23 = await previousNPriceUpdates.setLastUpdated(1, 0);
        await tx23.wait();

        let tx24 = await previousNPriceUpdates.update(1);
        await tx24.wait();

        let tx25 = await comparator.setLastUpdated(1, 0);
        await tx25.wait();

        let tx26 = await comparator.checkConditions(1);
        await tx26.wait();

        let isActive = await comparator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await comparator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let meetsConditions3 = await comparator.meetsConditions(1);
        expect(meetsConditions3).to.be.true;

        let state = await comparator.getState(1);
        expect(state[4][0]).to.equal(parseEther("1050"));
    });
  });
});*/