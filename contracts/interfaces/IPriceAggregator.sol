// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IPriceAggregator {

    struct Candlestick {
        address asset;
        uint256 startingTimestamp;
        uint256 endingTimestamp;
        uint256 open;
        uint256 close;
        uint256 high;
        uint256 low;
    }

    // Views

    /**
     * @dev Returns the most recent completed candlestick.
     * @notice Doesn't account for the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getCurrentPrice() external view returns (Candlestick memory);

    /**
     * @dev Returns the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPendingPrice() external view returns (Candlestick memory);

     /**
     * @dev Returns the candlestick at the given index.
     * @notice Doesn't account for the candlestick currently forming.
     * @param _index Index of the candlestick.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPriceAt(uint256 _index) external view returns (Candlestick memory);

    // Mutative

    /**
     * @dev Updates the Candlestick struct based on the latest price from the asset's dedicated oracle.
     * @notice This function is meant to be called once every 30 seconds by the dedicated oracle contract.
     * @param _latestPrice The latest price from the asset's oracle.
     */
    function onPriceFeedUpdate(uint256 _latestPrice) external;
}