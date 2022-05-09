// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ERC1155/ERC1155.sol";

// Inheritance.
import './interfaces/ITradingBots.sol';

// Interfaces.
import './interfaces/ITradingBot.sol';

contract TradingBots is ITradingBots, ERC1155, Ownable {
    address public tradingBotRegistry;

    // (token ID => TradingBot contract address).
    mapping (uint256 => address) public tradingBotAddresses;

    constructor() Ownable() {}

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Mints an NFT for the given trading bot.
    * @dev This function can only be called by the TradingBotRegistry contract.
    * @param _tokenID ID to use for the trading bot token.
    * @param _owner Address of the trading bot owner (the recipient of the NFT).
    * @param _tradingBot Address of the trading bot contract.
    */
    function mintTradingBot(uint256 _tokenID, address _owner, address _tradingBot) external override isInitialized onlyTradingBotRegistry {
        // Create the NFT and transfer it to _owner.
        _mint(_owner, _tokenID, 1, "");

        tradingBotAddresses[_tokenID] = _tradingBot;

        emit MintedTradingBot(_tokenID, _owner, _tradingBot);
    }

    /**
    * @notice Transfers tokens from seller to buyer.
    * @param from Address of the seller.
    * @param to Address of the buyer.
    * @param id The token ID of the trading bot.
    * @param amount Number of tokens to transfer for the given ID. Expected to equal 1.
    * @param data Bytes data.
    */
    function safeTransferFrom(address from, address to, uint id, uint amount, bytes memory data) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "TradingBots: Caller is not owner nor approved."
        );
        require(amount == 1, "TradingBots: Amount must be 1.");
        require(from == ITradingBot(tradingBotAddresses[id]).owner(), "TradingBots: Only the NFT owner can transfer.");

        // Update ownership data.
        ITradingBot(tradingBotAddresses[id]).updateOwner(to);

        _safeTransferFrom(from, to, id, amount, data);
    }

    // Prevent transfer of multiple NFTs in one transaction.
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public override {}

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Intializes the address of the TradingBotRegistry contract.
    * @dev This function can only be called by the TradingBots contract owner.
    * @param _tradingBotRegistry Address of the TradingBotRegistry contract.
    */
    function setTradingBotRegistryAddress(address _tradingBotRegistry) external onlyOwner {
        require(tradingBotRegistry == address(0), "TradingBots: Already set TradingBotRegistry address.");

        tradingBotRegistry = _tradingBotRegistry;

        emit SetTradingBotRegistry(_tradingBotRegistry);
    }
 
    /**
    * @notice Updates the trading bot's owner.
    * @dev This function can only be called by the trading bot's current owner.
    * @param _tradingBotID NFT ID of the trading bot.
    * @param _newOwner Address of the new owner.
    */
    function updateTradingBotOwner(uint256 _tradingBotID, address _newOwner) external {
        require(_newOwner != address(0), "TradingBots: Invalid address for new owner.");
        require(ITradingBot(tradingBotAddresses[_tradingBotID]).owner() == msg.sender, "TradingBots: Only the trading bot owner can call this function.");

        ITradingBot(tradingBotAddresses[_tradingBotID]).updateOwner(_newOwner);

        emit UpdatedOwner(_tradingBotID, _newOwner);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBotRegistry() {
        require(msg.sender == tradingBotRegistry, "TradingBots: Only the TradingBotRegistry contract can call this function.");
        _;
    }

    modifier isInitialized() {
        require(tradingBotRegistry != address(0), "TradingBots: The TradingBotRegistry address is not initialized.");
        _;
    }

    /* ========== EVENTS ========== */

    event MintedTradingBot(uint256 tradingBotID, address owner, address tradingBot);
    event UpdatedOwner(uint256 tradingBotID, address newOwner);
    event SetTradingBotRegistry(address tradingBotRegistryAddress);
}