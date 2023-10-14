import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export function hashData(dataTypes: string[], dataValues: any[]) {
  const bytes = ethers.utils.defaultAbiCoder.encode(dataTypes, dataValues);
  const hash = ethers.utils.keccak256(ethers.utils.arrayify(bytes));
  return hash;
}

export function hashString(string: string) {
  return hashData(['string'], [string]);
}

const PRECISION = BigNumber.from(10).pow(30);

export function applyFactor(n: BigNumber, factor: BigNumber) {
  return n.mul(factor).div(PRECISION);
}

export function toDecimal(
  n: BigNumber,
  decimals: number,
  precision = 6
): number {
  const scaled =
    decimals > precision
      ? n.div(BigNumber.from(10).pow(decimals - precision))
      : n.mul(BigNumber.from(10).pow(precision - decimals));

  return scaled.toNumber() / 10 ** precision;
}

export function toDecimalString(
  n: BigNumber,
  decimals: number,
  precision = 6
): string {
  if (precision == 0) {
    return n.div(BigNumber.from(10).pow(decimals)).toBigInt().toString();
  }

  return toDecimal(n, decimals, precision).toFixed(precision);
}
