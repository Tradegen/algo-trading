// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin.
import "./openzeppelin-solidity/contracts/Ownable.sol";

// Internal references.
import './Keeper.sol';

// Inheritance.
import './interfaces/IKeeperFactory.sol';

contract KeeperFactory is IKeeperFactory, Ownable {
    address public keeperRegistry;

    constructor() Ownable() {}

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a Keeper contract and returns the contract's address.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _owner Owner of the keeper contract.
    * @param _dedicatedCaller Address of the Keeper contract's dedicated caller.
    * @return address Address of the deployed Keeper contract.
    */
    function createKeeper(address _owner, address _dedicatedCaller) external override onlyKeeperRegistry returns (address) {
        address keeperContract = address(new Keeper(keeperRegistry, _owner, _dedicatedCaller));

        emit CreatedKeeper(_owner, _dedicatedCaller, keeperContract);

        return keeperContract;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Sets the address of the KeeperRegistry contract.
    * @dev The address is initialized outside of the constructor to avoid a circular dependency with KeeperRegistry.
    * @dev This function can only be called by the KeeperFactory owner.
    * @dev This function can only be called once.
    * @param _keeperRegistry Address of the KeeperRegistry contract.
    */
    function setKeeperRegistry(address _keeperRegistry) external onlyOwner {
        require(keeperRegistry == address(0), "KeeperFactory: Already set KeeperRegistry.");

        keeperRegistry = _keeperRegistry;

        emit SetKeeperRegistry(_keeperRegistry);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyKeeperRegistry() {
        require(msg.sender == keeperRegistry,
                "KeeperFactory: Only the KeeperRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedKeeper(address owner, address dedicatedCaller, address keeperContractAddress);
    event SetKeeperRegistry(address keeperRegistryAddress);
}