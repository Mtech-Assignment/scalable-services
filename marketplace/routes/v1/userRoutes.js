const express = require('express');
const router = express.Router();
const authenticateJWT = require('../../middleware/auth');
const marketplaceController = require('../../controllers/marketplaceController');

// Get the user transactions
// router.get('/:userId/transactions', authenticateJWT, nftController.userTransactions);

// Get user owned nft or user listed nft if listed=true query param is available 
router.get('/:userId/item', authenticateJWT, (req, res, next) => { 
    if (req.query.listed) {
        marketplaceController.getUserListedItemOnMarketplace(req, res, next);
    } else {
        marketplaceController.getUserOwnedItemOnMarketplace(req, res, next);
    }
});

module.exports = router;