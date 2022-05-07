// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBotFactory {

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a TradingBot contract and returns the contract's address.
    * @dev This function can only be called by the TradingBotRegistry contract.
    * @param _owner Initial owner of the trading bot.
    * @return address Address of the deployed TradingBot contract.
    */
    function createTradingBot(address _owner) external returns (address);
}