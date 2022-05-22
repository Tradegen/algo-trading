// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";

// Interfaces.
import './interfaces/external/ICandlestickDataFeedRegistry.sol';
import './interfaces/external/IBotPerformanceDataFeed.sol';
import './interfaces/IComponentsRegistry.sol';

// Inheritance.
import './interfaces/ITradingBot.sol';

contract TradingBot is ITradingBot {
    using SafeMath for uint256;

    // Trading bot owner.
    address public override owner;

    address public operator;
    address public keeper;

    // Address of the BotPerformanceDataFeed contract.
    address public override dataFeed;

    // Contracts.
    IComponentsRegistry immutable componentsRegistry;
    ICandlestickDataFeedRegistry immutable candlestickDataFeedRegistry;
    address immutable tradingBotRegistry;
    address immutable keeperRegistry;
    address immutable tradingBots;

    // Parameters.
    string public name;
    string public symbol;
    Parameters public params;
    BotState public botState;

    // Entry rules.
    uint256[] public entryRuleComponents;
    uint256[] public entryRuleInstances;

    // Exit rules.
    uint256[] public exitRuleComponents;
    uint256[] public exitRuleInstances;

    // Contract management.
    bool public initialized;
    bool public setRules;
    uint256 public numberOfUpdates;

    constructor(address _owner, address _componentsRegistry, address _candlestickDataFeedRegistry, address _tradingBotRegistry, address _keeperRegistry, address _tradingBots) {
        // Initialize contracts.
        owner = _owner;
        operator = _owner;
        componentsRegistry = IComponentsRegistry(_componentsRegistry);
        candlestickDataFeedRegistry = ICandlestickDataFeedRegistry(_candlestickDataFeedRegistry);
        tradingBotRegistry = _tradingBotRegistry;
        keeperRegistry = _keeperRegistry;
        tradingBots = _tradingBots;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the parameters of this trading bot.
    * @return (uint256, uint256, uint256, uint256, string, uint256) The trading bot's timeframe (in minutes), max trade duration, profit target, stop loss, the traded asset symbol, and the asset's timeframe.
    */
    function getTradingBotParameters() external view override returns (uint256, uint256, uint256, uint256, string memory, uint256) {
        // Gas savings.
        Parameters memory parameters = params;

        return (parameters.timeframe, parameters.maxTradeDuration, parameters.profitTarget, parameters.stopLoss, parameters.tradedAsset, parameters.assetTimeframe);
    }

    /**
    * @notice Returns whether the trading bot can be updated.
    */
    function canUpdate() public view override returns (bool) {
        if (!initialized || !setRules || dataFeed == address(0)) {
            return false;
        }

        return block.timestamp >= botState.lastUpdatedTimestamp.add(params.timeframe.mul(60)).sub(2);
    }

    /**
    * @notice Returns the state of the trading bot.
    * @return (bool, uint256, uint256, uint256) Whether the bot is in a trade, the entry price, the update number at which the trade was made, and the timestamp at which the last update was made.
    */
    function getState() external view override returns (bool, uint256, uint256, uint256) {
        // Gas savings.
        BotState memory tradingBotState = botState;

        return (tradingBotState.inTrade, tradingBotState.entryPrice, tradingBotState.entryIndex, tradingBotState.lastUpdatedTimestamp);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Sets the initial entry/exit rules.
    * @notice Assumes that the TradingBotRegistry checked if the bot owner has access to each entry/exit rule before calling this function.
    * @param _entryRuleComponents An array of component IDs used in entry rules.
    * @param _entryRuleInstances An array of component instance IDs used in entry rules.
    * @param _exitRuleComponents An array of component IDs used in exit rules.
    * @param _exitRuleInstances An array of component instance IDs used in exit rules.
    */
    function setInitialRules(uint256[] memory _entryRuleComponents, uint256[] memory _entryRuleInstances, uint256[] memory _exitRuleComponents, uint256[] memory _exitRuleInstances) external override onlyTradingBotRegistry haveNotSetRules {
        setRules = true;

        for (uint256 i = 0; i < _entryRuleComponents.length; i++) {
            entryRuleComponents.push(_entryRuleComponents[i]);
        }

        for (uint256 i = 0; i < _entryRuleInstances.length; i++) {
            entryRuleInstances.push(_entryRuleInstances[i]);
        }

        for (uint256 i = 0; i < _exitRuleComponents.length; i++) {
            exitRuleComponents.push(_exitRuleComponents[i]);
        }

        for (uint256 i = 0; i < _exitRuleInstances.length; i++) {
            exitRuleInstances.push(_exitRuleInstances[i]);
        }

        emit SetRules(_entryRuleComponents, _entryRuleInstances, _exitRuleComponents, _exitRuleInstances);
    }

    /**
    * @notice Updates the owner of this trading bot.
    * @dev This function is meant to be called by the TradingBots NFT contract.
    * @param _newOwner Address of the new owner.
    */
    function updateOwner(address _newOwner) external override onlyTradingBots {
        owner = _newOwner;
        operator = _newOwner;

        emit UpdatedOwner(_newOwner);
    }

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
    function initialize(string memory _name, string memory _symbol, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, string memory _tradedAsset, uint256 _assetTimeframe) external override onlyTradingBotRegistry {
        initialized = true;

        name = _name;
        symbol = _symbol;

        params = Parameters({
            timeframe: _timeframe,
            maxTradeDuration: _maxTradeDuration,
            profitTarget: _profitTarget,
            stopLoss: _stopLoss,
            tradedAsset: _tradedAsset,
            assetTimeframe: _assetTimeframe
        });

        emit Initialized(_name, _symbol, _timeframe, _maxTradeDuration, _profitTarget, _stopLoss, _tradedAsset, _assetTimeframe);
    }

    /**
    * @notice Gets the latest price of the trading bot's traded asset and uses it to update the bot's state based on entry/exit rules.
    * @dev Simulates an order if entry/exit rules are met.
    * @dev This function is meant to be called once per timeframe by a Keeper contract.
    */
    function update() external override onlyKeeper returns (bool) {
        require(canUpdate(), "TradingBot: Cannot update yet.");

        // Gas savings.
        uint256 index = numberOfUpdates.add(1);
        uint256 latestPrice;
        uint256 highPrice;
        uint256 lowPrice;

        {
        string memory asset = params.tradedAsset;
        uint256 assetTimeframe = params.assetTimeframe;
        (, highPrice, lowPrice,,latestPrice,,) = candlestickDataFeedRegistry.getCurrentCandlestick(asset, assetTimeframe);
        }

        numberOfUpdates = index;
        botState.lastUpdatedTimestamp = block.timestamp;

        // Trading bot is not currently in a trade.
        if (!botState.inTrade) {
            // Check entry rules.
            if (_checkRules(true)) {
                botState.inTrade = true;
                botState.entryIndex = index;
                botState.entryPrice = latestPrice;

                IBotPerformanceDataFeed(dataFeed).updateData(params.tradedAsset, true, latestPrice, block.timestamp);
            }
        }
        // Trading bot has an open position.
        else {
            // Check if profit target is met.
            if (highPrice >= botState.entryPrice.mul(params.profitTarget.add(10000)).div(10000)) {
                botState.inTrade = false;

                IBotPerformanceDataFeed(dataFeed).updateData(params.tradedAsset, false, botState.entryPrice.mul(params.profitTarget.add(10000)).div(10000), block.timestamp);
            }
            // Check if stop loss is met.
            else if (lowPrice <= botState.entryPrice.mul(uint256(10000).sub(params.stopLoss)).div(10000)) {
                botState.inTrade = false;

                IBotPerformanceDataFeed(dataFeed).updateData(params.tradedAsset, false, botState.entryPrice.mul(uint256(10000).sub(params.stopLoss)).div(10000), block.timestamp);
            }
            // Check if max trade duration is met or exit rules are met.
            else if (index >= botState.entryIndex.add(params.maxTradeDuration) || _checkRules(false)) {
                botState.inTrade = false;

                IBotPerformanceDataFeed(dataFeed).updateData(params.tradedAsset, false, latestPrice, block.timestamp);
            }
        }

        emit Updated(params.tradedAsset, latestPrice);

        return true;
    }

    /**
    * @notice Updates the dedicated keeper for the trading bot.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _newKeeper Address of the new keeper contract.
    */
    function setKeeper(address _newKeeper) external override onlyKeeperRegistry {
        keeper = _newKeeper;
        
        emit SetKeeper(_newKeeper);
    }

    /**
    * @notice Updates the operator address for the trading bot.
    * @dev This function can only be called by the current operator.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external override onlyOperator {
        require(_newOperator != address(0), "TradingBot: Invalid address for _newOperator.");

        operator = _newOperator;

        emit SetOperator(_newOperator);
    }

    /**
    * @notice Adds a new entry/exit rule.
    * @dev This function can only be called by the operator.
    * @dev Transaction will revert if the bot's owner does not have access to the comparator's instance.
    * @param _isEntryRule Whether the rule to add is an entry rule.
    * @param _comparatorID ID of the comparator.
    * @param _instanceID ID of the comparator's instance.
    */
    function addRule(bool _isEntryRule, uint256 _comparatorID, uint256 _instanceID) external override onlyOperator {
        require(componentsRegistry.hasPurchasedComponentInstance(owner, _comparatorID, _instanceID), "TradingBot: Owner has not purchased this comparator instance.");

        if (_isEntryRule) {
            require(entryRuleComponents.length < 7, "TradingBot: Already have max number of entry rules.");
            
            entryRuleComponents.push(_comparatorID);
            entryRuleInstances.push(_instanceID);
        }
        else {
            require(exitRuleComponents.length < 7, "TradingBot: Already have max number of exit rules.");

            exitRuleComponents.push(_comparatorID);
            exitRuleInstances.push(_instanceID);
        }

        emit AddedRule(_isEntryRule, _comparatorID, _instanceID);
    }

    /**
    * @notice Removes the rule at the given index.
    * @dev This function can only be called by the operator.
    * @dev Transaction will revert if the entry/exit rule is out of bounds.
    * @param _isEntryRule Whether the rule to remove is an entry rule.
    * @param _index Index in the array of entry/exit rules.
    */
    function removeRule(bool _isEntryRule, uint256 _index) external override onlyOperator {
        uint256 length = _isEntryRule ? entryRuleComponents.length : exitRuleComponents.length;

        require(_index < length, "TradingBot: Index out of bounds.");

        uint256 componentID = _isEntryRule ? entryRuleComponents[_index] : exitRuleComponents[_index];
        uint256 instanceID = _isEntryRule ? entryRuleInstances[_index] : exitRuleInstances[_index];

        if (_isEntryRule) {
            entryRuleComponents[_index] = entryRuleComponents[length.sub(1)];
            entryRuleComponents.pop();

            entryRuleInstances[_index] = entryRuleInstances[length.sub(1)];
            entryRuleInstances.pop();
        }
        else {
            exitRuleComponents[_index] = exitRuleComponents[length.sub(1)];
            exitRuleComponents.pop();

            exitRuleInstances[_index] = exitRuleInstances[length.sub(1)];
            exitRuleInstances.pop();
        }

        emit RemovedRule(_isEntryRule, componentID, instanceID);
    }

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
    function replaceRule(bool _isEntryRule, uint256 _index, uint256 _comparatorID, uint256 _instanceID) external override onlyOperator {
        require(componentsRegistry.hasPurchasedComponentInstance(owner, _comparatorID, _instanceID), "TradingBot: Owner has not purchased this comparator instance.");

        uint256 length = _isEntryRule ? entryRuleComponents.length : exitRuleComponents.length;

        require(_index < length, "TradingBot: Index out of bounds.");

        uint256 oldComponentID = _isEntryRule ? entryRuleComponents[_index] : exitRuleComponents[_index];
        uint256 oldInstanceID = _isEntryRule ? entryRuleInstances[_index] : exitRuleInstances[_index];

        if (_isEntryRule) {
            entryRuleComponents[_index] = _comparatorID;
            entryRuleInstances[_index] = _instanceID;
        }
        else {
            exitRuleComponents[_index] = _comparatorID;
            exitRuleInstances[_index] = _instanceID;
        }

        emit ReplacedRule(_isEntryRule, oldComponentID, oldInstanceID, _comparatorID, _instanceID);
    }

    /**
    * @notice Updates the bot's traded asset.
    * @dev This function can only be called by the operator.
    * @dev Transaction will revert if there's not data feed for the asset with the given timeframe.
    * @param _newTradedAsset Symbol of the new traded asset.
    * @param _newAssetTimeframe Timeframe to use for asset prices.
    */
    function updateTradedAsset(string memory _newTradedAsset, uint256 _newAssetTimeframe) external override onlyOperator {
        require(!botState.inTrade, "TradingBot: Cannot update traded asset while in a trade.");
        require(candlestickDataFeedRegistry.hasDataFeed(_newTradedAsset, _newAssetTimeframe), "TradingBot: Data feed not found.");

        params.tradedAsset = _newTradedAsset;
        params.assetTimeframe = _newAssetTimeframe;

        emit UpdatedTradedAsset(_newTradedAsset, _newAssetTimeframe);
    }

    /**
    * @notice Updates the bot's timeframe.
    * @dev This function can only be called by the operator.
    * @param _newTimeframe The new timeframe, in minutes.
    */
    function updateTimeframe(uint256 _newTimeframe) external override onlyOperator {
        require(_newTimeframe >= 1 && _newTimeframe <= 1440, "TradingBot: Timeframe out of bounds.");

        params.timeframe = _newTimeframe;

        emit UpdatedTimeframe(_newTimeframe);
    }

    /**
    * @notice Updates the bot's max trade duration.
    * @dev This function can only be called by the operator.
    * @param _newMaxTradeDuration The new max trade duration, in [timeframe].
    */
    function updateMaxTradeDuration(uint256 _newMaxTradeDuration) external override onlyOperator {
        require(_newMaxTradeDuration > 1 && _newMaxTradeDuration <= 100, "TradingBot: Max trade duration out of bounds.");

        params.maxTradeDuration = _newMaxTradeDuration;

        emit UpdatedMaxTradeDuration(_newMaxTradeDuration);
    }

    /**
    * @notice Updates the bot's profit target.
    * @dev This function can only be called by the operator.
    * @param _newProfitTarget The new profit target %, denominated in 10000. Ex) 1% = 100.
    */
    function updateProfitTarget(uint256 _newProfitTarget) external override onlyOperator {
        require(_newProfitTarget >= 10 && _newProfitTarget <= 100000, "TradingBot: Profit target out of bounds.");

        params.profitTarget = _newProfitTarget;

        emit UpdatedProfitTarget(_newProfitTarget);
    }

    /**
    * @notice Updates the bot's stop loss.
    * @dev This function can only be called by the operator.
    * @param _newStopLoss The new stop loss %, denominated in 10000. Ex) 1% = 100.
    */
    function updateStopLoss(uint256 _newStopLoss) external override onlyOperator {
        require(_newStopLoss >= 10 && _newStopLoss <= 9900, "TradingBot: Stop loss out of bounds.");

        params.stopLoss = _newStopLoss;

        emit UpdatedStopLoss(_newStopLoss);
    }

    /**
    * @notice Sets the address of the trading bot's BotPerformanceDataFeed contract.
    * @dev This function can only be called once by the TradingBotRegistry contract.
    * @dev Trading bots only have a data feed once they are published to the platform.
    * @param _dataFeed Address of the BotPerformanceDataFeed contract.
    */
    function setDataFeed(address _dataFeed) external override onlyTradingBotRegistry {
        dataFeed = _dataFeed;

        emit SetDataFeed(_dataFeed);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @notice Returns whether each entry/exit rule meets conditions.
    */
    function _checkRules(bool _checkEntryRules) internal view returns (bool) {
        uint256 length = _checkEntryRules ? entryRuleComponents.length : exitRuleComponents.length;

        if (_checkEntryRules) {
            for (uint256 i = 0; i < length; i++) {
                if (!componentsRegistry.meetsConditions(entryRuleComponents[i], entryRuleInstances[i])) {
                    return false;
                }
            }
        }
        else {
            for (uint256 i = 0; i < length; i++) {
                if (!componentsRegistry.meetsConditions(exitRuleComponents[i], exitRuleInstances[i])) {
                    return false;
                }
            }
        }

        return true;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyKeeper() {
        require(msg.sender == keeper, "TradingBot: Only the dedicated keeper can call this function.");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "TradingBot: Only the operator can call this function.");
        _;
    }

    modifier onlyKeeperRegistry() {
        require(msg.sender == keeperRegistry, "TradingBot: Only the KeeperRegistry contract can call this function.");
        _;
    }

    modifier onlyTradingBots() {
        require(msg.sender == tradingBots, "TradingBot: Only the TradingBots NFT contract can call this function.");
        _;
    }

    modifier onlyTradingBotRegistry() {
        require(msg.sender == tradingBotRegistry, "TradingBot: Only the TradingBotRegistry contract can call this function.");
        _;
    }

    modifier haveNotSetRules() {
        require(!setRules, "TradingBot: Already set initial entry/exit rules.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedOwner(address newOwner);
    event UpdatedOperator(address newOperator);
    event Initialized(string name, string symbol, uint256 timeframe, uint256 maxTradeDuration, uint256 profitTarget, uint256 stopLoss, string tradedAsset, uint256 assetTimeframe);
    event SetRules(uint256[] entryRuleComponents, uint256[] entryRuleInstances, uint256[] exitRuleComponents, uint256[] exitRuleInstances);
    event SetKeeper(address newKeeper);
    event SetOperator(address newOperator);
    event SetDataFeed(address newDataFeed);
    event UpdatedProfitTarget(uint256 newProfitTarget);
    event UpdatedStopLoss(uint256 newStopLoss);
    event UpdatedMaxTradeDuration(uint256 newMaxTradeDuration);
    event UpdatedTimeframe(uint256 newTimeframe);
    event UpdatedTradedAsset(string newTradedAsset, uint256 newAssetTimeframe);
    event AddedRule(bool isEntryRule, uint256 componentID, uint256 instanceID);
    event RemovedRule(bool isEntryRule, uint256 componentID, uint256 instanceID);
    event ReplacedRule(bool isEntryRule, uint256 oldComponentID, uint256 oldInstanceID, uint256 newComponentID, uint256 newInstanceID);
    event Updated(string asset, uint256 latestPrice);
}