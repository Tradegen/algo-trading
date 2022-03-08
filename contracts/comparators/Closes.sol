// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Interfaces
import '../interfaces/IIndicator.sol';

// Inheritance
import '../interfaces/IComparator.sol';

contract Closes is IComparator {
    using SafeMath for uint256;

    constructor() {}

    uint256 numberOfInstances;
    mapping (uint256 => State) public instances;

    /**
    * @dev Returns the name of this comparator.
    */
    function getName() external pure override returns (string memory) {
        return "Closes";
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
            variables: new uint256[](1)
        });

        emit AddedTradingBot(msg.sender, numberOfInstances, _firstIndicatorAddress, _secondIndicatorAddress, _firstIndicatorInstance, _secondIndicatorInstance);

        return numberOfInstances;
    }

    /**
    * @dev Returns whether the comparator's conditions are met for the given instance.
    * @notice This function updates the state of the given instance.
    * @notice Variables[0] is previous price.
    * @param _instance Instance number of this comparator.
    * @return (bool) Whether the comparator's conditions are met after the latest price feed update.
    */
    function checkConditions(uint256 _instance) external override onlyTradingBot(_instance) returns (bool) {
        uint256[] memory priceHistory = IIndicator(instances[_instance].firstIndicatorAddress).getValue(instances[_instance].firstIndicatorInstance);

        if (keccak256(abi.encodePacked(IIndicator(instances[_instance].secondIndicatorAddress).getName())) == keccak256(abi.encodePacked("Up"))) {
            if (priceHistory.length == 0) {
                return false;
            }

            if (priceHistory.length > 1) {
                for (uint256 i = 1; i < priceHistory.length; i++) {
                    if (priceHistory[i] <= priceHistory[i - 1]) {
                        return false;
                    }
                }

                return true;
            }
            else {
                bool result = (priceHistory[0] > instances[_instance].variables[0]);
                instances[_instance].variables[0] = priceHistory[0];
                
                return result;
            }
        }
        else if (keccak256(abi.encodePacked(IIndicator(instances[_instance].secondIndicatorAddress).getName())) == keccak256(abi.encodePacked("Down"))) {
            if (priceHistory.length == 0) {
                return false;
            }

            if (priceHistory.length > 1) {
                for (uint256 i = 1; i < priceHistory.length; i++) {
                    if (priceHistory[i] >= priceHistory[i - 1]) {
                        return false;
                    }
                }

                return true;
            }
            else {
                bool result = (priceHistory[0] < instances[_instance].variables[0]);
                instances[_instance].variables[0] = priceHistory[0];

                return result;
            }
        }

        return false;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyTradingBot(uint256 _instance) {
        require(instances[_instance].tradingBot == msg.sender,
                "Comparator: Wrong trading bot for this instance.");
        _;
    }
}