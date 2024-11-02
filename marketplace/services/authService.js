const jwt = require('jsonwebtoken');
const ethers = require('ethers');
const User = require('../models/User');
const { hashPassword, comparePassword, encryptMnemonic } = require('../utils/encrypt');
const config = require('../config/config');

// Register a new user with encrypted mnemonic
exports.registerUser = async ({ username, password, mnemonic }) => {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);

    // Generate mnemonic if not provided
    if (!mnemonic) {
        const wallet = ethers.Wallet.createRandom();
        mnemonic = wallet.mnemonic.phrase;
    }

    // Encrypt the mnemonic before storing
    const encryptedMnemonic = encryptMnemonic(mnemonic);

    const newUser = new User({ username, password: hashedPassword, mnemonic: encryptedMnemonic });
    await newUser.save();
    console.log("User Details saved are : "+newUser);

    return { id: newUser._id, username: newUser.username };
};

// Login a user and generate JWT
exports.loginUser = async ({ username, password }) => {
    const user = await User.findOne({ username });
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, username: user.username }, config.jwtSecret, {
        expiresIn: config.jwtExpiration
    });

    return { token, user: { id: user._id, username: user.username } };
};
