// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '../contracts/Trading.sol';

struct DepositRequest{
    address investor;
    uint amount;
}

struct WithdrawalRequest{
    address investor;
    uint investmentNumber;
    uint amount;
}

contract RequestAction is Ownable {
    
    ERC20 internal immutable USDC_CONTRACT;
    Trading internal immutable tradingContract;
    uint ID;
    DepositRequest[] internal depositRequests;
    WithdrawalRequest[] internal withdrawalRequests;
    

    event userDepositRequest (address user, uint amount);
    event userDepositCanceled (uint requestNumber);

    event userWithdrawalRequest (address user, uint amount, uint investmentNumber);
    event userWithdrawalCanceled (uint requestNumber);

    constructor(address _tradingAddress, address _USDC_ADDRESS){
        tradingContract = Trading(payable(_tradingAddress));
        USDC_CONTRACT = ERC20(_USDC_ADDRESS);
    }

    function approveUSDC() external onlyOwner {
        USDC_CONTRACT.approve(address(tradingContract), type(uint256).max);
    }

    function requestDeposit(uint amount) external {
        require(amount >= 100*10**6 && USDC_CONTRACT.allowance(msg.sender, address(this)) >= amount, "Insufficient amount or allowance.");
        
        USDC_CONTRACT.transferFrom(msg.sender, owner(), amount*2/100);
        USDC_CONTRACT.transferFrom(msg.sender, address(this), amount*98/100);

        amount = amount *98/100;

        DepositRequest memory tmp = DepositRequest(msg.sender, amount);

        depositRequests.push(tmp);
        emit userDepositRequest(msg.sender, amount);
    }

    function cancelDepositRequest(uint requestNumber) external {
        require(depositRequests[requestNumber].investor == msg.sender,"You can only cancel your own requests.");

        USDC_CONTRACT.transfer(msg.sender, depositRequests[requestNumber].amount);
        delete depositRequests[requestNumber];

        emit userDepositCanceled(requestNumber);
    }

    function executeDeposit(uint requestNumber) external onlyOwner {
        tradingContract.depositTroughtRequest(depositRequests[requestNumber].amount, depositRequests[requestNumber].investor);
    }

    function requestWithdrawal(uint256 amount, uint256 investmentNumber) external {
        Investment memory tmp = tradingContract.getUserInvestments(msg.sender)[investmentNumber];

        require(tmp.userOwnership >= amount, "Insufficient ownership points.");

        WithdrawalRequest memory withdrawalRequest = WithdrawalRequest(msg.sender, investmentNumber, amount);

        withdrawalRequests.push(withdrawalRequest);

        emit userWithdrawalRequest(msg.sender, amount, investmentNumber);
    }

    function cancelWithdrawalRequest(uint requestNumber) external {
        require(withdrawalRequests[requestNumber].investor == msg.sender,"You can only cancel your own requests.");

        delete withdrawalRequests[requestNumber];

        emit userWithdrawalCanceled(requestNumber);
    }

    function executeWithdrawal(uint requestNumber) external onlyOwner {
        tradingContract.withdrawTroughtRequest(withdrawalRequests[requestNumber].amount, withdrawalRequests[requestNumber].investor,withdrawalRequests[requestNumber].investmentNumber);
    }


    function getAllDepositRequests() external view returns(DepositRequest[] memory) {
        return depositRequests;
    }

    function getAllWithdrawalRequests() external view returns(WithdrawalRequest[] memory) {
        return withdrawalRequests;
    }

}
