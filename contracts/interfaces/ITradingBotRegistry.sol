// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBotRegistry {

    struct TradingBotInfo {
        address owner;
        uint256 status; // 1 = staged, 2 = created contract, 3 = initialized, 4 = checked rules, 5 = minted NFT
        string name;
        string symbol;
        uint256 timeframe;
        uint256 maxTradeDuration;
        uint256 profitTarget;
        uint256 stopLoss;
        string tradedAsset;
        uint256 assetTimeframe;
        uint256 usageFee;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Checks trading bot info when creating a new upkeep.
    * @dev This function is meant to be called by the KeeperRegistry contract.
    * @dev Checks if _owner owns the trading bot and whether target is a valid TradingBot contract.
    * @param _owner Address of the owner to check.
    * @param _target Address of the TradingBot contract.
    * @return bool Whether the upkeep can be created.
    */
    function checkInfoForUpkeep(address _owner, address _target) external view returns (bool);

    /**
    * @notice Returns the address of the given trading bot's data feed.
    * @dev Returns address(0) if the bot is not found or if the bot does not have a data feed.
    * @dev Either [_index] or [_tradingBot] is used for getting the data.
    * @dev If [_index] is 0, then [_tradingBot] is used.
    * @dev If [_tradingBot] is address(0), then [_index] is used.
    * @dev If [_index] and [_tradingBot] are both valid values, then [_index] is used.
    * @param _index Index of the trading bot.
    * @param _tradingBot Address of the trading bot.
    * @return address Address of the trading bot's data feed.
    */
    function getTradingBotDataFeed(uint256 _index, address _tradingBot) external view returns (address);

    /**
    * @notice Returns the address of the given trading bot's owner.
    * @dev Returns address(0) if the bot is not found.
    * @dev Either [_index] or [_tradingBot] is used for getting the data.
    * @dev If [_index] is 0, then [_tradingBot] is used.
    * @dev If [_tradingBot] is address(0), then [_index] is used.
    * @dev If [_index] and [_tradingBot] are both valid values, then [_index] is used.
    * @param _index Index of the trading bot.
    * @param _tradingBot Address of the trading bot.
    * @return address Address of the trading bot's owner.
    */
    function getOwner(uint256 _index, address _tradingBot) external view returns (address);

    /**
    * @notice Returns whether the given trading bot can be updated.
    * @dev Returns false if the bot is not found.
    * @dev Either [_index] or [_tradingBot] is used for getting the data.
    * @dev If [_index] is 0, then [_tradingBot] is used.
    * @dev If [_tradingBot] is address(0), then [_index] is used.
    * @dev If [_index] and [_tradingBot] are both valid values, then [_index] is used.
    * @param _index Index of the trading bot.
    * @param _tradingBot Address of the trading bot.
    * @return address Whether the trading bot can be updated.
    */
    function canUpdate(uint256 _index, address _tradingBot) external view returns (bool);

    /**
    * @notice Returns the parameters of the given trading bot.
    * @dev Returns 0 for each value if the bot is not found.
    * @dev Either [_index] or [_tradingBot] is used for getting the data.
    * @dev If [_index] is 0, then [_tradingBot] is used.
    * @dev If [_tradingBot] is address(0), then [_index] is used.
    * @dev If [_index] and [_tradingBot] are both valid values, then [_index] is used.
    * @param _index Index of the trading bot.
    * @param _tradingBot Address of the trading bot.
    * @return (uint256, uint256, uint256, uint256, string, uint256) The trading bot's timeframe (in minutes), max trade duration, profit target, stop loss, the traded asset symbol, and the asset's timeframe.
    */
    function getTradingBotParams(uint256 _index, address _tradingBot) external view returns (uint256, uint256, uint256, uint256, string memory, uint256);

    /* ========== MUTATIVE FUNCTIONS ========== */
    
    /**
    * @notice Updates the address of the given trading bot's data feed.
    * @dev Only the owner of the TradingBotRegistry contract can call this function.
    * @dev Transaction will revert if the trading bot is not found.
    * @param _index Index of the trading bot.
    * @param _dataFeed Address of the BotPerformanceDataFeed contract.
    */
    function setDataFeed(uint256 _index, address _dataFeed) external;

    /**
     * @notice Stores the trading bot parameters in a struct before creating the bot.
     * @dev First step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _name Name of the trading bot.
     * @param _symbol Symbol of the trading bot.
     * @param _timeframe Number of minutes between updates.
     * @param _maxTradeDuration Maximum number of [_timeframe] a trade can last for.
     * @param _profitTarget % profit target for a trade. Denominated in 10000.
     * @param _stopLoss % stop loss for a trade. Denominated in 10000.
     * @param _tradedAsset Symbol of the asset this bot will simulate trades for.
     * @param _assetTimeframe Timeframe to use for asset prices.
     * @param _usageFee The fee for using the bot's data feed.
     */
    function stageTradingBot(string memory _name, string memory _symbol, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, string memory _tradedAsset, uint256 _assetTimeframe, uint256 _usageFee) external;

    /**
     * @notice Creates the trading bot contract.
     * @dev Second step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _index Index of the trading bot.
     */
    function createTradingBot(uint256 _index) external;

    /**
     * @notice Initializes the trading bot contract.
     * @dev Third step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _index Index of the trading bot.
     */
    function initializeTradingBot(uint256 _index) external;

    /**
     * @notice Sets entry/exit rules for the trading bot contract.
     * @dev Transaction will revert if the trading bot owner does not have access to each component instance used in the rules.
     * @dev Fourth step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _index Index of the trading bot.
     * @param _entryRuleComponents An array of component IDs used in entry rules.
     * @param _entryRuleInstances An array of component instance IDs used in entry rules.
     * @param _exitRuleComponents An array of component IDs used in exit rules.
     * @param _exitRuleInstances An array of component instance IDs used in exit rules.
     */
    function setRulesForTradingBot(uint256 _index, uint256[] memory _entryRuleComponents, uint256[] memory _entryRuleInstances, uint256[] memory _exitRuleComponents, uint256[] memory _exitRuleInstances) external;

    /**
     * @notice Mints the trading bot NFT.
     * @dev Last step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _index Index of the trading bot.
     */
    function mintTradingBotNFT(uint256 _index) external;
    
    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
     * @notice Publishes the trading bot to the platform.
     * @dev Creates a BotPerformanceDataFeed contract for the trading bot.
     * @dev This function can only be called by the registrar.
     * @param _index Index of the trading bot.
     */
    function publishTradingBot(uint256 _index) external;

    /**
     * @notice Updates the address of the operator.
     * @dev This function can only be called by the TradingBotRegistry owner.
     * @param _newOperator Address of the new operator.
     */
    function setOperator(address _newOperator) external;

    /**
     * @notice Updates the address of the registrar.
     * @dev This function can only be called by the TradingBotRegistry owner.
     * @param _newRegistrar Address of the new registrar.
     */
    function setRegistrar(address _newRegistrar) external;
}