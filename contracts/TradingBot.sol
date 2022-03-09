// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "./openzeppelin-solidity/contracts/SafeMath.sol";

// Libraries
import './libraries/CandlestickUtils.sol';

// Interfaces
import './interfaces/IIndicator.sol';
import './interfaces/IComparator.sol';
import './interfaces/IBotPerformanceOracle.sol';
import './interfaces/IPriceAggregatorRouter.sol';
import './interfaces/IPriceAggregator.sol';
import './interfaces/IComponents.sol';

// Inheritance
import './interfaces/ITradingBot.sol';

contract TradingBot is ITradingBot {
    using SafeMath for uint256;
    using CandlestickUtils for CandlestickUtils.Candlestick;

    uint256 public constant MAX_MINT_FEE = 1000; // 10%, denominated in 10000.
    uint256 public constant MAX_TRADE_FEE = 1000; // 10%, denominated in 10000.

    // Contracts
    address public override owner;
    address public immutable syntheticBotToken;
    address public immutable factory;
    IComponents public immutable components;
    IPriceAggregatorRouter public immutable priceAggregatorRouter;
    IBotPerformanceOracle public immutable botPerformanceOracle;

    // Fees
    uint256 public override tokenMintFee;
    uint256 public override tokenTradeFee;

    // Parameters
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
    CandlestickUtils.Candlestick[] public candlesticks; // Used to create an aggregate candlestick based on the timeframe.

    // Contract management
    bool public initialized;
    bool public generatedRules;
    uint256 public startTime;
    uint256 public createdOn;
    uint256 public lastUpdatedIndex; // Number of candlesticks in PriceAggregator when TradingBot.onPriceFeedUpdate() was last called.

    constructor(address _owner, address _syntheticBotToken, address _components, address _priceAggregatorRouter, address _botPerformanceOracle) {
        require(_owner != address(0), "TradingBot: invalid address for owner.");
        require(_syntheticBotToken != address(0), "TradingBot: invalid address for synthetic bot token.");
        require(_components != address(0), "TradingBot: invalid address for components contract.");
        require(_priceAggregatorRouter != address(0), "TradingBot: invalid address for price aggregator router.");
        require(_botPerformanceOracle != address(0), "TradingBot: invalid address for bot performance oracle.");
        
        // Initialize contracts.
        owner = _owner;
        syntheticBotToken = _syntheticBotToken;
        components = IComponents(_components);
        factory = msg.sender;
        priceAggregatorRouter = IPriceAggregatorRouter(_priceAggregatorRouter);
        botPerformanceOracle = IBotPerformanceOracle(_botPerformanceOracle);

        initialized = false;
        generatedRules = false;
        createdOn = block.timestamp;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev Returns whether onPriceFeedUpdate() can be called.
     * @notice Checks if the PriceAggregator contract created a new candlestick.
     */
    function canBeUpdated() public view override returns (bool) {
        return IPriceAggregator(priceAggregatorRouter.getPriceAggregator(tradedAsset)).numberOfCandlesticks() > lastUpdatedIndex;
    }

    /**
    * @dev Returns the parameters of this trading bot.
    * @return (uint256, uint256, uint256, uint256, address) The trading bot's timeframe (in candlesticks), max trade duration, profit target, stop loss, and traded asset address.
    */
    function getTradingBotParameters() external view override returns (uint256, uint256, uint256, uint256, address) {
        return (timeframe, maxTradeDuration, profitTarget, stopLoss, tradedAsset);
    }

    /**
     * @dev Returns the trading bot's entry rules.
     */
    function getEntryRules() external view override returns (Rule[] memory) {
        Rule[] memory rules = new Rule[](numberOfEntryRules);

        for (uint256 i = 0; i < rules.length; i++) {
            rules[i] = entryRules[i];
        }

        return rules;
    }

    /**
     * @dev Returns the trading bot's exit rules.
     */
    function getExitRules() external view override returns (Rule[] memory) {
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
    function onPriceFeedUpdate() external override hasStarted hasGeneratedRules isInitialized {
        require(canBeUpdated(), "TradingBot: need to wait for a new candlestick before updating.");

        CandlestickUtils.Candlestick memory latestPrice = IPriceAggregator(priceAggregatorRouter.getPriceAggregator(tradedAsset)).getCurrentPrice();

        numberOfUpdates = numberOfUpdates.add(1);
        candlesticks[numberOfUpdates % timeframe] = latestPrice;
        if ((numberOfUpdates % timeframe) != timeframe.sub(1)) {
            return;
        }

        CandlestickUtils.Candlestick memory candlestick = _createAggregateCandlestick(candlesticks);
        _updateRules(candlestick);

        // Bot does not have an open position.
        if (!inTrade) {
            // Create a 'buy' order if entry rules are met.
            if (_checkEntryRules()) {
                inTrade = true;
                entryIndex = numberOfUpdates;
                entryPrice = candlestick.close;

                // Simulate a 'buy' order.
                botPerformanceOracle.onOrderPlaced(tradedAsset, true, candlestick.close);
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
                botPerformanceOracle.onOrderPlaced(tradedAsset, false, entryPrice.mul(10000 + profitTarget).div(10000));
            }
            // Check if stop loss is met.
            else if (candlestick.low <= entryPrice.mul(10000 - stopLoss).div(10000)) {
                inTrade = false;
                entryIndex = 0;
                entryPrice = 0;

                // Simulate a 'sell' order.
                botPerformanceOracle.onOrderPlaced(tradedAsset, false, entryPrice.mul(10000 - stopLoss).div(10000));
            }
            // Check if max trade duration is met.
            else if (numberOfUpdates >= entryIndex.add(timeframe.mul(maxTradeDuration))) {
                inTrade = false;
                entryIndex = 0;
                entryPrice = 0;

                // Simulate a 'sell' order.
                botPerformanceOracle.onOrderPlaced(tradedAsset, false, candlestick.close);
            }
            // Check if exit rules are met.
            else if (_checkExitRules()) {
                inTrade = false;
                entryIndex = 0;
                entryPrice = 0;

                // Simulate a 'sell' order.
                botPerformanceOracle.onOrderPlaced(tradedAsset, false, candlestick.close);
            }
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Updates the owner of this trading bot.
    * @notice This function is meant to be called by the TradingBots contract.
    * @param _newOwner Address of the new owner.
    */
    function updateOwner(address _newOwner) external override onlyFactory {
        require(_newOwner != address(0), "TradingBot: invalid address for new owner.");

        owner = _newOwner;

        emit UpdatedOwner(_newOwner);
    }

    /**
    * @dev Initializes the parameters for the trading bot.
    * @notice This function is meant to be called by the TradingBots contract when creating a trading bot.
    * @param _mintFee Fee to charge when users mint a synthetic bot token. Denominated in 10000.
    * @param _tradeFee Fee to charge when users trade a synthetic bot token. Denominated in 10000.
    * @param _timeframe Number of candlesticks per aggregate candlestick. Must be greater than 0.
    * @param _maxTradeDuration Maximum number of aggregate candlesticks a trade can last for.
    * @param _profitTarget % profit target for a trade. Denominated in 10000.
    * @param _stopLoss % stop loss for a trade. Denominated in 10000.
    * @param _tradedAsset Address of the asset this bot will simulate trades for.
    */
    function initialize(uint256 _mintFee, uint256 _tradeFee, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, address _tradedAsset) external override onlyFactory isNotInitialized {
        // Initialize fees.
        tokenMintFee = _mintFee;
        tokenTradeFee = _tradeFee;

        // Initialize parameters.
        timeframe = _timeframe;
        maxTradeDuration = _maxTradeDuration;
        profitTarget = _profitTarget;
        stopLoss = _stopLoss;
        tradedAsset = _tradedAsset;

        initialized = true;

        candlesticks = new CandlestickUtils.Candlestick[](_timeframe);

        emit Initialized(_mintFee, _tradeFee, _timeframe, _maxTradeDuration, _profitTarget, _stopLoss, _tradedAsset);
    }

    /**
    * @dev Generates entry/exit rules for the trading bot.
    * @notice This function is meant to be called by the TradingBots contract when creating a trading bot.
    * @notice This function can only be called once.
    * @param _serializedEntryRules An array of entry rules; each entry rule is packed into a uint256.
    * @param _serializedExitRules An array of exit rules; each exit rule is packed into a uint256.
    */
    function generateRules(uint256[] memory _serializedEntryRules, uint256[] memory _serializedExitRules) external override onlyFactory hasNotGeneratedRules {
        for (uint256 i = 0; i < _serializedEntryRules.length; i++) {
            entryRules[i] = _generateRule(_serializedEntryRules[i]);
        }

        for (uint256 i = 0; i < _serializedExitRules.length; i++) {
            exitRules[i] = _generateRule(_serializedExitRules[i]);
        }

        numberOfEntryRules = _serializedEntryRules.length;
        numberOfExitRules = _serializedExitRules.length;
        generatedRules = true;

        emit GeneratedRules(_serializedEntryRules, _serializedExitRules);
    }

    /**
    * @dev Sets the start time for this trading bot.
    * @notice This function can only be called by the trading bot's owner.
    * @notice The trading bot will not run until this function is called and start time has passed.
    * @param _startTime Timestamp at which the trading bot will start.
    */
    function setStartTime(uint256 _startTime) external onlyOwner hasNotStarted {
        require(_startTime >= block.timestamp, "TradingBot: start time must be in the future.");

        startTime = _startTime;

        emit SetStartTime(_startTime);
    }

    /**
    * @dev Sets the mint fee for the trading bot's token.
    * @notice This function can only be called by the trading bot's owner.
    * @param _mintFee Mint fee for the trading bot's token. Denominated in 10000.
    */
    function setMintFee(uint256 _mintFee) external onlyOwner hasNotStarted {
        require(_mintFee >= 0 && _mintFee <= MAX_MINT_FEE, "TradingBot: mint fee out of range.");

        tokenMintFee = _mintFee;

        emit SetMintFee(_mintFee);
    }

    /**
    * @dev Sets the trading fee for the trading bot's token.
    * @notice This function can only be called by the trading bot's owner.
    * @param _tradeFee Trading fee for the trading bot's token. Denominated in 10000.
    */
    function setTradeFee(uint256 _tradeFee) external onlyOwner hasNotStarted {
        require(_tradeFee >= 0 && _tradeFee <= MAX_TRADE_FEE, "TradingBot: trade fee out of range.");

        tokenTradeFee = _tradeFee;

        emit SetTradeFee(_tradeFee);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Given a serialized rule, creates an instance of the rule's indicators/comparators.
    * @notice Bits 0-15: empty (expected to be 0's).
    *         Bits 16-31: Comparator ID.
    *         Bits 32-47: First indicator ID.
    *         Bits 48-63: Second indicator ID.
    *         Bits 64-159: First indicator params; serialized array of 6 elements, 16 bits each.
    *         Bits 160-255: Second indicator params; serialized array of 6 elements, 16 bits each.
    * @param _serializedRule The info for a trading rule, packed into a uint256.
    * @return rule A Rule struct that contains the parsed entry/exit rule. 
    */
    function _generateRule(uint256 _serializedRule) internal returns (Rule memory rule) {
        {
        address comparatorAddress = components.getComparatorAddress(_serializedRule >> 224);
        address firstIndicatorAddress = components.getIndicatorAddress((_serializedRule >> 208) & 0xFF);
        address secondIndicatorAddress = components.getIndicatorAddress((_serializedRule >> 192) & 0xFF);

        uint256 firstIndicatorInstance = IIndicator(firstIndicatorAddress).addTradingBot(owner, (_serializedRule << 48) >> 160);
        uint256 secondIndicatorInstance = IIndicator(secondIndicatorAddress).addTradingBot(owner, (_serializedRule << 144) >> 160);

        rule = Rule({
            firstIndicatorAddress: firstIndicatorAddress,
            secondIndicatorAddress: secondIndicatorAddress,
            comparatorAddress: comparatorAddress,
            firstIndicatorInstance: firstIndicatorInstance,
            secondIndicatorInstance: secondIndicatorInstance,
            comparatorInstance: IComparator(comparatorAddress).addTradingBot(owner, firstIndicatorAddress, secondIndicatorAddress, firstIndicatorInstance, secondIndicatorInstance)
        });
        }
    }

    /**
    * @dev Returns whether all entry rules are met.
    */
    function _checkEntryRules() internal returns (bool) {
        {
        uint256 numEntryRules = numberOfEntryRules;

        for (uint256 i = 0; i < numEntryRules; i++) {
            if (!IComparator(entryRules[i].comparatorAddress).checkConditions(entryRules[i].comparatorInstance))
            {
                return false;
            }
        }
        }

        return true;
    }

    /**
    * @dev Returns whether at least one exit rule is met.
    */
    function _checkExitRules() internal returns (bool) {
        {
        uint256 numExitRules = numberOfExitRules;

        for (uint256 i = 0; i < numExitRules; i++) {
            if (IComparator(exitRules[i].comparatorAddress).checkConditions(exitRules[i].comparatorInstance))
            {
                return true;
            }
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

    modifier onlyOwner() {
        require(msg.sender == owner, "TradingBot: only the trading bot owner can call this function.");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "TradingBot: only the factory contract can call this function.");
        _;
    }

    modifier isNotInitialized() {
        require(!initialized, "TradingBot: contract must not be initialized.");
        _;
    }

    modifier isInitialized() {
        require(initialized, "TradingBot: contract must be initialized.");
        _;
    }

    modifier hasNotGeneratedRules() {
        require(!generatedRules, "TradingBot: already generated entry/exit rules.");
        _;
    }

    modifier hasGeneratedRules() {
        require(generatedRules, "TradingBot: have not generated entry/exit rules.");
        _;
    }

    modifier hasNotStarted() {
        require(startTime == 0, "TradingBot: trading bot has already started.");
        _;
    }

    modifier hasStarted() {
        require(block.timestamp >= startTime, "TradingBot: trading bot has not started.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedOwner(address newOwner);
    event SetStartTime(uint256 startTime);
    event SetMintFee(uint256 mintFee);
    event SetTradeFee(uint256 tradeFee);
    event Initialized(uint256 mintFee, uint256 tradeFee, uint256 timeframe, uint256 maxTradeDuration, uint256 profitTarget, uint256 stopLoss, address tradedAsset);
    event GeneratedRules(uint256[] serializedEntryRules, uint256[] serializedExitRules);
}