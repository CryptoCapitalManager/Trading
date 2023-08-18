import hre, { ethers } from 'hardhat';

async function main() {
    const tradingFactory = await ethers.getContractFactory('Trading');

    //goerli adrese
    const Trading = await tradingFactory.deploy(
        '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
        ['0x07865c6E87B9F70255377e024ace6630C1Eaa37F','0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'],
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
    );
    await Trading.deployed();

    console.log(`Trading address: ${Trading.address}`);
    console.log('Contract successfully deployed!');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });