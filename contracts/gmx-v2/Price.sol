// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

library Price {
    struct TokenPrice {
        address token;
        uint256 min;
        uint256 max;
    }

    struct Props {
        uint256 min;
        uint256 max;
    }
}
