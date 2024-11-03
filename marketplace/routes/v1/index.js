const express = require('express');
const marketplaceRoutes = require('./marketplaceRoutes');
const userRoutes = require('./userRoutes');
const router = express.Router();

router.use('/user', userRoutes);
router.use('/marketplace', marketplaceRoutes);

module.exports = router;
