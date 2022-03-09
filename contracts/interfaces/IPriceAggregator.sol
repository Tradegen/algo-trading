// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Libraries
import '../libraries/CandlestickUtils.sol';

interface IPriceAggregator {
    // Views

    /**
     * @dev Returns the address of this PriceAggregator's asset.
     */
    function asset() external view returns (address);

    /**
     * @dev Returns the number of candlesticks that have been created.
     */
    function numberOfCandlesticks() external view returns (uint256);

    /**
     * @dev Returns the most recent completed candlestick.
     * @notice Doesn't account for the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getCurrentPrice() external view returns (CandlestickUtils.Candlestick memory);

    /**
     * @dev Returns the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPendingPrice() external view returns (CandlestickUtils.Candlestick memory);

     /**
     * @dev Returns the candlestick at the given index.
     * @notice Doesn't account for the candlestick currently forming.
     * @param _index Index of the candlestick.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPriceAt(uint256 _index) external view returns (CandlestickUtils.Candlestick memory);

    // Mutative

    /**
     * @dev Updates the Candlestick struct based on the latest price from the asset's dedicated oracle.
     * @notice This function is meant to be called once every 30 seconds by the dedicated oracle contract.
     * @param _latestPrice The latest price from the asset's oracle.
     */
    function onPriceFeedUpdate(uint256 _latestPrice) external;
}