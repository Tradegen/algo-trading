// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Interfaces
import '../interfaces/IIndicator.sol';

// Inheritance
import '../interfaces/IComparator.sol';

contract CrossesAbove is IComparator {
    using SafeMath for uint256;

    constructor() {}

    uint256 numberOfInstances;
    mapping (uint256 => State) public instances;

    /**
    * @dev Returns the name of this comparator.
    */
    function getName() external pure override returns (string memory) {
        return "CrossesAbove";
    }

    /**
    * @dev Creates an instance of this comparator for the contract calling this function.
    * @notice This function is meant to be called by the TradingBot contract.
    * @param _firstIndicatorAddress Address of the comparator's first indicator.
    * @param _secondIndicatorAddress Address of the comparator's second indicator.
    * @param _firstIndicatorInstance Instance number of the first indicator.
    * @param _secondIndicatorInstance Instance number of the second indicator.
    * @return (uint256) Instance number of the comparator.
    */
    function addTradingBot(address _firstIndicatorAddress, address _secondIndicatorAddress, uint256 _firstIndicatorInstance, uint256 _secondIndicatorInstance) external returns (uint256) {
        require(_firstIndicatorAddress != address(0), "Comparator: invalid address for first indicator.");
        require(_secondIndicatorAddress != address(0), "Comparator: invalid address for second indicator.");
        require(_firstIndicatorAddress != _secondIndicatorAddress, "Comparator: indicators are the same.");

        numberOfInstances = numberOfInstances.add(1);
        instances[numberOfInstances] = State({
            tradingBot: msg.sender,
            firstIndicatorAddress: _firstIndicatorAddress,
            secondIndicatorAddress: _secondIndicatorAddress,
            firstIndicatorInstance: _firstIndicatorInstance,
            secondIndicatorInstance: _secondIndicatorInstance,
            variables: new uint256[](2)
        });

        emit AddedTradingBot(msg.sender, numberOfInstances, _firstIndicatorAddress, _secondIndicatorAddress, _firstIndicatorInstance, _secondIndicatorInstance);

        return numberOfInstances;
    }

    /**
    * @dev Returns whether the comparator's conditions are met for the given instance.
    * @notice This function updates the state of the given instance.
    * @notice Variables[0] is first indicator previous value.
    * @notice Variables[1] is second indicator previous value.
    * @param _instance Instance number of this comparator.
    * @return (bool) Whether the comparator's conditions are met after the latest price feed update.
    */
    function checkConditions(uint256 _instance) external override onlyTradingBot(_instance) returns (bool) {
        {
        State memory instance = instances[_instance];
        uint256[] memory firstIndicatorHistory = IIndicator(instance.firstIndicatorAddress).getValue(instance.firstIndicatorInstance);
        uint256[] memory secondIndicatorHistory = IIndicator(instance.secondIndicatorAddress).getValue(instance.secondIndicatorInstance);

        if (firstIndicatorHistory.length == 0 || secondIndicatorHistory.length == 0 || instance.variables[0] == 0 || instance.variables[1] == 0)
        {
            return false;
        }

        bool result = (instance.variables[0] < instance.variables[1]) &&
                    (firstIndicatorHistory[firstIndicatorHistory.length - 1] > secondIndicatorHistory[secondIndicatorHistory.length - 1]);

        instances[_instance].variables[0] = firstIndicatorHistory[firstIndicatorHistory.length - 1];
        instances[_instance].variables[1] = secondIndicatorHistory[secondIndicatorHistory.length - 1];

        return result;
        }
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBot(uint256 _instance) {
        require(instances[_instance].tradingBot == msg.sender,
                "Comparator: Wrong trading bot for this instance.");
        _;
    }
}