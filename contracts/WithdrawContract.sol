// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.6.6;

import {ERC20} from './ERC20.sol';
import {IPoolAddressesProvider} from './IPoolAddressesProvider.sol';
import {IPool} from './IPool.sol';

contract WithdrawContract {
    IPool private pool;
    ERC20 private token;
    ERC20 private aToken;
    constructor(address _tokenAddress, address _aTokenAddress, address _poolAddressesProviderAddress) public {
        token = ERC20(_tokenAddress);
        aToken = ERC20(_aTokenAddress);
        pool = IPool(IPoolAddressesProvider(_poolAddressesProviderAddress).getPool());
    }

    function doWithdraw() external {
        pool.withdraw(address(token), aToken.balanceOf(address(this)), address(this));
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }
}
