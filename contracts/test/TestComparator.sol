// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestComparator {

    mapping (uint256 => address) public keepers;
    mapping (uint256 => bool) public canUpdate;

    constructor() {}

    function setKeeper(uint256 _instanceID, address _keeper) external {
        keepers[_instanceID] = _keeper;
    }

    function setCanUpdate(uint256 _instanceID, bool _canUpdate) external {
        canUpdate[_instanceID] = _canUpdate;
    }

    function checkConditions(uint256 _instanceID) external view returns (bool) {
        return canUpdate[_instanceID];
    }
}