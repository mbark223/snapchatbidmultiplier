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
    
    CampaignManager.getCampaigns().forEach(campaign => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${campaign.name || 'Unnamed Campaign'}</td>
            <td>${campaign.id}</td>
            <td>${campaign.status || 'Active'}</td>
            <td>${campaign.budget ? `$${campaign.budget.toLocaleString()}` : 'N/A'}</td>
            <td>${campaign.impressions ? campaign.impressions.toLocaleString() : 'N/A'}</td>
            <td>${campaign.currentMultiplier || '1.0'}x</td>
            <td>
                <input type="number" 
                       class="multiplier-input" 
                       min="0.1" 
                       max="10" 
                       step="0.1" 
                       value="${campaign.newMultiplier || campaign.currentMultiplier || '1.0'}"
                       onchange="updateCampaignMultiplier('${campaign.id}', this.value)">
            </td>
            <td>
                <button onclick="applyCampaignMultiplier('${campaign.id}')">Apply</button>
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
        // Simulated API call - replace with actual endpoint
        const response = await fetch(`/api/campaigns/${campaignId}/multiplier`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ multiplier })
        });
        
        if (response.ok) {
            showMessage(`Multiplier ${multiplier}x applied to ${campaign.name}`, 'success');
            campaign.currentMultiplier = multiplier;
            displayCampaigns();
        } else {
            throw new Error('Failed to apply multiplier');
        }
    } catch (error) {
        showMessage(`Error applying multiplier: ${error.message}`, 'error');
    }
}

function applyBulkMultiplier() {
    const multiplier = parseFloat(document.getElementById('bulkMultiplier').value);
    
    if (isNaN(multiplier) || multiplier < 0.1 || multiplier > 10) {
        showMessage('Please enter a valid multiplier between 0.1 and 10', 'error');
        return;
    }
    
    CampaignManager.applyBulkMultiplier(multiplier);
    displayCampaigns();
    showMessage(`Bulk multiplier ${multiplier}x applied to all campaigns`, 'success');
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