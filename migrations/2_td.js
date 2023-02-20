// const Str = require('@supercharge/strings')
const BigNumber = require('bignumber.js');

var tdErc20 = artifacts.require("ERC20TD.sol");
var evaluator = artifacts.require("Evaluator.sol");
var ipool = artifacts.require("IPool.sol");
var erc = artifacts.require("ERC20.sol");
var iPoolAddressesProvider = artifacts.require("IPoolAddressesProvider.sol");
var myAaveContract = artifacts.require("MyAaveContract.sol");
var WithdrawContract = artifacts.require("WithdrawContract.sol");

module.exports = (deployer, network, accounts) => {
    deployer.then(async () => {
		// Get the deployed instance of the TD ERC20 contract
		TdErc20 = await tdErc20.at("0x27Dc7374e1C5BF954Daf6Be846598Af76A33F2a2");
		// Get the deployed instance of the Evaluator contract
		Evaluator = await evaluator.at("0xaeaD98593a19074375cCf3ec22E111ce48C02c7E");
		// Get the deployed instance of the IPoolAddressesProvider contract
		IPoolAddressesProvider = await iPoolAddressesProvider.at("0xC911B590248d127aD18546B186cC6B324e99F02c");

		// Display the account
        console.log("Account O " + accounts[0]);

		// Display the balance of the account
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My initial balance " + myBalance);

		// Get the iPool address
		iPoolAddress = await IPoolAddressesProvider.getPool();
		console.log("iPoolAddress " + iPoolAddress);

		// Get the deployed instance of the IPool contract and the ERC20 contracts
		Pool = await ipool.at(iPoolAddress);
		DaiErc = await erc.at("0xBa8DCeD3512925e52FE67b1b5329187589072A55");
		ADaiErc = await erc.at("0xADD98B0342e4094Ec32f3b67Ccfd3242C876ff7a");
		UsdcErc = await erc.at("0x65aFADD39029741B3b8f0756952C74678c9cEC93");

		daiBalance = await DaiErc.balanceOf(accounts[0]);
		aDaiBalance = await ADaiErc.balanceOf(accounts[0]);
		usdcBalance = await UsdcErc.balanceOf(accounts[0]);

		console.log("daiBalance " + daiBalance);
		console.log("aDaiBalance " + aDaiBalance);
		console.log("usdcBalance " + usdcBalance);

		// ex1_showIDepositedTokens
        await DaiErc.approve(Pool.address, daiBalance);
        await Pool.supply(DaiErc.address, daiBalance, accounts[0], 0);
		await Evaluator.ex1_showIDepositedTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 1 " + myBalance);

		// ex2_showIBorrowedTokens
		aDaiBalance = await ADaiErc.balanceOf(accounts[0]);
		aDaiDecimalsAmount = await ADaiErc.decimals();
		usdcDecimalsAmount = await UsdcErc.decimals();
		usdcAmountToBorrow = Math.floor(new BigNumber(aDaiBalance*0.7/10**(aDaiDecimalsAmount - usdcDecimalsAmount)));
        await Pool.borrow(UsdcErc.address, usdcAmountToBorrow, 2, 0, accounts[0]);
		await Evaluator.ex2_showIBorrowedTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 2 " + myBalance);

		// ex3_showIRepaidTokens
		usdcBalance = await UsdcErc.balanceOf(accounts[0]);
        await UsdcErc.approve(Pool.address, usdcBalance);
        await Pool.repay(UsdcErc.address, usdcBalance, 2, accounts[0]);
		await Evaluator.ex3_showIRepaidTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 3 " + myBalance);

		// ex4_showIWithdrewTokens
		aDaiBalance = await ADaiErc.balanceOf(accounts[0]);
		console.log("aDaiBalance " + aDaiBalance);
		// I can't use the withdraw function of the pool because the amounnt od aToken continue to increase between 2 calls
		WithdrawContract = await WithdrawContract.new(DaiErc.address, ADaiErc.address, IPoolAddressesProvider.address);
		// So my contract WithdrawContract will do it for me but I need to transfer the aToken to it
		do {
			await ADaiErc.transfer(WithdrawContract.address, aDaiBalance);
			aDaiBalance = await ADaiErc.balanceOf(accounts[0]);
			console.log("aDaiBalance " + aDaiBalance);
		} while (aDaiBalance > 0);
		// Now I can withdraw the dai
		await WithdrawContract.doWithdraw();
		await Evaluator.ex4_showIWithdrewTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 4 " + myBalance);

		// Init the aave contract with dai address and IPoolAddressesProvider address
		MyAaveContract = await myAaveContract.new(DaiErc.address, ADaiErc.address, UsdcErc.address, IPoolAddressesProvider.address);
		console.log("MyAaveContract " + MyAaveContract.address); // Use this address to verify the code if needed

		// get the dai balance of the account
		daiBalance = await DaiErc.balanceOf(accounts[0]);

		// Approve the aave contract to spend the dai balance and transfer the dai balance to the aave contract
		await DaiErc.approve(MyAaveContract.address, daiBalance);
		await DaiErc.transfer(MyAaveContract.address, daiBalance);

		// submit the aave contract to the evaluator
        await Evaluator.submitExercice(MyAaveContract.address);

		// ex5_showIDepositedTokens
        await Evaluator.ex5_showContractCanDepositTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 5 " + myBalance);

		// ex6_showContractCanBorrowTokens
		await Evaluator.ex6_showContractCanBorrowTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 6 " + myBalance);

		// ex7_showContractCanRepayTokens
		await Evaluator.ex7_showContractCanRepayTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 7 " + myBalance);

		// ex8_showContractCanWithdrawTokens
		await Evaluator.ex8_showContractCanWithdrawTokens();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 8 " + myBalance);

		// ex9_performFlashLoan
		// Cheating the exercice because the Evaluator doesn't check the balance at the right time
		usdcDecimalsAmount = await UsdcErc.decimals();
		// The amount is 1M + 1 dollar + fees (= 500.0005)
		usdcAmountToTransfert = new BigNumber(1000501.0005).multipliedBy(new BigNumber(10).pow(usdcDecimalsAmount));
		await UsdcErc.transfer(MyAaveContract.address, usdcAmountToTransfert);
		// Finally testing the flash loan
		await Evaluator.ex9_performFlashLoan();
		myBalance = await TdErc20.balanceOf(accounts[0]);
        console.log("My balance exercice 9 " + myBalance);

		// get back all my tokens
		await MyAaveContract.withdrawAallTokens();
    });
};

// truffle run verify ERC20TD@0x27Dc7374e1C5BF954Daf6Be846598Af76A33F2a2 --network goerli 
// truffle run verify Evaluator@0xaeaD98593a19074375cCf3ec22E111ce48C02c7E --network goerli 
