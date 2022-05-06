// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBotLogic {
    /**
    * @notice Updates the dedicated keeper for the trading bot.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _newKeeper Address of the keeper contract.
    */
    function setKeeper(address _newKeeper) external;
}