import hre from 'hardhat';

export type ChainAddresses = {
  tokens: {
    weth: string,
    usdc: string,
    dai: string,
    usdt: string,
    wbtc: string,
  },
  gmx: {
    exchangeRouter: string,
    dataStore: string,
    reader: string,
  }
}

export function getChainAddresses(): ChainAddresses {
    const { network } = hre;

    switch(network.name) {
      case 'arbitrumgoerli':
        return {
          tokens: {
            weth: '0xe39ab88f8a4777030a534146a9ca3b52bd5d43a3',
            usdc: '0x04fc936a15352a1b15b3b9c56ea002051e3db3e5',
            dai: '0x7b7c6c49fA99b37270077FBFA398748c27046984',
            usdt: '0xBFcBcdCbcc1b765843dCe4DF044B92FE68182a62',
            wbtc: '0xCcF73F4Dcbbb573296BFA656b754Fe94BB957d62',
          },
          gmx: {
            exchangeRouter: '0xFE98518C9c8F1c5a216E999816c2dE3199f295D2',
            dataStore: '0xbA2314b0f71ebC705aeEBeA672cc3bcEc510D03b',
            reader: '0xab747a7bb64B74D78C6527C1F148808a19120475',
          },
        };
    }

    throw Error("Not supported network");
}
