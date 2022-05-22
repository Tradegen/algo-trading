// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

interface IMarketplace {

    struct MarketplaceListing {
        address seller;
        bool exists;
        uint256 contractType; // 0 = trading bot, 1 = component, 2 = component instance.
        uint256 componentID;
        uint256 tokenID;
        uint256 price; // Denominated in TGEN.
    }

    /**
    * @notice Given an NFT ID, returns its listing index.
    * @dev Returns 0 if the NFT with the given ID is not listed.
    * @param _tokenID Token ID of the given contract type.
    * @param _contractType The type (0, 1, 2) of the contract.
    * @param _componentID The ID of the component. This value is not used if the contract type is not 2.
    * @return (uint256) Listing index of the NFT.
    */
    function getListingIndex(uint256 _tokenID, uint256 _contractType, uint256 _componentID) external view returns (uint256);

    /**
    * @notice Given the index of a marketplace listing, returns the listing's data
    * @param _index Index of the marketplace listing
    * @return (address, bool, uint256, uint256, uint256, uint256) Address of the seller, whether the listing exists, the contract type, the component ID, NFT ID, and the price (in TGEN).
    */
    function getMarketplaceListing(uint256 _index) external view returns (address, bool, uint256, uint256, uint256, uint256);

    /**
    * @notice Purchases the indicator/comparator NFT at the given listing index.
    * @param _index Index of the marketplace listing.
    */
    function purchase(uint256 _index) external;

    /**
    * @notice Creates a new marketplace listing with the given price and NFT ID.
    * @param _tokenID NFT ID of the contract.
    * @param _contractType The type (0, 1, 2) of contract.
    * @param _componentID The ID of the component. This value is not used if the contract type is not 2.
    * @param _price TGEN price of the NFT.
    */
    function createListing(uint256 _tokenID, uint256 _contractType, uint256 _componentID, uint256 _price) external;

    /**
    * @notice Removes the marketplace listing at the given index.
    * @param _index Index of the marketplace listing.
    */
    function removeListing(uint256 _index) external;

    /**
    * @notice Updates the price of the given marketplace listing.
    * @param _index Index of the marketplace listing.
    * @param _newPrice TGEN price of the NFT.
    */
    function updatePrice(uint256 _index, uint256 _newPrice) external;

    /* ========== EVENTS ========== */

    event CreatedListing(address indexed seller, uint256 marketplaceListingIndex, uint256 contractType, uint256 componentID, uint256 tokenID, uint256 price);
    event RemovedListing(address indexed seller, uint256 marketplaceListingIndex);
    event UpdatedPrice(address indexed seller, uint256 marketplaceListingIndex, uint256 newPrice);
    event Purchased(address indexed buyer, uint256 marketplaceListingIndex, uint256 tokenID, uint256 contractType, uint256 componentID, uint256 price);
}