#!/bin/bash

# Manual token exchange helper for Snapchat Marketing API
# Usage: ./get-token-manual.sh

echo "=== Snapchat Marketing API Token Helper ==="
echo ""
echo "This script helps you manually get a Marketing API token."
echo ""

# Check if config file exists
if [ -f ".snapchat-oauth-config" ]; then
    source .snapchat-oauth-config
    echo "Loaded config from .snapchat-oauth-config"
else
    echo "First, let's save your OAuth app details..."
    echo ""
    
    read -p "Enter your Client ID: " CLIENT_ID
    read -p "Enter your Client Secret: " CLIENT_SECRET
    read -p "Enter your Redirect URI: " REDIRECT_URI
    
    # Save config for next time
    cat > .snapchat-oauth-config << EOF
CLIENT_ID="$CLIENT_ID"
CLIENT_SECRET="$CLIENT_SECRET"
REDIRECT_URI="$REDIRECT_URI"
EOF
    
    echo "Config saved to .snapchat-oauth-config"
fi

echo ""
echo "Step 1: Open this URL in your browser:"
echo ""
echo "https://accounts.snapchat.com/login/oauth2/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&scope=snapchat-marketing-api&state=testing123"
echo ""
echo "Step 2: After authorizing, you'll be redirected. Copy the 'code' parameter from the URL."
echo ""
read -p "Enter the authorization code: " AUTH_CODE

echo ""
echo "Exchanging code for access token..."
echo ""

# Exchange code for token
RESPONSE=$(curl -s -X POST https://accounts.snapchat.com/login/oauth2/access_token \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "redirect_uri=$REDIRECT_URI")

# Check if jq is available
if command -v jq &> /dev/null; then
    ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
    REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')
    EXPIRES_IN=$(echo $RESPONSE | jq -r '.expires_in')
    
    if [ "$ACCESS_TOKEN" != "null" ]; then
        echo "✅ Success!"
        echo ""
        echo "Access Token: $ACCESS_TOKEN"
        echo "Refresh Token: $REFRESH_TOKEN"
        echo "Expires In: $EXPIRES_IN seconds"
        echo ""
        echo "Testing the token..."
        curl -s -H "Authorization: Bearer $ACCESS_TOKEN" https://adsapi.snapchat.com/v1/me | jq .
        
        # Save tokens
        cat > .snapchat-tokens << EOF
ACCESS_TOKEN="$ACCESS_TOKEN"
REFRESH_TOKEN="$REFRESH_TOKEN"
TIMESTAMP=$(date +%s)
EOF
        echo ""
        echo "Tokens saved to .snapchat-tokens"
    else
        echo "❌ Failed to get access token"
        echo "Response: $RESPONSE"
    fi
else
    echo "Response: $RESPONSE"
    echo ""
    echo "💡 Tip: Install 'jq' for better JSON parsing: brew install jq"
fi

echo ""
echo "Add .snapchat-oauth-config and .snapchat-tokens to your .gitignore!"