// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComparator {

    struct State {
        address firstIndicatorAddress;
        address secondIndicatorAddress;
        uint256 firstIndicatorInstance;
        uint256 secondIndicatorInstance;
        uint256[] variables;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the name of this comparator.
    */
    function getName() external pure returns (string memory);

    /**
    * @notice Returns whether the latest comparator instance update meets conditions.
    */
    function meetsConditions(uint256 _instance) external view returns (bool);

    /**
    * @notice Returns whether the comparator instance can be updated.
    * @param _instance Instance number of this comparator.
    * @return bool Whether the comparator instance can be updated.
    */
    function canUpdate(uint256 _instance) external view returns (bool);

    /**
    * @notice Returns the status of the given instance of this comparator.
    * @param _instance Instance number of this comparator.
    * @return bool Whether the comparator instance is active.
    */
    function isActive(uint256 _instance) external view returns (bool);

    /**
    * @notice Returns the state of the given comparator instance.
    * @dev Returns 0 for each value if the instance is out of bounds.
    * @param _instance Instance number of this comparator.
    * @return (address, address, uint256, uint256, uint256[]) Address of the first indicator,
    *                                                         address of the second indicator,
    *                                                         the first indicator instance,
    *                                                         the second indicator instance,
    *                                                         and an array of variables for the comparator.
    */
    function getState(uint256 _instance) external view returns (address, address, uint256, uint256, uint256[] memory); 

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Creates an instance of this comparator.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _firstIndicatorAddress Address of the comparator's first indicator.
    * @param _secondIndicatorAddress Address of the comparator's second indicator.
    * @param _firstIndicatorInstance Instance number of the first indicator.
    * @param _secondIndicatorInstance Instance number of the second indicator.
    * @return (uint256) Instance number of the comparator.
    */
    function createInstance(address _firstIndicatorAddress, address _secondIndicatorAddress, uint256 _firstIndicatorInstance, uint256 _secondIndicatorInstance) external returns (uint256);

    /**
    * @notice Returns whether the comparator's conditions are met for the given instance, and updates the comparator's variables.
    * @dev This function can only be called by the comparator instance's dedicated keeper.
    * @dev The transaction will revert if the comparator is not ready to be updated.
    * @dev Sets the comparator's 'meets conditions' status.
    * @param _instance Instance number of this comparator.
    * @return (bool) Whether the comparator's conditions were updated successfully.
    */
    function checkConditions(uint256 _instance) external returns (bool);

    /**
    * @notice Updates the dedicated keeper for the given instance of this comparator.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _instance Instance number of this comparator.
    * @param _newKeeper Address of the new keeper contract.
    */
    function setKeeper(uint256 _instance, address _newKeeper) external;

    /* ========== EVENTS ========== */

    event CreatedInstance(uint256 instance, uint256 timeframe, address firstIndicator, address secondIndicator, uint256 firstIndicatorInstance, uint256 secondIndicatorInstance);
    event CheckedConditions(uint256 instance);
    event UpdatedKeeper(uint256 instance, address newKeeper);
}