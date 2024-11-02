const { PinataSDK } = require('pinata-web3');
const nftService = require('../services/nftService');
const User = require('../models/NFT');
const fs = require('fs');
const { Blob } = require("buffer");
require('dotenv').config();


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
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        const wallet = await nftService.getUserWallet(authToken);
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
        const userAddress = wallet.address;

        const nftTx = await nftService.mintNFT({ name, price, description, fileUploadUrl, tokenURI, userAddress }, wallet);

        // fs.unlinkSync(req.file.path);  // delete the file as it's processed
        res.status(201).json({ success: true, transaction: nftTx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getNftDetail = async (req, res) => {
    const { nftId } = req.params;
    try {
        const getSpecificNftDetailsTxn = await nftService.getNftDetail(nftId);
        res.status(201).json({ success: true, result: getSpecificNftDetailsTxn });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getUserOwnedNFTOnMarketplace = async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    try {
        const wallet = await nftService.getUserWallet(authToken);

        const userOwnedNfts = await nftService.getUserOwnedNFTs(wallet);
        res.status(200).json({ success: true, userOwnedNfts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

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
    const { nftId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];
    try {

        const userWallet = await nftService.getUserWallet(authToken);
        await nftService.burnNFT(userWallet, nftId);
        console.log(`Burned NFT with tokenId ${nftId} of user ${JSON.stringify(user)}`);
        console.log();

        res.status(201).json({ success: true, transactions: {
            nft_burned: nftId
        } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } 
}