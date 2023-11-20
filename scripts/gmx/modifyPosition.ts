import { ethers } from 'hardhat';
import readline from 'readline/promises';
import { Trading } from '../../typechain';
import { getChainAddresses } from './addresses';
import { getExecutionFee } from './fee';
import { getTokenPrice } from './prices';
import {
  isLongQuestion,
  marketQuestion,
  numberQuestion,
  swapPathQuestion,
  tokenQuestion,
} from './questions';
import { getTokenInfo } from './tokens';

export async function increasePosition(
  trading: Trading,
  rl: readline.Interface
) {
  const usdcInfo = await getTokenInfo(getChainAddresses().tokens.usdc);

  console.log('Input values for increasing position:');

  // Questions
  const market = await marketQuestion(rl);
  const isLong = await isLongQuestion(rl);
  const collateralDeltaUsd = await numberQuestion(
    rl,
    'USDC collateral delta: ',
    usdcInfo.decimals
  );
  const positionDeltaUsd = await numberQuestion(rl, 'position delta USD: ', 30);
  const swapPath = await swapPathQuestion(rl);

  const marketIndexPrice = await getTokenPrice(market.index);
  // include 1% slippage
  // TODO: figure out if needed or if we can reduce
  const acceptablePrice = isLong
    ? marketIndexPrice.maxPriceRaw.mul(101).div(100)
    : marketIndexPrice.minPriceRaw.mul(99).div(100);

  const executionFee = await getExecutionFee(true, swapPath.length);
  // Make sure Trading contract has enough ETH for executionFee
  const ethBalance = await ethers.provider.getBalance(trading.address);
  const txValue = ethBalance.lt(executionFee)
    ? executionFee.sub(ethBalance)
    : 0;

  await trading
    .increasePosition(
      market.marketKey,
      isLong,
      collateralDeltaUsd,
      positionDeltaUsd,
      acceptablePrice,
      executionFee,
      { value: txValue }
    )
    .then((tx) => tx.wait());
}

export async function decreasePosition(
  trading: Trading,
  rl: readline.Interface
) {
  console.log('Input values for decreasing position:');

  // Questions
  const marketInfo = await marketQuestion(rl);
  const isLong = await isLongQuestion(rl);
  const collateralToken = await tokenQuestion(rl, 'collateral token: ');
  const collateralDeltaUsd = await numberQuestion(
    rl,
    'collateral delta: ',
    collateralToken.decimals
  );
  const positionDeltaUsd = await numberQuestion(rl, 'position delta USD: ', 30);
  const swapPath = await swapPathQuestion(rl);

  const marketIndexPrice = await getTokenPrice(marketInfo.index);
  // include 1% slippage
  // TODO: figure out if needed or if we can reduce
  const acceptablePrice = isLong
    ? marketIndexPrice.maxPriceRaw.mul(99).div(100)
    : marketIndexPrice.minPriceRaw.mul(101).div(100);

  const executionFee = await getExecutionFee(false, swapPath.length + 1);
  // Make sure Trading contract has enough ETH for executionFee
  const ethBalance = await ethers.provider.getBalance(trading.address);
  const txValue = ethBalance.lt(executionFee)
    ? executionFee.sub(ethBalance)
    : 0;

  await trading
    .decreasePosition(
      marketInfo.marketKey,
      isLong,
      collateralToken.address,
      collateralDeltaUsd,
      positionDeltaUsd,
      acceptablePrice,
      executionFee,
      { value: txValue }
    )
    .then((tx) => tx.wait());
}
