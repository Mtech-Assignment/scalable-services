const { ethers } = require('ethers');
const { decryptMnemonic } = require('../utils/encrypt');
const nftContractABI = require('../abi/NFT.json');
const NFT = require('../models/NFT');
require('dotenv').config();

// Connect to the blockchain (e.g., using Infura, Alchemy, or a local node)
const provider = new ethers.JsonRpcProvider(process.env.rpcProviderUrl);

// Create a new instance of the contract
const nftContract = new ethers.Contract(process.env.nftAddress, nftContractABI.abi, provider);

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

exports.getUserOwnedNFTs = async function(userName) {
    const userOwnedNFTs = await NFT.find({ owner: userName });
    console.log("User Owned NFT on marketplace : ", userOwnedNFTs);
    console.log();
    return { owned_nft_items: userOwnedNFTs };
}

exports.mintNFT = async function({ name, price, description, tokenURI, userName }) {
    // save it to db
    const newNFT = new NFT({ name, price, description, tokenDetailURI: tokenURI, owner: userName });
    await newNFT.save();
    return { nft_minted: true, tokenid: newNFT._id };
};

exports.approveNftToMarketplace = async function(userWallet, nftId) {
    const wallet = new ethers.Wallet(userWallet.privateKey, provider);
    const nftContractWithSigner = nftContract.connect(wallet);
    const nftApproveTxn = await nftContractWithSigner.approve(process.env.nftMarketplaceAddress, nftId);
    await nftApproveTxn.wait();
}

exports.getNftDetail = async function(nftId) {
    const tokenInfo = await NFT.findById(nftId);
    return { nft_info: tokenInfo };
}

exports.burnNFT = async function(nftId) {
    await NFT.deleteOne({ _id: nftId });
}
