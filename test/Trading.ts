import { artifacts, ethers, network } from 'hardhat';
import chai from 'chai';
import { deployMockContract, MockContract, solidity } from 'ethereum-waffle';
import { Trading } from '../typechain/Trading';
import { USDC } from '../typechain/USDC';
import { BigNumber, utils } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
//import { SwapRouter } from '@uniswap/v3-periphery';

chai.use(solidity);

const { expect } = chai;

describe('Trading', () => {
    let trading: Trading;
    let USDC: USDC;
    let signers: any[];

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const USDCFactory = await ethers.getContractFactory('USDC', signers[0]);
        USDC = (await USDCFactory.deploy()) as USDC;
        await USDC.deployed();

        expect(USDC.address).to.properAddress;
        expect(await USDC.name()).to.eq('USDC');
        expect(await USDC.symbol()).to.eq('USDC');

        // const swapRouter = new SwapRouter(
        //     // The address of the Uniswap V3 Router contract
        //     '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        //     // The provider to use for web3.js
        //     ethers.provider
        //   );
        const tradingFactory = await ethers.getContractFactory('Trading', signers[0]);
        trading = (await tradingFactory.deploy(USDC.address, [], '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064', '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868')) as Trading;
        await trading.deployed();

        expect(trading.address).to.properAddress;

        await USDC.mintTokenToAddress(trading.address, 100);

        expect(await trading.getContractValue()).to.eq(BigNumber.from('100000000000000000000'));

        let userInvestments: any;
        userInvestments = await trading.getUserInvestments(signers[0].address);

        expect(userInvestments[0].userOwnership).to.eq(1000000000);
        expect(await trading.gettotalUserOwnershipPoints()).to.eq(1000000000);

    });

    describe('deposit', async () => {

        it('should revert because the user is trying to deposit less than 100 USDC', async () => {
            USDC.mintTokenToAddress(signers[1].address, 50);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('50000000000000000000'));

            await expect(trading.deposit('50000000000000000000')).to.be.revertedWith('Insufficient amount or allowance.');
        });

        it('should revert because the user deposit would result in exceeding the contract\'s balance limit', async () => {
            USDC.mintTokenToAddress(signers[1].address, 5000000);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('10000000000000000000000000'));

            await expect(trading.deposit('10000000000000000000000000')).to.be.revertedWith('This deposit would exceed our limit.');
        });

        it('should deposit USDC to the contract and calculate userOwnership correctly', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));

            expect(await trading.deposit('300000000000000000000'))
                .to.emit(trading, 'userDeposit')
            //.withArgs(signers[1].address,[2940000,BigNumber.from('294000000000000000000'), await ethers.provider.getBlockNumber()]);

            expect(await trading.getContractValue()).to.eq(BigNumber.from('394000000000000000000'));
            expect(await USDC.balanceOf(signers[0].address)).to.eq(BigNumber.from('6000000000000000000'));

            let userInvestments = await trading.getUserInvestments(signers[1].address);
            expect(userInvestments[0].userOwnership).to.eq(2940000000);
            expect(userInvestments[0].initialInvestment).to.eq(BigNumber.from('294000000000000000000'));

        });
    });

    describe('withdraw', async () => {

        it('should revert because the user is trying to convert more ownership points to USDC than he has on the given investment', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            await expect(trading.withdraw(2940000000 + 1, 0)).to.be.revertedWith('Insufficient ownership points.');
        });

        it('should withdraw form the contract', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('147000000000000000000'));

            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('294000000000000000000'));
        });

        it('should withdraw form the contract with trading', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            
            //MOCKING PROFITABLE TRADES (100%)
            await USDC.mintTokenToAddress(trading.address, 394);
            

            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('264600000000000000000'));
            expect(await USDC.balanceOf(signers[0].address)).to.eq(BigNumber.from('35400000000000000000'));

            
            //MOCKING LOSING TRADES (around 30%)
            await USDC.burnTokensFromAddress(trading.address, 148)
            

            
            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('458735222672064777328'));
            expect(await USDC.balanceOf(signers[0].address)).to.eq(BigNumber.from('47183805668016194331'));


            await expect(trading.withdraw(1, 0)).to.be.revertedWith('Insufficient ownership points.');

            trading = trading.connect(signers[0]);
            expect(await trading.withdraw(1000000000, 0)).to.emit(trading, 'withdrawnFromInvestment');
            
            expect(await(USDC.balanceOf(signers[0].address))).to.eq(BigNumber.from('187264777327935222672'));

            expect(await USDC.balanceOf(trading.address)).to.eq(0);
        });

        it('should withdraw form the contract with aditional deposits', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            //NEW DEPOSIT
            USDC.mintTokenToAddress(signers[2].address, 200000);

            trading = trading.connect(signers[2]);
            USDC = USDC.connect(signers[2]);

            await USDC.approve(trading.address, BigNumber.from('200000000000000000000000'));
            await trading.deposit('200000000000000000000000');

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('147000000000000000000'));

            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('294000000000000000000'));

            await expect(trading.withdraw(1, 0)).to.be.revertedWith('Insufficient ownership points.');
        });

        it('should withdraw form the contract with trading and aditional deposits', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            //NEW DEPOSIT
            USDC.mintTokenToAddress(signers[2].address, 200000);

            trading = trading.connect(signers[2]);
            USDC = USDC.connect(signers[2]);

            await USDC.approve(trading.address, BigNumber.from('200000000000000000000000'));
            await trading.deposit('200000000000000000000000');

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            //MOCKING PROFITABLE TRADES (100%)
            await USDC.mintTokenToAddress(trading.address, 196394);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('264600000000000000000'));
            expect(await USDC.balanceOf(signers[0].address)).to.eq(BigNumber.from('4035400000000000000000'));

            //NEW DEPOSIT
            USDC.mintTokenToAddress(signers[3].address, 50000);

            trading = trading.connect(signers[3]);
            USDC = USDC.connect(signers[3]);

            await USDC.approve(trading.address, BigNumber.from('50000000000000000000000'));
            await trading.deposit('50000000000000000000000');

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            //MOCKING LOSING TRADES (around 30%)
            await USDC.burnTokensFromAddress(trading.address, 132448);
            
            expect(await trading.withdraw(2940000000 / 2, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[1].address)).to.eq(BigNumber.from('458640106547314346288'));
            expect(await USDC.balanceOf(signers[0].address)).to.eq(BigNumber.from('5047160026636828586571'));

            await expect(trading.withdraw(1, 0)).to.be.revertedWith('Insufficient ownership points.');

            trading = trading.connect(signers[2]);
            
            expect(await trading.withdraw(1960000000000, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[2].address)).to.eq(BigNumber.from('258720142063085795050443'));
            expect(await USDC.balanceOf(signers[0].address)).to.eq(BigNumber.from('20727195542408277349181'));

            await expect(trading.withdraw(1, 0)).to.be.revertedWith('Insufficient ownership points.');

            trading = trading.connect(signers[3]);

            expect(await trading.withdraw(245000000000, 0)).to.emit(trading, 'withdrawnFromInvestment');
            expect(await USDC.balanceOf(signers[3].address)).to.eq(BigNumber.from('34300022197357155476632'));
            expect(await USDC.balanceOf(signers[0].address)).to.eq(BigNumber.from('20727195542408277349181'));

            await expect(trading.withdraw(1, 0)).to.be.revertedWith('Insufficient ownership points.');

            trading = trading.connect(signers[0]);
            expect(await trading.withdraw(1000000000, 0)).to.emit(trading, 'withdrawnFromInvestment');
            
            expect(await(USDC.balanceOf(signers[0].address))).to.eq(BigNumber.from('20867195633009735126637'));

            expect(await USDC.balanceOf(trading.address)).to.eq(0);
        });
    });

    describe('collecting user fees', async () => {

        it('should revert because the last time we collected fees is less than a year ago', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            trading = trading.connect(signers[0]);
            await expect(trading.collectFees(signers[1].address, 0)).to.be.revertedWith('Cannot collect this investment fee at the moment.');
        });

        it('should revert because the caller is not the owner', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            await expect(trading.collectFees(signers[1].address, 0)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should collect fees and automatically reinvest the user\'s USDC', async () => {
            USDC.mintTokenToAddress(signers[1].address, 300);

            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('300000000000000000000'));
            await trading.deposit('300000000000000000000');

            await network.provider.send("evm_increaseTime", [3600 * 24 * 365 + 1]);
            await network.provider.send("evm_mine");

            trading = trading.connect(signers[0]);
            await expect(trading.collectFees(signers[1].address, 0)).to.emit(trading, 'feeCollected');

            let userInvestment = await trading.getUserInvestments(signers[1].address);
            expect(userInvestment[1].initialInvestment).to.eq(BigNumber.from('288120000000000000000'));
            expect(userInvestment[1].userOwnership).to.eq(2881200000);
        });
    });
});
