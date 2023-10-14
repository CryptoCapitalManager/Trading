// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

library Order {
    enum OrderType {
        MarketSwap,
        LimitSwap,
        MarketIncrease,
        LimitIncrease,
        MarketDecrease,
        LimitDecrease,
        StopLossDecrease,
        Liquidation
    }

    enum DecreasePositionSwapType {
        NoSwap,
        SwapPnlTokenToCollateralToken,
        SwapCollateralTokenToPnlToken
    }

    struct CreateOrderParams {
        CreateOrderParamsAddresses addresses;
        CreateOrderParamsNumbers numbers;
        OrderType orderType;
        DecreasePositionSwapType decreasePositionSwapType;
        bool isLong;
        bool shouldUnwrapNativeToken;
        bytes32 referralCode;
    }

    struct CreateOrderParamsAddresses {
        address receiver;
        address callbackContract;
        address uiFeeReceiver;
        address market;
        address initialCollateralToken;
        address[] swapPath;
    }

    struct CreateOrderParamsNumbers {
        // The position size to increase / decrease
        uint256 sizeDeltaUsd;
        // The amount of tokens to withdraw for decrease orders
        uint256 initialCollateralDeltaAmount; 
        // The trigger price for limit / stop-loss / take-profit orders,
        // the order will be attempted to be executed if price reaches
        // the trigger price
        uint256 triggerPrice;
        // The acceptable price at which the order can be executed.
        // For market orders, the order will be cancelled if it cannot be
        // executed at the acceptable price.
        // For limit / stop-loss / take-profit orders, the order will not
        // be executed if the trigger price is reached but the acceptable
        // price cannot be fulfilled.
        uint256 acceptablePrice;
        // The amount of native token that is included for the execution
        // fee, e.g. on Arbitrum this would be ETH, this is the maximum
        // execution fee that keepers can use to execute the order.
        // When the order is executed, any excess execution fee is sent
        // back to the order's account.
        uint256 executionFee;
        // The gas limit to be passed to the callback contract on order
        // execution / cancellation
        uint256 callbackGasLimit;
        // For swap orders this is the minimum output amount.
        // For increase orders this is the minimum amount after the
        // initialCollateralDeltaAmount is swapped through the swapPath.
        // For decrease orders this is the minimum USD value, USD is used
        // in this case because it is possible for decrease orders to have
        // two output tokens, one being the profit token and the other being
        // the withdrawn collateral token
        uint256 minOutputAmount;
    }



    // @dev there is a limit on the number of fields a struct can have when being passed
    // or returned as a memory variable which can cause "Stack too deep" errors
    // use sub-structs to avoid this issue
    // @param addresses address values
    // @param numbers number values
    // @param flags boolean values
    struct Props {
        Addresses addresses;
        Numbers numbers;
        Flags flags;
    }

    struct Addresses {
        address account;
        address receiver;
        address callbackContract;
        address uiFeeReceiver;
        address market;
        address initialCollateralToken;
        address[] swapPath;
    }

    struct Numbers {
        OrderType orderType;
        DecreasePositionSwapType decreasePositionSwapType;
        uint256 sizeDeltaUsd;
        uint256 initialCollateralDeltaAmount;
        uint256 triggerPrice;
        uint256 acceptablePrice;
        uint256 executionFee;
        uint256 callbackGasLimit;
        uint256 minOutputAmount;
        uint256 updatedAtBlock;
    }

    struct Flags {
        bool isLong;
        bool shouldUnwrapNativeToken;
        bool isFrozen;
    }
}
