import { ethers } from 'hardhat';
import readline from 'readline/promises';
import { ERC20__factory, Trading } from '../../typechain';
import { getChainAddresses } from './addresses';
import { displayPositions } from './position';
import { BigNumber } from 'ethers';
import { getTokenInfo } from './tokens';
import { parseFixed } from '@ethersproject/bignumber';
import { getAddress } from 'ethers/lib/utils';
import { getMarket } from './markets';
import { getRawPrices, getTokenPrice } from './prices';
import { getExecutionFee } from './fee';
import { toDecimalString } from './utils';

export async function depositUSDC(trading: Trading, rl: readline.Interface) {
  const [wallet] = await ethers.getSigners();
  const amount = await rl.question('Enter USDC amount to deposit: ');

  const usdc = ERC20__factory.connect(getChainAddresses().tokens.usdc, wallet);
  const usdcInfo = await getTokenInfo(usdc.address);

  const bnAmount = BigNumber.from(amount).mul(
    BigNumber.from(10).pow(usdcInfo.decimals)
  );

  // TODO: this doesn't work for some reason... Sending directly
  // await usdc.approve(trading.address, bnAmount).then((tx) => tx.wait());
  // await trading.deposit(bnAmount).then((tx) => tx.wait());
  await usdc.transfer(trading.address, bnAmount);
}

export async function displayBalance(trading: Trading) {
  const [wallet] = await ethers.getSigners();
  const addresses = getChainAddresses();
  const usdc = ERC20__factory.connect(addresses.tokens.usdc, wallet);
  const weth = ERC20__factory.connect(addresses.tokens.weth, wallet);

  const ethBalance = await ethers
    .provider
    .getBalance(trading.address);
  console.log(`ETH:  ${toDecimalString(ethBalance, 18)}`);
  const wethBalance = await weth.balanceOf(trading.address);
  console.log(`WETH: ${toDecimalString(wethBalance, await weth.decimals())}`);
  const usdcBalance = await usdc.balanceOf(trading.address);
  console.log(`USDC: ${toDecimalString(usdcBalance, await usdc.decimals())}`);

  const tokenPrices = await getRawPrices();
  const positionUsd = await trading.getGmxPositionsValueUsd(tokenPrices);
  console.log(
    `Positions USD: ${toDecimalString(positionUsd, 30)}`
  );
  await displayPositions(trading.address);
}

export async function increasePosition(
  trading: Trading,
  rl: readline.Interface
) {
  const usdcInfo = await getTokenInfo(getChainAddresses().tokens.usdc);

  console.log('Input values for increasing position:');
  const market = await rl.question('market: ');
  const marketInfo = await getMarket(market);

  const isLong = await rl.question('long or short: ').then((answer) => {
    switch (answer.toLocaleLowerCase()) {
      case 'long':
        return true;
      case 'short':
        return false;
      default:
        throw Error('Invalid value');
    }
  });
  const collateralDeltaUsd = await rl
    .question('collateral delta USD: ')
    .then(async (answer) =>
      answer.startsWith('0x')
        ? BigNumber.from(answer)
        : parseFixed(answer, usdcInfo.decimals)
    );
  const positionSizeUsd = await rl
    .question('position delta USDC: ')
    .then((answer) =>
      answer.startsWith('0x') ? BigNumber.from(answer) : parseFixed(answer, 30)
    );
  const swapPath = await rl
    .question('swap path (comma separated): ')
    .then((answer) =>
      answer == ''
        ? []
        : answer
            .trim()
            .split(',')
            .map((a) => a.trim())
            .map(getAddress)
    );

  const price = await getTokenPrice(marketInfo.index);

  // include 3% slippage
  // TODO: figure out if needed or if we can reduce
  const acceptablePrice = isLong
    ? price.maxPriceRaw.mul(103).div(100)
    : price.minPriceRaw.mul(97).div(100);

  const executionFee = await getExecutionFee(true, swapPath.length);
  console.log('ExecutionFee:', executionFee.toHexString());

  // Make sure Trading contract has enough ETH for executionFee
  const ethBalance = await ethers
    .provider
    .getBalance(trading.address);
  const txValue = ethBalance.lt(executionFee)
    ? executionFee.sub(ethBalance)
    : 0;

  console.log('EthBalance:  ', ethBalance.toHexString());
  console.log('ExecutionFee:', executionFee.toHexString());
  console.log('txValue:     ', txValue === 0 ? 0 : txValue.toHexString());

  await trading
    .increasePosition(
      market,
      isLong,
      swapPath,
      collateralDeltaUsd,
      positionSizeUsd,
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
  const market = await rl.question('market: ');
  const marketInfo = await getMarket(market);
  const collateralToken = await rl.question('collateralToken: ');
  const collateralTokenInfo = await getTokenInfo(collateralToken);

  const isLong = await rl.question('long or short: ').then((answer) => {
    switch (answer.toLocaleLowerCase()) {
      case 'long':
        return true;
      case 'short':
        return false;
      default:
        throw Error('Invalid value');
    }
  });
  const collateralDeltaUsd = await rl
    .question('collateral delta: ')
    .then(async (answer) =>
      answer.startsWith('0x')
        ? BigNumber.from(answer)
        : parseFixed(answer, collateralTokenInfo.decimals)
    );
  const positionSizeUsd = await rl
    .question('position delta USD: ')
    .then((answer) =>
      answer.startsWith('0x') ? BigNumber.from(answer) : parseFixed(answer, 30)
    );
  const swapPath = await rl
    .question('swap path (comma separated): ')
    .then((answer) =>
      answer == ''
        ? []
        : answer
            .trim()
            .split(',')
            .map((a) => a.trim())
            .map(getAddress)
    );

  const price = await getTokenPrice(marketInfo.index);

  // include 3% slippage
  // TODO: figure out if needed or if we can reduce
  const acceptablePrice = isLong
    ? price.maxPriceRaw.mul(97).div(100)
    : price.minPriceRaw.mul(103).div(100);

  const executionFee = await getExecutionFee(false, swapPath.length + 1);
  console.log('ExecutionFee:', executionFee.toHexString());

  // Make sure Trading contract has enough ETH for executionFee
  const ethBalance = await ethers
    .provider
    .getBalance(trading.address);
  const txValue = ethBalance.lt(executionFee)
    ? executionFee.sub(ethBalance)
    : 0;
  console.log('EthBalance:  ', ethBalance.toHexString());
  console.log('ExecutionFee:', executionFee.toHexString());
  console.log('txValue:     ', txValue === 0 ? 0 : txValue.toHexString());

  await trading
    .decreasePosition(
      market,
      isLong,
      collateralToken,
      swapPath,
      collateralDeltaUsd,
      positionSizeUsd,
      acceptablePrice,
      executionFee,
      { value: txValue }
    )
    .then((tx) => tx.wait());
}
