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

    /**
    * @notice Returns whether the comparator can be updated.
    */
    function canUpdate() external view returns (bool);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Creates an instance of this comparator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _firstIndicatorAddress Address of the comparator's first indicator.
    * @param _secondIndicatorAddress Address of the comparator's second indicator.
    * @param _firstIndicatorInstance Instance number of the first indicator.
    * @param _secondIndicatorInstance Instance number of the second indicator.
    * @return (uint256) Instance number of the comparator.
    */
    function addTradingBot(address _firstIndicatorAddress, address _secondIndicatorAddress, uint256 _firstIndicatorInstance, uint256 _secondIndicatorInstance) external returns (uint256);

    /**
    * @dev Returns whether the comparator's conditions are met for the given instance.
    * @notice This function updates the state of the given instance.
    * @param _instanceID Instance ID of this comparator.
    * @return (bool) Whether the comparator's conditions are met after the latest price feed update.
    */
    function checkConditions(uint256 _instanceID) external returns (bool);

    /* ========== EVENTS ========== */

    event AddedTradingBot(address indexed tradingBot, uint256 instance, address firstIndicator, address secondIndicator, uint256 firstIndicatorInstance, uint256 secondIndicatorInstance);
}