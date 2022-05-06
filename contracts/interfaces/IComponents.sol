// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponents {
    struct Component {
        address owner;
        bool isIndicator;
        address contractAddress;
        uint256 tokenID;
        uint256 instanceCreationFee;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Returns the address of the ComponentInstances contract associated with the given component ID.
     * @param _componentID ID of the component.
     * @return (address) Address of the component contract.
     */
    function componentInstance(uint256 _componentID) external view returns (address);

    /**
     * @notice Given the ID of a component, returns the component's info.
     * @param _componentID ID of the component.
     * @return (address, bool, address, uint256, uint256) Address of the component owner,
     *                                                    whether the component is an indicator,
     *                                                    address of the component's contract.
     *                                                    token ID of the component,
     *                                                    and component's instance creation fee.
     */
    function getComponentInfo(uint256 _componentID) external view returns (address, bool, address, uint256, uint256);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Mints an NFT for the given component.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _contractAddress Address of the component's contract.
    * @param _isIndicator Whether the component is an indicator.
    * @param _owner Address of the component's owner.
    * @param _fee The fee, in TGEN, to create an instance of the component.
    * @return uint256 The token ID of the minted component.
    */
    function createComponent(address _contractAddress, bool _isIndicator, address _owner, uint256 _fee) external returns (uint256);

    /**
    * @notice Sets the address of the given component's ComponentInstances contract.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @dev This function is meant to be called after calling createComponent() within the same transaction.
    * @param _componentID ID of the component.
    * @param _instancesAddress Address of the component's ComponentInstances contract.
    */
    function setComponentInstancesAddress(uint256 _componentID, address _instancesAddress) external;

    /**
     * @notice Updates the fee of the given component.
     * @dev This function can only be called by the ComponentRegistry contract.
     * @dev The ComponentRegistry function checks that the caller is the component owner before calling this function.
     * @param _componentID ID of the component.
     * @param _newFee The fee, in TGEN, to create an instance of the component.
     */
    function updateComponentFee(uint256 _componentID, uint256 _newFee) external;
}