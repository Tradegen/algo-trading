const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("Down", () => {
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
    IndicatorFactory = await ethers.getContractFactory('Down');

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
});