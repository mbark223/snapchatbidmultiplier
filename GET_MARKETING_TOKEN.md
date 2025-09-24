# How to Get a Snapchat Marketing API Access Token

Unfortunately, Snapchat doesn't provide a public API Explorer or testing console. You'll need to set up OAuth to get a Marketing API token.

## Option 1: Set Up OAuth in Your App (Recommended)

1. **Create an OAuth App in Snap Business Manager**:
   - Go to [business.snapchat.com](https://business.snapchat.com)
   - Navigate to "Business Details" section
   - Find the OAuth Apps section (you need Organization Admin privileges)
   - Click "Create App"
   - Provide app name and redirect URI

2. **Get Your Credentials**:
   - Client ID (from your app dashboard)
   - Client Secret (from your app dashboard)
   - Set your redirect URI to match your server

3. **Configure Your Server**:
   ```bash
   # Set these environment variables
   SNAPCHAT_CLIENT_ID=your_client_id
   SNAPCHAT_CLIENT_SECRET=your_client_secret
   SNAPCHAT_REDIRECT_URI=https://your-server.com/auth/callback
   JWT_SECRET=your_jwt_secret
   ```

4. **Use the OAuth Flow**:
   - Click "Connect with Snapchat" in your app
   - Complete the authorization
   - Your app will receive the token

## Option 2: Manual Token Generation (For Testing)

1. **Create an OAuth App** (as above)

2. **Manually Navigate to Auth URL**:
   ```
   https://accounts.snapchat.com/login/oauth2/authorize?
   response_type=code&
   client_id=YOUR_CLIENT_ID&
   redirect_uri=YOUR_REDIRECT_URI&
   scope=snapchat-marketing-api&
   state=random_state
   ```

3. **Get the Authorization Code**:
   - After authorizing, you'll be redirected
   - Copy the `code` parameter from the URL

4. **Exchange Code for Token**:
   ```bash
   curl -X POST https://accounts.snapchat.com/login/oauth2/access_token \
     -d "grant_type=authorization_code" \
     -d "code=YOUR_AUTH_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI"
   ```

5. **Use the Access Token**:
   - The response will contain `access_token`
   - This token expires in 60 minutes
   - Use `refresh_token` to get new tokens

## Option 3: Use a Helper Tool

There's a community tool that can help:
- [easy-snapchat-accesstoken](https://github.com/rbnali/easy-snapchat-accesstoken)

## Important Notes

- Marketing API access tokens expire in 60 minutes
- You'll need to refresh them using the refresh token
- Conversions API tokens (from Ads Manager) won't work for Marketing API
- You need proper scopes: `snapchat-marketing-api`

## Quick Test

Once you have a token, test it:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://adsapi.snapchat.com/v1/me
```

If it returns user info, your token is valid!