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
import './interfaces/IExternalContractFactory.sol';

contract TradingBots is ERC1155 {
    using SafeMath for uint256;

    address public immutable priceAggregatorRouter;
    address public immutable components;
    IExternalContractFactory public immutable externalContractFactory;

    uint256 public numberOfTradingBots;
    // Token ID => trading bot address.
    mapping (uint256 => address) public tradingBots;

    constructor(address _priceAggregatorRouter, address _components, address _externalContractFactory) {
        priceAggregatorRouter = _priceAggregatorRouter;
        components = _components;
        externalContractFactory = IExternalContractFactory(_externalContractFactory);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @dev Creates a trading bot and initializes it.
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
    function createTradingBot(string memory _name, string memory _symbol, uint256 _mintFee, uint256 _tradeFee, uint256 _timeframe, uint256 _maxTradeDuration, uint256 _profitTarget, uint256 _stopLoss, address _tradedAsset, uint256[] memory _serializedEntryRules, uint256[] memory _serializedExitRules) external {
        require(_timeframe > 0, "TradingBots: timeframe must be above 0.");
        require(_maxTradeDuration > 0, "TradingBots: max trade duration must be above 0.");
        require(_profitTarget > 0, "TradingBots: profit target must be above 0.");
        require(_stopLoss > 0, "TradingBots: stop loss must be above 0.");
        require(_stopLoss < 10000, "TradingBots: stop loss must be below 10000.");
        require(_tradedAsset != address(0), "TradingBots: invalid address for traded asset.");
        require(_serializedEntryRules.length > 0, "TradingBots: must have at least 1 entry rule.");

        (address botPerformanceOracleAddress, address syntheticBotTokenAddress) = externalContractFactory.createContracts();
        address tradingBotAddress = address(new TradingBot(msg.sender, syntheticBotTokenAddress, components, priceAggregatorRouter, botPerformanceOracleAddress));
        ITradingBot(tradingBotAddress).initialize(_name, _symbol, _mintFee, _tradeFee, _timeframe, _maxTradeDuration, _profitTarget, _stopLoss, _tradedAsset);
        ITradingBot(tradingBotAddress).generateRules(_serializedEntryRules, _serializedExitRules);

        tradingBots[numberOfTradingBots] = tradingBotAddress;
        _mint(msg.sender, numberOfTradingBots, 1, "");
        numberOfTradingBots = numberOfTradingBots.add(1);

        emit CreatedTradingBot(_mintFee, _tradeFee, _timeframe, _maxTradeDuration, _profitTarget, _stopLoss, _tradedAsset, _serializedEntryRules, _serializedExitRules);
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

    event CreatedTradingBot(uint256 mintFee, uint256 tradeFee, uint256 timeframe, uint256 maxTradeDuration, uint256 profitTarget, uint256 stopLoss, address tradedAsset, uint256[] serializedEntryRules, uint256[] serializedExitRules);
    event UpdatedOwner(uint256 tradingBotID, address newOwner);
}