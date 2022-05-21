const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("Components", () => {
  let deployer;
  let otherUser;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let components;
  let componentsAddress;
  let ComponentsFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    ComponentsFactory = await ethers.getContractFactory('Components');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;
  });

  beforeEach(async () => {
    components = await ComponentsFactory.deploy(deployer.address, feeTokenAddress);
    await components.deployed();
    componentsAddress = components.address;
  });
  
  describe("#createComponent", () => {
    it("onlyComponentRegistry", async () => {
      let tx = components.connect(otherUser).createComponent(otherUser.address, true, deployer.address, parseEther("1"));
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("1"));
        await tx.wait();

        let numberOfComponents = await components.numberOfComponents();
        expect(numberOfComponents).to.equal(1);

        let balanceOf = await components.balanceOf(deployer.address, 1);
        expect(balanceOf).to.equal(1);

        let componentInfo = await components.getComponentInfo(1);
        expect(componentInfo[0]).to.equal(deployer.address);
        expect(componentInfo[1]).to.be.true;
        expect(componentInfo[2]).to.equal(otherUser.address);
        expect(componentInfo[3]).to.equal(1);
        expect(componentInfo[4]).to.equal(parseEther("1"));
    });
  });

  describe("#setComponentInstancesAddress", () => {
    it("onlyComponentRegistry", async () => {
      let tx = components.connect(otherUser).setComponentInstancesAddress(1, feeTokenAddress);
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await components.setComponentInstancesAddress(1, feeTokenAddress);
        await tx.wait();

        let instanceAddress = await components.componentInstance(1);
        expect(instanceAddress).to.equal(feeTokenAddress);
    });

    it("already have address", async () => {
        let tx = await components.setComponentInstancesAddress(1, feeTokenAddress);
        await tx.wait();

        let tx2 = components.setComponentInstancesAddress(1, otherUser.address);
        await expect(tx2).to.be.reverted;

        let instanceAddress = await components.componentInstance(1);
        expect(instanceAddress).to.equal(feeTokenAddress);
    });
  });

  describe("#updateComponentFee", () => {
    it("onlyComponentRegistry", async () => {
      let tx = components.connect(otherUser).updateComponentFee(1, parseEther("88"));
      await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await components.updateComponentFee(1, parseEther("88"));
        await tx.wait();

        let componentInfo = await components.getComponentInfo(1);
        expect(componentInfo[4]).to.equal(parseEther("88"));
    });
  });

  describe("#safeTransferFrom", () => {
    it("only NFT owner", async () => {
        let tx = await feeToken.approve(componentsAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await components.createComponent(otherUser.address, true, deployer.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await components.connect(otherUser).setApprovalForAll(deployer.address, true);
        await tx3.wait();

        let tx4 = components.connect(otherUser).safeTransferFrom(otherUser.address, deployer.address, 1, 1, "0x00");
        await expect(tx4).to.be.reverted;
    });

    it("wrong amount", async () => {
        let tx = await feeToken.approve(componentsAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await components.createComponent(otherUser.address, true, deployer.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await components.setApprovalForAll(otherUser.address, true);
        await tx3.wait();

        let tx4 = components.safeTransferFrom(deployer.address, otherUser.address, 1, 5, "0x00");
        await expect(tx4).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await feeToken.approve(componentsAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await components.createComponent(otherUser.address, true, deployer.address, parseEther("1"));
        await tx2.wait();

        let tx3 = await components.setApprovalForAll(otherUser.address, true);
        await tx3.wait();

        let tx4 = await components.safeTransferFrom(deployer.address, otherUser.address, 1, 1, "0x00");
        await tx4.wait();

        let balanceOfDeployer = await components.balanceOf(deployer.address, 1);
        expect(balanceOfDeployer).to.equal(0);

        let balanceOfOther = await components.balanceOf(otherUser.address, 1);
        expect(balanceOfOther).to.equal(1);

        let componentInfo = await components.getComponentInfo(1);
        expect(componentInfo[0]).to.equal(otherUser.address);
    });
  });
});*/