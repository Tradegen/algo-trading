// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Libraries
import '../libraries/CandlestickUtils.sol';

interface IIndicator {

    struct State {
        address tradingBot;
        uint256 value;
        uint256 params;
        uint256[] variables;
        uint256[] history;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the name of this indicator.
    */
    function getName() external pure returns (string memory);

    /**
    * @dev Returns the value of this indicator for the given instance.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value for the given instance.
    */
    function getValue(uint256 _instance) external view returns (uint256[] memory);

    /**
    * @dev Returns the history of this indicator for the given instance.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value history for the given instance.
    */
    function getHistory(uint256 _instance) external view returns (uint256[] memory);

    /**
    * @notice Returns whether the indicator can be updated.
    */
    function canUpdate() external view returns (bool);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Creates an instance of this indicator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _params A serialized array of params to use for this indicator.
    *                The serialized array has 96 bits, consisting of 6 params with 16 bits each.
    *                Expects left-most 160 bits to be 0.
    * @return (uint256) Instance number of the indicator.
    */
    function addTradingBot(uint256 _params) external returns (uint256);

    /**
    * @dev Updates the indicator's state for the given instance, based on the latest price feed update.
    * @notice This function can only be called by the dedicated keeper of this instance.
    * @param _instanceID Instance ID of this indicator.
    * @return bool Whether the indicator was updated successfully.
    */
    function update(uint256 _instanceID) external returns (bool);

    /* ========== EVENTS ========== */

    event Updated(uint256 indexed instance, CandlestickUtils.Candlestick latestPrice, uint256 newValue);
    event AddedTradingBot(address indexed tradingBot, uint256 instance, uint256 params);
}