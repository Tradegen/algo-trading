// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Internal references.
import './TradingBot.sol';

// Inheritance.
import './interfaces/ITradingBotFactory.sol';

contract TradingBotFactory is ITradingBotFactory {
    address public immutable componentsRegistry;
    address public immutable candlestickDataFeedRegistry;
    address public immutable tradingBotRegistry;
    address public immutable keeperRegistry;

    constructor(address _componentsRegistry, address _candlestickDataFeedRegistry, address _tradingBotRegistry, address _keeperRegistry) {
        require(_componentsRegistry != address(0), "TradingBotFactory: Invalid address for _componentsRegistry.");
        require(_candlestickDataFeedRegistry != address(0), "TradingBotFactory: Invalid address for _candlestickDataFeedRegistry.");
        require(_tradingBotRegistry != address(0), "TradingBotFactory: Invalid address for _tradingBotRegistry.");
        require(_keeperRegistry != address(0), "TradingBotFactory: Invalid address for _keeperRegistry.");

        componentsRegistry = _componentsRegistry;
        candlestickDataFeedRegistry = _candlestickDataFeedRegistry;
        tradingBotRegistry = _tradingBotRegistry;
        keeperRegistry = _keeperRegistry;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a TradingBot contract and returns the contract's address.
    * @dev This function can only be called by the TradingBotRegistry contract.
    * @param _owner Initial owner of the trading bot.
    * @return address Address of the deployed TradingBot contract.
    */
    function createTradingBot(address _owner) external override onlyTradingBotRegistry returns (address) {
        address tradingBotContract = address(new TradingBot(_owner, componentsRegistry, candlestickDataFeedRegistry, tradingBotRegistry, keeperRegistry));

        emit CreatedTradingBot(_owner, tradingBotContract);

        return tradingBotContract;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBotRegistry() {
        require(msg.sender == tradingBotRegistry,
                "TradingBotFactory: Only the TradingBotRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedTradingBot(address owner, address tradingBotContractAddress);
}