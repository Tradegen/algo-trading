const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("TradingBot", () => {
  let deployer;
  let otherUser;

  let tradingBot;
  let tradingBotAddress;
  let TradingBotFactory;

  let dataFeed;
  let dataFeedAddress;
  let DataFeedFactory;

  let componentsRegistry;
  let componentsRegistryAddress;
  let ComponentsRegistryFactory;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TradingBotFactory = await ethers.getContractFactory('TestTradingBot2');
    DataFeedFactory = await ethers.getContractFactory('TestBotPerformanceDataFeed');
    ComponentsRegistryFactory = await ethers.getContractFactory('TestComponentsRegistry');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');
  });

  beforeEach(async () => {
    componentsRegistry = await ComponentsRegistryFactory.deploy();
    await componentsRegistry.deployed();
    componentsRegistryAddress = componentsRegistry.address;

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

        dataFeed = await DataFeedFactory.deploy();
        await dataFeed.deployed();
        dataFeedAddress = dataFeed.address;

        tradingBot = await TradingBotFactory.deploy(deployer.address, componentsRegistryAddress, candlestickDataFeedRegistryAddress, deployer.address, deployer.address, deployer.address);
        await tradingBot.deployed();
        tradingBotAddress = tradingBot.address;
  });
  
  describe("#setInitialRules", () => {
    it("only trading bot registry", async () => {
      let tx = tradingBot.connect(otherUser).setInitialRules([1], [1], [1], [1]);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let entryRuleComponents = await tradingBot.entryRuleComponents(0);
        expect(entryRuleComponents).to.equal(1);

        let setRules = await tradingBot.setRules();
        expect(setRules).to.be.true;
    });

    it("already set rules", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = tradingBot.setInitialRules([2], [1], [1], [1]);
        await expect(tx2).to.be.reverted;
    });
  });
  
  describe("#updateOwner", () => {
    it("only trading bots NFT contract", async () => {
      let tx = tradingBot.connect(otherUser).updateOwner(otherUser.address)
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.updateOwner(otherUser.address)
        await tx.wait();

        let owner = await tradingBot.owner();
        expect(owner).to.equal(otherUser.address);

        let operator = await tradingBot.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });
  
  describe("#initialize", () => {
    it("only trading bot registry", async () => {
        let tx = tradingBot.connect(otherUser).initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await expect(tx).to.be.reverted;

        let name = await tradingBot.name();
        expect(name).to.equal("");

        let symbol = await tradingBot.symbol();
        expect(symbol).to.equal("");
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx.wait();

        let name = await tradingBot.name();
        expect(name).to.equal("Mock trading bot");

        let symbol = await tradingBot.symbol();
        expect(symbol).to.equal("BOT");

        let params = await tradingBot.getTradingBotParameters();
        expect(params[0]).to.equal(1);
        expect(params[1]).to.equal(5);
        expect(params[2]).to.equal(1000);
        expect(params[3]).to.equal(1000);
        expect(params[4]).to.equal("BTC");
        expect(params[5]).to.equal(5);
    });
  });
  
  describe("#setKeeper", () => {
    it("only keeper registry", async () => {
        let tx = tradingBot.connect(otherUser).setKeeper(otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.setKeeper(otherUser.address);
        await tx.wait();

        let keeper = await tradingBot.keeper();
        expect(keeper).to.equal(otherUser.address);
    });
  });
  
  describe("#setOperator", () => {
    it("only operator", async () => {
        let tx = tradingBot.connect(otherUser).setOperator(otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.setOperator(otherUser.address);
        await tx.wait();

        let operator = await tradingBot.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });
  
  describe("#setDataFeed", () => {
    it("only trading bot registry", async () => {
        let tx = tradingBot.connect(otherUser).setDataFeed(otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.setDataFeed(otherUser.address);
        await tx.wait();

        let dataFeed = await tradingBot.dataFeed();
        expect(dataFeed).to.equal(otherUser.address);
    });
  });
  
  describe("#updateStopLoss", () => {
    it("only operator", async () => {
        let tx = tradingBot.connect(otherUser).updateStopLoss(1000);
        await expect(tx).to.be.reverted;
    });

    it("out of bounds", async () => {
        let tx = tradingBot.updateStopLoss(100000);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.updateStopLoss(1000);
        await tx.wait();

        let params = await tradingBot.getTradingBotParameters();
        expect(params[3]).to.equal(1000);
    });
  });
  
  describe("#updateProfitTarget", () => {
    it("only operator", async () => {
        let tx = tradingBot.connect(otherUser).updateProfitTarget(1000);
        await expect(tx).to.be.reverted;
    });

    it("out of bounds", async () => {
        let tx = tradingBot.updateProfitTarget(500000);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.updateProfitTarget(1000);
        await tx.wait();

        let params = await tradingBot.getTradingBotParameters();
        expect(params[2]).to.equal(1000);
    });
  });
  
  describe("#updateMaxTradeDuration", () => {
    it("only operator", async () => {
        let tx = tradingBot.connect(otherUser).updateMaxTradeDuration(10);
        await expect(tx).to.be.reverted;
    });

    it("out of bounds", async () => {
        let tx = tradingBot.updateMaxTradeDuration(100000);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.updateMaxTradeDuration(10);
        await tx.wait();

        let params = await tradingBot.getTradingBotParameters();
        expect(params[1]).to.equal(10);
    });
  });
  
  describe("#updateTimeframe", () => {
    it("only operator", async () => {
        let tx = tradingBot.connect(otherUser).updateTimeframe(5);
        await expect(tx).to.be.reverted;
    });

    it("out of bounds", async () => {
        let tx = tradingBot.updateTimeframe(100000);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBot.updateTimeframe(5);
        await tx.wait();

        let params = await tradingBot.getTradingBotParameters();
        expect(params[0]).to.equal(5);
    });
  });
  
  describe("#updateTradedAsset", () => {
    it("only operator", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1"));
        await tx.wait();

        let tx2 = tradingBot.connect(otherUser).updateTradedAsset("BTC", 1);
        await expect(tx2).to.be.reverted;
    });

    it("asset does not have a data feed", async () => {
        let tx = tradingBot.updateTradedAsset("BTC", 1);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("1"));
        await tx.wait();

        let tx2 = await tradingBot.updateTradedAsset("BTC", 1);
        await tx2.wait();

        let params = await tradingBot.getTradingBotParameters();
        expect(params[4]).to.equal("BTC");
        expect(params[5]).to.equal(1);
    });
  });
  
  describe("#addRule", () => {
    it("only operator", async () => {
        let tx = await componentsRegistry.setHasPurchasedComponentInstance(deployer.address, 1, 1, true);
        await tx.wait();

        let tx2 = tradingBot.connect(otherUser).addRule(true, 1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("owner has not purchased the component instance", async () => {
        let tx = tradingBot.connect(otherUser).addRule(true, 1, 1);
        await expect(tx).to.be.reverted;
    });

    it("already have max entry rules", async () => {
        let tx = await tradingBot.setInitialRules([1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7], [1], [1]);
        await tx.wait();

        let tx2 = tradingBot.connect(otherUser).addRule(true, 1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("already have max exit rules", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7]);
        await tx.wait();

        let tx2 = tradingBot.connect(otherUser).addRule(true, 1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("meets requirements; entry rule", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = await componentsRegistry.setHasPurchasedComponentInstance(deployer.address, 2, 2, true);
        await tx2.wait();

        let tx3 = await tradingBot.addRule(true, 2, 2);
        await tx3.wait();

        let entryRuleComponents0 = await tradingBot.entryRuleComponents(0);
        expect(entryRuleComponents0).to.equal(1);

        let entryRuleComponents1 = await tradingBot.entryRuleComponents(1);
        expect(entryRuleComponents1).to.equal(2);

        let entryRuleInstances0 = await tradingBot.entryRuleInstances(0);
        expect(entryRuleInstances0).to.equal(1);

        let entryRuleInstances1 = await tradingBot.entryRuleInstances(1);
        expect(entryRuleInstances1).to.equal(2);
    });

    it("meets requirements; exit rule", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = await componentsRegistry.setHasPurchasedComponentInstance(deployer.address, 2, 2, true);
        await tx2.wait();

        let tx3 = await tradingBot.addRule(false, 2, 2);
        await tx3.wait();

        let exitRuleComponents0 = await tradingBot.exitRuleComponents(0);
        expect(exitRuleComponents0).to.equal(1);

        let exitRuleComponents1 = await tradingBot.exitRuleComponents(1);
        expect(exitRuleComponents1).to.equal(2);

        let exitRuleInstances0 = await tradingBot.exitRuleInstances(0);
        expect(exitRuleInstances0).to.equal(1);

        let exitRuleInstances1 = await tradingBot.exitRuleInstances(1);
        expect(exitRuleInstances1).to.equal(2);
    });
  });
  
  describe("#removeRule", () => {
    it("only operator", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = tradingBot.connect(otherUser).removeRule(true, 1);
        await expect(tx2).to.be.reverted;
    });

    it("index out of bounds", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = tradingBot.removeRule(true, 8);
        await expect(tx2).to.be.reverted;
    });

    it("meets requirements; entry rule", async () => {
        let tx = await tradingBot.setInitialRules([1, 2, 3], [1, 2, 3], [1], [1]);
        await tx.wait();

        let tx2 = await tradingBot.removeRule(true, 1);
        await tx2.wait();

        let entryRuleComponents0 = await tradingBot.entryRuleComponents(0);
        expect(entryRuleComponents0).to.equal(1);

        let entryRuleComponents1 = await tradingBot.entryRuleComponents(1);
        expect(entryRuleComponents1).to.equal(3);

        let entryRuleInstances0 = await tradingBot.entryRuleInstances(0);
        expect(entryRuleInstances0).to.equal(1);

        let entryRuleInstances1 = await tradingBot.entryRuleInstances(1);
        expect(entryRuleInstances1).to.equal(3);
    });

    it("meets requirements; entry rule", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1, 2, 3], [1, 2, 3]);
        await tx.wait();

        let tx2 = await tradingBot.removeRule(false, 1);
        await tx2.wait();

        let exitRuleComponents0 = await tradingBot.exitRuleComponents(0);
        expect(exitRuleComponents0).to.equal(1);

        let exitRuleComponents1 = await tradingBot.exitRuleComponents(1);
        expect(exitRuleComponents1).to.equal(3);

        let exitRuleInstances0 = await tradingBot.exitRuleInstances(0);
        expect(exitRuleInstances0).to.equal(1);

        let exitRuleInstances1 = await tradingBot.exitRuleInstances(1);
        expect(exitRuleInstances1).to.equal(3);
    });
  });
  
  describe("#replaceRule", () => {
    it("only operator", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = await componentsRegistry.setHasPurchasedComponentInstance(deployer.address, 2, 2, true);
        await tx2.wait();

        let tx3 = tradingBot.connect(otherUser).replaceRule(true, 1, 2, 2);
        await expect(tx3).to.be.reverted;

        let entryRuleComponents0 = await tradingBot.entryRuleComponents(0);
        expect(entryRuleComponents0).to.equal(1);

        let entryRuleInstances0 = await tradingBot.entryRuleInstances(0);
        expect(entryRuleInstances0).to.equal(1);
    });

    it("owner has not purchased component instance", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = tradingBot.replaceRule(true, 0, 2, 2);
        await expect(tx2).to.be.reverted;

        let entryRuleComponents0 = await tradingBot.entryRuleComponents(0);
        expect(entryRuleComponents0).to.equal(1);

        let entryRuleInstances0 = await tradingBot.entryRuleInstances(0);
        expect(entryRuleInstances0).to.equal(1);
    });

    it("index out of bounds", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = await componentsRegistry.setHasPurchasedComponentInstance(deployer.address, 2, 2, true);
        await tx2.wait();

        let tx3 = tradingBot.replaceRule(true, 10, 2, 2);
        await expect(tx3).to.be.reverted;
    });

    it("meets requirements; entry rule", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = await componentsRegistry.setHasPurchasedComponentInstance(deployer.address, 2, 2, true);
        await tx2.wait();

        let tx3 = await tradingBot.replaceRule(true, 0, 2, 2);
        await tx3.wait();

        let entryRuleComponents0 = await tradingBot.entryRuleComponents(0);
        expect(entryRuleComponents0).to.equal(2);

        let entryRuleInstances0 = await tradingBot.entryRuleInstances(0);
        expect(entryRuleInstances0).to.equal(2);
    });

    it("meets requirements; exit rule", async () => {
        let tx = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx.wait();

        let tx2 = await componentsRegistry.setHasPurchasedComponentInstance(deployer.address, 2, 2, true);
        await tx2.wait();

        let tx3 = await tradingBot.replaceRule(false, 0, 2, 2);
        await tx3.wait();

        let exitRuleComponents0 = await tradingBot.exitRuleComponents(0);
        expect(exitRuleComponents0).to.equal(2);

        let exitRuleInstances0 = await tradingBot.exitRuleInstances(0);
        expect(exitRuleInstances0).to.equal(2);
    });
  });
  
  describe("#update", () => {
    it("only keeper", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = tradingBot.connect(otherUser).update();
        await expect(tx5).to.be.reverted;
    });

    it("not ready to update", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        //let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        //await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1], [1], [1], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = tradingBot.update();
        await expect(tx5).to.be.reverted;
    });

    it("not in trade, fails entry rules", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [1], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, false);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(1);

        // Check that the data feed was not updated.
        let index = await dataFeed.updatedIndex();
        expect(index).to.equal(0);

        let state = await tradingBot.getState();
        expect(state[0]).to.be.false;
        expect(state[1]).to.equal(0);
        expect(state[2]).to.equal(0);
    });

    it("not in trade, meets entry rules", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [1], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(1);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        expect(index).to.equal(1);

        let state = await tradingBot.getState();
        expect(state[0]).to.be.true;
        expect(state[1]).to.equal(parseEther("10"));
        expect(state[2]).to.equal(1);
    });

    it("in trade, meets entry rules", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [1], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let canUpdate = await tradingBot.canUpdate();
        expect(canUpdate).to.be.false;

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(1);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        expect(index).to.equal(1);

        let state = await tradingBot.getState();
        expect(state[0]).to.be.true;
        expect(state[1]).to.equal(parseEther("10"));
        expect(state[2]).to.equal(1);
    });

    it("in trade, meets profit target", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [1], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let tx10 = await tradingBot.resetLastUpdatedTimestamp();
        await tx10.wait();

        let tx11 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("15"));
        await tx11.wait();

        let tx12 = await tradingBot.update();
        await tx12.wait();

        let canUpdate = await tradingBot.canUpdate();
        expect(canUpdate).to.be.false;

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        let lastPrice = await dataFeed.lastPrice();
        expect(index).to.equal(2);
        expect(lastPrice).to.equal(parseEther("11"));

        let state = await tradingBot.getState();
        expect(state[0]).to.be.false;
        expect(state[1]).to.equal(parseEther("10"));
        expect(state[2]).to.equal(1);
    });

    it("in trade, meets stop loss", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [1], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let tx10 = await tradingBot.resetLastUpdatedTimestamp();
        await tx10.wait();

        let tx11 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("5"));
        await tx11.wait();

        let tx12 = await tradingBot.update();
        await tx12.wait();

        let canUpdate = await tradingBot.canUpdate();
        expect(canUpdate).to.be.false;

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        let lastPrice = await dataFeed.lastPrice();
        expect(index).to.equal(2);
        expect(lastPrice).to.equal(parseEther("9"));

        let state = await tradingBot.getState();
        expect(state[0]).to.be.false;
        expect(state[1]).to.equal(parseEther("10"));
        expect(state[2]).to.equal(1);
    });

    it("in trade, meets max trade duration", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [4], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 3, 7000, 7000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let tx10 = await tradingBot.resetLastUpdatedTimestamp();
        await tx10.wait();

        let tx11 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("15"));
        await tx11.wait();

        let tx12 = await tradingBot.update();
        await tx12.wait();

        let tx13 = await tradingBot.resetLastUpdatedTimestamp();
        await tx13.wait();

        let tx14 = await tradingBot.update();
        await tx14.wait();

        let tx15 = await tradingBot.resetLastUpdatedTimestamp();
        await tx15.wait();

        let tx16 = await tradingBot.update();
        await tx16.wait();

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(4);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        let lastPrice = await dataFeed.lastPrice();
        expect(index).to.equal(2);
        expect(lastPrice).to.equal(parseEther("15"));

        let state = await tradingBot.getState();
        expect(state[0]).to.be.false;
        expect(state[1]).to.equal(parseEther("10"));
        expect(state[2]).to.equal(1);
    });

    it("in trade, meets exit rules", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [4], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let tx10 = await componentsRegistry.setMeetsConditions(4, 1, true);
        await tx10.wait();

        let tx11 = await tradingBot.resetLastUpdatedTimestamp();
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10.1"));
        await tx12.wait();

        let tx13 = await tradingBot.update();
        await tx13.wait();

        let canUpdate = await tradingBot.canUpdate();
        expect(canUpdate).to.be.false;

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        let lastPrice = await dataFeed.lastPrice();
        expect(index).to.equal(2);
        expect(lastPrice).to.equal(parseEther("10.1"));

        let state = await tradingBot.getState();
        expect(state[0]).to.be.false;
        expect(state[1]).to.equal(parseEther("10"));
        expect(state[2]).to.equal(1);
    });

    it("in trade, do nothing", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [4], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let tx10 = await componentsRegistry.setMeetsConditions(4, 1, false);
        await tx10.wait();

        let tx11 = await tradingBot.resetLastUpdatedTimestamp();
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10.1"));
        await tx12.wait();

        let tx13 = await tradingBot.update();
        await tx13.wait();

        let canUpdate = await tradingBot.canUpdate();
        expect(canUpdate).to.be.false;

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        let lastPrice = await dataFeed.lastPrice();
        expect(index).to.equal(1);
        expect(lastPrice).to.equal(parseEther("10"));

        let state = await tradingBot.getState();
        expect(state[0]).to.be.true;
        expect(state[1]).to.equal(parseEther("10"));
        expect(state[2]).to.equal(1);
    });

    it("in trade, meets exit rules, enter new trade", async () => {
        let tx = await tradingBot.setKeeper(deployer.address);
        await tx.wait();

        let tx2 = await tradingBot.setDataFeed(dataFeedAddress);
        await tx2.wait();

        let tx3 = await tradingBot.setInitialRules([1, 2, 3], [1, 1, 1], [4], [1]);
        await tx3.wait();

        let tx4 = await tradingBot.initialize("Mock trading bot", "BOT", 1, 5, 1000, 1000, "BTC", 5);
        await tx4.wait();

        let tx5 = await componentsRegistry.setMeetsConditions(1, 1, true);
        await tx5.wait();

        let tx6 = await componentsRegistry.setMeetsConditions(2, 1, true);
        await tx6.wait();

        let tx7 = await componentsRegistry.setMeetsConditions(3, 1, true);
        await tx7.wait();

        let tx8 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx8.wait();

        let tx9 = await tradingBot.update();
        await tx9.wait();

        let tx10 = await componentsRegistry.setMeetsConditions(4, 1, true);
        await tx10.wait();

        let tx11 = await tradingBot.resetLastUpdatedTimestamp();
        await tx11.wait();

        let tx12 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10.1"));
        await tx12.wait();

        let tx13 = await tradingBot.update();
        await tx13.wait();

        let tx14 = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("11"));
        await tx14.wait();

        let tx15 = await tradingBot.resetLastUpdatedTimestamp();
        await tx15.wait();

        let tx16 = await tradingBot.update();
        await tx16.wait();

        let canUpdate = await tradingBot.canUpdate();
        expect(canUpdate).to.be.false;

        let numberOfUpdates = await tradingBot.numberOfUpdates();
        expect(numberOfUpdates).to.equal(3);

        // Check that the data feed was updated.
        let index = await dataFeed.updatedIndex();
        let lastPrice = await dataFeed.lastPrice();
        expect(index).to.equal(3);
        expect(lastPrice).to.equal(parseEther("11"));

        let state = await tradingBot.getState();
        expect(state[0]).to.be.true;
        expect(state[1]).to.equal(parseEther("11"));
        expect(state[2]).to.equal(3);
    });
  });
});*/