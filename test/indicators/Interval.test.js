const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("Interval", () => {
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
    IndicatorFactory = await ethers.getContractFactory('TestInterval');

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
      let tx = indicator.connect(otherUser).createInstance("BTC", 1, 1, [parseEther("1"), 1]);
      await expect(tx).to.be.reverted;
    });

    it("not enough params, 0", async () => {
        let tx = indicator.createInstance("BTC", 1, 1, []);
        await expect(tx).to.be.reverted;
    });

    it("not enough params, 1", async () => {
        let tx = indicator.createInstance("BTC", 1, 1, [parseEther("1")]);
        await expect(tx).to.be.reverted;
    });

    it("first param out of bounds", async () => {
        let tx = indicator.createInstance("BTC", 1, 1, [parseEther("100000000"), 1]);
        await expect(tx).to.be.reverted;
    });

    it("second param out of bounds", async () => {
        let tx = indicator.createInstance("BTC", 1, 1, [parseEther("100"), 10]);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await indicator.createInstance("BTC", 1, 1, [parseEther("10000"), 1]);
        await tx.wait();

        let value = await indicator.getValue(1);
        expect(value.length).to.equal(1);
        expect(value[0]).to.equal(0);

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(0);

        let indicatorTimeframe = await indicator.indicatorTimeframe(1);
        expect(indicatorTimeframe).to.equal(1);

        let canUpdate = await indicator.canUpdate(1);
        expect(canUpdate).to.be.true;

        let isActive = await indicator.isActive(1);
        expect(isActive).to.be.false;

        let state = await indicator.getState(1);
        expect(state[0]).to.equal("BTC");
        expect(state[1]).to.equal(1);
        expect(state[2]).to.equal(0);
        expect(state[3].length).to.equal(2);
        expect(state[3][0]).to.equal(parseEther("10000"));
        expect(state[3][1]).to.equal(1);
        expect(state[4].length).to.equal(0);
        expect(state[5].length).to.equal(0);
    });
  });

  describe("#update", () => {
    it("onlyDedicatedKeeper", async () => {
      let tx = await indicator.setKeeper(1, otherUser.address);
      await tx.wait();

      let tx2 = await indicator.createInstance("BTC", 1, 1, [parseEther("10000"), 1]);
      await tx2.wait();

      let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("13256.19"));
      await tx3.wait();

      let tx4 = indicator.update(1);
      await expect(tx4).to.be.reverted;

      let lastUpdated = await indicator.lastUpdated(1);
      expect(lastUpdated).to.equal(0);
    });

    it("meets requirements, round down", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await indicator.createInstance("BTC", 1, 1, [parseEther("10000"), 1]);
        await tx2.wait();

        let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("13256.19"));
        await tx3.wait();

        let currentTime = await candlestickDataFeedRegistry.getCurrentTimestamp();

        let tx4 = await indicator.update(1);
        await tx4.wait();

        let lastUpdated = await indicator.lastUpdated(1);
        expect(lastUpdated).to.equal(Number(currentTime) + 1);

        let isActive = await indicator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await indicator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(1);
        expect(history[0]).to.equal(parseEther("10000"));

        let value = await indicator.getValue(1);
        expect(value.length).to.equal(1);
        expect(value[0]).to.equal(parseEther("10000"));
    });

    it("meets requirements, round up", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await indicator.createInstance("BTC", 1, 1, [parseEther("10000"), 0]);
        await tx2.wait();

        let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("13256.19"));
        await tx3.wait();

        let currentTime = await candlestickDataFeedRegistry.getCurrentTimestamp();

        let tx4 = await indicator.update(1);
        await tx4.wait();

        let lastUpdated = await indicator.lastUpdated(1);
        expect(lastUpdated).to.equal(Number(currentTime) + 1);

        let isActive = await indicator.isActive(1);
        expect(isActive).to.be.true;

        let canUpdate = await indicator.canUpdate(1);
        expect(canUpdate).to.be.false;

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(1);
        expect(history[0]).to.equal(parseEther("20000"));

        let value = await indicator.getValue(1);
        expect(value.length).to.equal(1);
        expect(value[0]).to.equal(parseEther("20000"));
    });

    it("update multiple times, round down", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await indicator.createInstance("BTC", 1, 1, [parseEther("10000"), 1]);
        await tx2.wait();

        let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("13256.19"));
        await tx3.wait();

        let tx4 = await indicator.update(1);
        await tx4.wait();

        let tx5 = await indicator.setLastUpdated(1, 0);
        await tx5.wait();

        let tx6 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("18726.394749"));
        await tx6.wait();

        let tx7 = await indicator.update(1);
        await tx7.wait();

        let tx8 = await indicator.setLastUpdated(1, 0);
        await tx8.wait();

        let tx9 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("20981"));
        await tx9.wait();

        let tx10 = await indicator.update(1);
        await tx10.wait();

        let tx11 = await indicator.setLastUpdated(1, 0);
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("19381"));
        await tx12.wait();

        let tx13 = await indicator.update(1);
        await tx13.wait();

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(4);
        expect(history[0]).to.equal(parseEther("10000"));
        expect(history[1]).to.equal(parseEther("10000"));
        expect(history[2]).to.equal(parseEther("20000"));
        expect(history[3]).to.equal(parseEther("10000"));

        let value = await indicator.getValue(1);
        expect(value.length).to.equal(1);
        expect(value[0]).to.equal(parseEther("10000"));
    });

    it("update multiple times, round up", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await indicator.createInstance("BTC", 1, 1, [parseEther("1000"), 0]);
        await tx2.wait();

        let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("13256.19"));
        await tx3.wait();

        let tx4 = await indicator.update(1);
        await tx4.wait();

        let tx5 = await indicator.setLastUpdated(1, 0);
        await tx5.wait();

        let tx6 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("18726.394749"));
        await tx6.wait();

        let tx7 = await indicator.update(1);
        await tx7.wait();

        let tx8 = await indicator.setLastUpdated(1, 0);
        await tx8.wait();

        let tx9 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("20981"));
        await tx9.wait();

        let tx10 = await indicator.update(1);
        await tx10.wait();

        let tx11 = await indicator.setLastUpdated(1, 0);
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("9381"));
        await tx12.wait();

        let tx13 = await indicator.update(1);
        await tx13.wait();

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(4);
        expect(history[0]).to.equal(parseEther("14000"));
        expect(history[1]).to.equal(parseEther("19000"));
        expect(history[2]).to.equal(parseEther("21000"));
        expect(history[3]).to.equal(parseEther("10000"));

        let value = await indicator.getValue(1);
        expect(value.length).to.equal(1);
        expect(value[0]).to.equal(parseEther("10000"));
    });

    it("update more than MAX_HISTORY_LENGTH times", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();

        let tx2 = await indicator.createInstance("BTC", 1, 1, [parseEther("100"), 1]);
        await tx2.wait();

        for (let i = 0; i < 25; i++) {
            let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther((30113 + (i * 100)).toString()));
            await tx3.wait();

            let tx4 = await indicator.update(1);
            await tx4.wait();

            let tx5 = await indicator.setLastUpdated(1, 0);
            await tx5.wait();
        }

        let history = await indicator.getHistory(1);
        expect(history.length).to.equal(20);
        expect(history[1]).to.equal(parseEther("30700"));
        expect(history[19]).to.equal(parseEther("32500"));
    });

    it("multiple instances", async () => {
        let tx = await indicator.setKeeper(1, deployer.address);
        await tx.wait();
  
        let tx2 = await indicator.setKeeper(2, deployer.address);
        await tx2.wait();
  
        let tx3 = await indicator.createInstance("BTC", 1, 1, [parseEther("1000"), 1]);
        await tx3.wait();
  
        let tx4 = await indicator.createInstance("ETH", 5, 5, [parseEther("5"), 0]);
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("13748"));
        await tx5.wait();

        let tx6 = await candlestickDataFeedRegistry.setPrice("ETH", 5, parseEther("2984"));
        await tx6.wait();
  
        let tx7 = await indicator.update(1);
        await tx7.wait();
  
        let isActive = await indicator.isActive(2);
        expect(isActive).to.be.false;
  
        let canUpdate = await indicator.canUpdate(2);
        expect(canUpdate).to.be.true;
  
        let tx8 = await indicator.update(2);
        await tx8.wait();
        
        let isActive2 = await indicator.isActive(2);
        expect(isActive2).to.be.true;
  
        let canUpdate2 = await indicator.canUpdate(2);
        expect(canUpdate2).to.be.false;
        
        let value = await indicator.getValue(1);
        expect(value[0]).to.equal(parseEther("13000"));
        
        let value2 = await indicator.getValue(2);
        expect(value2[0]).to.equal(parseEther("2985"));
    });

    it("not ready to update", async () => {
      let tx = await indicator.setKeeper(1, deployer.address);
      await tx.wait();

      let tx2 = await indicator.createInstance("BTC", 1, 1, [parseEther("150"), 1]);
      await tx2.wait();

      let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("14851"));
      await tx3.wait();

      let tx4 = await indicator.update(1);
      await tx4.wait();

      let tx5 = indicator.update(1);
      await expect(tx5).to.be.reverted;

      let history = await indicator.getHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(parseEther("14850"));
    });
  });
});*/