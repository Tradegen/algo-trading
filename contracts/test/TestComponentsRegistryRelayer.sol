// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import '../interfaces/IComponentsRegistry.sol';


contract TestComponentsRegistryRelayer {

    bool public upkeepInfoStatus;
    bool public rulesStatus;
    address public componentsRegistry;

    constructor(address _componentsRegistry) {
        componentsRegistry = _componentsRegistry;
    }

    function checkInfoForUpkeep(address _owner, bool _isIndicator, address _target, uint256 _instanceID) external {
        upkeepInfoStatus = IComponentsRegistry(componentsRegistry).checkInfoForUpkeep(_owner, _isIndicator, _target, _instanceID);
    }

    function checkRules(address _user, uint256[] memory _componentIDs, uint256[] memory _instanceIDs) external {
        rulesStatus = IComponentsRegistry(componentsRegistry).checkRules(_user, _componentIDs, _instanceIDs);
    }
}