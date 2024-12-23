const { PinataSDK } = require('pinata-web3');
const nftService = require('../services/nftService');
const fs = require('fs');
const { Blob } = require("buffer");
require('dotenv').config();

async function getUserInfo(authToken) {
    const authServiceUrl = `${process.env.AUTH_SERVICE_URL}/user`;
    let user = await (await fetch(authServiceUrl, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    })).json();
    return user.user;
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
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);

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
            return res.status(404).json({ success: false, message: `Some field of NFT not found` });
        }

        const uploadedJsonResponse = await pinata.upload.json({ name, description, price, image: fileUploadUrl });
        const tokenURI = `https://${pinataGateway}/ipfs/${uploadedJsonResponse.IpfsHash}`;

        const nftTx = await nftService.mintNFT({ name, price, description, tokenURI, userName: user.username });

        fs.unlinkSync(req.file.path);  // delete the file as it's processed
        return res.status(201).json({ success: true, transaction: nftTx });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getNftDetail = async (req, res) => {
    const { nftId } = req.params;
    try {
        const getSpecificNftDetailsTxn = await nftService.getNftDetail(nftId);
        return res.status(201).json({ success: true, result: getSpecificNftDetailsTxn });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.getUserOwnedNFTOnMarketplace = async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        console.log(`Getting user owned NFT for user ${JSON.stringify(user)}`);
        console.log();

        const userOwnedNfts = await nftService.getUserOwnedNFTs(user.username);
        return res.status(200).json({ success: true, userOwnedNfts });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.burnNFT = async (req, res) => {
    const { nftId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];
    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);

        const nftInfo = (await nftService.getNftDetail(nftId)).nft_info;
        if (nftInfo.owner !== user.username) {
            return res.status(401).json({ success: false, message: "You are not authorized to burn this asset" });
        }

        await nftService.burnNFT(nftId);
        console.log(`Burned NFT with tokenId ${nftId} of user ${JSON.stringify(user)}`);
        console.log();

        return res.status(201).json({ success: true, transactions: {
            nft_burned: nftId
        } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
