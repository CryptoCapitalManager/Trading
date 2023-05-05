import { artifacts, ethers, network } from 'hardhat';
import chai from 'chai';
import { deployMockContract, MockContract, solidity } from 'ethereum-waffle';
import { Trading } from '../typechain/Trading';
import { USDC } from '../typechain/USDC';
import { SwapRouterMock } from '../typechain/SwapRouterMock';
import { RouterMock } from '../typechain/RouterMock';
import { PositionRouterMock } from '../typechain/PositionRouterMock';
import { BigNumber, utils } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
//import { SwapRouter } from '@uniswap/v3-periphery';

chai.use(solidity);

const { expect } = chai;

describe('Trading', () => {
    let trading: Trading;
    let USDC: USDC;
    let UNI: USDC;
    let CRV: USDC;
    let WETH: USDC;
    let swapRouterMock: SwapRouterMock;
    let routerMock: RouterMock;
    let positionRouterMock: PositionRouterMock;
    let signers: any[];

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const USDCFactory = await ethers.getContractFactory('USDC', signers[0]);
        USDC = (await USDCFactory.deploy()) as USDC;
        await USDC.deployed();

        expect(USDC.address).to.properAddress;
        expect(await USDC.name()).to.eq('USDC');
        expect(await USDC.symbol()).to.eq('USDC');

        const UNIFactory = await ethers.getContractFactory('USDC', signers[0]);
        UNI = (await UNIFactory.deploy()) as USDC;
        await UNI.deployed();

        expect(UNI.address).to.properAddress;

        const CRVFactory = await ethers.getContractFactory('USDC', signers[0]);
        CRV = (await CRVFactory.deploy()) as USDC;
        await CRV.deployed();

        expect(CRV.address).to.properAddress;

        const WETHFactory = await ethers.getContractFactory('USDC', signers[0]);
        WETH = (await WETHFactory.deploy()) as USDC;
        await WETH.deployed();

        expect(WETH.address).to.properAddress;

        const SwapRouterMockedFactory = await ethers.getContractFactory('SwapRouterMock', signers[0]);
        swapRouterMock = (await SwapRouterMockedFactory.deploy(USDC.address, UNI.address, CRV.address)) as SwapRouterMock;
        await swapRouterMock.deployed();

        expect(swapRouterMock.address).to.properAddress;

        // const swapRouter = new SwapRouter(
        //     // The address of the Uniswap V3 Router contract
        //     '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        //     // The provider to use for web3.js
        //     ethers.provider
        //   );

        const routerMockFactory = await ethers.getContractFactory('RouterMock', signers[0]);
        routerMock = (await routerMockFactory.deploy()) as RouterMock;
        await routerMock.deployed();

        expect(routerMock.address).to.properAddress;

        const positionRouterMockFactory = await ethers.getContractFactory('PositionRouterMock', signers[0]);
        positionRouterMock = (await positionRouterMockFactory.deploy(USDC.address, WETH.address)) as PositionRouterMock;
        await positionRouterMock.deployed();

        expect(positionRouterMock.address).to.properAddress;

        const tradingFactory = await ethers.getContractFactory('Trading', signers[0]);
        trading = (await tradingFactory.deploy(USDC.address, [USDC.address, UNI.address, CRV.address], swapRouterMock.address,
            routerMock.address, positionRouterMock.address)) as Trading;
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

            expect(await (USDC.balanceOf(signers[0].address))).to.eq(BigNumber.from('187264777327935222672'));

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

            expect(await (USDC.balanceOf(signers[0].address))).to.eq(BigNumber.from('20867195633009735126637'));

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

    describe('swapTokens', async () => {

        it('should revert because the caller is not the owner', async () => {
            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await expect(trading.swapTokens(1, USDC.address, UNI.address, 3000, 0, 0)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should revert because the owner is trying to trade token that is not approved', async () => {
            USDC.mintTokenToAddress(trading.address, 1000);
            UNI.mintTokenToAddress(swapRouterMock.address, 1000);

            await expect(trading.swapTokens(BigNumber.from('1000000000000000000000'), USDC.address, '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868', 3000,
                0, 0)).to.be.revertedWith(`You can't trade tokens that are not approved.`);
        });

        it('should swap USDC for UNI and UNI for USDC', async () => {
            USDC.mintTokenToAddress(trading.address, 900);
            UNI.mintTokenToAddress(swapRouterMock.address, 1000);

            await trading.swapTokens(BigNumber.from('1000000000000000000000'), USDC.address, UNI.address, 3000, 0, 0);

            expect(await USDC.balanceOf(trading.address)).to.eq(0);
            expect(await USDC.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('1000000000000000000000'));

            expect(await UNI.balanceOf(trading.address)).to.eq(BigNumber.from('199400000000000000000'));
            expect(await UNI.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('800600000000000000000'));

            await trading.swapTokens(BigNumber.from('199400000000000000000'), UNI.address, USDC.address, 3000, 0, 0);

            expect(await USDC.balanceOf(trading.address)).to.eq(BigNumber.from('994009000000000000000'));
            expect(await USDC.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('5991000000000000000'));

            expect(await UNI.balanceOf(trading.address)).to.eq(0);
            expect(await UNI.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('1000000000000000000000'));
        });
    });

    describe('swapTokensMultihop', async () => {

        it('should revert because the caller is not the owner', async () => {
            trading = trading.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await expect(trading.swapTokensMultihop(1, USDC.address, UNI.address, CRV.address, 3000, 3000, 0)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should revert because the owner is trying to trade token that is not approved', async () => {
            USDC.mintTokenToAddress(trading.address, 1000);
            UNI.mintTokenToAddress(swapRouterMock.address, 1000);

            await expect(trading.swapTokensMultihop(1, USDC.address, UNI.address, '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868', 3000, 3000, 0)).to.be.revertedWith(`You can't trade tokens that are not approved.`);
        });

        it('should swap USDC for CRV and CRV for USDC', async () => {
            USDC.mintTokenToAddress(trading.address, 900);
            CRV.mintTokenToAddress(swapRouterMock.address, 1000);

            await trading.swapTokensMultihop(BigNumber.from('1000000000000000000000'), USDC.address, UNI.address, CRV.address, 3000, 3000, 0);

            expect(await USDC.balanceOf(trading.address)).to.eq(0);
            expect(await USDC.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('1000000000000000000000'));

            expect(await CRV.balanceOf(trading.address)).to.eq(BigNumber.from('497004500000000000000'));
            expect(await CRV.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('502995500000000000000'));

            await trading.swapTokensMultihop(BigNumber.from('497004500000000000000'), CRV.address, UNI.address, USDC.address, 3000, 3000, 0);

            expect(await USDC.balanceOf(trading.address)).to.eq(BigNumber.from('988053892081000000000'));
            expect(await USDC.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('11946107919000000000'));

            expect(await CRV.balanceOf(trading.address)).to.eq(0);
            expect(await CRV.balanceOf(swapRouterMock.address)).to.eq(BigNumber.from('1000000000000000000000'));
        });
    });

    describe('enterPositionPerpetual', async () => {

        it('open and close USDC/ETH short position', async () => {
            USDC.mintTokenToAddress(trading.address, 900);


            await
                trading.enterPositionPerpetual([USDC.address, WETH.address], WETH.address, BigNumber.from('1000000000000000000000'), 0, BigNumber.from('1100000000000000000000'), true,
                    BigNumber.from('1869090500000000000000000000000000'), BigNumber.from('200000000000000'),
                    ethers.utils.formatBytes32String('0'), ethers.constants.AddressZero);

            expect(await USDC.balanceOf(trading.address)).to.eq(0);
            expect(await USDC.balanceOf(positionRouterMock.address)).to.eq(BigNumber.from('1000000000000000000000'));

            await
                trading.closePositionPerpetual([USDC.address], WETH.address, 0, BigNumber.from('1000000000000000000000'), true, trading.address,
                    BigNumber.from('1869090500000000000000000000000000'), 0, BigNumber.from('100000000000000'), false, ethers.constants.AddressZero);

            expect(await USDC.balanceOf(trading.address)).to.eq(BigNumber.from('997002000000000000000'));
            expect(await USDC.balanceOf(positionRouterMock.address)).to.eq(BigNumber.from('2998000000000000000'));
        });
    });


});
