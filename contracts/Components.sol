// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ERC1155/ERC1155.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Interfaces
import './interfaces/IIndicator.sol';
import './interfaces/IComparator.sol';

// Inheritance
import './interfaces/IComponents.sol';

contract Components is IComponents, ERC1155, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public constant PROTOCOL_FEE = 500; // 5%, denominated in 10000.

    IERC20 public immutable TGEN;
    address public immutable xTGEN;

    uint256 numberOfIndicators;
    uint256 numberOfComparators;

    // Indicator/comparator address => component info.
    mapping(address => Component) public components;

    // Indicator ID => indicator address.
    // Starts at index 0.
    mapping(uint256 => address) public indicators;

    // Comparator ID => comparator address.
    // Starts at index 0.
    mapping(uint256 => address) public comparators;

    // Indicator/comparator address => bool.
    mapping(address => bool) public isDefaultComponent;

    // User address => indicator/comparator address => bool.
    mapping(address => mapping(address => bool)) public hasPurchasedComponent; 

    // Token ID => indicator/comparator address.
    mapping(uint256 => address) public tokenIDs;

    constructor(address _TGEN, address _xTGEN) Ownable() {
        require(_TGEN != address(0), "Components: invalid address for TGEN.");
        require(_xTGEN != address(0), "Components: invalid address for xTGEN.");

        TGEN = IERC20(_TGEN);
        xTGEN = _xTGEN;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev Given the address of a component, returns the component's info.
     * @param _component Address of the indicator/comparator.
     * @return (address, address, uint256, bool, bool, uint256) Address of the indicator/comparator,
     *                                                          address of the owner,
     *                                                          token ID,
     *                                                          whether the component is an indicator,
     *                                                          whether the indicator/comparator is default,
     *                                                          and price of the indicator/comparator.
     */
    function getComponentInfo(address _component) external view override returns (address, address, uint256, bool, bool, uint256) {
        Component memory component = components[_component];

        return (component.componentAddress, component.owner, component.tokenID, component.isIndicator, component.isDefault, component.price);
    }

    /**
     * @dev Returns whether the user has purchased the given indicator.
     * @notice Returns true if the given indicator is a default indicator.
     * @param _user Address of the user.
     * @param _indicatorID ID of the indicator.
     * @return (bool) Whether the user has purchased this indicator.
     */
    function hasPurchasedIndicator(address _user, uint256 _indicatorID) public view override returns (bool) {
        return isDefaultComponent[indicators[_indicatorID]] || hasPurchasedComponent[_user][indicators[_indicatorID]];
    }

    /**
     * @dev Returns whether the user has purchased the given comparator.
     * @notice Returns true if the given comparator is a default comparator.
     * @param _user Address of the user.
     * @param _comparatorID ID of the comparator.
     * @return (bool) Whether the user has purchased this comparator.
     */
    function hasPurchasedComparator(address _user, uint256 _comparatorID) public view override returns (bool) {
        return isDefaultComponent[comparators[_comparatorID]] || hasPurchasedComponent[_user][comparators[_comparatorID]];
    }

    /**
     * @dev Returns the address of the given indicator.
     * @notice Returns address(0) if the indicator does not exist.
     * @param _indicatorID ID of the indicator.
     * @return (address) Address of the indicator.
     */
    function getIndicatorAddress(uint256 _indicatorID) external view override returns (address) {
        return indicators[_indicatorID];
    }

    /**
     * @dev Returns the address of the given comparator.
     * @notice Returns address(0) if the comparator does not exist.
     * @param _comparatorID ID of the comparator.
     * @return (address) Address of the comparator.
     */
    function getComparatorAddress(uint256 _comparatorID) external view override returns (address) {
        return comparators[_comparatorID];
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @dev Purchases an instance of the indicator.
     * @param _indicatorID ID of the indicator.
     */
    function purchaseIndicator(uint256 _indicatorID) external override {
        require(!hasPurchasedIndicator(msg.sender, _indicatorID), "Components: already purchased this indicator.");

        address indicatorAddress = indicators[_indicatorID];

        hasPurchasedComponent[msg.sender][indicatorAddress] = true;

        TGEN.safeTransferFrom(msg.sender, address(this), components[indicatorAddress].price);
        TGEN.safeTransfer(xTGEN, components[indicatorAddress].price.mul(PROTOCOL_FEE).div(10000));
        TGEN.safeTransfer(components[indicatorAddress].owner, components[indicatorAddress].price.mul(10000 - PROTOCOL_FEE).div(10000));

        IIndicator(indicatorAddress).registerUser(msg.sender);

        emit PurchasedIndicator(msg.sender, indicatorAddress);
    }

    /**
     * @dev Purchases an instance of the comparator.
     * @param _comparatorID ID of the comparator.
     */
    function purchaseComparator(uint256 _comparatorID) external override {
        require(!hasPurchasedComparator(msg.sender, _comparatorID), "Components: already purchased this comparator.");

        address comparatorAddress = indicators[_comparatorID];

        hasPurchasedComponent[msg.sender][comparatorAddress] = true;

        TGEN.safeTransferFrom(msg.sender, address(this), components[comparatorAddress].price);
        TGEN.safeTransfer(xTGEN, components[comparatorAddress].price.mul(PROTOCOL_FEE).div(10000));
        TGEN.safeTransfer(components[comparatorAddress].owner, components[comparatorAddress].price.mul(10000 - PROTOCOL_FEE).div(10000));

        IComparator(comparatorAddress).registerUser(msg.sender);

        emit PurchasedComparator(msg.sender, comparatorAddress);
    }

    /**
     * @dev Marks the indicator as a default indicator.
     * @notice This function can only be called by the indicator's owner.
     * @param _indicatorID ID of the indicator.
     */
    function markIndicatorAsDefault(uint256 _indicatorID) external override {
        address indicatorAddress = indicators[_indicatorID];

        require(msg.sender == components[indicatorAddress].owner, "Components: only the indicator owner can call this function.");
        require(!isDefaultComponent[indicatorAddress], "Components: already marked as default.");

        isDefaultComponent[indicatorAddress] = true;
        components[indicatorAddress].isDefault = true;

        IIndicator(indicatorAddress).markAsDefault();

        emit MarkedIndicatorAsDefault(indicatorAddress);
    }

    /**
     * @dev Marks the comparator as a default comparator.
     * @notice This function can only be called by the comparator's owner.
     * @param _comparatorID ID of the comparator.
     */
    function markComparatorAsDefault(uint256 _comparatorID) external override {
        address comparatorAddress = comparators[_comparatorID];

        require(msg.sender == components[comparatorAddress].owner, "Components: only the comparator owner can call this function.");
        require(!isDefaultComponent[comparatorAddress], "Components: already marked as default.");

        isDefaultComponent[comparatorAddress] = true;
        components[comparatorAddress].isDefault = true;

        IComparator(comparatorAddress).markAsDefault();

        emit MarkedComparatorAsDefault(comparatorAddress);
    }

    /**
    * @dev Transfers tokens from seller to buyer.
    * @param from Address of the seller.
    * @param to Address of the buyer.
    * @param id The token ID of the indicator/comparator.
    * @param amount Number of tokens to transfer for the given ID. Expected to equal 1.
    * @param data Bytes data.
    */
    function safeTransferFrom(address from, address to, uint id, uint amount, bytes memory data) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "Components: caller is not owner nor approved."
        );
        require(amount == 1, "Components: amount must be 1.");
        require(from == components[tokenIDs[id]].owner, "Components: only the NFT owner can transfer.");

        // Update ownership data.
        components[tokenIDs[id]].owner = to;
        hasPurchasedComponent[to][tokenIDs[id]] = true;

        _safeTransferFrom(from, to, id, amount, data);
    }

    // Prevent transfer of multiple NFTs in one transaction.
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public override {}

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
     * @dev Publishes the indicator to the platform.
     * @notice This function can only be called by the deployer of this contract.
     * @notice Assumes the indicator contract has already been deployed and has the same 'isDefault' status.
     * @param _indicator Address of the indicator.
     * @param _owner Address of the indicator's owner.
     * @param _isDefault Whether the indicator is a default indicator.
     * @param _price Price (in TGEN) for an instance of this indicator.
     */
    function publishIndicator(address _indicator, address _owner, bool _isDefault, uint256 _price) external onlyOwner {
        require(_indicator != address(0), "Components: invalid address for indicator.");
        require(_owner != address(0), "Components: invalid address for owner.");
        require(_price >= 0, "Components: price must be positive.");

        if (_isDefault) {
            isDefaultComponent[_indicator] = true;
        }

        hasPurchasedComponent[_owner][_indicator] = true;
        indicators[numberOfIndicators] = _indicator;
        tokenIDs[numberOfIndicators.add(numberOfComparators)] = _indicator;
        components[_indicator] = Component({
            componentAddress: _indicator,
            owner: _owner,
            tokenID: numberOfIndicators.add(numberOfComparators),
            isIndicator: true,
            isDefault: _isDefault,
            price: _price
        });

        _mint(_owner, numberOfIndicators.add(numberOfComparators), 1, "");
        numberOfIndicators = numberOfIndicators.add(1);

        emit PublishedIndicator(_indicator, _owner, _isDefault, _price);
    }

    function publishComparator(address _comparator, address _owner, bool _isDefault, uint256 _price) external onlyOwner {
        require(_comparator != address(0), "Components: invalid address for comparator.");
        require(_owner != address(0), "Components: invalid address for owner.");
        require(_price >= 0, "Components: price must be positive.");

        if (_isDefault) {
            isDefaultComponent[_comparator] = true;
        }

        hasPurchasedComponent[_owner][_comparator] = true;
        comparators[numberOfComparators] = _comparator;
        tokenIDs[numberOfComparators.add(numberOfIndicators)] = _comparator;
        components[_comparator] = Component({
            componentAddress: _comparator,
            owner: _owner,
            tokenID: numberOfComparators.add(numberOfIndicators),
            isIndicator: false,
            isDefault: _isDefault,
            price: _price
        });

        _mint(_owner, numberOfComparators.add(numberOfIndicators), 1, "");
        numberOfComparators = numberOfComparators.add(1);

        emit PublishedComparator(_comparator, _owner, _isDefault, _price);
    }

    /* ========== EVENTS ========== */

    event PurchasedIndicator(address indexed user, address indicator);
    event PurchasedComparator(address indexed user, address comparator);
    event PublishedIndicator(address indicator, address owner, bool isDefault, uint256 price);
    event PublishedComparator(address comparator, address owner, bool isDefault, uint256 price);
    event MarkedIndicatorAsDefault(address indicator);
    event MarkedComparatorAsDefault(address comparator);
}