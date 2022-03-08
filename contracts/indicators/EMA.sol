// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Inheritance
import '../interfaces/IIndicator.sol';

contract EMA is IIndicator {
    using SafeMath for uint256;

    uint256 public constant multiplierNumerator = 2;
    uint256 public multiplierDenominator;

    constructor() {}

    uint256 numberOfInstances;
    mapping (uint256 => State) public instances;

    /**
    * @dev Returns the name of this indicator.
    */
    function getName() external pure override returns (string memory) {
        return "EMA";
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
    * @param _params An array of params to use for this indicator.
    * @return (uint256) Instance number of the indicator.
    */
    function addTradingBot(uint256[] memory _params) external returns (uint256) {
        require(_params.length >= 1, "Indicator: not enough params.");
        require(_params[0] > 1 && _params[0] <= 200, "Indicator: param out of bounds.");

        multiplierDenominator = _params[0].add(1);
        numberOfInstances = numberOfInstances.add(1);
        instances[numberOfInstances] = State({
            tradingBot: msg.sender,
            value: 0,
            params: _params,
            variables: new uint256[](1),
            history: new uint256[](0)
        });

        emit AddedTradingBot(msg.sender, numberOfInstances, _params);

        return numberOfInstances;
    }

    /**
    * @dev Updates the indicator's state for the given instance, based on the latest price feed update.
    * @notice This function is meant to be called by the TradingBot contract.
    * @notice Variables[0] is previous EMA value.
    * @param _instance Instance number of this indicator.
    * @param _latestPrice The latest price from oracle price feed.
    */
    function update(uint256 _instance, IPriceAggregator.Candlestick memory _latestPrice) external override onlyTradingBot(_instance) {
        {
        State memory data = instances[_instance];
        uint256 currentValue = data.value;
        uint256 newValue = (currentValue == 0) ? _latestPrice.close :
                                    (_latestPrice.close >= data.variables[0]) ?
                                    (multiplierNumerator.mul(_latestPrice.close.sub(data.variables[0])).div(multiplierDenominator)).add(data.variables[0]) :
                                    data.variables[0].sub(multiplierNumerator.mul(data.variables[0].sub(_latestPrice.close)).div(multiplierDenominator));

        instances[_instance].value = newValue;
        instances[_instance].history.push(newValue);

        emit Updated(_instance, _latestPrice, newValue);
        }
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBot(uint256 _instance) {
        require(instances[_instance].tradingBot == msg.sender,
                "Indicator: Wrong trading bot for this instance.");
        _;
    }
}