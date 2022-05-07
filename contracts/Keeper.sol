// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Internal references.
import './interfaces/IKeeperRegistry.sol';
import './interfaces/IIndicator.sol';
import './interfaces/IComparator.sol';
import './interfaces/ITradingBot.sol';

// Inheritance.
import './interfaces/IKeeper.sol';

contract Keeper is IKeeper {
    IKeeperRegistry public immutable keeperRegistry;
    address public immutable owner;
    address public dedicatedCaller;

    // Assumes that msg.sender is the KeeperRegistry contract.
    constructor(address _owner, address _dedicatedCaller) {
        require(_owner != address(0), "Keeper: Invalid address for _owner.");

        owner = _owner;
        keeperRegistry = IKeeperRegistry(msg.sender);
        dedicatedCaller = _dedicatedCaller;
    }

     /* ========== VIEWS ========== */

    /**
    * @notice Checks whether the given job can be performed.
    * @dev Gets the job's target contract and calls target.canUpdate().
    * @dev This function is called by a keeper script before performing a job.
    * @dev Returns false if the keeper is not responsible for the given job.
    * @param _jobID The job's ID.
    * @return bool Whether the job can be performed.
    */
    function checkUpkeep(uint256 _jobID) external view override returns (bool) {
        (bool isActive, uint8 jobType,, address jobKeeper, address target, uint256 instanceID) = keeperRegistry.getUpkeepInfo(_jobID);

        if (!isActive || jobKeeper != address(this)) {
            return false;
        }

        if (jobType == 0) {
            return IIndicator(target).canUpdate(instanceID);
        }

        if (jobType == 1) {
            return IComparator(target).canUpdate(instanceID);
        }

        if (jobType == 2) {
            return ITradingBot(target).canUpdate();
        }

        return false;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Performs the given job.
    * @dev Transaction will revert if the keeper is not responsible for the given job.
    * @dev Transaction will revert if the job does not have enough funds to pay the keeper's fee.
    * @dev Charges fee after performing job.
    */
    function performUpkeep(uint256 _jobID) external override onlyDedicatedCaller {
        (bool isActive, uint8 jobType,, address jobKeeper, address target, uint256 instanceID) = keeperRegistry.getUpkeepInfo(_jobID);

        require(isActive, "Keeper: Job is not active.");
        require(jobKeeper == address(this), "Keeper: Not responsible for this job.");
        require(keeperRegistry.checkBudget(_jobID), "Keeper: Job does not have enough funds.");
        require(jobType >= 0 && jobType <= 2, "Keeper: Invalid job type.");

        if (jobType == 0) {
            require(IIndicator(target).update(instanceID), "Keeper: Indicator was not updated successfully.");
        }
        else if (jobType == 1) {
            require(IComparator(target).checkConditions(instanceID), "Keeper: Comparator was not updated successfully.");
        }
        else {
            require(ITradingBot(target).update(), "Keeper: Trading bot was not updated successfully.");
        }

        keeperRegistry.chargeFee(_jobID);

        emit PerformedUpkeep(_jobID);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Updates the keeper's dedicated caller.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _newCaller Address of the new dedicated caller.
    */
    function updateDedicatedCaller(address _newCaller) external override onlyKeeperRegistry {
        dedicatedCaller = _newCaller;

        emit UpdatedDedicatedCaller(_newCaller);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyKeeperRegistry() {
        require(address(keeperRegistry) == msg.sender,
                "Keeper: Only the KeeperRegistry contract can call this function.");
        _;
    }

    modifier onlyDedicatedCaller() {
        require(msg.sender == dedicatedCaller,
                "Keeper: Only the dedicated caller can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedDedicatedCaller(address newCaller);
    event PerformedUpkeep(uint256 jobID);
}