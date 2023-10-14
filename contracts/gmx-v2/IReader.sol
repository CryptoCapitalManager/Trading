// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "./Market.sol";
import "./Order.sol";
import "./Position.sol";

interface IReader {

    function getMarket(address dataStore, address key) external view returns (Market.Props memory);

    // function getMarketBySalt(address dataStore, bytes32 salt) external view returns (Market.Props memory);

    // function getDeposit(address dataStore, bytes32 key) external view returns (Deposit.Props memory);

    // function getWithdrawal(address dataStore, bytes32 key) external view returns (Withdrawal.Props memory);

    function getOrder(address dataStore, bytes32 key) external view returns (Order.Props memory);

    function getPosition(address dataStore, bytes32 key) external view returns (Position.Props memory);

    // @return (positionPnlUsd, uncappedPositionPnlUsd, sizeDeltaInTokens)
    function getPositionPnlUsd(
        address dataStore,
        Market.Props memory market,
        Market.MarketPrices memory prices,
        bytes32 positionKey,
        uint256 sizeDeltaUsd
    ) external view returns (int256, int256, uint256);

    function getAccountPositions(
        address dataStore,
        address account,
        uint256 start,
        uint256 end
    ) external view returns (Position.Props[] memory);

    // function getAccountPositionInfoList(
    //     address dataStore,
    //     IReferralStorage referralStorage,
    //     bytes32[] memory positionKeys,
    //     MarketUtils.MarketPrices[] memory prices,
    //     address uiFeeReceiver
    // ) external view returns (ReaderUtils.PositionInfo[] memory);

    // function getPositionInfo(
    //     address dataStore,
    //     IReferralStorage referralStorage,
    //     bytes32 positionKey,
    //     MarketUtils.MarketPrices memory prices,
    //     uint256 sizeDeltaUsd,
    //     address uiFeeReceiver,
    //     bool usePositionSizeAsSizeDeltaUsd
    // ) public view returns (ReaderUtils.PositionInfo memory);

    function getAccountOrders(
        address dataStore,
        address account,
        uint256 start,
        uint256 end
    ) external view returns (Order.Props[] memory);

    function getMarkets(address dataStore, uint256 start, uint256 end) external view returns (Market.Props[] memory);

    // function getMarketInfoList(
    //     address dataStore,
    //     MarketUtils.MarketPrices[] memory marketPricesList,
    //     uint256 start,
    //     uint256 end
    // ) external view returns (ReaderUtils.MarketInfo[] memory);

    // function getMarketInfo(
    //     address dataStore,
    //     MarketUtils.MarketPrices memory prices,
    //     address marketKey
    // ) public view returns (ReaderUtils.MarketInfo memory);

    // function getMarketTokenPrice(
    //     address dataStore,
    //     Market.Props memory market,
    //     Price.Props memory indexTokenPrice,
    //     Price.Props memory longTokenPrice,
    //     Price.Props memory shortTokenPrice,
    //     bytes32 pnlFactorType,
    //     bool maximize
    // ) external view returns (int256, MarketPoolValueInfo.Props memory);

    // function getNetPnl(
    //     address dataStore,
    //     Market.Props memory market,
    //     Price.Props memory indexTokenPrice,
    //     bool maximize
    // ) external view returns (int256);

    // function getPnl(
    //     address dataStore,
    //     Market.Props memory market,
    //     Price.Props memory indexTokenPrice,
    //     bool isLong,
    //     bool maximize
    // ) external view returns (int256);

    // function getOpenInterestWithPnl(
    //     address dataStore,
    //     Market.Props memory market,
    //     Price.Props memory indexTokenPrice,
    //     bool isLong,
    //     bool maximize
    // ) external view returns (int256);

    // function getPnlToPoolFactor(
    //     address dataStore,
    //     address marketAddress,
    //     MarketUtils.MarketPrices memory prices,
    //     bool isLong,
    //     bool maximize
    // ) external view returns (int256);

    // function getSwapAmountOut(
    //     address dataStore,
    //     Market.Props memory market,
    //     MarketUtils.MarketPrices memory prices,
    //     address tokenIn,
    //     uint256 amountIn,
    //     address uiFeeReceiver
    // ) external view returns (uint256, int256, SwapPricingUtils.SwapFees memory fees);

    // function getExecutionPrice(
    //     address dataStore,
    //     address marketKey,
    //     Price.Props memory indexTokenPrice,
    //     uint256 positionSizeInUsd,
    //     uint256 positionSizeInTokens,
    //     int256 sizeDeltaUsd,
    //     bool isLong
    // ) external view returns (ReaderPricingUtils.ExecutionPriceResult memory);

    // function getSwapPriceImpact(
    //     address dataStore,
    //     address marketKey,
    //     address tokenIn,
    //     address tokenOut,
    //     uint256 amountIn,
    //     Price.Props memory tokenInPrice,
    //     Price.Props memory tokenOutPrice
    // ) external view returns (int256, int256);

    // function getAdlState(
    //     address dataStore,
    //     address market,
    //     bool isLong,
    //     MarketUtils.MarketPrices memory prices
    // ) external view returns (uint256, bool, int256, uint256);

    // function getDepositAmountOut(
    //     address dataStore,
    //     Market.Props memory market,
    //     MarketUtils.MarketPrices memory prices,
    //     uint256 longTokenAmount,
    //     uint256 shortTokenAmount,
    //     address uiFeeReceiver
    // ) external view returns (uint256);

    // function getWithdrawalAmountOut(
    //     address dataStore,
    //     Market.Props memory market,
    //     MarketUtils.MarketPrices memory prices,
    //     uint256 marketTokenAmount,
    //     address uiFeeReceiver
    // ) external view returns (uint256, uint256);
}
