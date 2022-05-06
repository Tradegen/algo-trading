// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponentInstancesFactory {

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a ComponentInstances contract and returns the contract's address.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _componentID ID of the indicator/comparator associated with the ComponentInstances NFT.
    * @return address Address of the deployed ComponentInstances contract.
    */
    function createInstance(uint256 _componentID) external returns (address);
}