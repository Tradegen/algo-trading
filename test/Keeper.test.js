const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("Keeper", () => {
  let deployer;
  let otherUser;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let tradingBot;
  let tradingBotAddress;
  let TradingBotFactory;

  let indicator;
  let indicatorAddress;
  let IndicatorFactory;

  let comparator;
  let comparatorAddress;
  let ComparatorFactory;

  let componentsRegistry;
  let componentsRegistryAddress;
  let ComponentsRegistryFactory;

  let tradingBotRegistry;
  let tradingBotRegistryAddress;
  let TradingBotRegistryFactory;

  let keeper;
  let keeperAddress;
  let KeeperFactory;

  let keeperRelayer;
  let keeperRelayerAddress;
  let KeeperRelayerFactory;

  let keeperFactoryContract;
  let keeperFactoryAddress;
  let KeeperFactoryFactory;

  let keeperRegistry;
  let keeperRegistryAddress;
  let KeeperRegistryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    IndicatorFactory = await ethers.getContractFactory('TestIndicator');
    ComparatorFactory = await ethers.getContractFactory('TestComparator');
    TradingBotFactory = await ethers.getContractFactory('TestTradingBot');
    ComponentsRegistryFactory = await ethers.getContractFactory('TestComponentsRegistry');
    TradingBotRegistryFactory = await ethers.getContractFactory('TestTradingBotRegistry');
    KeeperFactory = await ethers.getContractFactory('Keeper');
    KeeperRelayerFactory = await ethers.getContractFactory('TestKeeperRelayer');
    KeeperFactoryFactory = await ethers.getContractFactory('KeeperFactory');
    KeeperRegistryFactory = await ethers.getContractFactory('KeeperRegistry');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    componentsRegistry = await ComponentsRegistryFactory.deploy();
    await componentsRegistry.deployed();
    componentsRegistryAddress = componentsRegistry.address;

    tradingBotRegistry = await TradingBotRegistryFactory.deploy();
    await tradingBotRegistry.deployed();
    tradingBotRegistryAddress = tradingBotRegistry.address;
  });

  beforeEach(async () => {
    indicator = await IndicatorFactory.deploy();
    await indicator.deployed();
    indicatorAddress = indicator.address;

    comparator = await ComparatorFactory.deploy();
    await comparator.deployed();
    comparatorAddress = comparator.address;

    tradingBot = await TradingBotFactory.deploy();
    await tradingBot.deployed();
    tradingBotAddress = tradingBot.address;

    keeperFactoryContract = await KeeperFactoryFactory.deploy();
    await keeperFactoryContract.deployed();
    keeperFactoryAddress = keeperFactoryContract.address;

    keeperRegistry = await KeeperRegistryFactory.deploy(feeTokenAddress, componentsRegistryAddress, tradingBotRegistryAddress, keeperFactoryAddress);
    await keeperRegistry.deployed();
    keeperRegistryAddress = keeperRegistry.address;

    let tx = await keeperFactoryContract.setKeeperRegistry(keeperRegistryAddress);
    await tx.wait();
  });
  
  describe("#updateDedicatedCaller", () => {
    it("not keeper owner", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = keeperRegistry.connect(otherUser).updateDedicatedCaller(deployedAddress, otherUser.address);
        await expect(tx2).to.be.reverted;

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[1]).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await keeperRegistry.updateDedicatedCaller(deployedAddress, otherUser.address);
        await tx2.wait();

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[1]).to.equal(otherUser.address);

        keeper = KeeperFactory.attach(deployedAddress);

        let dedicatedCaller = await keeper.dedicatedCaller();
        expect(dedicatedCaller).to.equal(otherUser.address);
    });
  });
  
  describe("#checkUpkeep", () => {
    it("job is not active or keeper is not responsible for this job", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        keeperRelayer = await KeeperRelayerFactory.deploy(deployedAddress);
        await keeperRelayer.deployed();
        keeperRelayerAddress = keeperRelayer.address;

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await keeperRegistry.cancelJob(1);
        await tx4.wait();

        let tx5 = await keeperRelayer.checkUpkeep(1);
        await tx5.wait();

        let status = await keeperRelayer.checkUpkeepStatus();
        expect(status).to.be.false;
    });

    it("indicator is not ready to update", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        keeperRelayer = await KeeperRelayerFactory.deploy(deployedAddress);
        await keeperRelayer.deployed();
        keeperRelayerAddress = keeperRelayer.address;

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await keeperRelayer.checkUpkeep(1);
        await tx4.wait();

        let status = await keeperRelayer.checkUpkeepStatus();
        expect(status).to.be.false;
    });

    it("comparator is not ready to update", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        keeperRelayer = await KeeperRelayerFactory.deploy(deployedAddress);
        await keeperRelayer.deployed();
        keeperRelayerAddress = keeperRelayer.address;

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(1, deployedAddress, comparatorAddress, 1);
        await tx3.wait();

        let tx4 = await keeperRelayer.checkUpkeep(1);
        await tx4.wait();

        let status = await keeperRelayer.checkUpkeepStatus();
        expect(status).to.be.false;
    });

    it("trading bot is not ready to update", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        keeperRelayer = await KeeperRelayerFactory.deploy(deployedAddress);
        await keeperRelayer.deployed();
        keeperRelayerAddress = keeperRelayer.address;

        let tx2 = await tradingBotRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(2, deployedAddress, tradingBotAddress, 0);
        await tx3.wait();

        let tx4 = await keeperRelayer.checkUpkeep(1);
        await tx4.wait();

        let status = await keeperRelayer.checkUpkeepStatus();
        expect(status).to.be.false;
    });

    it("indicator is ready to update", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        keeperRelayer = await KeeperRelayerFactory.deploy(deployedAddress);
        await keeperRelayer.deployed();
        keeperRelayerAddress = keeperRelayer.address;

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await indicator.setCanUpdate(1, true);
        await tx4.wait();

        let tx5 = await keeperRelayer.checkUpkeep(1);
        await tx5.wait();

        let status = await keeperRelayer.checkUpkeepStatus();
        expect(status).to.be.true;
    });

    it("comparator is ready to update", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        keeperRelayer = await KeeperRelayerFactory.deploy(deployedAddress);
        await keeperRelayer.deployed();
        keeperRelayerAddress = keeperRelayer.address;

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(1, deployedAddress, comparatorAddress, 1);
        await tx3.wait();

        let tx4 = await comparator.setCanUpdate(1, true);
        await tx4.wait();

        let tx5 = await keeperRelayer.checkUpkeep(1);
        await tx5.wait();

        let status = await keeperRelayer.checkUpkeepStatus();
        expect(status).to.be.true;
    });

    it("trading bot is ready to update", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        keeperRelayer = await KeeperRelayerFactory.deploy(deployedAddress);
        await keeperRelayer.deployed();
        keeperRelayerAddress = keeperRelayer.address;

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(2, deployedAddress, tradingBotAddress, 0);
        await tx3.wait();

        let tx4 = await tradingBot.setCanUpdate(true);
        await tx4.wait();

        let tx5 = await keeperRelayer.checkUpkeep(1);
        await tx5.wait();

        let status = await keeperRelayer.checkUpkeepStatus();
        expect(status).to.be.true;
    });
  });
  
  describe("#performUpkeep", () => {
    it("not dedicated caller", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = keeper.connect(otherUser).performUpkeep(1);
        await expect(tx4).to.be.reverted;
    });

    it("job is not active or wrong keeper", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await keeperRegistry.cancelJob(1);
        await tx4.wait();

        let tx5 = keeper.performUpkeep(1);
        await expect(tx5).to.be.reverted;
    });

    it("not enough budget", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = keeper.performUpkeep(1);
        await expect(tx4).to.be.reverted;
    });

    it("indicator was not updated successfully", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = keeper.performUpkeep(1);
        await expect(tx6).to.be.reverted;
    });

    it("comparator was not updated successfully", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(1, deployedAddress, comparatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = keeper.performUpkeep(1);
        await expect(tx6).to.be.reverted;
    });

    it("trading bot was not updated successfully", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await tradingBotRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(2, deployedAddress, tradingBotAddress, 0);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = keeper.performUpkeep(1);
        await expect(tx6).to.be.reverted;
    });

    it("meets requirements; indicator", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = await indicator.setCanUpdate(1, true);
        await tx6.wait();

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        console.log(indicatorAddress);
        console.log(upkeepInfo);

        let tx7 = await keeper.performUpkeep(1);
        await tx7.wait();

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(0);

        let availableFees = await keeperRegistry.availableFees(otherUser.address);
        expect(availableFees).to.equal(parseEther("10"));

        let tx8 = keeperRegistry.claimFees(deployedAddress);
        await expect(tx8).to.be.reverted;

        let initialBalance = await feeToken.balanceOf(otherUser.address);

        let tx9 = await keeperRegistry.connect(otherUser).claimFees(deployedAddress);
        await tx9.wait();

        let newBalance = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("10"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let newAvailableFees = await keeperRegistry.availableFees(otherUser.address);
        expect(newAvailableFees).to.equal(0);
    });

    it("meets requirements; comparator", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(1, deployedAddress, comparatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = await comparator.setCanUpdate(1, true);
        await tx6.wait();

        let tx7 = await keeper.performUpkeep(1);
        await tx7.wait();

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(0);

        let availableFees = await keeperRegistry.availableFees(otherUser.address);
        expect(availableFees).to.equal(parseEther("10"));

        let tx8 = keeperRegistry.claimFees(deployedAddress);
        await expect(tx8).to.be.reverted;

        let initialBalance = await feeToken.balanceOf(otherUser.address);

        let tx9 = await keeperRegistry.connect(otherUser).claimFees(deployedAddress);
        await tx9.wait();

        let newBalance = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("10"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let newAvailableFees = await keeperRegistry.availableFees(otherUser.address);
        expect(newAvailableFees).to.equal(0);
    });

    it("meets requirements; trading bot", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);
        keeper = KeeperFactory.attach(deployedAddress);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(2, deployedAddress, tradingBotAddress, 0);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = await tradingBot.setCanUpdate(true);
        await tx6.wait();

        let tx7 = await keeper.performUpkeep(1);
        await tx7.wait();

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(0);

        let availableFees = await keeperRegistry.availableFees(otherUser.address);
        expect(availableFees).to.equal(parseEther("10"));

        let tx8 = keeperRegistry.claimFees(deployedAddress);
        await expect(tx8).to.be.reverted;

        let initialBalance = await feeToken.balanceOf(otherUser.address);

        let tx9 = await keeperRegistry.connect(otherUser).claimFees(deployedAddress);
        await tx9.wait();

        let newBalance = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("10"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let newAvailableFees = await keeperRegistry.availableFees(otherUser.address);
        expect(newAvailableFees).to.equal(0);
    });
  });
});*/