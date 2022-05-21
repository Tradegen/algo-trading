const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

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
    BotPerformanceDataFeedRegistryFactory = await ethers.getContractFactory('TestBotPerformanceDataFeedRegistry');
    TradingBotsNFTFactory = await ethers.getContractFactory('TradingBotsNFT');
    TradingBotFactoryFactory = await ethers.getContractFactory('TradingBotFactory');
    TradingBotRegistryFactory = await ethers.getContractFactory('TradingBotRegistry');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    tradingBotsNFT = await TradingBotsNFTFactory.deploy();
    await tradingBotsNFT.deployed();
    tradingBotsNFTAddress = tradingBotsNFT.address;

    botPerformanceDataFeedRegistry = await BotPerformanceDataFeedFactory.deploy();
    await botPerformanceDataFeedRegistry.deployed();
    botPerformanceDataFeedRegistryAddress = botPerformanceDataFeedRegistry.address;

    let tx = await feeToken.transfer(otherUser.address, parseEther("10000"));
    await tx.wait();
  });

  beforeEach(async () => {
        componentsRegistry = await ComponentsRegistryFactory.deploy();
        await componentsRegistry.deployed();
        componentsRegistryAddress = componentsRegistry.address;

        candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
        await candlestickDataFeedRegistry.deployed();
        candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

        tradingBotFactoryContract = await TradingBotFactory.deploy();
        await tradingBotFactoryContract.deployed();
        tradingBotFactoryAddress = tradingBotFactoryContract.address;

        // Use tradingBotsNFTAddress as xTGEN.
        tradingBotRegistry = await TradingBotRegistryFactory.deploy(tradingBotsNFTAddress, botPerformanceDataFeedRegistryAddress, componentsRegistryAddress, tradingBotFactoryAddress, candlestickDataFeedRegistryAddress, feeTokenAddress, tradingBotsNFTAddress);
        await tradingBotRegistry.deployed();
        tradingBotRegistryAddress = tradingBotRegistry.address;

        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(tradingBotRegistryAddress);
        await tx.wait();

        let tx2 = await tradingBotFactory.setTradingBotRegistry(tradingBotRegistryAddress);
        await tx2.wait();
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
});