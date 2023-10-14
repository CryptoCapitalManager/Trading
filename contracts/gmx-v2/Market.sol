// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import './Price.sol';

library Market {
    struct Props {
        address marketToken;
        address indexToken;
        address longToken;
        address shortToken;
    }
    
    struct MarketPrices {
        Price.Props indexTokenPrice;
        Price.Props longTokenPrice;
        Price.Props shortTokenPrice;
    }
}
