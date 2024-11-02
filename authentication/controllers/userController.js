const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userService = require('../services/userService');

exports.getUserInfo = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // Extract JWT from headers
        const decoded = jwt.verify(token, config.jwtSecret);

        // Fetch user and decrypt the mnemonic
        let user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user = await userService.getUser(decoded.username);
        res.status(201).json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};