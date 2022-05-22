const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("TradingBotRegistry", () => {
  let deployer;
  let otherUser;

  let tradingBot;
  let tradingBotAddress;
  let TradingBotFactory;

  let dataFeed;
  let dataFeedAddress;
  let DataFeedFactory;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let tradingBotRegistryRelayer;
  let tradingBotRegistryRelayerAddress;
  let TradingBotRegistryRelayerFactory;

  let botPerformanceDataFeedRegistry;
  let botPerformanceDataFeedRegistryAddress;
  let BotPerformanceDataFeedRegistryFactory;

  let tradingBotsNFT;
  let tradingBotsNFTAddress;
  let TradingBotsNFTFactory;

  let tradingBotFactoryContract;
  let tradingBotFactoryAddress;
  let TradingBotFactoryFactory;

  let componentsRegistry;
  let componentsRegistryAddress;
  let ComponentsRegistryFactory;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let tradingBotRegistry;
  let tradingBotRegistryAddress;
  let TradingBotRegistryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TradingBotFactory = await ethers.getContractFactory('TestTradingBot2');
    DataFeedFactory = await ethers.getContractFactory('TestBotPerformanceDataFeed');
    ComponentsRegistryFactory = await ethers.getContractFactory('TestComponentsRegistry');
    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');
    DataFeedFactory = await ethers.getContractFactory('TestBotPerformanceDataFeed');
    BotPerformanceDataFeedRegistryFactory = await ethers.getContractFactory('TestBotPerformanceDataFeedRegistry');
    TradingBotsNFTFactory = await ethers.getContractFactory('TradingBots');
    TradingBotFactoryFactory = await ethers.getContractFactory('TradingBotFactory');
    TradingBotRegistryFactory = await ethers.getContractFactory('TradingBotRegistry');
    TradingBotRegistryRelayerFactory = await ethers.getContractFactory('TestTradingBotRegistryRelayer');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    let tx = await feeToken.transfer(otherUser.address, parseEther("10000"));
    await tx.wait();
  });

  beforeEach(async () => {
        botPerformanceDataFeedRegistry = await BotPerformanceDataFeedRegistryFactory.deploy();
        await botPerformanceDataFeedRegistry.deployed();
        botPerformanceDataFeedRegistryAddress = botPerformanceDataFeedRegistry.address;

        tradingBotsNFT = await TradingBotsNFTFactory.deploy();
        await tradingBotsNFT.deployed();
        tradingBotsNFTAddress = tradingBotsNFT.address;

        componentsRegistry = await ComponentsRegistryFactory.deploy();
        await componentsRegistry.deployed();
        componentsRegistryAddress = componentsRegistry.address;

        candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
        await candlestickDataFeedRegistry.deployed();
        candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

        tradingBotFactoryContract = await TradingBotFactoryFactory.deploy(componentsRegistryAddress, candlestickDataFeedRegistryAddress, tradingBotsNFTAddress);
        await tradingBotFactoryContract.deployed();
        tradingBotFactoryAddress = tradingBotFactoryContract.address;

        dataFeed = await DataFeedFactory.deploy();
        await dataFeed.deployed();
        dataFeedAddress = dataFeed.address;

        // Use tradingBotsNFTAddress as xTGEN.
        tradingBotRegistry = await TradingBotRegistryFactory.deploy(tradingBotsNFTAddress, botPerformanceDataFeedRegistryAddress, componentsRegistryAddress, tradingBotFactoryAddress, candlestickDataFeedRegistryAddress, feeTokenAddress, tradingBotsNFTAddress);
        await tradingBotRegistry.deployed();
        tradingBotRegistryAddress = tradingBotRegistry.address;

        tradingBotRegistryRelayer = await TradingBotRegistryRelayerFactory.deploy(tradingBotRegistryAddress);
        await tradingBotRegistryRelayer.deployed();
        tradingBotRegistryRelayerAddress = tradingBotRegistryRelayer.address;

        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(tradingBotRegistryAddress);
        await tx.wait();

        let tx2 = await tradingBotFactoryContract.initializeContracts(tradingBotRegistryAddress, tradingBotsNFTAddress);
        await tx2.wait();
  });
  
  describe("#updateMintFee", () => {
    it("only operator", async () => {
      let tx = tradingBotRegistry.connect(otherUser).updateMintFee(parseEther("10"));
      await expect(tx).to.be.reverted;

      let mintFee = await tradingBotRegistry.MINT_FEE();
      expect(mintFee).to.equal(parseEther("100"));
    });

    it("meets requirements", async () => {
        let tx = await tradingBotRegistry.updateMintFee(parseEther("10"));
        await tx.wait();

        let mintFee = await tradingBotRegistry.MINT_FEE();
        expect(mintFee).to.equal(parseEther("10"));
    });
  });
  
  describe("#updateMaxUsageFee", () => {
    it("only operator", async () => {
      let tx = tradingBotRegistry.connect(otherUser).updateMaxUsageFee(parseEther("10"));
      await expect(tx).to.be.reverted;

      let maxUsageFee = await tradingBotRegistry.MAX_USAGE_FEE();
      expect(maxUsageFee).to.equal(parseEther("1000"));
    });

    it("meets requirements", async () => {
        let tx = await tradingBotRegistry.updateMaxUsageFee(parseEther("10"));
        await tx.wait();

        let maxUsageFee = await tradingBotRegistry.MAX_USAGE_FEE();
        expect(maxUsageFee).to.equal(parseEther("10"));
    });
  });
  
  describe("#increaseMaxTradingBotsPerUser", () => {
    it("only operator", async () => {
      let tx = tradingBotRegistry.connect(otherUser).increaseMaxTradingBotsPerUser(100);
      await expect(tx).to.be.reverted;

      let maxBots = await tradingBotRegistry.MAX_TRADING_BOTS_PER_USER();
      expect(maxBots).to.equal(3);
    });

    it("lower", async () => {
        let tx = tradingBotRegistry.increaseMaxTradingBotsPerUser(1);
        await expect(tx).to.be.reverted;

        let maxBots = await tradingBotRegistry.MAX_TRADING_BOTS_PER_USER();
        expect(maxBots).to.equal(3);
    });

    it("meets requirements", async () => {
        let tx = await tradingBotRegistry.increaseMaxTradingBotsPerUser(100);
        await tx.wait();
  
        let maxBots = await tradingBotRegistry.MAX_TRADING_BOTS_PER_USER();
        expect(maxBots).to.equal(100);
      });
  });
  
  describe("#setRegistrar", () => {
    it("only owner", async () => {
      let tx = tradingBotRegistry.connect(otherUser).setRegistrar(otherUser.address);
      await expect(tx).to.be.reverted;

      let registrar = await tradingBotRegistry.registrar();
      expect(registrar).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await tradingBotRegistry.setRegistrar(otherUser.address);
        await tx.wait();

        let registrar = await tradingBotRegistry.registrar();
        expect(registrar).to.equal(otherUser.address);
    });
  });
  
  describe("#setOperator", () => {
    it("only owner", async () => {
      let tx = tradingBotRegistry.connect(otherUser).setOperator(otherUser.address);
      await expect(tx).to.be.reverted;

      let operator = await tradingBotRegistry.operator();
      expect(operator).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await tradingBotRegistry.setOperator(otherUser.address);
        await tx.wait();

        let operator = await tradingBotRegistry.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });
  
  describe("#stageTradingBot", () => {
    it("timeframe out of bounds", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("100"));
        await tx.wait();

        let tx2 = tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10000, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await expect(tx2).to.be.reverted;

        let numberOfTradingBots = await tradingBotRegistry.numberOfTradingBots();
        expect(numberOfTradingBots).to.equal(0);
    });

    it("max trade duration out of bounds", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("100"));
        await tx.wait();

        let tx2 = tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 50000, 1000, 1000, "BTC", 5, parseEther("10"));
        await expect(tx2).to.be.reverted;

        let numberOfTradingBots = await tradingBotRegistry.numberOfTradingBots();
        expect(numberOfTradingBots).to.equal(0);
    });

    it("profit target out of bounds", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("100"));
        await tx.wait();

        let tx2 = tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 10000000, 1000, "BTC", 5, parseEther("10"));
        await expect(tx2).to.be.reverted;

        let numberOfTradingBots = await tradingBotRegistry.numberOfTradingBots();
        expect(numberOfTradingBots).to.equal(0);
    });

    it("stop loss out of bounds", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("100"));
        await tx.wait();

        let tx2 = tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 100000000, "BTC", 5, parseEther("10"));
        await expect(tx2).to.be.reverted;

        let numberOfTradingBots = await tradingBotRegistry.numberOfTradingBots();
        expect(numberOfTradingBots).to.equal(0);
    });

    it("asset does not have a data feed", async () => {
        let tx = tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await expect(tx).to.be.reverted;

        let numberOfTradingBots = await tradingBotRegistry.numberOfTradingBots();
        expect(numberOfTradingBots).to.equal(0);
    });

    it("usage fee too high", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("100"));
        await tx.wait();

        let tx2 = tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("100000000000"));
        await expect(tx2).to.be.reverted;

        let numberOfTradingBots = await tradingBotRegistry.numberOfTradingBots();
        expect(numberOfTradingBots).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("100"));
        await tx.wait();

        let tx2 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx2.wait();

        let numberOfTradingBots = await tradingBotRegistry.numberOfTradingBots();
        expect(numberOfTradingBots).to.equal(1);

        let tradingBotsPerUser = await tradingBotRegistry.tradingBotsPerUser(deployer.address);
        expect(tradingBotsPerUser).to.equal(1);
    });
  });
  
  describe("#createTradingBot", () => {
    it("only trading bot owner", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx2 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx2.wait();

        let tx3 = tradingBotRegistry.connect(otherUser).createTradingBot(1);
        await expect(tx3).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(1);
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx2 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx2.wait();

        let tx3 = await tradingBotRegistry.createTradingBot(1);
        await tx3.wait();

        let zeroAddress = await tradingBotRegistry.tradingBotAddresses(88);

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);
        expect(deployedAddress).to.not.equal(zeroAddress);

        let index = await tradingBotRegistry.tradingBotIndexes(deployedAddress);
        expect(index).to.equal(1);

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(2);
    });

    it("wrong status", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx2 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx2.wait();

        let tx3 = await tradingBotRegistry.createTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.createTradingBot(1);
        await expect(tx4).to.be.reverted;
    });
  });
  
  describe("#initializeTradingBot", () => {
    it("only trading bot owner", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = tradingBotRegistry.connect(otherUser).initializeTradingBot(1);
        await expect(tx3).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(2);
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);
        tradingBot = TradingBotFactory.attach(deployedAddress);

        let name = await tradingBot.name();
        expect(name).to.equal("Mock trading bot");

        let symbol = await tradingBot.symbol();
        expect(symbol).to.equal("BOT");

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("wrong status", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.initializeTradingBot(1);
        await expect(tx4).to.be.reverted;
    });
  });
  
  describe("#setRulesForTradingBot", () => {
    it("only trading bot owner", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.connect(otherUser).setRulesForTradingBot(1, [1], [2], [1], [1]);
        await expect(tx4).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("wrong status", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = tradingBotRegistry.setRulesForTradingBot(1, [1], [2], [1], [1]);
        await expect(tx3).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(2);
    });

    it("too many entry rules", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.setRulesForTradingBot(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [11], [1]);
        await expect(tx4).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("too many exit rules", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.setRulesForTradingBot(1, [11], [1], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        await expect(tx4).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("entry rules have different length", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.setRulesForTradingBot(1, [1, 2], [1], [3], [1]);
        await expect(tx4).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("exit rules have different length", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [2, 3], [1]);
        await expect(tx4).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("owner has not purchased entry rules", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await expect(tx4).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [2], [3], [4]);
        await tx5.wait();

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(4);

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);
        tradingBot = TradingBotFactory.attach(deployedAddress);

        let entryRuleComponents = await tradingBot.entryRuleComponents(0);
        expect(entryRuleComponents).to.equal(1);

        let entryRuleInstances = await tradingBot.entryRuleInstances(0);
        expect(entryRuleInstances).to.equal(2);

        let exitRuleComponents = await tradingBot.exitRuleComponents(0);
        expect(exitRuleComponents).to.equal(3);

        let exitRuleInstances = await tradingBot.exitRuleInstances(0);
        expect(exitRuleInstances).to.equal(4);
    });
  });
  
  describe("#mintTradingBotNFT", () => {
    it("only trading bot owner", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await tx5.wait();

        let tx6 = tradingBotRegistry.connect(otherUser).mintTradingBotNFT(1);
        await expect(tx6).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(4);
    });

    it("wrong status", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = tradingBotRegistry.mintTradingBotNFT(1);
        await expect(tx4).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(3);
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await tx5.wait();

        let tx6 = await feeToken.approve(tradingBotRegistryAddress, parseEther("100"));
        await tx6.wait();

        let initialBalance = await feeToken.balanceOf(tradingBotsNFTAddress);

        let tx7 = await tradingBotRegistry.mintTradingBotNFT(1);
        await tx7.wait();

        let newBalance = await feeToken.balanceOf(tradingBotsNFTAddress);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("100"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);
        let zeroAddress = await tradingBotRegistry.tradingBotAddresses(10);

        let botAddress = await tradingBotsNFT.tradingBotAddresses(1);
        expect(botAddress).to.equal(deployedAddress);

        let balance = await tradingBotsNFT.balanceOf(deployer.address, 1);
        expect(balance).to.equal(1);

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(5);

        let ownerByIndex = await tradingBotRegistry.getOwner(1, zeroAddress);
        let ownerByAddress = await tradingBotRegistry.getOwner(0, deployedAddress);
        expect(ownerByIndex).to.equal(deployer.address);
        expect(ownerByAddress).to.equal(deployer.address);

        let canUpdate = await tradingBotRegistry.canUpdate(0, deployedAddress);
        expect(canUpdate).to.be.false;

        let params = await tradingBotRegistry.getTradingBotParams(0, deployedAddress);
        expect(params[0]).to.equal(10);
        expect(params[1]).to.equal(5);
        expect(params[2]).to.equal(1000);
        expect(params[3]).to.equal(1000);
        expect(params[4]).to.equal("BTC");
        expect(params[5]).to.equal(5);
    });
  });
  
  describe("#setDataFeed", () => {
    it("only operator", async () => {
        let tx = tradingBotRegistry.connect(otherUser).setDataFeed(1, dataFeedAddress);
        await expect(tx).to.be.reverted;
    });

    it("index out of bounds", async () => {
        let tx = tradingBotRegistry.setDataFeed(1, dataFeedAddress);
        await expect(tx).to.be.reverted;
    });

    it("trading bot is not the data provider", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await tx5.wait();

        let tx6 = await feeToken.approve(tradingBotRegistryAddress, parseEther("100"));
        await tx6.wait();

        let tx7 = await tradingBotRegistry.mintTradingBotNFT(1);
        await tx7.wait();

        let tx8 = tradingBotRegistry.setDataFeed(1, dataFeedAddress);
        await expect(tx8).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await tx5.wait();

        let tx6 = await feeToken.approve(tradingBotRegistryAddress, parseEther("100"));
        await tx6.wait();

        let tx7 = await tradingBotRegistry.mintTradingBotNFT(1);
        await tx7.wait();

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);

        let tx8 = await dataFeed.setDataProvider(deployedAddress);
        await tx8.wait();

        let tx9 = await tradingBotRegistry.setDataFeed(1, dataFeedAddress);
        await tx9.wait();

        let deployedDataFeedAddress = await tradingBotRegistry.getTradingBotDataFeed(0, deployedAddress);
        expect(deployedDataFeedAddress).to.equal(dataFeedAddress);
    });
  });
  
  describe("#checkInfoForUpkeep", () => {
    it("trading bot is not supported", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistryRelayer.checkInfoForUpkeep(deployer.address, deployer.address);
        await tx3.wait();

        let status = await tradingBotRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.false;
    });

    it("trading bot does not have a data feed", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);

        let tx3 = await tradingBotRegistryRelayer.checkInfoForUpkeep(deployer.address, deployedAddress);
        await tx3.wait();

        let status = await tradingBotRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.false;
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);

        let tx3 = await dataFeed.setDataProvider(deployedAddress);
        await tx3.wait();

        let tx4 = await tradingBotRegistry.setDataFeed(1, dataFeedAddress);
        await tx4.wait();

        let tx5 = await tradingBotRegistryRelayer.checkInfoForUpkeep(deployer.address, deployedAddress);
        await tx5.wait();

        let status = await tradingBotRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.true;
    });
  });
  
  describe("#publishTradingBot", () => {
    it("only registrar", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await tx5.wait();

        let tx6 = await feeToken.approve(tradingBotRegistryAddress, parseEther("100"));
        await tx6.wait();

        let tx7 = await tradingBotRegistry.mintTradingBotNFT(1);
        await tx7.wait();

        let tx8 = tradingBotRegistry.connect(otherUser).publishTradingBot(1);
        await expect(tx8).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(5);
    });

    it("wrong status", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await tx5.wait();

        let tx6 = tradingBotRegistry.publishTradingBot(1);
        await expect(tx6).to.be.reverted;

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(4);
    });

    it("meets requirements", async () => {
        let tx = await candlestickDataFeedRegistry.setPrice("BTC", 5, parseEther("10"));
        await tx.wait();

        let tx1 = await tradingBotRegistry.stageTradingBot("Mock trading bot", "BOT", 10, 5, 1000, 1000, "BTC", 5, parseEther("10"));
        await tx1.wait();

        let tx2 = await tradingBotRegistry.createTradingBot(1);
        await tx2.wait();

        let tx3 = await tradingBotRegistry.initializeTradingBot(1);
        await tx3.wait();

        let tx4 = await componentsRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await tradingBotRegistry.setRulesForTradingBot(1, [1], [1], [3], [1]);
        await tx5.wait();

        let tx6 = await feeToken.approve(tradingBotRegistryAddress, parseEther("100"));
        await tx6.wait();

        let tx7 = await tradingBotRegistry.mintTradingBotNFT(1);
        await tx7.wait();

        let tx8 = await tradingBotRegistry.publishTradingBot(1);
        await tx8.wait();

        let deployedAddress = await tradingBotRegistry.tradingBotAddresses(1);

        // Check status.
        let tradingBotInfo = await tradingBotRegistry.tradingBotInfos(1);
        expect(tradingBotInfo[1]).to.equal(6);

        let deployedDataFeedAddress = await tradingBotRegistry.getTradingBotDataFeed(0, deployedAddress);
        expect(deployedDataFeedAddress).to.equal(deployedAddress);
    });
  });
});*/