const express = require('express');
const tokenRoutes = require('./tokenRoutes');
const router = express.Router();

router.use('/token', tokenRoutes);

module.exports = router;
