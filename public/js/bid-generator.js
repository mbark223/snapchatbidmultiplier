// OAuth Configuration Manager
const OAuthConfig = {
    CLIENT_ID_KEY: 'snapchat_client_id',
    CLIENT_SECRET_KEY: 'snapchat_client_secret',
    REDIRECT_URI_KEY: 'snapchat_redirect_uri',
    
    save(clientId, clientSecret, redirectUri) {
        if (clientId) localStorage.setItem(this.CLIENT_ID_KEY, clientId);
        if (clientSecret) localStorage.setItem(this.CLIENT_SECRET_KEY, clientSecret);
        if (redirectUri) localStorage.setItem(this.REDIRECT_URI_KEY, redirectUri);
    },
    
    get() {
        return {
            clientId: localStorage.getItem(this.CLIENT_ID_KEY) || '',
            clientSecret: localStorage.getItem(this.CLIENT_SECRET_KEY) || '',
            redirectUri: localStorage.getItem(this.REDIRECT_URI_KEY) || 'http://localhost:3000/api/auth/callback'
        };
    },
    
    clear() {
        localStorage.removeItem(this.CLIENT_ID_KEY);
        localStorage.removeItem(this.CLIENT_SECRET_KEY);
        localStorage.removeItem(this.REDIRECT_URI_KEY);
    }
};

// Token Manager
const TokenManager = {
    TOKEN_KEY: 'snapchat_jwt_token',
    TOKEN_EXPIRY_KEY: 'snapchat_jwt_expiry',
    
    saveToken(token, expiresIn) {
        localStorage.setItem(this.TOKEN_KEY, token);
        const expiryTime = Date.now() + ((expiresIn - 300) * 1000);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    },
    
    getToken() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        
        if (!token || !expiry) return null;
        
        if (Date.now() > parseInt(expiry)) {
            this.clearToken();
            return null;
        }
        
        return token;
    },
    
    clearToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    },
    
    isAuthenticated() {
        return this.getToken() !== null;
    },
    
    getAccessToken() {
        const jwtToken = this.getToken();
        if (!jwtToken) return null;
        
        const payload = decodeJwtPayload(jwtToken);
        return payload && typeof payload.access_token === 'string'
            ? payload.access_token
            : null;
    },
    
    getTokenExpiry() {
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        return expiry ? new Date(parseInt(expiry)) : null;
    }
};

// Campaign Manager
const CampaignManager = {
    campaigns: [],
    
    setCampaigns(campaigns) {
        this.campaigns = campaigns;
    },
    
    getCampaigns() {
        return this.campaigns;
    },
    
    updateCampaignMultiplier(campaignId, multiplier) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (campaign) {
            campaign.newMultiplier = multiplier;
        }
    },
    
    applyBulkMultiplier(multiplier) {
        this.campaigns.forEach(campaign => {
            campaign.newMultiplier = multiplier;
        });
    }
};

// Utility functions
function decodeJwtPayload(token) {
    if (!token) return null;
    
    try {
        const parts = token.split('.');
        if (parts.length < 2) {
            return null;
        }
        
        const base64 = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(base64 + padding);
        return JSON.parse(decoded);
    } catch (error) {
        console.warn('Failed to decode JWT payload', error);
        return null;
    }
}

function resolveAccessToken() {
    const oauthToken = TokenManager.getAccessToken();
    if (oauthToken) {
        return { token: oauthToken, source: 'oauth' };
    }
    
    const accessTokenInput = document.getElementById('accessToken');
    const manualToken = accessTokenInput?.value.trim();
    
    if (manualToken) {
        return { token: manualToken, source: 'manual' };
    }
    
    return { token: null, source: null };
}

// Tab Management
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Authentication Tab Functions
function generateAuthUrl() {
    const clientId = document.getElementById('clientId').value.trim();
    const redirectUri = document.getElementById('redirectUri').value.trim();
    
    if (!clientId || !redirectUri) {
        showMessage('Please enter both Client ID and Redirect URI', 'error');
        return;
    }
    
    const authUrl = new URL('https://accounts.snapchat.com/login/oauth2/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'snapchat-marketing-api');
    authUrl.searchParams.append('state', Math.random().toString(36).substring(2, 15));
    
    document.getElementById('authUrl').textContent = authUrl.toString();
    document.getElementById('authUrlSection').classList.remove('hidden');
}

function saveOAuthConfig() {
    const clientId = document.getElementById('clientId').value.trim();
    const clientSecret = document.getElementById('clientSecret').value.trim();
    const redirectUri = document.getElementById('redirectUri').value.trim();
    
    OAuthConfig.save(clientId, clientSecret, redirectUri);
    showMessage('OAuth configuration saved locally', 'success');
}

function openAuthUrl() {
    const authUrl = document.getElementById('authUrl').textContent;
    window.open(authUrl, '_blank');
}

async function testToken() {
    const { token, source } = resolveAccessToken();
    
    if (!token) {
        showMessage('Please enter an access token', 'error');
        return;
    }
    
    try {
        const response = await fetch('/debug/test-snapchat-direct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ access_token: token })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            updateAuthStatus(true);
            showMessage('Successfully connected to Snapchat API!', 'success');
        } else {
            updateAuthStatus(false);
            showMessage(`Connection failed: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        updateAuthStatus(false);
        showMessage(`Connection error: ${error.message}`, 'error');
    }
}

function updateAuthStatus(isConnected) {
    const statusIndicator = document.getElementById('authStatus');
    const statusText = document.getElementById('authStatusText');
    const authInfo = document.getElementById('authInfo');
    
    if (isConnected) {
        statusIndicator.classList.add('status-connected');
        statusIndicator.classList.remove('status-disconnected');
        statusText.textContent = 'Connected';
        authInfo.classList.remove('hidden');
        
        const expiry = TokenManager.getTokenExpiry();
        if (expiry) {
            document.getElementById('tokenExpiry').textContent = expiry.toLocaleString();
        }
    } else {
        statusIndicator.classList.remove('status-connected');
        statusIndicator.classList.add('status-disconnected');
        statusText.textContent = 'Not connected';
        authInfo.classList.add('hidden');
    }
}

function logout() {
    TokenManager.clearToken();
    updateAuthStatus(false);
    document.getElementById('accessToken').value = '';
    showMessage('Logged out successfully', 'success');
}

// Campaigns Tab Functions
async function fetchCampaigns() {
    const adAccountId = document.getElementById('adAccountId').value.trim();
    
    if (!adAccountId) {
        showMessage('Please enter an Ad Account ID', 'error');
        return;
    }
    
    const { token } = resolveAccessToken();
    
    if (!token) {
        showMessage('Please authenticate first', 'error');
        return;
    }
    
    const btn = document.getElementById('fetchCampaignsBtn');
    const loading = document.getElementById('campaignsLoading');
    
    btn.disabled = true;
    loading.classList.remove('hidden');
    
    try {
        // Simulated API call - replace with actual endpoint
        const response = await fetch(`/api/campaigns?ad_account_id=${adAccountId}`, {
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch campaigns');
        }
        
        const data = await response.json();
        
        if (data.campaigns && data.campaigns.length > 0) {
            CampaignManager.setCampaigns(data.campaigns);
            displayCampaigns();
            document.getElementById('bulkControls').classList.remove('hidden');
            document.getElementById('campaignMessage').classList.add('hidden');
        } else {
            document.getElementById('campaignsContainer').classList.add('hidden');
            document.getElementById('campaignMessage').classList.remove('hidden');
            document.getElementById('bulkControls').classList.add('hidden');
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

function displayCampaigns() {
    const tbody = document.getElementById('campaignsTableBody');
    tbody.innerHTML = '';
    
    const campaigns = CampaignManager.getCampaigns();
    console.log('Displaying campaigns:', campaigns);
    
    campaigns.forEach(campaign => {
        const row = document.createElement('tr');
        const stateCount = campaign.stateMultipliers ? Object.keys(campaign.stateMultipliers).length : 0;
        const stateIndicator = campaign.hasStateMultipliers ? 
            `<span class="state-indicator" title="${stateCount} states configured">📍 ${stateCount}</span>` : '';
        
        row.innerHTML = `
            <td>${campaign.name || 'Unnamed Campaign'}</td>
            <td>${campaign.id}</td>
            <td>${campaign.status || 'Active'}</td>
            <td>${campaign.budget ? `$${campaign.budget.toLocaleString()}` : 'N/A'}</td>
            <td>${campaign.impressions ? campaign.impressions.toLocaleString() : 'N/A'}</td>
            <td>${campaign.currentMultiplier || '1.0'}x ${stateIndicator}</td>
            <td>
                <input type="number" 
                       class="multiplier-input" 
                       min="0.1" 
                       max="10" 
                       step="0.1" 
                       value="${campaign.newMultiplier || campaign.currentMultiplier || '1.0'}"
                       onchange="updateCampaignMultiplier('${campaign.id}', this.value)">
            </td>
            <td class="action-buttons">
                <button onclick="applyCampaignMultiplier('${campaign.id}')">Apply</button>
                <button onclick="showStateMultipliers('${campaign.id}')" class="secondary" title="Configure state-specific multipliers">States</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('campaignsContainer').classList.remove('hidden');
}

function updateCampaignMultiplier(campaignId, value) {
    CampaignManager.updateCampaignMultiplier(campaignId, parseFloat(value));
}

async function applyCampaignMultiplier(campaignId) {
    const campaign = CampaignManager.getCampaigns().find(c => c.id === campaignId);
    if (!campaign) return;
    
    const multiplier = campaign.newMultiplier || campaign.currentMultiplier || 1.0;
    
    try {
        const token = TokenManager.getToken();
        if (!token) {
            showMessage('Please login to apply multipliers', 'warning');
            return;
        }
        
        showMessage('Applying multiplier...', 'info');
        
        // First, get all ad squads for this campaign
        const adSquadsResponse = await fetch(`/api/campaigns/${campaignId}/adsquads`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!adSquadsResponse.ok) {
            throw new Error(`Failed to fetch ad squads: ${adSquadsResponse.statusText}`);
        }
        
        const adSquadsData = await adSquadsResponse.json();
        const adSquadIds = adSquadsData.adsquads ? adSquadsData.adsquads.map(as => as.adsquad.id) : [];
        
        if (adSquadIds.length === 0) {
            showMessage('No ad squads found for this campaign', 'warning');
            return;
        }
        
        // Apply the multiplier to all ad squads
        const response = await fetch(`/api/campaigns/${campaignId}/bid-multipliers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                adsquad_ids: adSquadIds,
                multipliers: {}, // No state-specific multipliers for now
                default_multiplier: multiplier
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update multipliers');
        }
        
        const result = await response.json();
        
        // Update local state
        campaign.currentMultiplier = multiplier;
        displayCampaigns();
        
        showMessage(`Successfully applied ${multiplier}x multiplier to ${result.updated || adSquadIds.length} ad squad(s)`, 'success');
    } catch (error) {
        console.error('Error applying multiplier:', error);
        showMessage(`Error: ${error.message}`, 'error');
    }
}

async function applyBulkMultiplier() {
    const multiplier = parseFloat(document.getElementById('bulkMultiplier').value);
    
    if (isNaN(multiplier) || multiplier < 0.1 || multiplier > 10) {
        showMessage('Please enter a valid multiplier between 0.1 and 10', 'error');
        return;
    }
    
    const token = TokenManager.getToken();
    if (!token) {
        showMessage('Please login to apply multipliers', 'warning');
        return;
    }
    
    const campaigns = CampaignManager.getCampaigns();
    if (campaigns.length === 0) {
        showMessage('No campaigns to update', 'info');
        return;
    }
    
    showMessage(`Applying ${multiplier}x to all campaigns...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Apply to each campaign
    for (const campaign of campaigns) {
        try {
            // Update the new multiplier value
            campaign.newMultiplier = multiplier;
            
            // Apply the multiplier
            await applyCampaignMultiplier(campaign.id);
            successCount++;
        } catch (error) {
            console.error(`Error updating campaign ${campaign.id}:`, error);
            errorCount++;
        }
    }
    
    if (successCount > 0 && errorCount === 0) {
        showMessage(`Successfully applied ${multiplier}x to all ${successCount} campaigns`, 'success');
    } else if (successCount > 0) {
        showMessage(`Applied ${multiplier}x to ${successCount} campaigns, ${errorCount} failed`, 'warning');
    } else {
        showMessage(`Failed to apply multipliers to campaigns`, 'error');
    }
    
    displayCampaigns();
}

// Postman Integration Functions
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showMessage('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Copied to clipboard!', 'success');
    });
}

// General UI Functions
function showMessage(message, type = 'info') {
    const apiResponse = document.getElementById('apiResponse');
    apiResponse.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    apiResponse.textContent = message;
    apiResponse.style.display = 'block';
    
    setTimeout(() => {
        apiResponse.style.display = 'none';
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load saved OAuth config
    const config = OAuthConfig.get();
    document.getElementById('clientId').value = config.clientId;
    document.getElementById('clientSecret').value = config.clientSecret;
    document.getElementById('redirectUri').value = config.redirectUri;
    
    // Check authentication status
    updateAuthStatus(TokenManager.isAuthenticated());
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        handleOAuthCallback(code);
    }
});

// Handle OAuth callback
async function handleOAuthCallback(code) {
    const config = OAuthConfig.get();
    
    if (!config.clientId || !config.clientSecret) {
        showMessage('OAuth configuration missing. Please set up credentials first.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri,
                grant_type: 'authorization_code'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            TokenManager.saveToken(data.token, data.expires_in);
            updateAuthStatus(true);
            showMessage('Authentication successful!', 'success');
            
            // Clear the URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            showMessage(`Authentication failed: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        showMessage(`Authentication error: ${error.message}`, 'error');
    }
}

// State Multiplier Functions
function showStateMultipliers(campaignId) {
    const campaign = CampaignManager.getCampaigns().find(c => c.id === campaignId);
    if (!campaign) {
        showMessage('Campaign not found', 'error');
        return;
    }
    
    // Check if StateMultiplierManager is loaded
    if (typeof StateMultiplierManager === 'undefined') {
        showMessage('State multiplier module not loaded. Please refresh the page.', 'error');
        return;
    }
    
    StateMultiplierManager.showModal(campaignId, campaign.stateMultipliers || {});
}

// Make function globally accessible
window.showStateMultipliers = showStateMultipliers;

async function updateCampaignStateMultipliers(campaignId, stateMultipliers, defaultMultiplier) {
    try {
        // First, get all ad squads for the campaign
        const response = await fetch(`/api/campaigns/${campaignId}/adsquads`, {
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch ad squads');
        }

        const { data: adsquads } = await response.json();
        
        if (!adsquads || adsquads.length === 0) {
            throw new Error('No ad squads found for this campaign');
        }

        // Prepare the multiplier configuration
        const multiplierConfig = {
            us_state: stateMultipliers
        };

        // Update bid multipliers for all ad squads
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
            const error = await updateResponse.json();
            throw new Error(error.message || 'Failed to update state multipliers');
        }

        return true;
    } catch (error) {
        console.error('Error updating state multipliers:', error);
        throw error;
    }
}

// Bulk State Multipliers
function showBulkStateMultipliers() {
    // Create a modal for bulk state multipliers
    const modal = document.createElement('div');
    modal.id = 'bulkStateModal';
    modal.className = 'modal';
    modal.style.cssText = `
        display: block;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background-color: #fefefe;
            margin: 10% auto;
            padding: 20px;
            border-radius: 8px;
            width: 60%;
            max-width: 600px;
        ">
            <h2>Apply State Multipliers to All Campaigns</h2>
            <p>Configure state multipliers that will be applied to all campaigns in your account.</p>
            
            <div style="margin: 20px 0;">
                <label>
                    <input type="checkbox" id="selectAllCampaigns" checked> 
                    Apply to all campaigns (${CampaignManager.getCampaigns().length} total)
                </label>
            </div>
            
            <div class="button-group">
                <button onclick="configureBulkStates()" class="success">Configure States</button>
                <button onclick="closeBulkStateModal()" class="secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeBulkStateModal() {
    const modal = document.getElementById('bulkStateModal');
    if (modal) {
        modal.remove();
    }
}

async function configureBulkStates() {
    closeBulkStateModal();
    
    // Show state configuration modal
    StateMultiplierManager.showModal('bulk', {});
    
    // Override the save function for bulk operation
    const originalSave = StateMultiplierManager.saveStateMultipliers;
    StateMultiplierManager.saveStateMultipliers = async function() {
        const stateMultipliers = this.getCurrentMultipliers();
        const defaultMultiplier = parseFloat(document.getElementById('defaultStateMultiplier').value);
        
        if (Object.keys(stateMultipliers).length === 0) {
            showMessage('Please select at least one state', 'error');
            return;
        }
        
        // Apply to all campaigns
        const campaigns = CampaignManager.getCampaigns();
        let successCount = 0;
        let errorCount = 0;
        
        showMessage(`Applying state multipliers to ${campaigns.length} campaigns...`, 'info');
        
        for (const campaign of campaigns) {
            try {
                await updateCampaignStateMultipliers(campaign.id, stateMultipliers, defaultMultiplier);
                campaign.hasStateMultipliers = true;
                campaign.stateMultipliers = stateMultipliers;
                campaign.defaultStateMultiplier = defaultMultiplier;
                successCount++;
            } catch (error) {
                console.error(`Failed to update campaign ${campaign.id}:`, error);
                errorCount++;
            }
        }
        
        // Restore original save function
        StateMultiplierManager.saveStateMultipliers = originalSave;
        
        if (errorCount > 0) {
            showMessage(`Updated ${successCount} campaigns, ${errorCount} failed`, 'warning');
        } else {
            showMessage(`Successfully updated all ${successCount} campaigns`, 'success');
        }
        
        StateMultiplierManager.closeModal();
        displayCampaigns();
    };
}