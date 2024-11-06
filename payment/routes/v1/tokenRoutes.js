const express = require('express');
const tokenController = require('../../controllers/tokenController');
const authenticateJWT = require('../../middleware/auth');

const router = express.Router();

// Payment endpoint
router.post('/approve', authenticateJWT, tokenController.doPayment);

// Get crypto balance endpoint
router.get('/balance', authenticateJWT, tokenController.getBalance);

// Get previous transactions
router.get('/transaction', authenticateJWT, tokenController.userTransactions);

module.exports = router;