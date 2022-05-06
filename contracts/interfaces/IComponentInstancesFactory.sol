// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponentInstancesFactory {

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Mints an NFT for the given component instance.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _owner Address of the instance's owner.
    * @param _price The price, in TGEN, to use the instance.
    * @param _isDefault Whether the instance is default.
    */
    function createInstance(address _owner, uint256 _price, bool _isDefault) external;
}