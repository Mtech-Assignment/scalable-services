const ethers = require('ethers');
require('dotenv').config();

module.exports = {
    // Connect to the blockchain (e.g., using Infura, Alchemy, or a local node)
    jsonRpcProvider: new ethers.JsonRpcProvider(process.env.rpcProviderUrl)
};
