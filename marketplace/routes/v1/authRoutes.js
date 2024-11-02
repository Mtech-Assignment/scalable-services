const express = require('express');
const authController = require('../../controllers/authController');

const router = express.Router();

// Register endpoint
router.post('/register', authController.register);

// Login endpoint
router.post('/login', authController.login);

module.exports = router;