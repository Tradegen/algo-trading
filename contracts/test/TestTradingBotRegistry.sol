// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestTradingBotRegistry {

    bool public ret;

    constructor() {}

    function checkInfoForUpkeep(address _owner, address _target) external view returns(bool) {
        return ret;
    }

    function setReturnValue(bool _value) external {
        ret = _value;
    }
}