const express = require('express');
const authController = require('../../controllers/authController');
const router = express.Router();

// Register endpoint
router.post('/register', authController.register);

// Login endpoint
router.post('/login', authController.login);

// verify-token endpoint
router.post('/verify', authController.verify);

module.exports = router;