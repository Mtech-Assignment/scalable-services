const { ethers, formatUnits } = require('ethers');
const { jsonRpcProvider } = require('../config/config');
const csdpAbi = require('../abi/CSDP.json');

exports.recoverWallet = async (mnemonic) => {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    return wallet;
};

// get custom token balance here it's CSDP token
exports.getTokenBalance = async (address, tokenAddress) => {
    const provider = jsonRpcProvider;
    const tokenContract = new ethers.Contract(tokenAddress, csdpAbi.abi, provider);
    const balance = await tokenContract.balanceOf(address);
    console.log("Balance in CSDP token : "+balance);
    return formatUnits(balance, 18); 
};

// Function to get Ether balance
exports.getEtherBalance = async (address) => {
    const provider = jsonRpcProvider;
    const balance = await provider.getBalance(address);
    console.log("Balance in ether : "+balance);
    return formatUnits(balance, "ether");
};

exports.getWalletFromMnemonic = async (mnemonic) => {
    console.log("Mnemonic Phrase : "+mnemonic);
    // Create wallet using provided mnemonic
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return wallet;
}