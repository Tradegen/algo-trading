// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponentsRegistry {

    /* ========== VIEWS ========== */

    /**
     * @notice Given the ID of a component, returns the component's info.
     * @param _componentID ID of the component.
     * @return (address, address, bool, uint256, uint256, string) Address of the component owner,
     *                                                            address of the component's contract,
     *                                                            whether the component is an indicator,
     *                                                            token ID of the component,
     *                                                            component's instance creation fee,
     *                                                            and the name of the component.
     */
    function getComponentInfo(uint256 _componentID) external view returns (address, bool, address, uint256, uint256, string memory);

    /**
     * @notice Given the ID of an instance, returns the component instance's info.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @return (address, uint256, bool, uint256) Address of the instance owner,
     *                                           token ID of the instance,
     *                                           whether the component instance is default,
     *                                           and price of the component instance.
     */
    function getComponentInstanceInfo(uint256 _componentID, uint256 _instanceID) external view returns (address, uint256, bool, uint256);

    /**
     * @notice Returns whether the instance of the given component is active.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @return bool Whether the instance is active.
     */
    function getComponentInstanceStatus(uint256 _componentID, uint256 _instanceID) external view returns (bool);

    /**
    * @notice Checks indicator/comparator info when creating a new upkeep.
    * @dev This function is meant to be called by the KeeperRegistry contract.
    * @dev Checks if _owner owns the given instance, target is a valid indicator/comparator, and there's no existing keeper for the given instance.
    * @param _owner Address of the owner to check.
    * @param _isIndicator Whether the component is an indicator.
    * @param _target Address of the indicator/comparator.
    * @param _instanceID The instance ID of the indicator/comparator.
    * @return bool Whether the upkeep can be created.
    */
    function checkInfoForUpkeep(address _owner, bool _isIndicator, address _target, uint256 _instanceID) external view returns (bool);

    /**
    * @notice Returns the state of the given indicator instance.
    * @dev Returns 0 for each value if the instance is out of bounds.
    * @param _componentID ID of the component.
    * @param _instance Instance number of this indicator.
    * @return (string, address, uint256, uint256, uint256[])  Asset symbol,
    *                                                         timeframe of the asset (in minutes),
    *                                                         the current value of the given instance,
    *                                                         an array of params for the given instance,
    *                                                         an array of variables for the given instance,
    *                                                         the history of the given instance.
    */
    function getIndicatorState(uint256 _componentID, uint256 _instance) external view returns (string memory, uint256, uint256, uint256[] memory, uint256[] memory, uint256[] memory);

    /**
    * @notice Returns the state of the given comparator instance.
    * @dev Returns 0 for each value if the instance is out of bounds.
    * @param _componentID ID of the component.
    * @param _instance Instance number of this comparator.
    * @return (address, address, uint256, uint256, uint256[]) Address of the first indicator,
    *                                                         address of the second indicator,
    *                                                         the first indicator instance,
    *                                                         the second indicator instance,
    *                                                         and an array of variables for the comparator.
    */
    function getComparatorState(uint256 _componentID, uint256 _instance) external view returns (address, address, uint256, uint256, uint256[] memory); 

    /**
     * @notice Returns whether the user has purchased the given instance of the component.
     * @param _user Address of the user.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @return bool Whether the user has purchased the given instance of the component.
     */
    function hasPurchasedComponentInstance(address _user, uint256 _componentID, uint256 _instanceID) external view returns (bool);

    /**
     * @notice Returns whether the user has purchased each instance.
     * @dev Returns false if _componentIDs and _instanceIDs have different length.
     * @param _user Address of the user.
     * @param _componentIDs IDs of the components.
     * @param _instanceIDs IDs of the component instances.
     * @return bool Whether the user has purchased each instance.
     */
    function checkRules(address _user, uint256[] memory _componentIDs, uint256[] memory _instanceIDs) external view returns (bool);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Creates an instance of the given indicator.
    * @param _price The price, in TGEN, to use the instance.
    * @param _isDefault Whether the instance is default.
    * @param _componentID ID of the component.
    * @param _asset Symbol of the asset.
    * @param _assetTimeframe Timeframe (in minutes) of the asset's data feed.
    * @param _indicatorTimeframe Timeframe (in minutes) of the indicator instance.
    * @param _params An array of parameters.
    */
    function createIndicatorInstance(uint256 _price, bool _isDefault, uint256 _componentID, string memory _asset, uint256 _assetTimeframe, uint256 _indicatorTimeframe, uint256[] memory _params) external;

    /**
    * @notice Creates an instance of the given comparator.
    * @param _price The price, in TGEN, to use the instance.
    * @param _isDefault Whether the instance is default.
    * @param _componentID ID of the component.
    * @param _firstIndicatorID ID of the first indicator.
    * @param _secondIndicatorID ID of the second indicator.
    * @param _firstIndicatorInstanceID ID of the first indicator's instance.
    * @param _secondIndicatorInstanceID ID of the second indicator's instance.
    */
    function createComparatorInstance(uint256 _price, bool _isDefault, uint256 _componentID, uint256 _firstIndicatorID, uint256 _secondIndicatorID, uint256 _firstIndicatorInstanceID, uint256 _secondIndicatorInstanceID) external;

    /**
     * @notice Marks the component instance as default.
     * @dev Only the component's owner can call this function.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     */
    function markComponentInstanceAsDefault(uint256 _componentID, uint256 _instanceID) external;

    /**
     * @notice Updates the fee of the given component.
     * @dev Only the component's owner can call this function.
     * @param _componentID ID of the component.
     * @param _newFee The fee, in TGEN, to create an instance of the component.
     */
    function updateComponentFee(uint256 _componentID, uint256 _newFee) external;

    /**
     * @notice Updates the price of the given component instance.
     * @dev Only the component instance's owner can call this function.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @param _newPrice New price of the instance, in TGEN.
     */
    function updateComponentInstancePrice(uint256 _componentID, uint256 _instanceID, uint256 _newPrice) external;

    /**
     * @notice Purchases the given component instance.
     * @dev Purchasing an instance allows the user to integrate it into trading bots.
     * @dev The user does not receive the instance NFT, only the right to use the instance in a trading bot.
     * @dev Transaction will revert if the instance is not active (has not been updated regularly).
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     */
    function purchaseComponentInstance(uint256 _componentID, uint256 _instanceID) external;

    /**
     * @notice Publishes a component to the platform.
     * @dev This function can only be called by the operator.
     * @dev Assumes that the component's contract (separate from the NFT) has already been deployed.
     * @param _contractAddress Address of the indicator/comparator.
     * @param _isIndicator Whether the component is an indicator.
     * @param _componentOwner The user who created the indicator/comparator contract.
     * @param _fee Fee, in TGEN, for creating instances of the component.
     */
    function publishComponent(address _contractAddress, bool _isIndicator, address _componentOwner, uint256 _fee) external;
}