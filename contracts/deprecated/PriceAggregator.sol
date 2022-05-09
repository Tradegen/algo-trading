// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin
import "../openzeppelin-solidity/contracts/SafeMath.sol";
import "../openzeppelin-solidity/contracts/Ownable.sol";

// Inheritance
import "../interfaces/deprecated/IPriceAggregator.sol";

contract PriceAggregator is IPriceAggregator, Ownable {
    using SafeMath for uint256;

    /* ========== STATE VARIABLES ========== */

    uint256 public constant TARGET_TIME_BETWEEN_UPDATES = 30 seconds;

    // Contracts.
    address public oracle;
    string public asset;

    // Used for tracking target time.
    uint256 public lastUpdated;

    // Latest price from the asset's price feed.
    uint256 public override latestRawPrice;

    // Historical data.
    uint256 public override numberOfCandlesticks;

    // Starts at index 0.
    mapping (uint256 => Candlestick) public prices;

    // Pending data.
    uint256 public numberOfUpdates;
    Candlestick public currentCandlestick;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _oracle, string memory _asset) Ownable() {
        require(_oracle != address(0), "PriceAggregator: Invalid address for oracle.");

        oracle = _oracle;
        asset = _asset;

        currentCandlestick.asset = _asset;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Returns the symbol of this PriceAggregator's asset.
     */
    function getAsset() external view override returns (string memory) {
        return asset;
    }

    /**
     * @notice Returns the most recent completed candlestick.
     * @dev Doesn't account for the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getCurrentPrice() external view override returns (Candlestick memory) {
        return prices[numberOfCandlesticks];
    }

    /**
     * @notice Returns the candlestick currently forming.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPendingPrice() external view override returns (Candlestick memory) {
        return currentCandlestick;
    }

     /**
     * @notice Returns the candlestick at the given index.
     * @dev Doesn't account for the candlestick currently forming.
     * @param _index Index of the candlestick.
     * @return (Candlestick) Latest candlestick for this asset.
     */
    function getPriceAt(uint256 _index) external view override returns (Candlestick memory) {
        require(_index >= 0, "PriceAggregator: Index must be positive.");

        return prices[_index];
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Updates the Candlestick struct based on the latest price from the asset's dedicated oracle.
     * @dev This function is meant to be called once every 30 seconds by the dedicated oracle contract.
     * @param _latestPrice The latest price from the asset's oracle.
     */
    function onPriceFeedUpdate(uint256 _latestPrice) external override onlyOracle {
        // Return early if less than 30 seconds have elapsed since the last update.
        if (block.timestamp.sub(lastUpdated) < TARGET_TIME_BETWEEN_UPDATES) {
            return;
        }

        latestRawPrice = _latestPrice;

        // Check if this is the first update.
        if (numberOfUpdates == 0) {
            currentCandlestick.open = _latestPrice;
            currentCandlestick.low = _latestPrice;
            currentCandlestick.high = _latestPrice;
            currentCandlestick.startingTimestamp = block.timestamp;
        }

        // Check for a new high price.
        if (_latestPrice > currentCandlestick.high) {
            currentCandlestick.high = _latestPrice;
        }

        // Check for a new low price.
        if (_latestPrice < currentCandlestick.low) {
            currentCandlestick.low = _latestPrice;
        }

        // Check if there have been 10 updates for the current candlestick.
        // If so, close the current candlestick and open the next one.
        if (numberOfUpdates % 10 == 9) {
            currentCandlestick.close = _latestPrice;
            currentCandlestick.endingTimestamp = block.timestamp;

            prices[numberOfCandlesticks] = currentCandlestick;
            numberOfCandlesticks = numberOfCandlesticks.add(1);

            emit NewCandlestick(asset, currentCandlestick.startingTimestamp, currentCandlestick.endingTimestamp, currentCandlestick.open, currentCandlestick.close, currentCandlestick.high, currentCandlestick.low);

            // Initialize the next candlestick.
            currentCandlestick = Candlestick({
                asset: asset,
                startingTimestamp: block.timestamp,
                endingTimestamp: 0,
                open: _latestPrice,
                close: 0,
                high: _latestPrice,
                low: _latestPrice
            });
        }

        numberOfUpdates = numberOfUpdates.add(1);
        lastUpdated = block.timestamp;

        emit UpdatedPriceFeed(_latestPrice);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
     * @notice Updates the address of the contract's oracle.
     * @dev This function is meant to be called by the contract owner.
     * @param _newOracle Address of the new oracle contract.
     */
    function setOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "PriceAggregator: Invalid address for new oracle.");

        oracle = _newOracle;

        emit SetOracle(_newOracle);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOracle() {
        require(msg.sender == oracle, "PriceAggregator: Only the pracle can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedPriceFeed(uint256 latestPrice);
    event SetOracle(address oracleAddress);
    event NewCandlestick(string asset, uint256 startingTimestamp, uint256 endingTimestamp, uint256 open, uint256 close, uint256 high, uint256 low);
}