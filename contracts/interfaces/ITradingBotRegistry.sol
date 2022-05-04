// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBotRegistry {

    /* ========== VIEWS ========== */

    /**
    * @notice Checks trading bot info when creating a new upkeep.
    * @dev This function is meant to be called by the KeeperRegistry contract.
    * @dev Checks if _owner owns the trading bot and whether target is a valid TradingBotLogic contract.
    * @param _owner Address of the owner to check.
    * @param _target Address of the TradingBotLogic contract.
    * @return bool Whether the upkeep can be created.
    */
    function checkInfoForUpkeep(address _owner, address _target) external view returns (bool);
}