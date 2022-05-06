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

    // Max fee of 10%.
    uint256 public constant MAX_PROTOCOL_FEE = 1000; 

    // 5%, denominated in 10000.
    uint256 public protocolFee = 500; 

    IERC20 public immutable TGEN;
    address public immutable xTGEN;
    address public immutable marketplace;

    uint256 public numberOfIndicators;
    uint256 public numberOfComparators;

    // Indicator/comparator address on Tradegen blockchain. => component info.
    mapping(bytes32 => Component) public components;

    // Indicator ID => indicator address on Tradegen blockchain.
    // Starts at index 0.
    mapping(uint256 => bytes32) public indicators;

    // Comparator ID => comparator address on Tradegen blockchain.
    // Starts at index 0.
    mapping(uint256 => bytes32) public comparators;

    // Indicator/comparator index => bool.
    mapping(uint256 => bool) public isDefaultComponent;

    // User address => indicator/comparator index => bool.
    mapping(address => mapping(uint256 => bool)) public hasPurchasedComponent; 

    // Token ID => indicator/comparator address on Tradegen blockchain.
    mapping(uint256 => bytes32) public tokenIDs;

    constructor(address _TGEN, address _xTGEN, address _marketplace) Ownable() {
        require(_TGEN != address(0), "Components: invalid address for TGEN.");
        require(_xTGEN != address(0), "Components: invalid address for xTGEN.");
        require(_marketplace != address(0), "Components: invalid address for marketplace.");

        TGEN = IERC20(_TGEN);
        xTGEN = _xTGEN;
        marketplace = _marketplace;
    }

    /* ========== VIEWS ========== */

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
    function getComponentInfo(uint256 _componentID) external view override returns (bytes32, address, uint256, bool, bool, uint256) {
        Component memory component = components[tokenIDs[_componentID]];

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
        return isDefaultComponent[_indicatorID] || hasPurchasedComponent[_user][_indicatorID];
    }

    /**
     * @dev Returns whether the user has purchased the given comparator.
     * @notice Returns true if the given comparator is a default comparator.
     * @param _user Address of the user.
     * @param _comparatorID ID of the comparator.
     * @return (bool) Whether the user has purchased this comparator.
     */
    function hasPurchasedComparator(address _user, uint256 _comparatorID) public view override returns (bool) {
        return isDefaultComponent[_comparatorID] || hasPurchasedComponent[_user][_comparatorID];
    }

    /**
     * @dev Returns the address of the given indicator on the Tradegen blockchain.
     * @notice Returns empty bytes if the indicator does not exist.
     * @param _indicatorID ID of the indicator.
     * @return (bytes32) Address of the indicator.
     */
    function getIndicatorAddress(uint256 _indicatorID) external view override returns (bytes32) {
        return indicators[_indicatorID];
    }

    /**
     * @dev Returns the address of the given comparator on the Tradegen blockchain.
     * @notice Returns address(0) if the comparator does not exist.
     * @param _comparatorID ID of the comparator.
     * @return (bytes32) Address of the comparator.
     */
    function getComparatorAddress(uint256 _comparatorID) external view override returns (bytes32) {
        return comparators[_comparatorID];
    }

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
    function checkRules(address _user, uint256[] memory _serializedRules) external view override returns (bool) {
        for (uint256 i = 0; i < _serializedRules.length; i++) {
            if (!hasPurchasedComparator(_user, _serializedRules[i] >> 224)) {
                return false;
            }
            if (!hasPurchasedIndicator(_user, (_serializedRules[i] >> 208) & 0xFF)) {
                return false;
            }
            if (!hasPurchasedIndicator(_user, (_serializedRules[i] >> 192) & 0xFF)) {
                return false;
            }
        }
        
        return true;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @dev Purchases an instance of the indicator.
     * @param _indicatorID ID of the indicator.
     */
    function purchaseIndicator(uint256 _indicatorID) external override {
        require(!hasPurchasedIndicator(msg.sender, _indicatorID), "Components: already purchased this indicator.");

        bytes32 indicatorAddress = indicators[_indicatorID];
        // Transfer to xTGEN if NFT is in marketplace escrow.
        address recipient = (components[indicatorAddress].owner == marketplace) ? marketplace : components[indicatorAddress].owner;

        hasPurchasedComponent[msg.sender][_indicatorID] = true;

        TGEN.safeTransferFrom(msg.sender, address(this), components[indicatorAddress].price);
        TGEN.safeTransfer(xTGEN, components[indicatorAddress].price.mul(protocolFee).div(10000));
        TGEN.safeTransfer(recipient, components[indicatorAddress].price.mul(10000 - protocolFee).div(10000));

        emit PurchasedIndicator(msg.sender, _indicatorID);
    }

    /**
     * @dev Purchases an instance of the comparator.
     * @param _comparatorID ID of the comparator.
     */
    function purchaseComparator(uint256 _comparatorID) external override {
        require(!hasPurchasedComparator(msg.sender, _comparatorID), "Components: already purchased this comparator.");

        bytes32 comparatorAddress = indicators[_comparatorID];
        // Transfer to xTGEN if NFT is in marketplace escrow.
        address recipient = (components[comparatorAddress].owner == marketplace) ? marketplace : components[comparatorAddress].owner;

        hasPurchasedComponent[msg.sender][_comparatorID] = true;

        TGEN.safeTransferFrom(msg.sender, address(this), components[comparatorAddress].price);
        TGEN.safeTransfer(xTGEN, components[comparatorAddress].price.mul(protocolFee).div(10000));
        TGEN.safeTransfer(recipient, components[comparatorAddress].price.mul(10000 - protocolFee).div(10000));

        emit PurchasedComparator(msg.sender, _comparatorID);
    }

    /**
     * @dev Marks the indicator as a default indicator.
     * @notice This function can only be called by the indicator's owner.
     * @param _indicatorID ID of the indicator.
     */
    function markIndicatorAsDefault(uint256 _indicatorID) external override {
        bytes32 indicatorAddress = indicators[_indicatorID];

        require(msg.sender == components[indicatorAddress].owner, "Components: only the indicator owner can call this function.");
        require(!isDefaultComponent[_indicatorID], "Components: already marked as default.");

        isDefaultComponent[_indicatorID] = true;
        components[indicatorAddress].isDefault = true;

        emit MarkedIndicatorAsDefault(_indicatorID);
    }

    /**
     * @dev Marks the comparator as a default comparator.
     * @notice This function can only be called by the comparator's owner.
     * @param _comparatorID ID of the comparator.
     */
    function markComparatorAsDefault(uint256 _comparatorID) external override {
        bytes32 comparatorAddress = comparators[_comparatorID];

        require(msg.sender == components[comparatorAddress].owner, "Components: only the comparator owner can call this function.");
        require(!isDefaultComponent[_comparatorID], "Components: already marked as default.");

        isDefaultComponent[_comparatorID] = true;
        components[comparatorAddress].isDefault = true;

        emit MarkedComparatorAsDefault(_comparatorID);
    }

    /**
     * @dev Updates the price of the given indicator.
     * @notice This function can only be called by the indicator's owner.
     * @param _indicatorID ID of the indicator.
     * @param _newPrice New price of the indicator, in TGEN.
     */
    function updateIndicatorPrice(uint256 _indicatorID, uint256 _newPrice) external override {
        bytes32 indicatorAddress = indicators[_indicatorID];

        require(msg.sender == components[indicatorAddress].owner, "Components: only the indicator owner can call this function.");
        require(_newPrice > 0, "Components: price must be greater than 0.");

        isDefaultComponent[components[indicators[_indicatorID]].tokenID] = true;
        components[indicatorAddress].price = _newPrice;

        emit UpdatedIndicatorPrice(_indicatorID, _newPrice);
    }

    /**
     * @dev Updates the price of the given comparator.
     * @notice This function can only be called by the comparator's owner.
     * @param _comparatorID ID of the comparator.
     * @param _newPrice New price of the comparator, in TGEN.
     */
    function updateComparatorPrice(uint256 _comparatorID, uint256 _newPrice) external override {
        bytes32 comparatorAddress = comparators[_comparatorID];

        require(msg.sender == components[comparatorAddress].owner, "Components: only the comparator owner can call this function.");
        require(_newPrice > 0, "Components: price must be greater than 0.");

        isDefaultComponent[components[comparators[_comparatorID]].tokenID] = true;
        components[comparatorAddress].price = _newPrice;

        emit UpdatedComparatorPrice(_comparatorID, _newPrice);
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
        hasPurchasedComponent[to][id] = true;

        _safeTransferFrom(from, to, id, amount, data);
    }

    // Prevent transfer of multiple NFTs in one transaction.
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public override {}

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
     * @dev Publishes the indicator to the platform.
     * @notice Assumes indicator contract is already deployed on Tradegen blockchain.
     * @notice This function can only be called by the deployer of this contract.
     * @notice Assumes the indicator contract has already been deployed and has the same 'isDefault' status.
     * @param _indicator Address of the indicator on the Tradegen blockchain.
     * @param _owner Address of the indicator's owner.
     * @param _isDefault Whether the indicator is a default indicator.
     * @param _price Price (in TGEN) for an instance of this indicator.
     */
    function publishIndicator(bytes32 _indicator, address _owner, bool _isDefault, uint256 _price) external onlyOwner {
        require(_owner != address(0), "Components: invalid address for owner.");
        require(_price >= 0, "Components: price must be positive.");
        require(components[_indicator].owner == address(0), "Components: already published.");

        uint256 tokenID = numberOfComparators.add(numberOfIndicators);

        components[_indicator] = Component({
            componentAddress: _indicator,
            owner: _owner,
            tokenID: tokenID,
            isIndicator: true,
            isDefault: _isDefault,
            price: _price
        });

        hasPurchasedComponent[_owner][tokenID] = true;
        indicators[numberOfIndicators] = _indicator;
        tokenIDs[tokenID] = _indicator;

        if (_isDefault) {
            isDefaultComponent[tokenID] = true;
        }

        _mint(_owner, tokenID, 1, "");
        numberOfIndicators = numberOfIndicators.add(1);

        emit PublishedIndicator(numberOfIndicators.sub(1), _owner, _isDefault, _price, _indicator);
    }

    /**
     * @dev Publishes the comparator to the platform.
     * @notice Assumes comparator contract is already deployed on Tradegen blockchain.
     * @notice This function can only be called by the deployer of this contract.
     * @notice Assumes the comparator contract has already been deployed and has the same 'isDefault' status.
     * @param _comparator Address of the comparator on the Tradegen blockchain.
     * @param _owner Address of the comparator's owner.
     * @param _isDefault Whether the comparator is a default comparator.
     * @param _price Price (in TGEN) for an instance of this comparator.
     */
    function publishComparator(bytes32 _comparator, address _owner, bool _isDefault, uint256 _price) external onlyOwner {
        require(_owner != address(0), "Components: invalid address for owner.");
        require(_price >= 0, "Components: price must be positive.");
        require(components[_comparator].owner == address(0), "Components: already published.");

        uint256 tokenID = numberOfComparators.add(numberOfIndicators);

        components[_comparator] = Component({
            componentAddress: _comparator,
            owner: _owner,
            tokenID: tokenID,
            isIndicator: false,
            isDefault: _isDefault,
            price: _price
        });

        hasPurchasedComponent[_owner][components[_comparator].tokenID] = true;
        comparators[numberOfComparators] = _comparator;
        tokenIDs[tokenID] = _comparator;

        if (_isDefault) {
            isDefaultComponent[tokenID] = true;
        }

        _mint(_owner, tokenID, 1, "");
        numberOfComparators = numberOfComparators.add(1);

        emit PublishedComparator(numberOfComparators.sub(1), _owner, _isDefault, _price, _comparator);
    }

    /**
    * @dev Updates the protocol fee.
    * @notice This function is meant to be called by the contract deployer.
    * @param _newFee The new protocol fee.
    */
    function setProtocolFee(uint256 _newFee) external onlyOwner {
        require(_newFee >= 0, "Components: new fee must be positive.");
        require(_newFee <= MAX_PROTOCOL_FEE, "Components: new fee is too high.");

        protocolFee = _newFee;

        emit UpdatedProtocolFee(_newFee);
    }

    /* ========== EVENTS ========== */

    event PurchasedIndicator(address indexed user, uint256 indicatorID);
    event PurchasedComparator(address indexed user, uint256 comparatorID);
    event PublishedIndicator(uint256 indicatorID, address owner, bool isDefault, uint256 price, bytes32 indicatorAddress);
    event PublishedComparator(uint256 comparatorID, address owner, bool isDefault, uint256 price, bytes32 comparatorAddress);
    event MarkedIndicatorAsDefault(uint256 indicatorID);
    event MarkedComparatorAsDefault(uint256 comparatorID);
    event UpdatedIndicatorPrice(uint256 indicatorID, uint256 newPrice);
    event UpdatedComparatorPrice(uint256 comparatorID, uint256 newPrice);
    event UpdatedProtocolFee(uint256 newFee);
}