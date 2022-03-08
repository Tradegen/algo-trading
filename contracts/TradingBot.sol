// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "./openzeppelin-solidity/contracts/SafeMath.sol";

// Interfaces
import './interfaces/IIndicator.sol';
import './interfaces/IComparator.sol';
import './interfaces/IBotPerformanceOracle.sol';

// Inheritance
import './interfaces/ITradingBot.sol';

contract TradingBot is ITradingBot {
    using SafeMath for uint256;

    // Contracts
    address public override owner;
    address public syntheticBotToken;
    address public factory;
    IBotPerformanceOracle public botPerformanceOracle;

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
    uint256 public lastUpdatedTimestamp;
    bool public inTrade;

    constructor(address _owner, address _syntheticBotToken, address _botPerformanceOracle, uint256 _mintFee, uint256 _tradeFee, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, address _tradedAsset) {
        require(_owner != address(0), "TradingBot: invalid address for owner.");
        require(_syntheticBotToken != address(0), "TradingBot: invalid address for synthetic bot token.");
        require(_botPerformanceOracle != address(0), "TradingBot: invalid address for bot performance oracle.");
        require(_timeframe > 0, "TradingBot: timeframe must be above 0.");
        require(_maxTradeDuration > 0, "TradingBot: max trade duration must be above 0.");
        require(_profitTarget > 0, "TradingBot: profit target must be above 0.");
        require(_stopLoss > 0, "TradingBot: stop loss must be above 0.");
        require(_tradedAsset != address(0), "TradingBot: invalid address for traded asset.");

        // Initialize contracts.
        owner = _owner;
        syntheticBotToken = _syntheticBotToken;
        factory = msg.sender;
        botPerformanceOracle = IBotPerformanceOracle(_botPerformanceOracle);

        // Initialize fees.
        tokenMintFee = _mintFee;
        tokenTradeFee = _tradeFee;

        // Initialize parameters.
        timeframe = _timeframe;
        maxTradeDuration = _maxTradeDuration;
        profitTarget = _profitTarget;
        stopLoss = _stopLoss;
        tradedAsset = _tradedAsset;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the parameters of this trading bot.
    * @return (uint256, uint256, uint256, uint256, address) The trading bot's timeframe (in minutes), max trade duration, profit target, stop loss, and traded asset address.
    */
    function getTradingBotParameters() external view override returns (uint256, uint256, uint256, uint256, address) {
        return (timeframe, maxTradeDuration, profitTarget, stopLoss, tradedAsset);
    }

    /**
     * @dev Returns the trading bot's entry rules.
     */
    function getEntryRules() external view override returns (Rule[] memory) {
        //TODO: loop through entry rules.
    }

    /**
     * @dev Returns the trading bot's exit rules.
     */
    function getExitRules() external view override returns (Rule[] memory) {
        //TODO: loop through exit rules.
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Gets the latest price of the trading bot's traded asset and uses it to update the state of each entry/exit rule.
    * @notice Simulates an order if entry/exit rules are met.
    * @notice This function is meant to be called once per timeframe by a Keeper contract.
    */
    function onPriceFeedUpdate() external override {
        //TODO: get price from traded asset's PriceAggregator and use it to update entry/exit rules.
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

    /* ========== MODIFIERS ========== */

    modifier onlyOwner() {
        require(msg.sender == owner, "TradingBot: only the trading bot owner can call this function.");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "TradingBot: only the factory contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedOwner(address newOwner);
}