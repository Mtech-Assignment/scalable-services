const User = require('../models/User');
const walletService = require('./walletService');
const { decryptMnemonic } = require('../utils/encrypt');

exports.getUser = async (name) => {
    let user = await User.findOne({ username: name }, '_id username email mnemonic');
    const wallet = await walletService.getWalletFromMnemonic(decryptMnemonic(user.mnemonic));
    return { _id: user._id, username: user.username, email: user.email, address: wallet.address };
}