// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin.
import "../openzeppelin-solidity/contracts/Ownable.sol";

// Interfaces.
import "../interfaces/deprecated/IPriceAggregator.sol";

// Inheritance.
import "../interfaces/deprecated/IPriceAggregatorRouter.sol";

contract PriceAggregatorRouter is IPriceAggregatorRouter, Ownable {

    /* ========== STATE VARIABLES ========== */

    // Symbol of asset => address of asset's PriceAggregator contract.
    mapping (string => address) public priceAggregators;

    /* ========== CONSTRUCTOR ========== */

    constructor() Ownable() {}

    /* ========== VIEWS ========== */

    /**
     * @notice Returns the address of the PriceAggregator contract for the given asset.
     * @dev Returns address(0) if the given asset doesn't have a PriceAggregator.
     * @param _asset Symbol of the asset.
     * @return (address) Address of the asset's PriceAggregator contract.
     */
    function getPriceAggregator(string memory _asset) external view override returns (address) {
        return priceAggregators[_asset];
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
     * @notice Set the PriceAggregator contract for the given asset.
     * @param _asset Symbol of the asset.
     * @param _priceAggregator Address of the PriceAggregator contract.
     */
    function setPriceAggregator(string memory _asset, address _priceAggregator) external onlyOwner {
        require(_priceAggregator != address(0), "PriceAggregatorRouter: Invalid address for price aggregator.");
        require(keccak256(abi.encodePacked(IPriceAggregator(_priceAggregator).getAsset())) == keccak256(abi.encodePacked(_asset)), "PriceAggregatorRouter: Given asset does not match price aggregator's asset.");

        priceAggregators[_asset] = _priceAggregator;

        emit SetPriceAggregator(_asset, _priceAggregator);
    }

    /* ========== EVENTS ========== */

    event SetPriceAggregator(string asset, address priceAggregator);
}