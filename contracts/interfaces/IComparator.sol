// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IComparator {

    struct State {
        address tradingBot;
        address firstIndicatorAddress;
        address secondIndicatorAddress;
        uint256 firstIndicatorInstance;
        uint256 secondIndicatorInstance;
        uint256[] variables;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the name of this comparator.
    */
    function getName() external pure returns (string memory);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Creates an instance of this comparator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _tradingBotOwner Address of the trading bot owner.
    * @param _firstIndicatorAddress Address of the comparator's first indicator.
    * @param _secondIndicatorAddress Address of the comparator's second indicator.
    * @param _firstIndicatorInstance Instance number of the first indicator.
    * @param _secondIndicatorInstance Instance number of the second indicator.
    * @return (uint256) Instance number of the comparator.
    */
    function addTradingBot(address _tradingBotOwner, address _firstIndicatorAddress, address _secondIndicatorAddress, uint256 _firstIndicatorInstance, uint256 _secondIndicatorInstance) external returns (uint256);

    /**
    * @dev Returns whether the comparator's conditions are met for the given instance.
    * @notice This function updates the state of the given instance.
    * @param _instance Instance number of this comparator.
    * @return (bool) Whether the comparator's conditions are met after the latest price feed update.
    */
    function checkConditions(uint256 _instance) external returns (bool);

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Marks this comparator as a default comparator.
    * @notice This function can only be called by the Components contract.
    * @notice Once a comparator is marked as default, it cannot go back to being a purchasable comparator.
    * @notice If a comparator is marked as default, any trading bot can integrate it for free.
    */
    function markAsDefault() external;

    /**
    * @dev Allows the user to use this comparator in trading bots.
    * @notice This function can only be called by the Components contract.
    * @notice Meant to be called by the Components contract when a user purchases this comparator.
    * @param _user Address of the user.
    */
    function registerUser(address _user) external;

    /* ========== EVENTS ========== */

    event AddedTradingBot(address indexed tradingBot, uint256 instance, address firstIndicator, address secondIndicator, uint256 firstIndicatorInstance, uint256 secondIndicatorInstance);
    event MarkedAsDefault();
    event RegisteredUser(address user);
}