import { artifacts, ethers, network } from 'hardhat';
import chai from 'chai';
import { deployMockContract, MockContract, solidity } from 'ethereum-waffle';
import { Trading } from '../typechain/Trading';
import { RequestAction } from '../typechain/RequestAction';
import { USDC } from '../typechain/USDC';
import { SwapRouterMock } from '../typechain/SwapRouterMock';
import { RouterMock } from '../typechain/RouterMock';
import { PositionRouterMock } from '../typechain/PositionRouterMock';
import { BigNumber, utils } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';

//import { SwapRouter } from '@uniswap/v3-periphery';

chai.use(solidity);

const { expect } = chai;

describe('RequestAction', () => {
    let requestAction: RequestAction;
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

        const requestActionFactory = await ethers.getContractFactory('RequestAction', signers[0]);
        requestAction = (await requestActionFactory.deploy(trading.address,USDC.address)) as RequestAction;
        await requestAction.deployed();

        expect(requestAction.address).to.properAddress;

        await requestAction.approveUSDC();
        await trading.setRequestActionAddress(requestAction.address);

        await USDC.mintTokenToAddress(trading.address, 100);

        expect(await trading.getContractValue()).to.eq(BigNumber.from('100000000'));

        let userInvestments: any;
        userInvestments = await trading.getUserInvestments(signers[0].address);

        expect(userInvestments[0].userOwnership).to.eq(1000000000);
        expect(await trading.gettotalUserOwnershipPoints()).to.eq(1000000000);

    });

    describe('deposit', async () => {

        it('should revert because the user is trying to deposit less than 100 USDC', async () => {
            USDC.mintTokenToAddress(signers[1].address, 50);

            requestAction = requestAction.connect(signers[1]);
            USDC = USDC.connect(signers[1]);

            await USDC.approve(trading.address, BigNumber.from('50000000'));

            await expect(trading.deposit('50000000')).to.be.revertedWith('Insufficient amount or allowance.');
        });

        it('should deposit on Trading contract', async () => {
            USDC.mintTokenToAddress(signers[1].address, 500);

            requestAction = requestAction.connect(signers[1]);
            USDC = USDC.connect(signers[1]);
            
            await USDC.approve(requestAction.address, BigNumber.from('500000000'));

            await expect(requestAction.requestDeposit('500000000')).to.to.emit(requestAction, 'userDepositRequest')
            .withArgs(signers[1].address,BigNumber.from('490000000'));

            requestAction = requestAction.connect(signers[0]);

            await requestAction.executeDeposit(0);

            const blockNumBefore = await ethers.provider.getBlockNumber();
			const blockBefore = await ethers.provider.getBlock(blockNumBefore);
			const timestampBefore = blockBefore.timestamp;
            
            const tmp = await trading.getUserInvestments(signers[1].address);
            const userInvestment = tmp[0]; 
            
            expect (userInvestment[0]).to.eq(BigNumber.from('4900000000'));
            expect (userInvestment[1]).to.eq(BigNumber.from('490000000'));
            expect (userInvestment[2]).to.eq(BigNumber.from(timestampBefore));
        });

        it('should cancel user deposit request', async () => {
            USDC.mintTokenToAddress(signers[1].address, 500);

            requestAction = requestAction.connect(signers[1]);
            USDC = USDC.connect(signers[1]);
            
            await USDC.approve(requestAction.address, BigNumber.from('500000000'));

            await expect(requestAction.requestDeposit('500000000')).to.emit(requestAction, 'userDepositRequest')
            .withArgs(signers[1].address,BigNumber.from('490000000'));

            await expect(requestAction.cancelDepositRequest(0)).to.emit(requestAction,'userDepositCanceled').withArgs(0);

            const tmp = await requestAction.getAllDepositRequests();
            const userDepositRequest = tmp[0];
        
            expect (userDepositRequest[0]).to.eq(ethers.constants.AddressZero);
        });
    });

    describe('withdraw', async () => {

        it('should revert because the user is trying to withdraw more USDC than his ivestment is worth', async () => {
            USDC.mintTokenToAddress(signers[1].address, 100);

            requestAction = requestAction.connect(signers[1]);
            USDC = USDC.connect(signers[1]);
            
            await USDC.approve(requestAction.address, BigNumber.from('100000000'));

            await requestAction.requestDeposit('100000000');

            requestAction = requestAction.connect(signers[0]);

            await requestAction.executeDeposit(0);

            requestAction = requestAction.connect(signers[1]);

            await expect(requestAction.requestWithdrawal(BigNumber.from('980000001'),0)).to.be.revertedWith("Insufficient ownership points.");

        });

        it('should withdraw from the Trading contract', async () => {
            USDC.mintTokenToAddress(signers[1].address, 100);

            requestAction = requestAction.connect(signers[1]);
            USDC = USDC.connect(signers[1]);
            
            await USDC.approve(requestAction.address, BigNumber.from('100000000'));

            await requestAction.requestDeposit('100000000');

            requestAction = requestAction.connect(signers[0]);
            await requestAction.executeDeposit(0);
            
            requestAction = requestAction.connect(signers[1]);
            await requestAction.requestWithdrawal(BigNumber.from('980000000'),0);
            
            requestAction = requestAction.connect(signers[0]);
            await requestAction.executeWithdrawal(0);
            
            expect (await USDC.balanceOf(signers[1].address)).to.be.eq(BigNumber.from('98000000'));
        });

        it('should cancel user withdraw request', async () => {
            USDC.mintTokenToAddress(signers[1].address, 100);

            requestAction = requestAction.connect(signers[1]);
            USDC = USDC.connect(signers[1]);
            
            await USDC.approve(requestAction.address, BigNumber.from('100000000'));

            await requestAction.requestDeposit('100000000');

            requestAction = requestAction.connect(signers[0]);
            await requestAction.executeDeposit(0);
            
            requestAction = requestAction.connect(signers[1]);
            await requestAction.requestWithdrawal(BigNumber.from('980000000'),0);
            
            await expect(requestAction.cancelWithdrawalRequest(0)).to.emit(requestAction,'userWithdrawalCanceled').withArgs(0);

            const tmp = await requestAction.getAllWithdrawalRequests();
            const userWithdrawalRequest = tmp[0];
        
            expect (userWithdrawalRequest[0]).to.eq(ethers.constants.AddressZero);
        });
    });

});
