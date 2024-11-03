const { ethers } = require('ethers');
const { jsonRpcProvider } = require('../config/config');
const mktplaceContractABI = require('../abi/NFTMarketplace.json');
const { mapMarketplaceItemToObject } = require('../utils/marketplaceItem');
const { decryptMnemonic } = require('../utils/encrypt');
require('dotenv').config();

// Create a new instance of the contract
const marketplaceContract = new ethers.Contract(process.env.nftMarketplaceAddress, mktplaceContractABI.abi, jsonRpcProvider);

async function approveToken(token, amount) {
    const paymentServiceUrl = `${process.env.PAYMENT_SERVICE}/approve`;
    let paymentResult = await (await fetch(paymentServiceUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount
        }),
    })).json();
    return paymentResult;
}

async function getMarketplaceListingPrice(wallet) {
    const contractWithSigner = marketplaceContract.connect(wallet);
    const listingPriceTxn = await contractWithSigner.getListingPrice();
    return listingPriceTxn;
}

async function approveNftToMarketplace(tokenId, token) {
    const nftServiceUrl = `${process.env.NFT_SERVICE}/nft/${tokenId}/approve`;
    let nftApprovalResult = await (await fetch(nftServiceUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
    })).json();
    return nftApprovalResult;
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
    let mktplaceItem = await marketplaceContract.getParticularItem(itemId);
    mktplaceItem = mapMarketplaceItemToObject([mktplaceItem]);
    console.log("Getting particular marketplace item with id : "+ itemId);
    console.log();
    return mktplaceItem[0];
}

exports.getUserListedItems = async (userWallet) => {
    const wallet = new ethers.Wallet(userWallet.privateKey, jsonRpcProvider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    let nftListedByUser = await contractWithSigner.getSellerListedItems();
    nftListedByUser = mapMarketplaceItemToObject(nftListedByUser);
    console.log("User Owned NFT on marketplace : ", nftListedByUser);
    console.log();
    return { listed_nfts: nftListedByUser };
}

exports.getAllListedItems = async function() {
    let allListedItemOnMarketplace = await marketplaceContract.getAllListedItems();
    allListedItemOnMarketplace = mapMarketplaceItemToObject(allListedItemOnMarketplace);
    console.log("Listed items on marketplace : ", allListedItemOnMarketplace);
    console.log();
    return { listed_items: allListedItemOnMarketplace };
}

exports.getUserOwnedItems = async function(userWallet) {
    const wallet = new ethers.Wallet(userWallet.privateKey, jsonRpcProvider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    let userOwnedItems = await contractWithSigner.getOwnerListedItems();
    userOwnedItems = mapMarketplaceItemToObject(userOwnedItems);
    console.log("User owned item on marketplace : ", userOwnedItems);
    console.log();
    return { owned_nft_items: userOwnedItems };
}

exports.listNFT = async function(nftId, listingPrice, listerWallet, token) {
    const wallet = new ethers.Wallet(listerWallet.privateKey, jsonRpcProvider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    const mktplaceListingPrice = await getMarketplaceListingPrice(wallet);
    console.log("Marketplace Listing price of item is : " + mktplaceListingPrice);
    console.log();

    await approveToken(token, mktplaceListingPrice.toString());
    console.log("CSDP Token approved for listing the item successfully");
    console.log();

    const eventPromise = new Promise((resolve, _) => {
        marketplaceContract.once('ItemList', (mktPlaceItemId) => {
            resolve(mktPlaceItemId);
        });
    });

    const listNFTTx = await contractWithSigner.listItem(
        process.env.nftAddress,
        nftId,
        ethers.parseUnits(listingPrice.toString(), 18)
    );
    await listNFTTx.wait();

    let marketplaceItemId = Number(await eventPromise);
    return { nft_listed: true, listed_itemid: marketplaceItemId };
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

exports.buyItem = async function(marketplaceItemId, buyerWallet, token) {
    const wallet = new ethers.Wallet(buyerWallet.privateKey, jsonRpcProvider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    const marketplaceItem = await marketplaceContract.getParticularItem(marketplaceItemId);
    
    await approveToken(token, marketplaceItem.price.toString());
    console.log("Token CSDP Approved for buying NFT with price "+marketplaceItem.price+" CSDP");
    console.log();

    const tx = await contractWithSigner.buyItem(process.env.nftAddress, marketplaceItemId);
    await tx.wait(); // Wait for the transaction to be mined
    return { nft_bought: true };
};

exports.resellNFT = async function(itemId, resellPrice, resellerWallet, token) {
    const wallet = new ethers.Wallet(resellerWallet.privateKey, jsonRpcProvider);
    const mktPlaceContractWithSigner = marketplaceContract.connect(wallet);
    const mktplaceListingPrice = await getMarketplaceListingPrice(wallet);
    console.log("Marketplace Listing price of item is : " + mktplaceListingPrice);
    console.log();

    await approveToken(token, mktplaceListingPrice.toString());
    console.log("CSDP Token amount for relisting is approved for Marketplace");
    console.log();

    const marketplaceItem = await exports.getParticularMarketplaceItem(itemId);

    await approveNftToMarketplace(marketplaceItem.tokenId, token);
    console.log("Item Approval to marketplace for relisting done successfully");
    console.log();

    const resellItemTx = await mktPlaceContractWithSigner.resellItem(
        process.env.nftAddress,
        itemId,
        ethers.parseUnits(resellPrice.toString(), 18)
    );
    await resellItemTx.wait();

    return { item_listed: true };
};

exports.getUserTransactions = async function(userAddress) {
    const etherscanUrl = `https://api-holesky.etherscan.io/api?module=account&action=txlist&address=${userAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`;

    const txns = await fetch(etherscanUrl);
    return await txns.json();
};

exports.removeItemFromMarketplace = async function(userWallet, itemId) {
    const wallet = new ethers.Wallet(userWallet.privateKey, jsonRpcProvider);
    const mktPlaceContractWithSigner = marketplaceContract.connect(wallet);
    const marketplaceItemDeletionTxn = await mktPlaceContractWithSigner.unlistItem(itemId); 
    await marketplaceItemDeletionTxn.wait();
}
