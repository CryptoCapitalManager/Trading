# Solidity API

## Investment

```solidity
struct Investment {
  uint256 userOwnership;
  uint256 initialInvestment;
  uint256 annualFeeColectedTime;
}
```

## Trading

### USDC_CONTRACT

```solidity
contract ERC20 USDC_CONTRACT
```

### MAX_ASSETS_DEPOSITED

```solidity
uint256 MAX_ASSETS_DEPOSITED
```

### userRecord

```solidity
mapping(address => struct Investment[]) userRecord
```

### totalUserOwnershipPoints

```solidity
uint256 totalUserOwnershipPoints
```

### liquidityPools

```solidity
address[] liquidityPools
```

### userDeposit

```solidity
event userDeposit(address user, struct Investment investment)
```

This event is emitted when a user deposit occurs.

_This event is being emitted so we can listen for it on the backend service and update our database._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The source account. |
| investment | struct Investment | The investment struct that is created for the user. |

### withdrawnFromInvestment

```solidity
event withdrawnFromInvestment(address user, struct Investment investment, uint256 amount)
```

This event is emitted when a user withdraws assets from his investment.

_This event is being emitted so we can listen for it on the backend service and update our database._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The source account. |
| investment | struct Investment | The investment struct that the user is withdrawing from. |
| amount | uint256 |  |

### feeCollected

```solidity
event feeCollected(address user, struct Investment newInvestment)
```

_This event is being emitted so we can listen for it on the backend service and update our database._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user account that we are getting our fees from. |
| newInvestment | struct Investment | The investment struct that will be replacing the investment we took fees from. |

### constructor

```solidity
constructor(address _USDC_ADDRESS, address[] _liquidityPools) public
```

_In the constructor, we are setting `USDC_CONTRACT`, `MAX_ASSETS_DEPOSITED` and `liquidityPools` variables. 
After contract deployment, we should manually send 100k USDC tokens to the contract from the account that deployed the contract.
With this little compromise we were able to implement much more gas-efficient logic in our smart contract._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _USDC_ADDRESS | address | Smart contract address of the USDC. |
| _liquidityPools | address[] | An array of all liquidity pools we will be able to interact with. |

### deposit

```solidity
function deposit(uint256 amount) external
```

Deposit your USDC to our smart contract.

_After a user passes all the requirements we are calculating his userOwnershipPoints for that investment.
Variable `userOwnershipPoints` represents the percentage of ownership of the contract's assets when compared to the variable `totalUserOwnershipPoints`.
After that, we are creating an investment that consists of `userOwnershipPoints` we calculated, `amount` of USDC tokens that is being invested, 
and the current block height (`block.timestamp`) that we later use when we want to charge our annual fee._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of USDC the user is willing to deposit. |

### withdraw

```solidity
function withdraw(uint256 amount, uint256 investmentNumber) external
```

Withdraw your USDC from our smart contract.

_After a user passes all the requirements we are calculating if there was any profit being made in his `investment` lifespan.
We are calculating `toBeWithdrawn` based on the `amount` user has provided. 
Lowering the `initialInvestment` amount of the `investment` based on how much the user withdrew from the `investment`, 
also buring `amount` of userOwnershipPoints. 
At the end of the transaction, we are transferring us our cut and the user his USDC._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The number of userOwnershipPoints the user is willing to liquidate from his investment. |
| investmentNumber | uint256 | A number of investment that the user is withdrawing from. |

### swapTokens

```solidity
function swapTokens(uint256 amount, address liquidityPool, bool _type) external
```

### enterLong

```solidity
function enterLong(uint256 amount, address pair) external
```

### enterShort

```solidity
function enterShort(uint256 amount, address pair) external
```

### closePosition

```solidity
function closePosition(uint256 amount, address pair) external
```

### getAllPositionValue

```solidity
function getAllPositionValue() public pure returns (uint256)
```

_The function returns the value of all our open positions in USDC using Chainlink Data Feeds._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | value Value of all our open positions in USDC. |

### getContractValue

```solidity
function getContractValue() public view returns (uint256)
```

_The function returns the total value of all assets on our contract in USDC using Chainlink Data Feeds._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | value Value of all assets on our contract in USDC. |

### collectFees

```solidity
function collectFees(address user, uint256 investmentNumber) external
```

_We can only call this function if we are trying to charge our annual fee on an investment that is 365+ days old.
Calculating the profit that we made taking 20% of it and taking 2% of the rest of the investment as our annual fee.
Deleting the investment we took assets from, and making a new investment with all the other assets (automatic reinvesting).
This function will be called from our backend service as soon as we are able to collect fees._

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user we are charging an annual fee. |
| investmentNumber | uint256 | A number of investment that we are charging an annual fee. |

### setMaxAssetsDeposited

```solidity
function setMaxAssetsDeposited(uint256 amount) external
```

_The function changes the maximum amount of assets we are willing to take._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | New value for the variable `MAX_ASSETS_DEPOSITED`. |

### getUserInvestments

```solidity
function getUserInvestments(address user) external view returns (struct Investment[])
```

### gettotalUserOwnershipPoints

```solidity
function gettotalUserOwnershipPoints() external view returns (uint256)
```

### getUSDCValueFromInvestment

```solidity
function getUSDCValueFromInvestment(address user, uint256 investmentNumber) external view returns (uint256)
```

## USDC

### constructor

```solidity
constructor() public
```

### mintTokenToAddress

```solidity
function mintTokenToAddress(address _userAddress, uint256 amount) external
```

### burnTokensFromAddress

```solidity
function burnTokensFromAddress(address _userAddress, uint256 amount) external
```

