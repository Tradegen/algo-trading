// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Internal references.
import './ComponentInstances.sol';

// Inheritance.
import './interfaces/IComponentInstancesFactory.sol';

contract ComponentInstancesFactory is IComponentInstancesFactory {
    address public immutable componentRegistry;
    address public immutable feeToken;

    constructor(address _componentRegistry, address _feeToken) {
        require(_componentRegistry != address(0), "ComponentInstancesFactory: Invalid address for _componentRegistry.");
        require(_feeToken != address(0), "ComponentInstancesFactory: Invalid address for _feeToken.");

        componentRegistry = _componentRegistry;
        feeToken = _feeToken;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a ComponentInstances contract and returns the contract's address.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _componentID ID of the indicator/comparator associated with the ComponentInstances NFT.
    * @return address Address of the deployed ComponentInstances contract.
    */
    function createInstance(uint256 _componentID) external override onlyComponentRegistry returns (address) {
        address componentInstanceContract = address(new ComponentInstances(componentRegistry, feeToken, _componentID));

        emit CreatedInstanceContract(_componentID, componentInstanceContract);

        return componentInstanceContract;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyComponentRegistry() {
        require(componentRegistry == msg.sender,
                "ComponentInstancesFactory: Only the ComponentRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedInstanceContract(uint256 componentID, address componentInstanceContract);
}