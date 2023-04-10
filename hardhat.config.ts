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
		},
		arbitrum: {
			url: '',
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