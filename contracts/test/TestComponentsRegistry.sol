// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestComponentsRegistry {

    bool public ret;

    constructor() {}

    function checkInfoForUpkeep(address _owner, bool _isIndicator, address _target, uint256 _instanceID) external view returns(bool) {
        return ret;
    }

    function setReturnValue(bool _value) external {
        ret = _value;
    }
}