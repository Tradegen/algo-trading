const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("Marketplace", () => {
  let deployer;
  let otherUser;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let componentInstances;
  let componentInstancesAddress;
  let ComponentInstancesFactory;

  let tradingBotsNFT;
  let tradingBotsNFTAddress;
  let TradingBotsNFTFactory;

  let components;
  let componentsAddress;
  let ComponentsFactory;

  let marketplace;
  let marketplaceAddress;
  let MarketplaceFactory;

  let tradingBot;
  let tradingBotAddress;
  let TradingBotFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    ComponentsFactory = await ethers.getContractFactory('Components');
    TradingBotsNFTFactory = await ethers.getContractFactory('TradingBots');
    TradingBotFactory = await ethers.getContractFactory('TestTradingBot');
    ComponentInstancesFactory = await ethers.getContractFactory('ComponentInstances');
    MarketplaceFactory = await ethers.getContractFactory('Marketplace');

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    let tx = await feeToken.transfer(otherUser.address, parseEther("10000"));
    await tx.wait();
  });

  beforeEach(async () => {
    components = await ComponentsFactory.deploy(deployer.address, feeTokenAddress);
    await components.deployed();
    componentsAddress = components.address;

    componentInstances = await ComponentInstancesFactory.deploy(deployer.address, feeTokenAddress, 1);
    await componentInstances.deployed();
    componentInstancesAddress = componentInstances.address;

    tradingBotsNFT = await TradingBotsNFTFactory.deploy();
    await tradingBotsNFT.deployed();
    tradingBotsNFTAddress = tradingBotsNFT.address;

    tradingBot = await TradingBotFactory.deploy();
    await tradingBot.deployed();
    tradingBotAddress = tradingBot.address;

    // Use componentsAddress as xTGEN.
    marketplace = await MarketplaceFactory.deploy(componentsAddress, tradingBotsNFTAddress, feeTokenAddress, componentsAddress);
    await marketplace.deployed();
    marketplaceAddress = marketplace.address;

    let tx = await tradingBotsNFT.setTradingBotRegistryAddress(deployer.address);
    await tx.wait();
  });
  
  describe("#setTransactionFee", () => {
    it("only owner", async () => {
      let tx = marketplace.connect(otherUser).setTransactionFee(300);
      await expect(tx).to.be.reverted;

      let fee = await marketplace.transactionFee();
      expect(fee).to.equal(200);
    });

    it("new fee is too high", async () => {
        let tx = marketplace.setTransactionFee(9999999);
        await expect(tx).to.be.reverted;
  
        let fee = await marketplace.transactionFee();
        expect(fee).to.equal(200);
      });

    it("meets requirements", async () => {
        let tx = await marketplace.setTransactionFee(500);
        await tx.wait();

        let fee = await marketplace.transactionFee();
        expect(fee).to.equal(500);
    });
  });
  
  describe("#createListing", () => {
    it("invalid contract type", async () => {
        let tx = marketplace.createListing(1, 5, 1, parseEther("10"));
        await expect(tx).to.be.reverted;

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(0);
    });

    it("meets requirements; trading bot", async () => {
        let tx = await tradingBotsNFT.mintTradingBot(1, deployer.address, tradingBotAddress);
        await tx.wait();

        let tx2 = await tradingBotsNFT.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 0, 5, parseEther("50"));
        await tx3.wait();

        let balance = await tradingBotsNFT.balanceOf(marketplaceAddress, 1);
        expect(balance).to.equal(1);

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(1);

        let listingIndex = await marketplace.listingIndexes(1, 0, 0);
        expect(listingIndex).to.equal(1);

        let userToListingIndex = await marketplace.userToListingIndex(deployer.address, 0, 0, 1);
        expect(userToListingIndex).to.equal(1);

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[0]).to.equal(deployer.address);
        expect(listing[1]).to.be.true;
        expect(listing[2]).to.equal(0);
        expect(listing[3]).to.equal(0);
        expect(listing[4]).to.equal(1);
        expect(listing[5]).to.equal(parseEther("50"));
    });

    it("meets requirements; component", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let balance = await components.balanceOf(marketplaceAddress, 1);
        expect(balance).to.equal(1);

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(1);

        let listingIndex = await marketplace.listingIndexes(1, 1, 0);
        expect(listingIndex).to.equal(1);

        let userToListingIndex = await marketplace.userToListingIndex(deployer.address, 1, 0, 1);
        expect(userToListingIndex).to.equal(1);

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[0]).to.equal(deployer.address);
        expect(listing[1]).to.be.true;
        expect(listing[2]).to.equal(1);
        expect(listing[3]).to.equal(0);
        expect(listing[4]).to.equal(1);
        expect(listing[5]).to.equal(parseEther("50"));
    });

    it("meets requirements; component instance", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setComponentInstancesAddress(1, componentInstancesAddress);
        await tx2.wait();

        let tx3 = await feeToken.approve(componentInstancesAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentInstances.createInstance(deployer.address, parseEther("30"), false, otherUser.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentInstances.setApprovalForAll(marketplaceAddress, true);
        await tx5.wait();

        let tx6 = await marketplace.createListing(1, 2, 1, parseEther("50"));
        await tx6.wait();

        let balance = await componentInstances.balanceOf(marketplaceAddress, 1);
        expect(balance).to.equal(1);

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(1);

        let listingIndex = await marketplace.listingIndexes(1, 2, 1);
        expect(listingIndex).to.equal(1);

        let userToListingIndex = await marketplace.userToListingIndex(deployer.address, 2, 1, 1);
        expect(userToListingIndex).to.equal(1);

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[0]).to.equal(deployer.address);
        expect(listing[1]).to.be.true;
        expect(listing[2]).to.equal(2);
        expect(listing[3]).to.equal(1);
        expect(listing[4]).to.equal(1);
        expect(listing[5]).to.equal(parseEther("50"));
    });

    it("already have a listing for the NFT", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = marketplace.createListing(1, 1, 1, parseEther("10"));
        await expect(tx4).to.be.reverted;

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(1);
    });

    it("multiple listings; different contract types", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = await tradingBotsNFT.mintTradingBot(1, deployer.address, tradingBotAddress);
        await tx4.wait();

        let tx5 = await tradingBotsNFT.setApprovalForAll(marketplaceAddress, true);
        await tx5.wait();

        let tx6 = await marketplace.createListing(1, 0, 5, parseEther("30"));
        await tx6.wait();

        let balanceComponent = await components.balanceOf(marketplaceAddress, 1);
        expect(balanceComponent).to.equal(1);

        let balanceTradingBot = await tradingBotsNFT.balanceOf(marketplaceAddress, 1);
        expect(balanceTradingBot).to.equal(1);

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(2);

        let listingIndex1 = await marketplace.listingIndexes(1, 1, 0);
        expect(listingIndex1).to.equal(1);

        let listingIndex2 = await marketplace.listingIndexes(1, 0, 0);
        expect(listingIndex2).to.equal(2);

        let userToListingIndex1 = await marketplace.userToListingIndex(deployer.address, 1, 0, 1);
        expect(userToListingIndex1).to.equal(1);

        let userToListingIndex2 = await marketplace.userToListingIndex(deployer.address, 0, 0, 1);
        expect(userToListingIndex2).to.equal(2);

        let listing1 = await marketplace.getMarketplaceListing(1);
        expect(listing1[0]).to.equal(deployer.address);
        expect(listing1[1]).to.be.true;
        expect(listing1[2]).to.equal(1);
        expect(listing1[3]).to.equal(0);
        expect(listing1[4]).to.equal(1);
        expect(listing1[5]).to.equal(parseEther("50"));

        let listing2 = await marketplace.getMarketplaceListing(2);
        expect(listing2[0]).to.equal(deployer.address);
        expect(listing2[1]).to.be.true;
        expect(listing2[2]).to.equal(0);
        expect(listing2[3]).to.equal(0);
        expect(listing2[4]).to.equal(1);
        expect(listing2[5]).to.equal(parseEther("30"));
    });

    it("multiple listings; same contract type", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.createComponent(otherUser.address, true, deployer.address, parseEther("30"));
        await tx2.wait();

        let tx3 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx3.wait();

        let tx4 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx4.wait();

        let tx5 = await marketplace.createListing(2, 1, 10, parseEther("88"));
        await tx5.wait();

        let balance1 = await components.balanceOf(marketplaceAddress, 1);
        expect(balance1).to.equal(1);

        let balance2 = await components.balanceOf(marketplaceAddress, 2);
        expect(balance2).to.equal(1);

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(2);

        let listingIndex1 = await marketplace.listingIndexes(1, 1, 0);
        expect(listingIndex1).to.equal(1);

        let listingIndex2 = await marketplace.listingIndexes(2, 1, 0);
        expect(listingIndex2).to.equal(2);

        let userToListingIndex1 = await marketplace.userToListingIndex(deployer.address, 1, 0, 1);
        expect(userToListingIndex1).to.equal(1);

        let userToListingIndex2 = await marketplace.userToListingIndex(deployer.address, 1, 0, 2);
        expect(userToListingIndex2).to.equal(2);

        let listing1 = await marketplace.getMarketplaceListing(1);
        expect(listing1[0]).to.equal(deployer.address);
        expect(listing1[1]).to.be.true;
        expect(listing1[2]).to.equal(1);
        expect(listing1[3]).to.equal(0);
        expect(listing1[4]).to.equal(1);
        expect(listing1[5]).to.equal(parseEther("50"));

        let listing2 = await marketplace.getMarketplaceListing(2);
        expect(listing2[0]).to.equal(deployer.address);
        expect(listing2[1]).to.be.true;
        expect(listing2[2]).to.equal(1);
        expect(listing2[3]).to.equal(0);
        expect(listing2[4]).to.equal(2);
        expect(listing2[5]).to.equal(parseEther("88"));
    });
  });
  
  describe("#updatePrice", () => {
    it("index out of range", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = marketplace.updatePrice(1000, parseEther("99"));
        await expect(tx4).to.be.reverted;

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[5]).to.equal(parseEther("50"));
    });

    it("only seller", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = marketplace.connect(otherUser).updatePrice(1, parseEther("99"));
        await expect(tx4).to.be.reverted;

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[5]).to.equal(parseEther("50"));
      });

    it("meets requirements", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = await marketplace.updatePrice(1, parseEther("99"));
        await tx4.wait();

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[5]).to.equal(parseEther("99"));
    });
  });
  
  describe("#removeListing", () => {
    it("index out of range", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = marketplace.removeListing(1000);
        await expect(tx4).to.be.reverted;

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.true;
    });

    it("only seller", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = marketplace.connect(otherUser).removeListing(1);
        await expect(tx4).to.be.reverted;

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.true;
      });

    it("meets requirements; component", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = await marketplace.removeListing(1);
        await tx4.wait();

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.false;

        let balance = await components.balanceOf(deployer.address, 1);
        expect(balance).to.equal(1);
    });

    it("meets requirements; trading bot", async () => {
        let tx = await tradingBotsNFT.mintTradingBot(1, deployer.address, tradingBotAddress);
        await tx.wait();

        let tx2 = await tradingBotsNFT.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 0, 5, parseEther("50"));
        await tx3.wait();

        let tx4 = await marketplace.removeListing(1);
        await tx4.wait();

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.false;

        let balance = await tradingBotsNFT.balanceOf(deployer.address, 1);
        expect(balance).to.equal(1);
    });

    it("meets requirements; component instance", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setComponentInstancesAddress(1, componentInstancesAddress);
        await tx2.wait();

        let tx3 = await feeToken.approve(componentInstancesAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentInstances.createInstance(deployer.address, parseEther("30"), false, otherUser.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentInstances.setApprovalForAll(marketplaceAddress, true);
        await tx5.wait();

        let tx6 = await marketplace.createListing(1, 2, 1, parseEther("50"));
        await tx6.wait();

        let tx7 = await marketplace.removeListing(1);
        await tx7.wait();

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.false;

        let balance = await componentInstances.balanceOf(deployer.address, 1);
        expect(balance).to.equal(1);
    });

    it("meets requirements; create another listing after removing", async () => {
        let tx = await tradingBotsNFT.mintTradingBot(1, deployer.address, tradingBotAddress);
        await tx.wait();

        let tx2 = await tradingBotsNFT.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 0, 5, parseEther("50"));
        await tx3.wait();

        let tx4 = await marketplace.removeListing(1);
        await tx4.wait();

        let tx5 = await tradingBotsNFT.setApprovalForAll(marketplaceAddress, true);
        await tx5.wait();

        let tx6 = await marketplace.createListing(1, 0, 5, parseEther("50"));
        await tx6.wait();

        let numberOfMarketplaceListings = await marketplace.numberOfMarketplaceListings();
        expect(numberOfMarketplaceListings).to.equal(2);

        let listing = await marketplace.getMarketplaceListing(2);
        expect(listing[1]).to.be.true;

        let balance = await tradingBotsNFT.balanceOf(deployer.address, 1);
        expect(balance).to.equal(0);
    });
  });
  
  describe("#purchase", () => {
    it("index out of range", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = marketplace.purchase(1000);
        await expect(tx4).to.be.reverted;

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.true;
    });

    it("listing does not exist", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = await marketplace.removeListing(1);
        await tx4.wait();

        let tx5 = marketplace.purchase(1);
        await expect(tx5).to.be.reverted;

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.false;
    });

    it("cannot buy your own NFT", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = marketplace.purchase(1);
        await expect(tx4).to.be.reverted;

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.true;
    });

    it("meets requirements; component", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 1, 1, parseEther("50"));
        await tx3.wait();

        let tx4 = await feeToken.connect(otherUser).approve(marketplaceAddress, parseEther("50"));
        await tx4.wait();

        let initialTGENBalanceStaking = await feeToken.balanceOf(componentsAddress);
        let initialTGENBalanceSeller = await feeToken.balanceOf(deployer.address);

        let tx5 = await marketplace.connect(otherUser).purchase(1);
        await tx5.wait();

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.false;

        let userToListingIndex = await marketplace.userToListingIndex(deployer.address, 1, 0, 1);
        expect(userToListingIndex).to.equal(0);

        let listingIndex = await marketplace.listingIndexes(1, 1, 0);
        expect(listingIndex).to.equal(0);

        let balanceDeployer = await components.balanceOf(deployer.address, 1);
        expect(balanceDeployer).to.equal(0);

        let balanceOther = await components.balanceOf(otherUser.address, 1);
        expect(balanceOther).to.equal(1);

        let newTGENBalanceStaking = await feeToken.balanceOf(componentsAddress);
        let expectedNewTGENBalanceStaking = BigInt(initialTGENBalanceStaking) + BigInt(parseEther("1"));
        expect(newTGENBalanceStaking.toString()).to.equal(expectedNewTGENBalanceStaking.toString());

        let newTGENBalanceSeller = await feeToken.balanceOf(deployer.address);
        let expectedNewTGENBalanceSeller = BigInt(initialTGENBalanceSeller) + BigInt(parseEther("49"));
        expect(newTGENBalanceSeller.toString()).to.equal(expectedNewTGENBalanceSeller.toString());
    });

    it("meets requirements; trading bot", async () => {
        let tx = await tradingBotsNFT.mintTradingBot(1, deployer.address, tradingBotAddress);
        await tx.wait();

        let tx2 = await tradingBotsNFT.setApprovalForAll(marketplaceAddress, true);
        await tx2.wait();

        let tx3 = await marketplace.createListing(1, 0, 5, parseEther("50"));
        await tx3.wait();

        let tx4 = await feeToken.connect(otherUser).approve(marketplaceAddress, parseEther("50"));
        await tx4.wait();

        let initialTGENBalanceStaking = await feeToken.balanceOf(componentsAddress);
        let initialTGENBalanceSeller = await feeToken.balanceOf(deployer.address);

        let tx5 = await marketplace.connect(otherUser).purchase(1);
        await tx5.wait();

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.false;

        let userToListingIndex = await marketplace.userToListingIndex(deployer.address, 0, 0, 1);
        expect(userToListingIndex).to.equal(0);

        let listingIndex = await marketplace.listingIndexes(1, 0, 0);
        expect(listingIndex).to.equal(0);

        let balanceDeployer = await tradingBotsNFT.balanceOf(deployer.address, 1);
        expect(balanceDeployer).to.equal(0);

        let balanceOther = await tradingBotsNFT.balanceOf(otherUser.address, 1);
        expect(balanceOther).to.equal(1);

        let newTGENBalanceStaking = await feeToken.balanceOf(componentsAddress);
        let expectedNewTGENBalanceStaking = BigInt(initialTGENBalanceStaking) + BigInt(parseEther("1"));
        expect(newTGENBalanceStaking.toString()).to.equal(expectedNewTGENBalanceStaking.toString());

        let newTGENBalanceSeller = await feeToken.balanceOf(deployer.address);
        let expectedNewTGENBalanceSeller = BigInt(initialTGENBalanceSeller) + BigInt(parseEther("49"));
        expect(newTGENBalanceSeller.toString()).to.equal(expectedNewTGENBalanceSeller.toString());
    });

    it("meets requirements; component instance", async () => {
        let tx = await components.createComponent(otherUser.address, true, deployer.address, parseEther("10"));
        await tx.wait();

        let tx2 = await components.setComponentInstancesAddress(1, componentInstancesAddress);
        await tx2.wait();

        let tx3 = await feeToken.approve(componentInstancesAddress, parseEther("10"));
        await tx3.wait();

        let tx4 = await componentInstances.createInstance(deployer.address, parseEther("30"), false, otherUser.address, parseEther("10"));
        await tx4.wait();

        let tx5 = await componentInstances.setApprovalForAll(marketplaceAddress, true);
        await tx5.wait();

        let tx6 = await marketplace.createListing(1, 2, 1, parseEther("50"));
        await tx6.wait();

        let tx8 = await feeToken.connect(otherUser).approve(marketplaceAddress, parseEther("50"));
        await tx8.wait();

        let initialTGENBalanceStaking = await feeToken.balanceOf(componentsAddress);
        let initialTGENBalanceSeller = await feeToken.balanceOf(deployer.address);

        let tx9 = await marketplace.connect(otherUser).purchase(1);
        await tx9.wait();

        let listing = await marketplace.getMarketplaceListing(1);
        expect(listing[1]).to.be.false;

        let userToListingIndex = await marketplace.userToListingIndex(deployer.address, 2, 1, 1);
        expect(userToListingIndex).to.equal(0);

        let listingIndex = await marketplace.listingIndexes(1, 2, 1);
        expect(listingIndex).to.equal(0);

        let balanceDeployer = await componentInstances.balanceOf(deployer.address, 1);
        expect(balanceDeployer).to.equal(0);

        let balanceOther = await componentInstances.balanceOf(otherUser.address, 1);
        expect(balanceOther).to.equal(1);

        let newTGENBalanceStaking = await feeToken.balanceOf(componentsAddress);
        let expectedNewTGENBalanceStaking = BigInt(initialTGENBalanceStaking) + BigInt(parseEther("1"));
        expect(newTGENBalanceStaking.toString()).to.equal(expectedNewTGENBalanceStaking.toString());

        let newTGENBalanceSeller = await feeToken.balanceOf(deployer.address);
        let expectedNewTGENBalanceSeller = BigInt(initialTGENBalanceSeller) + BigInt(parseEther("49"));
        expect(newTGENBalanceSeller.toString()).to.equal(expectedNewTGENBalanceSeller.toString());
    });
  });
});