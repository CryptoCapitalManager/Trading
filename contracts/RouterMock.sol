// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;
import '../gmx-contracts-interfaces/IRouter.sol';
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RouterMock is IRouter {


    function addPlugin(address _plugin) external  override{

    }
    function pluginTransfer(address _token, address _account, address _receiver, uint256 _amount) external override{

    }
    function pluginIncreasePosition(address _account, address _collateralToken, address _indexToken, uint256 _sizeDelta, bool _isLong) external override{

    }
    function pluginDecreasePosition(address _account, address _collateralToken, address _indexToken, uint256 _collateralDelta, uint256 _sizeDelta, bool _isLong, address _receiver) external override returns (uint256){

    }
    function swap(address[] memory _path, uint256 _amountIn, uint256 _minOut, address _receiver) external override{

    }
    function approvePlugin(address _plugin) external override{

    }
}