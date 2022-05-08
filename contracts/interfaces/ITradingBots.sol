// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBots {
    /**
    * @notice Mints an NFT for the given trading bot.
    * @dev This function can only be called by the TradingBotRegistry contract.
    * @param _tokenID ID to use for the trading bot token.
    * @param _owner Address of the trading bot owner (the recipient of the NFT).
    */
    function mintTradingBot(uint256 _tokenID, address _owner) external;
}