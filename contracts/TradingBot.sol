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

    // Trading bot owner.
    address public override owner;

    // Contracts
    address public immutable factory;
    IComponents public immutable components;

    // Parameters
    string public name;
    string public symbol;
    uint256 public maxTradeDuration;
    uint256 public timeframe;
    uint256 public profitTarget;
    uint256 public stopLoss;
    address public tradedAsset;

    // Entry rules
    uint256[] public serializedEntryRules;

    // Exit rules
    uint256[] public serializedExitRules;

    // Contract management
    bool public initialized;
    bool public generatedRules;
    uint256 public createdOn;
    uint256 public lastUpdatedIndex; // Number of candlesticks in PriceAggregator when TradingBot.onPriceFeedUpdate() was last called.

    constructor(address _owner, address _components) {
        require(_owner != address(0), "TradingBot: invalid address for owner.");
        require(_components != address(0), "TradingBot: invalid address for components contract.");
        
        // Initialize contracts.
        owner = _owner;
        components = IComponents(_components);
        factory = msg.sender;

        initialized = false;
        generatedRules = false;
        createdOn = block.timestamp;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the parameters of this trading bot.
    * @return (uint256, uint256, uint256, uint256, address) The trading bot's timeframe (in candlesticks), max trade duration, profit target, stop loss, and traded asset address.
    */
    function getTradingBotParameters() external view override returns (uint256, uint256, uint256, uint256, address) {
        return (timeframe, maxTradeDuration, profitTarget, stopLoss, tradedAsset);
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
    function initialize(string memory _name, string memory _symbol, uint256 _mintFee, uint256 _tradeFee, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, address _tradedAsset) external override onlyFactory isNotInitialized {
        // Initialize fees.
        tokenMintFee = _mintFee;
        tokenTradeFee = _tradeFee;

        // Initialize parameters.
        name = _name;
        symbol = _symbol;
        timeframe = _timeframe;
        maxTradeDuration = _maxTradeDuration;
        profitTarget = _profitTarget;
        stopLoss = _stopLoss;
        tradedAsset = _tradedAsset;

        initialized = true;

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
        require(components.checkRules(owner, _serializedEntryRules), "TradingBot: Have not purchased each indicator/comparator used in entry rules.");
        require(components.checkRules(owner, _serializedExitRules), "TradingBot: Have not purchased each indicator/comparator used in exit rules.");

        serializedEntryRules = _serializedEntryRules;
        serializedExitRules = _serializedExitRules;
        generatedRules = true;

        emit GeneratedRules(_serializedEntryRules, _serializedExitRules);
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

    modifier hasNotGeneratedRules() {
        require(!generatedRules, "TradingBot: already generated entry/exit rules.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedOwner(address newOwner);
    event Initialized(uint256 mintFee, uint256 tradeFee, uint256 timeframe, uint256 maxTradeDuration, uint256 profitTarget, uint256 stopLoss, address tradedAsset);
    event GeneratedRules(uint256[] serializedEntryRules, uint256[] serializedExitRules);
}