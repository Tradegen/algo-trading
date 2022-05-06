// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

// Openzeppelin
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Libraries
import '../libraries/CandlestickUtils.sol';

// Interfaces
import '../interfaces/IIndicator.sol';
import '../interfaces/IComparator.sol';
import '../interfaces/IPriceAggregatorRouter.sol';
import '../interfaces/IPriceAggregator.sol';
import '../interfaces/IComponents.sol';

contract TradingBotLogic {
    using SafeMath for uint256;
    using CandlestickUtils for CandlestickUtils.Candlestick;

    struct Rule {
        address firstIndicatorAddress;
        address secondIndicatorAddress;
        address comparatorAddress;
        uint256 firstIndicatorInstance;
        uint256 secondIndicatorInstance;
        uint256 comparatorInstance;
    }

    // Contracts
    IComponents public immutable components;
    IPriceAggregatorRouter public immutable priceAggregatorRouter;

    // Parameters
    string public name;
    string public symbol;
    uint256 public maxTradeDuration;
    uint256 public timeframe;
    uint256 public profitTarget;
    uint256 public stopLoss;
    address public tradedAsset;

    // Entry rules
    uint256 numberOfEntryRules;
    mapping (uint256 => Rule) public entryRules;

    // Exit rules
    uint256 numberOfExitRules;
    mapping (uint256 => Rule) public exitRules;

    // Position management
    uint256 public entryIndex;
    bool public inTrade;
    uint256 public entryPrice;
    uint256 public numberOfUpdates;
    mapping(uint256 => CandlestickUtils.Candlestick) public candlesticks; // Used to create an aggregate candlestick based on the timeframe.

    // Contract management
    bool public initialized;
    bool public generatedRules;
    uint256 public createdOn;
    uint256 public lastUpdatedIndex; // Number of candlesticks in PriceAggregator when TradingBot.onPriceFeedUpdate() was last called.

    constructor(address _components, address _priceAggregatorRouter) {
        require(_components != address(0), "TradingBot: invalid address for components contract.");
        require(_priceAggregatorRouter != address(0), "TradingBot: invalid address for price aggregator router.");
        
        // Initialize contracts.
        components = IComponents(_components);
        priceAggregatorRouter = IPriceAggregatorRouter(_priceAggregatorRouter);

        initialized = false;
        generatedRules = false;
        createdOn = block.timestamp;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev Returns whether onPriceFeedUpdate() can be called.
     * @notice Checks if the PriceAggregator contract created a new candlestick.
     */
    function canBeUpdated() public view returns (bool) {
        return IPriceAggregator(priceAggregatorRouter.getPriceAggregator(tradedAsset)).numberOfCandlesticks() > lastUpdatedIndex;
    }

    /**
    * @dev Returns the parameters of this trading bot.
    * @return (uint256, uint256, uint256, uint256, address) The trading bot's timeframe (in candlesticks), max trade duration, profit target, stop loss, and traded asset address.
    */
    function getTradingBotParameters() external view returns (uint256, uint256, uint256, uint256, address) {
        return (timeframe, maxTradeDuration, profitTarget, stopLoss, tradedAsset);
    }

    /**
     * @dev Returns the trading bot's entry rules.
     */
    function getEntryRules() external view returns (Rule[] memory) {
        Rule[] memory rules = new Rule[](numberOfEntryRules);

        for (uint256 i = 0; i < rules.length; i++) {
            rules[i] = entryRules[i];
        }

        return rules;
    }

    /**
     * @dev Returns the trading bot's exit rules.
     */
    function getExitRules() external view returns (Rule[] memory) {
        Rule[] memory rules = new Rule[](numberOfExitRules);

        for (uint256 i = 0; i < rules.length; i++) {
            rules[i] = exitRules[i];
        }

        return rules;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Gets the latest price of the trading bot's traded asset and uses it to update the state of each entry/exit rule.
    * @notice Simulates an order if entry/exit rules are met.
    * @notice This function is meant to be called once per timeframe by a Keeper contract.
    */
    function onPriceFeedUpdate() external hasGeneratedRules isInitialized {
        require(canBeUpdated(), "TradingBot: need to wait for a new candlestick before updating.");

        CandlestickUtils.Candlestick memory latestPrice = IPriceAggregator(priceAggregatorRouter.getPriceAggregator(tradedAsset)).getCurrentPrice();

        numberOfUpdates = numberOfUpdates.add(1);
        candlesticks[numberOfUpdates % timeframe] = latestPrice;
        if ((numberOfUpdates % timeframe) != timeframe.sub(1)) {
            return;
        }

        CandlestickUtils.Candlestick memory candlestick;// = _createAggregateCandlestick();
        _updateRules(candlestick);

        // Bot does not have an open position.
        if (!inTrade) {
            // Create a 'buy' order if entry rules are met.
            if (_checkEntryRules()) {
                inTrade = true;
                entryIndex = numberOfUpdates;
                entryPrice = candlestick.close;

                // Simulate a 'buy' order.
                emit OrderPlaced(tradedAsset, true, candlestick.close);
            }
        }
        // Bot has an open position.
        else {
            // Check if profit target is met.
            if (candlestick.high >= entryPrice.mul(10000 + profitTarget).div(10000)) {
                inTrade = false;
                entryIndex = 0;
                entryPrice = 0;

                // Simulate a 'sell' order.
                emit OrderPlaced(tradedAsset, false, entryPrice.mul(10000 + profitTarget).div(10000));
            }
            // Check if stop loss is met.
            else if (candlestick.low <= entryPrice.mul(10000 - stopLoss).div(10000)) {
                inTrade = false;
                entryIndex = 0;
                entryPrice = 0;

                // Simulate a 'sell' order.
                emit OrderPlaced(tradedAsset, false, entryPrice.mul(10000 - stopLoss).div(10000));
            }
            // Check if max trade duration is met or exit rules are met.
            else if (numberOfUpdates >= entryIndex.add(timeframe.mul(maxTradeDuration)) || _checkExitRules()) {
                inTrade = false;
                entryIndex = 0;
                entryPrice = 0;

                // Simulate a 'sell' order.
                emit OrderPlaced(tradedAsset, false, candlestick.close);
            }
        }
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Combines stored candlesticks into one candlestick, based on the trading bot's timeframe.
    * @return candlestick An aggregated candlestick struct.
    */
    function _createAggregateCandlestick() internal view returns (CandlestickUtils.Candlestick memory candlestick) {
        candlestick.open = candlesticks[0].open;
        candlestick.low = candlesticks[0].low;

        candlestick.close = candlesticks[timeframe.sub(1)].close;

        for (uint256 i = 0; i < timeframe.sub(1); i++) {
            if (candlesticks[i].low < candlestick.low) {
                candlestick.low = candlesticks[i].low;
            }

            if (candlesticks[i].high > candlestick.high) {
                candlestick.high = candlesticks[i].high;
            }
        }
    }

    /**
    * @dev Returns whether all entry rules are met.
    */
    function _checkEntryRules() internal returns (bool) {
        uint256 numEntryRules = numberOfEntryRules;

        for (uint256 i = 0; i < numEntryRules; i++) {
            if (!IComparator(entryRules[i].comparatorAddress).checkConditions(entryRules[i].comparatorInstance))
            {
                return false;
            }
        }

        return true;
    }

    /**
    * @dev Returns whether at least one exit rule is met.
    */
    function _checkExitRules() internal returns (bool) {
        uint256 numExitRules = numberOfExitRules;

        for (uint256 i = 0; i < numExitRules; i++) {
            if (IComparator(exitRules[i].comparatorAddress).checkConditions(exitRules[i].comparatorInstance))
            {
                return true;
            }
        }

        return false;
    }

    /**
    * @dev Updates each entry/exit rule's indicators with the latest candlestick.
    * @param _latestPrice The latest candlestick.
    */
    function _updateRules(CandlestickUtils.Candlestick memory _latestPrice) internal {
        {
        uint256 numEntryRules = numberOfEntryRules;
        for (uint256 i = 0; i < numEntryRules; i++) {
            IIndicator(entryRules[i].firstIndicatorAddress).update(entryRules[i].firstIndicatorInstance, _latestPrice);
            IIndicator(entryRules[i].secondIndicatorAddress).update(entryRules[i].secondIndicatorInstance, _latestPrice);
        }
        }

        {
        uint256 numExitRules = numberOfExitRules;
        for (uint256 i = 0; i < numExitRules; i++) {
            IIndicator(exitRules[i].firstIndicatorAddress).update(exitRules[i].firstIndicatorInstance, _latestPrice);
            IIndicator(exitRules[i].secondIndicatorAddress).update(exitRules[i].secondIndicatorInstance, _latestPrice);
        }
        }
    }

    /* ========== MODIFIERS ========== */

    modifier isInitialized() {
        require(initialized, "TradingBot: contract must be initialized.");
        _;
    }

    modifier hasGeneratedRules() {
        require(generatedRules, "TradingBot: have not generated entry/exit rules.");
        _;
    }

    /* ========== EVENTS ========== */

    event OrderPlaced(address tradedAsset, bool isBuy, uint256 price);
}