// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

//Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";
import "./openzeppelin-solidity/contracts/ERC1155/IERC1155.sol";
import "./openzeppelin-solidity/contracts/ERC1155/ERC1155Holder.sol";

//Inheritance.
import './interfaces/IMarketplace.sol';

contract Marketplace is IMarketplace, ERC1155Holder, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Max fee of 10%.
    uint256 public MAX_TRANSACTION_FEE = 1000; 

    // Denominated by 10000.
    uint256 public transactionFee = 200; 

    IERC1155 public immutable components;
    IERC1155 public immutable tradingBots;
    IERC20 public immutable TGEN;
    address public immutable xTGEN;

    // Starts at index 1; increases without bounds.
    uint256 public numberOfMarketplaceListings = 1;

    // Starts at index 1; increases without bounds.
    mapping (uint256 => MarketplaceListing) public marketplaceListings; 

    // NFT ID => is trading bot => listing index.
    // Returns 0 if the NFT is not listed for sale.
    mapping (uint256 => mapping (bool => uint256)) public listingIndexes; 

    // User address => is trading bot => => NFT ID => listing index.
    // Returns 0 if user is not selling the NFT ID.
    mapping (address => mapping (bool => mapping(uint256 => uint256))) public userToListingIndex; 

    constructor(address _components, address _tradingBots, address _TGEN, address _xTGEN) Ownable() {
        require(_components != address(0), "Marketplace: Invalid address for Components contract.");
        require(_tradingBots != address(0), "Marketplace: Invalid address for TradingBots contract.");
        require(_TGEN != address(0), "Marketplace: Invalid address for TGEN.");
        require(_xTGEN != address(0), "Marketplace: Invalid address for xTGEN.");

        components = IERC1155(_components);
        tradingBots = IERC1155(_tradingBots);
        TGEN = IERC20(_TGEN);
        xTGEN = _xTGEN;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Given an NFT ID, returns its listing index.
    * @dev Returns 0 if the NFT with the given ID is not listed.
    * @param _ID Token ID of the indicator/comparator NFT.
    * @param _isTradingBot Whether the NFT is a trading bot.
    * @return (uint256) Listing index of the indicator/comparator NFT.
    */
    function getListingIndex(uint256 _ID, bool _isTradingBot) external view override returns (uint256) {
        return listingIndexes[_ID][_isTradingBot];
    }

    /**
    * @notice Given the index of a marketplace listing, returns the listing's data.
    * @param _index Index of the marketplace listing.
    * @return (address, bool, bool, uint256, uint256) Address of the seller, whether the listing exists, whether the NFT is a trading bot, NFT ID, and the price (in TGEN).
    */
    function getMarketplaceListing(uint256 _index) external view override indexInRange(_index) returns (address, bool, bool, uint256, uint256) {
        MarketplaceListing memory listing = marketplaceListings[_index];

        return (listing.seller, listing.exists, listing.isTradingBot, listing.ID, listing.price);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Purchases the indicator/comparator NFT at the given listing index.
    * @param _index Index of the marketplace listing.
    */
    function purchase(uint256 _index) external override indexInRange(_index) {
        MarketplaceListing memory listing = marketplaceListings[_index];

        require(listing.exists, "Marketplace: listing does not exist.");
        require(msg.sender != listing.seller, "Marketplace: Cannot buy your own NFT.");

        TGEN.safeTransferFrom(msg.sender, address(this), listing.price);
        
        // Transfer TGEN to seller.
        TGEN.safeTransfer(listing.seller, listing.price.mul(10000 - transactionFee).div(10000));

        // Transfer TGEN to xTGEN contract.
        TGEN.safeTransfer(xTGEN, listing.price.mul(transactionFee).div(10000));

        // Transfer NFT to buyer.
        if (listing.isTradingBot) {
            tradingBots.setApprovalForAll(msg.sender, true);
            tradingBots.safeTransferFrom(address(this), msg.sender, listing.ID, 1, "");
        }
        else {
            components.setApprovalForAll(msg.sender, true);
            components.safeTransferFrom(address(this), msg.sender, listing.ID, 1, "");
        }

        // Update state variables.
        _removeListing(listing.seller, listing.isTradingBot, _index);

        emit Purchased(msg.sender, _index, listing.ID, listing.isTradingBot, listing.price);
    }

    /**
    * @notice Creates a new marketplace listing with the given price and NFT ID.
    * @param _ID ID of the indicator/comparator NFT.
    * @param _isTradingBot Whether the NFT is a trading bot.
    * @param _price TGEN price of the NFT.
    */
    function createListing(uint256 _ID, bool _isTradingBot, uint256 _price) external override {
        require(userToListingIndex[msg.sender][_isTradingBot][_ID] == 0, "Marketplace: Already have a marketplace listing for this NFT.");
        require(_price > 0, "Marketplace: Price must be greater than 0");
        require(components.balanceOf(msg.sender, _ID) == 1, "Marketplace: don't own NFT.");

        numberOfMarketplaceListings = numberOfMarketplaceListings.add(1);
        listingIndexes[_ID][_isTradingBot] = numberOfMarketplaceListings;
        userToListingIndex[msg.sender][_isTradingBot][_ID] = numberOfMarketplaceListings;
        marketplaceListings[numberOfMarketplaceListings] = MarketplaceListing(msg.sender, true, _isTradingBot, _ID, _price);

        // Transfer NFT to marketplace.
        if (_isTradingBot) {
            tradingBots.safeTransferFrom(msg.sender, address(this), _ID, 1, "");
        }
        else {
            components.safeTransferFrom(msg.sender, address(this), _ID, 1, "");
        }

        emit CreatedListing(msg.sender, numberOfMarketplaceListings, _isTradingBot, _ID, _price);
    }

    /**
    * @notice Removes the marketplace listing at the given index.
    * @param _index Index of the marketplace listing.
    */
    function removeListing(uint256 _index) external override indexInRange(_index) onlySeller(_index) {
        MarketplaceListing memory listing = marketplaceListings[_index];

        _removeListing(msg.sender, listing.isTradingBot, _index);

        // Transfer NFT to seller.
        if (listing.isTradingBot) {
            tradingBots.setApprovalForAll(msg.sender, true);
            tradingBots.safeTransferFrom(address(this), msg.sender, listing.ID, 1, "");
        }
        else {
            components.setApprovalForAll(msg.sender, true);
            components.safeTransferFrom(address(this), msg.sender, listing.ID, 1, "");
        }

        emit RemovedListing(msg.sender, _index);
    }

    /**
    * @notice Updates the price of the given marketplace listing.
    * @param _index Index of the marketplace listing.
    * @param _newPrice TGEN price of the NFT.
    */
    function updatePrice(uint256 _index, uint256 _newPrice) external override indexInRange(_index) onlySeller(_index) {
        require(_newPrice > 0, "Marketplace: New price must be greater than 0.");

        marketplaceListings[_index].price = _newPrice;

        emit UpdatedPrice(msg.sender, _index, _newPrice);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Updates the transaction fee.
    * @dev This function is meant to be called by the contract deployer.
    * @param _newFee The new transaction fee.
    */
    function setTransactionFee(uint256 _newFee) external onlyOwner {
        require(_newFee >= 0, "Marketplace: New fee must be positive.");
        require(_newFee <= MAX_TRANSACTION_FEE, "Marketplace: New fee is too high.");

        transactionFee = _newFee;

        emit UpdatedTransactionFee(_newFee);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @notice Sets the marketplace listing's 'exists' variable to false.
    * @param _user Address of the seller.
    * @param _isTradingBot Whether the NFT is a trading bot.
    * @param _index Index of the marketplace listing.
    */
    function _removeListing(address _user, bool _isTradingBot, uint256 _index) internal {
        marketplaceListings[_index].exists = false;

        userToListingIndex[_user][_isTradingBot][marketplaceListings[_index].ID] = 0;
    }

    /* ========== MODIFIERS ========== */

    modifier indexInRange(uint256 index) {
        require(index > 0 &&
                index <= numberOfMarketplaceListings,
                "Marketplace: Index out of range.");
        _;
    }

    modifier onlySeller(uint256 index) {
        require(msg.sender == marketplaceListings[index].seller,
                "Marketplace: Only the seller can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedTransactionFee(uint256 newFee);
}