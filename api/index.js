// Vercel serverless function handler
require('dotenv').config();

// Import the Express app
const app = require('../dist/index.js');

// Export for Vercel
module.exports = app;