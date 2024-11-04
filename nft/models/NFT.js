const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tokenDetailURI: {
        type: String, 
        required: true
    },
    owner: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('NFT', nftSchema);
