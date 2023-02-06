// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDC is ERC20{

    constructor() ERC20("USDC","USDC") {}

    function mintTokenToAddress (address _userAddress, uint256 amount) external{
        _mint(_userAddress, amount*10**18);
    }
    function burnTokensFromAddress (address _userAddress, uint256 amount) external{
        _burn(_userAddress, amount*10**18);
    }
}