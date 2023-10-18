import { ethers } from 'hardhat';
import readline from 'readline/promises';
import { ERC20__factory, Trading } from '../../typechain';
import { getChainAddresses } from './addresses';
import { getRawPrices } from './prices';
import { displayPositions } from './queryPosition';
import { numberQuestion } from './questions';
import { toDecimalString } from './utils';

export async function depositUSDC(trading: Trading, rl: readline.Interface) {
  const [wallet] = await ethers.getSigners();
  const usdc = ERC20__factory.connect(getChainAddresses().tokens.usdc, wallet);

  const amount = await numberQuestion(
    rl,
    'USDC amount to deposit: ',
    await usdc.decimals()
  );

  // TODO: this doesn't work for some reason... Sending directly
  // await usdc.approve(trading.address, amount).then((tx) => tx.wait());
  // await trading.deposit(amount).then((tx) => tx.wait());
  await usdc.transfer(trading.address, amount);
}

export async function displayBalance(trading: Trading) {
  const [wallet] = await ethers.getSigners();
  const addresses = getChainAddresses();
  const usdc = ERC20__factory.connect(addresses.tokens.usdc, wallet);
  const usdcDecimals = await usdc.decimals();
  const weth = ERC20__factory.connect(addresses.tokens.weth, wallet);

  const ethBalance = await ethers.provider.getBalance(trading.address);
  console.log(`ETH: `, toDecimalString(ethBalance, 18));
  const wethBalance = await weth.balanceOf(trading.address);
  console.log(`WETH:`, toDecimalString(wethBalance, await weth.decimals()));
  const usdcBalance = await usdc.balanceOf(trading.address);
  console.log(`USDC:`, toDecimalString(usdcBalance, usdcDecimals));

  const gmxPrices = await getRawPrices();
  const gmxPositionUsd = await trading.getGmxPositionsValueUsd(gmxPrices);
  console.log(
    `GMX Positions USD (GMX prices):`,
    toDecimalString(gmxPositionUsd, 30)
  );
  const allPositionValue = await trading.getAllPositionValue();
  console.log(
    `All Position Value (Chainlink prices):`,
    toDecimalString(allPositionValue, usdcDecimals)
  );
  const totalValue = await trading.getContractValue();
  console.log(
    `Total value in USDC:`,
    toDecimalString(totalValue, usdcDecimals)
  );

  await displayPositions(trading.address);
}
