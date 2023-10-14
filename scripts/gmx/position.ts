import { ethers } from 'hardhat';
import readline from 'readline/promises';
import { IReader__factory } from '../../typechain';
import { getChainAddresses } from './addresses';
import { getMarket } from './markets';
import { getTokenInfo } from './tokens';
import { BigNumber } from 'ethers';
import { hashData, toDecimalString } from './utils';

export function getPositionKey(
  account: string,
  market: string,
  collateralToken: string,
  isLong: boolean
) {
  return hashData(
    ['address', 'address', 'address', 'bool'],
    [account, market, collateralToken, isLong]
  );
}

export async function displayPositions(address: string) {
  const [wallet] = await ethers.getSigners();
  const addresses = getChainAddresses();
  const reader = await IReader__factory.connect(addresses.gmx.reader, wallet);

  const positions = await reader.getAccountPositions(
    addresses.gmx.dataStore,
    address,
    0,
    20
  );
  for (const position of positions) {
    const { account, market, collateralToken } = position.addresses;
    const { isLong } = position.flags;
    const marketInfo = await getMarket(market);
    const collateralTokenInfo = await getTokenInfo(collateralToken);
    const {
      sizeInUsd,
      sizeInTokens,
      collateralAmount,
      borrowingFactor,
      fundingFeeAmountPerSize,
      longTokenClaimableFundingAmountPerSize,
      shortTokenClaimableFundingAmountPerSize,
    } = position.numbers;

    const output = [
      `${getPositionKey(
        account,
        marketInfo.marketKey,
        collateralToken,
        isLong
      )}`,
      `  account:    ${account}`,
      `  market:     ${marketInfo.index.symbol} (${marketInfo.long.symbol} <-> ${marketInfo.short.symbol}) ${marketInfo.marketKey}`,
      `  collateral: ${collateralTokenInfo.symbol} ${collateralTokenInfo.address}`,
      `  isLong:     ${isLong}`,
      `  sizeInUSD:  ${toDecimalString(sizeInUsd, 30)}\t${sizeInUsd.toHexString()}`,
      `  sizeTokens: ${toDecimalString(
        sizeInTokens,
        marketInfo.index.decimals
      )}\t${sizeInTokens.toHexString()}`,
      `  collateralAmount: ${toDecimalString(
        collateralAmount,
        collateralTokenInfo.decimals
      )}\t${collateralAmount.toHexString()}`,
      // `  borrowingFactor:  ${toDecimalString(borrowingFactor, 30)}`,
      // `  fundingFeeAmountPerSize:  ${toDecimalString(
      //   fundingFeeAmountPerSize,
      //   0,
      //   0
      // )}`,
      // `  longTokenClaimableFundingAmountPerSize:  ${toDecimalString(
      //   longTokenClaimableFundingAmountPerSize,
      //   0,
      //   0
      // )}`,
      // `  shortTokenClaimableFundingAmountPerSize:  ${toDecimalString(
      //   shortTokenClaimableFundingAmountPerSize,
      //   0,
      //   0
      // )}`,
      ``,
    ].join('\n');
    console.log(output);
  }
  if (positions.length == 20) {
    console.log('There could be more');
  }
}
