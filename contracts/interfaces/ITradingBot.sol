// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBot {

    struct Rule {
        address firstIndicatorAddress;
        address secondIndicatorAddress;
        address comparatorAddress;
        uint256 firstIndicatorInstance;
        uint256 secondIndicatorInstance;
        uint256 comparatorInstance;
    }

    // Views

    /**
     * @dev Returns the fee (denominated in 10000) for minting the bot's token.
     */
    function tokenMintFee() external view returns (uint256);

    /**
     * @dev Returns the fee (denominated in 10000) for trading the bot's token.
     */
    function tokenTradeFee() external view returns (uint256);

    /**
     * @dev Returns the address of the trading bot's owner.
     */
    function owner() external view returns (address);

    /**
    * @dev Returns the parameters of this trading bot.
    * @return (uint256, uint256, uint256, uint256, address) The trading bot's timeframe (in minutes), max trade duration, profit target, stop loss, and traded asset address.
    */
    function getTradingBotParameters() external view returns (uint256, uint256, uint256, uint256, address);

    /**
     * @dev Returns the trading bot's entry rules.
     */
    function getEntryRules() external view returns (Rule[] memory);

    /**
     * @dev Returns the trading bot's exit rules.
     */
    function getExitRules() external view returns (Rule[] memory);

    // Mutative

    /**
    * @dev Gets the latest price of the trading bot's traded asset and uses it to update the state of each entry/exit rule.
    * @notice Simulates an order if entry/exit rules are met.
    * @notice This function is meant to be called once per timeframe by a Keeper contract.
    */
    function onPriceFeedUpdate() external;
}