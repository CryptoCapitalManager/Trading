import { parseFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import readline from 'readline/promises';
import { MarketInfo, getMarket } from './markets';
import { TokenInfo, getTokenInfo } from './tokens';

export async function marketQuestion(
  rl: readline.Interface
): Promise<MarketInfo> {
  const market = await rl.question('market: ');
  return getMarket(market);
}

export async function tokenQuestion(
  rl: readline.Interface,
  question: string
): Promise<TokenInfo> {
  const token = await rl.question(question);
  return getTokenInfo(token);
}

export async function isLongQuestion(rl: readline.Interface): Promise<boolean> {
  const answer = await rl.question('long or short: ');
  switch (answer.toLocaleLowerCase()) {
    case 'long':
      return true;
    case 'short':
      return false;
    default:
      throw Error('Invalid value');
  }
}

export async function numberQuestion(
  rl: readline.Interface,
  question: string,
  decimals: number
): Promise<BigNumber> {
  const answer = await rl.question(question);
  return answer.startsWith('0x')
    ? BigNumber.from(answer)
    : parseFixed(answer, decimals);
}

export async function swapPathQuestion(
  rl: readline.Interface
): Promise<string[]> {
  const answer = await rl.question('swap path (comma separated): ');

  if (answer.trim() == '') {
    return [];
  }

  return answer
    .trim()
    .split(',')
    .map((a) => a.trim())
    .map(getAddress);
}
