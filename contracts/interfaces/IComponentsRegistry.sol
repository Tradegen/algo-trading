// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponentsRegistry {

    /* ========== VIEWS ========== */

    /**
    * @notice Checks indicator/comparator info when creating a new upkeep.
    * @dev This function is meant to be called by the KeeperRegistry contract.
    * @dev Checks if _owner owns the given instance, target is a valid indicator/comparator, and there's no existing keeper for the given instance.
    * @param _owner Address of the owner to check.
    * @param _target Address of the indicator/comparator.
    * @param _instanceID The instance ID of the indicator/comparator.
    * @return bool Whether the upkeep can be created.
    */
    function checkInfoForUpkeep(address _owner, address _target, uint256 _instanceID) external view returns (bool);
}