// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "./Order.sol";

interface IOrderHandler {
    function orderVault() external view returns (address);
    function referralStorage() external view returns (address);
}
