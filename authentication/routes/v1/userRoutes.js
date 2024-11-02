const express = require('express');
const router = express.Router();
const authenticateJWT = require('../../middleware/auth');
const walletController = require('../../controllers/walletController');

// POST to create wallet from existing mnemonic
router.post('/wallet', walletController.createWallet);

// GET to retrieve wallet details from JWT
router.get('/:userId/wallet', authenticateJWT, walletController.getWallet);

// GET to retrieve wallet seed phrase (internal API endpoint for other microservice)
router.get('/wallet', authenticateJWT, walletController.getWalletMnemonic);

module.exports = router;