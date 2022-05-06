// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "./openzeppelin-solidity/contracts/ERC1155/ERC1155.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Interfaces.
import './interfaces/IComponentInstances.sol';

// Inheritance.
import './interfaces/IComponents.sol';

contract Components is IComponents, ERC1155, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public immutable componentRegistry;
    IERC20 public immutable feeToken;

    // Total number of components that have been created.
    // When a component is created, the component's ID is [numberOfComponents] at the time.
    // This ensures that component IDs are strictly increasing.
    uint256 public numberOfComponents;

    // (component ID => component info).
    mapping(uint256 => Component) public components;

    // (component ID => address of the component's ComponentInstances contract).
    mapping(uint256 => address) public override componentInstance;

    constructor(address _componentRegistry, address _feeToken) {
        require(_componentRegistry != address(0), "Components: Invalid address for _componentRegistry.");
        require(_feeToken != address(0), "Components: Invalid address for _feeToken.");

        componentRegistry = _componentRegistry;
        feeToken = IERC20(_feeToken);
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Given the ID of a component, returns the component's info.
     * @param _componentID ID of the component.
     * @return (address, address, uint256, uint256) Address of the component owner,
     *                                              address of the component's contract.
     *                                              token ID of the component,
     *                                              and component's instance creation fee.
     */
    function getComponentInfo(uint256 _componentID) external view override returns (address, address, uint256, uint256) {
        // Gas savings.
        Component memory component = components[_componentID];

        return (component.owner, component.contractAddress, component.tokenID, component.instanceCreationFee);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Mints an NFT for the given component.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _contractAddress Address of the component's contract.
    * @param _owner Address of the component's owner.
    * @param _fee The fee, in TGEN, to create an instance of the component.
    * @return uint256 The token ID of the minted component.
    */
    function createComponent(address _contractAddress, address _owner, uint256 _fee) external override onlyComponentRegistry returns (uint256) {
        uint256 tokenID = numberOfComponents.add(1);

        numberOfComponents = numberOfComponents.add(1);
        components[tokenID] = Component({
            owner: _owner,
            contractAddress: _contractAddress,
            tokenID: tokenID,
            instanceCreationFee: _fee
        });

        // Create the NFT and transfer it to _owner.
        _mint(_owner, tokenID, 1, "");

        emit CreatedComponent(tokenID, _owner, _fee);

        return tokenID;
    }

    /**
    * @notice Sets the address of the given component's ComponentInstances contract.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @dev This function is meant to be called after calling createComponent() within the same transaction.
    * @param _componentID ID of the component.
    * @param _instancesAddress Address of the component's ComponentInstances contract.
    */
    function setComponentInstancesAddress(uint256 _componentID, address _instancesAddress) external override onlyComponentRegistry {
        require(componentInstance[_componentID] == address(0), "Components: Already have a ComponentInstances contract for this component.");

        componentInstance[_componentID] = _instancesAddress;

        emit SetComponentInstance(_componentID, _instancesAddress);
    }

    /**
     * @notice Updates the fee of the given component.
     * @dev This function can only be called by the ComponentRegistry contract.
     * @dev The ComponentRegistry function checks that the caller is the component owner before calling this function.
     * @param _componentID ID of the component.
     * @param _newFee The fee, in TGEN, to create an instance of the component.
     */
    function updateComponentFee(uint256 _componentID, uint256 _newFee) external override onlyComponentRegistry {
        components[_componentID].instanceCreationFee = _newFee;

        emit UpdatedComponentFee(_componentID, _newFee);
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
            "Components: Caller is not owner nor approved."
        );
        require(amount == 1, "Components: Amount must be 1.");
        require(from == components[id].owner, "Components: Only the NFT owner can transfer.");

        // Update ownership data.
        components[id].owner = to;

        _safeTransferFrom(from, to, id, amount, data);
    }

    // Prevent transfer of multiple NFTs in one transaction.
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public override {}

    /* ========== MODIFIERS ========== */

    modifier onlyComponentRegistry() {
        require(componentRegistry == msg.sender,
                "Components: Only the ComponentRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedComponent(uint256 tokenID, address owner, uint256 instanceCreationFee);
    event UpdatedComponentFee(uint256 componentID, uint256 newFee);
    event SetComponentInstance(uint256 componentID, address componentInstances);
}