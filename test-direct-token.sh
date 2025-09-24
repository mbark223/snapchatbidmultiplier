#!/bin/bash

# Test direct Snapchat access token
# Usage: ./test-direct-token.sh <SNAPCHAT_ACCESS_TOKEN> [AD_SQUAD_ID]

ACCESS_TOKEN="$1"
AD_SQUAD_ID="$2"

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Usage: ./test-direct-token.sh <SNAPCHAT_ACCESS_TOKEN> [AD_SQUAD_ID]"
    echo ""
    echo "This script tests a direct Snapchat access token (not a JWT)."
    echo "To get a Snapchat access token:"
    echo "1. Use the OAuth flow in the web interface"
    echo "2. Or use the Snapchat API documentation to get a token"
    exit 1
fi

API_URL="${API_URL:-http://localhost:3000}"

echo "Testing direct Snapchat access token..."
echo "API URL: $API_URL"
echo "Token length: ${#ACCESS_TOKEN}"
echo "=========================================="

# Build request body
if [ -z "$AD_SQUAD_ID" ]; then
    REQUEST_BODY="{\"access_token\": \"$ACCESS_TOKEN\"}"
else
    REQUEST_BODY="{\"access_token\": \"$ACCESS_TOKEN\", \"ad_squad_id\": \"$AD_SQUAD_ID\"}"
fi

# Test the direct endpoint
echo -e "\nTesting Snapchat API with direct token:"
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY" \
    "$API_URL/debug/test-snapchat-direct" | python -m json.tool

echo -e "\n\nIf you see 'unauthorized' errors above, your Snapchat access token may be:"
echo "- Expired (tokens expire after a few hours)"
echo "- Invalid or incorrectly formatted"
echo "- Missing required scopes (needs 'snapchat-marketing-api')"
echo ""
echo "To get a valid token, use the 'Connect with Snapchat' button in the web interface."