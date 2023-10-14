import { ethers } from 'hardhat';
import { IReader__factory } from '../../typechain';
import { getChainAddresses } from './addresses';
import { TokenInfo, getTokenInfo, tokenToString } from './tokens';

export type MarketInfo = {
  marketKey: string;
  index: TokenInfo;
  long: TokenInfo;
  short: TokenInfo;
};

const _markets: Record<string, MarketInfo> = {};

export async function getMarket(marketKey: string): Promise<MarketInfo> {
  if (marketKey in _markets) {
    return _markets[marketKey];
  }

  const addresses = getChainAddresses();
  const [wallet] = await ethers.getSigners();
  const reader = await IReader__factory.connect(addresses.gmx.reader, wallet);
  const market = await reader.getMarket(addresses.gmx.dataStore, marketKey);

  _markets[marketKey] = {
    marketKey: market.marketToken,
    index: await getTokenInfo(market.indexToken),
    long: await getTokenInfo(market.longToken),
    short: await getTokenInfo(market.shortToken),
  };
  return _markets[marketKey];
}

export async function getMarkets(): Promise<MarketInfo[]> {
  const addresses = getChainAddresses();
  const [wallet] = await ethers.getSigners();

  const reader = await IReader__factory.connect(addresses.gmx.reader, wallet);
  const markets = await reader.getMarkets(addresses.gmx.dataStore, 0, 30);
  return Promise.all(markets.map((market) => getMarket(market.marketToken)));
}

export async function displayMarkets() {
  const markets = await getMarkets();
  for (const market of Object.values(markets)) {
    console.log(market.marketKey);
    console.log(`  index: %s`, tokenToString(market.index));
    console.log(`  long:  %s`, tokenToString(market.long));
    console.log(`  short: %s`, tokenToString(market.short));
  }
}
