// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

struct Investment {
    uint256 userOwnership;
    uint256 initialInvestment;
    uint256 annualFeeColectedTime;
}

contract Trading is Ownable {
    ERC20 internal immutable USDC_CONTRACT;
    uint256 internal MAX_ASSETS_DEPOSITED;
    mapping(address => Investment[]) internal userRecord;
    uint256 internal totalUserOwnershipPoints;
    address [] internal liquidityPools;

    event userDeposit (address user, Investment investment);
    event withdrawnFromInvestment (address user, Investment investment, uint256 amount);
    event feeCollected(address user, Investment newInvestment);

    constructor (address _USDC_ADDRESS, address[] memory _liquidityPools) {
        USDC_CONTRACT = ERC20(_USDC_ADDRESS);
        MAX_ASSETS_DEPOSITED = 10000000*10**18;
        liquidityPools = _liquidityPools;

        //rucno na kontrakt poslati 100k USDC posle deploya.
        Investment memory tmp = Investment(1000000000, 100000*10**18, block.timestamp);
        userRecord[msg.sender].push(tmp);
        totalUserOwnershipPoints = 1000000000;
    }

    //USER FUNCTIONS

    function deposit(uint256 amount) external {
        require(amount > 100*10**18 && USDC_CONTRACT.allowance(msg.sender, address(this)) >= amount, "Insufficient amount or allowance.");
        require(getContractValue() + amount*10**18 <= MAX_ASSETS_DEPOSITED *10**18, "This deposit would exceed our limit.");
        
        USDC_CONTRACT.transferFrom(msg.sender, owner(), amount*2/100);
        USDC_CONTRACT.transferFrom(msg.sender, address(this), amount*98/100);

        amount = amount *98/100;

        uint256 newtotalUserOwnershipPoints = totalUserOwnershipPoints * getContractValue()  / (getContractValue() - amount);
        uint256 userOwnershipPoints = newtotalUserOwnershipPoints - totalUserOwnershipPoints;
        
        totalUserOwnershipPoints = newtotalUserOwnershipPoints;
        
        Investment memory investment = Investment(userOwnershipPoints, amount, block.timestamp);
        userRecord[msg.sender].push(investment);
        
        emit userDeposit(msg.sender, investment);
    }

    function withdraw(uint256 amount, uint256 investmentNumber) external {
        Investment storage investment = userRecord[msg.sender][investmentNumber];
        
        require(amount <= investment.userOwnership, "Insufficient ownership points.");
        
        uint256 profit = 0;
        uint256 userUSDC = getContractValue() * investment.userOwnership / totalUserOwnershipPoints;
        
        if(investment.initialInvestment < userUSDC ) profit = userUSDC - investment.initialInvestment;
        
        uint256 toBeWithdrawn = userUSDC * amount / investment.userOwnership;
        
        uint platformCut = 0;
        if(profit != 0) platformCut = profit * 20 / 100 * amount / investment.userOwnership;

        investment.initialInvestment = investment.initialInvestment * ((amount * 1000000000  / investment.userOwnership)/10000000) / 100 ;
        investment.userOwnership -= amount;
        totalUserOwnershipPoints -= amount;
        
        USDC_CONTRACT.transfer(owner(), platformCut);
        USDC_CONTRACT.transfer(msg.sender, toBeWithdrawn - platformCut);

        emit withdrawnFromInvestment(msg.sender, investment, amount);
    }

    //TRADING FUNCTIONS
    //TODO
    function swapTokens(uint256 amount, address liquidityPool, bool _type) external onlyOwner{

    }

    //TODO
    function enterLong(uint256 amount, address pair) external onlyOwner{

    }

    //TODO
    function enterShort(uint256 amount, address pair) external onlyOwner{

    }

    //TODO
    function closePosition(uint256 amount, address pair) external onlyOwner {
        
    }

    //UTILS
    //TODO
    function getAllPositionValue() public pure returns(uint256) {
        return 0;
    }
    
    function getContractValue() public view returns(uint256){
        return USDC_CONTRACT.balanceOf(address(this)) + getAllPositionValue();
    }

    function collectFees(address user, uint256 investmentNumber) external onlyOwner {
        Investment storage investment = userRecord[user][investmentNumber];
        
        require(investment.annualFeeColectedTime + 365 days < block.timestamp, "Cannot collect this investment fee at the moment.");
        
        uint256 profit = 0;
        uint256 userUSDC = getContractValue() * investment.userOwnership / totalUserOwnershipPoints;
        
        if(investment.initialInvestment < userUSDC ) profit = userUSDC - investment.initialInvestment;
        
        if(profit != 0) {
            USDC_CONTRACT.transfer(owner(), profit * 20 / 100);
            userUSDC -= profit;
        }
        
        USDC_CONTRACT.transfer(owner(), userUSDC * 2 / 100);
        userUSDC = userUSDC * 98 / 100;

        totalUserOwnershipPoints -= investment.userOwnership;

        delete userRecord[user][investmentNumber];

        uint256 newtotalUserOwnershipPoints = totalUserOwnershipPoints * getContractValue()  / (getContractValue() - userUSDC);
        uint256 userOwnershipPoints = newtotalUserOwnershipPoints - totalUserOwnershipPoints;
        
        totalUserOwnershipPoints = newtotalUserOwnershipPoints;
        
        Investment memory newInvestment = Investment(userOwnershipPoints, userUSDC, block.timestamp);
        userRecord[user].push(newInvestment);

        emit feeCollected(user, newInvestment);
    }

    //SETTERS
    
    function setMaxAssetsDeposited(uint256 amount) external onlyOwner {
        MAX_ASSETS_DEPOSITED = amount;
    }

    //GETTERS
    function getUserInvestments(address user) external view returns(Investment[] memory){
        return userRecord[user];
    }

    function gettotalUserOwnershipPoints() external view returns(uint256){
        return totalUserOwnershipPoints;
    }

    function getUSDCValueFromInvestment(address user, uint256 investmentNumber) external view returns (uint256){
        Investment storage investment = userRecord[user][investmentNumber];
        
        uint256 userUSDC = getContractValue() * investment.userOwnership / totalUserOwnershipPoints;
        return userUSDC;
    }
}