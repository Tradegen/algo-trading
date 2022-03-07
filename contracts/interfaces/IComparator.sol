// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IComparator {
    /**
    * @dev Creates an instance of this comparator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _firstIndicatorAddress Address of the comparator's first indicator.
    * @param _secondIndicatorAddress Address of the comparator's second indicator.
    * @return (uint256) Index of this instance of the comparator.
    */
    function addTradingBot(address _firstIndicatorAddress, address _secondIndicatorAddress) external returns (uint256);

    /**
    * @dev Returns whether the comparator's conditions are met for the given instance.
    * @notice This function updates the state of the given instance.
    * @param _instance Instance number of this comparator.
    * @return (bool) Whether the comparator's conditions are met after the latest price feed update.
    */
    function checkConditions(uint256 _instance) external returns (bool);
}