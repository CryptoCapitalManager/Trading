// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "../gmx-contracts-interfaces/IPositionRouter.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PositionRouterMock is IPositionRouter {

    ERC20 internal immutable USDC_CONTRACT;
    ERC20 internal immutable WETH_CONTRACT;

    mapping (address => uint256) internal openPositionValue;

    constructor(address _USDC_ADDRESS, address _WETH_ADDRESS){
        USDC_CONTRACT = ERC20(_USDC_ADDRESS);
        WETH_CONTRACT = ERC20(_WETH_ADDRESS);
    }
    function increasePositionRequestKeysStart() external override view returns (uint256){

    }
    function decreasePositionRequestKeysStart() external override view returns (uint256){

    }
    function increasePositionRequestKeys(uint256 index) external override view returns (bytes32){

    }
    function decreasePositionRequestKeys(uint256 index) external override view returns (bytes32){

    }
    function executeIncreasePositions(uint256 _count, address payable _executionFeeReceiver) external override{

    }
    function executeDecreasePositions(uint256 _count, address payable _executionFeeReceiver) external override{

    }
    function getRequestQueueLengths() external override view returns (uint256, uint256, uint256, uint256){

    }
    function getIncreasePositionRequestPath(bytes32 _key) external override view returns (address[] memory){

    }
    function getDecreasePositionRequestPath(bytes32 _key) external override view returns (address[] memory){

    }
    function createIncreasePosition(
        address[] memory _path,
        address _indexToken,
        uint256 _amountIn,
        uint256 _minOut,
        uint256 _sizeDelta,
        bool _isLong,
        uint256 _acceptablePrice,
        uint256 _executionFee,
        bytes32 _referralCode,
        address _callbackTarget
    ) external override payable returns (bytes32) {
        
        USDC_CONTRACT.transferFrom(msg.sender, address(this), _amountIn);

        openPositionValue[msg.sender] += _amountIn * 998 / 1000;

    }
    function createDecreasePosition(
        address[] memory _path,
        address _indexToken,
        uint256 _collateralDelta,
        uint256 _sizeDelta,
        bool _isLong,
        address _receiver,
        uint256 _acceptablePrice,
        uint256 _minOut,
        uint256 _executionFee,
        bool _withdrawETH,
        address _callbackTarget
    ) external override payable  returns (bytes32) {
        USDC_CONTRACT.transfer(msg.sender, openPositionValue[msg.sender]*999/1000);

        openPositionValue[msg.sender] = 0;
    }
}
