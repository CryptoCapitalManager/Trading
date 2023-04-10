import hre, { ethers } from 'hardhat';

async function main() {
    const tradingFactory = await ethers.getContractFactory('Trading');

    //arbitrum adrese
    const Trading = await tradingFactory.deploy(
        '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        ['0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8','0xf97f4df75117a78c1A5a0DBb814Af92458539FB4'],
        '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064',
        '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868'
    );
    await Trading.deployed();

    console.log(`Trading address: ${Trading.address}`);
    console.log('Contract successfully deployed and verified on EtherScan!');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });