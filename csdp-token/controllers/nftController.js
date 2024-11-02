const { PinataSDK } = require('pinata-web3');
const nftService = require('../services/nftService');
const walletService = require('../services/walletService');
const { decryptMnemonic } = require('../utils/encrypt');
const User = require('../models/User');
const fs = require('fs');
const { Blob } = require("buffer");
require('dotenv').config();

async function getUserWallet(user) {
    // Decrypt the mnemonic for recovery purposes
    const decryptedMnemonic = decryptMnemonic(user.mnemonic);
    console.log("Decrypted Mnemonic: "+decryptedMnemonic);
    console.log();

    // Create wallet from decrypted mnemonic
    const wallet = await walletService.getWalletFromMnemonic(decryptedMnemonic);
    console.log("Minting NFT with user wallet: "+JSON.stringify(wallet));
    console.log();
    return wallet;
}

exports.getListedNFTOnMarketplace = async (req, res) => {
    try {
        const listedNftList = await nftService.getAllListedNFTs();
        res.status(200).json({ success: true, listedNftList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getUserOwnedNFTOnMarketplace = async (req, res) => {
    const { userId } = req.params;
    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user || user.id !== userId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const wallet = await getUserWallet(user);

        const userOwnedNfts = await nftService.getUserOwnedNFTs(wallet);
        res.status(200).json({ success: true, userOwnedNfts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getUserListedNFTOnMarketplace = async (req, res) => {
    const { userId } = req.params;
    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user || userId !== user.id) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const wallet = await getUserWallet(user);

        const userListedNfts = await nftService.getUserListedNFTs(wallet);
        res.status(200).json({ success: true, listed_nfts: userListedNfts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Mint an NFT
exports.mintNFT = async (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    const pinata = new PinataSDK({
        pinataJwt: process.env.PINATA_JWT
    });
    const pinataGateway = process.env.PINATA_GATEWAY;

    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Minting NFT from user: "+ JSON.stringify(user));
        console.log();

        const wallet = await getUserWallet(user);
        const blob = new Blob([fs.readFileSync(req.file.path)]);

        // upload a file to ipfs
        const uploadedFileResponse = await pinata.upload.file(blob);

        console.log("File uploading response: "+JSON.stringify(uploadedFileResponse));
        console.log();
        const fileUploadUrl = `https://${pinataGateway}/ipfs/${uploadedFileResponse.IpfsHash}`;

        const { name, price, description } = req.body;
        if (!name || !price || !description || !fileUploadUrl) {
            console.log("Some field are missing");
            console.log();
            return res.status(404).json({ success: false, message: `Some field of NFT not found` });;
        }

        const uploadedJsonResponse = await pinata.upload.json({ name, description, price, image: fileUploadUrl });
        const tokenURI = `https://${pinataGateway}/ipfs/${uploadedJsonResponse.IpfsHash}`;

        const nftTx = await nftService.mintNFT(tokenURI, wallet);

        // fs.unlinkSync(req.file.path);  // delete the file as it's processed
        res.status(201).json({ success: true, transaction: nftTx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.listNFTOnMarketplace = async (req, res) => {
    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Listing NFT from user: "+ JSON.stringify(user));
        console.log();

        const userWallet = await getUserWallet(user);
        const listNFTTxRes = await nftService.listNFT(req.params.nftId, req.body.listingPrice, userWallet);
        res.status(201).json({ success: true, transaction: listNFTTxRes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getNftDetail = async (req, res) => {
    const { nftId } = req.params;
    try {
        const getSpecificNftDetailsTxn = await nftService.getNftDetail(nftId);
        res.status(201).json({ success: true, result: getSpecificNftDetailsTxn });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Buy an NFT
exports.buyNFT = async (req, res) => {
    const { itemId } = req.params;

    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Buying NFT from user: "+ JSON.stringify(user));
        console.log();

        const wallet = await getUserWallet(user);

        const tx = await nftService.buyNFT(itemId, wallet);
        res.status(200).json({ success: true, transaction: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Sell an NFT
exports.resellNFT = async (req, res) => {
    const { itemId } = req.params;

    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("ReListing NFT from user: "+ JSON.stringify(user));
        console.log();

        const sellerWallet = await getUserWallet(user);
        const tx = await nftService.resellNFT(itemId, req.body.resell_price, sellerWallet);
        res.status(201).json({ success: true, transaction: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.userTransactions = async (req, res) => {
    const { userId } = req.params;
    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user || user.id !== userId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Getting transactions for user "+ JSON.stringify(user));
        console.log();

        const userWallet = await getUserWallet(user);
        const userTxns = await nftService.getUserTransactions(userWallet.address);
        res.status(201).json({ success: true, transactions: userTxns.result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.burnNFT = async (req, res) => {
    const { itemId } = req.params;
    try {
        // Fetch user and decrypt the mnemonic
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userWallet = await getUserWallet(user);
        const nft = await nftService.getParticularMarketplaceItem(itemId);
        // await nftService.burnNFT(userWallet, nft.tokenId);
        console.log(`Burned NFT with tokenId ${nft.tokenId} of user  ${JSON.stringify(user)}`);
        console.log();

        await nftService.removeItemFromMarketplace(userWallet, itemId)
        console.log("Removed NFT from Marketplace "+ JSON.stringify(user));
        console.log();

        res.status(201).json({ success: true, transactions: {
            item_removed: itemId,
            nft_burned: nft.tokenId
        } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } 
}