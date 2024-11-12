const { ethers } = require('ethers');
const { jsonRpcProvider } = require('../config/config');
const mktplaceContractABI = require('../abi/NFTMarketplace.json');
const { decryptMnemonic } = require('../utils/encrypt');
const MarketplaceItem = require('../models/MarketplaceItem');
const Transaction = require('../models/Transaction');
const { sendEventToNft } = require('./PublishEvent');

require('dotenv').config();

// Create a new instance of the contract
const marketplaceContract = new ethers.Contract(process.env.nftMarketplaceAddress, mktplaceContractABI.abi, jsonRpcProvider);

async function makePayment(token, amount, receiver) {
    const reqBody = {
        amount: amount,
    };

    if(receiver) {
        reqBody.receiver = receiver;
    }
    const paymentServiceUrl = `${process.env.PAYMENT_SERVICE}/approve`;
    let paymentResult = await (await fetch(paymentServiceUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
    })).json();
    return paymentResult;
}

async function getMarketplaceListingPrice(wallet) {
    const contractWithSigner = marketplaceContract.connect(wallet);
    const listingPriceTxn = await contractWithSigner.getListingPrice();
    return listingPriceTxn;
}

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

exports.getParticularMarketplaceItem = async function (itemId) {
    const mktplaceItem = await MarketplaceItem.findById(itemId);
    console.log(`Getting particular marketplace item with id : ${itemId} is ${JSON.stringify(mktplaceItem)}` );
    console.log();
    return mktplaceItem;
}

exports.getUserListedItems = async (userName) => {
    const nftListedByUser = await MarketplaceItem.find({ owner: userName, isOnSale: true });
    console.log("User Listed NFT on marketplace : ", nftListedByUser);
    console.log();
    return { listed_nfts: nftListedByUser };
}

exports.getAllListedItems = async function() {
    const listedItems = await MarketplaceItem.find({ isOnSale: true, sold: false });
    console.log("Listed items on marketplace : ", listedItems);
    console.log();
    return { listed_items: listedItems };
}

exports.getUserOwnedItems = async function(userName, token) {
    let userOwnedItems = await MarketplaceItem.find({ owner: userName });
    userOwnedItems = await Promise.all(userOwnedItems.map(async (item) => {
        return {
            item_id: item._id,
            item: await exports.getNftDetail(item.tokenId, token)
        }}
    ));
    console.log("User owned item on marketplace : ", userOwnedItems);
    console.log();
    return { owned_nft_items: userOwnedItems };
}

exports.listNFT = async function(tokenId, listerWallet, token, listingUser) {
    const wallet = new ethers.Wallet(listerWallet.privateKey, jsonRpcProvider);
    const mktplaceListingPrice = await getMarketplaceListingPrice(wallet);
    console.log("Marketplace Listing price of item is : " + mktplaceListingPrice);
    console.log();

    const nftInfo = await exports.getNftDetail(tokenId, token);
    console.log(`NFT Info with tokenid ${tokenId} ${JSON.stringify(nftInfo)}`);
    console.log();
    
    if (nftInfo.owner === listingUser.username) {
        const paymentResult = await makePayment(token, mktplaceListingPrice.toString());
        if (!paymentResult.success) {
            console.log("Payment Failed due to error: "+ paymentResult.message);
            console.log();
            return { nft_listed: false, message: paymentResult.message };
        }
        console.log("Payment done for listing the item successfully");
        console.log();

        const listedItem = new MarketplaceItem(
            { tokenId, isOnSale: true, owner: nftInfo.owner, ownerAddress: listingUser.address, price: nftInfo.price, sold: false }
        );
        await listedItem.save();

        const listingTransaction = new Transaction({ username: listingUser.username, item_id: listedItem._id.toString(), type: 'List', price: 0.025 });
        await listingTransaction.save();

        return { nft_listed: true, listed_item: listedItem };
    } else {
        return { nft_listed: false, message: "NFT doesn't belong to the user listing it" };
    }
};

exports.getNftDetail = async function(tokenId, token) {
    const nftServiceUrl = `${process.env.NFT_SERVICE}/nft/${tokenId}`;
    let nftApprovalResult = await (await fetch(nftServiceUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
    })).json();
    return nftApprovalResult.result.nft_info;
}

exports.buyItem = async function(marketplaceItemId, token, buyer) {
    // const wallet = new ethers.Wallet(buyerWallet.privateKey, jsonRpcProvider);
    const buyingItem = await exports.getParticularMarketplaceItem(marketplaceItemId);

    if (buyingItem && !buyingItem.sold && buyingItem.isOnSale) {
        const paymentResult = await makePayment(token, buyingItem.price.toString(), buyingItem.ownerAddress);
        if (!paymentResult.success) {
            console.log("Payment Failed due to error: "+ paymentResult.message);
            console.log();
            return { nft_bought: false, message: paymentResult.message };
        }
        console.log("Payment Done for buying NFT with price "+buyingItem.price+" CSDP");
        console.log();

        await MarketplaceItem.findOneAndUpdate(
            { tokenId: buyingItem.tokenId },
            { tokenId: buyingItem.tokenId, isOnSale: false, owner: buyer.username, ownerAddress: buyer.address, price: buyingItem.price, sold: true },
            {
                new: true,
            }
        );

        const buyingTransaction = new Transaction({ username: buyer.username, item_id: marketplaceItemId, type: 'Buy', price: buyingItem.price });
        await buyingTransaction.save();

        // CHANGE OWNERSHIP OF THE NFT BY SENDING EVENT TO NFT SERVICE
        await sendEventToNft({ type: 'NFT_OWNER_CHANGE', nft_id: buyingItem.tokenId, new_owner: buyer.username });

        const nftInfo = await exports.getNftDetail(buyingItem.tokenId, token);
        
        return { nft_bought: true, nft: nftInfo };
    } else {
        return { nft_bought: false, message: "Item is not on sale" };
    }
};

exports.resellNFT = async function(itemId, resellPrice, resellerWallet, token, reseller) {
    const wallet = new ethers.Wallet(resellerWallet.privateKey, jsonRpcProvider);
    const mktplaceListingPrice = await getMarketplaceListingPrice(wallet);
    console.log("Marketplace Listing price of item is : " + mktplaceListingPrice);
    console.log();

    const itemInfo = await exports.getParticularMarketplaceItem(itemId);
    
    if (itemInfo && itemInfo.owner === reseller.username) {
        const paymentResult = await makePayment(token, mktplaceListingPrice.toString());
        if (!paymentResult.success) {
            console.log("Payment Failed due to error: "+ paymentResult.message);
            console.log();
            return { item_listed: false, message: paymentResult.message };
        }
        console.log("Payment done for listing the item successfully");
        console.log();

        const resellItem = await MarketplaceItem.findOneAndUpdate(
            { tokenId: itemInfo.tokenId },
            { tokenId: itemInfo.tokenId, isOnSale: true, owner: itemInfo.owner, ownerAddress: reseller.address, price: resellPrice, sold: false },
            {
                new: true,
                upsert: true,
            }
        );

        const resellTransaction = new Transaction({ username: reseller.username, item_id: itemId, type: 'Resell', price: 0.025 });
        await resellTransaction.save();
        
        // change price of the nft by sending the event to nft service
        await sendEventToNft({ type: 'NFT_PRICE_CHANGE', nft_id: itemInfo.tokenId, new_price: resellPrice });

        return { item_listed: true, listed_item: resellItem };
    } else {
        return { item_listed: false, message: "Item doesn't belong to the user reselling it" };
    }
};

exports.getUserTransactions = async function(username) {
    const userTxns = Transaction.find({ username });
    return userTxns;
};

exports.removeItemFromMarketplace = async function(itemId, owner) {
    const itemInfo = await exports.getParticularMarketplaceItem(itemId);
    
    if (itemInfo && itemInfo.owner === owner.username) {
        await MarketplaceItem.deleteOne({ _id: itemInfo._id });
    } else {
        return { item_removed: false, message: "Item doesn't belong to the user removing it" };
    }
    return { item_removed: true };
}
