const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3012;

// Enable CORS for all routes
app.use(cors());

// Middleware
app.use(bodyParser.json());

app.use('/api', routes);

// Start the server
app.listen(PORT, () => {
  console.log(`Payment Service running on http://localhost:${PORT}`);
});
