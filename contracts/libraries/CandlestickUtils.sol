// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

library CandlestickUtils {

    struct Candlestick {
        address asset;
        uint256 startingTimestamp;
        uint256 endingTimestamp;
        uint256 open;
        uint256 close;
        uint256 high;
        uint256 low;
    }

    /**
    * @dev Combines stored candlesticks into one candlestick, based on the trading bot's timeframe.
    * @return candlestick An aggregated candlestick struct.
    */
    function _createAggregateCandlestick(Candlestick[] storage candlesticks) internal pure returns (Candlestick memory candlestick) {
        // Save gas by accessing the state variable once.
        Candlestick[] memory data = candlesticks;

        candlestick.open = data[0].open;
        candlestick.low = data[0].low;

        candlestick.close = data[data.length - 1].close;

        for (uint256 i = 0; i < data.length; i++) {
            if (data[i].low < candlestick.low) {
                candlestick.low = data[i].low;
            }

            if (data[i].high > candlestick.high) {
                candlestick.high = data[i].high;
            }
        }
    }
}