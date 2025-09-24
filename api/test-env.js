// Simple test endpoint for environment variables
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Environment variable check',
    has_client_id: !!process.env.SNAPCHAT_CLIENT_ID,
    has_client_secret: !!process.env.SNAPCHAT_CLIENT_SECRET,
    has_redirect_uri: !!process.env.SNAPCHAT_REDIRECT_URI,
    has_jwt_secret: !!process.env.JWT_SECRET,
    client_id_first_chars: process.env.SNAPCHAT_CLIENT_ID ? process.env.SNAPCHAT_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET',
    redirect_uri: process.env.SNAPCHAT_REDIRECT_URI || 'NOT SET',
    all_env_keys: Object.keys(process.env).filter(k => !k.includes('SECRET')).sort(),
    timestamp: new Date().toISOString()
  });
};