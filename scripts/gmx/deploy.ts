import { ethers } from 'hardhat';
import readline from 'readline/promises';
import { Trading, Trading__factory } from '../../typechain';
import { getChainAddresses } from './addresses';
import { isAddress } from 'ethers/lib/utils';

export async function deploy(): Promise<Trading> {
  const [wallet] = await ethers.getSigners();
  const addresses = getChainAddresses();

  const tradingFactory = new Trading__factory(wallet);

  const trading = await tradingFactory
    .deploy(
      addresses.tokens.usdc,
      [
        addresses.tokens.weth,
        addresses.tokens.usdc,
        addresses.tokens.usdt,
        addresses.tokens.dai,
        addresses.tokens.wbtc,
      ],
      ethers.constants.AddressZero,
      addresses.gmx.reader,
      addresses.gmx.exchangeRouter
    )
    .then((tx) => tx.deployed());

  console.log('Contract successfully deployed!');
  console.log(`Trading address: ${trading.address}`);

  return trading;
}

export async function deployOrConnect(
  rl: readline.Interface
): Promise<Trading> {
  const [wallet] = await ethers.getSigners();
  console.info('Trading Contract for this session!');
  console.info('type the contract address, "deploy" or "skip"');

  while (true) {
    const answer = await rl.question('');

    if (answer.toLowerCase() == 'deploy') {
      return deploy();
    } else if (answer.toLowerCase() == 'skip') {
      return Trading__factory.connect(ethers.constants.AddressZero, wallet);
    } else if (isAddress(answer)) {
      return Trading__factory.connect(answer, wallet);
    } else {
      console.log('Invalid input!');
    }
  }
}
