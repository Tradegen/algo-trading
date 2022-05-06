// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IIndicator {

    struct State {
        string asset;
        uint256 assetTimeframe;
        uint256 value;
        uint256[] params;
        uint256[] variables;
        uint256[] history;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the name of this indicator.
    */
    function getName() external pure returns (string memory);

    /**
    * @notice Returns the timeframe (in minutes) of the given instance of this indicator.
    * @dev The indicator timeframe can be different from the asset's timeframe.
    * @param _instance Instance number of this indicator.
    * @return uint256 Timeframe of the indicator instance.
    */
    function indicatorTimeframe(uint256 _instance) external view returns (uint256);

    /**
    * @notice Returns the value of this indicator for the given instance.
    * @dev Returns an empty array if the instance number is out of bounds.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value for the given instance.
    */
    function getValue(uint256 _instance) external view returns (uint256[] memory);

    /**
    * @notice Returns the history of this indicator for the given instance.
    * @dev Returns an empty array if the instance number is out of bounds.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value history for the given instance.
    */
    function getHistory(uint256 _instance) external view returns (uint256[] memory);

    /**
    * @notice Returns whether the indicator instance can be updated.
    * @param _instance Instance number of this indicator.
    * @return bool Whether the indicator instance can be updated.
    */
    function canUpdate(uint256 _instance) external view returns (bool);

    /**
    * @notice Returns the status of the given instance of this indicator.
    * @param _instance Instance number of this indicator.
    * @return bool Whether the indicator instance is active.
    */
    function isActive(uint256 _instance) external view returns (bool);

    /**
    * @notice Returns the state of the given indicator instance.
    * @dev Returns 0 for each value if the instance is out of bounds.
    * @param _instance Instance number of this indicator.
    * @return (string, address, uint256, uint256, uint256[])  Asset symbol,
    *                                                         timeframe of the asset (in minutes),
    *                                                         the current value of the given instance,
    *                                                         an array of params for the given instance,
    *                                                         an array of variables for the given instance,
    *                                                         the history of the given instance.
    */
    function getState(uint256 _instance) external view returns (string memory, uint256, uint256, uint256[] memory, uint256[] memory, uint256[] memory); 

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Creates an instance of this indicator.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _asset Symbol of the asset.
    * @param _assetTimeframe Timeframe (in minutes) of the asset's data feed.
    * @param _indicatorTimeframe Timeframe (in minutes) of the indicator instance.
    * @param _params An array of parameters.
    * @return (uint256) Instance number of the indicator.
    */
    function createInstance(string memory _asset, uint256 _assetTimeframe, uint256 _indicatorTimeframe, uint256[] memory _params) external returns (uint256);

    /**
    * @notice Updates the indicator's state for the given instance, based on the latest price feed update.
    * @dev This function can only be called by the dedicated keeper of this instance.
    * @param _instance Instance number of this indicator.
    * @return bool Whether the indicator was updated successfully.
    */
    function update(uint256 _instance) external returns (bool);

    /**
    * @notice Updates the dedicated keeper for the given instance of this indicator.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _instance Instance number of this indicator.
    * @param _newKeeper Address of the new keeper contract.
    */
    function setKeeper(uint256 _instance, address _newKeeper) external;

    /* ========== EVENTS ========== */

    event Updated(uint256 indexed instance, uint256 latestPrice, uint256 newValue);
    event CreatedInstance(uint256 instance, string asset, uint256 assetTimeframe, uint256 indicatorTimeframe, uint256[] params);
    event UpdatedKeeper(uint256 instance, address newKeeper);
}