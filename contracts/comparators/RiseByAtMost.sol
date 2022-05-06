// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Interfaces.
import '../interfaces/IIndicator.sol';

// Inheritance/
import '../interfaces/IComparator.sol';

contract RiseByAtMost is IComparator {
    using SafeMath for uint256;

    // Maximum number of seconds between comparator updates before the comparator is considered inactive.
    uint256 public constant MAX_TIME_BETWEEN_UPDATES = 180;

    address public immutable componentRegistry;
    address public immutable keeperRegistry;

    // Keep track of total number of instances.
    // This ensures instance IDs are unique.
    uint256 numberOfInstances;

    // (instance number => instance state).
    mapping (uint256 => State) public instances;

    // (instance number => timestamp at which the instance was last updated).
    // Prevents keepers from updating instances too frequently.
    mapping (uint256 => uint256) public lastUpdated;

    // (instance number => timeframe, in minutes).
    // The comparator instance's timeframe can be different from the asset's timeframe.
    mapping (uint256 => uint256) public comparatorTimeframe;

    // (instance number => address of the instance's dedicated keeper).
    mapping (uint256 => address) public keepers;

    constructor(address _componentRegistry, address _keeperRegistry) {
        require(_componentRegistry != address(0), "Comparator: Invalid address for _componentRegistry.");
        require(_keeperRegistry != address(0), "Comparator: Invalid address for _keeperRegistry.");

        componentRegistry = _componentRegistry;
        keeperRegistry = _keeperRegistry;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the name of this comparator.
    */
    function getName() external pure override returns (string memory) {
        return "RiseByAtMost";
    }

    /**
    * @notice Returns whether the comparator instance can be updated.
    * @param _instance Instance number of this comparator.
    * @return bool Whether the comparator instance can be updated.
    */
    function canUpdate(uint256 _instance) external view override returns (bool) {
        return block.timestamp >= lastUpdated[_instance].add(comparatorTimeframe[_instance].mul(60)).sub(2);
    }

    /**
    * @notice Returns the status of the given instance of this comparator.
    * @param _instance Instance number of this comparator.
    * @return bool Whether the comparator instance is active.
    */
    function isActive(uint256 _instance) external view override returns (bool) {
        if (block.timestamp > lastUpdated[_instance].add(comparatorTimeframe[_instance].mul(60)).add(MAX_TIME_BETWEEN_UPDATES)) {
            return false;
        }

        return true;
    }

    /**
    * @notice Returns the state of the given comparator instance.
    * @dev Returns 0 for each value if the instance is out of bounds.
    * @param _instance Instance number of this comparator.
    * @return (address, address, uint256, uint256, uint256[]) Address of the first indicator,
    *                                                         address of the second indicator,
    *                                                         the first indicator instance,
    *                                                         the second indicator instance,
    *                                                         and an array of variables for the comparator.
    */
    function getState(uint256 _instance) external view override returns (address, address, uint256, uint256, uint256[] memory) {
        // Gas savings.
        State memory state = instances[_instance];
        uint256[] memory variables = new uint256[](state.variables.length);

        for (uint256 i = 0; i < variables.length; i++) {
            variables[i] = instances[_instance].variables[i];
        }

        return (state.firstIndicatorAddress, state.secondIndicatorAddress, state.firstIndicatorInstance, state.secondIndicatorInstance, variables);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Creates an instance of this comparator.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _firstIndicatorAddress Address of the comparator's first indicator.
    * @param _secondIndicatorAddress Address of the comparator's second indicator.
    * @param _firstIndicatorInstance Instance number of the first indicator.
    * @param _secondIndicatorInstance Instance number of the second indicator.
    * @return (uint256) Instance number of the comparator.
    */
    function createInstance(address _firstIndicatorAddress,
                            address _secondIndicatorAddress,
                            uint256 _firstIndicatorInstance,
                            uint256 _secondIndicatorInstance) external override onlyComponentRegistry returns (uint256) {
        require(_firstIndicatorAddress != address(0), "Comparator: Invalid address for first indicator.");
        require(_secondIndicatorAddress != address(0), "Comparator: Invalid address for second indicator.");
        require(_firstIndicatorAddress != _secondIndicatorAddress, "Comparator: Indicators are the same.");

        uint256 indicatorTimeframe1 = IIndicator(_firstIndicatorAddress).indicatorTimeframe(_firstIndicatorInstance);
        uint256 indicatorTimeframe2 = IIndicator(_secondIndicatorAddress).indicatorTimeframe(_secondIndicatorInstance);
        uint256 timeframe = (indicatorTimeframe1 < indicatorTimeframe2) ? indicatorTimeframe1 : indicatorTimeframe2;

        numberOfInstances = numberOfInstances.add(1);
        comparatorTimeframe[numberOfInstances] = timeframe;
        instances[numberOfInstances] = State({
            firstIndicatorAddress: _firstIndicatorAddress,
            secondIndicatorAddress: _secondIndicatorAddress,
            firstIndicatorInstance: _firstIndicatorInstance,
            secondIndicatorInstance: _secondIndicatorInstance,
            variables: new uint256[](0)
        });

        emit CreatedInstance(numberOfInstances, timeframe, _firstIndicatorAddress, _secondIndicatorAddress, _firstIndicatorInstance, _secondIndicatorInstance);

        return numberOfInstances;
    }

    /**
    * @notice Returns whether the comparator's conditions are met for the given instance, and updates the comparator's variables.
    * @dev This function can only be called by the comparator instance's dedicated keeper.
    * @dev The transaction will revert if the comparator is not ready to be updated.
    * @param _instance Instance number of this comparator.
    * @return (bool) Whether the comparator's conditions are met.
    */
    function checkConditions(uint256 _instance) external override onlyDedicatedKeeper(_instance) returns (bool) {
        State memory instance = instances[_instance];
        uint256[] memory firstIndicatorValues = IIndicator(instance.firstIndicatorAddress).getValue(instance.firstIndicatorInstance);
        uint256[] memory secondIndicatorValue = IIndicator(instance.secondIndicatorAddress).getValue(instance.secondIndicatorInstance);

        if (firstIndicatorValues.length < 2) {
            return false;
        }

        // Check if indicator fell in value.
        if (firstIndicatorValues[firstIndicatorValues.length - 1] <= firstIndicatorValues[0]) {
            return false;
        }

        return ((firstIndicatorValues[firstIndicatorValues.length - 1].sub(firstIndicatorValues[0]).mul(1e18).mul(100).div(firstIndicatorValues[0])) <= secondIndicatorValue[0]);
    }

    /**
    * @notice Updates the dedicated keeper for the given instance of this comparator.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _instance Instance number of this comparator.
    * @param _newKeeper Address of the new keeper contract.
    */
    function setKeeper(uint256 _instance, address _newKeeper) external override onlyKeeperRegistry {
        keepers[_instance] = _newKeeper;

        emit UpdatedKeeper(_instance, _newKeeper);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyDedicatedKeeper(uint256 _instance) {
        require(keepers[_instance] == msg.sender,
                "Comparator: Only the dedicated keeper for this instance can call the function.");
        _;
    }

    modifier onlyComponentRegistry() {
        require(msg.sender == componentRegistry,
                "Comparator: Only the ComponentRegistry contract can call this function.");
        _;
    }

    modifier onlyKeeperRegistry() {
        require(msg.sender == keeperRegistry,
                "Comparator: Only the KeeperRegistry contract can call this function.");
        _;
    }
}