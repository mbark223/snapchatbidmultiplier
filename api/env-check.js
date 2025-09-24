// Minimal environment check
module.exports = (req, res) => {
  const envVars = {
    method: req.method,
    url: req.url,
    snapchat_vars: {
      CLIENT_ID: process.env.SNAPCHAT_CLIENT_ID ? 'SET' : 'NOT SET',
      CLIENT_SECRET: process.env.SNAPCHAT_CLIENT_SECRET ? 'SET' : 'NOT SET',
      REDIRECT_URI: process.env.SNAPCHAT_REDIRECT_URI || 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    },
    env_count: Object.keys(process.env).length,
    vercel_env: process.env.VERCEL_ENV || 'not set',
    node_env: process.env.NODE_ENV || 'not set'
  };
  
  res.status(200).json(envVars);
};