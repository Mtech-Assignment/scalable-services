const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemId: {
        type: Number,
        required: true,
        unique: true,
    },
    tokenId: {
        type: String,
        required: true,
        unique: true
    },
    seller: {
        type: String,
        required: true
    },
    owner: {
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
