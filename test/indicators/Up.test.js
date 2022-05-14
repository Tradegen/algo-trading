const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("Up", () => {
  let deployer;
  let otherUser;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let indicator;
  let indicatorAddress;
  let IndicatorFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');
    IndicatorFactory = await ethers.getContractFactory('Up');

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;
  });

  beforeEach(async () => {
    indicator = await IndicatorFactory.deploy(deployer.address, candlestickDataFeedRegistryAddress, deployer.address);
    await indicator.deployed();
    indicatorAddress = indicator.address;
  });
  
  describe("#setKeeper", () => {
    it("onlyKeeperRegistry", async () => {
      let tx = indicator.connect(otherUser).setKeeper(1, otherUser.address);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await indicator.setKeeper(1, otherUser.address);
        await tx.wait();

        let keeper = await indicator.keepers(1);
        expect(keeper).to.equal(otherUser.address);
    });
  });

  describe("#createInstance", () => {
    it("onlyComponentRegistry", async () => {
      let tx = indicator.connect(otherUser).createInstance("BTC", 1, 1, []);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await indicator.createInstance("BTC", 1, 1, []);
        await tx.wait();

        let value = await indicator.getValue(1);
        expect(value.length).to.equal(1);
        expect(value[0]).to.equal(1);

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(1);
        expect(history[0]).to.equal(1);

        let indicatorTimeframe = await indicator.indicatorTimeframe(1);
        expect(indicatorTimeframe).to.equal(1);

        let canUpdate = await indicator.canUpdate(1);
        expect(canUpdate).to.be.true;

        let isActive = await indicator.isActive(1);
        expect(isActive).to.be.false;

        let state = await indicator.getState(1);
        expect(state[0]).to.equal("BTC");
        expect(state[1]).to.equal(1);
        expect(state[2]).to.equal(1);
        expect(state[3].length).to.equal(0);
        expect(state[4].length).to.equal(0);
        expect(state[5].length).to.equal(0);
    });
  });

  describe("#update", () => {
    it("onlyDedicatedKeeper", async () => {
      let tx = await indicator.setKeeper(1, otherUser.address);
      await tx.wait();

      let tx2 = await indicator.createInstance("BTC", 1, 1, []);
      await tx2.wait();

      let tx3 = indicator.update(1);
      await expect(tx3).to.be.reverted;

      let lastUpdated = await indicator.lastUpdated(1);
      expect(lastUpdated).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await indicator.createInstance("BTC", 1, 1, []);
        await tx2.wait();

        let currentTime = await candlestickDataFeedRegistry.getCurrentTimestamp();

        let tx3 = await indicator.update(1);
        await tx3.wait();

        let lastUpdated = await indicator.lastUpdated(1);
        expect(lastUpdated).to.equal(Number(currentTime) + 1);

        let isActive = await indicator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await indicator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(1);
        expect(history[0]).to.equal(1);
    });

    it("multiple instances", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();
  
        let tx2 = await indicator.setKeeper(2, deployer.address);
        await tx2.wait();
  
        let tx3 = await indicator.createInstance("BTC", 1, 1, []);
        await tx3.wait();
  
        let tx4 = await indicator.createInstance("ETH", 5, 5, []);
        await tx4.wait();
  
        let tx5 = await indicator.update(1);
        await tx5.wait();
  
        let isActive = await indicator.isActive(2);
        expect(isActive).to.be.false;
  
        let canUpdate = await indicator.canUpdate(2);
        expect(canUpdate).to.be.true;
  
        let tx6 = await indicator.update(2);
        await tx6.wait();
  
        let isActive2 = await indicator.isActive(2);
        expect(isActive2).to.be.true;
  
        let canUpdate2 = await indicator.canUpdate(2);
        expect(canUpdate2).to.be.false;
    });

    it("not ready to update", async () => {
      let tx = await indicator.setKeeper(1, deployer.address);
      await tx.wait();

      let tx2 = await indicator.createInstance("BTC", 1, 1, []);
      await tx2.wait();

      let tx3 = await indicator.update(1);
      await tx3.wait();

      let tx4 = indicator.update(1);
      await expect(tx4).to.be.reverted;

      let history = await indicator.getHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(1);
    });
  });
});*/