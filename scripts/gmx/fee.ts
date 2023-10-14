import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { IDataStore, IDataStore__factory } from '../../typechain';
import { getChainAddresses } from './addresses';
import { applyFactor, hashString } from './utils';

export const INCREASE_ORDER_GAS_LIMIT_KEY = hashString(
  'INCREASE_ORDER_GAS_LIMIT'
);
export const DECREASE_ORDER_GAS_LIMIT_KEY = hashString(
  'DECREASE_ORDER_GAS_LIMIT'
);
export const SINGLE_SWAP_GAS_LIMIT_KEY = hashString('SINGLE_SWAP_GAS_LIMIT');
export const ESTIMATED_GAS_FEE_BASE_AMOUNT = hashString(
  'ESTIMATED_GAS_FEE_BASE_AMOUNT'
);
export const ESTIMATED_GAS_FEE_MULTIPLIER_FACTOR = hashString(
  'ESTIMATED_GAS_FEE_MULTIPLIER_FACTOR'
);

export async function getExecutionFee(
  increasingOrder: boolean,
  numberOfSwaps: number
) {
  const [wallet] = await ethers.getSigners();
  const dataStore = await IDataStore__factory.connect(
    getChainAddresses().gmx.dataStore,
    wallet
  );

  const baseGasLimit = await dataStore.getUint(ESTIMATED_GAS_FEE_BASE_AMOUNT);
  const multiplierFactor = await dataStore.getUint(
    ESTIMATED_GAS_FEE_MULTIPLIER_FACTOR
  );

  const estimatedGasLimit = await getOrderGasLimit(
    increasingOrder,
    numberOfSwaps,
    dataStore
  );

  const adjustedGasLimit = baseGasLimit.add(
    applyFactor(estimatedGasLimit, multiplierFactor)
  );

  let gasPrice = await getGasPrice(wallet);
  return gasPrice.mul(adjustedGasLimit);
}

async function getGasPrice(signer: Signer) {
  let gasPrice = await signer.getGasPrice();
  // Add 10% extra
  // TODO: this should be done in a better way
  return gasPrice.mul(11).div(10);
}

async function getOrderGasLimit(
  increasingOrder: boolean,
  numberOfSwaps: number,
  dataStore: IDataStore
) {
  let gasLimit = increasingOrder
    ? await dataStore.getUint(INCREASE_ORDER_GAS_LIMIT_KEY)
    : await dataStore.getUint(DECREASE_ORDER_GAS_LIMIT_KEY);
  if (numberOfSwaps > 0) {
    const singleSwapGasLimit = await dataStore.getUint(
      SINGLE_SWAP_GAS_LIMIT_KEY
    );
    gasLimit = gasLimit.add(singleSwapGasLimit.mul(numberOfSwaps));
  }
  return gasLimit;
}
