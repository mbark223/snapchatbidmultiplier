// Direct Snapchat API Integration
class SnapchatDirectAPI {
    constructor() {
        this.baseURL = 'https://adsapi.snapchat.com/v1';
    }

    // Get the access token from TokenManager
    getAccessToken() {
        const token = TokenManager.getAccessToken();
        if (!token) {
            throw new Error('No Snapchat access token found. Please authenticate first.');
        }
        return token;
    }

    // Make authenticated request to Snapchat API
    async makeRequest(endpoint, options = {}) {
        const accessToken = this.getAccessToken();
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            mode: 'cors'
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `API Error: ${response.status}`);
        }

        return response.json();
    }

    // Get campaigns for an ad account
    async getCampaigns(adAccountId) {
        try {
            const response = await this.makeRequest(`/adaccounts/${adAccountId}/campaigns`);
            return response.campaigns || [];
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            throw error;
        }
    }

    // Get ad squads for a campaign
    async getAdSquads(campaignId) {
        try {
            const response = await this.makeRequest(`/campaigns/${campaignId}/adsquads`);
            return response.adsquads || [];
        } catch (error) {
            console.error('Error fetching ad squads:', error);
            throw error;
        }
    }

    // Update ad squad bid multipliers
    async updateAdSquadBidMultipliers(adsquadId, bidMultiplierProperties) {
        try {
            const response = await this.makeRequest(`/adsquads/${adsquadId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    adsquad: {
                        bid_multiplier_properties: bidMultiplierProperties
                    }
                })
            });
            return response.adsquad;
        } catch (error) {
            console.error('Error updating bid multipliers:', error);
            throw error;
        }
    }

    // Batch update multiple ad squads
    async batchUpdateBidMultipliers(updates) {
        const results = [];
        const errors = [];

        for (const update of updates) {
            try {
                const result = await this.updateAdSquadBidMultipliers(
                    update.adsquad_id,
                    update.bid_multiplier_properties
                );
                results.push(result);
            } catch (error) {
                errors.push({
                    adsquad_id: update.adsquad_id,
                    error: error.message
                });
            }
        }

        return { results, errors };
    }
}

// Initialize the direct API client
const snapchatDirectAPI = new SnapchatDirectAPI();

// Alternative campaign fetching function
async function fetchCampaignsDirect() {
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
        // Use direct Snapchat API
        const campaigns = await snapchatDirectAPI.getCampaigns(adAccountId);
        
        if (campaigns.length === 0) {
            showMessage('No campaigns found for this ad account', 'info');
            document.getElementById('campaignsContainer').classList.add('hidden');
            document.getElementById('bulkControls').classList.add('hidden');
        } else {
            // Store campaigns
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
        showMessage(`Error fetching campaigns: ${error.message}`, 'error');
        document.getElementById('campaignsContainer').classList.add('hidden');
        document.getElementById('bulkControls').classList.add('hidden');
    } finally {
        btn.disabled = false;
        loading.classList.add('hidden');
    }
}

// Alternative bid multiplier update function
async function updateCampaignMultiplierDirect(campaignId, multiplier) {
    try {
        // First, get all ad squads for the campaign
        const adsquads = await snapchatDirectAPI.getAdSquads(campaignId);
        
        if (adsquads.length === 0) {
            throw new Error('No ad squads found for this campaign');
        }

        // Prepare bid multiplier properties
        const bidMultiplierProperties = {
            variables: ['age', 'gender', 'os'],
            bid_multiplier_map: {
                'age:18-24,gender:MALE,os:IOS': multiplier,
                'age:18-24,gender:FEMALE,os:IOS': multiplier,
                'age:25-34,gender:MALE,os:IOS': multiplier,
                'age:25-34,gender:FEMALE,os:IOS': multiplier,
                'age:18-24,gender:MALE,os:ANDROID': multiplier,
                'age:18-24,gender:FEMALE,os:ANDROID': multiplier,
                'age:25-34,gender:MALE,os:ANDROID': multiplier,
                'age:25-34,gender:FEMALE,os:ANDROID': multiplier
            },
            default: multiplier
        };

        // Prepare updates for all ad squads
        const updates = adsquads.map(adsquad => ({
            adsquad_id: adsquad.id,
            bid_multiplier_properties: bidMultiplierProperties
        }));

        // Batch update
        const { results, errors } = await snapchatDirectAPI.batchUpdateBidMultipliers(updates);

        if (errors.length > 0) {
            console.error('Some updates failed:', errors);
            showMessage(`Updated ${results.length} ad squads, ${errors.length} failed`, 'warning');
        } else {
            showMessage(`Successfully updated ${results.length} ad squads`, 'success');
        }

        // Update local state
        CampaignManager.updateCampaignMultiplier(campaignId, multiplier);

        return true;
    } catch (error) {
        showMessage(`Error updating multiplier: ${error.message}`, 'error');
        return false;
    }
}

// Override the existing fetchCampaigns function
window.fetchCampaigns = fetchCampaignsDirect;

// Override the existing updateCampaignMultiplier function
window.updateCampaignMultiplier = updateCampaignMultiplierDirect;