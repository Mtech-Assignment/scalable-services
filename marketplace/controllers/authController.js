const authService = require('../services/authService');

exports.register = async (req, res) => {
    try {
        const { username, password, mnemonic } = req.body; // Mnemonic is optional
        const user = await authService.registerUser({ username, password, mnemonic });
        res.status(201).json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const { token, user } = await authService.loginUser({ username, password });
        res.status(200).json({ success: true, token, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
