// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin.
import "./openzeppelin-solidity/contracts/Ownable.sol";

// Internal references.
import './TradingBot.sol';

// Inheritance.
import './interfaces/ITradingBotFactory.sol';

contract TradingBotFactory is ITradingBotFactory, Ownable {
    address public immutable componentsRegistry;
    address public immutable candlestickDataFeedRegistry;
    address public tradingBotRegistry;
    address public immutable keeperRegistry;
    address public immutable tradingBotNFT;

    constructor(address _componentsRegistry, address _candlestickDataFeedRegistry, address _keeperRegistry, address _tradingBotNFT) Ownable() {
        require(_componentsRegistry != address(0), "TradingBotFactory: Invalid address for _componentsRegistry.");
        require(_candlestickDataFeedRegistry != address(0), "TradingBotFactory: Invalid address for _candlestickDataFeedRegistry.");
        require(_keeperRegistry != address(0), "TradingBotFactory: Invalid address for _keeperRegistry.");
        require(_tradingBotNFT != address(0), "TradingBotFactory: Invalid address for _tradingBotNFT.");

        componentsRegistry = _componentsRegistry;
        candlestickDataFeedRegistry = _candlestickDataFeedRegistry;
        keeperRegistry = _keeperRegistry;
        tradingBotNFT = _tradingBotNFT;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a TradingBot contract and returns the contract's address.
    * @dev This function can only be called by the TradingBotRegistry contract.
    * @param _owner Initial owner of the trading bot.
    * @return address Address of the deployed TradingBot contract.
    */
    function createTradingBot(address _owner) external override onlyTradingBotRegistry returns (address) {
        address tradingBotContract = address(new TradingBot(_owner, componentsRegistry, candlestickDataFeedRegistry, tradingBotRegistry, keeperRegistry, tradingBotNFT));

        emit CreatedTradingBot(_owner, tradingBotContract);

        return tradingBotContract;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Sets the address of the TradingBotRegistry contract.
    * @dev The address is initialized outside of the constructor to avoid a circular dependency with TradingBotRegistry.
    * @dev This function can only be called by the TradingBotFactory owner.
    * @dev This function can only be called once.
    * @param _tradingBotRegistry Address of the TradingBotRegistry contract.
    */
    function setTradingBotRegistry(address _tradingBotRegistry) external onlyOwner {
        require(tradingBotRegistry == address(0), "TradingBotFactory: Already set TradingBotRegistry.");

        tradingBotRegistry = _tradingBotRegistry;

        emit SetTradingBotRegistry(_tradingBotRegistry);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBotRegistry() {
        require(msg.sender == tradingBotRegistry,
                "TradingBotFactory: Only the TradingBotRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedTradingBot(address owner, address tradingBotContractAddress);
    event SetTradingBotRegistry(address tradingBotRegistryAddress);
}