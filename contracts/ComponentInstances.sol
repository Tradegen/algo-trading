// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "./openzeppelin-solidity/contracts/ERC1155/ERC1155.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Interfaces.
import './interfaces/IComponent.sol';

// Inheritance.
import './interfaces/IComponentInstances.sol';

contract ComponentInstances is IComponentInstances, ERC1155, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public immutable componentRegistry;
    IERC20 public immutable feeToken;
    address public immutable override component;

    // Total number of instances that have been created.
    // When an instance is created, the instance's ID is [numberOfInstances] at the time.
    // This ensures that instance IDs are strictly increasing.
    uint256 public numberOfInstances;

    // (instance ID => instance info).
    mapping(uint256 => ComponentInstance) public instances;

    // (user address => instance ID => whether the user has purchased the instance).
    mapping(address => mapping(uint256 => bool)) public purchasedInstance; 

    constructor(address _componentRegistry, address _feeToken, address _component) {
        require(_componentRegistry != address(0), "ComponentInstances: Invalid address for _componentRegistry.");
        require(_feeToken != address(0), "ComponentInstances: Invalid address for _feeToken.");
        require(_component != address(0), "ComponentInstances: Invalid address for _component.");

        componentRegistry = _componentRegistry;
        feeToken = IERC20(_feeToken);
        component = _component;
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
    function getComponentInstanceInfo(uint256 _instanceID) external view override returns (address, uint256, bool, uint256) {
        // Gas savings.
        ComponentInstance memory instance = instances[_instanceID];

        return (instance.owner, instance.tokenID, instance.isDefault, instance.price);
    }

    /**
     * @notice Returns whether the user has purchased the given component instance.
     * @dev Returns true if the given instance is a default instance.
     * @param _user Address of the user.
     * @param _instanceID ID of the component instance.
     * @return (bool) Whether the user has purchased this component instance.
     */
    function hasPurchasedInstance(address _user, uint256 _instanceID) external view override returns (bool) {
        return purchasedInstance[_user][_instanceID] || instances[_instanceID].isDefault;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Mints an NFT for the given component instance.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _owner Address of the instance's owner.
    * @param _price The price, in TGEN, to use the instance.
    * @param _isDefault Whether the instance is default.
    */
    function createInstance(address _owner, uint256 _price, bool _isDefault) external override onlyComponentRegistry {
        uint256 tokenID = numberOfInstances.add(1);

        numberOfInstances = numberOfInstances.add(1);
        purchasedInstance[_owner][tokenID] = true;
        instances[tokenID] = ComponentInstance({
            owner: _owner,
            tokenID: tokenID,
            isDefault: _isDefault,
            price: _price
        });

        // Create the NFT and transfer it to _owner.
        _mint(_owner, tokenID, 1, "");

        // Gas savings.
        uint256 fee = IComponent(component).instanceCreationFee();
        address componentOwner = IComponent(component).componentOwner();

        // Transfer the creation fee to the component owner.
        feeToken.safeTransferFrom(msg.sender, address(this), fee);
        feeToken.safeTransfer(componentOwner, fee);

        emit CreatedInstance(tokenID, _owner, fee, componentOwner, _price, _isDefault);
    }

    /**
     * @notice Purchases the given component instance.
     * @dev Purchasing an instance allows the user to integrate it into trading bots.
     * @dev The user does not receive the instance NFT, only the right to use the instance in a trading bot.
     * @dev Transaction will revert if the instance is not active (has not been updated regularly).
     * @dev This function can only be called by the ComponentRegistry contract.
     * @param _user Address of the user.
     * @param _instanceID ID of the component instance.
     */
    function purchaseComponentInstance(address _user, uint256 _instanceID) external override onlyComponentRegistry nonReentrant {
        // Gas savings.
        ComponentInstance memory instance = instances[_instanceID];

        purchasedInstance[_user][_instanceID] = true;

        // Transfer the fee to the instance owner.
        feeToken.safeTransferFrom(msg.sender, address(this), instance.price);
        feeToken.safeTransfer(instance.owner, instance.price);

        emit PurchasedInstance(_user, _instanceID, instance.price);
    }

    /**
     * @notice Marks the component instance as default.
     * @dev This function can only be called by the ComponentRegistry contract.
     * @dev The ComponentRegistry function checks that the caller is the instance owner before calling this function.
     * @param _instanceID ID of the component instance.
     */
    function markInstanceAsDefault(uint256 _instanceID) external override onlyComponentRegistry {
        instances[_instanceID].isDefault = true;

        emit MarkedInstanceAsDefault(_instanceID);
    }

    /**
     * @notice Updates the price of the given component instance.
     * @dev This function can only be called by the ComponentRegistry contract.
     * @dev The ComponentRegistry function checks that the caller is the instance owner before calling this function.
     * @param _instanceID ID of the component instance.
     * @param _newPrice New price of the instance, in TGEN.
     */
    function updateInstancePrice(uint256 _instanceID, uint256 _newPrice) external override onlyComponentRegistry {
        instances[_instanceID].price = _newPrice;

        emit UpdatedInstancePrice(_instanceID, _newPrice);
    }

    /**
    * @notice Transfers tokens from seller to buyer.
    * @param from Address of the seller.
    * @param to Address of the buyer.
    * @param id The token ID of the indicator/comparator.
    * @param amount Number of tokens to transfer for the given ID. Expected to equal 1.
    * @param data Bytes data.
    */
    function safeTransferFrom(address from, address to, uint id, uint amount, bytes memory data) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ComponentInstances: Caller is not owner nor approved."
        );
        require(amount == 1, "ComponentInstances: Amount must be 1.");
        require(from == instances[id].owner, "ComponentInstances: Only the NFT owner can transfer.");

        // Update ownership data.
        instances[id].owner = to;
        purchasedInstance[to][id] = true;

        _safeTransferFrom(from, to, id, amount, data);
    }

    // Prevent transfer of multiple NFTs in one transaction.
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public override {}

    /* ========== MODIFIERS ========== */

    modifier onlyComponentRegistry() {
        require(componentRegistry == msg.sender,
                "ComponentInstances: Only the ComponentRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedInstance(uint256 tokenID, address owner, uint256 creationFee, address feeRecipient, uint256 price, bool isDefault);
    event PurchasedInstance(address user, uint256 instanceID, uint256 price);
    event MarkedInstanceAsDefault(uint256 instanceID);
    event UpdatedInstancePrice(uint256 instanceID, uint256 newPrice);
    event UpdatedComponentOwner(address newOwner);
}