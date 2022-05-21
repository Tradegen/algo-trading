const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("ComponentInstancesFactory", () => {
  let deployer;
  let otherUser;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let componentInstances;
  let componentInstancesAddress;
  let ComponentInstancesFactory;

  let componentInstancesFactoryContract;
  let componentInstancesFactoryAddress;
  let ComponentInstancesFactoryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    ComponentInstancesFactory = await ethers.getContractFactory('ComponentInstances');
    ComponentInstancesFactoryFactory = await ethers.getContractFactory('ComponentInstancesFactory');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;
  });

  beforeEach(async () => {
    componentInstancesFactoryContract = await ComponentInstancesFactoryFactory.deploy(deployer.address, feeTokenAddress);
    await componentInstancesFactoryContract.deployed();
    componentInstancesFactoryAddress = componentInstancesFactoryContract.address;
  });
  
  describe("#createInstance", () => {
    it("onlyComponentRegistry", async () => {
      let tx = componentInstancesFactoryContract.connect(otherUser).createInstance(1);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await componentInstancesFactoryContract.createInstance(1);
        let temp = await tx.wait();
        let deployedAddress = temp.events[temp.events.length - 1].args.componentInstanceContract;
        console.log(deployedAddress);
        componentInstances = ComponentInstancesFactory.attach(deployedAddress);
        
        let componentID = await componentInstances.componentID();
        expect(componentID).to.equal(1);
    });
  });
});*/