// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import '../interfaces/ITradingBotRegistry.sol';

contract TestTradingBotRegistryRelayer {

    bool public upkeepInfoStatus;
    address public tradingBotRegistry;

    constructor(address _tradingBotRegistry) {
        tradingBotRegistry = _tradingBotRegistry;
    }

    function checkInfoForUpkeep(address _owner, address _target) external {
        upkeepInfoStatus = ITradingBotRegistry(tradingBotRegistry).checkInfoForUpkeep(_owner, _target);
    }
}