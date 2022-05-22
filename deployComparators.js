const { ethers } = require("hardhat");

const COMPONENTS_REGISTRY_ADDRESS_TESTNET = "0xe2d859a5F277dB56FFb5A9915B2D01F7e8DddFC2";
const COMPONENTS_REGISTRY_ADDRESS_MAINNET = "";

const KEEPER_REGISTRY_ADDRESS_TESTNET = "0x6E73407c98b937edCd8833e3F2C4b9D4D0e97416";
const KEEPER_REGISTRY_ADDRESS_MAINNET = "";

async function deployComparators() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let ClosesFactory = await ethers.getContractFactory('Closes');
    let CrossesAboveFactory = await ethers.getContractFactory('CrossesAbove');
    let CrossesBelowFactory = await ethers.getContractFactory('CrossesBelow');
    let FallByAtLeastFactory = await ethers.getContractFactory('FallByAtLeast');
    let FallByAtMostFactory = await ethers.getContractFactory('FallByAtMost');
    let FallsToFactory = await ethers.getContractFactory('FallsTo');
    let IsAboveFactory = await ethers.getContractFactory('IsAbove');
    let IsBelowFactory = await ethers.getContractFactory('IsBelow');
    let RiseByAtLeastFactory = await ethers.getContractFactory('RiseByAtLeast');
    let RiseByAtMostFactory = await ethers.getContractFactory('RiseByAtMost');
    let RisesToFactory = await ethers.getContractFactory('RisesTo');
    
    let closes = await ClosesFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await closes.deployed();
    let closesAddress = closes.address;
    console.log("Closes: " + closesAddress);

    let crossesAbove = await CrossesAboveFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await crossesAbove.deployed();
    let crossesAboveAddress = crossesAbove.address;
    console.log("CrossesAbove: " + crossesAboveAddress);

    let crossesBelow = await CrossesBelowFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await crossesBelow.deployed();
    let crossesBelowAddress = crossesBelow.address;
    console.log("CrossesBelow: " + crossesBelowAddress);

    let fallByAtLeast = await FallByAtLeastFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await fallByAtLeast.deployed();
    let fallByAtLeastAddress = fallByAtLeast.address;
    console.log("FallByAtLeast: " + fallByAtLeastAddress);

    let fallByAtMost = await FallByAtMostFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await fallByAtMost.deployed();
    let fallByAtMostAddress = fallByAtMost.address;
    console.log("FallByAtMost: " + fallByAtMostAddress);

    let fallsTo = await FallsToFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await fallsTo.deployed();
    let fallsToAddress = fallsTo.address;
    console.log("FallsTo: " + fallsToAddress);

    let isAbove = await IsAboveFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await isAbove.deployed();
    let isAboveAddress = isAbove.address;
    console.log("IsAbove: " + isAboveAddress);

    let isBelow = await IsBelowFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await isBelow.deployed();
    let isBelowAddress = isBelow.address;
    console.log("IsBelow: " + isBelowAddress);

    let riseByAtLeast = await RiseByAtLeastFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await riseByAtLeast.deployed();
    let riseByAtLeastAddress = riseByAtLeast.address;
    console.log("RiseByAtLeast: " + riseByAtLeastAddress);

    let riseByAtMost = await RiseByAtMostFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await riseByAtMost.deployed();
    let riseByAtMostAddress = riseByAtMost.address;
    console.log("RiseByAtMost: " + riseByAtMostAddress);

    let risesTo = await RisesToFactory.deploy(COMPONENTS_REGISTRY_ADDRESS_TESTNET, KEEPER_REGISTRY_ADDRESS_TESTNET);
    await risesTo.deployed();
    let risesToAddress = risesTo.address;
    console.log("RisesTo: " + risesToAddress);
}

deployComparators()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })