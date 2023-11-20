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

      case 'arbitrum':
      return {
        tokens: {
          weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          link: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
          arb: '0x912CE59144191C1204E64559FE8253a0e49E6548',
          sol: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07',
          uni: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
          usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          wbtc: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
          btc: '0x47904963fc8b2340414262125aF798B9655E58Cd',
          doge: '0xC4da4c24fd591125c3F47b340b6f4f76111883d8',
          xrp: '0xc14e065b0067dE91534e032868f5Ac6ecf2c6868',
        },
        chainlink: {
          weth: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
          link: '0x86E53CF1B870786351Da77A57575e79CB55812CB',
          arb: '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6',
          sol: '0x24ceA4b8ce57cdA5058b924B9B9987992450590c',
          uni: '0x9C917083fDb403ab5ADbEC26Ee294f6EcAda2720',
          usdc: '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3',
          wbtc: '0xd0C7101eACbB49F3deCcCc166d238410D6D46d57',
          btc: '0xd0C7101eACbB49F3deCcCc166d238410D6D46d57',
          doge: '0x9A7FB1b3950837a8D9b40517626E11D4127C098C',
          xrp: '0xB4AD57B52aB9141de9926a3e0C8dc6264c2ef205',
        },
        gmx: {
          exchangeRouter: '0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8',
          dataStore: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
          reader: '0xf60becbba223EEA9495Da3f606753867eC10d139',
        },
      };
  }

  throw Error('Not supported network');
}
