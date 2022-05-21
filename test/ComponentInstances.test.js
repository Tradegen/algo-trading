const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("ComponentInstances", () => {
  let deployer;
  let otherUser;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let componentInstances;
  let componentInstancesAddress;
  let ComponentInstancesFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    ComponentInstancesFactory = await ethers.getContractFactory('ComponentInstances');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;
  });

  beforeEach(async () => {
    componentInstances = await ComponentInstancesFactory.deploy(deployer.address, feeTokenAddress, 1);
    await componentInstances.deployed();
    componentInstancesAddress = componentInstances.address;
  });
  
  describe("#createInstance", () => {
    it("onlyComponentRegistry", async () => {
      let tx = componentInstances.connect(otherUser).createInstance(deployer.address, parseEther("1"), false, otherUser.address, parseEther("1"));
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let initialBalance = await feeToken.balanceOf(otherUser.address);

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, otherUser.address, parseEther("1"));
        await tx2.wait();

        let newBalance = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalance = BigInt(initialBalance) + BigInt(parseEther("1"));
        expect(newBalance.toString()).to.equal(expectedNewBalance.toString());

        let numberOfInstances = await componentInstances.numberOfInstances();
        expect(numberOfInstances).to.equal(1);

        let balanceOf = await componentInstances.balanceOf(deployer.address, 1);
        expect(balanceOf).to.equal(1);

        let hasPurchased = await componentInstances.hasPurchasedInstance(deployer.address, 1);
        expect(hasPurchased).to.be.true;

        let componentInfo = await componentInstances.getComponentInstanceInfo(1);
        expect(componentInfo[0]).to.equal(deployer.address);
        expect(componentInfo[1]).to.equal(1);
        expect(componentInfo[2]).to.be.false;
        expect(componentInfo[3]).to.equal(parseEther("1"));
    });
  });

  describe("#purchaseComponentInstance", () => {
    it("onlyComponentRegistry", async () => {
      let tx = componentInstances.connect(otherUser).purchaseComponentInstance(otherUser.address, 1);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, deployer.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx3.wait();

        let tx4 = await componentInstances.purchaseComponentInstance(otherUser.address, 1);
        await tx4.wait();

        let hasPurchased = await componentInstances.hasPurchasedInstance(otherUser.address, 1);
        expect(hasPurchased).to.be.true;
    });

    it("already purchased, not default", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, deployer.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx3.wait();

        let tx4 = componentInstances.purchaseComponentInstance(deployer.address, 1);
        await expect(tx4).to.be.reverted;
    });

    it("already purchased, default", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), true, deployer.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx3.wait();

        let tx4 = componentInstances.purchaseComponentInstance(otherUser.address, 1);
        await expect(tx4).to.be.reverted;
    });
  });

  describe("#markInstanceAsDefault", () => {
    it("onlyComponentRegistry", async () => {
      let tx = componentInstances.connect(otherUser).markInstanceAsDefault(1);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, otherUser.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await componentInstances.markInstanceAsDefault(1);
        await tx3.wait();

        let componentInfo = await componentInstances.getComponentInstanceInfo(1);
        expect(componentInfo[0]).to.equal(deployer.address);
        expect(componentInfo[1]).to.equal(1);
        expect(componentInfo[2]).to.be.true;
        expect(componentInfo[3]).to.equal(parseEther("1"));
    });
  });

  describe("#updateInstancePrice", () => {
    it("onlyComponentRegistry", async () => {
      let tx = componentInstances.connect(otherUser).updateInstancePrice(1, parseEther("10"));
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, otherUser.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await componentInstances.updateInstancePrice(1, parseEther("10"));
        await tx3.wait();

        let componentInfo = await componentInstances.getComponentInstanceInfo(1);
        expect(componentInfo[0]).to.equal(deployer.address);
        expect(componentInfo[1]).to.equal(1);
        expect(componentInfo[2]).to.be.false;
        expect(componentInfo[3]).to.equal(parseEther("10"));
    });
  });

  describe("#safeTransferFrom", () => {
    it("only NFT owner", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, otherUser.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await componentInstances.connect(otherUser).setApprovalForAll(deployer.address, true);
        await tx3.wait();

        let tx4 = componentInstances.connect(otherUser).safeTransferFrom(otherUser.address, deployer.address, 1, 1, "0x00");
        await expect(tx4).to.be.reverted;
    });

    it("wrong amount", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, otherUser.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await componentInstances.setApprovalForAll(otherUser.address, true);
        await tx3.wait();

        let tx4 = componentInstances.safeTransferFrom(deployer.address, otherUser.address, 1, 5, "0x00");
        await expect(tx4).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await feeToken.approve(componentInstancesAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await componentInstances.createInstance(deployer.address, parseEther("1"), false, otherUser.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await componentInstances.setApprovalForAll(otherUser.address, true);
        await tx3.wait();

        let tx4 = await componentInstances.safeTransferFrom(deployer.address, otherUser.address, 1, 1, "0x00");
        await tx4.wait();

        let balanceOfDeployer = await componentInstances.balanceOf(deployer.address, 1);
        expect(balanceOfDeployer).to.equal(0);

        let balanceOfOther = await componentInstances.balanceOf(otherUser.address, 1);
        expect(balanceOfOther).to.equal(1);

        let hasPurchased = await componentInstances.hasPurchasedInstance(otherUser.address, 1);
        expect(hasPurchased).to.be.true;
    });
  });
});*/