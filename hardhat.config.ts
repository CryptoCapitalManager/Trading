import { HardhatUserConfig } from "hardhat/types";
import * as dotenv from 'dotenv';

import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'solidity-docgen';
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"

dotenv.config();

const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",
	solidity: {
		compilers: [
			{
				version: "0.8.2",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				}
			}
		],
	},

	typechain: {
		outDir: 'typechain',
		target: 'ethers-v5',
	},

	docgen: {
		outputDir: './docs',
		theme: 'markdown',
		pageExtension: '.md'
	},

	networks: {
		// goerli: {
		// 	url: process.env.INFURA_GOERLI,
		// 	accounts: [process.env.PRIVATE_KEY],
		// 	accounts: ['84566bacd33cf8bb537e50913380e89827028a148077d6fc92fd3717fa65e63f'],
		// 	accounts: ['457e7e296c7262744d719c42ca109ac313e6dca0b438c8294afa3bdb88341c7c'],

		// 	allowUnlimitedContractSize: true,
		// },
		arbitrum: {
			url: process.env.INFURA_ARBITRUM,
			accounts: [process.env.INVESTIVA_MAIN_KEY as string],
		},
		arbitrumgoerli: {
			url: 'https://arbitrum-goerli.publicnode.com',
			accounts: [process.env.PRIVATE_KEY as string],
			// accounts: ['84566bacd33cf8bb537e50913380e89827028a148077d6fc92fd3717fa65e63f'],
			// accounts: ['457e7e296c7262744d719c42ca109ac313e6dca0b438c8294afa3bdb88341c7c']
			//accounts: ['e41c88d1d4681661864444728c3f181ae2938dd34f0a3b1fd7f63997fb5adbcb'],
			//accounts: ['417f4239f311fd0dd5408fa7561d0316a4e056f7a09128b5288305d9876242d8'],
			//accounts:['c7d9f5d7566f2a316e1ca1b2310bbae13bb484780b9b6e4359d2a8518ad3e8e6'],
		}
	},

	etherscan: {
		apiKey: process.env.ARBISCAN_KEY
	},
	
	sourcify: {
		enabled: true
	},

	gasReporter: {
		enabled: false
	}
};


export default config;