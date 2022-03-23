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
    function _createAggregateCandlestick(Candlestick[] memory candlesticks) internal view returns (Candlestick memory candlestick) {
        candlestick.open = candlesticks[0].open;
        candlestick.low = candlesticks[0].low;

        candlestick.close = candlesticks[candlesticks.length - 1].close;

        for (uint256 i = 0; i < candlesticks.length; i++) {
            if (candlesticks[i].low < candlestick.low) {
                candlestick.low = candlesticks[i].low;
            }

            if (candlesticks[i].high > candlestick.high) {
                candlestick.high = candlesticks[i].high;
            }
        }
    }
}