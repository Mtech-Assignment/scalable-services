const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: true
    },
    item_id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['List', 'Buy', 'Resell'],
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);
