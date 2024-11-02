const express = require('express');
const router = express.Router();
const authenticateJWT = require('../../middleware/auth');
const nftController = require('../../controllers/nftController');

// Get user owned nft or user listed nft if listed=true query param is available 
router.get('/nft', authenticateJWT, nftController.getUserOwnedNFTOnMarketplace);

module.exports = router;