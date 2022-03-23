// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponents {

    struct Component {
        bytes32 componentAddress; // Address of indicator/comparator on Tradegen blockchain.
        address owner;
        uint256 tokenID;
        bool isIndicator;
        bool isDefault;
        uint256 price;
    }

    // Views

    /**
     * @dev Given the ID of a component, returns the component's info.
     * @param _componentID ID of the indicator/comparator.
     * @return (address, address, uint256, bool, bool, uint256) Address of the indicator/comparator on Tradegen blockchain,
     *                                                          address of the owner,
     *                                                          token ID,
     *                                                          whether the component is an indicator,
     *                                                          whether the indicator/comparator is default,
     *                                                          and price of the indicator/comparator.
     */
    function getComponentInfo(uint256 _componentID) external view returns (bytes32, address, uint256, bool, bool, uint256);

    /**
     * @dev Returns whether the user has purchased the given indicator.
     * @notice Returns true if the given indicator is a default indicator.
     * @param _user Address of the user.
     * @param _indicatorID ID of the indicator.
     * @return (bool) Whether the user has purchased this indicator.
     */
    function hasPurchasedIndicator(address _user, uint256 _indicatorID) external view returns (bool);

    /**
     * @dev Returns whether the user has purchased the given comparator.
     * @notice Returns true if the given comparator is a default comparator.
     * @param _user Address of the user.
     * @param _comparatorID ID of the comparator.
     * @return (bool) Whether the user has purchased this comparator.
     */
    function hasPurchasedComparator(address _user, uint256 _comparatorID) external view returns (bool);

    /**
     * @dev Returns the address of the given indicator on the Tradegen blockchain.
     * @notice Returns empty bytes if the indicator does not exist.
     * @param _indicatorID ID of the indicator.
     * @return (bytes32) Address of the indicator.
     */
    function getIndicatorAddress(uint256 _indicatorID) external view returns (bytes32);

    /**
     * @dev Returns the address of the given comparator on the Tradegen blockchain.
     * @notice Returns address(0) if the comparator does not exist.
     * @param _comparatorID ID of the comparator.
     * @return (bytes32) Address of the comparator.
     */
    function getComparatorAddress(uint256 _comparatorID) external view returns (bytes32);

    /**
     * @dev Checks whether the given user purchased each indicator/comparator used in the given array of serialized rules.
     * @notice Bits 0-15: empty (expected to be 0's).
    *         Bits 16-31: Comparator ID.
    *         Bits 32-47: First indicator ID.
    *         Bits 48-63: Second indicator ID.
    *         Bits 64-159: First indicator params; serialized array of 6 elements, 16 bits each.
    *         Bits 160-255: Second indicator params; serialized array of 6 elements, 16 bits each.
     * @param _user Address of the user.
     * @param _serializedRules Array of entry/exit rules, with the info for each rule serialized as a uint256.
     * @return (bool) Whether the user purchased each indicator/comparator used.
     */
    function checkRules(address _user, uint256[] memory _serializedRules) external view returns (bool);

    // Mutative

    /**
     * @dev Purchases an instance of the indicator.
     * @param _indicatorID ID of the indicator.
     */
    function purchaseIndicator(uint256 _indicatorID) external;

    /**
     * @dev Purchases an instance of the comparator.
     * @param _comparatorID ID of the comparator.
     */
    function purchaseComparator(uint256 _comparatorID) external;

    /**
     * @dev Marks the indicator as a default indicator.
     * @notice This function can only be called by the indicator's owner.
     * @param _indicatorID ID of the indicator.
     */
    function markIndicatorAsDefault(uint256 _indicatorID) external;

    /**
     * @dev Marks the comparator as a default comparator.
     * @notice This function can only be called by the comparator's owner.
     * @param _comparatorID ID of the comparator.
     */
    function markComparatorAsDefault(uint256 _comparatorID) external;

    /**
     * @dev Updates the price of the given indicator.
     * @notice This function can only be called by the indicator's owner.
     * @param _indicatorID ID of the indicator.
     * @param _newPrice New price of the indicator, in TGEN.
     */
    function updateIndicatorPrice(uint256 _indicatorID, uint256 _newPrice) external;

    /**
     * @dev Updates the price of the given comparator.
     * @notice This function can only be called by the comparator's owner.
     * @param _comparatorID ID of the comparator.
     * @param _newPrice New price of the comparator, in TGEN.
     */
    function updateComparatorPrice(uint256 _comparatorID, uint256 _newPrice) external;
}