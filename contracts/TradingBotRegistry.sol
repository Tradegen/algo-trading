// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Interfaces.
import './interfaces/external/IBotPerformanceDataFeedRegistry.sol';
import './interfaces/external/IBotPerformanceDataFeed.sol';
import './interfaces/external/ICandlestickDataFeedRegistry.sol';
import './interfaces/IComponentsRegistry.sol';
import './interfaces/ITradingBotFactory.sol';
import './interfaces/ITradingBot.sol';
import './interfaces/ITradingBots.sol';

// Inheritance.
import './interfaces/ITradingBotRegistry.sol';

contract TradingBotRegistry is ITradingBotRegistry, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public MAX_TRADING_BOTS_PER_USER;
    uint256 public MINT_FEE;

    ITradingBots public immutable tradingBotNFT;
    IBotPerformanceDataFeedRegistry public immutable botPerformanceDataFeedRegistry;
    IComponentsRegistry public immutable componentsRegistry;
    ITradingBotFactory public immutable tradingBotFactory;
    ICandlestickDataFeedRegistry public immutable candlestickDataFeedRegistry;
    IERC20 public immutable feeToken;
    address public immutable xTGEN;

    address public operator;
    address public registrar;

    uint256 public numberOfTradingBots;
    mapping (address => uint256) public tradingBotsPerUser;
    mapping (uint256 => address) public tradingBotAddresses;
    mapping (address => uint256) public tradingBotIndexes;
    mapping (uint256 => TradingBotInfo) public tradingBotInfos;

    constructor(address _tradingBotNFT, address _botPerformanceDataFeedRegistry, address _componentsRegistry, address _tradingBotFactory, address _candlestickDataFeedRegistry, address _feeToken, address _xTGEN) Ownable() {
        tradingBotNFT = ITradingBots(_tradingBotNFT);
        botPerformanceDataFeedRegistry = IBotPerformanceDataFeedRegistry(_botPerformanceDataFeedRegistry);
        componentsRegistry = IComponentsRegistry(_componentsRegistry);
        tradingBotFactory = ITradingBotFactory(_tradingBotFactory);
        candlestickDataFeedRegistry = ICandlestickDataFeedRegistry(_candlestickDataFeedRegistry);
        feeToken = IERC20(_feeToken);
        xTGEN = _xTGEN;

        operator = msg.sender;
        registrar = msg.sender;
        MAX_TRADING_BOTS_PER_USER = 3;
        MINT_FEE = 1e20;
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
    function checkInfoForUpkeep(address _owner, address _target) external view override returns (bool) {
        // Trading bot is not supported on the platform.
        if (tradingBotIndexes[_target] == 0) {
            return false;
        }

        // Trading bot has a different owner.
        if (ITradingBot(_target).owner() != _owner) {
            return false;
        }

        return true;
    }

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
    function getTradingBotDataFeed(uint256 _index, address _tradingBot) external view override returns (address) {
        if (_index == 0) {
            return ITradingBot(_tradingBot).dataFeed();
        }

        if (_tradingBot == address(0)) {
            return ITradingBot(tradingBotAddresses[_index]).dataFeed();
        }

        return address(0);
    }

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
    function getOwner(uint256 _index, address _tradingBot) external view override returns (address) {
        if (_index == 0) {
            return ITradingBot(_tradingBot).owner();
        }

        if (_tradingBot == address(0)) {
            return ITradingBot(tradingBotAddresses[_index]).owner();
        }

        return address(0);
    }

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
    function canUpdate(uint256 _index, address _tradingBot) external view override returns (bool) {
        if (_index == 0) {
            return ITradingBot(_tradingBot).canUpdate();
        }

        if (_tradingBot == address(0)) {
            return ITradingBot(tradingBotAddresses[_index]).canUpdate();
        }

        return false;
    }

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
    function getTradingBotParams(uint256 _index, address _tradingBot) external view override returns (uint256, uint256, uint256, uint256, string memory, uint256) {
        if (_index == 0) {
            return ITradingBot(_tradingBot).getTradingBotParameters();
        }

        if (_tradingBot == address(0)) {
            return ITradingBot(tradingBotAddresses[_index]).getTradingBotParameters();
        }

        return (0, 0, 0, 0, "", 0);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */
    
    /**
    * @notice Updates the address of the given trading bot's data feed.
    * @dev Only the owner of the TradingBotRegistry contract can call this function.
    * @dev Transaction will revert if the trading bot is not found.
    * @param _index Index of the trading bot.
    * @param _dataFeed Address of the BotPerformanceDataFeed contract.
    */
    function setDataFeed(uint256 _index, address _dataFeed) external override onlyOperator {
        require(_index > 0 && _index <= numberOfTradingBots, "TradingBotRegistry: Index out of bounds.");
        require(tradingBotAddresses[_index] == IBotPerformanceDataFeed(_dataFeed).dataProvider(), "TradingBotRegistry: Trading bot is not the data provider for this data feed.");

        ITradingBot(tradingBotAddresses[_index]).setDataFeed(_dataFeed);

        emit SetDataFeed(_index, _dataFeed);
    }

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
    function stageTradingBot(string memory _name,
                             string memory _symbol,
                             uint256 _timeframe,
                             uint256 _maxTradeDuration,
                             uint256 _profitTarget,
                             uint256 _stopLoss,
                             string memory _tradedAsset,
                             uint256 _assetTimeframe,
                             uint256 _usageFee) external override {
        require(tradingBotsPerUser[msg.sender] < MAX_TRADING_BOTS_PER_USER, "TradingBotRegistry: User already has max trading bots.");
        require(_timeframe >= 1 && _timeframe <= 1440, "TradingBotRegistry: Timeframe out of bounds.");
        require(_maxTradeDuration > 1 && _maxTradeDuration <= 100, "TradingBotRegistry: Max trade duration out of bounds.");
        require(_profitTarget >= 10 && _profitTarget <= 100000, "TradingBotRegistry: Profit target out of bounds.");
        require(_stopLoss >= 10 && _stopLoss <= 9900, "TradingBotRegistry: Stop loss out of bounds.");
        require(candlestickDataFeedRegistry.hasDataFeed(_tradedAsset, _assetTimeframe), "TradingBotRegistry: No data feed for asset and timeframe.");
        require(_usageFee <= 1e21, "TradingBotRegistry: Usage fee is too high.");

        // Gas savings.
        uint256 index = numberOfTradingBots.add(1);

        numberOfTradingBots = index;
        tradingBotsPerUser[msg.sender] = tradingBotsPerUser[msg.sender].add(1);
        tradingBotInfos[index] = TradingBotInfo({
            owner: msg.sender,
            status: 0,
            name: _name,
            symbol: _symbol,
            timeframe: _timeframe,
            maxTradeDuration: _maxTradeDuration,
            profitTarget: _profitTarget,
            stopLoss: _stopLoss,
            tradedAsset: _tradedAsset,
            assetTimeframe: _assetTimeframe,
            usageFee: _usageFee
        });

        emit StagedTradingBot(index, msg.sender, _name, _symbol, _timeframe, _maxTradeDuration, _profitTarget, _stopLoss, _tradedAsset, _assetTimeframe, _usageFee);
    }

    /**
     * @notice Creates the trading bot contract.
     * @dev Second step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _index Index of the trading bot.
     */
    function createTradingBot(uint256 _index) external override {
        require(msg.sender == tradingBotInfos[_index].owner, "TradingBotRegistry: Only the trading bot owner can call this function.");
        require(tradingBotInfos[_index].status == 1, "TradingBotRegistry: Trading bot has the wrong status.");

        address tradingBotAddress = tradingBotFactory.createTradingBot(tradingBotInfos[_index].owner);
        tradingBotAddresses[_index] = tradingBotAddress;
        tradingBotIndexes[tradingBotAddress] = _index;
        tradingBotInfos[_index].status = 2;

        emit CreatedTradingBot(_index, tradingBotAddress);
    }

    /**
     * @notice Initializes the trading bot contract.
     * @dev Third step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _index Index of the trading bot.
     */
    function intializeTradingBot(uint256 _index) external override {
        require(msg.sender == tradingBotInfos[_index].owner, "TradingBotRegistry: Only the trading bot owner can call this function.");
        require(tradingBotInfos[_index].status == 2, "TradingBotRegistry: Trading bot has the wrong status.");

        ITradingBot(tradingBotAddresses[_index]).initialize(tradingBotInfos[_index].name,
                                                            tradingBotInfos[_index].symbol,
                                                            tradingBotInfos[_index].timeframe,
                                                            tradingBotInfos[_index].maxTradeDuration,
                                                            tradingBotInfos[_index].profitTarget,
                                                            tradingBotInfos[_index].stopLoss,
                                                            tradingBotInfos[_index].tradedAsset,
                                                            tradingBotInfos[_index].assetTimeframe);
        tradingBotInfos[_index].status = 3;

        emit IntializedTradingBot(_index);
    }

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
    function setRulesForTradingBot(uint256 _index,
                                   uint256[] memory _entryRuleComponents,
                                   uint256[] memory _entryRuleInstances,
                                   uint256[] memory _exitRuleComponents,
                                   uint256[] memory _exitRuleInstances) external override {
        require(msg.sender == tradingBotInfos[_index].owner, "TradingBotRegistry: Only the trading bot owner can call this function.");
        require(tradingBotInfos[_index].status == 3, "TradingBotRegistry: Trading bot has the wrong status.");
        require(_entryRuleComponents.length <= 7, "TradingBotRegistry: Too many entry rules.");
        require(_exitRuleComponents.length <= 7, "TradingBotRegistry: Too many exit rules.");
        require(componentsRegistry.checkRules(tradingBotInfos[_index].owner, _entryRuleComponents, _entryRuleInstances), "TradingBotRegistry: Trading bot owner does not have access to each entry rule.");
        require(componentsRegistry.checkRules(tradingBotInfos[_index].owner, _exitRuleComponents, _exitRuleInstances), "TradingBotRegistry: Trading bot owner does not have access to each exit rule.");
    
        ITradingBot(tradingBotAddresses[_index]).setInitialRules(_entryRuleComponents, _entryRuleInstances, _exitRuleComponents, _exitRuleInstances);
        tradingBotInfos[_index].status = 4;

        emit SetRulesForTradingBot(_index, _entryRuleComponents, _entryRuleInstances, _exitRuleComponents, _exitRuleInstances);
    }

    /**
     * @notice Mints the trading bot NFT.
     * @dev Last step.
     * @dev Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _index Index of the trading bot.
     */
    function mintTradingBotNFT(uint256 _index) external override {
        require(msg.sender == tradingBotInfos[_index].owner, "TradingBotRegistry: Only the trading bot owner can call this function.");
        require(tradingBotInfos[_index].status == 4, "TradingBotRegistry: Trading bot has the wrong status.");

        feeToken.safeTransferFrom(msg.sender, address(this), MINT_FEE);
        feeToken.safeTransfer(xTGEN, MINT_FEE);

        tradingBotNFT.mintTradingBot(_index, tradingBotInfos[_index].owner, tradingBotAddresses[_index]);
        tradingBotInfos[_index].status = 5;

        emit MintedTradingBot(_index, MINT_FEE);
    }
    
    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
     * @notice Publishes the trading bot to the platform.
     * @dev Creates a BotPerformanceDataFeed contract for the trading bot.
     * @dev This function can only be called by the registrar.
     * @param _index Index of the trading bot.
     */
    function publishTradingBot(uint256 _index) external override onlyRegistrar {
        require(tradingBotInfos[_index].status == 5, "TradingBotRegistry: Trading bot has the wrong status.");

        // Gas savings.
        address tradingBotAddress = tradingBotAddresses[_index];

        botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, tradingBotInfos[_index].usageFee, tradingBotAddress);
        (address dataFeed,,,,) = botPerformanceDataFeedRegistry.getDataFeedInfo(tradingBotAddress);
        ITradingBot(tradingBotAddress).setDataFeed(dataFeed);

        tradingBotInfos[_index].status = 6;

        emit PublishedTradingBot(_index, dataFeed);
    }

    /**
     * @notice Updates the address of the operator.
     * @dev This function can only be called by the TradingBotRegistry owner.
     * @param _newOperator Address of the new operator.
     */
    function setOperator(address _newOperator) external override onlyOwner {
        operator = _newOperator;

        emit SetOperator(_newOperator);
    }

    /**
     * @notice Updates the address of the registrar.
     * @dev This function can only be called by the TradingBotRegistry owner.
     * @param _newRegistrar Address of the new registrar.
     */
    function setRegistrar(address _newRegistrar) external override onlyOwner {
        registrar = _newRegistrar;

        emit SetRegistrar(_newRegistrar);
    }

    /**
     * @notice Increases the maximum number of trading bots per user.
     * @dev This function can only be called by the operator.
     * @param _newLimit The new maximum number of trading bots per user.
     */
    function increaseMaxTradingBotsPerUser(uint256 _newLimit) external onlyOperator {
        require(_newLimit > MAX_TRADING_BOTS_PER_USER, "TradingBotRegistry: New limit must be higher.");

        MAX_TRADING_BOTS_PER_USER = _newLimit;

        emit IncreasedMaxTradingBotsPerUser(_newLimit);
    }

    /**
     * @notice Updates the mint fee.
     * @dev This function can only be called by the operator.
     * @param _newFee The new mint fee.
     */
    function updateMintFee(uint256 _newFee) external onlyOperator {
        require(_newFee >= 0, "TradingBotRegistry: New fee must be positive.");

        MINT_FEE = _newFee;

        emit UpdatedMintFee(_newFee);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "TradingBotRegistry: Only the registrar can call this function.");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "TradingBotRegistry: Only the operator can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event SetOperator(address newOperator);
    event SetRegistrar(address newRegistrar);
    event SetDataFeed(uint256 index, address dataFeed);
    event MintedTradingBot(uint256 index, uint256 mintFeePaid);
    event PublishedTradingBot(uint256 index, address dataFeed);
    event SetRulesForTradingBot(uint256 index, uint256[] entryRuleComponents, uint256[] entryRuleInstances, uint256[] exitRuleComponents, uint256[] exitRuleInstances);
    event CreatedTradingBot(uint256 index, address tradingBotAddress);
    event IntializedTradingBot(uint256 index);
    event StagedTradingBot(uint256 index, address owner, string name, string symbol, uint256 timeframe, uint256 maxTradeDuration, uint256 profitTarget, uint256 stopLoss, string tradedAsset, uint256 assetTimeframe, uint256 usageFee);
    event IncreasedMaxTradingBotsPerUser(uint256 newLimit);
    event UpdatedMintFee(uint256 newFee);
}