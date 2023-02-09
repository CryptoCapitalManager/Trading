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

/// @author Crypto Capital Manager
/// @title Trading
contract Trading is Ownable {
    ERC20 internal immutable USDC_CONTRACT;
    uint256 internal MAX_ASSETS_DEPOSITED;
    mapping(address => Investment[]) internal userRecord;
    uint256 internal totalUserOwnershipPoints;
    address [] internal liquidityPools;

    /**
     * @notice This event is emitted when a user deposit occurs. 
     * @param user The source account.
     * @param investment The investment struct that is created for the user.
     * @dev This event is being emitted so we can listen for it on the backend service and update our database.
     */
    event userDeposit (address user, Investment investment);

    /**
     * @notice This event is emitted when a user withdraws assets from his investment.
     * @param user The source account.
     * @param investment The investment struct that the user is withdrawing from.
     * @dev This event is being emitted so we can listen for it on the backend service and update our database.
     */
    event withdrawnFromInvestment (address user, Investment investment, uint256 amount);

    /**
     * @param user The user account that we are getting our fees from.
     * @param newInvestment The investment struct that will be replacing the investment we took fees from.
     * @dev This event is being emitted so we can listen for it on the backend service and update our database.
     */
    event feeCollected(address user, Investment newInvestment);

    /**
     * @param _USDC_ADDRESS Smart contract address of the USDC.
     * @param _liquidityPools An array of all liquidity pools we will be able to interact with.
     * @dev In the constructor, we are setting `USDC_CONTRACT`, `MAX_ASSETS_DEPOSITED` and `liquidityPools` variables. 
     * After contract deployment, we should manually send 100k USDC tokens to the contract from the account that deployed the contract.
     * With this little compromise we were able to implement much more gas-efficient logic in our smart contract.
     */
    constructor (address _USDC_ADDRESS, address[] memory _liquidityPools) {
        USDC_CONTRACT = ERC20(_USDC_ADDRESS);
        MAX_ASSETS_DEPOSITED = 10000000*10**18;
        liquidityPools = _liquidityPools;

        //Manually send 100k USDC tokens to the contract from the account that deployed the contract
        Investment memory tmp = Investment(1000000000, 100000*10**18, block.timestamp);
        userRecord[msg.sender].push(tmp);
        totalUserOwnershipPoints = 1000000000;
    }

    //USER FUNCTIONS

    /**
     * @notice Deposit your USDC to our smart contract.
     * @param amount The amount of USDC the user is willing to deposit.
     * @dev After a user passes all the requirements we are calculating his userOwnershipPoints for that investment.
     * Variable `userOwnershipPoints` represents the percentage of ownership of the contract's assets when compared to the variable `totalUserOwnershipPoints`.
     * After that, we are creating an investment that consists of `userOwnershipPoints` we calculated, `amount` of USDC tokens that is being invested, 
     * and the current block height (`block.timestamp`) that we later use when we want to charge our annual fee.
     */
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

    /**
     * @notice Withdraw your USDC from our smart contract.
     * @param amount The number of userOwnershipPoints the user is willing to liquidate from his investment.
     * @param investmentNumber A number of investment that the user is withdrawing from.
     * @dev After a user passes all the requirements we are calculating if there was any profit being made in his `investment` lifespan.
     * We are calculating `toBeWithdrawn` based on the `amount` user has provided. 
     * Lowering the `initialInvestment` amount of the `investment` based on how much the user withdrew from the `investment`, 
     * also buring `amount` of userOwnershipPoints. 
     * At the end of the transaction, we are transferring us our cut and the user his USDC.
     */
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

    /**
     * @dev The function returns the value of all our open positions in USDC using Chainlink Data Feeds.
     * @return value Value of all our open positions in USDC.
     */
    function getAllPositionValue() public pure returns(uint256) {
        return 0;
    }
    
    /**
     * @dev The function returns the total value of all assets on our contract in USDC using Chainlink Data Feeds.
     * @return value Value of all assets on our contract in USDC.
     */
    function getContractValue() public view returns(uint256){
        return USDC_CONTRACT.balanceOf(address(this)) + getAllPositionValue();
    }

    /**
     * @param user The user we are charging an annual fee.
     * @param investmentNumber A number of investment that we are charging an annual fee.
     * @dev We can only call this function if we are trying to charge our annual fee on an investment that is 365+ days old.
     * Calculating the profit that we made taking 20% of it and taking 2% of the rest of the investment as our annual fee.
     * Deleting the investment we took assets from, and making a new investment with all the other assets (automatic reinvesting).
     * This function will be called from our backend service as soon as we are able to collect fees.
     */
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
    
    /**
     * @param amount New value for the variable `MAX_ASSETS_DEPOSITED`.
     * @dev The function changes the maximum amount of assets we are willing to take.
     */
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