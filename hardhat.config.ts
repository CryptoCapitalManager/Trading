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
		rinkeby: {
			url: 'https://rinkeby.infura.io/v3/7ddf913c0c1a48f6ae1fa498e0c9367d',
			accounts: ['0x2beee09932ab49f61464ad6caab22a281a76252221103774c8a81331a3e9c82f'],
		},
	},

	etherscan: {
		apiKey: 'TF2D7W6BC7H2VQNVVFY3FZ9W8BC9N2SFHJ'
	},

	gasReporter: {
		enabled: false 
	}
};


export default config;