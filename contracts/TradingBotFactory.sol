// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin.
import "./openzeppelin-solidity/contracts/Ownable.sol";

// Internal references.
import './TradingBot.sol';

// Inheritance.
import './interfaces/ITradingBotFactory.sol';

contract TradingBotFactory is ITradingBotFactory, Ownable {
    address immutable componentsRegistry;
    address immutable candlestickDataFeedRegistry;
    address tradingBotRegistry;
    address keeperRegistry;
    address immutable tradingBotNFT;

    constructor(address _componentsRegistry, address _candlestickDataFeedRegistry, address _tradingBotNFT) Ownable() {
        componentsRegistry = _componentsRegistry;
        candlestickDataFeedRegistry = _candlestickDataFeedRegistry;
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
    * @notice Sets the address of the TradingBotRegistry and KeeperRegistry contracts.
    * @dev The address is initialized outside of the constructor to avoid a circular dependency with TradingBotRegistry and KeeperRegistry.
    * @dev This function can only be called by the TradingBotFactory owner.
    * @dev This function can only be called once.
    * @param _tradingBotRegistry Address of the TradingBotRegistry contract.
    * @param _keeperRegistry Address of the KeeperRegistry contract.
    */
    function initializeContracts(address _tradingBotRegistry, address _keeperRegistry) external onlyOwner {
        require(tradingBotRegistry == address(0), "TradingBotFactory: Already set TradingBotRegistry.");
        require(keeperRegistry == address(0), "TradingBotFactory: Already set KeeperRegistry.");

        tradingBotRegistry = _tradingBotRegistry;
        keeperRegistry = _keeperRegistry;

        emit InitializedContracts(_tradingBotRegistry, _keeperRegistry);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBotRegistry() {
        require(msg.sender == tradingBotRegistry,
                "TradingBotFactory: Only the TradingBotRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedTradingBot(address owner, address tradingBotContractAddress);
    event InitializedContracts(address tradingBotRegistryAddress, address keeperRegistryAddress);
}