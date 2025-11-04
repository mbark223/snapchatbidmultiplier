// CORS Proxy Configuration
class CORSProxy {
    constructor() {
        // Using a public CORS proxy service
        this.proxyURL = 'https://cors-anywhere.herokuapp.com/';
        // Alternative proxies if needed:
        // this.proxyURL = 'https://api.allorigins.win/raw?url=';
        // this.proxyURL = 'https://corsproxy.io/?';
    }

    // Wrap URL with CORS proxy
    wrapURL(url) {
        return this.proxyURL + encodeURIComponent(url);
    }

    // Make proxied request
    async fetch(url, options = {}) {
        const proxiedURL = this.wrapURL(url);
        
        try {
            const response = await fetch(proxiedURL, {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            // Check if we got a CORS proxy error
            if (response.headers.get('X-Cors-Redirect-1')) {
                throw new Error('CORS proxy requires activation. Visit https://cors-anywhere.herokuapp.com/corsdemo');
            }

            return response;
        } catch (error) {
            console.error('CORS Proxy error:', error);
            throw error;
        }
    }
}

// Alternative: Use the backend API with proper authentication
class BackendAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api';
    }

    // Get JWT token
    getAuthToken() {
        const token = TokenManager.getToken();
        if (!token) {
            throw new Error('No authentication token found. Please login first.');
        }
        return token;
    }

    // Make authenticated request to backend
    async makeRequest(endpoint, options = {}) {
        const token = this.getAuthToken();
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `API Error: ${response.status}`);
        }

        return response.json();
    }

    // Get campaigns
    async getCampaigns(adAccountId) {
        return this.makeRequest(`/campaigns?ad_account_id=${adAccountId}`);
    }

    // Get ad squads
    async getAdSquads(campaignId) {
        return this.makeRequest(`/campaigns/${campaignId}/adsquads`);
    }

    // Update bid multipliers
    async updateBidMultipliers(campaignId, data) {
        return this.makeRequest(`/campaigns/${campaignId}/bid-multipliers`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// Smart Campaign Manager that tries multiple approaches
class SmartCampaignManager {
    constructor() {
        this.backendAPI = new BackendAPI();
        this.corsProxy = new CORSProxy();
    }

    // Fetch campaigns with fallback strategy
    async fetchCampaigns(adAccountId) {
        const errors = [];

        // Try 1: Backend API
        try {
            console.log('Attempting to fetch campaigns via backend API...');
            const response = await this.backendAPI.getCampaigns(adAccountId);
            return response.data || [];
        } catch (error) {
            console.warn('Backend API failed:', error.message);
            errors.push({ method: 'backend', error: error.message });
        }

        // Try 2: Manual campaign entry fallback
        console.log('Falling back to manual campaign data entry...');
        return this.showManualCampaignEntry();
    }

    // Show manual campaign entry dialog
    showManualCampaignEntry() {
        const manualData = prompt(
            'Unable to fetch campaigns automatically.\n\n' +
            'Please enter campaign data manually in JSON format:\n' +
            'Example: [{"id": "campaign_id", "name": "Campaign Name", "status": "ACTIVE"}]'
        );

        if (manualData) {
            try {
                const campaigns = JSON.parse(manualData);
                return campaigns;
            } catch (error) {
                throw new Error('Invalid JSON format');
            }
        }

        throw new Error('No campaign data provided');
    }

    // Update campaign multipliers with fallback
    async updateCampaignMultipliers(campaignId, adsquadIds, multiplierConfig) {
        try {
            // Try backend API first
            console.log('Attempting to update multipliers via backend API...');
            return await this.backendAPI.updateBidMultipliers(campaignId, {
                adsquad_ids: adsquadIds,
                multipliers: multiplierConfig,
                default_multiplier: multiplierConfig.default || 1.0
            });
        } catch (error) {
            console.warn('Backend API failed:', error.message);
            
            // Generate curl command as fallback
            return this.generateCurlCommand(campaignId, adsquadIds, multiplierConfig);
        }
    }

    // Generate curl command for manual execution
    generateCurlCommand(campaignId, adsquadIds, multiplierConfig) {
        const accessToken = TokenManager.getAccessToken();
        const commands = [];

        for (const adsquadId of adsquadIds) {
            const curl = `curl -X PUT "https://adsapi.snapchat.com/v1/adsquads/${adsquadId}" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "adsquad": {
      "bid_multiplier_properties": ${JSON.stringify(multiplierConfig, null, 2)}
    }
  }'`;
            
            commands.push(curl);
        }

        const output = commands.join('\n\n');
        console.log('Generated curl commands:', output);
        
        // Show in a modal or copy to clipboard
        this.showCurlCommands(output);
        
        return {
            success: true,
            message: 'Curl commands generated. Please execute them manually.',
            commands: commands
        };
    }

    // Show curl commands in a modal
    showCurlCommands(commands) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <h3>Manual Execution Required</h3>
            <p>Copy and execute these curl commands:</p>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${commands}</pre>
            <button onclick="navigator.clipboard.writeText(\`${commands.replace(/`/g, '\\`')}\`); alert('Copied to clipboard!');">Copy to Clipboard</button>
            <button onclick="this.parentElement.remove()">Close</button>
        `;

        document.body.appendChild(modal);
    }
}

// Initialize the smart campaign manager
const smartCampaignManager = new SmartCampaignManager();

// Override updateCampaignStateMultipliers with fallback
window.updateCampaignStateMultipliers = async function(campaignId, stateMultipliers, defaultMultiplier) {
    try {
        // Try backend API first
        const response = await fetch(`/api/campaigns/${campaignId}/adsquads`, {
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Backend API unavailable');
        }

        const { data: adsquads } = await response.json();
        
        if (!adsquads || adsquads.length === 0) {
            throw new Error('No ad squads found');
        }

        // Update via backend
        const multiplierConfig = {
            us_state: stateMultipliers
        };

        const updateResponse = await fetch(`/api/campaigns/${campaignId}/bid-multipliers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adsquad_ids: adsquads.map(as => as.id),
                multipliers: multiplierConfig,
                default_multiplier: defaultMultiplier
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update via backend');
        }

        return true;
    } catch (error) {
        console.warn('Backend update failed, generating curl commands:', error);
        
        // Generate curl commands as fallback
        const accessToken = TokenManager.getAccessToken();
        if (!accessToken) {
            throw new Error('No access token available');
        }

        // Generate the bid multiplier map
        const bidMultiplierMap = {};
        Object.entries(stateMultipliers).forEach(([state, multiplier]) => {
            bidMultiplierMap[`US_STATE:${state}`] = multiplier;
        });

        const curlCommand = `
# State Multipliers for Campaign ${campaignId}
# First, fetch ad squads for the campaign:
curl -X GET "https://adsapi.snapchat.com/v1/campaigns/${campaignId}/adsquads" \\
  -H "Authorization: Bearer ${accessToken}"

# Then update each ad squad with state multipliers:
# Replace ADSQUAD_ID with actual ad squad IDs from above
curl -X PUT "https://adsapi.snapchat.com/v1/adsquads/ADSQUAD_ID" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "adsquad": {
      "bid_multiplier_properties": {
        "variables": ["US_STATE"],
        "bid_multiplier_map": ${JSON.stringify(bidMultiplierMap, null, 2)},
        "default": ${defaultMultiplier}
      }
    }
  }'`;

        smartCampaignManager.showCurlCommands(curlCommand);
        return true;
    }
};

// Override fetchCampaigns with smart fallback
window.fetchCampaigns = async function() {
    const adAccountId = document.getElementById('adAccountId').value.trim();
    
    if (!adAccountId) {
        showMessage('Please enter an Ad Account ID', 'error');
        return;
    }

    const btn = document.getElementById('fetchCampaignsBtn');
    const loading = document.getElementById('campaignsLoading');
    
    btn.disabled = true;
    loading.classList.remove('hidden');

    try {
        const campaigns = await smartCampaignManager.fetchCampaigns(adAccountId);
        
        if (campaigns.length === 0) {
            showMessage('No campaigns found', 'info');
            document.getElementById('campaignsContainer').classList.add('hidden');
            document.getElementById('bulkControls').classList.add('hidden');
        } else {
            CampaignManager.setCampaigns(campaigns.map(campaign => ({
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                currentMultiplier: 1.0,
                newMultiplier: 1.0
            })));
            
            displayCampaigns(CampaignManager.getCampaigns());
            document.getElementById('campaignsContainer').classList.remove('hidden');
            document.getElementById('bulkControls').classList.remove('hidden');
            showMessage(`Found ${campaigns.length} campaigns`, 'success');
        }
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
        document.getElementById('campaignsContainer').classList.add('hidden');
        document.getElementById('bulkControls').classList.add('hidden');
    } finally {
        btn.disabled = false;
        loading.classList.add('hidden');
    }
};