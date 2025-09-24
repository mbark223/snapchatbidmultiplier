# Simple Setup Guide

This tool works with direct Snapchat Marketing API tokens. Here's how to use it:

## Step 1: Get a Snapchat Marketing API Token

### Option A: Use the Manual Script (Recommended)
```bash
./get-token-manual.sh
```

This script will:
1. Ask for your Snapchat OAuth app credentials
2. Generate an authorization URL
3. Help you exchange the code for an access token

### Option B: Use Your Existing Integration
If you already have a Snapchat integration, use the access token from there.

### Option C: Manual OAuth Flow
1. Create an OAuth app at business.snapchat.com
2. Get your Client ID and Client Secret
3. Follow the OAuth flow manually to get an access token

## Step 2: Use the Tool

1. Open https://snapchatbidmultiplier-rdjs3v9nh-flatiron-gaming.vercel.app
2. Enter your Ad Set ID
3. Paste your Snapchat Marketing API access token
4. Configure your bid multipliers
5. Click "Generate Code"
6. Use the generated code in your application

## Important Notes

- ❌ Do NOT use Conversions API tokens (from Ads Manager)
- ✅ Use Marketing API OAuth tokens only
- Tokens expire after 60 minutes - refresh as needed

## Testing Your Token

Click "Test Auth" after entering your token to verify it works with Snapchat's API.

## No OAuth Required

This deployment doesn't require OAuth configuration. Just use your token directly!