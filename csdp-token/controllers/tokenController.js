const tokenService = require('../services/tokenService');
require('dotenv').config();

async function getUserInfo(authToken) {
    const authServiceUrl = `${process.env.AUTH_SERVICE_URL}/user`;
    let user = await (await fetch(authServiceUrl, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    })).json();
    return user.user;
}

// Make a payment
exports.doPayment = async (req, res) => {
    const { amount, receiver } = req.body;
    try {
        const token = req.headers.authorization.split(' ')[1]; // Extract JWT from headers

        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(token);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Making Payment from user to marketplace: "+ JSON.stringify(user));
        console.log();

        const wallet = await tokenService.getUserWallet(token);

        if(receiver) {
            console.log(`Making a payment for the item bought at ${amount}CSDP to ${receiver}`);
            console.log();
            await tokenService.makePayment(amount, wallet, receiver);
            console.log(`Made a payment for the item bought at ${amount}CSDP to ${receiver} successfully.`);
        } else {
            console.log(`Making a payment for the listing item on marketplace at ${amount}CSDP`);
            console.log();
            await tokenService.makePayment(amount, wallet);
            console.log(`Made a payment for listing the item on marketplace at ${amount}CSDP successfully.`);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.userTransactions = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Extract JWT from headers
    try {
        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(token);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("Getting transactions for user "+ JSON.stringify(user));
        console.log();

        const userWallet = await tokenService.getUserWallet(token);
        const userTxns = await tokenService.getUserTransactions(userWallet.address);
        return res.status(201).json({ success: true, transactions: userTxns.result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Get user balance based on JWT
exports.getBalance = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // Extract JWT from headers

        // Fetch user and decrypt the mnemonic
        const user = await getUserInfo(token);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create wallet from decrypted mnemonic
        const wallet = await tokenService.getUserWallet(token);

        // Get balances
        const balance = await tokenService.getTokenBalance(wallet.address);

        return res.status(200).json({
            success: true,
            result: {
                user,
                ETHER_BALANCE: balance.etherBalance,
                CSDP_BALANCE: balance.tokenBalance
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
