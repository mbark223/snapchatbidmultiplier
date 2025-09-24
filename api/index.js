// Vercel serverless function handler
// Note: Vercel automatically loads env vars, dotenv not needed in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Log environment check
console.log('Vercel Environment Check:', {
  has_client_id: !!process.env.SNAPCHAT_CLIENT_ID,
  has_client_secret: !!process.env.SNAPCHAT_CLIENT_SECRET,
  has_redirect_uri: !!process.env.SNAPCHAT_REDIRECT_URI,
  vercel: process.env.VERCEL,
  node_env: process.env.NODE_ENV
});

// Import the Express app
const app = require('../dist/index.js');

// Export for Vercel
module.exports = app;