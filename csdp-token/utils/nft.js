// map the item represented as array to object
exports.mapNftItemToObject = (items) => {
    const nftItemProperties = ["itemId", "nftContract", "tokenId", "seller", "owner", "price", "sold"];
    items = items.map((nft) => {
        let nftItemObj = {};
        nft.map((entry, index) => {
            nftItemObj[nftItemProperties[index]] = (typeof entry === 'bigint' ? entry.toString() : entry);
        });
        return nftItemObj;
    })
    return items;
}