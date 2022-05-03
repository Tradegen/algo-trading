// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBot {

    struct Parameters {
        uint256 maxTradeDuration;
        uint256 timeframe;
        uint256 profitTarget;
        uint256 stopLoss;
        address tradedAsset;
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
    * @notice Returns whether the trading bot can be updated.
    */
    function canUpdate() external view returns (bool);

    // Mutative

    /**
    * @dev Updates the owner of this trading bot.
    * @notice This function is meant to be called by the TradingBots contract.
    * @param _newOwner Address of the new owner.
    */
    function updateOwner(address _newOwner) external;

    /**
    * @dev Initializes the parameters for the trading bot.
    * @notice This function is meant to be called by the TradingBots contract when creating a trading bot.
    * @param _name Name of the trading bot.
    * @param _symbol Symbol of the trading bot.
    * @param _mintFee Fee to charge when users mint a synthetic bot token. Denominated in 10000.
    * @param _tradeFee Fee to charge when users trade a synthetic bot token. Denominated in 10000.
    * @param _timeframe Number of candlesticks per aggregate candlestick. Must be greater than 0.
    * @param _maxTradeDuration Maximum number of aggregate candlesticks a trade can last for.
    * @param _profitTarget % profit target for a trade. Denominated in 10000.
    * @param _stopLoss % stop loss for a trade. Denominated in 10000.
    * @param _tradedAsset Address of the asset this bot will simulate trades for.
    */
    function initialize(string memory _name, string memory _symbol, uint256 _mintFee, uint256 _tradeFee, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, address _tradedAsset) external;

    /**
    * @dev Generates entry/exit rules for the trading bot.
    * @notice This function is meant to be called by the TradingBots contract when creating a trading bot.
    * @notice This function can only be called once.
    * @param _serializedEntryRules An array of entry rules; each entry rule is packed into a uint256.
    * @param _serializedExitRules An array of exit rules; each exit rule is packed into a uint256.
    */
    function generateRules(uint256[] memory _serializedEntryRules, uint256[] memory _serializedExitRules) external;

    function update() external returns (bool);
}