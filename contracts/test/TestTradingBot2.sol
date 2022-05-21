// SPDX-License-Identifier: MIT

import "../TradingBot.sol";

pragma solidity ^0.8.3;

contract TestTradingBot2 is TradingBot {

    constructor(address _owner, address _componentsRegistry, address _candlestickDataFeedRegistry, address _tradingBotRegistry, address _keeperRegistry, address _tradingBots)
    TradingBot(_owner, _componentsRegistry, _candlestickDataFeedRegistry, _tradingBotRegistry, _keeperRegistry, _tradingBots) {}

    function resetLastUpdatedTimestamp() external {
        botState.lastUpdatedTimestamp = 0;
    }
}