// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "../comparators/IsAbove.sol";

contract TestIsAbove is IsAbove {
    constructor(address _componentRegistry, address _keeperRegistry)
        IsAbove(_componentRegistry, _keeperRegistry)
    {
        
    }

    function setLastUpdated(uint256 _instance, uint256 _timestamp) external {
        lastUpdated[_instance] = _timestamp;
    }

    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}