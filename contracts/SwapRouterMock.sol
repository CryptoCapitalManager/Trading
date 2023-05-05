// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
}

struct ExactInputParams {
    bytes path;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
}

struct ExactOutputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountOut;
    uint256 amountInMaximum;
    uint160 sqrtPriceLimitX96;
}

struct ExactOutputParams {
    bytes path;
    address recipient;
    uint256 deadline;
    uint256 amountOut;
    uint256 amountInMaximum;
}

contract SwapRouterMock is ISwapRouter {

    ERC20 internal immutable USDC_CONTRACT;
    ERC20 internal immutable UNI_CONTRACT;
    ERC20 internal immutable CRV_CONTRACT;


    constructor (address _USDC_ADDRESS, address _UNI_ADDRESS, address _CRV_ADDRESS){
        USDC_CONTRACT = ERC20(_USDC_ADDRESS);
        UNI_CONTRACT = ERC20(_UNI_ADDRESS);
        CRV_CONTRACT = ERC20(_CRV_ADDRESS);
    }

    uint24 public constant poolFee = 3000;

    function exactInputSingle(ExactInputSingleParams calldata params) external override payable returns (uint256 amountOut){
        if(params.tokenIn == address(USDC_CONTRACT) && params.tokenOut == address(UNI_CONTRACT)){
            USDC_CONTRACT.transferFrom(msg.sender, address(this), params.amountIn);
            
            amountOut = ((params.amountIn * (1000000-params.fee)/1000000))/5;

            UNI_CONTRACT.transfer(msg.sender, amountOut);
        }
        else {
            UNI_CONTRACT.transferFrom(msg.sender, address(this), params.amountIn);
            
            amountOut = (params.amountIn * (1000000-params.fee)/1000000)*5;

            USDC_CONTRACT.transfer(msg.sender, amountOut);
        }
    }

    function exactInput(ExactInputParams calldata params) external override payable returns (uint256 amountOut){
        if(params.amountIn == 1000*10**18){
            USDC_CONTRACT.transferFrom(msg.sender, address(this), params.amountIn);

            amountOut = (((params.amountIn * (1000000-3000)/1000000)) * (1000000-3000)/1000000)/2;

            CRV_CONTRACT.transfer(msg.sender, amountOut);
        }

        else{
            CRV_CONTRACT.transferFrom(msg.sender, address(this), params.amountIn);

            amountOut = (((params.amountIn * (1000000-3000)/1000000)) * (1000000-3000)/1000000)*2;

            USDC_CONTRACT.transfer(msg.sender, amountOut);
        }
    }

    function exactOutputSingle(ExactOutputSingleParams calldata params) external override payable returns (uint256 amountIn){

    }

    function exactOutput(ExactOutputParams calldata params) external override payable returns (uint256 amountIn){

    }

    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external override{

    }
}
