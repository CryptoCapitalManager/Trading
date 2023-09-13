import hre, { ethers } from 'hardhat';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BigNumber } from 'ethers';

const TRADING_ADDRESS : string = '0xaCc276c03b28Afd822B8ef90A7180a3bE4Fb6ABb'; 

async function main() {
    const signers = await ethers.getSigners();
    const abi = JSON.parse(readFileSync(join(__dirname, '../artifacts/contracts/Trading.sol/Trading.json'), 'utf-8'));
    let trading = await new ethers.Contract(TRADING_ADDRESS, abi.abi, signers[0]);

    const abi2 = JSON.parse(readFileSync(join(__dirname, '../artifacts/contracts/USDC.sol/USDC.json'), 'utf-8'));
    let USDC = await new ethers.Contract('0x07865c6E87B9F70255377e024ace6630C1Eaa37F', abi2.abi, signers[0]);

    //await USDC.approve('0x47D3a0dA4068C96A2e196B85c5BceB85d26F9c16',BigNumber.from('1000000000000'));
    
    await trading.deposit(BigNumber.from('100000000'));
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

    
    // let x = await trading.getUserInvestments('0x3064Cc889fda6804a2d5eD40Eb3a10e79ea7f127');
    // let i =0;
    // while(x[i]!=undefined){
    //     console.log('Investment number '+ i);
    //     console.log(x[i].userOwnership.toString());
    //     console.log(x[i].initialInvestment.toString());
    //     console.log(x[i].annualFeeColectedTime.toString());
    //     i++;
    // }

    // await trading.withdraw(BigNumber.from('686000000'),2);
    console.log('done');   
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });