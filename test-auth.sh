#!/bin/bash

# Test authentication with Snapchat API
# Usage: ./test-auth.sh <ACCESS_TOKEN> <AD_SQUAD_ID>

ACCESS_TOKEN="$1"
AD_SQUAD_ID="$2"

if [ -z "$ACCESS_TOKEN" ] || [ -z "$AD_SQUAD_ID" ]; then
    echo "Usage: ./test-auth.sh <ACCESS_TOKEN> <AD_SQUAD_ID>"
    exit 1
fi

echo "Testing authentication with Snapchat API..."
echo "=========================================="

# Test 1: Get user info
echo -e "\n1. Testing user info endpoint:"
curl -s -w "\nHTTP Status: %{http_code}\n" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "https://adsapi.snapchat.com/v1/me"

# Test 2: Get ad accounts
echo -e "\n\n2. Testing ad accounts endpoint:"
curl -s -w "\nHTTP Status: %{http_code}\n" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "https://adsapi.snapchat.com/v1/me/adaccounts"

# Test 3: Get specific ad squad
echo -e "\n\n3. Testing ad squad endpoint:"
curl -s -w "\nHTTP Status: %{http_code}\n" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "https://adsapi.snapchat.com/v1/adsquads/$AD_SQUAD_ID"

# Test 4: Update bid multipliers with minimal payload
echo -e "\n\n4. Testing bid multiplier update with minimal payload:"
curl -X PUT -s -w "\nHTTP Status: %{http_code}\n" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "adsquad": {
            "bid_multiplier_properties": {
                "multipliers": {
                    "us_state": {
                        "CA": 1.5
                    }
                },
                "default_multiplier": 1.0
            }
        }
    }' \
    "https://adsapi.snapchat.com/v1/adsquads/$AD_SQUAD_ID"

echo -e "\n\nDone. Check the responses above for authentication issues."