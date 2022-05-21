// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestBotPerformanceDataFeed {

    uint256 public updatedIndex;
    uint256 public lastPrice;
    address public dataProvider;

    constructor() {}

    function updateData(string memory _asset, bool _isBuy, uint256 _price, uint256 _timestamp) external {
        updatedIndex = updatedIndex + 1;
        lastPrice = _price;
    }

    function setDataProvider(address _dataProvider) external {
        dataProvider = _dataProvider;
    }
}