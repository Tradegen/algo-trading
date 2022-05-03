// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IKeeperRegistry {

    struct Upkeep {
        bool isActive;
        uint8 jobType;
        address owner;
        address keeper;
        address target;
    }

    struct Keeper {
        address owner;
        address caller;
        address payee;
        uint256 fee;
        uint256[] jobs;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the upkeep info for the given job ID.
    * @param _jobID The ID of the job.
    * @return (bool, uint8, address, address, address) Whether the job is active, the job type, the job's owner, the job's keeper, and the target contract address.
    */
    function getUpkeepInfo(uint256 _jobID) external view returns (bool, uint8, address, address, address);

    /**
    * @notice Returns the keeper info for the given keeper contract.
    * @param _keeper Address of the keeper.
    * @return (address, address, address, uint256, uint256[]) Address of the keeper contract's owner, address of the keeper's dedicated caller, address of the keeper fee recipient, fee per upkeep, and an array of job IDs.
    */
    function getKeeperInfo(address _keeper) external view returns (address, address, address, uint256, uint256[] memory);

    /**
    * @notice Returns the amount of funds available for the given job.
    */
    function checkBudget(uint256 _jobID) external view returns (uint256);

    /**
    * @notice Returns the amount of fees available for the given payee.
    */
    function availableFees(address _payee) external view returns (uint256);

    /**
    * @notice Returns the address of the given job's keeper contract.
    */
    function getJobKeeper(uint256 _jobID) external view returns (address);

    /**
    * @notice Returns ID of each job the given keeper is responsible for.
    * @dev Returns an empty array if the keeper is not registered or doesn't have any jobs.
    */
    function getAvailableJobs(address _keeper) external view returns (uint256[] memory);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Adds funds to the given job.
    * @dev Only the job's owner can call this function.
    * @param _jobID The ID of the job.
    * @param _amount Number of tokens to transfer.
    */
    function addFunds(uint256 _jobID, uint256 _amount) external;

    /**
    * @notice Withdraws funds from the given job.
    * @dev Only the job's owner can call this function.
    * @param _jobID The ID of the job.
    * @param _amount Number of tokens to withdraw.
    */
    function withdrawFunds(uint256 _jobID, uint256 _amount) external;

    /**
    * @notice Registers a new keeper to the platform.
    * @dev This function deploys a new Keeper contract.
    * @dev This function can only be called once per user.
    * @param _caller Address of the Keeper contract's dedicated caller.
    * @param _payee Address of the user/contract that can claim keeper fees.
    * @param _fee Fee to charge whenever an upkeep is performed.
    */
    function registerKeeper(address _caller, address _payee, uint256 _fee) external;

    /**
    * @notice Updates the fee recipient for the given keeper contract.
    * @dev This function can only be called by the keeper contract's owner.
    * @param _keeper Address of the keeper contract.
    * @param _newPayee Address of the new fee recipient.
    */
    function updatePayee(address _keeper, address _newPayee) external;

    /**
    * @notice Claims all available fees for the given keeper contract.
    * @dev Only the keeper contract's payee can call this function.
    * @param _keeper Address of the keeper contract.
    */
    function claimFees(address _keeper) external;

    /**
    * @notice Creates a new job.
    * @dev Only the owner of the indicator/comaprator/bot can call this function.
    * @param _jobType The job type; 0 = indicator, 1 = comparator, 2 = trading bot.
    * @param _keeper Address of the keeper contract.
    * @param _target Address of the indicator/comparator/bot contract.
    */
    function createJob(uint8 _jobType, address _keeper, address _target) external;

    /**
    * @notice Cancels a job.
    * @dev Only the job's owner can call this function.
    * @dev Any outstanding funds for the job are returned to the job's owner.
    * @param _jobID The job ID.
    */
    function cancelJob(uint256 _jobID) external;

    /**
    * @notice Updates the keeper's fee.
    * @dev Only the keeper contract's owner can call this function.
    * @param _keeper Address of the keeper contract.
    * @param _newFee The new keeper fee.
    */
    function updateKeeperFee(address _keeper, uint256 _newFee) external;

    /**
    * @notice Charges the keeper fee for the given job.
    * @dev Only a keeper contract can call this function (assumes msg.sender is a keeper contract).
    * @dev Transaction will revert if the keeper is not responsible for the given job.
    * @param _jobID The job ID.
    */
    function chargeFee(uint256 _jobID) external;
}