// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "../openzeppelin-solidity/contracts/ERC20/ERC20.sol";

contract TradegenToken is ERC20 {
    address public immutable teamEscrow;
    address public immutable investorEscrow;
    address public immutable insuranceFund;
    address public immutable developmentFund;
    address public immutable communityFund;
    address public immutable seedLiquiditySupplier;
    address public immutable crossChainLiquidityEscrow;
    address public immutable liquidityMiningEscrow;
    address public immutable poolFarmingEscrow;

    // Total supply will be 1 billion.
    constructor(address _teamEscrow,
                address _investorEscrow,
                address _insuranceFund,
                address _developmentFund,
                address _communityFund,
                address _seedLiquiditySupplier,
                address _crossChainLiquidityEscrow,
                address _liquidityMiningEscrow,
                address _poolFarmingEscrow) ERC20("Tradegen", "TGEN") {
        _mint(_teamEscrow, 50 * 1e24);
        _mint(_investorEscrow, 50 * 1e24);
        _mint(_insuranceFund, 50 * 1e24);
        _mint(_developmentFund, 50  * 1e24);
        _mint(_communityFund, 100 * 1e24);
        _mint(_seedLiquiditySupplier, 1 * 1e24);
        _mint(_liquidityMiningEscrow, 199 * 1e24);
        _mint(_crossChainLiquidityEscrow, 200 * 1e24);
        _mint(_poolFarmingEscrow, 300 * 1e24);

        teamEscrow = _teamEscrow;
        investorEscrow = _investorEscrow;
        insuranceFund = _insuranceFund;
        developmentFund = _developmentFund;
        communityFund = _communityFund;
        seedLiquiditySupplier = _seedLiquiditySupplier;
        crossChainLiquidityEscrow = _crossChainLiquidityEscrow;
        liquidityMiningEscrow = _liquidityMiningEscrow;
        poolFarmingEscrow = _poolFarmingEscrow;
    }
}