// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Interfaces.
import './interfaces/IIndicator.sol';
import './interfaces/IComparator.sol';
import './interfaces/external/ICandlestickDataFeedRegistry.sol';
import './interfaces/IComponentInstancesFactory.sol';
import './interfaces/IComponentInstances.sol';
import './interfaces/IComponents.sol';
import './interfaces/IComponent.sol';

// Inheritance.
import './interfaces/IComponentsRegistry.sol';

contract ComponentsRegistry is IComponentsRegistry, IComponent, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Measured in minutes.
    uint256 public constant MAXIMUM_INSTANCE_TIMEFRAME = 1440;

    IERC20 public immutable feeToken;
    ICandlestickDataFeedRegistry public immutable candlestickDataFeedRegistry;
    IComponentInstancesFactory public componentInstancesFactory;
    IComponents public componentsFactory;

    bool public isInitialized;

    // (address of indicator/comparator contract => component ID).
    mapping (address => uint256) public components;

    constructor(address _feeToken, address _candlestickDataFeedRegistry) {
        require(_candlestickDataFeedRegistry != address(0), "ComponentsRegistry: Invalid address for _candlestickDataFeedRegistry.");
        require(_feeToken != address(0), "ComponentsRegistry: Invalid address for _feeToken.");

        candlestickDataFeedRegistry = ICandlestickDataFeedRegistry(_candlestickDataFeedRegistry);
        feeToken = IERC20(_feeToken);
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Returns the address of this component's owner.
     * @dev Fees are paid to the component owner whenever a user creates an instance.
     * @param _componentID ID of the component.
     * @return (address) Address of the component's owner.
     */
    function componentOwner(uint256 _componentID) public view override returns (address) {
        (address owner,,,,) = componentsFactory.getComponentInfo(_componentID);

        return owner;
    }

    /**
     * @notice Returns whether the instance of the given comparator meets conditions.
     * @param _comparatorID ID of the comparator.
     * @param _instanceID ID of the comparator instance.
     * @return bool Whether the latest update of the comparator's instance meets conditions.
     */
    function meetsConditions(uint256 _comparatorID, uint256 _instanceID) external view override returns (bool) {
        (,, address contractAddress,,) = componentsFactory.getComponentInfo(_comparatorID);

        return IComparator(contractAddress).meetsConditions(_instanceID);
    }

    /**
     * @notice Returns the fee for creating an instance of this component.
     * @param _componentID ID of the component.
     * @return (uint256) The fee for creating an instance of this component.
     */
    function instanceCreationFee(uint256 _componentID) external view override returns (uint256) {
        (,,,,uint256 fee) = componentsFactory.getComponentInfo(_componentID);

        return fee;
    }

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
    function getComponentInfo(uint256 _componentID) public view override returns (address, bool, address, uint256, uint256, string memory) {
        (address owner, bool isIndicator, address contractAddress,, uint256 fee) = componentsFactory.getComponentInfo(_componentID);

        string memory name = isIndicator ? IIndicator(contractAddress).getName() : IComparator(contractAddress).getName();

        return (owner, isIndicator, contractAddress, _componentID, fee, name);
    }

    /**
     * @notice Given the ID of an instance, returns the component instance's info.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @return (address, uint256, bool, uint256) Address of the instance owner,
     *                                           token ID of the instance,
     *                                           whether the component instance is default,
     *                                           and price of the component instance.
     */
    function getComponentInstanceInfo(uint256 _componentID, uint256 _instanceID) public view override returns (address, uint256, bool, uint256) {
        address instanceAddress = componentsFactory.componentInstance(_componentID);

        return IComponentInstances(instanceAddress).getComponentInstanceInfo(_instanceID);
    }

    /**
     * @notice Returns whether the instance of the given component is active.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @return bool Whether the instance is active.
     */
    function getComponentInstanceStatus(uint256 _componentID, uint256 _instanceID) external view override returns (bool) {
        (, bool isIndicator, address contractAddress,,) = componentsFactory.getComponentInfo(_componentID);

        return isIndicator ? IIndicator(contractAddress).isActive(_instanceID) : IComparator(contractAddress).isActive(_instanceID);
    }

    /**
    * @notice Checks indicator/comparator info when creating a new upkeep.
    * @dev This function is meant to be called by the KeeperRegistry contract.
    * @dev Checks if _owner owns the given instance, target is a valid indicator/comparator, and the component instance is valid.
    * @param _owner Address of the owner to check.
    * @param _isIndicator Whether the component is an indicator.
    * @param _target Address of the indicator/comparator.
    * @param _instanceID The instance ID of the indicator/comparator.
    * @return bool Whether the upkeep can be created.
    */
    function checkInfoForUpkeep(address _owner, bool _isIndicator, address _target, uint256 _instanceID) public view override returns (bool) {
        uint256 componentID = components[_target];

        // Check if component is valid.
        if (componentID == 0) {
            return false;
        }

        {
        (,, address contractAddress,,) = componentsFactory.getComponentInfo(componentID);
        (address owner,,,) = getComponentInstanceInfo(componentID, _instanceID);

        // Check if given owner matches the component's owner.
        // Check that given target matches component's contract address.
        if (owner != _owner || contractAddress != _target) {
            return false;
        }
        }

        // Check whether the component instance is valid.
        return _isIndicator ? IIndicator(_target).indicatorTimeframe(_instanceID) > 0 : IComparator(_target).comparatorTimeframe(_instanceID) > 0;
    }

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
    function getIndicatorState(uint256 _componentID, uint256 _instance) external view override returns (string memory, uint256, uint256, uint256[] memory, uint256[] memory, uint256[] memory) {
        (,, address contractAddress,,) = componentsFactory.getComponentInfo(_componentID);

        return IIndicator(contractAddress).getState(_instance);
    }

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
    function getComparatorState(uint256 _componentID, uint256 _instance) external view override returns (address, address, uint256, uint256, uint256[] memory) {
        (,, address contractAddress,,) = componentsFactory.getComponentInfo(_componentID);

        return IComparator(contractAddress).getState(_instance);
    }

    /**
     * @notice Returns whether the user has purchased the given instance of the component.
     * @param _user Address of the user.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @return bool Whether the user has purchased the given instance of the component.
     */
    function hasPurchasedComponentInstance(address _user, uint256 _componentID, uint256 _instanceID) public view override returns (bool) {
        address instanceAddress = componentsFactory.componentInstance(_componentID);

        return IComponentInstances(instanceAddress).hasPurchasedInstance(_user, _instanceID);
    }

    /**
     * @notice Returns whether the user has purchased each instance.
     * @dev Returns false if _componentIDs and _instanceIDs have different length.
     * @param _user Address of the user.
     * @param _componentIDs IDs of the components.
     * @param _instanceIDs IDs of the component instances.
     * @return bool Whether the user has purchased each instance.
     */
    function checkRules(address _user, uint256[] memory _componentIDs, uint256[] memory _instanceIDs) external view override returns (bool) {
        // Check that lengths are the same.
        if (_componentIDs.length != _instanceIDs.length) {
            return false;
        }

        // Check that user has purchased each component.
        for (uint256 i = 0; i < _componentIDs.length; i++) {
            if (!hasPurchasedComponentInstance(_user, _componentIDs[i], _instanceIDs[i])) {
                return false;
            }
        }

        return true;
    }

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
    function createIndicatorInstance(uint256 _price,
                                     bool _isDefault,
                                     uint256 _componentID,
                                     string memory _asset,
                                     uint256 _assetTimeframe,
                                     uint256 _indicatorTimeframe,
                                     uint256[] memory _params) external override initialized {
        uint256 instanceID;
        {
        address instanceAddress = componentsFactory.componentInstance(_componentID);
        (address owner,, address contractAddress,, uint256 fee,) = getComponentInfo(_componentID);

        require(instanceAddress != address(0), "ComponentsRegistry: Component not found.");
        require(candlestickDataFeedRegistry.hasDataFeed(_asset, _assetTimeframe), "ComponentsRegistry: No data feed for given asset and timeframe.");
        require(_indicatorTimeframe > 0 && _indicatorTimeframe <= MAXIMUM_INSTANCE_TIMEFRAME, "ComponentsRegistry: Indicator timeframe out of bounds.");

        feeToken.safeTransferFrom(msg.sender, address(this), fee);
        feeToken.approve(instanceAddress, fee);

        instanceID = IComponentInstances(instanceAddress).createInstance(msg.sender, _price, _isDefault, owner, fee);
        IIndicator(contractAddress).createInstance(_asset, _assetTimeframe, _indicatorTimeframe, _params);
        }

        emit CreatedIndicatorInstance(_componentID, instanceID, msg.sender, _isDefault, _price, _asset, _assetTimeframe, _indicatorTimeframe, _params);
    }

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
    function createComparatorInstance(uint256 _price,
                                      bool _isDefault,
                                      uint256 _componentID,
                                      uint256 _firstIndicatorID,
                                      uint256 _secondIndicatorID,
                                      uint256 _firstIndicatorInstanceID,
                                      uint256 _secondIndicatorInstanceID) external override initialized {
        require(hasPurchasedComponentInstance(msg.sender, _firstIndicatorID, _firstIndicatorInstanceID), "ComponentsRegistry: Have not purchased first indicator instance.");
        require(hasPurchasedComponentInstance(msg.sender, _secondIndicatorID, _secondIndicatorInstanceID), "ComponentsRegistry: Have not purchased second indicator instance.");

        address instanceAddress = componentsFactory.componentInstance(_componentID);
        (address owner,, address contractAddress,, uint256 fee,) = getComponentInfo(_componentID);

        require(instanceAddress != address(0), "ComponentsRegistry: Component not found.");

        feeToken.safeTransferFrom(msg.sender, address(this), fee);
        feeToken.approve(instanceAddress, fee);

        {
        (,, address firstIndicatorAddress,,,) = getComponentInfo(_firstIndicatorID);
        (,, address secondIndicatorAddress,,,) = getComponentInfo(_secondIndicatorID);

        require(IIndicator(firstIndicatorAddress).isActive(_firstIndicatorInstanceID), "ComponentsRegistry: First indicator instance is not active.");
        require(IIndicator(secondIndicatorAddress).isActive(_secondIndicatorInstanceID), "ComponentsRegistry: Second indicator instance is not active.");
        
        IComparator(contractAddress).createInstance(firstIndicatorAddress, secondIndicatorAddress, _firstIndicatorInstanceID, _secondIndicatorInstanceID);
        }

        uint256 instanceID = IComponentInstances(instanceAddress).createInstance(msg.sender, _price, _isDefault, owner, fee);

        emit CreatedComparatorInstance(_componentID, instanceID, msg.sender, _price, _isDefault, _firstIndicatorID, _secondIndicatorID, _firstIndicatorInstanceID, _secondIndicatorInstanceID);
    }

    /**
     * @notice Marks the component instance as default.
     * @dev Only the component's owner can call this function.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     */
    function markComponentInstanceAsDefault(uint256 _componentID, uint256 _instanceID) external override initialized {
        (address owner,, bool isDefault,) = getComponentInstanceInfo(_componentID, _instanceID);

        require(!isDefault, "ComponentsRegistry: Component is already marked as default.");
        require(msg.sender == owner, "ComponentsRegistry: Only the component owner can mark as default.");

        address instanceAddress = componentsFactory.componentInstance(_componentID);
        IComponentInstances(instanceAddress).markInstanceAsDefault(_instanceID);

        emit MarkedComponentInstanceAsDefault(_componentID, _instanceID);
    }

    /**
     * @notice Updates the fee of the given component.
     * @dev Only the component's owner can call this function.
     * @param _componentID ID of the component.
     * @param _newFee The fee, in TGEN, to create an instance of the component.
     */
    function updateComponentFee(uint256 _componentID, uint256 _newFee) external override initialized {
        require(msg.sender == componentOwner(_componentID), "ComponentsRegistry: Only the component owner can update component fee.");

        componentsFactory.updateComponentFee(_componentID, _newFee);

        emit UpdatedComponentFee(_componentID, _newFee);
    }

    /**
     * @notice Updates the price of the given component instance.
     * @dev Only the component instance's owner can call this function.
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     * @param _newPrice New price of the instance, in TGEN.
     */
    function updateComponentInstancePrice(uint256 _componentID, uint256 _instanceID, uint256 _newPrice) external override initialized {
        (address owner,, bool isDefault,) = getComponentInstanceInfo(_componentID, _instanceID);

        require(!isDefault, "ComponentsRegistry: Component is marked as default.");
        require(msg.sender == owner, "ComponentsRegistry: Only the component owner can update price.");

        address instanceAddress = componentsFactory.componentInstance(_componentID);
        IComponentInstances(instanceAddress).updateInstancePrice(_instanceID, _newPrice);

        emit UpdatedComponentInstancePrice(_componentID, _instanceID, _newPrice);
    }

    /**
     * @notice Purchases the given component instance.
     * @dev Purchasing an instance allows the user to integrate it into trading bots.
     * @dev The user does not receive the instance NFT, only the right to use the instance in a trading bot.
     * @dev Transaction will revert if the instance is not active (has not been updated regularly).
     * @param _componentID ID of the component.
     * @param _instanceID ID of the component instance.
     */
    function purchaseComponentInstance(uint256 _componentID, uint256 _instanceID) external override initialized {
        (,,, uint256 price) = getComponentInstanceInfo(_componentID, _instanceID);
        address instanceAddress = componentsFactory.componentInstance(_componentID);

        feeToken.safeTransferFrom(msg.sender, address(this), price);
        feeToken.approve(instanceAddress, price);

        IComponentInstances(instanceAddress).purchaseComponentInstance(msg.sender, _instanceID);

        emit PurchasedComponentInstance(msg.sender, _componentID, _instanceID, price);
    }

    /**
     * @notice Publishes a component to the platform.
     * @dev This function can only be called by the contract owner.
     * @dev Assumes that the component's contract (separate from the NFT) has already been deployed.
     * @param _contractAddress Address of the indicator/comparator.
     * @param _isIndicator Whether the component is an indicator.
     * @param _componentOwner The user who created the indicator/comparator contract.
     * @param _fee Fee, in TGEN, for creating instances of the component.
     */
    function publishComponent(address _contractAddress, bool _isIndicator, address _componentOwner, uint256 _fee) external override initialized onlyOwner {
        uint256 componentID = componentsFactory.createComponent(_contractAddress, _isIndicator, _componentOwner, _fee);
        address instancesAddress = componentInstancesFactory.createInstance(componentID);
        componentsFactory.setComponentInstancesAddress(componentID, instancesAddress);
        components[_contractAddress] = componentID;

        emit PublishedComponent(componentID, instancesAddress, _contractAddress, _isIndicator, _componentOwner, _fee);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */
    
    /**
     * @notice Initializes the ComponentInstancesFactory and Components contracts.
     * @dev This function can only be called by the operator.
     * @dev This function can only be called once.
     * @param _componentInstancesFactory Address of the ComponentInstancesFactory contract.
     * @param _componentsFactory Address of the Components contract.
     */
    function initializeContracts(address _componentInstancesFactory, address _componentsFactory) external onlyOwner isNotInitialized {
        componentInstancesFactory = IComponentInstancesFactory(_componentInstancesFactory);
        componentsFactory = IComponents(_componentsFactory);
        isInitialized = true;

        emit InitializedContracts(_componentInstancesFactory, _componentsFactory);
    }

    /* ========== MODIFIERS ========== */

    modifier isNotInitialized() {
        require(!isInitialized,
                "ComponentsRegistry: Already initialized.");
        _;
    }

    modifier initialized() {
        require(isInitialized,
                "ComponentsRegistry: Not initialized.");
        _;
    }

    /* ========== EVENTS ========== */

    event InitializedContracts(address componentInstancesFactoryAddress, address componentsFactoryAddress);
    event MarkedComponentInstanceAsDefault(uint256 componentID, uint256 instanceID);
    event UpdatedComponentInstancePrice(uint256 componentID, uint256 instanceID, uint256 newPrice);
    event PurchasedComponentInstance(address user, uint256 componentID, uint256 instanceID, uint256 price);
    event UpdatedComponentFee(uint256 componentID, uint256 newFee);
    event CreatedIndicatorInstance(uint256 componentID, uint256 instanceID, address owner, bool isDefault, uint256 price, string asset, uint256 assetTimeframe, uint256 indicatorTimeframe, uint256[] params);
    event CreatedComparatorInstance(uint256 componentID, uint256 instanceID, address owner, uint256 price, bool isDefault, uint256 firstIndicatorID, uint256 secondIndicatorID, uint256 firstIndicatorInstanceID, uint256 secondIndicatorInstanceID);
    event PublishedComponent(uint256 componentID, address instancesAddress, address contractAddress, bool isIndicator, address componentOwner, uint256 fee);
}