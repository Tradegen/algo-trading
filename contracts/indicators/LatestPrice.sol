// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Openzeppelin
import "../openzeppelin-solidity/contracts/SafeMath.sol";

// Inheritance
import '../interfaces/IIndicator.sol';

contract LatestPrice is IIndicator {
    using SafeMath for uint256;

    address public immutable componentsAddress;

    constructor(address _componentsAddress, bool _isDefault) {
        require(_componentsAddress != address(0), "Indicator: invalid address for Components contract.");

        componentsAddress = _componentsAddress;
        isDefault = _isDefault;
    }

    bool public isDefault;
    mapping(address => bool) public canUse;

    uint256 numberOfInstances;
    mapping (uint256 => State) public instances;

    /**
    * @dev Returns the name of this indicator.
    */
    function getName() external pure override returns (string memory) {
        return "LatestPrice";
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
    * @param _tradingBotOwner Address of the trading bot owner.
    * @param _params A serialized array of params to use for this indicator.
    *                The serialized array has 96 bits, consisting of 6 params with 16 bits each.
    *                Expects left-most 160 bits to be 0.
    * @return (uint256) Instance number of the indicator.
    */
    function addTradingBot(address _tradingBotOwner, uint256 _params) external override returns (uint256) {
        require(_tradingBotOwner != address(0), "Indicator: Invalid address for trading bot owner.");
        require(isDefault || canUse[_tradingBotOwner], "Indicator: Don't have permission to use this indicator.");
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
        instances[_instance].value = _latestPrice.close;
        instances[_instance].history.push(_latestPrice.close);
        
        emit Updated(_instance, _latestPrice, _latestPrice.close);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Marks this indicator as a default indicator.
    * @notice This function can only be called by the Components contract.
    * @notice Once an indicator is marked as default, it cannot go back to being a purchasable indicator.
    * @notice If an indicator is marked as default, any trading bot can integrate it for free.
    */
    function markAsDefault() external override onlyComponentsContract isNotDefault {
        isDefault = true;

        emit MarkedAsDefault();
    }

    /**
    * @dev Allows the user to use this indicator in trading bots.
    * @notice This function can only be called by the Components contract.
    * @notice Meant to be called by the Components contract when a user purchases this indicator.
    * @param _user Address of the user.
    */
    function registerUser(address _user) external override onlyComponentsContract isNotDefault {
        require(_user != address(0), "Indicator: invalid address for user.");
        require(!canUse[_user], "Indicator: already can use this indicator.");

        canUse[_user] = true;

        emit RegisteredUser(_user);
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

    modifier isNotDefault() {
        require(!isDefault,
                "Indicator: Indicator needs to be non-default to call this function.");
        _;
    }
}