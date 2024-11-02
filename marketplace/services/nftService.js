const { ethers, isCallException } = require('ethers');
const nftContractABI = require('../abi/NFT.json');
const mktplaceContractABI = require('../abi/NFTMarketplace.json');
const csdpTokenABI = require('../abi/CSDP.json');
const { mapNftItemToObject } = require('../utils/nft');
require('dotenv').config();

// Connect to the blockchain (e.g., using Infura, Alchemy, or a local node)
const provider = new ethers.JsonRpcProvider(process.env.rpcProviderUrl);

// Create a new instance of the contract
const nftContract = new ethers.Contract(process.env.nftAddress, nftContractABI.abi, provider);
const marketplaceContract = new ethers.Contract(process.env.nftMarketplaceAddress, mktplaceContractABI.abi, provider);
const csdpTokenContract = new ethers.Contract(process.env.csdpAddress, csdpTokenABI.abi, provider);


async function approveToken(amount, wallet) {
    const contractWithSigner = csdpTokenContract.connect(wallet); // Connect the contract to the wallet
    const convertedPrice = ethers.parseUnits(amount.toString(), 18);
    const csdpApprovalTxn = await contractWithSigner.approve(
        process.env.nftMarketplaceAddress,
        convertedPrice
    );
    await csdpApprovalTxn.wait(); // Wait for the transaction to be mined
}

async function getMarketplaceListingPrice(wallet) {
    const contractWithSigner = marketplaceContract.connect(wallet);
    const listingPriceTxn = await contractWithSigner.getListingPrice();
    return listingPriceTxn;
}

exports.getParticularMarketplaceItem = async function (itemId) {
    let mktplaceItem = await marketplaceContract.getParticularItem(itemId);
    mktplaceItem = mapNftItemToObject([mktplaceItem]);
    console.log("Getting particular marketplace item with id : "+ itemId);
    console.log();
    return mktplaceItem[0];
}

exports.getUserListedNFTs = async (userWallet) => {
    const wallet = new ethers.Wallet(userWallet.privateKey, provider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    let nftListedByUser = await contractWithSigner.getSellerListedItems();
    nftListedByUser = mapNftItemToObject(nftListedByUser);
    console.log("User Owned NFT on marketplace : ", nftListedByUser);
    console.log();
    return { listed_nfts: nftListedByUser };
}

exports.getAllListedNFTs = async function() {
    let allListedNftOnMarketplace = await marketplaceContract.getAllListedItems();
    allListedNftOnMarketplace = mapNftItemToObject(allListedNftOnMarketplace);
    console.log("Listed NFT on marketplace : ", allListedNftOnMarketplace);
    console.log();
    return { listed_nft_items: allListedNftOnMarketplace };
}

exports.getUserOwnedNFTs = async function(userWallet) {
    const wallet = new ethers.Wallet(userWallet.privateKey, provider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    let userOwnedNFTs = await contractWithSigner.getOwnerListedItems();
    userOwnedNFTs = mapNftItemToObject(userOwnedNFTs);
    console.log("User Owned NFT on marketplace : ", userOwnedNFTs);
    console.log();
    return { owned_nft_items: userOwnedNFTs };
}

exports.mintNFT = async function(tokenURI, userWallet) {
    // Create a wallet instance using the private key
    const wallet = new ethers.Wallet(userWallet.privateKey, provider);
    const contractWithSigner = nftContract.connect(wallet); // Connect the contract to the wallet
    let tokenId = null;

    const eventPromise = new Promise((resolve, _) => {
        nftContract.once('Transfer', (_, to, tokenId) => {
            resolve(tokenId);
        });
    });
    
    // Call the mint function without specifying the user address
    const tx = await contractWithSigner.mintToken(tokenURI);
    await tx.wait(); // Wait for the transaction to be mined
    
    tokenId = Number(await eventPromise);
    return { nft_minted: true, tokenid: tokenId };
};

exports.listNFT = async function(nftId, listingPrice, listerWallet) {
    const wallet = new ethers.Wallet(listerWallet.privateKey, provider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    const mktplaceListingPrice = await getMarketplaceListingPrice(wallet);
    console.log("Marketplace Listing price of NFT is : " + mktplaceListingPrice);
    console.log();

    await approveToken(mktplaceListingPrice, wallet);

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

exports.getNftDetail = async function(nftId) {
    const tokenUri = await nftContract.tokenURI(nftId);
    const metaData = await fetch(tokenUri);
    const jsonMetaData = await metaData.json();
    return { nft_info: jsonMetaData };
}

exports.buyNFT = async function(marketplaceItemId, buyerWallet) {
    const wallet = new ethers.Wallet(buyerWallet.privateKey, provider);
    const contractWithSigner = marketplaceContract.connect(wallet);
    const marketplaceItem = await marketplaceContract.getParticularItem(marketplaceItemId);;
    
    await approveToken(marketplaceItem.price, wallet);
    console.log("Token CSDP Approved for buying NFT with price "+marketplaceItem.price+" CSDP");
    console.log();

    const tx = await contractWithSigner.buyItem(process.env.nftAddress, marketplaceItemId);
    await tx.wait(); // Wait for the transaction to be mined
    return { nft_bought: true };
};

exports.resellNFT = async function(itemId, resellPrice, resellerWallet) {
    const wallet = new ethers.Wallet(resellerWallet.privateKey, provider);
    const mktPlaceContractWithSigner = marketplaceContract.connect(wallet);
    const nftContractWithSigner = nftContract.connect(wallet);
    const mktplaceListingPrice = await getMarketplaceListingPrice(wallet);
    console.log("Marketplace Listing price of NFT is : " + mktplaceListingPrice);
    console.log();

    await approveToken(mktplaceListingPrice, wallet);
    console.log("CSDP Token amount for relisting is approved for Marketplace");
    console.log();

    const marketplaceItem = await exports.getParticularMarketplaceItem(itemId);

    const nftApprovalToMarketplace = await nftContractWithSigner.approve(process.env.nftMarketplaceAddress, marketplaceItem.tokenId);
    await nftApprovalToMarketplace.wait();
    console.log("NFT Approval to marketplace for relisting done successfully");
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
    const wallet = new ethers.Wallet(userWallet.privateKey, provider);
    const mktPlaceContractWithSigner = marketplaceContract.connect(wallet);
    const marketplaceItemDeletionTxn = await mktPlaceContractWithSigner.unlistItem(itemId); 
    await marketplaceItemDeletionTxn.wait();
}

exports.burnNFT = async function(userWallet, nftId) {
    const wallet = new ethers.Wallet(userWallet.privateKey, provider);
    const nftContractWithSigner = nftContract.connect(wallet);
    await nftContractWithSigner.burn(nftId);
}
