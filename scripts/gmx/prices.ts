import { network } from 'hardhat';
import { TokenInfo } from './tokens';
import { BigNumber } from 'ethers';
import { toDecimal } from './utils';

const ARB_GOERLI_URL =
  'https://gmx-synthetics-api-arb-goerli-4vgxk.ondigitalocean.app/prices/tickers';

function getUrl() {
  switch (network.name) {
    case 'arbitrumgoerli':
      return ARB_GOERLI_URL;
    default:
      throw Error(`Unknown prices URL for ${network.name}`);
  }
}

export type RpcPrice = {
  tokenAddress: string;
  tokenSymbol: string;
  minPrice: string;
  maxPrice: string;
  updatedAt: number;
};

export type RawTokenPrice = {
  token: string;
  min: BigNumber;
  max: BigNumber;
};

export type TokenPrice = {
  token: TokenInfo;
  minPrice: number;
  maxPrice: number;
  minPriceRaw: BigNumber;
  maxPriceRaw: BigNumber;
};

export async function getTokenPrice(token: TokenInfo): Promise<TokenPrice> {
  return getTokenPrices([token]).then((prices) => prices[0]);
}

export async function getTokenPrices(
  tokens: TokenInfo[]
): Promise<TokenPrice[]> {
  const prices = await getRawPrices();

  return tokens.map<TokenPrice>((token) => {
    const price = prices.find(
      (p) => p.token.toLowerCase() == token.address.toLowerCase()
    );
    if (!price) {
      throw Error(`Price not found for: ${token.address}`);
    }
    return {
      token,
      minPrice: toDecimal(price.min, 30 - token.decimals),
      maxPrice: toDecimal(price.max, 30 - token.decimals),
      minPriceRaw: price.min,
      maxPriceRaw: price.max,
    };
  });
}

export async function getRawPrices(): Promise<RawTokenPrice[]> {
  const prices = await fetch(getUrl()).then<RpcPrice[]>((response) =>
    response.json()
  );
  return prices.map<RawTokenPrice>((price) => ({
    token: price.tokenAddress,
    min: BigNumber.from(price.minPrice),
    max: BigNumber.from(price.maxPrice),
  }));
}
