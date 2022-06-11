// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Internal references.
import '../interfaces/external/ICandlestickDataFeedRegistry.sol';

// Inheritance.
import '../interfaces/IIndicator.sol';

contract EMA is IIndicator {
    using SafeMath for uint256;

    // Maximum number of elements to use for the history.
    // This prevents 'for' loops with too many iterations, which may exceed the block gas limit.
    uint256 public constant MAX_HISTORY_LENGTH = 20;

    // Maximum number of seconds between indicator updates before the indicator is considered inactive.
    uint256 public constant MAX_TIME_BETWEEN_UPDATES = 180;

    address public immutable componentRegistry;
    address public immutable keeperRegistry;
    ICandlestickDataFeedRegistry public immutable candlestickDataFeedRegistry;

    uint256 public constant multiplierNumerator = 2;

    // Keep track of total number of instances.
    // This ensures instance IDs are unique.
    uint256 numberOfInstances;

    // (instance number => instance state).
    mapping (uint256 => State) public instances;

    // (instance number => number of updates).
    // Used for keeping track of the last index in the history of an instance.
    mapping (uint256 => uint256) public updateCount;

    // (instance number => index => value).
    mapping (uint256 => mapping (uint256 => uint256)) public history;

    // (instance number => timestamp at which the instance was last updated).
    // Prevents keepers from updating instances too frequently.
    mapping (uint256 => uint256) public lastUpdated;

    // (instance number => timeframe, in minutes).
    // The indicator instance's timeframe can be different from the asset's timeframe.
    mapping (uint256 => uint256) public override indicatorTimeframe;

    // (instance number => address of the instance's dedicated keeper).
    mapping (uint256 => address) public override keepers;

    constructor(address _componentRegistry, address _candlestickDataFeedRegistry, address _keeperRegistry) {
        require(_componentRegistry != address(0), "Indicator: Invalid address for _componentRegistry.");
        require(_candlestickDataFeedRegistry != address(0), "Indicator: Invalid address for _candlestickDataFeedRegistry.");
        require(_keeperRegistry != address(0), "Indicator: Invalid address for _keeperRegistry.");

        componentRegistry = _componentRegistry;
        keeperRegistry = _keeperRegistry;
        candlestickDataFeedRegistry = ICandlestickDataFeedRegistry(_candlestickDataFeedRegistry);
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the name of this indicator.
    */
    function getName() external pure override returns (string memory) {
        return "EMA";
    }


    /**
    * @notice Returns the value of this indicator for the given instance.
    * @dev Returns an empty array if the instance number is out of bounds.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value for the given instance.
    */
    function getValue(uint256 _instance) external view override returns (uint256[] memory) {
        uint256[] memory result = new uint256[](1);

        result[0] = instances[_instance].value;

        return result;
    }

    /**
    * @notice Returns the history of this indicator for the given instance.
    * @dev Returns an empty array if the instance number is out of bounds.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value history for the given instance.
    */
    function getHistory(uint256 _instance) external view override returns (uint256[] memory) {
        uint256 historyLength = updateCount[_instance];
        uint256 length = historyLength >= MAX_HISTORY_LENGTH ? MAX_HISTORY_LENGTH : historyLength;
        uint256[] memory result = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] = history[_instance][historyLength.sub(length).add(i)];
        }

        return result;
    }

    /**
    * @notice Returns whether the indicator instance can be updated.
    * @param _instance Instance number of this indicator.
    * @return bool Whether the indicator instance can be updated.
    */
    function canUpdate(uint256 _instance) public view override returns (bool) {
        return block.timestamp >= lastUpdated[_instance].add(indicatorTimeframe[_instance].mul(60)).sub(2);
    }

    /**
    * @notice Returns the status of the given instance of this indicator.
    * @param _instance Instance number of this indicator.
    * @return bool Whether the indicator instance is active.
    */
    function isActive(uint256 _instance) external view override returns (bool) {
        if (block.timestamp > lastUpdated[_instance].add(indicatorTimeframe[_instance].mul(60)).add(MAX_TIME_BETWEEN_UPDATES)) {
            return false;
        }

        return true;
    }

    /**
    * @notice Returns the state of the given indicator instance.
    * @dev Returns 0 for each value if the instance is out of bounds.
    * @param _instance Instance number of this indicator.
    * @return (string, address, uint256, uint256[], uint256[])  Asset symbol,
    *                                                         timeframe of the asset (in minutes),
    *                                                         the current value of the given instance,
    *                                                         an array of params for the given instance,
    *                                                         an array of variables for the given instance.
    */
    function getState(uint256 _instance) external view override returns (string memory, uint256, uint256, uint256[] memory, uint256[] memory) {
        // Gas savings.
        State memory state = instances[_instance];
        uint256[] memory params = new uint256[](state.params.length);
        uint256[] memory variables = new uint256[](state.variables.length);

        for (uint256 i = 0; i < params.length; i++) {
            params[i] = instances[_instance].params[i];
        }

        for (uint256 i = 0; i < variables.length; i++) {
            variables[i] = instances[_instance].variables[i];
        }

        return (state.asset, state.assetTimeframe, state.value, params, variables);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Creates an instance of this indicator.
    * @dev This function can only be called by the ComponentRegistry contract.
    * @param _asset Symbol of the asset.
    * @param _assetTimeframe Timeframe (in minutes) of the asset's data feed.
    * @param _indicatorTimeframe Timeframe (in minutes) of the indicator instance.
    * @param _params An array of parameters.
    * @return (uint256) Instance number of the indicator.
    */
    function createInstance(string memory _asset,
                            uint256 _assetTimeframe,
                            uint256 _indicatorTimeframe,
                            uint256[] memory _params) external override onlyComponentRegistry returns (uint256) {
        require(_params.length >= 1, "Indicator: Not enough params.");
        require(_params[0] > 1 && _params[0] <= 200, "Indicator: Param out of bounds.");

        // Gas savings.
        uint256 instanceNumber = numberOfInstances.add(1);

        indicatorTimeframe[instanceNumber] = _indicatorTimeframe;
        numberOfInstances = instanceNumber;
        instances[instanceNumber] = State({
            asset: _asset,
            assetTimeframe: _assetTimeframe,
            value: 0,
            params: _params,
            variables: new uint256[](2)
        });
        instances[instanceNumber].variables[1] = _params[0].add(1);

        emit CreatedInstance(instanceNumber, _asset, _assetTimeframe, _indicatorTimeframe, _params);

        return instanceNumber;
    }

    /**
    * @notice Updates the indicator's state for the given instance, based on the latest price feed update.
    * @dev This function can only be called by the dedicated keeper of this instance.
    * @param _instance Instance number of this indicator.
    * @return bool Whether the indicator was updated successfully.
    */
    function update(uint256 _instance) external override onlyDedicatedKeeper(_instance) returns (bool) {
        require(canUpdate(_instance), "Indicator: Cannot update yet.");

        State memory data = instances[_instance];
        uint256 latestPrice = candlestickDataFeedRegistry.getCurrentPrice(data.asset, data.assetTimeframe);

        // Return early if there was an error getting the latest price.
        if (latestPrice == 0) {
            return false;
        }

        uint256 currentValue = data.value;
        uint256 newValue = (currentValue == 0) ? latestPrice :
                                    (latestPrice >= data.variables[0]) ?
                                    (multiplierNumerator.mul(latestPrice.sub(data.variables[0])).div(data.variables[1])).add(data.variables[0]) :
                                    data.variables[0].sub(multiplierNumerator.mul(data.variables[0].sub(latestPrice)).div(data.variables[1]));

        instances[_instance].value = newValue;
        instances[_instance].variables[0] = (currentValue == 0) ? latestPrice : currentValue;
        history[_instance][updateCount[_instance]] = newValue;
        updateCount[_instance] = updateCount[_instance].add(1);
        lastUpdated[_instance] = block.timestamp;

        emit Updated(_instance, latestPrice, newValue);

        return true;
    }

    /**
    * @notice Updates the dedicated keeper for the given instance of this indicator.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _instance Instance number of this indicator.
    * @param _newKeeper Address of the new keeper contract.
    */
    function setKeeper(uint256 _instance, address _newKeeper) external override onlyKeeperRegistry {
        require((_newKeeper == address(0) && keepers[_instance] != address(0)) || (_newKeeper != address(0) && keepers[_instance] == address(0)), "Indicator: Invalid keeper.");

        keepers[_instance] = _newKeeper;

        emit UpdatedKeeper(_instance, _newKeeper);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyDedicatedKeeper(uint256 _instance) {
        require(keepers[_instance] == msg.sender,
                "Indicator: Only the dedicated keeper for this instance can call the function.");
        _;
    }

    modifier onlyComponentRegistry() {
        require(msg.sender == componentRegistry,
                "Indicator: Only the ComponentRegistry contract can call this function.");
        _;
    }

    modifier onlyKeeperRegistry() {
        require(msg.sender == keeperRegistry,
                "Indicator: Only the KeeperRegistry contract can call this function.");
        _;
    }
}