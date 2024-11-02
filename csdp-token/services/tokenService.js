const { ethers, formatUnits } = require('ethers');
const { jsonRpcProvider } = require('../config/config');
const csdpAbi = require('../abi/CSDP.json');
const { decryptMnemonic } = require('../utils/encrypt');

const csdpTokenContract = new ethers.Contract(process.env.csdpAddress, csdpAbi.abi, jsonRpcProvider);
require('dotenv').config();


exports.getTokenBalance = async (address) => {
    let etherBalance = await provider.getBalance(address);
    etherBalance = formatUnits(etherBalance, "ether");
    console.log("Balance in ether : "+etherBalance);
    
    let tokenBalance = await csdpTokenContract.balanceOf(address);
    tokenBalance = formatUnits(tokenBalance, 18);
    console.log("Balance in CSDP token : "+tokenBalance);
    
    return { etherBalance, tokenBalance }; 
};

exports.approveToken = async (amount, userWallet) => {
    const wallet = new ethers.Wallet(userWallet.privateKey, jsonRpcProvider);
    const contractWithSigner = csdpTokenContract.connect(wallet);
    const convertedPrice = ethers.parseUnits(amount.toString(), 18);
    const csdpApprovalTxn = await contractWithSigner.approve(
        process.env.nftMarketplaceAddress,
        convertedPrice
    );
    await csdpApprovalTxn.wait();
}

exports.getUserTransactions = async (userAddress) => {
    const etherscanUrl = `https://api-holesky.etherscan.io/api?module=account&action=txlist&address=${userAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`;

    let txns = await (await fetch(etherscanUrl)).json();
    txns.result = txns.result.map(txn => {
        return { 
            from: txn.from, 
            ...(txn.to && { to: txn.to }) , 
            value: txn.value, 
            ...(txn.functionName && { functionName: txn.functionName }) 
        };
    });

    return txns;
};

exports.getUserWallet = async (authToken) => {
    const authServiceUrl = `${process.env.AUTH_SERVICE_URL}/user/wallet`;

    const userMnemonicResult = await (await fetch(authServiceUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        }
    })).json();

    console.log("Getting user wallet mnemonic from auth service ", userMnemonicResult);

    // Decrypt the mnemonic for recovery purposes
    const decryptedMnemonic = decryptMnemonic(userMnemonicResult.user_mnemonic);
    console.log("Decrypted Mnemonic: "+decryptedMnemonic);
    console.log();

    // Create wallet from decrypted mnemonic
    const wallet = ethers.Wallet.fromPhrase(decryptedMnemonic);
    console.log("User wallet: "+JSON.stringify(wallet));
    console.log();
    return wallet;
}