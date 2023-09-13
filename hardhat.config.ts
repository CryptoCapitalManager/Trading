const process = require('process');

import { HardhatUserConfig } from "hardhat/types";

import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'solidity-docgen';
import '@nomiclabs/hardhat-etherscan';
import "hardhat-gas-reporter"

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
		goerli: {
			url: process.env.INFURA_GOERLI,
			accounts: [process.env.PRIVATE_KEY],
			//accounts: ['84566bacd33cf8bb537e50913380e89827028a148077d6fc92fd3717fa65e63f'],
			//accounts: ['457e7e296c7262744d719c42ca109ac313e6dca0b438c8294afa3bdb88341c7c'],
			
			allowUnlimitedContractSize: true,
		},
		arbitrum: {
			url: '',
			accounts: [process.env.PRIVATE_KEY],

		},
		arbitrumgoerli: {
			url: 'https://arbitrum-goerli.publicnode.com',
			accounts: [process.env.PRIVATE_KEY],
		}
	},

	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY
	},

	gasReporter: {
		enabled: false
	}
};


export default config;