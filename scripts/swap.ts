import hre, { ethers } from 'hardhat';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BigNumber } from 'ethers';

// const TRADING_ADDRESS : string = '0x92e1BCB75CCFF214F9ffbBba1d974b7b4686bC0c'; 

async function main() {
    const signers = await ethers.getSigners();
    const abi = JSON.parse(readFileSync(join(__dirname, '../artifacts/contracts/Trading.sol/Trading.json'), 'utf-8'));
    let trading = await new ethers.Contract('0x65AC8736196C4a36b4E3b816a0B9858Bd8f7cF4e', abi.abi, signers[0]);

    const abi2 = JSON.parse(readFileSync(join(__dirname, '../artifacts/contracts/USDC.sol/USDC.json'), 'utf-8'));
    let USDC = await new ethers.Contract('0xaf88d065e77c8cC2239327C5EDb3A432268e5831', abi2.abi, signers[0]);

    const abi3 = JSON.parse(readFileSync(join(__dirname, '../artifacts/contracts/RequestAction.sol/RequestAction.json'), 'utf-8'));
    let requestAction = await new ethers.Contract('0x22698012fd81706d452a75AaB1F65488aB4A677b', abi3.abi, signers[0]);

    // await requestAction.approveUSDC();
    await trading.setRequestActionAddress('0x22698012fd81706d452a75AaB1F65488aB4A677b');

    console.log(await trading.getAllPositionValue().toString());

    // await USDC.approve(requestAction.address,BigNumber.from('150000000'));

    // await requestAction.requestDeposit(BigNumber.from('150000000'));

    // await requestAction.executeDeposit(0);
    // await trading.deposit(BigNumber.from('150000000'));    
    //await trading.transferAllEther();
    //await trading.withdraw(BigNumber.from('147000000000'),3)
    //const x = await trading.getUserInvestments('0x82B7F581E53E9ef9b009833d53a914c626822647');
    //console.log(x);
    //await trading.deposit()
    // let x = 1;                                   
    //await trading.swapTokens(BigNumber.from('100000000000'),'0x07865c6E87B9F70255377e024ace6630C1Eaa37F','0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',3000, 0, 0);
    // console.log(x);
    // let x = await trading.getContractValue();
    // console.log(x.toString());                                           0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
    //await trading.swapTokensMultihop(BigNumber.from('4035700785853027'),'0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984','0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6','0x07865c6E87B9F70255377e024ace6630C1Eaa37F', 500, 500, 0);
    // console.log('done');                            

    // await trading.withdrawMultiple([{amount:1476394108,investmentNumber:0}],1);
    // let x = await trading.getUserInvestments('0x1203223FB5Fa444a600683B1b4Bc002E8efB1658');
    // let i =0;
    // while(x[i]!=undefined){
    //     console.log('Investment number '+ i);
    //     console.log(x[i].userOwnership.toString());
    //     console.log(x[i].initialInvestment.toString());
    //     console.log(x[i].annualFeeColectedTime.toString());
    //     i++;
    // }
    // const y = await trading.gettotalUserOwnershipPoints();
    // console.log(y.toString());
    
    console.log('done');   
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });