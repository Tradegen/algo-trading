// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Internal references.
import './interfaces/IKeeper.sol';
import './Keeper.sol';

// Inheritance.
import './interfaces/IKeeperRegistry.sol';

contract KeeperRegsitry is IKeeperRegistry, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public constant MAX_JOBS_PER_KEEPER = 10;

    IERC20 public immutable feeToken;

    mapping (uint256 => Upkeep) public upkeeps;
    mapping (address => Keeper) public keepers;
    mapping (uint256 => uint256) public override availableFunds;
    mapping (address => uint256) public override availableFees;
    mapping (address => address) public userToKeeper;
    uint256 public numberOfJobs;

    constructor(address _feeToken) Ownable() {
        feeToken = IERC20(_feeToken);
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the upkeep info for the given job ID.
    * @dev Instance ID is not used if the target contract is a trading bot.
    * @dev Returns 0 for each value if the job ID is not valid.
    * @param _jobID The ID of the job.
    * @return (bool, uint8, address, address, address, uint256) Whether the job is active, the job type, the job's owner, the job's keeper, the target contract address, and the instance ID.
    */
    function getUpkeepInfo(uint256 _jobID) external view override returns (bool, uint8, address, address, address, uint256) {
        // Gas savings.
        Upkeep memory upkeep = upkeeps[_jobID];

        return (upkeep.isActive, upkeep.jobType, upkeep.owner, upkeep.keeper, upkeep.target, upkeep.instanceID);
    }

    /**
    * @notice Returns the keeper info for the given keeper contract.
    * @param _keeper Address of the keeper.
    * @return (address, address, address, uint256, uint256[]) Address of the keeper contract's owner, address of the keeper's dedicated caller, address of the keeper fee recipient, fee per upkeep, and an array of job IDs.
    */
    function getKeeperInfo(address _keeper) external view override returns (address, address, address, uint256, uint256[] memory) {
        // Gas savings.
        Keeper memory keeper = keepers[_keeper];

        uint256[] memory jobs = new uint256[](keeper.jobs.length);
        for (uint256 i = 0; i < jobs.length; i++) {
            jobs[i] = keeper.jobs[i];
        }

        return (keeper.owner, keeper.caller, keeper.payee, keeper.fee, jobs);
    }

    /**
    * @notice Returns whether the given job has enough funds to pay the keeper fee.
    */
    function checkBudget(uint256 _jobID) external view override returns (bool) {
        address keeper = upkeeps[_jobID].keeper;
        uint256 fee = keepers[keeper].fee;

        return availableFunds[_jobID] >= fee;
    }

    /**
    * @notice Returns the address of the given job's keeper contract.
    */
    function getJobKeeper(uint256 _jobID) external view override returns (address) {
        return upkeeps[_jobID].keeper;
    }

    /**
    * @notice Returns ID of each job the given keeper is responsible for.
    * @dev Returns an empty array if the keeper is not registered or doesn't have any jobs.
    */
    function getAvailableJobs(address _keeper) external view override returns (uint256[] memory) {
        // Gas savings.
        Keeper memory keeper = keepers[_keeper];

        uint256[] memory jobs = new uint256[](keeper.jobs.length);
        for (uint256 i = 0; i < jobs.length; i++) {
            jobs[i] = keeper.jobs[i];
        }

        return jobs;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Adds funds to the given job.
    * @dev Only the job's owner can call this function.
    * @param _jobID The ID of the job.
    * @param _amount Number of tokens to transfer.
    */
    function addFunds(uint256 _jobID, uint256 _amount) external override onlyJobOwner(_jobID) {
        availableFunds[_jobID] = availableFunds[_jobID].add(_amount);
        feeToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit AddedFunds(_jobID, msg.sender, _amount);
    }

    /**
    * @notice Withdraws funds from the given job.
    * @dev Only the job's owner can call this function.
    * @param _jobID The ID of the job.
    * @param _amount Number of tokens to withdraw.
    */
    function withdrawFunds(uint256 _jobID, uint256 _amount) external override onlyJobOwner(_jobID) {
        _withdrawFunds(msg.sender, _jobID, _amount);
    }

    /**
    * @notice Registers a new keeper to the platform.
    * @dev This function deploys a new Keeper contract.
    * @dev This function can only be called once per user.
    * @param _caller Address of the Keeper contract's dedicated caller.
    * @param _payee Address of the user/contract that can claim keeper fees.
    * @param _fee Fee to charge whenever an upkeep is performed.
    */
    function registerKeeper(address _caller, address _payee, uint256 _fee) external override {
        //TODO
    }

    /**
    * @notice Updates the fee recipient for the given keeper contract.
    * @dev This function can only be called by the keeper contract's owner.
    * @param _keeper Address of the keeper contract.
    * @param _newPayee Address of the new fee recipient.
    */
    function updatePayee(address _keeper, address _newPayee) external override onlyKeeperOwner(_keeper) {
        keepers[_keeper].payee = _newPayee;

        emit UpdatedPayee(_keeper, _newPayee);
    }

    /**
    * @notice Claims all available fees for the given keeper contract.
    * @dev Only the keeper contract's payee can call this function.
    * @param _keeper Address of the keeper contract.
    */
    function claimFees(address _keeper) external override onlyPayee(_keeper) {
        address payee = keepers[_keeper].payee;
        uint256 amount = availableFees[_keeper];

        availableFees[_keeper] = 0;
        feeToken.safeTransfer(payee, amount);

        emit ClaimedFees(_keeper, payee, amount);
    }

    /**
    * @notice Creates a new job.
    * @dev Only the owner of the indicator/comaprator/bot can call this function.
    * @param _jobType The job type; 0 = indicator, 1 = comparator, 2 = trading bot.
    * @param _keeper Address of the keeper contract.
    * @param _target Address of the indicator/comparator/bot contract.
    * @param _instanceID Instance ID of the indicator/comparator.
    */
    function createJob(uint8 _jobType, address _keeper, address _target, uint256 _instanceID) external override {
        //TODO
    }

    /**
    * @notice Cancels a job.
    * @dev Only the job's owner can call this function.
    * @dev Any outstanding funds for the job are returned to the job's owner.
    * @param _jobID The job ID.
    */
    function cancelJob(uint256 _jobID) external override onlyJobOwner(_jobID) {
        upkeeps[_jobID].isActive = false;
        upkeeps[_jobID].owner = address(0);

        _withdrawFunds(msg.sender, _jobID, availableFunds[_jobID]);

        //TODO: Remove jobID from keeper's list of jobs.

        emit CanceledJob(_jobID);
    }

    /**
    * @notice Updates the keeper's fee.
    * @dev Only the keeper contract's owner can call this function.
    * @param _keeper Address of the keeper contract.
    * @param _newFee The new keeper fee.
    */
    function updateKeeperFee(address _keeper, uint256 _newFee) external override {
        //TODO
    }

    /**
    * @notice Charges the keeper fee for the given job.
    * @dev Only a keeper contract can call this function (assumes msg.sender is a keeper contract).
    * @dev Transaction will revert if the keeper is not responsible for the given job.
    * @param _jobID The job ID.
    */
    function chargeFee(uint256 _jobID) external override {
        //TODO
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _withdrawFunds(address _to, uint256 _jobID, uint256 _amount) internal {
        availableFunds[_jobID] = availableFunds[_jobID].sub(_amount);
        feeToken.safeTransfer(_to, _amount);

        emit WithdrewFunds(_jobID, _to, _amount);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyJobOwner(uint256 _jobID) {
        require(msg.sender == upkeeps[_jobID].owner,
                "KeeperRegistry: Only the job owner can call this function.");
        _;
    }

    modifier onlyKeeperOwner(address _keeper) {
        require(msg.sender == keepers[_keeper].owner,
                "Keeper: Only the keeper owner can call this function.");
        _;
    }

    modifier onlyPayee(address _keeper) {
        require(msg.sender == keepers[_keeper].payee,
                "Keeper: Only the keeper's payee can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event AddedFunds(uint256 jobID, address from, uint256 amount);
    event WithdrewFunds(uint256 jobID, address to, uint256 amount);
    event UpdatedPayee(address keeper, address newPayee);
    event ClaimedFees(address keeper, address payee, uint256 amount);
    event CanceledJob(uint256 jobID);
}