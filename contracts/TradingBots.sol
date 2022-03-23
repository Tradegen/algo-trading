// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/ERC1155/ERC1155.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Internal references
import './TradingBot.sol';

// Interfaces
import './interfaces/ITradingBot.sol';
import './interfaces/IPriceAggregatorRouter.sol';

contract TradingBots is ERC1155 {
    using SafeMath for uint256;

    struct TradingBotInfo {
        address owner;
        uint256 status; // 1 = created, 2 = initialized, 3 = generated rules, 4 = registered
        string name;
        string symbol;
        uint256 mintFee;
        uint256 tradeFee;
        uint256 timeframe;
        uint256 maxTradeDuration;
        uint256 profitTarget;
        uint256 stopLoss;
        address tradedAsset;
        uint256[] serializedEntryRules;
        uint256[] serializedExitRules;
    }

    address public immutable components;
    IPriceAggregatorRouter public immutable priceAggregatorRouter;

    uint256 public numberOfTradingBots;
    // Token ID => trading bot address.
    mapping (uint256 => address) public tradingBots;
    mapping (uint256 => TradingBotInfo) public tradingBotInfos;

    constructor(address _components, address _priceAggregatorRouter) {
        components = _components;
        priceAggregatorRouter = IPriceAggregatorRouter(_priceAggregatorRouter);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @dev Stores the trading bot parameters in a struct before creating the bot.
     * @notice First step.
     * @notice Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
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
    function stageTradingBot(string memory _name, string memory _symbol, uint256 _mintFee, uint256 _tradeFee, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, address _tradedAsset, uint256[] memory _serializedEntryRules, uint256[] memory _serializedExitRules) external {
        require(_timeframe > 0, "TradingBots: timeframe must be above 0.");
        require(_maxTradeDuration > 0, "TradingBots: max trade duration must be above 0.");
        require(_profitTarget > 0, "TradingBots: profit target must be above 0.");
        require(_stopLoss > 0, "TradingBots: stop loss must be above 0.");
        require(_stopLoss < 10000, "TradingBots: stop loss must be below 10000.");
        require(priceAggregatorRouter.getPriceAggregator(_tradedAsset) != address(0), "TradingBots: asset not supported.");
        require(_serializedEntryRules.length > 0, "TradingBots: must have at least 1 entry rule.");

        tradingBotInfos[numberOfTradingBots] = TradingBotInfo({
            owner: msg.sender,
            status: 0,
            name: _name,
            symbol: _symbol,
            mintFee: _mintFee,
            tradeFee: _tradeFee,
            timeframe: _timeframe,
            maxTradeDuration: _maxTradeDuration,
            profitTarget: _profitTarget,
            stopLoss: _stopLoss,
            tradedAsset: _tradedAsset,
            serializedEntryRules: _serializedEntryRules,
            serializedExitRules: _serializedExitRules
        });

        _mint(msg.sender, numberOfTradingBots, 1, "");
        numberOfTradingBots = numberOfTradingBots.add(1);

        emit StagedTradingBot(msg.sender, _mintFee, _tradeFee, _timeframe, _maxTradeDuration, _profitTarget, _stopLoss, _tradedAsset, _serializedEntryRules, _serializedExitRules);
    }

    /**
     * @dev Creates the trading bot contract.
     * @notice Second step.
     * @notice Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _tokenID NFT ID of the trading bot.
     */
    function createTradingBot(uint256 _tokenID) external {
        require(msg.sender == tradingBotInfos[_tokenID].owner, "TradingBots: only the trading bot owner can call this function.");
        require(tradingBotInfos[_tokenID].status == 0, "TradingBots: trading bot already created.");

        tradingBots[_tokenID] = address(new TradingBot(msg.sender, components));
        tradingBotInfos[_tokenID].status = 1;

        emit CreatedTradingBot(tradingBots[_tokenID]);
    }

    /**
     * @dev Initializes the trading bot contract.
     * @notice Third step.
     * @notice Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _tokenID NFT ID of the trading bot.
     */
    function initializeTradingBot(uint256 _tokenID) external {
        TradingBotInfo memory info = tradingBotInfos[_tokenID];

        require(msg.sender == info.owner, "TradingBots: only the trading bot owner can call this function.");
        require(info.status == 1, "TradingBots: trading bot already initialized.");

        ITradingBot(tradingBots[_tokenID]).initialize(info.name, info.symbol, info.mintFee, info.tradeFee, info.timeframe, info.maxTradeDuration, info.profitTarget, info.stopLoss, info.tradedAsset);

        tradingBotInfos[_tokenID].status = 2;

        emit InitializedTradingBot(tradingBots[_tokenID]);
    }

    /**
     * @dev Generates entry/exit rules for the trading bot contract.
     * @notice Fourth step.
     * @notice Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _tokenID NFT ID of the trading bot.
     */
    function generateRulesForTradingBot(uint256 _tokenID) external {
        TradingBotInfo memory info = tradingBotInfos[_tokenID];

        require(msg.sender == info.owner, "TradingBots: only the trading bot owner can call this function.");
        require(info.status == 2, "TradingBots: trading bot already generated rules.");

        ITradingBot(tradingBots[_tokenID]).generateRules(info.serializedEntryRules, info.serializedExitRules);

        tradingBotInfos[_tokenID].status = 3;

        emit GeneratedRulesForTradingBot(tradingBots[_tokenID]);
    }

    /**
     * @dev Registers the trading bot on the custom Tradegen blockchain.
     * @notice A relayer listens for the RegisteredTradingBot event and sends a transaction to Tradegen blockchain to create a copy of the bot.
     * @notice Last step.
     * @notice Use 5 steps to create/initialize bot to avoid 'stack-too-deep' error.
     * @param _tokenID NFT ID of the trading bot.
     */
    function registerTradingBot(uint256 _tokenID) external {
        TradingBotInfo memory info = tradingBotInfos[_tokenID];

        require(msg.sender == info.owner, "TradingBots: only the trading bot owner can call this function.");
        require(info.status == 3, "TradingBots: trading bot already registered.");

        tradingBotInfos[_tokenID].status = 4;

        emit RegisteredTradingBot(info.timeframe, info.maxTradeDuration, info.profitTarget, info.stopLoss, info.tradedAsset, info.serializedEntryRules, info.serializedExitRules);
    }

    /**
    * @dev Transfers tokens from seller to buyer.
    * @param from Address of the seller.
    * @param to Address of the buyer.
    * @param id The token ID of the trading bot.
    * @param amount Number of tokens to transfer for the given ID. Expected to equal 1.
    * @param data Bytes data.
    */
    function safeTransferFrom(address from, address to, uint id, uint amount, bytes memory data) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "TradingBots: caller is not owner nor approved."
        );
        require(amount == 1, "TradingBots: amount must be 1.");
        require(from == ITradingBot(tradingBots[id]).owner(), "TradingBots: only the NFT owner can transfer.");

        // Update ownership data.
        ITradingBot(tradingBots[id]).updateOwner(to);

        _safeTransferFrom(from, to, id, amount, data);
    }

    // Prevent transfer of multiple NFTs in one transaction.
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public override {}

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Updates the trading bot's owner.
    * @notice This function can only be called by the trading bot's current owner.
    * @param _tradingBotID NFT ID of the trading bot.
    * @param _newOwner Address of the new owner.
    */
    function updateOwner(uint256 _tradingBotID, address _newOwner) external {
        require(_newOwner != address(0), "TradingBots: invalid address for new owner.");
        require(ITradingBot(tradingBots[_tradingBotID]).owner() == msg.sender, "TradingBots: only the trading bot owner can call this function.");

        ITradingBot(tradingBots[_tradingBotID]).updateOwner(_newOwner);

        emit UpdatedOwner(_tradingBotID, _newOwner);
    }

    /* ========== EVENTS ========== */

    event StagedTradingBot(address owner, uint256 mintFee, uint256 tradeFee, uint256 timeframe, uint256 maxTradeDuration, uint256 profitTarget, uint256 stopLoss, address tradedAsset, uint256[] serializedEntryRules, uint256[] serializedExitRules);
    event CreatedTradingBot(address tradingBot);
    event InitializedTradingBot(address tradingBot);
    event GeneratedRulesForTradingBot(address tradingBot);
    event RegisteredTradingBot(uint256 timeframe, uint256 maxTradeDuration, uint256 profitTarget, uint256 stopLoss, address tradedAsset, uint256[] serializedEntryRules, uint256[] serializedExitRules);
    event UpdatedOwner(uint256 tradingBotID, address newOwner);
}