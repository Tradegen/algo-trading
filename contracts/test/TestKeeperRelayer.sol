// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import '../interfaces/IKeeper.sol';

contract TestKeeperRelayer {

    bool public checkUpkeepStatus;
    address public keeper;

    constructor(address _keeper) {
        keeper = _keeper;
    }

    function checkUpkeep(uint256 _jobID) external returns (bool) {
        checkUpkeepStatus = IKeeper(keeper).checkUpkeep(_jobID);
    }
}