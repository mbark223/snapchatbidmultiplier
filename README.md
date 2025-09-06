# Snapchat Bid Multiplier API

A TypeScript/Express API for managing Snapchat campaign bid multipliers with support for granular targeting across Gender, Age, DMA, and State dimensions.

## Features

- OAuth 2.0 authentication with Snapchat Ads API
- Campaign and AdSquad management
- Bid multiplier configuration for multiple targeting dimensions
- Batch operations support
- Input validation and error handling
- Rate limiting and security features

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Snapchat Ads API credentials

## Installation

```bash
# Clone the repository
git clone https://github.com/mbark223/snapchatbidmultiplier.git
cd snapchat-bid-multiplier-api

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your Snapchat API credentials
```

## Configuration

Update the `.env` file with your credentials:

```env
SNAPCHAT_CLIENT_ID=your_client_id_here
SNAPCHAT_CLIENT_SECRET=your_client_secret_here
SNAPCHAT_REDIRECT_URI=http://localhost:3000/api/auth/callback
JWT_SECRET=your_jwt_secret_here
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## API Endpoints

### Authentication

- `GET /api/auth/login` - Initiate OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Campaigns

- `GET /api/campaigns?ad_account_id={id}` - List campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `GET /api/campaigns/:id/adsquads` - Get campaign ad squads
- `POST /api/campaigns/:id/bid-multipliers` - Update bid multipliers for campaign

### Ad Squads

- `GET /api/adsquads/:id` - Get ad squad details
- `GET /api/adsquads/:id/bid-multipliers` - Get current bid multipliers
- `PUT /api/adsquads/:id/bid-multipliers` - Update bid multipliers
- `DELETE /api/adsquads/:id/bid-multipliers` - Remove bid multipliers

### Targeting

- `GET /api/targeting/dmas?state={state}` - Get DMAs (optionally by state)
- `GET /api/targeting/dmas/search?q={query}` - Search DMAs
- `GET /api/targeting/states` - Get US states list
- `GET /api/targeting/regions` - Get region groupings
- `POST /api/targeting/validate` - Validate multiplier configuration

## Example Usage

### Update Bid Multipliers

```bash
POST /api/campaigns/{campaign_id}/bid-multipliers
Authorization: Bearer {token}

{
  "adsquad_ids": ["adsquad_123", "adsquad_456"],
  "multipliers": {
    "gender": {
      "male": 1.2,
      "female": 0.8
    },
    "age": {
      "18-24": 1.5,
      "25-34": 1.0
    },
    "us_state": {
      "CA": 0.9,
      "NY": 1.3
    },
    "dma": {
      "DMA_501": 1.1,
      "DMA_803": 0.85
    }
  },
  "default_multiplier": 1.0
}
```

### Response Format

```json
{
  "data": {
    "adsquad_id": "xxx",
    "brand_safety_config": {
      "bid_multiplier_properties": {
        "variables": ["GENDER", "AGE", "US_STATE", "DMA"],
        "bid_multiplier_map": {
          "male": 1.2,
          "female": 0.8,
          "18-24": 1.5,
          "25-34": 1.0,
          "CA": 0.9,
          "NY": 1.3,
          "DMA_501": 1.1,
          "DMA_803": 0.85
        },
        "default": 1.0
      }
    }
  },
  "message": "Bid multipliers updated successfully"
}
```

## Validation Rules

- Multiplier values must be between 0.1 and 10.0
- Gender values: `male`, `female`, `unknown`
- Age ranges: `13-17`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`
- State codes: Valid US state abbreviations (e.g., `CA`, `NY`)
- DMA codes: Format `DMA_XXX` where XXX is the DMA code

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "gender.male",
      "message": "Multiplier must be between 0.1 and 10.0",
      "value": 15
    }
  ],
  "status": 400,
  "timestamp": "2025-09-06T12:00:00Z"
}
```

## Security

- JWT authentication for all protected endpoints
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet.js for security headers
- Input validation and sanitization

## License

ISC

## Support

For issues and questions, please create an issue in the GitHub repository.