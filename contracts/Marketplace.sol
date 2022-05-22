// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";
import "./openzeppelin-solidity/contracts/ERC1155/IERC1155.sol";
import "./openzeppelin-solidity/contracts/ERC1155/ERC1155Holder.sol";

// Interfaces.
import './interfaces/IComponents.sol';
import './interfaces/IComponentInstances.sol';

// Inheritance.
import './interfaces/IMarketplace.sol';

contract Marketplace is IMarketplace, ERC1155Holder, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Max fee of 10%.
    uint256 public constant MAX_TRANSACTION_FEE = 1000; 

    // Denominated by 10000.
    uint256 public transactionFee; 

    address public immutable components;
    address public immutable tradingBots;
    IERC20 public immutable TGEN;
    address public immutable xTGEN;

    // Starts at index 0; increases without bounds.
    uint256 public numberOfMarketplaceListings;

    // Starts at index 1; increases without bounds.
    mapping (uint256 => MarketplaceListing) public marketplaceListings; 

    // (NFT ID => contract type => component ID => listing index.
    // Returns 0 if the NFT is not listed for sale.
    mapping (uint256 => mapping (uint256 => mapping (uint256 => uint256))) public listingIndexes; 

    // User address => contract type => component ID => NFT ID => listing index.
    // Returns 0 if user is not selling the NFT ID.
    mapping (address => mapping (uint256 => mapping (uint256 => mapping (uint256 => uint256)))) public userToListingIndex; 

    constructor(address _components, address _tradingBots, address _TGEN, address _xTGEN) Ownable() {
        require(_components != address(0), "Marketplace: Invalid address for Components contract.");
        require(_tradingBots != address(0), "Marketplace: Invalid address for TradingBots contract.");
        require(_TGEN != address(0), "Marketplace: Invalid address for TGEN.");
        require(_xTGEN != address(0), "Marketplace: Invalid address for xTGEN.");

        components = _components;
        tradingBots = _tradingBots;
        TGEN = IERC20(_TGEN);
        xTGEN = _xTGEN;

        transactionFee = 200;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Given an NFT ID, returns its listing index.
    * @dev Returns 0 if the NFT with the given ID is not listed.
    * @param _tokenID Token ID of the given contract type.
    * @param _contractType The type (0, 1, 2) of the contract.
    * @param _componentID The ID of the component. This value is not used if the contract type is not 2.
    * @return (uint256) Listing index of the NFT.
    */
    function getListingIndex(uint256 _tokenID, uint256 _contractType, uint256 _componentID) external view override returns (uint256) {
        return listingIndexes[_tokenID][_contractType][_componentID];
    }

    /**
    * @notice Given the index of a marketplace listing, returns the listing's data
    * @param _index Index of the marketplace listing
    * @return (address, bool, uint256, uint256, uint256, uint256) Address of the seller, whether the listing exists, the contract type, the component ID, NFT ID, and the price (in TGEN).
    */
    function getMarketplaceListing(uint256 _index) external view override indexInRange(_index) returns (address, bool, uint256, uint256, uint256, uint256) {
        MarketplaceListing memory listing = marketplaceListings[_index];

        return (listing.seller, listing.exists, listing.contractType, listing.componentID, listing.tokenID, listing.price);
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
        if (listing.contractType == 0) {
            IERC1155(tradingBots).setApprovalForAll(msg.sender, true);
            IERC1155(tradingBots).safeTransferFrom(address(this), msg.sender, listing.tokenID, 1, "");
        }
        else if (listing.contractType == 1) {
            IERC1155(components).setApprovalForAll(msg.sender, true);
            IERC1155(components).safeTransferFrom(address(this), msg.sender, listing.tokenID, 1, "");
        }
        else {
            address componentInstancesAddress = IComponents(components).componentInstance(listing.componentID);
            IERC1155(componentInstancesAddress).setApprovalForAll(msg.sender, true);
            IERC1155(componentInstancesAddress).safeTransferFrom(address(this), msg.sender, listing.tokenID, 1, "");
        }

        // Update state variables.
        _removeListing(listing.seller, listing.contractType, listing.componentID, _index);

        emit Purchased(msg.sender, _index, listing.tokenID, listing.contractType, listing.componentID, listing.price);
    }

    /**
    * @notice Creates a new marketplace listing with the given price and NFT ID.
    * @param _tokenID NFT ID of the contract.
    * @param _contractType The type (0, 1, 2) of contract.
    * @param _componentID The ID of the component. This value is not used if the contract type is not 2.
    * @param _price TGEN price of the NFT.
    */
    function createListing(uint256 _tokenID, uint256 _contractType, uint256 _componentID, uint256 _price) external override {
        uint256 adjustedComponentID = (_contractType == 2) ? _componentID : 0;

        require(_contractType >= 0 && _contractType <= 2, "Marketplace: Invalid contract type.");
        require(userToListingIndex[msg.sender][_contractType][adjustedComponentID][_tokenID] == 0, "Marketplace: Already have a marketplace listing for this NFT.");
        require(_price > 0, "Marketplace: Price must be greater than 0");

        // Gas savings.
        uint256 index = numberOfMarketplaceListings.add(1);

        numberOfMarketplaceListings = index;
        listingIndexes[_tokenID][_contractType][adjustedComponentID] = index;
        userToListingIndex[msg.sender][_contractType][adjustedComponentID][_tokenID] = index;
        marketplaceListings[numberOfMarketplaceListings] = MarketplaceListing({
            seller: msg.sender,
            exists: true,
            contractType: _contractType,
            componentID: adjustedComponentID,
            tokenID: _tokenID,
            price: _price
        });

        // Transfer NFT to marketplace.
        if (_contractType == 0) {
            IERC1155(tradingBots).safeTransferFrom(msg.sender, address(this), _tokenID, 1, "");
        }
        else if (_contractType == 1) {
            IERC1155(components).safeTransferFrom(msg.sender, address(this), _tokenID, 1, "");
        }
        else {
            address componentInstancesAddress = IComponents(components).componentInstance(adjustedComponentID);
            IERC1155(componentInstancesAddress).safeTransferFrom(msg.sender, address(this), _tokenID, 1, "");
        }

        emit CreatedListing(msg.sender, index, _contractType, adjustedComponentID, _tokenID, _price);
    }

    /**
    * @notice Removes the marketplace listing at the given index.
    * @param _index Index of the marketplace listing.
    */
    function removeListing(uint256 _index) external override indexInRange(_index) onlySeller(_index) {
        MarketplaceListing memory listing = marketplaceListings[_index];

        _removeListing(msg.sender, listing.contractType, listing.componentID, _index);

        // Transfer NFT to seller.
        if (listing.contractType == 0) {
            IERC1155(tradingBots).setApprovalForAll(msg.sender, true);
            IERC1155(tradingBots).safeTransferFrom(address(this), msg.sender, listing.tokenID, 1, "");
        }
        else if (listing.contractType == 1) {
            IERC1155(components).setApprovalForAll(msg.sender, true);
            IERC1155(components).safeTransferFrom(address(this), msg.sender, listing.tokenID, 1, "");
        }
        else {
            address componentInstancesAddress = IComponents(components).componentInstance(listing.componentID);
            IERC1155(componentInstancesAddress).setApprovalForAll(msg.sender, true);
            IERC1155(componentInstancesAddress).safeTransferFrom(address(this), msg.sender, listing.tokenID, 1, "");
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
    * @param _contractType The type (0, 1, 2) of the contract.
    * @param _componentID The ID of the component. This value is not used if the contract type is not 2.
    * @param _index Index of the marketplace listing.
    */
    function _removeListing(address _user, uint256 _contractType, uint256 _componentID, uint256 _index) internal {
        marketplaceListings[_index].exists = false;
        userToListingIndex[_user][_contractType][_componentID][marketplaceListings[_index].tokenID] = 0;
        listingIndexes[marketplaceListings[_index].tokenID][_contractType][_componentID] = 0;
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