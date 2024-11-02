const express = require('express');
const nftRoutes = require('./nftRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const router = express.Router();

router.use('/user', userRoutes);
router.use('/nft', nftRoutes);
router.use('/auth', authRoutes);

module.exports = router;
