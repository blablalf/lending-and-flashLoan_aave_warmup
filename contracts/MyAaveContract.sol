// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.6.6;

import {IExerciceSolution} from './IExerciceSolution.sol';
import {ERC20} from './ERC20.sol';
import {IFlashLoanSimpleReceiver} from './IFlashLoanSimpleReceiver.sol';
import {IPoolAddressesProvider} from './IPoolAddressesProvider.sol';
import {IPool} from './IPool.sol';

contract MyAaveContract is IExerciceSolution, IFlashLoanSimpleReceiver {
    IPoolAddressesProvider private iPoolAddressesProvider;
    IPool private pool;
    ERC20 private token;
    ERC20 private aToken;
    ERC20 private borrowToken;

    constructor(address _tokenAddress, address _aTokenAddress, address _borrowTokenAddress, address _poolAddressesProviderAddress) public {
        iPoolAddressesProvider = IPoolAddressesProvider(_poolAddressesProviderAddress);
        pool = IPool(iPoolAddressesProvider.getPool());
        aToken = ERC20(_aTokenAddress);
        token = ERC20(_tokenAddress);
        borrowToken = ERC20(_borrowTokenAddress);
    }

    function withdrawAallTokens() external {
        token.transfer(msg.sender, token.balanceOf(address(this)));
        aToken.transfer(msg.sender, aToken.balanceOf(address(this)));
        borrowToken.transfer(msg.sender, borrowToken.balanceOf(address(this)));
    }

    function depositSomeTokens() external override {
        token.approve(address(pool), token.balanceOf(address(this)));
        pool.supply(address(token), token.balanceOf(address(this)), address(this), 0);
    }

	function withdrawSomeTokens() external override {
        pool.withdraw(address(token), aToken.balanceOf(address(this)), address(this));
    }

	function borrowSomeTokens() external override {
        pool.borrow(
            address(borrowToken),
            ((aToken.balanceOf(address(this))/(10 ** (uint256)(aToken.decimals()) * 10)) / 100) * 10 ** (uint256)(borrowToken.decimals()),
            2,
            0,
            address(this)
        );
    }

	function repaySomeTokens() external override {
        borrowToken.approve(address(pool), borrowToken.balanceOf(address(this)));
        pool.repay(address(borrowToken), borrowToken.balanceOf(address(this)), 2, address(this));
    }

	function doAFlashLoan() external override {
        pool.flashLoanSimple(
            address(this),
            address(borrowToken),
            1000000 * 10 ** (uint256)(borrowToken.decimals()), 
            "", 
            0
        );
    }

	function repayFlashLoan() external override {}

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(amount == 1000000 * 10 ** (uint256)(borrowToken.decimals()), "Invalid amount");
        require(amount <= borrowToken.balanceOf(address(this)), "Amount not present into the contract");
        uint totalDebt = amount + premium;
        borrowToken.approve(address(pool), totalDebt);

        // Do something with the borrowed tokens
    }

    function ADDRESSES_PROVIDER() external view override returns (IPoolAddressesProvider) {
        return iPoolAddressesProvider;
    }

    function POOL() external view override returns (IPool) {
        return pool;
    }
}