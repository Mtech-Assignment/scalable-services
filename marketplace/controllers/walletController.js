const jwt = require('jsonwebtoken');
const { decryptMnemonic } = require('../utils/encrypt');
const config = require('../config/config');
const User = require('../models/User'); // Import User model
const walletService = require('../services/walletService');


// Create wallet with existing mnemonic
exports.createWallet = async (req, res) => {
    try {
        const { mnemonic } = req.body; // User provides the existing mnemonic

        if (!mnemonic) {
            return res.status(400).json({ success: false, message: 'Mnemonic is required' });
        }

        // Create wallet from decrypted mnemonic
        const wallet = await walletService.getWalletFromMnemonic(mnemonic);

        // Get balances (optional token address for example)
        const etherBalance = await walletService.getEtherBalance(wallet.address);
        const csdpBalance = await walletService.getTokenBalance(wallet.address, process.env.csdpAddress); // Replace with actual token address

        // Return the wallet details without sensitive data
        return res.status(201).json({
            success: true,
            wallet: {
                address: wallet.address,
                ETHER_BALANCE: etherBalance,
                CSDP_BALANCE: csdpBalance
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get wallet details based on JWT
exports.getWallet = async (req, res) => {
    const { userId } = req.params;
    try {
        const token = req.headers.authorization.split(' ')[1]; // Extract JWT from headers
        const decoded = jwt.verify(token, config.jwtSecret);

        // Fetch user and decrypt the mnemonic
        const user = await User.findById(decoded.id);
        if (!user || user.id !== userId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Decrypt the mnemonic for recovery purposes
        const decryptedMnemonic = decryptMnemonic(user.mnemonic);

        // Create wallet from decrypted mnemonic
        const wallet = await walletService.getWalletFromMnemonic(decryptedMnemonic);

        // Get balances
        const etherBalance = await walletService.getEtherBalance(wallet.address);
        const csdpBalance = await walletService.getTokenBalance(wallet.address, process.env.csdpAddress); // Replace with actual token address

        return res.status(200).json({
            success: true,
            wallet: {
                address: wallet.address,
                ETHER_BALANCE: etherBalance,
                CSDP_BALANCE: csdpBalance
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
