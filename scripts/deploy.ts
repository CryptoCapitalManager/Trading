import hre, { ethers } from 'hardhat';

async function main() {
    // const tradingFactory = await ethers.getContractFactory('Trading');

    // //goerli adrese
    // const Trading = await tradingFactory.deploy(
    //     '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    //     ['0x07865c6E87B9F70255377e024ace6630C1Eaa37F','0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'],
    //     '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    //     '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    //     '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
    // );
    // await Trading.deployed();

    // console.log(`Trading address: ${Trading.address}`);
    // console.log('Contract successfully deployed!');

    
    const requestActionFactory = await ethers.getContractFactory('RequestAction');

    const RequestAction = await requestActionFactory.deploy(
        '0x65AC8736196C4a36b4E3b816a0B9858Bd8f7cF4e',
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
    );
    await RequestAction.deployed();

    console.log(`RequestAction address: ${RequestAction.address}`);
    console.log('Contract successfully deployed!');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });