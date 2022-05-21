const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("TradingBot", () => {
  let deployer;
  let otherUser;

  let tradingBot;
  let tradingBotAddress;
  let TradingBotFactory;

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

    TradingBotFactory = await ethers.getContractFactory('TradingBot');
    ComponentsRegistryFactory = await ethers.getContractFactory('TestComponentsRegistry');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');

    componentsRegistry = await ComponentsRegistryFactory.deploy();
    await componentsRegistry.deployed();
    componentsRegistryAddress = componentsRegistry.address;

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;
  });

  beforeEach(async () => {
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
});