const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { consumeEvent } = require('./services/consumeEvent');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3011;

// Enable CORS for all routes
app.use(cors());

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});
app.use('/api', routes);

// Start the server
app.listen(PORT, () => {
    consumeEvent();
  console.log(`NFT Marketplace API server running on http://localhost:${PORT}`);
});