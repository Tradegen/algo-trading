// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IComponents {
    // Views

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
     * @dev Returns the address of the given indicator.
     * @notice Returns address(0) if the indicator does not exist.
     * @param _indicatorID ID of the indicator.
     * @return (address) Address of the indicator.
     */
    function getIndicatorAddress(uint256 _indicatorID) external view returns (address);

    /**
     * @dev Returns the address of the given comparator.
     * @notice Returns address(0) if the comparator does not exist.
     * @param _comparatorID ID of the comparator.
     * @return (address) Address of the comparator.
     */
    function getComparatorAddress(uint256 _comparatorID) external view returns (address);

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
}