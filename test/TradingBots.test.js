const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("TradingBots", () => {
  let deployer;
  let otherUser;

  let tradingBotsNFT;
  let tradingBotsNFTAddress;
  let TradingBotsNFTFactory;

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
    TradingBotsNFTFactory = await ethers.getContractFactory('TradingBots');
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
    tradingBotsNFT = await TradingBotsNFTFactory.deploy();
    await tradingBotsNFT.deployed();
    tradingBotsNFTAddress = tradingBotsNFT.address;
  });

  describe("#setTradingBotRegistryAddress", () => {
    it("only owner", async () => {
      let tx = tradingBotsNFT.connect(otherUser).setTradingBotRegistryAddress(otherUser.address);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(deployer.address);
        let temp = await tx.wait();
        let deployedAddress = temp.events[temp.events.length - 1].args.tradingBotRegistryAddress;
        expect(deployedAddress).to.equal(deployer.address);
    });
  });
  
  describe("#mintTradingBot", () => {
    it("onlyTradingBotRegistry", async () => {
        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(deployer.address);
        await tx.wait();

        let tx2 = tradingBotsNFT.connect(otherUser).mintTradingBot(1, deployer.address, otherUser.address);
        await expect(tx2).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(deployer.address);
        await tx.wait();

        let tx2 = await tradingBotsNFT.mintTradingBot(1, deployer.address, deployer.address);
        await tx2.wait();

        let balance = await tradingBotsNFT.balanceOf(deployer.address, 1);
        expect(balance).to.equal(1);

        let botAddress = await tradingBotsNFT.tradingBotAddresses(1);
        expect(botAddress).to.equal(deployer.address);
    });
  });

  describe("#safeTransferFrom", () => {
    it("wrong amount", async () => {
        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(deployer.address);
        await tx.wait();

        let tx2 = await tradingBotsNFT.mintTradingBot(1, deployer.address, deployer.address);
        await tx2.wait();

        let tx3 = await tradingBotsNFT.setApprovalForAll(otherUser.address, true);
        await tx3.wait();

        let tx4 = tradingBotsNFT.safeTransferFrom(deployer.address, otherUser.address, 1, 200, "0x00");
        await expect(tx4).to.be.reverted;
    });

    it("only trading bot owner", async () => {
        tradingBot = await TradingBotFactory.deploy(otherUser.address, componentsRegistryAddress, candlestickDataFeedRegistryAddress, deployer.address, deployer.address, tradingBotsNFTAddress);
        await tradingBot.deployed();
        tradingBotAddress = tradingBot.address;

        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(deployer.address);
        await tx.wait();

        let tx2 = await tradingBotsNFT.mintTradingBot(1, deployer.address, tradingBotAddress);
        await tx2.wait();

        let tx3 = await tradingBotsNFT.setApprovalForAll(otherUser.address, true);
        await tx3.wait();

        let tx4 = tradingBotsNFT.safeTransferFrom(deployer.address, otherUser.address, 1, 1, "0x00");
        await expect(tx4).to.be.reverted;
    });

    it("meets requirements", async () => {
        tradingBot = await TradingBotFactory.deploy(deployer.address, componentsRegistryAddress, candlestickDataFeedRegistryAddress, deployer.address, deployer.address, tradingBotsNFTAddress);
        await tradingBot.deployed();
        tradingBotAddress = tradingBot.address;

        let tx = await tradingBotsNFT.setTradingBotRegistryAddress(deployer.address);
        await tx.wait();

        let tx2 = await tradingBotsNFT.mintTradingBot(1, deployer.address, tradingBotAddress);
        await tx2.wait();

        let tx3 = await tradingBotsNFT.setApprovalForAll(otherUser.address, true);
        await tx3.wait();

        let tx4 = await tradingBotsNFT.safeTransferFrom(deployer.address, otherUser.address, 1, 1, "0x00");
        await tx4.wait();

        let balanceDeployer = await tradingBotsNFT.balanceOf(deployer.address, 1);
        expect(balanceDeployer).to.equal(0);

        let balanceOther = await tradingBotsNFT.balanceOf(otherUser.address, 1);
        expect(balanceOther).to.equal(1);

        let owner = await tradingBot.owner();
        expect(owner).to.equal(otherUser.address);

        let operator = await tradingBot.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });
});*/