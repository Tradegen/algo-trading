const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("KeeperFactory", () => {
  let deployer;
  let otherUser;

  let keeper;
  let keeperAddress;
  let KeeperFactory;

  let keeperFactoryContract;
  let keeperFactoryAddress;
  let KeeperFactoryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    KeeperFactory = await ethers.getContractFactory('Keeper');
    KeeperFactoryFactory = await ethers.getContractFactory('KeeperFactory');
  });

  beforeEach(async () => {
    keeperFactoryContract = await KeeperFactoryFactory.deploy();
    await keeperFactoryContract.deployed();
    keeperFactoryAddress = keeperFactoryContract.address;
  });

  describe("#setKeeperRegistry", () => {
    it("only owner", async () => {
      let tx = keeperFactoryContract.connect(otherUser).setKeeperRegistry(otherUser.address);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await keeperFactoryContract.setKeeperRegistry(otherUser.address);
        await tx.wait();

        let registry = await keeperFactoryContract.keeperRegistry();
        expect(registry).to.equal(otherUser.address);
    });

    it("already set", async () => {
        let tx = await keeperFactoryContract.setKeeperRegistry(otherUser.address);
        await tx.wait();

        let tx2 = keeperFactoryContract.setKeeperRegistry(deployer.address);
        await expect(tx2).to.be.reverted;

        let registry = await keeperFactoryContract.keeperRegistry();
        expect(registry).to.equal(otherUser.address);
    });
  });
  
  describe("#createKeeper", () => {
    it("onlyKeeperRegistry", async () => {
      let tx = keeperFactoryContract.connect(otherUser).createKeeper(deployer.address, deployer.address);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await keeperFactoryContract.setKeeperRegistry(deployer.address);
        await tx.wait();

        let tx2 = await keeperFactoryContract.createKeeper(deployer.address, deployer.address);
        let temp = await tx2.wait();
        let deployedAddress = temp.events[temp.events.length - 1].args.keeperContractAddress;
        console.log(deployedAddress);
        keeper = KeeperFactory.attach(deployedAddress);
        
        let owner = await keeper.owner();
        expect(owner).to.equal(deployer.address);

        let dedicatedCaller = await keeper.dedicatedCaller();
        expect(dedicatedCaller).to.equal(deployer.address);
    });
  });
});*/