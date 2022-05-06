// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponentInstances {
    struct ComponentInstance {
        address owner;
        uint256 tokenID;
        bool isDefault;
        uint256 price;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Given the ID of an instance, returns the component instance's info.
     * @param _instanceID ID of the component instance.
     * @return (address, uint256, bool, uint256) Address of the instance owner,
     *                                                 token ID of the instance,
     *                                                 whether the component instance is default,
     *                                                 and price of the component instance.
     */
    function getComponentInstanceInfo(uint256 _instanceID) external view returns (address, uint256, bool, uint256);

    /**
     * @notice Returns whether the user has purchased the given component instance.
     * @dev Returns true if the given instance is a default instance.
     * @param _user Address of the user.
     * @param _instanceID ID of the component instance.
     * @return (bool) Whether the user has purchased this component instance.
     */
    function hasPurchasedInstance(address _user, uint256 _instanceID) external view returns (bool);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Mints an NFT for the given component instance.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _owner Address of the instance's owner.
    * @param _price The price, in TGEN, to use the instance.
    * @param _isDefault Whether the instance is default.
    */
    function createInstance(address _owner, uint256 _price, bool _isDefault) external;

    /**
     * @notice Purchases the given component instance.
     * @dev Purchasing an instance allows the user to integrate it into trading bots.
     * @dev The user does not receive the instance NFT, only the right to use the instance in a trading bot.
     * @dev Transaction will revert if the instance is not active (has not been updated regularly).
     * @dev This function can only be called by the ComponentRegistry contract.
     * @param _user Address of the user.
     * @param _instanceID ID of the component instance.
     */
    function purchaseComponentInstance(address _user, uint256 _instanceID) external;

    /**
     * @notice Marks the component instance as default.
     * @dev This function can only be called by the ComponentRegistry contract.
     * @dev The ComponentRegistry function checks that the caller is the instance owner before calling this function.
     * @param _instanceID ID of the component instance.
     */
    function markInstanceAsDefault(uint256 _instanceID) external;

    /**
     * @notice Updates the price of the given component instance.
     * @dev This function can only be called by the ComponentRegistry contract.
     * @dev The ComponentRegistry function checks that the caller is the instance owner before calling this function.
     * @param _instanceID ID of the component instance.
     * @param _newPrice New price of the instance, in TGEN.
     */
    function updateInstancePrice(uint256 _instanceID, uint256 _newPrice) external;
}