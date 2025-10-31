# Postman Setup Guide for Snapchat Bid Multiplier API

This guide will help you set up Postman to test the Snapchat OAuth authentication flow and API endpoints.

## Prerequisites

1. Snapchat Developer Account with OAuth App created
2. Environment variables configured in your API:
   - `SNAPCHAT_CLIENT_ID`
   - `SNAPCHAT_CLIENT_SECRET`
   - `SNAPCHAT_REDIRECT_URI`
   - `JWT_SECRET`

## Setup Steps

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the `postman-collection.json` file from this repository
4. The collection "Snapchat Bid Multiplier API" will be added to your workspace

### 2. Configure Environment Variables

Create a new environment in Postman with these variables:

| Variable | Initial Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | Your API base URL |
| `access_token` | _(leave empty)_ | Will be populated after auth |
| `refresh_token` | _(leave empty)_ | For refreshing tokens |
| `authorization_code` | _(leave empty)_ | OAuth code from callback URL |

### 3. OAuth Authentication Flow

#### Method 1: Full OAuth Flow with Postman (Recommended)

1. **Start OAuth Flow**
   - Send request: `OAuth Authentication > 1. Initiate OAuth Login`
   - Copy the `auth_url` from the response
   - Open the URL in your browser
   - Log in to Snapchat and authorize the app
   - You'll be redirected to your callback URL

2. **Extract Authorization Code**
   - From the redirect URL, copy the `code` parameter
   - Example: `https://yourapp.com/api/auth/callback?code=ABC123&state=xyz`
   - Update Postman environment variable `authorization_code` with the code value

3. **Generate Tokens**
   - Send request: `OAuth Authentication > 2. Generate Token (Manual Flow)`
   - This will exchange the code for tokens
   - Response includes:
     - `token`: JWT token for API authentication
     - `access_token`: Snapchat access token
     - `refresh_token`: For refreshing tokens
   - Update environment variables:
     - Set `access_token` to the `token` value from response
     - Set `refresh_token` to the `refresh_token` value from response

#### Method 2: Direct Access Token (Testing)

If you have a Snapchat access token from their API dashboard:

1. Send request: `Debug Endpoints > Test Direct Snapchat Token`
2. Replace `YOUR_SNAPCHAT_ACCESS_TOKEN` in the body with your actual token
3. If successful, update the `access_token` environment variable

### 4. Test the Connection

1. **Verify Environment**
   - Send: `Debug Endpoints > Check Environment Variables`
   - Ensure all required variables are set

2. **Test Authentication**
   - Send: `Debug Endpoints > Test Auth Middleware`
   - Should return success if token is valid

3. **Test Snapchat API**
   - Send: `Debug Endpoints > Test Snapchat API Connection`
   - Confirms connection to Snapchat's API

### 5. Using the API Endpoints

Once authenticated, you can use the main API endpoints:

1. **Get Campaigns**
   ```
   GET /api/campaigns
   ```

2. **Get Ad Squads**
   ```
   GET /api/adsquads/:campaignId
   ```
   Replace `:campaignId` with an actual campaign ID

3. **Update Bid Multipliers**
   ```
   PUT /api/adsquads/:adSquadId/bid-multipliers
   ```
   Example body:
   ```json
   {
     "bid_multipliers": [
       {
         "dma_id": "807",
         "multiplier": 1.5
       }
     ]
   }
   ```

## Token Management

- Access tokens expire after 60 minutes
- Use the "Refresh Access Token" endpoint before expiration
- The JWT token from this API expires in 24 hours (configurable)

## Troubleshooting

### Common Issues

1. **"OAuth configuration missing" error**
   - Ensure all environment variables are set in your `.env` file
   - Use the `/debug/env` endpoint to verify

2. **Authentication failures**
   - Check token expiration
   - Verify the token is in the Authorization header
   - Use `/debug/auth` to see what headers are being sent

3. **Snapchat API errors**
   - Ensure your app has the correct scopes (snapchat-marketing-api)
   - Verify the account has access to the campaigns/ad squads

### Debug Flow

1. Check environment: `/debug/env`
2. Check auth headers: `/debug/auth`
3. Test auth middleware: `/debug/test-auth`
4. Test Snapchat connection: `/debug/test-snapchat`

## Security Notes

- Never share your `client_secret` or `JWT_SECRET`
- Always use HTTPS in production
- The redirect URI must exactly match what's registered in Snapchat
- State parameter should be validated in production to prevent CSRF

## Additional Resources

- [Snapchat Marketing API Documentation](https://developers.snap.com/api/marketing-api)
- [OAuth 2.0 Flow Documentation](https://developers.snap.com/api/marketing-api/Ads-API/authentication)