// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "./Order.sol";

interface IExchangeRouter {

    function dataStore() external view returns(address);
    
    function router() external view returns(address);

    function orderHandler() external view returns(address);

    function sendWnt(address receiver, uint256 amount) external payable;

    function createOrder(
        Order.CreateOrderParams calldata params
    ) external payable returns (bytes32);
}
