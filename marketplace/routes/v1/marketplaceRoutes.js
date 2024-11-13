const express = require('express');
const router = express.Router();
const marketplaceController = require('../../controllers/marketplaceController');
const authenticateJWT = require('../../middleware/auth');

// List an NFT on marketplace
router.post('/list', authenticateJWT, marketplaceController.listItemOnMarketplace);

// Get all the listed nfts on marketplace
router.get('/listing', marketplaceController.getListedItemOnMarketplace);

router.get('/:itemId',  marketplaceController.getItemDetail);

router.get('/jobs/:jobId',  marketplaceController.jobStatus);

// Buy an NFT (Just changing the ownership)
router.put('/:itemId/buy', authenticateJWT, marketplaceController.buyItem);

// List an NFT on marketplace for sell
router.put('/:itemId/resell', authenticateJWT, marketplaceController.resellItem);

router.delete('/:itemId', authenticateJWT, marketplaceController.unlistItem);

module.exports = router;
