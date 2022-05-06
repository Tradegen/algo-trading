// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface ICandlestickDataFeedRegistry {

    /**
    * @notice Returns an array of available timeframes (in minutes).
    */
    function getValidTimeframes() external view returns (uint256[] memory);

    /**
    * @notice Gets the current price of the given asset's data feed.
    * @dev Current price is the 'close' price of the latest candlestick.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @return uint256 The current USD price of the given asset.
    */
    function getCurrentPrice(string memory _asset, uint256 _timeframe) external view returns (uint256);

    /**
    * @notice Gets the price of the given asset's data feed at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @param _index Index in the data feed's history.
    * @return uint256 The USD price at the given index.
    */
    function getPriceAt(string memory _asset, uint256 _timeframe, uint256 _index) external view returns (uint256);

    /**
    * @notice Gets the current candlestick of the given asset's data feed.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCurrentCandlestick(string memory _asset, uint256 _timeframe) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256);

    /**
    * @notice Gets the candlestick of the given asset's data feed at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @param _index Index in the data feed's history.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCandlestickAt(string memory _asset, uint256 _timeframe, uint256 _index) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256);

    /**
    * @notice Given the symbol of an asset, returns the asset's data feed info.
    * @dev Returns 0 or address(0) for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @return (address, address, address, uint256, uint256) Address of the data feed, symbol of the data feed's asset, address of the dedicated data provider, timestamp when the data feed was created, current price.
    */
    function getDataFeedInfo(string memory _asset, uint256 _timeframe) external view returns (address, string memory, address, uint256, uint256);

    /**
    * @notice Given the symbol of an asset, returns the address of the asset's data feed.
    * @dev Returns address(0) if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    */
    function getDataFeedAddress(string memory _asset, uint256 _timeframe) external view returns (address);

    /**
    * @notice Returns the timestamp at which the given asset's data feed was last updated.
    * @dev Returns 0 if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    */
    function lastUpdated(string memory _asset, uint256 _timeframe) external view returns (uint256);

    /**
    * @notice Returns the status of the given asset's data feed.
    * @dev 0 = Active.
    * @dev 1 = Outdated.
    * @dev 2 = Halted.
    * @dev 3 = Data feed not found.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    */
    function getDataFeedStatus(string memory _asset, uint256 _timeframe) external view returns (uint256);

    /**
    * @notice Aggregates the given number of candlesticks into one candlestick, representing a higher timeframe.
    * @dev If there are not enough candlesticks in the data feed's history, the function will aggregate all candlesticks in the data feed's history.
    *      Ex) If user wants to aggregate 60 candlesticks but the data feed only has 50 candlesticks, the function will return a candlestick of size 50 instead of 60.
    * @dev It is not recommended to aggregate more than 10 candlesticks due to gas.
    * @dev Returns 0 for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @param _numberOfCandlesticks Number of candlesticks to aggregate.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256) High price, low price, open price, close price, total volume, and starting timestamp.
    */
    function aggregateCandlesticks(string memory _asset, uint256 _timeframe, uint256 _numberOfCandlesticks) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);

    /**
    * @notice Given the symbol of an asset, returns whether the asset has a data feed.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @return bool Whether the given asset has a data feed.
    */
    function hasDataFeed(string memory _asset, uint256 _timeframe) external view returns (bool);

    /**
    * @notice Returns whether the data feed associated with the given asset and timeframe can be updated.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @return bool Whether the data feed can be updated.
    */
    function canUpdate(string memory _asset, uint256 _timeframe) external view returns (bool);

    /**
    * @notice Registers a new data feed to the platform.
    * @dev Only the contract operator can call this function.
    * @dev Transaction will revert if a data feed already exists for the given asset.
    * @param _asset Symbol of the asset.
    * @param _timeframe Timeframe in minutes.
    * @param _dedicatedDataProvider Address of the data provider responsible for this data feed.
    */
    function registerDataFeed(string memory _asset, uint256 _timeframe, address _dedicatedDataProvider) external;
}