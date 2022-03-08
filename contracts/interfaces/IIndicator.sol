// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Interfaces
import '../interfaces/IPriceAggregator.sol';

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

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Creates an instance of this indicator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _tradingBotOwner Address of the trading bot owner.
    * @param _params A serialized array of params to use for this indicator.
    *                The serialized array has 96 bits, consisting of 6 params with 16 bits each.
    *                Expects left-most 160 bits to be 0.
    * @return (uint256) Instance number of the indicator.
    */
    function addTradingBot(address _tradingBotOwner, uint256 _params) external returns (uint256);

    /**
    * @dev Updates the indicator's state for the given instance, based on the latest price feed update.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _instance Instance number of this indicator.
    * @param _latestPrice The latest price from oracle price feed.
    */
    function update(uint256 _instance, IPriceAggregator.Candlestick memory _latestPrice) external;

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Marks this indicator as a default indicator.
    * @notice This function can only be called by the Components contract.
    * @notice Once an indicator is marked as default, it cannot go back to being a purchasable indicator.
    * @notice If an indicator is marked as default, any trading bot can integrate it for free.
    */
    function markAsDefault() external;

    /**
    * @dev Allows the user to use this indicator in trading bots.
    * @notice This function can only be called by the Components contract.
    * @notice Meant to be called by the Components contract when a user purchases this indicator.
    * @param _user Address of the user.
    */
    function registerUser(address _user) external;

    /* ========== EVENTS ========== */

    event Updated(uint256 indexed instance, IPriceAggregator.Candlestick latestPrice, uint256 newValue);
    event AddedTradingBot(address indexed tradingBot, uint256 instance, uint256 params);
    event MarkedAsDefault();
    event RegisteredUser(address user);
}