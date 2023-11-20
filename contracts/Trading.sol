// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import '../gmx-contracts-interfaces/IRouter.sol';
import '../gmx-contracts-interfaces/IPositionRouter.sol';
import '../contracts/RequestAction.sol';

import './gmx-v2/IDataStore.sol';
import './gmx-v2/IExchangeRouter.sol';
import './gmx-v2/IOrderHandler.sol';
import './gmx-v2/IReader.sol';
import './gmx-v2/Market.sol';
import './gmx-v2/Order.sol';
import './gmx-v2/Position.sol';

struct Investment {
    uint256 userOwnership;
    uint256 initialInvestment;
    uint256 annualFeeColectedTime;
}

struct WithdrawObject {
    uint256 amount;
    uint256 investmentNumber;
}

struct TokenPriceFeed {
    address token;
    address priceFeedAggregator;
}

/// @author Investiva
/// @title Trading
contract Trading is Ownable {
    ERC20 internal immutable USDC_CONTRACT;
    RequestAction internal REQUEST_ACTION_CONTRACT;
    uint256 internal MAX_ASSETS_DEPOSITED;
    mapping(address => Investment[]) internal userRecord;
    uint256 internal totalUserOwnershipPoints;
    address [] internal liquidityPools;
    address [] internal openPositions;

    bytes32 public constant ACCOUNT_POSITION_LIST = keccak256(abi.encode("ACCOUNT_POSITION_LIST"));

    IReader public gmxReader;
    IExchangeRouter public gmxRouter;
    IDataStore internal gmxDataStore;
    address internal gmxOrderVault;
    address internal gmxReferralStorage;

    address[] internal chainlinkPriceFeedTokens;
    mapping(address => AggregatorV3Interface) internal chainlinkPriceFeedAggregator;

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
    event withdrawnFromInvestment (address user, Investment investment, uint256 amount, uint256 USDC_AMOUNT);

    /**
     * @param user The user account that we are getting our fees from.
     * @param newInvestment The investment struct that will be replacing the investment we took fees from.
     * @dev This event is being emitted so we can listen for it on the backend service and update our database.
     */
    event feeCollected(address user, Investment newInvestment);

    /**
     * @param _USDC_ADDRESS Smart contract address of the USDC.
     * @param _tokens An array of all tokens we will be able to trade.
     * @dev In the constructor, we are setting `USDC_CONTRACT`, `MAX_ASSETS_DEPOSITED` and `liquidityPools` variables. 
     * After contract deployment, we should manually send 100k USDC tokens to the contract from the account that deployed the contract.
     * With this little compromise we were able to implement much more gas-efficient logic in our smart contract.
     */
    constructor(address _USDC_ADDRESS, TokenPriceFeed[] memory _tokens, address _gmxReader, address _gmxRouter) {
        USDC_CONTRACT = ERC20(_USDC_ADDRESS);
        MAX_ASSETS_DEPOSITED = 10000000*10**6;

        for(uint8 i=0; i < _tokens.length; i++) {
            TokenPriceFeed memory priceFeed = _tokens[i];
            chainlinkPriceFeedTokens.push(priceFeed.token);
            chainlinkPriceFeedAggregator[priceFeed.token] = AggregatorV3Interface(priceFeed.priceFeedAggregator);
        }

        //Manually send 100 USDC tokens to the contract from the account that deployed the contract
        Investment memory tmp = Investment(1000000000, 100*10**6, block.timestamp);
        userRecord[msg.sender].push(tmp);
        totalUserOwnershipPoints = 1000000000;

        gmxReader = IReader(_gmxReader);
        gmxRouter = IExchangeRouter(_gmxRouter);
        gmxDataStore = IDataStore(gmxRouter.dataStore());

        IOrderHandler gmxOrderHandler = IOrderHandler(gmxRouter.orderHandler());
        gmxOrderVault = gmxOrderHandler.orderVault();
        gmxReferralStorage = gmxOrderHandler.referralStorage();
    }

    /**
     * @notice Required in order to receive leftover fee from GMX.
     */
    receive() external payable {}

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
        require(amount >= 100*10**6 && USDC_CONTRACT.allowance(msg.sender, address(this)) >= amount, "Insufficient amount or allowance.");
        require(getContractValue() + amount*10**6 <= MAX_ASSETS_DEPOSITED *10**6, "This deposit would exceed our limit.");
        require(getAllPositionValue() == 0,"You can't deposit while we are in trade.");
        
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

    function depositTroughtRequest(uint256 amount,address investor) external  {
        require(msg.sender == address(REQUEST_ACTION_CONTRACT));
        require(getAllPositionValue() == 0);
        
        USDC_CONTRACT.transferFrom(address(REQUEST_ACTION_CONTRACT), address(this), amount);

        uint256 newtotalUserOwnershipPoints = totalUserOwnershipPoints * getContractValue()  / (getContractValue() - amount);
        uint256 userOwnershipPoints = newtotalUserOwnershipPoints - totalUserOwnershipPoints;
        
        totalUserOwnershipPoints = newtotalUserOwnershipPoints;
        
        Investment memory investment = Investment(userOwnershipPoints, amount, block.timestamp);
        userRecord[investor].push(investment);
        
        emit userDeposit(investor, investment);
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
    function withdraw(uint256 amount, uint256 investmentNumber) public {
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
        
        if(getAllPositionValue() != 0) platformCut += toBeWithdrawn * 5 / 100;

        USDC_CONTRACT.transfer(owner(), platformCut);
        USDC_CONTRACT.transfer(msg.sender, toBeWithdrawn - platformCut);

        emit withdrawnFromInvestment(msg.sender, investment, amount, toBeWithdrawn);
    }

    function withdrawMultiple(WithdrawObject[] memory withdrawals,uint256 lenght) external {
        for(uint256 i = 0; i<lenght; i++){
            withdraw(withdrawals[i].amount, withdrawals[i].investmentNumber);
        }
    }

    function withdrawTroughtRequest(uint256 amount,address investor, uint investmentNumber) external  {
        Investment storage investment = userRecord[investor][investmentNumber];
        
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
        USDC_CONTRACT.transfer(investor, toBeWithdrawn - platformCut);

        emit withdrawnFromInvestment(investor, investment, amount, toBeWithdrawn);
    }

    //TRADING FUNCTIONS

    function increasePosition(
        address market,
        bool isLong,
        // address[] memory swapPath,
        uint256 initialCollateralDeltaUsdc,
        uint256 positionDeltaUsd,
        uint256 acceptablePrice,
        uint256 executionFee
    ) external payable onlyOwner {
        // Send native token that should cover execution fee
        gmxRouter.sendWnt{value: executionFee}(gmxOrderVault, executionFee);

        // Pre transfer USDC to the OrderValut
        USDC_CONTRACT.transfer(gmxOrderVault, initialCollateralDeltaUsdc);

        // Create Order
        Order.CreateOrderParams memory order = Order.CreateOrderParams(
            Order.CreateOrderParamsAddresses(
                address(this), // receiver
                address(0), // callbackContract, consider using this
                address(0), // uiFeeReceiver
                market,
                address(USDC_CONTRACT),
                new address[](0)
            ),
            Order.CreateOrderParamsNumbers(
                positionDeltaUsd, // sizeDeltaUsd
                0, // initialCollateralDeltaAmount
                0, // triggerPrice
                acceptablePrice,
                executionFee,
                0, // callbackGasLimit
                0 // minOutputAmount
            ),
            Order.OrderType.MarketIncrease,
            Order.DecreasePositionSwapType.NoSwap,
            isLong,
            true, // shouldUnwrapNativeToken
            0 // referralCode
        );
        gmxRouter.createOrder(order);
    }

    function decreasePosition(
        address market,
        bool isLong,
        address collateralToken,
        // address[] memory swapPath,
        uint256 collateralDelta,
        uint256 positionDeltaUsd,
        uint256 acceptablePrice,
        uint256 executionFee
    ) external payable onlyOwner {
        // Send native token that should cover execution fee
        gmxRouter.sendWnt{value: executionFee}(gmxOrderVault, executionFee);

        // Create Order
        Order.CreateOrderParams memory order = Order.CreateOrderParams(
            Order.CreateOrderParamsAddresses(
                address(this), // receiver
                address(0), // callbackContract, consider using this
                address(0), // uiFeeReceiver
                market,
                collateralToken, // initialCollateralToken
                new address[](0)
            ),
            Order.CreateOrderParamsNumbers(
                positionDeltaUsd, // sizeDeltaUsd
                collateralDelta, // initialCollateralDeltaAmount
                0, // triggerPrice
                acceptablePrice,
                executionFee,
                0, // callbackGasLimit
                0 // minOutputAmount
            ),
            Order.OrderType.MarketDecrease,
            Order.DecreasePositionSwapType.SwapPnlTokenToCollateralToken,
            isLong,
            true, // shouldUnwrapNativeToken
            0 // referralCode
        );
        gmxRouter.createOrder(order);
    }

    // POSITION
    function gmxAccountPositionListKey() internal view returns (bytes32) {
        return keccak256(abi.encode(ACCOUNT_POSITION_LIST, address(this)));
    }

    function getGmxPositionCount() internal view returns (uint256) {
        return gmxDataStore.getBytes32Count(gmxAccountPositionListKey());
    }

    function getGmxPositionKeys() internal view returns (bytes32[] memory) {
        return
            gmxDataStore.getBytes32ValuesAt(
                gmxAccountPositionListKey(),
                0,
                getGmxPositionCount()
            );
    }

    function getGmxPositions() public view returns (Position.Props[] memory) {
        return
            gmxReader.getAccountPositions(
                address(gmxDataStore),
                address(this),
                0,
                getGmxPositionCount()
            );
    }

    function extractTokenPrice(
        Market.Props memory market,
        Market.MarketPrices memory marketPrices,
        address token
    ) internal pure returns (Price.Props memory) {
        if (token == market.indexToken) {
            return marketPrices.indexTokenPrice;
        } else if (token == market.longToken) {
            return marketPrices.longTokenPrice;
        } else if (token == market.shortToken) {
            return marketPrices.shortTokenPrice;
        } else {
            revert("Invalid token for market");
        }
    }

    function extractMarketPrices(
        Market.Props memory market,
        Price.TokenPrice[] memory tokenPrices
    ) internal pure returns (Market.MarketPrices memory marketPrices) {
        for (uint256 i; i < tokenPrices.length; i++) {
            Price.TokenPrice memory tokenPrice = tokenPrices[i];
            if (tokenPrice.token == market.indexToken) {
                marketPrices.indexTokenPrice.min = tokenPrice.min;
                marketPrices.indexTokenPrice.max = tokenPrice.max;
            }
            if (tokenPrice.token == market.longToken) {
                marketPrices.longTokenPrice.min = tokenPrice.min;
                marketPrices.longTokenPrice.max = tokenPrice.max;
            }
            if (tokenPrice.token == market.shortToken) {
                marketPrices.shortTokenPrice.min = tokenPrice.min;
                marketPrices.shortTokenPrice.max = tokenPrice.max;
            }
        }
    }

    function getGmxPositionsValueUsd(
        Price.TokenPrice[] memory tokenPrices
    ) public view returns (uint256) {
        uint256 totalValue = 0;

        bytes32[] memory positionKeys = getGmxPositionKeys();
        for (uint256 i; i < positionKeys.length; i++) {
            bytes32 positionKey = positionKeys[i];

            Position.Props memory position = gmxReader.getPosition(
                address(gmxDataStore),
                positionKey
            );
            Market.Props memory market = gmxReader.getMarket(
                address(gmxDataStore),
                position.addresses.market
            );
            Market.MarketPrices memory marketPrices = Trading
                .extractMarketPrices(market, tokenPrices);

            // Calc collateral value in USD
            Price.Props memory collateralPrice = Trading
                .extractTokenPrice(
                    market,
                    marketPrices,
                    position.addresses.collateralToken);
            // assume min price for collateral
            uint256 collateralUsd = position.numbers.collateralAmount *
                collateralPrice.min;

            // Calculate PNL in USD
            // TODO: consider using second value: uncappedPositionPnlUsd
            (int256 pnlUsd, , ) = gmxReader.getPositionPnlUsd(
                address(gmxDataStore),
                market,
                marketPrices,
                positionKey,
                position.numbers.sizeInUsd
            );

            totalValue += uint256(int256(collateralUsd) + pnlUsd);
        }
        return totalValue;
    }

    //UTILS

    function transferAllEther() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function getTokenPricesFromChainlink()
        public
        view
        returns (Price.TokenPrice[] memory)
    {
        Price.TokenPrice[] memory prices = new Price.TokenPrice[](
            chainlinkPriceFeedTokens.length
        );
        for (uint256 i; i < chainlinkPriceFeedTokens.length; i++) {
            address token = chainlinkPriceFeedTokens[i];
            AggregatorV3Interface aggregator = chainlinkPriceFeedAggregator[token];

            // TODO: maybe verify the freshness/validity of data
            // prettier-ignore
            (
                /* uint80 roundID */,
                int answer,
                /*uint startedAt*/,
                /*uint timeStamp*/,
                /*uint80 answeredInRound*/
            ) = aggregator.latestRoundData();
            if (answer < 0) {
                revert("Invalid price");
            }

            uint256 price = uint256(answer);

            // Price.TokenPrice should be with (30-token.decimal) decimals
            uint256 desiredDecimals = 30 - ERC20(token).decimals();
            if (desiredDecimals > aggregator.decimals()) {
                price *= 10 ** (desiredDecimals - aggregator.decimals());
            } else {
                price /= 10 ** (aggregator.decimals() - desiredDecimals);
            }

            prices[i] = Price.TokenPrice(token, price, price);
        }
        return prices;
    }

    /**
     * @dev The function returns the value of all our open positions in USDC using Chainlink Data Feeds.
     * @return value Value of all our open positions in USDC.
     */
    function getAllPositionValue() public view returns(uint256) {
        uint256 gmxPositionValueUsd = getGmxPositionsValueUsd(
            getTokenPricesFromChainlink());
        // The gmxPositionValueUsd is represented with 30 decimals.
        // Scale it to USDC decimals
        return gmxPositionValueUsd / (10 ** (30 - USDC_CONTRACT.decimals()));
    }

    /**
     * @dev The function returns the total value of all assets on our contract in USDC using Chainlink Data Feeds.
     * @return value Value of all assets on our contract in USDC.
     */
    function getContractValue() public view returns(uint256){
        // TODO: consider adding value of ETH and/or value of other tokens as well
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

    function setRequestActionAddress(address _address) external onlyOwner {
        require (address(REQUEST_ACTION_CONTRACT) == address(0));
        REQUEST_ACTION_CONTRACT= RequestAction(_address);
    }

    function setChainlinkPriceFeedAggregator(
        address token,
        address chainlinkPriceFeed
    ) public onlyOwner {
        if (address(chainlinkPriceFeedAggregator[token]) == address(0)) {
            chainlinkPriceFeedTokens.push(token);
        }
        chainlinkPriceFeedAggregator[token] = AggregatorV3Interface(chainlinkPriceFeed);
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
