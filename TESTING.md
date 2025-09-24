# Testing with Direct Snapchat Access Tokens

Since OAuth is not configured on this server, you'll need to use a direct Snapchat Marketing API access token.

## Important: Token Types

### ❌ Conversions API Tokens (Will NOT Work)
- Found in Ads Manager → Conversions API Tokens
- Look like: `WFIZTM0ZS1iY2U1LTQ0ZDEtOTRjOC0zNGI1MDBlMmNiZWMifQ...`
- Used for server-to-server event tracking
- **These tokens CANNOT access the Marketing API**

### ✅ Marketing API OAuth Tokens (Required)
- Obtained through OAuth flow with Snapchat
- Shorter format, different structure
- Has access to Marketing API endpoints

## Getting a Marketing API Access Token

You'll need a valid Snapchat Marketing API OAuth access token. This can be obtained through:

1. **Snapchat Business Manager**:
   - Go to business.snapchat.com
   - Create an app under "Apps"
   - Use the OAuth flow to get an access token

2. **Snapchat API Explorer**:
   - Use Snapchat's API testing tools
   - Generate a temporary access token for testing

3. **Existing OAuth Integration**:
   - If you have an existing app with OAuth setup
   - Use the access token from that integration

## Testing Authentication

### Option 1: Using the Web Interface
1. Open the web interface
2. Enter your Ad Set ID
3. Enter your Snapchat access token in the "Snapchat Access Token" field
4. Click "Test Auth" to verify your token works with Snapchat's API

### Option 2: Using the Test Script
```bash
# Test with just access token
./test-direct-token.sh YOUR_SNAPCHAT_ACCESS_TOKEN

# Test with access token and ad squad ID
./test-direct-token.sh YOUR_SNAPCHAT_ACCESS_TOKEN AD_SQUAD_ID
```

### Option 3: Using curl directly
```bash
# Test the direct endpoint
curl -X POST http://localhost:3000/debug/test-snapchat-direct \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "YOUR_SNAPCHAT_ACCESS_TOKEN",
    "ad_squad_id": "YOUR_AD_SQUAD_ID"
  }'
```

## Common Issues

1. **"unauthorized" errors**: Your token may be expired or invalid
2. **Token format errors**: Make sure you're using a Snapchat access token, not a JWT
3. **Scope errors**: Ensure your token has the 'snapchat-marketing-api' scope

## Token Format

Snapchat access tokens typically:
- Are longer than 20 characters
- Do NOT start with "eyJ" (that's a JWT)
- Are obtained through Snapchat's OAuth flow or API tools