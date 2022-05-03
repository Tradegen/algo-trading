// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IKeeper {

    /* ========== VIEWS ========== */

    /**
    * @notice Checks whether the given job can be performed.
    * @dev Gets the job's target contract and calls target.canUpdate().
    * @dev This function is called by a keeper script before performing a job.
    * @dev Returns false if the keeper is not responsible for the given job.
    * @param _jobID The job's ID.
    * @return bool Whether the job can be performed.
    */
    function checkUpkeep(uint256 _jobID) external view returns (bool);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Performs the given job.
    * @dev Transaction will revert if the keeper is not responsible for the given job.
    * @dev Transaction will revert if the job does not have enough funds to pay the keeper's fee.
    * @dev Charges fee after performing job.
    */
    function performUpkeep(uint256 _jobID) external;

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Updates the keeper's dedicated caller.
    * @dev This function can only be called by the KeeperRegistry contract.
    * @param _newCaller Address of the new dedicated caller.
    */
    function updateDedicatedCaller(address _newCaller) external;
}