const AsyncJobStatus = require('../models/AsyncJobStatus');
const marketplaceService = require('../services/marketplaceService');
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

exports.getListedItemOnMarketplace = async (req, res) => {
    try {
        const listedNftList = await marketplaceService.getAllListedItems();
        res.status(200).json({ success: true, listedNftList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getUserOwnedItemOnMarketplace = async (req, res) => {
    const { userId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user || user._id !== userId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userOwnedNfts = await marketplaceService.getUserOwnedItems(user.username, authToken);
        return res.status(200).json({ success: true, userOwnedNfts });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.getUserListedItemOnMarketplace = async (req, res) => {
    const { userId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user || userId !== user._id) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userListedItems = await marketplaceService.getUserListedItems(user.username);
        return res.status(200).json({ success: true, listed_items: userListedItems });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.jobStatus = async (req, res) => {
    const { jobId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log(`Getting job status for job id: ${jobId}`);
        console.log();

        const jobStatus = await AsyncJobStatus.findById(jobId);
        if (jobStatus && jobStatus.user !== user.username) {
            return res.status(404).json({ success: false, message: "Invalid Job Id" });
        }

        return res.status(201).json({ success: true, result: { job_id: jobStatus._id, status: jobStatus.status, message: jobStatus.message }});
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.listItemOnMarketplace = async (req, res) => {
    const { nft_id } = req.body;
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Listing NFT from user: "+ JSON.stringify(user));
        console.log();

        const userWallet = await marketplaceService.getUserWallet(authToken);
        const listNFTTxRes = await marketplaceService.listNFT(nft_id, userWallet, authToken, user);
        if (!listNFTTxRes.success) {
            return res.status(400).json({ success: false, message: listNFTTxRes.message });
        }

        return res.status(201).json({ success: true, result: listNFTTxRes.result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.getItemDetail = async (req, res) => {
    const { itemId } = req.params;
    try {
        const marketplaceItem = await marketplaceService.getParticularMarketplaceItem(itemId);
        return res.status(200).json({ success: true, result: marketplaceItem });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Buy an item
exports.buyItem = async (req, res) => {
    const { itemId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Buying NFT from user: "+ JSON.stringify(user));
        console.log();

        const buyItemTx = await marketplaceService.buyItem(itemId, authToken, user);
        if (!buyItemTx.success) {
            return res.status(400).json({ success: false, message: buyItemTx.message });
        }
        
        return res.status(200).json({ success: true, result: buyItemTx.result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Sell an NFT
exports.resellItem = async (req, res) => {
    const { itemId } = req.params;
    const { resell_price } = req.body;
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Relisting Item from user: "+ JSON.stringify(user));
        console.log();

        const sellerWallet = await marketplaceService.getUserWallet(authToken);
        const tx = await marketplaceService.resellNFT(itemId, resell_price, sellerWallet, authToken, user);
        if (!tx.success) {
            return res.status(400).json({ success: false, message: tx.message });
        }
        return res.status(201).json({ success: true, result: tx.result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.userTransactions = async (req, res) => {
    const { userId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];

    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user || user._id !== userId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Getting transactions for user "+ JSON.stringify(user));
        console.log();

        const userTxns = await marketplaceService.getUserTransactions(user.username);
        res.status(200).json({ success: true, transactions: userTxns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.unlistItem = async (req, res) => {
    const { itemId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];
    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await marketplaceService.removeItemFromMarketplace(itemId, user)
        console.log("Removed NFT from Marketplace "+ JSON.stringify(user));
        console.log();

        res.status(201).json({ success: true, transactions: {
            item_removed: itemId
        } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } 
}