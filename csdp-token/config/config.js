const ethers = require('ethers');

require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your_secret_key', // Keep this secret
    jwtExpiration: process.env.JWT_EXPIRATION || '1h', // Token expiration time

    // Connect to the blockchain (e.g., using Infura, Alchemy, or a local node)
    jsonRpcProvider: new ethers.JsonRpcProvider(process.env.rpcProviderUrl),
};
