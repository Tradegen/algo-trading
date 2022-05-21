// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestComponentsRegistry {

    bool public ret;
    mapping (address => mapping (uint256 => mapping (uint256 => bool))) public hasPurchasedComponentInstance;
    mapping (uint256 => mapping (uint256 => bool)) public meetsConditions;

    constructor() {}

    function checkInfoForUpkeep(address _owner, bool _isIndicator, address _target, uint256 _instanceID) external view returns(bool) {
        return ret;
    }

    function setReturnValue(bool _value) external {
        ret = _value;
    }

    function setHasPurchasedComponentInstance(address _user, uint256 _componentID, uint256 _instanceID, bool _value) external {
        hasPurchasedComponentInstance[_user][_componentID][_instanceID] = _value;
    }

    function setMeetsConditions(uint256 _componentID, uint256 _instanceID, bool _value) external {
        meetsConditions[_componentID][_instanceID] = _value;
    }

    function checkRules(address _owner, uint256[] memory _componentIDs, uint256[] memory _instanceIDs) external view returns (bool) {
        return ret;
    }
}