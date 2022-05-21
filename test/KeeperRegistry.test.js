const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("KeeperRegistry", () => {
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
    KeeperFactoryFactory = await ethers.getContractFactory('KeeperFactory');
    KeeperRegistryFactory = await ethers.getContractFactory('KeeperRegistry');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    indicator = await IndicatorFactory.deploy();
    await indicator.deployed();
    indicatorAddress = indicator.address;

    comparator = await ComparatorFactory.deploy();
    await comparator.deployed();
    comparatorAddress = comparator.address;

    tradingBot = await TradingBotFactory.deploy();
    await tradingBot.deployed();
    tradingBotAddress = tradingBot.address;

    componentsRegistry = await ComponentsRegistryFactory.deploy();
    await componentsRegistry.deployed();
    componentsRegistryAddress = componentsRegistry.address;

    tradingBotRegistry = await TradingBotRegistryFactory.deploy();
    await tradingBotRegistry.deployed();
    tradingBotRegistryAddress = tradingBotRegistry.address;
  });

  beforeEach(async () => {
    keeperFactoryContract = await KeeperFactoryFactory.deploy();
    await keeperFactoryContract.deployed();
    keeperFactoryAddress = keeperFactoryContract.address;

    keeperRegistry = await KeeperRegistryFactory.deploy(feeTokenAddress, componentsRegistryAddress, tradingBotRegistryAddress, keeperFactoryAddress);
    await keeperRegistry.deployed();
    keeperRegistryAddress = keeperRegistry.address;

    let tx = await keeperFactoryContract.setKeeperRegistry(keeperRegistryAddress);
    await tx.wait();
  });
  
  describe("#registerKeeper", () => {
    it("max fee too high", async () => {
      let tx = keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("99999"));
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        let temp = await tx.wait();
        let deployedAddress = temp.events[temp.events.length - 1].args.keeper;
        console.log(deployedAddress);
        keeper = KeeperFactory.attach(deployedAddress);

        let owner = await keeper.owner();
        expect(owner).to.equal(deployer.address);

        let dedicatedCaller = await keeper.dedicatedCaller();
        expect(dedicatedCaller).to.equal(deployer.address);

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[0]).to.equal(deployer.address);
        expect(keeperInfo[1]).to.equal(deployer.address);
        expect(keeperInfo[2]).to.equal(otherUser.address);
        expect(keeperInfo[3]).to.equal(parseEther("10"));
        expect(keeperInfo[4].length).to.equal(0);

        let userToKeeper = await keeperRegistry.userToKeeper(deployer.address);
        expect(userToKeeper).to.equal(deployedAddress);
    });

    it("already have keeper", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();
        
        let tx2 = keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("9"));
        await expect(tx2).to.be.reverted;
    });
  });
  
  describe("#updatePayee", () => {
    it("not keeper owner", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = keeperRegistry.connect(otherUser).updatePayee(deployedAddress, deployer.address);
        await expect(tx2).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await keeperRegistry.updatePayee(deployedAddress, deployer.address);
        await tx2.wait();

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[2]).to.equal(deployer.address);
    });
  });
  
  describe("#updateKeeperFee", () => {
    it("not keeper owner", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = keeperRegistry.connect(otherUser).updateKeeperFee(deployedAddress, parseEther("50"));
        await expect(tx2).to.be.reverted;

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[3]).to.equal(parseEther("10"));
    });

    it("fee too high", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = keeperRegistry.updateKeeperFee(deployedAddress, parseEther("500000"));
        await expect(tx2).to.be.reverted;

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[3]).to.equal(parseEther("10"));
    });

    it("meets requirements", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await keeperRegistry.updateKeeperFee(deployedAddress, parseEther("20"));
        await tx2.wait();

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[3]).to.equal(parseEther("20"));
    });

    it("not enough time between updates", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await keeperRegistry.updateKeeperFee(deployedAddress, parseEther("20"));
        await tx2.wait();

        let tx3 = keeperRegistry.updateKeeperFee(deployedAddress, parseEther("28"));
        await expect(tx3).to.be.reverted;

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[3]).to.equal(parseEther("20"));
    });

    it("fee increase too high", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = keeperRegistry.updateKeeperFee(deployedAddress, parseEther("150"));
        await expect(tx2).to.be.reverted;

        let keeperInfo = await keeperRegistry.getKeeperInfo(deployedAddress);
        expect(keeperInfo[3]).to.equal(parseEther("10"));
    });
  });
  
  describe("#createJob", () => {
    it("wrong job type", async () => {
        let tx = keeperRegistry.createJob(3, deployer.address, indicatorAddress, 1);
        await expect(tx).to.be.reverted;

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(0);
    });

    it("invalid keeper", async () => {
        let tx = keeperRegistry.createJob(2, deployer.address, indicatorAddress, 1);
        await expect(tx).to.be.reverted;

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(0);
    });

    it("invalid info for upkeep; component", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let tx2 = keeperRegistry.createJob(1, deployer.address, indicatorAddress, 1);
        await expect(tx2).to.be.reverted;

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(0);
    });

    it("invalid info for upkeep; trading bot", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let tx2 = keeperRegistry.createJob(2, deployer.address, indicatorAddress, 1);
        await expect(tx2).to.be.reverted;

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(0);
    });

    it("meets requirements; indicator", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let assignedAddress = await indicator.keepers(1);
        expect(assignedAddress).to.equal(deployedAddress);

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(1);

        let availableJobs = await keeperRegistry.getAvailableJobs(deployedAddress);
        expect(availableJobs.length).to.equal(1);
        expect(availableJobs[0]).to.equal(1);

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo[0]).to.be.true;
        expect(upkeepInfo[1]).to.equal(0);
        expect(upkeepInfo[2]).to.equal(deployer.address);
        expect(upkeepInfo[3]).to.equal(deployedAddress);
        expect(upkeepInfo[4]).to.equal(indicatorAddress);
        expect(upkeepInfo[5]).to.equal(1);
    });

    it("meets requirements; comparator", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(1, deployedAddress, comparatorAddress, 1);
        await tx3.wait();

        let assignedAddress = await comparator.keepers(1);
        expect(assignedAddress).to.equal(deployedAddress);

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(1);

        let availableJobs = await keeperRegistry.getAvailableJobs(deployedAddress);
        expect(availableJobs.length).to.equal(1);
        expect(availableJobs[0]).to.equal(1);

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo[0]).to.be.true;
        expect(upkeepInfo[1]).to.equal(1);
        expect(upkeepInfo[2]).to.equal(deployer.address);
        expect(upkeepInfo[3]).to.equal(deployedAddress);
        expect(upkeepInfo[4]).to.equal(comparatorAddress);
        expect(upkeepInfo[5]).to.equal(1);
    });

    it("meets requirements; trading bot", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await tradingBotRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(2, deployedAddress, tradingBotAddress, 0);
        await tx3.wait();

        let assignedAddress = await tradingBot.keeper();
        expect(assignedAddress).to.equal(deployedAddress);

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(1);

        let availableJobs = await keeperRegistry.getAvailableJobs(deployedAddress);
        expect(availableJobs.length).to.equal(1);
        expect(availableJobs[0]).to.equal(1);

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo[0]).to.be.true;
        expect(upkeepInfo[1]).to.equal(2);
        expect(upkeepInfo[2]).to.equal(deployer.address);
        expect(upkeepInfo[3]).to.equal(deployedAddress);
        expect(upkeepInfo[4]).to.equal(tradingBotAddress);
        expect(upkeepInfo[5]).to.equal(0);
    });

    it("multiple jobs and keepers", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let tx2 = await keeperRegistry.connect(otherUser).registerKeeper(deployer.address, otherUser.address, parseEther("50"));
        await tx2.wait();

        let deployedAddress1 = await keeperRegistry.userToKeeper(deployer.address);
        let deployedAddress2 = await keeperRegistry.userToKeeper(otherUser.address);

        let tx3 = await componentsRegistry.setReturnValue(true);
        await tx3.wait();

        let tx4 = await tradingBotRegistry.setReturnValue(true);
        await tx4.wait();

        let tx5 = await keeperRegistry.createJob(2, deployedAddress1, tradingBotAddress, 0);
        await tx5.wait();

        let tx6 = await keeperRegistry.createJob(0, deployedAddress1, indicatorAddress, 1);
        await tx6.wait();

        let tx7 = await keeperRegistry.createJob(1, deployedAddress2, comparatorAddress, 2);
        await tx7.wait();

        let assignedAddress1 = await tradingBot.keeper();
        expect(assignedAddress1).to.equal(deployedAddress1);

        let assignedAddress2 = await indicator.keepers(1);
        expect(assignedAddress2).to.equal(deployedAddress1);

        let assignedAddress3 = await comparator.keepers(2);
        expect(assignedAddress3).to.equal(deployedAddress2);

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(3);

        let availableJobs1 = await keeperRegistry.getAvailableJobs(deployedAddress1);
        expect(availableJobs1.length).to.equal(2);
        expect(availableJobs1[0]).to.equal(1);
        expect(availableJobs1[1]).to.equal(2);

        let availableJobs2 = await keeperRegistry.getAvailableJobs(deployedAddress2);
        expect(availableJobs2.length).to.equal(1);
        expect(availableJobs2[0]).to.equal(3);

        let upkeepInfo1 = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo1[0]).to.be.true;
        expect(upkeepInfo1[1]).to.equal(2);
        expect(upkeepInfo1[2]).to.equal(deployer.address);
        expect(upkeepInfo1[3]).to.equal(deployedAddress1);
        expect(upkeepInfo1[4]).to.equal(tradingBotAddress);
        expect(upkeepInfo1[5]).to.equal(0);

        let upkeepInfo2 = await keeperRegistry.getUpkeepInfo(2);
        expect(upkeepInfo2[0]).to.be.true;
        expect(upkeepInfo2[1]).to.equal(0);
        expect(upkeepInfo2[2]).to.equal(deployer.address);
        expect(upkeepInfo2[3]).to.equal(deployedAddress1);
        expect(upkeepInfo2[4]).to.equal(indicatorAddress);
        expect(upkeepInfo2[5]).to.equal(1);

        let upkeepInfo3 = await keeperRegistry.getUpkeepInfo(3);
        expect(upkeepInfo3[0]).to.be.true;
        expect(upkeepInfo3[1]).to.equal(1);
        expect(upkeepInfo3[2]).to.equal(deployer.address);
        expect(upkeepInfo3[3]).to.equal(deployedAddress2);
        expect(upkeepInfo3[4]).to.equal(comparatorAddress);
        expect(upkeepInfo3[5]).to.equal(2);
    });
  });
  
  describe("#addFunds", () => {
    it("not job owner", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.connect(otherUser).approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = keeperRegistry.connect(otherUser).addFunds(1, parseEther("10"));
        await expect(tx5).to.be.reverted;

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let checkBudget = await keeperRegistry.checkBudget(1);
        expect(checkBudget).to.be.true;

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(parseEther("10"));
    });

    it("meets requirements; multiple jobs", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 2);
        await tx4.wait();

        let tx5 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx5.wait();

        let tx6 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx6.wait();

        let tx7 = await keeperRegistry.addFunds(2, parseEther("10"));
        await tx7.wait();

        let availableFunds1 = await keeperRegistry.availableFunds(1);
        expect(availableFunds1).to.equal(parseEther("10"));

        let availableFunds2 = await keeperRegistry.availableFunds(2);
        expect(availableFunds2).to.equal(parseEther("10"));
    });
  });
  
  describe("#withdrawFunds", () => {
    it("not job owner", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = keeperRegistry.connect(otherUser).withdrawFunds(1, parseEther("5"));
        await expect(tx6).to.be.reverted;

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(parseEther("10"));
    });

    it("meets requirements", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let initialBalance = await feeToken.balanceOf(deployer.address);

        let tx6 = await keeperRegistry.withdrawFunds(1, parseEther("10"));
        await tx6.wait();

        let newBalance = await feeToken.balanceOf(deployer.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("10"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(0);
    });

    it("meets requirements; multiple jobs", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 2);
        await tx4.wait();

        let tx5 = await feeToken.approve(keeperRegistryAddress, parseEther("20"));
        await tx5.wait();

        let tx6 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx6.wait();

        let tx7 = await keeperRegistry.addFunds(2, parseEther("10"));
        await tx7.wait();

        let tx8 = await keeperRegistry.withdrawFunds(1, parseEther("10"));
        await tx8.wait();

        let tx9 = await keeperRegistry.withdrawFunds(2, parseEther("5"));
        await tx9.wait();

        let availableFunds1 = await keeperRegistry.availableFunds(1);
        expect(availableFunds1).to.equal(0);

        let availableFunds2 = await keeperRegistry.availableFunds(2);
        expect(availableFunds2).to.equal(parseEther("5"));
    });

    it("meets requirements; add funds after withdrawing", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let tx6 = await keeperRegistry.withdrawFunds(1, parseEther("10"));
        await tx6.wait();

        let tx7 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx7.wait();

        let tx8 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx8.wait();

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(parseEther("10"));
    });
  });
  
  describe("#cancelJob", () => {
    it("not job owner", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = keeperRegistry.connect(otherUser).cancelJob(1);
        await expect(tx4).to.be.reverted;

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(1);

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo[0]).to.be.true;
        expect(upkeepInfo[1]).to.equal(0);
        expect(upkeepInfo[2]).to.equal(deployer.address);
        expect(upkeepInfo[3]).to.equal(deployedAddress);
        expect(upkeepInfo[4]).to.equal(indicatorAddress);
        expect(upkeepInfo[5]).to.equal(1);
    });

    it("meets requirements; indicator", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let initialBalance = await feeToken.balanceOf(deployer.address);

        let tx6 = await keeperRegistry.cancelJob(1);
        await tx6.wait();

        let newBalance = await feeToken.balanceOf(deployer.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("10"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(1);

        let zeroAddress = await keeperRegistry.userToKeeper(keeperRegistryAddress);

        let newKeeperAddress = await indicator.keepers(1);
        expect(newKeeperAddress).to.equal(zeroAddress);

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(0);

        let availableJobs = await keeperRegistry.getAvailableJobs(deployedAddress);
        expect(availableJobs.length).to.equal(0);

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo[0]).to.be.false;
        expect(upkeepInfo[1]).to.equal(0);
        expect(upkeepInfo[2]).to.equal(zeroAddress);
        expect(upkeepInfo[3]).to.equal(deployedAddress);
        expect(upkeepInfo[4]).to.equal(indicatorAddress);
        expect(upkeepInfo[5]).to.equal(1);
    });

    it("meets requirements; comparator", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(1, deployedAddress, comparatorAddress, 1);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let initialBalance = await feeToken.balanceOf(deployer.address);

        let tx6 = await keeperRegistry.cancelJob(1);
        await tx6.wait();

        let newBalance = await feeToken.balanceOf(deployer.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("10"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(1);

        let zeroAddress = await keeperRegistry.userToKeeper(keeperRegistryAddress);

        let newKeeperAddress = await comparator.keepers(1);
        expect(newKeeperAddress).to.equal(zeroAddress);

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo[0]).to.be.false;
        expect(upkeepInfo[1]).to.equal(1);
        expect(upkeepInfo[2]).to.equal(zeroAddress);
        expect(upkeepInfo[3]).to.equal(deployedAddress);
        expect(upkeepInfo[4]).to.equal(comparatorAddress);
        expect(upkeepInfo[5]).to.equal(1);
    });

    it("meets requirements; trading bot", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await tradingBotRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(2, deployedAddress, tradingBotAddress, 0);
        await tx3.wait();

        let tx4 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx5.wait();

        let initialBalance = await feeToken.balanceOf(deployer.address);

        let tx6 = await keeperRegistry.cancelJob(1);
        await tx6.wait();

        let newBalance = await feeToken.balanceOf(deployer.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("10"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(1);

        let zeroAddress = await keeperRegistry.userToKeeper(keeperRegistryAddress);

        let newKeeperAddress = await tradingBot.keeper();
        expect(newKeeperAddress).to.equal(zeroAddress);

        let upkeepInfo = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo[0]).to.be.false;
        expect(upkeepInfo[1]).to.equal(2);
        expect(upkeepInfo[2]).to.equal(zeroAddress);
        expect(upkeepInfo[3]).to.equal(deployedAddress);
        expect(upkeepInfo[4]).to.equal(tradingBotAddress);
        expect(upkeepInfo[5]).to.equal(0);
    });

    it("meets requirements; multiple jobs", async () => {
        let tx = await keeperRegistry.registerKeeper(deployer.address, otherUser.address, parseEther("10"));
        await tx.wait();

        let deployedAddress = await keeperRegistry.userToKeeper(deployer.address);

        let tx2 = await componentsRegistry.setReturnValue(true);
        await tx2.wait();

        let tx3 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 1);
        await tx3.wait();

        let tx4 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 2);
        await tx4.wait();

        let tx5 = await keeperRegistry.createJob(0, deployedAddress, indicatorAddress, 3);
        await tx5.wait();

        let tx6 = await feeToken.approve(keeperRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await keeperRegistry.addFunds(1, parseEther("10"));
        await tx7.wait();

        let initialBalance = await feeToken.balanceOf(deployer.address);

        let tx8 = await keeperRegistry.cancelJob(2);
        await tx8.wait();

        let newBalance = await feeToken.balanceOf(deployer.address);
        let expectedNewBalance = BigInt(initialBalance);
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let numberOfJobs = await keeperRegistry.numberOfJobs();
        expect(numberOfJobs).to.equal(3);

        let zeroAddress = await keeperRegistry.userToKeeper(keeperRegistryAddress);

        let newKeeperAddress = await indicator.keepers(2);
        expect(newKeeperAddress).to.equal(zeroAddress);

        let availableFunds = await keeperRegistry.availableFunds(1);
        expect(availableFunds).to.equal(parseEther("10"));

        let availableJobs = await keeperRegistry.getAvailableJobs(deployedAddress);
        expect(availableJobs.length).to.equal(2);
        expect(availableJobs[0]).to.equal(1);
        expect(availableJobs[1]).to.equal(3);

        let upkeepInfo1 = await keeperRegistry.getUpkeepInfo(1);
        expect(upkeepInfo1[0]).to.be.true;
        expect(upkeepInfo1[1]).to.equal(0);
        expect(upkeepInfo1[2]).to.equal(deployer.address);
        expect(upkeepInfo1[3]).to.equal(deployedAddress);
        expect(upkeepInfo1[4]).to.equal(indicatorAddress);
        expect(upkeepInfo1[5]).to.equal(1);

        let upkeepInfo2 = await keeperRegistry.getUpkeepInfo(2);
        expect(upkeepInfo2[0]).to.be.false;
        expect(upkeepInfo2[1]).to.equal(0);
        expect(upkeepInfo2[2]).to.equal(zeroAddress);
        expect(upkeepInfo2[3]).to.equal(deployedAddress);
        expect(upkeepInfo2[4]).to.equal(indicatorAddress);
        expect(upkeepInfo2[5]).to.equal(2);

        let upkeepInfo3 = await keeperRegistry.getUpkeepInfo(3);
        expect(upkeepInfo3[0]).to.be.true;
        expect(upkeepInfo3[1]).to.equal(0);
        expect(upkeepInfo3[2]).to.equal(deployer.address);
        expect(upkeepInfo3[3]).to.equal(deployedAddress);
        expect(upkeepInfo3[4]).to.equal(indicatorAddress);
        expect(upkeepInfo3[5]).to.equal(3);
    });
  });
});*/