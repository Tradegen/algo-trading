// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Inheritance
import '../interfaces/IIndicator.sol';

contract HighOfLastNPriceUpdates is IIndicator {
    using SafeMath for uint256;

    address public immutable componentsAddress;

    constructor(address _componentsAddress) {
        require(_componentsAddress != address(0), "Indicator: invalid address for Components contract.");

        componentsAddress = _componentsAddress;
    }

    uint256 numberOfInstances;
    mapping (uint256 => State) public instances;

    /**
    * @dev Returns the name of this indicator.
    */
    function getName() external pure override returns (string memory) {
        return "HighOfLastNPriceUpdates";
    }

    /**
    * @dev Returns the value of this indicator for the given instance.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value for the given instance.
    */
    function getValue(uint256 _instance) external view override returns (uint256[] memory) {
        uint256[] memory result = new uint256[](1);

        result[0] = instances[_instance].value;

        return result;
    }

    /**
    * @dev Returns the history of this indicator for the given instance.
    * @param _instance Instance number of this indicator.
    * @return (uint256[] memory) Indicator value history for the given instance.
    */
    function getHistory(uint256 _instance) external view override returns (uint256[] memory) {
        uint256[] memory result = instances[_instance].history;

        return result;
    }

    /**
    * @dev Creates an instance of this indicator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _params A serialized array of params to use for this indicator.
    *                The serialized array has 96 bits, consisting of 6 params with 16 bits each.
    *                Expects left-most 160 bits to be 0.
    * @return (uint256) Instance number of the indicator.
    */
    function addTradingBot(uint256 _params) external override returns (uint256) {
        require((_params >> 80) > 1 && (_params >> 80) <= 200, "Indicator: param out of bounds.");

        numberOfInstances = numberOfInstances.add(1);
        instances[numberOfInstances] = State({
            tradingBot: msg.sender,
            value: 0,
            params: _params,
            variables: new uint256[](0),
            history: new uint256[](0)
        });

        emit AddedTradingBot(msg.sender, numberOfInstances, _params);

        return numberOfInstances;
    }

    /**
    * @dev Updates the indicator's state for the given instance, based on the latest price feed update.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _instance Instance number of this indicator.
    * @param _latestPrice The latest price from oracle price feed.
    */
    function update(uint256 _instance, CandlestickUtils.Candlestick memory _latestPrice) external override onlyTradingBot(_instance) {
        State memory data = instances[_instance];
        uint256 length = (data.history.length >= (data.params >> 80)) ? (data.params >> 80) : 0;
        uint256 high;

        instances[_instance].history.push(_latestPrice.high);

        for (uint256 i = 0; i < length; i++)
        {
            high = (data.history[length - i - 1] > high) ? data.history[length - i - 1] : high;
        }

        instances[_instance].value = high;
        
        emit Updated(_instance, _latestPrice, high);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBot(uint256 _instance) {
        require(instances[_instance].tradingBot == msg.sender,
                "Indicator: Wrong trading bot for this instance.");
        _;
    }

    modifier onlyComponentsContract() {
        require(msg.sender == componentsAddress,
                "Indicator: Only the Components contract can call this function.");
        _;
    }
}