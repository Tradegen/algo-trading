// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponent {

    /**
     * @notice Returns the address of this component's owner.
     * @dev Fees are paid to the component owner whenever a user creates an instance.
     * @param _componentID ID of the component.
     * @return (address) Address of the component's owner.
     */
    function componentOwner(uint256 _componentID) external view returns (address);

    /**
     * @notice Returns the fee for creating an instance of this component.
     * @param _componentID ID of the component.
     * @return (uint256) The fee for creating an instance of this component.
     */
    function instanceCreationFee(uint256 _componentID) external view returns (uint256);
}