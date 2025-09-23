# OAuth Setup Guide for Snapchat Bid Multiplier Tool

This guide will help you set up OAuth authentication to enable the "Execute API Call" button functionality.

## Prerequisites

- Admin access to a Snapchat Business Account
- A deployed instance of this application with HTTPS (required for OAuth)
- Access to set environment variables on your hosting platform

## Step 1: Create a Snapchat OAuth App

1. **Log in to Snapchat Business Manager**
   - Go to [business.snapchat.com](https://business.snapchat.com)
   - Log in with your Snapchat credentials

2. **Navigate to Business Details**
   - Click on your profile in the top-right corner
   - Select "Business Details" from the dropdown

3. **Create OAuth App**
   - Go to the "OAuth Apps" section
   - Click "Create App"
   - Fill in the required information:
     - **App Name**: Choose a descriptive name (e.g., "Bid Multiplier Tool")
     - **Description**: Brief description of your app
     - **Privacy Policy URL**: Your privacy policy URL (required)
     - **OAuth Redirect URI**: `https://yourdomain.com/api/auth/callback`
       - Replace `yourdomain.com` with your actual domain
       - Must use HTTPS (except for localhost development)

4. **Save and Note Credentials**
   - After creating the app, you'll receive:
     - **Client ID**: A long alphanumeric string
     - **Client Secret**: A secret key (keep this secure!)
   - Copy these values - you'll need them in Step 2

5. **Email Snapchat for Approval**
   - Send an email to: `dev-support@snap.com`
   - Subject: "OAuth App Approval Request"
   - Include:
     - Your OAuth Client ID
     - Brief description of your intended use
     - Expected API call volume

## Step 2: Configure Environment Variables

Add these environment variables to your hosting platform:

```bash
# Required OAuth Configuration
SNAPCHAT_CLIENT_ID=your_client_id_here
SNAPCHAT_CLIENT_SECRET=your_client_secret_here
SNAPCHAT_REDIRECT_URI=https://yourdomain.com/api/auth/callback

# Required Security Configuration
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRES_IN=24h

# Optional
FRONTEND_URL=https://yourdomain.com
```

### Generating a Secure JWT_SECRET

Use one of these methods to generate a secure secret:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Platform-Specific Instructions

#### Vercel
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable as a production environment variable
4. Redeploy your application

#### Heroku
```bash
heroku config:set SNAPCHAT_CLIENT_ID=your_client_id_here
heroku config:set SNAPCHAT_CLIENT_SECRET=your_client_secret_here
# ... add other variables
```

#### Other Platforms
Consult your platform's documentation for setting environment variables.

## Step 3: Testing OAuth Flow

1. **Add Test Users** (Development Only)
   - In Snapchat Business Manager → OAuth Apps
   - Add your Snapchat username as a "Demo User"
   - This allows testing before full approval

2. **Test the Flow**
   - Visit your deployed application
   - Click "Login with Snapchat"
   - Authorize the application
   - You should be redirected back and see "Successfully authenticated"

## Step 4: Using the Authenticated Flow

Once authenticated:
1. The "Execute API Call" button will show "(Authenticated)"
2. You no longer need to enter an access token manually
3. The tool will automatically use your OAuth token
4. Tokens are refreshed automatically before expiration

## Troubleshooting

### "OAuth configuration missing" Error
- Ensure all environment variables are set correctly
- Check that there are no typos in variable names
- Verify variables are available (not just in .env file)

### Redirect URI Mismatch
- The redirect URI in your environment must EXACTLY match the one in Snapchat
- Include the protocol (https://) and full path (/api/auth/callback)
- No trailing slashes

### HTTPS Required Error
- OAuth requires HTTPS in production
- For local development, you can use:
  - `https://localhost:3000/api/auth/callback` (with self-signed cert)
  - ngrok or similar tunneling service

### Token Expired
- Tokens are automatically refreshed
- If issues persist, click "Login with Snapchat" again

## Security Best Practices

1. **Never expose your Client Secret**
   - Keep it only in server-side environment variables
   - Never commit it to version control

2. **Use HTTPS everywhere**
   - Required for OAuth
   - Protects tokens in transit

3. **Secure your JWT_SECRET**
   - Use a long, random string
   - Rotate periodically
   - Never reuse across applications

4. **Monitor Usage**
   - Check Snapchat Business Manager for API usage
   - Set up alerts for unusual activity

## Support

For Snapchat API issues:
- Email: dev-support@snap.com
- Documentation: [developers.snapchat.com](https://developers.snapchat.com)

For application-specific issues:
- Check the application logs
- Verify environment variables
- Ensure your OAuth app is approved by Snapchat