// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Openzeppelin.
import "./openzeppelin-solidity/contracts/SafeMath.sol";
import "./openzeppelin-solidity/contracts/Ownable.sol";
import "./openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "./openzeppelin-solidity/contracts/ERC20/SafeERC20.sol";

// Internal references.
import './interfaces/IKeeper.sol';
import './interfaces/IComponentsRegistry.sol';
import './interfaces/ITradingBotRegistry.sol';
import './interfaces/IIndicator.sol';
import './interfaces/IComparator.sol';
import './interfaces/ITradingBotLogic.sol';
import './Keeper.sol';

// Inheritance.
import './interfaces/IKeeperRegistry.sol';

contract KeeperRegistry is IKeeperRegistry, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 constant MAX_JOBS_PER_KEEPER = 10;
    uint256 constant MAX_KEEPER_FEE = 1e21;
    uint256 constant MAX_FEE_INCREASE = 1e19;
    uint256 constant MIN_TIME_BETWEEN_FEE_CHANGES = 1 days;

    IERC20 immutable feeToken;
    IComponentsRegistry immutable componentsRegistry;
    ITradingBotRegistry immutable tradingBotRegistry;

    // (job ID => job info).
    mapping (uint256 => Upkeep) public upkeeps;

    // (keeper contract address => keeper info).
    mapping (address => KeeperInfo) public keepers;

    // (job ID => available funds).
    // Funds are deducted from a job whenever a keeper performs upkeep on the job.
    mapping (uint256 => uint256) public override availableFunds;

    // (payee => uncollected fees).
    // Fees are added to a payee whenever the keeper associated with the payee performs upkeep on a job.
    mapping (address => uint256) public override availableFees;

    // (user address => address of deployed keeper contract).
    // Limit of 1 deployed keeper contract per user.
    mapping (address => address) public userToKeeper;

    // (keeper contract address => array of job IDs the keeper is responsible for).
    mapping (address => uint256[]) public keeperJobs;

    // (keeper contract address => timestamp).
    mapping (address => uint256) public lastFeeChange;

    // Total number of jobs that have been created.
    // When a job is created, the job's ID is [numberOfJobs] at the time.
    // This ensures job IDs are strictly increasing.
    uint256 public numberOfJobs;

    constructor(address _feeToken, address _componentsRegistry, address _tradingBotRegistry) Ownable() {
        feeToken = IERC20(_feeToken);
        componentsRegistry = IComponentsRegistry(_componentsRegistry);
        tradingBotRegistry = ITradingBotRegistry(_tradingBotRegistry);
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
        KeeperInfo memory keeper = keepers[_keeper];

        uint256[] memory jobs = new uint256[](keeperJobs[_keeper].length);
        for (uint256 i = 0; i < jobs.length; i++) {
            jobs[i] = keeperJobs[_keeper][i];
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
        uint256[] memory jobs = new uint256[](keeperJobs[_keeper].length);
        for (uint256 i = 0; i < jobs.length; i++) {
            jobs[i] = keeperJobs[_keeper][i];
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
    function addFunds(uint256 _jobID, uint256 _amount) external override onlyJobOwner(_jobID) nonReentrant {
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
    function withdrawFunds(uint256 _jobID, uint256 _amount) external override onlyJobOwner(_jobID) nonReentrant {
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
        require(userToKeeper[msg.sender] == address(0), "KeeperRegistry: Already have a keeper contract.");
        require(_caller != address(0), "KeeperRegistry: Invalid address for _caller.");
        require(_payee != address(0), "KeeperRegistry: Invalid address for _payee.");
        require(_fee <= MAX_KEEPER_FEE, "KeeperRegistry: Keeper fee is too high.");

        // Create a Keeper contract.
        address keeperAddress = address(new Keeper(msg.sender, _caller));

        userToKeeper[msg.sender] = keeperAddress;
        keepers[keeperAddress] = KeeperInfo({
            owner: msg.sender,
            caller: _caller,
            payee: _payee,
            fee: _fee
        });

        emit RegisteredKeeper(keeperAddress, msg.sender, _caller, _payee, _fee);
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
    function claimFees(address _keeper) external override onlyPayee(_keeper) nonReentrant {
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
        require(_jobType >= 0 && _jobType <= 2, "KeeperRegistry: Invalid job type.");
        require(keepers[_keeper].owner != address(0), "KeeperRegistry: Invalid keeper.");
        require(keeperJobs[_keeper].length <= MAX_JOBS_PER_KEEPER, "KeeperRegistry: Keeper does not have room for another job.");
        
        // Check if target is valid indicator/comparator/bot.
        // Check if msg.sender owns the instance ID.
        // Check that there's no existing keeper for the target/instance.
        if (_jobType == 0 || _jobType == 1) {
            require(componentsRegistry.checkInfoForUpkeep(msg.sender, _target, _instanceID), "KeeperRegistry: Invalid info for upkeep.");

            if (_jobType == 0) {
                IIndicator(_target).setKeeper(_instanceID, _keeper);
            }
            else {
                IComparator(_target).setKeeper(_instanceID, _keeper);
            }
        }
        else {
            require(tradingBotRegistry.checkInfoForUpkeep(msg.sender, _target), "KeeperRegistry: Invalid info for upkeep.");

            ITradingBotLogic(_target).setKeeper(_keeper);
        }

        uint256 jobID = numberOfJobs.add(1);

        numberOfJobs = jobID;
        keeperJobs[_keeper].push(jobID);
        upkeeps[jobID] = Upkeep({
            isActive: true,
            jobType: _jobType,
            owner: msg.sender,
            keeper: _keeper,
            target: _target,
            instanceID: _instanceID
        });

        emit CreatedJob(_jobType, jobID, msg.sender, _keeper, _target, _instanceID);
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

        // Find the index of the job ID in the keeper's array of jobs.
        uint256 index;
        address keeper = upkeeps[_jobID].keeper;
        uint256 length = keeperJobs[keeper].length;
        for (; index < length; index++) {
            if (keeperJobs[keeper][index] == _jobID) {
                break;
            }
        }

        require(index < length, "KeeperRegistry: Job not found.");

        // Move the job ID at the last index to the index of the job being cancelled.
        keeperJobs[keeper][index] = keeperJobs[keeper][length.sub(1)];
        delete keeperJobs[keeper][length.sub(1)];

        uint256 jobType = upkeeps[_jobID].jobType;
        address target = upkeeps[_jobID].target;
        uint256 instanceID = upkeeps[_jobID].instanceID;
        if (jobType == 0) {
            IIndicator(target).setKeeper(instanceID, address(0));
        }
        else if (jobType == 1) {
            IComparator(target).setKeeper(instanceID, address(0));
        }
        else if (jobType == 2) {
            ITradingBotLogic(target).setKeeper(address(0));
        }

        _withdrawFunds(msg.sender, _jobID, availableFunds[_jobID]);

        emit CanceledJob(_jobID);
    }

    /**
    * @notice Updates the keeper's fee.
    * @dev Only the keeper contract's owner can call this function.
    * @param _keeper Address of the keeper contract.
    * @param _newFee The new keeper fee.
    */
    function updateKeeperFee(address _keeper, uint256 _newFee) external override onlyKeeperOwner(_keeper) {
        require(_newFee <= MAX_KEEPER_FEE, "KeeperRegistry: New fee is too high.");
        require(block.timestamp.sub(lastFeeChange[_keeper]) >= MIN_TIME_BETWEEN_FEE_CHANGES, "KeeperRegistry: Not enough time between fee changes.");

        // Enforce MAX_FEE_INCREASE if the new fee is higher than the current fee.
        if (_newFee > keepers[_keeper].fee) {
            require(_newFee.sub(keepers[_keeper].fee) <= MAX_FEE_INCREASE, "KeeperRegistry: Fee increase is too high.");
        }

        keepers[_keeper].fee = _newFee;
        lastFeeChange[_keeper] = block.timestamp;

        emit UpdatedKeeperFee(_keeper, _newFee);
    }

    /**
    * @notice Charges the keeper fee for the given job.
    * @dev Only a keeper contract can call this function (assumes msg.sender is a keeper contract).
    * @dev Transaction will revert if the keeper is not responsible for the given job.
    * @param _jobID The job ID.
    */
    function chargeFee(uint256 _jobID) external override onlyKeeper(_jobID) nonReentrant {
        address keeper = upkeeps[_jobID].keeper;
        address payee = keepers[keeper].payee;
        uint256 fee = keepers[keeper].fee;

        availableFunds[_jobID] = availableFunds[_jobID].sub(fee);
        availableFees[payee] = availableFees[payee].add(fee);

        emit ChargedFee(_jobID, payee, fee);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

     /**
    * @notice Deducts [_amount] from the job's available funds and transfers [_amount] of fee tokens to [_to].
    * @param _to Address of the user/contract receiving the funds.
    * @param _jobID The job ID.
    * @param _amount Amount of funds to transfer.
    */
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

    modifier onlyKeeper(uint256 _jobID) {
        require(msg.sender == upkeeps[_jobID].keeper,
                "KeeperRegistry: Only the keeper contract can call this function.");
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
    event ChargedFee(uint256 jobID, address payee, uint256 amount);
    event UpdatedKeeperFee(address keeper, uint256 newFee);
    event RegisteredKeeper(address keeper, address owner, address dedicatedCaller, address payee, uint256 fee);
    event CreatedJob(uint8 jobType, uint256 jobID, address owner, address keeper, address target, uint256 instanceID);
}