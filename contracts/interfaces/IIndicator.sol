// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IIndicator {
    /**
    * @dev Returns the name of this indicator.
    */
    function getName() external view returns (string memory);

    /**
    * @dev Creates an instance of this indicator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _params An array of params to use for this indicator.
    * @return (uint256) Instance number of the indicator.
    */
    function addTradingBot(uint256[] memory _params) external returns (uint256);

    /**
    * @dev Updates the indicator's state for the given instance, based on the latest price feed update.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _instance Instance number of this indicator.
    * @param _latestPrice The latest price from oracle price feed.
    */
    function update(uint256 _instance, uint256 _latestPrice) external;

    /**
    * @dev Returns the value of this indicator for the given instance.
    * @param _instance Instance number of this indicator.
    * @return (uin256) Indicator value for the given instance.
    */
    function getValue(uint256 _instance) external view returns (uint256);

    /**
    * @dev Returns the history of this indicator for the given instance.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value history for the given instance.
    */
    function getHistory(uint256 _instance) external view returns (uint256[] memory);
}