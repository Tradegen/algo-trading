// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IPriceAggregator {

    struct Candlestick {
        string asset;
        uint256 startingTimestamp;
        uint256 endingTimestamp;
        uint256 high;
        uint256 low;
        uint256 open;
        uint256 close;
    }

    // Views

    /**
     * @notice Returns the symbol of this PriceAggregator's asset.
     */
    function getAsset() external view returns (string memory);

    /**
     * @notice Returns the number of candlesticks that have been created.
     */
    function numberOfCandlesticks() external view returns (uint256);

    /**
     * @notice Returns the most recent completed candlestick.
     * @dev Doesn't account for the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getCurrentPrice() external view returns (Candlestick memory);

    /**
     * @notice Returns the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPendingPrice() external view returns (Candlestick memory);

     /**
     * @notice Returns the candlestick at the given index.
     * @dev Doesn't account for the candlestick currently forming.
     * @param _index Index of the candlestick.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPriceAt(uint256 _index) external view returns (Candlestick memory);

    /**
     * @notice Returns the latest price from the asset's price feed.
     */
    function latestRawPrice() external view returns (uint256);

    // Mutative

    /**
     * @notice Updates the Candlestick struct based on the latest price from the asset's dedicated oracle.
     * @dev This function is meant to be called once every 30 seconds by the dedicated oracle contract.
     * @param _latestPrice The latest price from the asset's oracle.
     */
    function onPriceFeedUpdate(uint256 _latestPrice) external;
}