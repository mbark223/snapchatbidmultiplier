import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { logger } from './utils/logger';
import campaignsRouter from './routes/campaigns';
import adsquadsRouter from './routes/adsquads';
import targetingRouter from './routes/targeting';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure Express respects X-Forwarded-* headers behind proxies (Vercel, etc.)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Serve static files from public directory
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/adsquads', adsquadsRouter);
app.use('/api/targeting', targetingRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Debug endpoint to check auth header
app.get('/debug/auth', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  res.json({
    hasAuthHeader: !!authHeader,
    authHeader: authHeader ? 'Bearer ...' : 'none',
    headerLength: authHeader?.length || 0,
    tokenLength: token?.length || 0,
    startsWithBearer: authHeader?.startsWith('Bearer '),
    tokenStartsWith: token ? token.substring(0, 20) + '...' : 'none',
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    allHeaders: Object.keys(req.headers),
    timestamp: new Date().toISOString()
  });
});

// Test the actual auth middleware
app.get('/debug/test-auth', authenticate, (req: any, res) => {
  res.json({
    authenticated: true,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint - no auth required
app.get('/debug/test-config', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    config: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasSnapchatClientId: !!process.env.SNAPCHAT_CLIENT_ID,
      hasSnapchatClientSecret: !!process.env.SNAPCHAT_CLIENT_SECRET,
      apiBaseUrl: process.env.SNAPCHAT_API_BASE_URL || 'https://adsapi.snapchat.com/v1',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Test Snapchat API connection
app.get('/debug/test-snapchat', authenticate, async (req: any, res) => {
  try {
    const { SnapchatAPIService } = await import('./services/snapchatAPI');
    const snapchatAPI = new SnapchatAPIService(req.user.access_token);
    
    // Try to get user info from Snapchat
    const response = await snapchatAPI.testConnection();
    
    res.json({
      success: true,
      message: 'Successfully connected to Snapchat API',
      data: response.data
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to connect to Snapchat API',
      error: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// Test with custom URL
app.post('/debug/test-url', authenticate, async (req: any, res) => {
  try {
    const { url } = req.body;
    const axios = (await import('axios')).default;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${req.user.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      data: response.data,
      headers: response.headers
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      contentType: error.response?.headers?.['content-type'],
      isHTML: typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE')
    });
  }
});

// Test specific ad squad
app.get('/debug/test-adsquad/:id', authenticate, async (req: any, res) => {
  try {
    const { SnapchatAPIService } = await import('./services/snapchatAPI');
    const snapchatAPI = new SnapchatAPIService(req.user.access_token);
    
    logger.info('Testing ad squad fetch', { 
      adSquadId: req.params.id,
      tokenLength: req.user.access_token.length,
      tokenPreview: req.user.access_token.substring(0, 20) + '...'
    });
    
    const adSquad = await snapchatAPI.getAdSquad(req.params.id);
    
    res.json({
      success: true,
      message: 'Successfully fetched ad squad',
      data: adSquad
    });
  } catch (error: any) {
    logger.error('Ad squad fetch failed', {
      error: error.response?.data || error.message,
      status: error.response?.status,
      adSquadId: req.params.id
    });
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch ad squad from Snapchat',
      error: error.response?.data || error.message,
      status: error.response?.status,
      details: {
        adSquadId: req.params.id,
        errorType: error.response?.data?.error_code || 'unknown',
        suggestion: error.response?.status === 404 ? 
          'Ad Squad ID not found. Please verify the ID is correct and belongs to your account.' : 
          'Please check your access token has permissions for this ad account.'
      }
    });
  }
});

// Test direct Snapchat API connection
app.get('/debug/test-snapchat', authenticate, async (req: any, res) => {
  const axios = require('axios');
  const token = req.user?.access_token;
  
  if (!token) {
    return res.status(400).json({ error: 'No access token found. Make sure you completed the OAuth flow or are using a valid Snapchat access token.' });
  }
  
  const results: any = {};
  
  // Test 1: Try to fetch user's ad accounts
  try {
    const response = await axios.get('https://adsapi.snapchat.com/v1/me/adaccounts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    results.adAccounts = {
      success: true,
      count: response.data.adaccounts?.length || 0
    };
  } catch (error: any) {
    results.adAccounts = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
  
  // Test 2: Try to fetch the specific ad squad if adSquadId is provided
  const adSquadId = req.query.adSquadId || 'bb019d2b-f960-47a6-b0a7-4485736d11e0'; // Using the ID from your tests
  try {
    const response = await axios.get(`https://adsapi.snapchat.com/v1/adsquads/${adSquadId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    results.adSquad = {
      success: true,
      data: response.data.adsquad ? {
        id: response.data.adsquad.id,
        name: response.data.adsquad.name,
        status: response.data.adsquad.status,
        has_bid_multipliers: !!response.data.adsquad.bid_multiplier_properties
      } : null
    };
  } catch (error: any) {
    results.adSquad = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
  
  // Test 3: Get user info
  try {
    const response = await axios.get('https://adsapi.snapchat.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    results.userInfo = {
      success: true,
      data: response.data.me
    };
  } catch (error: any) {
    results.userInfo = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
  
  return res.json({
    success: results.adAccounts?.success || results.adSquad?.success || results.userInfo?.success,
    results,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for direct Snapchat access tokens (for testing only)
app.post('/debug/test-snapchat-direct', async (req: any, res) => {
  const axios = require('axios');
  const { access_token, ad_squad_id } = req.body;
  
  if (!access_token) {
    return res.status(400).json({ error: 'Please provide access_token in request body' });
  }
  
  const results: any = {};
  
  // Test 1: Try to fetch user info
  try {
    const response = await axios.get('https://adsapi.snapchat.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });
    results.userInfo = {
      success: true,
      data: response.data.me
    };
  } catch (error: any) {
    results.userInfo = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
  
  // Test 2: Try to fetch ad accounts
  try {
    const response = await axios.get('https://adsapi.snapchat.com/v1/me/adaccounts', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });
    results.adAccounts = {
      success: true,
      count: response.data.adaccounts?.length || 0
    };
  } catch (error: any) {
    results.adAccounts = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
  
  // Test 3: Try to fetch specific ad squad if provided
  if (ad_squad_id) {
    try {
      const response = await axios.get(`https://adsapi.snapchat.com/v1/adsquads/${ad_squad_id}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });
      results.adSquad = {
        success: true,
        data: {
          name: response.data.adsquads?.[0]?.adsquad?.name,
          status: response.data.adsquads?.[0]?.adsquad?.status,
          has_bid_multipliers: !!response.data.adsquads?.[0]?.adsquad?.bid_multiplier_properties
        }
      };
    } catch (error: any) {
      results.adSquad = {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  }
  
  return res.json({
    success: results.userInfo?.success || results.adAccounts?.success || results.adSquad?.success,
    results,
    note: 'This is a test endpoint for direct Snapchat access tokens',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for environment variables
app.get('/debug/env', (_req, res) => {
  res.json({
    has_client_id: !!process.env.SNAPCHAT_CLIENT_ID,
    has_client_secret: !!process.env.SNAPCHAT_CLIENT_SECRET,
    has_redirect_uri: !!process.env.SNAPCHAT_REDIRECT_URI,
    has_jwt_secret: !!process.env.JWT_SECRET,
    redirect_uri_value: process.env.SNAPCHAT_REDIRECT_URI || 'NOT SET',
    node_env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/debug/env', (_req, res) => {
  res.json({
    has_client_id: !!process.env.SNAPCHAT_CLIENT_ID,
    has_client_secret: !!process.env.SNAPCHAT_CLIENT_SECRET,
    has_redirect_uri: !!process.env.SNAPCHAT_REDIRECT_URI,
    has_jwt_secret: !!process.env.JWT_SECRET,
    redirect_uri_value: process.env.SNAPCHAT_REDIRECT_URI || 'NOT SET',
    node_env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

// Serve index.html for root route
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(errorHandler);

// For Vercel deployment
if (process.env.VERCEL) {
  // Export for Vercel
  module.exports = app;
} else {
  // Local development
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
