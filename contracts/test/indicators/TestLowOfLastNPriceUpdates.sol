// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "../../indicators/LowOfLastNPriceUpdates.sol";

contract TestLowOfLastNPriceUpdates is LowOfLastNPriceUpdates {
    constructor(address _componentRegistry, address _candlestickDataFeedRegistry, address _keeperRegistry)
        LowOfLastNPriceUpdates(_componentRegistry, _candlestickDataFeedRegistry, _keeperRegistry)
    {
        
    }

    function setLastUpdated(uint256 _instance, uint256 _timestamp) external {
        lastUpdated[_instance] = _timestamp;
    }

    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}