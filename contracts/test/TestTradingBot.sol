// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestTradingBot {

    address public keeper;
    bool public canUpdate;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setKeeper(address _keeper) external {
        keeper = _keeper;
    }

    function setCanUpdate(bool _canUpdate) external {
        canUpdate = _canUpdate;
    }

    function update() external view returns (bool) {
        return canUpdate;
    }

    function updateOwner(address _newOwner) external {
        owner = _newOwner;
    }
}