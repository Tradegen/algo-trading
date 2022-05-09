// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestCandlestickDataFeedRegistry {

    // (asset symbol => timeframe => price).
    mapping (string => mapping (uint256 => uint256)) public prices;

    constructor() {}

    function setPrice(string memory _asset, uint256 _timeframe, uint256 _price) external {
        prices[_asset][_timeframe] = _price;
    }

    function getCurrentPrice(string memory _asset, uint256 _timeframe) external view returns (uint256) {
        return prices[_asset][_timeframe];
    }

    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}