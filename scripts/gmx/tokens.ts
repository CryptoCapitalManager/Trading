import { ethers } from 'hardhat';
import { ERC20__factory } from '../../typechain';

export type TokenInfo = {
  address: string;
  decimals: number;
  symbol: string;
};

const _tokens: Record<string, TokenInfo> = {};

export async function getTokenInfo(address: string): Promise<TokenInfo> {
  if (address in _tokens) {
    return _tokens[address];
  }
  const [wallet] = await ethers.getSigners();
  const token = await ERC20__factory.connect(address, wallet);
  _tokens[address] = {
    address,
    decimals: await token.decimals().catch((_) => 0),
    symbol: await token.symbol().catch((_) => '?'),
  };

  return _tokens[address];
}

export function tokenToString(token: TokenInfo): string {
  return `${token.symbol} (${token.decimals}) ${token.address}`;
}
