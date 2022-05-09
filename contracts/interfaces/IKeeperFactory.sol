// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IKeeperFactory {

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a Keeper contract and returns the contract's address.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _owner Owner of the keeper contract.
    * @param _dedicatedCaller Address of the Keeper contract's dedicated caller.
    * @return address Address of the deployed Keeper contract.
    */
    function createKeeper(address _owner, address _dedicatedCaller) external returns (address);
}