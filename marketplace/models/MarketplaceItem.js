const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true
    },
    isOnSale: {
        type: Boolean,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    ownerAddress: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    sold: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('MarketplaceItem', itemSchema);
