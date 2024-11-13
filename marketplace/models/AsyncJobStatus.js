const mongoose = require('mongoose');

const asyncJobStatusSchema = new mongoose.Schema({
    user: {
        type: String, 
        required: true
    },
    status: {
        type: String,
        enum: ['DONE', 'FAILED', 'PENDING'],
        required: true
    },
    message: {
        type: String, 
        required: true
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('AsyncJobStatus', asyncJobStatusSchema);