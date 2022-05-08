// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface ITradingBot {

    struct Parameters {
        uint256 timeframe;
        uint256 maxTradeDuration;
        uint256 profitTarget;
        uint256 stopLoss;
        string tradedAsset;
        uint256 assetTimeframe;
    }

    struct BotState {
        bool inTrade;
        uint256 entryPrice;
        uint256 entryIndex;
        uint256 lastUpdatedTimestamp;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Returns the address of the trading bot's owner.
     */
    function owner() external view returns (address);

    /**
     * @notice Returns the address of the trading bot's BotPerformanceDataFeed contract.
     */
    function dataFeed() external view returns (address);

    /**
    * @notice Returns the parameters of this trading bot.
    * @return (uint256, uint256, uint256, uint256, string, uint256) The trading bot's timeframe (in minutes), max trade duration, profit target, stop loss, the traded asset symbol, and the asset's timeframe.
    */
    function getTradingBotParameters() external view returns (uint256, uint256, uint256, uint256, string memory, uint256);

    /**
    * @notice Returns whether the trading bot can be updated.
    */
    function canUpdate() external view returns (bool);

    /**
    * @notice Returns the state of the trading bot.
    * @return (bool, uint256, uint256, uint256) Whether the bot is in a trade, the entry price, the update number at which the trade was made, and the timestamp at which the last update was made.
    */
    function getState() external view returns (bool, uint256, uint256, uint256);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Sets the initial entry/exit rules.
    * @notice Assumes that the TradingBotRegistry checked if the bot owner has access to each entry/exit rule before calling this function.
    * @param _entryRuleComponents An array of component IDs used in entry rules.
    * @param _entryRuleInstances An array of component instance IDs used in entry rules.
    * @param _exitRuleComponents An array of component IDs used in exit rules.
    * @param _exitRuleInstances An array of component instance IDs used in exit rules.
    */
    function setInitialRules(uint256[] memory _entryRuleComponents, uint256[] memory _entryRuleInstances, uint256[] memory _exitRuleComponents, uint256[] memory _exitRuleInstances) external;

    /**
    * @notice Updates the owner of this trading bot.
    * @dev This function is meant to be called by the TradingBots NFT contract.
    * @param _newOwner Address of the new owner.
    */
    function updateOwner(address _newOwner) external;

    /**
    * @notice Initializes the parameters for the trading bot.
    * @dev This function is meant to be called by the TradingBotRegistry contract when creating a trading bot.
    * @param _name Name of the trading bot.
    * @param _symbol Symbol of the trading bot.
    * @param _timeframe Number of minutes between updates.
    * @param _maxTradeDuration Maximum number of [_timeframe] a trade can last for.
    * @param _profitTarget % profit target for a trade. Denominated in 10000.
    * @param _stopLoss % stop loss for a trade. Denominated in 10000.
    * @param _tradedAsset Symbol of the asset this bot will simulate trades for.
    * @param _assetTimeframe Timeframe to use for asset prices.
    */
    function initialize(string memory _name, string memory _symbol, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, string memory _tradedAsset, uint256 _assetTimeframe) external;

    /**
    * @notice Gets the latest price of the trading bot's traded asset and uses it to update the bot's state based on entry/exit rules.
    * @dev Simulates an order if entry/exit rules are met.
    * @dev This function is meant to be called once per timeframe by a Keeper contract.
    */
    function update() external returns (bool);

    /**
    * @notice Updates the dedicated keeper for the trading bot.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _newKeeper Address of the new keeper contract.
    */
    function setKeeper(address _newKeeper) external;

    /**
    * @notice Updates the operator address for the trading bot.
    * @dev This function can only be called by the current operator.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external;

    /**
    * @notice Adds a new entry/exit rule.
    * @dev This function can only be called by the operator.
    * @dev Transaction will revert if the bot's owner does not have access to the comparator's instance.
    * @param _isEntryRule Whether the rule to add is an entry rule.
    * @param _comparatorID ID of the comparator.
    * @param _instanceID ID of the comparator's instance.
    */
    function addRule(bool _isEntryRule, uint256 _comparatorID, uint256 _instanceID) external;

    /**
    * @notice Removes the rule at the given index.
    * @dev This function can only be called by the operator.
    * @dev Transaction will revert if the entry/exit rule is out of bounds.
    * @param _isEntryRule Whether the rule to remove is an entry rule.
    * @param _index Index in the array of entry/exit rules.
    */
    function removeRule(bool _isEntryRule, uint256 _index) external;

    /**
    * @notice Replaces the rule at the given index with the new rule.
    * @dev This function can only be called by the operator.
    * @dev Transaction will revert if the entry/exit rule is out of bounds.
    * @dev Transaction will revert if the trading bot owner does not have access to the new rule.
    * @param _isEntryRule Whether the rule to replace is an entry rule.
    * @param _index Index in the array of entry/exit rules.
    * @param _comparatorID ID of the comparator.
    * @param _instanceID ID of the comparator's instance.
    */
    function replaceRule(bool _isEntryRule, uint256 _index, uint256 _comparatorID, uint256 _instanceID) external;

    /**
    * @notice Updates the bot's traded asset.
    * @dev This function can only be called by the operator.
    * @dev Transaction will revert if there's not data feed for the asset with the given timeframe.
    * @param _newTradedAsset Symbol of the new traded asset.
    * @param _newAssetTimeframe Timeframe to use for asset prices.
    */
    function updateTradedAsset(string memory _newTradedAsset, uint256 _newAssetTimeframe) external;

    /**
    * @notice Updates the bot's timeframe.
    * @dev This function can only be called by the operator.
    * @param _newTimeframe The new timeframe, in minutes.
    */
    function updateTimeframe(uint256 _newTimeframe) external;

    /**
    * @notice Updates the bot's max trade duration.
    * @dev This function can only be called by the operator.
    * @param _newMaxTradeDuration The new max trade duration, in [timeframe].
    */
    function updateMaxTradeDuration(uint256 _newMaxTradeDuration) external;

    /**
    * @notice Updates the bot's profit target.
    * @dev This function can only be called by the operator.
    * @param _newProfitTarget The new profit target %, denominated in 10000. 
    */
    function updateProfitTarget(uint256 _newProfitTarget) external;

    /**
    * @notice Updates the bot's stop loss.
    * @dev This function can only be called by the operator.
    * @param _newStopLoss The new stop loss %, denominated in 10000. 
    */
    function updateStopLoss(uint256 _newStopLoss) external;

    /**
    * @notice Sets the address of the trading bot's BotPerformanceDataFeed contract.
    * @dev This function can only be called once by the TradingBotRegistry contract.
    * @dev Trading bots only have a data feed once they are published to the platform.
    * @param _dataFeed Address of the BotPerformanceDataFeed contract.
    */
    function setDataFeed(address _dataFeed) external;
}