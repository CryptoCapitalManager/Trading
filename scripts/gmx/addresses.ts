import hre from 'hardhat';

export type ChainAddresses = {
  tokens: {
    [index: string]: string;
  };
  chainlink: {
    [index: string]: string;
  };
  gmx: {
    exchangeRouter: string;
    dataStore: string;
    reader: string;
  };
};

export function getChainAddresses(): ChainAddresses {
  const { network } = hre;

  switch (network.name) {
    case 'arbitrumgoerli':
      return {
        tokens: {
          weth: '0xe39ab88f8a4777030a534146a9ca3b52bd5d43a3',
          usdc: '0x04fc936a15352a1b15b3b9c56ea002051e3db3e5',
          dai: '0x7b7c6c49fA99b37270077FBFA398748c27046984',
          usdt: '0xBFcBcdCbcc1b765843dCe4DF044B92FE68182a62',
          wbtc: '0xCcF73F4Dcbbb573296BFA656b754Fe94BB957d62',
        },
        chainlink: {
          weth: '0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08',
          usdc: '0x1692Bdd32F31b831caAc1b0c9fAF68613682813b',
          dai: '0x103b53E977DA6E4Fa92f76369c8b7e20E7fb7fe1',
          usdt: '0x0a023a3423D9b27A0BE48c768CCF2dD7877fEf5E',
          wbtc: '0x6550bc2301936011c1334555e62A87705A81C12C',
        },
        gmx: {
          exchangeRouter: '0xFE98518C9c8F1c5a216E999816c2dE3199f295D2',
          dataStore: '0xbA2314b0f71ebC705aeEBeA672cc3bcEc510D03b',
          reader: '0xab747a7bb64B74D78C6527C1F148808a19120475',
        },
      };
  }

  throw Error('Not supported network');
}
