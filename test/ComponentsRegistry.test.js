const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("ComponentsRegistry", () => {
  let deployer;
  let otherUser;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let mockIndicator;
  let mockIndicator2;
  let mockIndicatorAddress;
  let mockIndicatorAddress2;
  let IndicatorFactory1;
  let IndicatorFactory2;

  let mockComparator;
  let mockComparator2;
  let mockComparatorAddress;
  let mockComparatorAddress2;
  let ComparatorFactory1;
  let ComparatorFactory2;

  let components;
  let componentsAddress;
  let ComponentsFactory;

  let componentsRegistryRelayer;
  let componentsRegistryRelayerAddress;
  let ComponentsRegistryRelayerFactory;

  let componentInstances;
  let componentInstancesAddress;
  let ComponentInstancesFactory;

  let componentInstancesFactoryContract;
  let componentInstancesFactoryAddress;
  let ComponentInstancesFactoryFactory;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let componentsRegistry;
  let componentsRegistryAddress;
  let ComponentsRegistryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    ComponentsFactory = await ethers.getContractFactory('Components');
    ComponentInstancesFactory = await ethers.getContractFactory('ComponentInstances');
    ComponentInstancesFactoryFactory = await ethers.getContractFactory('ComponentInstancesFactory');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('TestCandlestickDataFeedRegistry');
    ComponentsRegistryFactory = await ethers.getContractFactory('ComponentsRegistry');
    ComponentsRegistryRelayerFactory = await ethers.getContractFactory('TestComponentsRegistryRelayer');
    IndicatorFactory1 = await ethers.getContractFactory('TestEMA');
    IndicatorFactory2 = await ethers.getContractFactory('TestLatestPrice');
    ComparatorFactory1 = await ethers.getContractFactory('TestCrossesAbove');
    ComparatorFactory2 = await ethers.getContractFactory('TestIsAbove');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    let tx = await feeToken.transfer(otherUser.address, parseEther("10000"));
    await tx.wait();
  });

  beforeEach(async () => {
    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

    componentsRegistry = await ComponentsRegistryFactory.deploy(feeTokenAddress, candlestickDataFeedRegistryAddress);
    await componentsRegistry.deployed();
    componentsRegistryAddress = componentsRegistry.address;

    components = await ComponentsFactory.deploy(componentsRegistryAddress, feeTokenAddress);
    await components.deployed();
    componentsAddress = components.address;

    componentsRegistryRelayer = await ComponentsRegistryRelayerFactory.deploy(componentsRegistryAddress);
    await componentsRegistryRelayer.deployed();
    componentsRegistryRelayerAddress = componentsRegistryRelayer.address;

    componentInstancesFactoryContract = await ComponentInstancesFactoryFactory.deploy(componentsRegistryAddress, feeTokenAddress);
    await componentInstancesFactoryContract.deployed();
    componentInstancesFactoryAddress = componentInstancesFactoryContract.address;

    mockIndicator = await IndicatorFactory1.deploy(componentsRegistryAddress, candlestickDataFeedRegistryAddress, deployer.address);
    await mockIndicator.deployed();
    mockIndicatorAddress = mockIndicator.address;

    mockIndicator2 = await IndicatorFactory2.deploy(componentsRegistryAddress, candlestickDataFeedRegistryAddress, deployer.address);
    await mockIndicator2.deployed();
    mockIndicatorAddress2 = mockIndicator2.address;

    mockComparator = await ComparatorFactory1.deploy(componentsRegistryAddress, deployer.address);
    await mockComparator.deployed();
    mockComparatorAddress = mockComparator.address;

    mockComparator2 = await ComparatorFactory2.deploy(componentsRegistryAddress, deployer.address);
    await mockComparator2.deployed();
    mockComparatorAddress2 = mockComparator2.address;
  });
  
  describe("#initializeContracts", () => {
    it("only owner", async () => {
      let tx = componentsRegistry.connect(otherUser).initializeContracts(componentInstancesFactoryAddress, componentsAddress);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let fetchedComponentInstancesFactoryAddress = await componentsRegistry.componentInstancesFactory();
        expect(fetchedComponentInstancesFactoryAddress).to.equal(componentInstancesFactoryAddress);

        let fetchedComponentsAddress = await componentsRegistry.componentsFactory();
        expect(fetchedComponentsAddress).to.equal(componentsAddress);
    });

    it("already initialized", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await expect(tx2).to.be.reverted;
    });
  });
  
  describe("#publishComponent", () => {
    it("only owner", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = componentsRegistry.connect(otherUser).publishComponent(mockIndicatorAddress, true, otherUser.address, parseEther("10"));
        await expect(tx2).to.be.reverted;
    });

    it("not initialized", async () => {
        let tx = componentsRegistry.publishComponent(mockIndicatorAddress, true, otherUser.address, parseEther("10"));
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let componentOwner = await componentsRegistry.componentOwner(1);
        expect(componentOwner).to.equal(otherUser.address);

        let instanceCreationFee = await componentsRegistry.instanceCreationFee(1);
        expect(instanceCreationFee).to.equal(parseEther("10"));

        let componentID = await componentsRegistry.components(mockIndicatorAddress);
        expect(componentID).to.equal(1);

        let componentInfo = await componentsRegistry.getComponentInfo(1);
        expect(componentInfo[0]).to.equal(otherUser.address);
        expect(componentInfo[1]).to.be.true;
        expect(componentInfo[2]).to.equal(mockIndicatorAddress);
        expect(componentInfo[3]).to.equal(1);
        expect(componentInfo[4]).to.equal(parseEther("10"));
        expect(componentInfo[5]).to.equal("EMA");
    });

    it("multiple components", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("8"));
        await tx3.wait();

        let tx4 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("9"));
        await tx4.wait();

        let tx5 = await componentsRegistry.publishComponent(mockComparatorAddress2, false, deployer.address, parseEther("42"));
        await tx5.wait();

        let componentID1 = await componentsRegistry.components(mockIndicatorAddress);
        expect(componentID1).to.equal(1);

        let componentID2 = await componentsRegistry.components(mockComparatorAddress);
        expect(componentID2).to.equal(2);

        let componentID3 = await componentsRegistry.components(mockIndicatorAddress2);
        expect(componentID3).to.equal(3);

        let componentID4 = await componentsRegistry.components(mockComparatorAddress2);
        expect(componentID4).to.equal(4);

        let componentOwner1 = await componentsRegistry.componentOwner(1);
        expect(componentOwner1).to.equal(otherUser.address);

        let componentOwner2 = await componentsRegistry.componentOwner(2);
        expect(componentOwner2).to.equal(deployer.address);

        let componentOwner3 = await componentsRegistry.componentOwner(3);
        expect(componentOwner3).to.equal(otherUser.address);

        let componentOwner4 = await componentsRegistry.componentOwner(4);
        expect(componentOwner4).to.equal(deployer.address);

        let instanceCreationFee1 = await componentsRegistry.instanceCreationFee(1);
        expect(instanceCreationFee1).to.equal(parseEther("10"));

        let instanceCreationFee2 = await componentsRegistry.instanceCreationFee(2);
        expect(instanceCreationFee2).to.equal(parseEther("8"));

        let instanceCreationFee3 = await componentsRegistry.instanceCreationFee(3);
        expect(instanceCreationFee3).to.equal(parseEther("9"));

        let instanceCreationFee4 = await componentsRegistry.instanceCreationFee(4);
        expect(instanceCreationFee4).to.equal(parseEther("42"));

        let componentInfo1 = await componentsRegistry.getComponentInfo(1);
        expect(componentInfo1[0]).to.equal(otherUser.address);
        expect(componentInfo1[1]).to.be.true;
        expect(componentInfo1[2]).to.equal(mockIndicatorAddress);
        expect(componentInfo1[3]).to.equal(1);
        expect(componentInfo1[4]).to.equal(parseEther("10"));
        expect(componentInfo1[5]).to.equal("EMA");

        let componentInfo2 = await componentsRegistry.getComponentInfo(2);
        expect(componentInfo2[0]).to.equal(deployer.address);
        expect(componentInfo2[1]).to.be.false;
        expect(componentInfo2[2]).to.equal(mockComparatorAddress);
        expect(componentInfo2[3]).to.equal(2);
        expect(componentInfo2[4]).to.equal(parseEther("8"));
        expect(componentInfo2[5]).to.equal("CrossesAbove");

        let componentInfo3 = await componentsRegistry.getComponentInfo(3);
        expect(componentInfo3[0]).to.equal(otherUser.address);
        expect(componentInfo3[1]).to.be.true;
        expect(componentInfo3[2]).to.equal(mockIndicatorAddress2);
        expect(componentInfo3[3]).to.equal(3);
        expect(componentInfo3[4]).to.equal(parseEther("9"));
        expect(componentInfo3[5]).to.equal("LatestPrice");

        let componentInfo4 = await componentsRegistry.getComponentInfo(4);
        expect(componentInfo4[0]).to.equal(deployer.address);
        expect(componentInfo4[1]).to.be.false;
        expect(componentInfo4[2]).to.equal(mockComparatorAddress2);
        expect(componentInfo4[3]).to.equal(4);
        expect(componentInfo4[4]).to.equal(parseEther("42"));
        expect(componentInfo4[5]).to.equal("IsAbove");
    });
  });
  
  describe("#updateComponentFee", () => {
    it("not initialized", async () => {
        let tx = componentsRegistry.updateComponentFee(1, parseEther("42"));
        await expect(tx).to.be.reverted;
    });

    it("component does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = componentsRegistry.updateComponentFee(1, parseEther("42"));
        await expect(tx2).to.be.reverted;
    });

    it("not component owner", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = componentsRegistry.updateComponentFee(1, parseEther("42"));
        await expect(tx3).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.updateComponentFee(1, parseEther("42"));
        await tx3.wait();

        let instanceCreationFee = await componentsRegistry.instanceCreationFee(1);
        expect(instanceCreationFee).to.equal(parseEther("42"));
    });
  });
  
  describe("#createIndicatorInstance", () => {
    it("not initialized", async () => {
        let tx = componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await expect(tx).to.be.reverted;
    });

    it("component does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await expect(tx2).to.be.reverted;
    });

    it("asset does not have data feed", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await expect(tx3).to.be.reverted;
    });

    it("indicator timeframe out of bounds", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx3.wait();

        let tx4 = componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5000, []);
        await expect(tx4).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx3.wait();

        let tx4 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx4.wait();

        let initialBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let initialBalanceOther = await feeToken.balanceOf(otherUser.address);

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let newBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let newBalanceOther = await feeToken.balanceOf(otherUser.address);

        let expectedNewBalanceDeployer = BigInt(initialBalanceDeployer) - BigInt(parseEther("10"));
        let expectedNewBalanceOther = BigInt(initialBalanceOther) + BigInt(parseEther("10"));
        expect(newBalanceDeployer.toString()).to.equal(expectedNewBalanceDeployer.toString());
        expect(newBalanceOther.toString()).to.equal(expectedNewBalanceOther.toString());

        let componentInstanceInfo = await componentsRegistry.getComponentInstanceInfo(1, 1);
        expect(componentInstanceInfo[0]).to.equal(deployer.address);
        expect(componentInstanceInfo[1]).to.equal(1);
        expect(componentInstanceInfo[2]).to.be.false;
        expect(componentInstanceInfo[3]).to.equal(parseEther("20"));

        let componentInstanceStatus = await componentsRegistry.getComponentInstanceStatus(1, 1);
        expect(componentInstanceStatus).to.be.false;

        let indicatorState = await componentsRegistry.getIndicatorState(1, 1);
        expect(indicatorState[0]).to.equal("BTC");
        expect(indicatorState[1]).to.equal(1);
        expect(indicatorState[2]).to.equal(0);
        expect(indicatorState[3].length).to.equal(0);
        expect(indicatorState[4].length).to.equal(0);

        let hasPurchasedInstance = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedInstance).to.be.true;
    });

    it("multiple instances", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, otherUser.address, parseEther("50"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx5.wait();

        let tx6 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx6.wait();

        let tx7 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx7.wait();

        let tx8 = await mockIndicator2.update(1);
        await tx8.wait();

        let tx9 = await feeToken.approve(componentsRegistryAddress, parseEther("50"));
        await tx9.wait();

        let tx10 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 2, "BTC", 1, 10, [20]);
        await tx10.wait();

        let tx11 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx11.wait();

        let tx12 = await componentsRegistry.createIndicatorInstance(parseEther("80"), true, 1, "BTC", 1, 15, []);
        await tx12.wait();

        let tx13 = await mockIndicator2.setKeeper(2, deployer.address);
        await tx13.wait();

        let tx14 = await mockIndicator2.update(2);
        await tx14.wait();

        let tx15 = await feeToken.approve(componentsRegistryAddress, parseEther("50"));
        await tx15.wait();

        let tx16 = await componentsRegistry.createIndicatorInstance(parseEther("120"), false, 2, "BTC", 1, 88, [40]);
        await tx16.wait();

        let componentInstanceInfo1 = await componentsRegistry.getComponentInstanceInfo(1, 1);
        expect(componentInstanceInfo1[0]).to.equal(deployer.address);
        expect(componentInstanceInfo1[1]).to.equal(1);
        expect(componentInstanceInfo1[2]).to.be.false;
        expect(componentInstanceInfo1[3]).to.equal(parseEther("20"));

        let componentInstanceInfo2 = await componentsRegistry.getComponentInstanceInfo(2, 1);
        expect(componentInstanceInfo2[0]).to.equal(deployer.address);
        expect(componentInstanceInfo2[1]).to.equal(1);
        expect(componentInstanceInfo2[2]).to.be.true;
        expect(componentInstanceInfo2[3]).to.equal(parseEther("20"));

        let componentInstanceInfo3 = await componentsRegistry.getComponentInstanceInfo(1, 2);
        expect(componentInstanceInfo3[0]).to.equal(deployer.address);
        expect(componentInstanceInfo3[1]).to.equal(2);
        expect(componentInstanceInfo3[2]).to.be.true;
        expect(componentInstanceInfo3[3]).to.equal(parseEther("80"));

        let componentInstanceInfo4 = await componentsRegistry.getComponentInstanceInfo(2, 2);
        expect(componentInstanceInfo4[0]).to.equal(deployer.address);
        expect(componentInstanceInfo4[1]).to.equal(2);
        expect(componentInstanceInfo4[2]).to.be.false;
        expect(componentInstanceInfo4[3]).to.equal(parseEther("120"));

        let componentInstanceStatus1 = await componentsRegistry.getComponentInstanceStatus(1, 1);
        expect(componentInstanceStatus1).to.be.true;

        let componentInstanceStatus2 = await componentsRegistry.getComponentInstanceStatus(2, 1);
        expect(componentInstanceStatus2).to.be.false;

        let componentInstanceStatus3 = await componentsRegistry.getComponentInstanceStatus(1, 2);
        expect(componentInstanceStatus3).to.be.true;

        let componentInstanceStatus4 = await componentsRegistry.getComponentInstanceStatus(2, 2);
        expect(componentInstanceStatus4).to.be.false;

        let indicatorState1 = await componentsRegistry.getIndicatorState(1, 1);
        expect(indicatorState1[0]).to.equal("BTC");
        expect(indicatorState1[1]).to.equal(1);
        expect(indicatorState1[2]).to.equal(parseEther("10"));
        expect(indicatorState1[3].length).to.equal(0);
        expect(indicatorState1[4].length).to.equal(0);

        let indicatorState2 = await componentsRegistry.getIndicatorState(2, 1);
        expect(indicatorState2[0]).to.equal("BTC");
        expect(indicatorState2[1]).to.equal(1);
        expect(indicatorState2[2]).to.equal(0);
        expect(indicatorState2[3].length).to.equal(1);
        expect(indicatorState2[3][0]).to.equal(20);
        expect(indicatorState2[4].length).to.equal(2);
        expect(indicatorState2[4][0]).to.equal(0);
        expect(indicatorState2[4][1]).to.equal(21);

        let indicatorState3 = await componentsRegistry.getIndicatorState(1, 2);
        expect(indicatorState3[0]).to.equal("BTC");
        expect(indicatorState3[1]).to.equal(1);
        expect(indicatorState3[2]).to.equal(parseEther("10"));
        expect(indicatorState3[3].length).to.equal(0);
        expect(indicatorState3[4].length).to.equal(0);

        let indicatorState4 = await componentsRegistry.getIndicatorState(2, 2);
        expect(indicatorState4[0]).to.equal("BTC");
        expect(indicatorState4[1]).to.equal(1);
        expect(indicatorState4[2]).to.equal(0);
        expect(indicatorState4[3].length).to.equal(1);
        expect(indicatorState4[3][0]).to.equal(40);
        expect(indicatorState4[4].length).to.equal(2);
        expect(indicatorState4[4][0]).to.equal(0);
        expect(indicatorState4[4][1]).to.equal(41);

        let hasPurchasedInstance1 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedInstance1).to.be.true;

        let hasPurchasedInstance2 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 2, 1);
        expect(hasPurchasedInstance2).to.be.true;

        let hasPurchasedInstance3 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 2);
        expect(hasPurchasedInstance3).to.be.true;

        let hasPurchasedInstance4 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 2, 2);
        expect(hasPurchasedInstance4).to.be.true;
    });
  });
  
  describe("#createComparatorInstance", () => {
    it("not initialized", async () => {
        let tx = componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx).to.be.reverted;
    });

    it("component does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("first indicator does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx4).to.be.reverted;
    });

    it("second indicator does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx3.wait();

        let tx4 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx4.wait();

        let tx5 = componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx5).to.be.reverted;
    });

    it("first indicator is not active", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx5.wait();

        let tx6 = componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx6).to.be.reverted;
    });

    it("second indicator is not active", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx5.wait();

        let tx6 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 2, "BTC", 1, 5, [20]);
        await tx7.wait();

        let tx8 = await mockIndicator.setKeeper(1, deployer.address);
        await tx8.wait();

        let tx9 = await mockIndicator.update(1);
        await tx9.wait();

        let tx10 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx10.wait();

        let tx11 = componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx11).to.be.reverted;
    });

    it("have not purchased first indicator instance", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 2, "BTC", 1, 5, [20]);
        await tx7.wait();

        let tx8 = await mockIndicator.setKeeper(1, deployer.address);
        await tx8.wait();

        let tx9 = await mockIndicator.update(1);
        await tx9.wait();

        let tx10 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx10.wait();

        let tx11 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 3, "BTC", 1, 5, []);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(1);
        await tx13.wait();

        let tx14 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("10"));
        await tx14.wait();

        let tx15 = componentsRegistry.connect(otherUser).createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx15).to.be.reverted;
    });

    it("have not purchased second indicator instance", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 2, "BTC", 1, 5, [20]);
        await tx7.wait();

        let tx8 = await mockIndicator.setKeeper(1, deployer.address);
        await tx8.wait();

        let tx9 = await mockIndicator.update(1);
        await tx9.wait();

        let tx10 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx10.wait();

        let tx11 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 3, "BTC", 1, 5, []);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(1);
        await tx13.wait();

        let tx14 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("10"));
        await tx14.wait();

        let tx15 = componentsRegistry.connect(otherUser).createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await expect(tx15).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 2, "BTC", 1, 5, [20]);
        await tx7.wait();

        let tx8 = await mockIndicator.setKeeper(1, deployer.address);
        await tx8.wait();

        let tx9 = await mockIndicator.update(1);
        await tx9.wait();

        let tx10 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx10.wait();

        let tx11 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 3, "BTC", 1, 5, []);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(1);
        await tx13.wait();

        let tx14 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx14.wait();

        let tx15 = await componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await tx15.wait();

        let meetsConditions = await componentsRegistry.meetsConditions(1, 1);
        expect(meetsConditions).to.be.false;

        let componentInstanceInfo = await componentsRegistry.getComponentInstanceInfo(1, 1);
        expect(componentInstanceInfo[0]).to.equal(deployer.address);
        expect(componentInstanceInfo[1]).to.equal(1);
        expect(componentInstanceInfo[2]).to.be.false;
        expect(componentInstanceInfo[3]).to.equal(parseEther("20"));

        let comparatorState = await componentsRegistry.getComparatorState(1, 1);
        expect(comparatorState[0]).to.equal(mockIndicatorAddress);
        expect(comparatorState[1]).to.equal(mockIndicatorAddress2);
        expect(comparatorState[2]).to.equal(1);
        expect(comparatorState[3]).to.equal(1);
        expect(comparatorState[4].length).to.equal(2);
        expect(comparatorState[4][0]).to.equal(0);
        expect(comparatorState[4][1]).to.equal(0);

        let hasPurchasedInstance = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedInstance).to.be.true;
    });

    it("multiple instances", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 2, "BTC", 1, 5, [20]);
        await tx7.wait();

        let tx8 = await mockIndicator.setKeeper(1, deployer.address);
        await tx8.wait();

        let tx9 = await mockIndicator.update(1);
        await tx9.wait();

        let tx10 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx10.wait();

        let tx11 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 3, "BTC", 1, 5, []);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(1);
        await tx13.wait();

        let tx14 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx14.wait();

        let tx15 = await componentsRegistry.createComparatorInstance(parseEther("20"), false, 1, 2, 3, 1, 1);
        await tx15.wait();

        let tx16 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx16.wait();

        let tx17 = await componentsRegistry.createIndicatorInstance(parseEther("30"), false, 2, "BTC", 1, 15, [20]);
        await tx17.wait();

        let tx18 = await mockIndicator.setKeeper(2, deployer.address);
        await tx18.wait();

        let tx19 = await mockIndicator.update(2);
        await tx19.wait();

        let tx20 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx20.wait();

        let tx21 = await componentsRegistry.createIndicatorInstance(parseEther("40"), false, 2, "BTC", 1, 1, [20]);
        await tx21.wait();

        let tx22 = await mockIndicator.setKeeper(3, deployer.address);
        await tx22.wait();

        let tx23 = await mockIndicator.update(3);
        await tx23.wait();

        let tx24 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx24.wait();

        let tx25 = await componentsRegistry.createComparatorInstance(parseEther("30"), false, 1, 2, 2, 2, 3);
        await tx25.wait();

        let meetsConditions1 = await componentsRegistry.meetsConditions(1, 1);
        expect(meetsConditions1).to.be.false;

        let meetsConditions2 = await componentsRegistry.meetsConditions(1, 2);
        expect(meetsConditions2).to.be.false;

        let componentInstanceInfo1 = await componentsRegistry.getComponentInstanceInfo(1, 1);
        expect(componentInstanceInfo1[0]).to.equal(deployer.address);
        expect(componentInstanceInfo1[1]).to.equal(1);
        expect(componentInstanceInfo1[2]).to.be.false;
        expect(componentInstanceInfo1[3]).to.equal(parseEther("20"));

        let componentInstanceInfo2 = await componentsRegistry.getComponentInstanceInfo(1, 2);
        expect(componentInstanceInfo2[0]).to.equal(deployer.address);
        expect(componentInstanceInfo2[1]).to.equal(2);
        expect(componentInstanceInfo2[2]).to.be.false;
        expect(componentInstanceInfo2[3]).to.equal(parseEther("30"));

        let comparatorState1 = await componentsRegistry.getComparatorState(1, 1);
        expect(comparatorState1[0]).to.equal(mockIndicatorAddress);
        expect(comparatorState1[1]).to.equal(mockIndicatorAddress2);
        expect(comparatorState1[2]).to.equal(1);
        expect(comparatorState1[3]).to.equal(1);
        expect(comparatorState1[4].length).to.equal(2);
        expect(comparatorState1[4][0]).to.equal(0);
        expect(comparatorState1[4][1]).to.equal(0);

        let comparatorState2 = await componentsRegistry.getComparatorState(1, 2);
        expect(comparatorState2[0]).to.equal(mockIndicatorAddress);
        expect(comparatorState2[1]).to.equal(mockIndicatorAddress);
        expect(comparatorState2[2]).to.equal(2);
        expect(comparatorState2[3]).to.equal(3);
        expect(comparatorState2[4].length).to.equal(2);
        expect(comparatorState2[4][0]).to.equal(0);
        expect(comparatorState2[4][1]).to.equal(0);

        let hasPurchasedInstance1 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedInstance1).to.be.true;

        let hasPurchasedInstance2 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 2);
        expect(hasPurchasedInstance2).to.be.true;
    });
  });
  
  describe("#markComponentInstanceAsDefault", () => {
    it("not initialized", async () => {
        let tx = componentsRegistry.markComponentInstanceAsDefault(1, 1);
        await expect(tx).to.be.reverted;
    });

    it("component does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = componentsRegistry.markComponentInstanceAsDefault(1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("component instance does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = componentsRegistry.markComponentInstanceAsDefault(1, 1);
        await expect(tx3).to.be.reverted;
    });

    it("not component owner", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = componentsRegistry.connect(otherUser).markComponentInstanceAsDefault(1, 1);
        await expect(tx6).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await componentsRegistry.markComponentInstanceAsDefault(1, 1);
        await tx6.wait();

        let componentInstanceInfo = await componentsRegistry.getComponentInstanceInfo(1, 1);
        expect(componentInstanceInfo[2]).to.be.true;
    });

    it("already marked as default", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await componentsRegistry.markComponentInstanceAsDefault(1, 1);
        await tx6.wait();

        let tx7 = componentsRegistry.markComponentInstanceAsDefault(1, 1);
        await expect(tx7).to.be.reverted;
    });
  });
  
  describe("#purchaseComponentInstance", () => {
    it("not initialized", async () => {
        let tx = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx.wait();

        let tx2 = componentsRegistry.purchaseComponentInstance(1, 1);
        await expect(tx2).to.be.reverted;
    });

    it("component does not exist", async () => {
        let tx = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx.wait();

        let tx2 = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx2.wait();

        let tx3 = componentsRegistry.purchaseComponentInstance(1, 1);
        await expect(tx3).to.be.reverted;
    });

    it("instance does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let initialBalance = await feeToken.balanceOf(deployer.address);

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = componentsRegistry.purchaseComponentInstance(1, 1);
        await expect(tx4).to.be.reverted;

        let newBalance = await feeToken.balanceOf(deployer.address);
        expect(newBalance).to.equal(initialBalance);
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let initialBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let initialBalanceOther = await feeToken.balanceOf(otherUser.address);

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.connect(otherUser).createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("20"));
        await tx6.wait();

        let hasPurchasedInitial = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedInitial).to.be.false;

        let tx7 = await componentsRegistry.purchaseComponentInstance(1, 1);
        await tx7.wait();

        let hasPurchasedNew = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedNew).to.be.true;

        let newBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let newBalanceOther = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalanceDeployer = BigInt(initialBalanceDeployer) - BigInt(parseEther("20"));
        let expectedNewBalanceOther = BigInt(initialBalanceOther) + BigInt(parseEther("20"));
        expect(newBalanceDeployer.toString()).to.equal(expectedNewBalanceDeployer.toString());
        expect(newBalanceOther.toString()).to.equal(expectedNewBalanceOther.toString());
    });

    it("already purchased, not default", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let initialBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let initialBalanceOther = await feeToken.balanceOf(otherUser.address);

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.connect(otherUser).createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("20"));
        await tx6.wait();

        let hasPurchasedInitial = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedInitial).to.be.false;

        let tx7 = await componentsRegistry.purchaseComponentInstance(1, 1);
        await tx7.wait();

        let tx8 = await feeToken.approve(componentsRegistryAddress, parseEther("20"));
        await tx8.wait();

        let tx9 = componentsRegistry.purchaseComponentInstance(1, 1);
        await expect(tx9).to.be.reverted;

        let hasPurchasedNew = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedNew).to.be.true;

        let newBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let newBalanceOther = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalanceDeployer = BigInt(initialBalanceDeployer) - BigInt(parseEther("20"));
        let expectedNewBalanceOther = BigInt(initialBalanceOther) + BigInt(parseEther("20"));
        expect(newBalanceDeployer.toString()).to.equal(expectedNewBalanceDeployer.toString());
        expect(newBalanceOther.toString()).to.equal(expectedNewBalanceOther.toString());
    });

    it("already purchased, default", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let initialBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let initialBalanceOther = await feeToken.balanceOf(otherUser.address);

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.connect(otherUser).createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("20"));
        await tx6.wait();

        let hasPurchasedInitial = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 1);
        expect(hasPurchasedInitial).to.be.true;

        let tx7 = componentsRegistry.purchaseComponentInstance(1, 1);
        await expect(tx7).to.be.reverted;

        let newBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let newBalanceOther = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalanceDeployer = BigInt(initialBalanceDeployer);
        let expectedNewBalanceOther = BigInt(initialBalanceOther);
        expect(newBalanceDeployer.toString()).to.equal(expectedNewBalanceDeployer.toString());
        expect(newBalanceOther.toString()).to.equal(expectedNewBalanceOther.toString());
    });

    it("purchase multiple different instances", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let initialBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let initialBalanceOther = await feeToken.balanceOf(otherUser.address);

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.connect(otherUser).createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.connect(otherUser).createIndicatorInstance(parseEther("30"), false, 1, "BTC", 1, 20, []);
        await tx7.wait();

        let tx8 = await feeToken.approve(componentsRegistryAddress, parseEther("20"));
        await tx8.wait();

        let hasPurchasedInitial2 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 2);
        expect(hasPurchasedInitial2).to.be.false;

        let tx9 = await componentsRegistry.purchaseComponentInstance(1, 1);
        await tx9.wait();

        let tx10 = await feeToken.approve(componentsRegistryAddress, parseEther("30"));
        await tx10.wait();

        let tx11 = await componentsRegistry.purchaseComponentInstance(1, 2);
        await tx11.wait();

        let hasPurchasedNew2 = await componentsRegistry.hasPurchasedComponentInstance(deployer.address, 1, 2);
        expect(hasPurchasedNew2).to.be.true;

        let newBalanceDeployer = await feeToken.balanceOf(deployer.address);
        let newBalanceOther = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalanceDeployer = BigInt(initialBalanceDeployer) - BigInt(parseEther("50"));
        let expectedNewBalanceOther = BigInt(initialBalanceOther) + BigInt(parseEther("50"));
        expect(newBalanceDeployer.toString()).to.equal(expectedNewBalanceDeployer.toString());
        expect(newBalanceOther.toString()).to.equal(expectedNewBalanceOther.toString());
    });
  });
  
  describe("#updateComponentInstancePrice", () => {
    it("not initialized", async () => {
        let tx = componentsRegistry.updateComponentInstancePrice(1, 1, parseEther("20"));
        await expect(tx).to.be.reverted;
    });

    it("component does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = componentsRegistry.updateComponentInstancePrice(1, 1, parseEther("20"));
        await expect(tx2).to.be.reverted;
    });

    it("instance does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = componentsRegistry.updateComponentInstancePrice(1, 1, parseEther("20"));
        await expect(tx3).to.be.reverted;
    });

    it("not component instance owner", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = componentsRegistry.connect(otherUser).updateComponentInstancePrice(1, 1, parseEther("20"));
        await expect(tx6).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await componentsRegistry.updateComponentInstancePrice(1, 1, parseEther("20"));
        await tx6.wait();
    });

    it("marked as default", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = componentsRegistry.updateComponentInstancePrice(1, 1, parseEther("20"));
        await expect(tx6).to.be.reverted;
    });
  });
  
  describe("#checkInfoForUpkeep", () => {
    it("component is not valid", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistryRelayer.checkInfoForUpkeep(deployer.address, true, deployer.address, 1);
        await tx2.wait();

        let status = await componentsRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.false;
    });

    it("instance does not exist", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await componentsRegistryRelayer.checkInfoForUpkeep(deployer.address, true, mockIndicatorAddress, 1);
        await tx3.wait();

        let status = await componentsRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.false;
    });

    it("wrong instance owner", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, otherUser.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await componentsRegistryRelayer.checkInfoForUpkeep(otherUser.address, true, mockIndicatorAddress, 1);
        await tx6.wait();

        let status = await componentsRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.false;
    });

    it("wrong target", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await componentsRegistryRelayer.checkInfoForUpkeep(deployer.address, true, mockIndicatorAddress, 1);
        await tx6.wait();

        let status = await componentsRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.false;
    });

    it("meets requirements; indicator", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await componentsRegistryRelayer.checkInfoForUpkeep(deployer.address, true, mockIndicatorAddress2, 1);
        await tx6.wait();

        let status = await componentsRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.true;
    });

    it("meets requirements; comparator", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), false, 1, "BTC", 1, 5, []);
        await tx7.wait();

        let tx8 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx8.wait();

        let tx9 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx9.wait();

        let tx10 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx10.wait();

        let tx11 = await mockIndicator2.update(1);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(2, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(2);
        await tx13.wait();

        let tx14 = await componentsRegistry.createComparatorInstance(parseEther("20"), false, 2, 1, 1, 1, 2);
        await tx14.wait();

        let tx15 = await componentsRegistryRelayer.checkInfoForUpkeep(deployer.address, false, mockComparatorAddress, 1);
        await tx15.wait();

        let status = await componentsRegistryRelayer.upkeepInfoStatus();
        expect(status).to.be.true;
    });
  });

  describe("#checkRules", () => {
    it("different lengths", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistryRelayer.checkRules(deployer.address, [1], [1, 2]);
        await tx2.wait();

        let status = await componentsRegistryRelayer.rulesStatus();
        expect(status).to.be.false;
    });

    it("default instances", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx7.wait();

        let tx8 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx8.wait();

        let tx9 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx9.wait();

        let tx10 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx10.wait();

        let tx11 = await mockIndicator2.update(1);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(2, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(2);
        await tx13.wait();

        let tx14 = await componentsRegistry.createComparatorInstance(parseEther("20"), true, 2, 1, 1, 1, 2);
        await tx14.wait();

        let tx15 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx15.wait();

        let tx16 = await componentsRegistry.createComparatorInstance(parseEther("20"), true, 2, 1, 1, 1, 2);
        await tx16.wait();

        let tx17 = await componentsRegistryRelayer.checkRules(deployer.address, [2, 2], [1, 2]);
        await tx17.wait();

        let status = await componentsRegistryRelayer.rulesStatus();
        expect(status).to.be.true;
    });

    it("non-default instances; have not purchased", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx7.wait();

        let tx8 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx8.wait();

        let tx9 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx9.wait();

        let tx10 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx10.wait();

        let tx11 = await mockIndicator2.update(1);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(2, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(2);
        await tx13.wait();

        let tx14 = await componentsRegistry.createComparatorInstance(parseEther("20"), false, 2, 1, 1, 1, 2);
        await tx14.wait();

        let tx15 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx15.wait();

        let tx16 = await componentsRegistry.createComparatorInstance(parseEther("20"), false, 2, 1, 1, 1, 2);
        await tx16.wait();

        let tx17 = await componentsRegistryRelayer.checkRules(otherUser.address, [2, 2], [1, 2]);
        await tx17.wait();

        let status = await componentsRegistryRelayer.rulesStatus();
        expect(status).to.be.false;
    });

    it("non-default instances; have purchased", async () => {
        let tx = await componentsRegistry.initializeContracts(componentInstancesFactoryAddress, componentsAddress);
        await tx.wait();

        let tx2 = await componentsRegistry.publishComponent(mockIndicatorAddress2, true, deployer.address, parseEther("10"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await candlestickDataFeedRegistry.setPrice("BTC", 1, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx5.wait();

        let tx6 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx6.wait();

        let tx7 = await componentsRegistry.createIndicatorInstance(parseEther("20"), true, 1, "BTC", 1, 5, []);
        await tx7.wait();

        let tx8 = await componentsRegistry.publishComponent(mockComparatorAddress, false, deployer.address, parseEther("10"));
        await tx8.wait();

        let tx9 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx9.wait();

        let tx10 = await mockIndicator2.setKeeper(1, deployer.address);
        await tx10.wait();

        let tx11 = await mockIndicator2.update(1);
        await tx11.wait();

        let tx12 = await mockIndicator2.setKeeper(2, deployer.address);
        await tx12.wait();

        let tx13 = await mockIndicator2.update(2);
        await tx13.wait();

        let tx14 = await componentsRegistry.createComparatorInstance(parseEther("20"), false, 2, 1, 1, 1, 2);
        await tx14.wait();

        let tx15 = await feeToken.approve(componentsRegistryAddress, parseEther("10"));
        await tx15.wait();

        let tx16 = await componentsRegistry.createComparatorInstance(parseEther("20"), false, 2, 1, 1, 1, 2);
        await tx16.wait();

        let tx17 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("20"));
        await tx17.wait();

        let tx18 = await componentsRegistry.connect(otherUser).purchaseComponentInstance(2, 1);
        await tx18.wait();

        let tx19 = await feeToken.connect(otherUser).approve(componentsRegistryAddress, parseEther("20"));
        await tx19.wait();

        let tx20 = await componentsRegistry.connect(otherUser).purchaseComponentInstance(2, 2);
        await tx20.wait();

        let tx21 = await componentsRegistryRelayer.checkRules(otherUser.address, [2, 2], [1, 2]);
        await tx21.wait();

        let status = await componentsRegistryRelayer.rulesStatus();
        expect(status).to.be.true;
    });
  });
});*/