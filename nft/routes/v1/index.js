const express = require('express');
const nftRoutes = require('./nftRoutes');
const userRoutes = require('./userRoutes');
const router = express.Router();

router.use('/user', userRoutes);
router.use('/nft', nftRoutes);

module.exports = router;
