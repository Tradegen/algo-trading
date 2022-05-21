// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestBotPerformanceDataFeedRegistry {

    constructor() {}

    function registerDataFeed(address _tradingBot, uint256 _usageFee, address _caller) external {}

    function getDataFeedInfo(address _tradingBot) external view returns (address, address, address, address, uint256) {
        return (_tradingBot, _tradingBot, _tradingBot, _tradingBot, 0);
    }
}