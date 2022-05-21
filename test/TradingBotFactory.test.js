const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("TradingBotFactory", () => {
  let deployer;
  let otherUser;

  let tradingBot;
  let TradingBotFactory;

  let componentsRegistry;
  let componentsRegistryAddress;
  let ComponentsRegistryFactory;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let tradingBotFactoryContract;
  let tradingBotFactoryAddress;
  let TradingBotFactoryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TradingBotFactory = await ethers.getContractFactory('TradingBot');
    ComponentsRegistryFactory = await ethers.getContractFactory('TestComponentsRegistry');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');
    TradingBotFactoryFactory = await ethers.getContractFactory('TradingBotFactory');

    componentsRegistry = await ComponentsRegistryFactory.deploy();
    await componentsRegistry.deployed();
    componentsRegistryAddress = componentsRegistry.address;

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;
  });

  beforeEach(async () => {
    tradingBotFactoryContract = await TradingBotFactoryFactory.deploy(componentsRegistryAddress, candlestickDataFeedRegistryAddress, deployer.address, deployer.address);
    await tradingBotFactoryContract.deployed();
    tradingBotFactoryAddress = tradingBotFactoryContract.address;
  });

  describe("#setTradingBotRegistry", () => {
    it("only owner", async () => {
      let tx = tradingBotFactoryContract.connect(otherUser).setTradingBotRegistry(otherUser.address);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBotFactoryContract.setTradingBotRegistry(deployer.address);
        let temp = await tx.wait();
        let deployedAddress = temp.events[temp.events.length - 1].args.tradingBotRegistryAddress;
        expect(deployedAddress).to.equal(deployer.address);
    });
  });
  
  describe("#createTradingBot", () => {
    it("onlyComponentRegistry", async () => {
        let tx = await tradingBotFactoryContract.setTradingBotRegistry(deployer.address);
        await tx.wait();

        let tx2 = tradingBotFactoryContract.connect(otherUser).createTradingBot(otherUser.address);
        await expect(tx2).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBotFactoryContract.setTradingBotRegistry(deployer.address);
        await tx.wait();

        let tx2 = await tradingBotFactoryContract.createTradingBot(deployer.address);
        let temp = await tx2.wait();
        let deployedAddress = temp.events[temp.events.length - 1].args.tradingBotContractAddress;
        console.log(deployedAddress);
        tradingBot = TradingBotFactory.attach(deployedAddress);
        
        let owner = await tradingBot.owner();
        expect(owner).to.equal(deployer.address);

        let operator = await tradingBot.operator();
        expect(operator).to.equal(deployer.address);
    });
  });
});*/