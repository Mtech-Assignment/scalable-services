const marketplaceService = require('../services/marketplaceService');
const MarketplaceItem = require('../models/MarketplaceItem');
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
        const wallet = await marketplaceService.getUserWallet(authToken);

        const userOwnedNfts = await marketplaceService.getUserOwnedItems(wallet);
        res.status(200).json({ success: true, userOwnedNfts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
        const wallet = await marketplaceService.getUserWallet(authToken);

        const userListedItems = await marketplaceService.getUserListedItems(wallet);
        res.status(200).json({ success: true, listed_items: userListedItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.listItemOnMarketplace = async (req, res) => {
    const { nft_id, listing_price } = req.body;
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
        const listNFTTxRes = await marketplaceService.listNFT(nft_id, listing_price, userWallet, authToken);
        res.status(201).json({ success: true, transaction: listNFTTxRes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getItemDetail = async (req, res) => {
    const { itemId } = req.params;
    try {
        const markteplaceItem = await marketplaceService.getParticularMarketplaceItem(itemId);
        const getSpecificNftDetailsTxn = await marketplaceService.getNftDetail(markteplaceItem.tokenId);
        res.status(200).json({ success: true, result: getSpecificNftDetailsTxn });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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

        const wallet = await marketplaceService.getUserWallet(authToken);

        const tx = await marketplaceService.buyItem(itemId, wallet, authToken);
        res.status(200).json({ success: true, transaction: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
        console.log("ReListing Item from user: "+ JSON.stringify(user));
        console.log();

        const sellerWallet = await marketplaceService.getUserWallet(authToken);
        const tx = await marketplaceService.resellNFT(itemId, resell_price, sellerWallet, authToken);
        res.status(201).json({ success: true, transaction: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// exports.userTransactions = async (req, res) => {
//     const { userId } = req.params;
//     try {
//         // Fetch user and decrypt the mnemonic
//         const user = await User.findById(req.user._id);
//         if (!user || user._id !== userId) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }
//         console.log("Getting transactions for user "+ JSON.stringify(user));
//         console.log();

//         const userWallet = await getUserWallet(user);
//         const userTxns = await marketplaceService.getUserTransactions(userWallet.address);
//         res.status(201).json({ success: true, transactions: userTxns.result });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }

exports.unlistItem = async (req, res) => {
    const { itemId } = req.params;
    const authToken = req.headers.authorization?.split(' ')[1];
    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(authToken);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userWallet = await marketplaceService.getUserWallet(authToken);

        await marketplaceService.removeItemFromMarketplace(userWallet, itemId)
        console.log("Removed NFT from Marketplace "+ JSON.stringify(user));
        console.log();

        res.status(201).json({ success: true, transactions: {
            item_removed: itemId
        } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } 
}