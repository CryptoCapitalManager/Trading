import readline from 'readline/promises';
import { deployOrConnect } from './gmx/deploy';
import { displayMarkets } from './gmx/markets';
import { decreasePosition, increasePosition } from './gmx/modifyPosition';
import { displayPositions } from './gmx/queryPosition';
import { depositUSDC, displayBalance } from './gmx/balance';

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const trading = await deployOrConnect(rl);

  while (true) {
    const question = [
      '',
      'Enter action number:',
      '0. exit',
      '1. query balance',
      '2. deposit USDC to trading smart contract',
      '3. increase position',
      '4. decrease position',
      '5. view markets',
      '6. view account positions',
      'input: ',
    ].join('\n');
    const answer = await rl.question(question);

    switch (answer) {
      case '0':
        return;
      case '1':
        await displayBalance(trading);
        break;
      case '2':
        await depositUSDC(trading, rl);
        break;
      case '3':
        await increasePosition(trading, rl);
        break;
      case '4':
        await decreasePosition(trading, rl);
        break;
      case '5':
        await displayMarkets();
        break;
      case '6':
        await displayPositions(await rl.question('Enter address: '));
        break;
      default:
        console.log('Invalid answer!');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
