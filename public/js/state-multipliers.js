// State Multiplier Manager
const StateMultiplierManager = {
    // US States data
    US_STATES: {
        'AL': 'Alabama',
        'AK': 'Alaska',
        'AZ': 'Arizona',
        'AR': 'Arkansas',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DE': 'Delaware',
        'DC': 'District of Columbia',
        'FL': 'Florida',
        'GA': 'Georgia',
        'HI': 'Hawaii',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'IA': 'Iowa',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'ME': 'Maine',
        'MD': 'Maryland',
        'MA': 'Massachusetts',
        'MI': 'Michigan',
        'MN': 'Minnesota',
        'MS': 'Mississippi',
        'MO': 'Missouri',
        'MT': 'Montana',
        'NE': 'Nebraska',
        'NV': 'Nevada',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NY': 'New York',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'OR': 'Oregon',
        'PA': 'Pennsylvania',
        'RI': 'Rhode Island',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'TX': 'Texas',
        'UT': 'Utah',
        'VT': 'Vermont',
        'VA': 'Virginia',
        'WA': 'Washington',
        'WV': 'West Virginia',
        'WI': 'Wisconsin',
        'WY': 'Wyoming'
    },

    // State groupings for quick selection
    STATE_GROUPS: {
        'high_value': {
            name: 'High-Value States',
            states: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
            defaultMultiplier: 1.0
        },
        'coastal': {
            name: 'Coastal States',
            states: ['CA', 'OR', 'WA', 'FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME'],
            defaultMultiplier: 0.95
        },
        'midwest': {
            name: 'Midwest States',
            states: ['IL', 'IN', 'MI', 'OH', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
            defaultMultiplier: 0.85
        },
        'south': {
            name: 'Southern States',
            states: ['TX', 'FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'AL', 'MS', 'AR', 'LA', 'KY', 'WV'],
            defaultMultiplier: 0.9
        },
        'west': {
            name: 'Western States',
            states: ['CA', 'OR', 'WA', 'NV', 'ID', 'UT', 'AZ', 'NM', 'CO', 'WY', 'MT'],
            defaultMultiplier: 0.9
        }
    },

    // Current state multipliers for active campaign
    currentMultipliers: {},
    activeCampaignId: null,
    currentDefaultMultiplier: 1.0,

    // Initialize state multipliers for a campaign
    initializeForCampaign(campaignId, existingMultipliers = {}, defaultMultiplier = 1.0) {
        this.activeCampaignId = campaignId;
        this.currentMultipliers = { ...existingMultipliers };
        this.currentDefaultMultiplier = (
            typeof defaultMultiplier === 'number' && !isNaN(defaultMultiplier)
        ) ? defaultMultiplier : 1.0;
    },

    setDefaultMultiplier(value = 1.0) {
        this.currentDefaultMultiplier = (
            typeof value === 'number' && !isNaN(value)
        ) ? value : 1.0;

        const input = document.getElementById('defaultStateMultiplier');
        if (input) {
            input.value = this.currentDefaultMultiplier.toString();
        }
    },

    // Set multiplier for a state
    setStateMultiplier(stateCode, multiplier) {
        if (!this.US_STATES[stateCode]) {
            throw new Error(`Invalid state code: ${stateCode}`);
        }
        
        if (multiplier < 0.1 || multiplier > 1.0) {
            throw new Error('Multiplier must be between 0.1 and 1.0');
        }

        this.currentMultipliers[stateCode] = multiplier;
    },

    // Remove multiplier for a state (will use default)
    removeStateMultiplier(stateCode) {
        delete this.currentMultipliers[stateCode];
    },

    // Apply a preset group
    applyPresetGroup(groupKey, overrideMultiplier = null) {
        const group = this.STATE_GROUPS[groupKey];
        if (!group) {
            throw new Error(`Invalid group key: ${groupKey}`);
        }

        const multiplier = overrideMultiplier || group.defaultMultiplier;
        group.states.forEach(state => {
            this.setStateMultiplier(state, multiplier);
        });
    },

    // Get all current multipliers
    getCurrentMultipliers() {
        return { ...this.currentMultipliers };
    },

    // Clear all multipliers
    clearAllMultipliers() {
        this.currentMultipliers = {};
    },

    // Export configuration
    exportConfiguration() {
        return JSON.stringify({
            campaignId: this.activeCampaignId,
            multipliers: this.currentMultipliers,
            exportDate: new Date().toISOString()
        }, null, 2);
    },

    // Import configuration
    importConfiguration(jsonString) {
        try {
            const config = JSON.parse(jsonString);
            if (config.multipliers) {
                this.currentMultipliers = config.multipliers;
                return true;
            }
            throw new Error('Invalid configuration format');
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    },

    // Create the modal HTML
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'stateMultiplierModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Configure State Multipliers</h2>
                    <span class="close" onclick="StateMultiplierManager.closeModal()">&times;</span>
                </div>
                
                <div class="modal-body">
                    <div class="state-controls">
                        <div class="preset-groups">
                            <h3>Quick Presets</h3>
                            <div class="button-group">
                                ${Object.entries(this.STATE_GROUPS).map(([key, group]) => 
                                    `<button onclick="StateMultiplierManager.applyPresetFromUI('${key}')" class="preset-btn">${group.name}</button>`
                                ).join('')}
                                <button onclick="StateMultiplierManager.clearAllFromUI()" class="danger">Clear All</button>
                            </div>
                        </div>

                        <div class="default-multiplier-section">
                            <label for="defaultStateMultiplier">Default Multiplier (for unspecified states):</label>
                            <input type="number" id="defaultStateMultiplier" min="0.1" max="1.0" step="0.05" value="1.0">
                        </div>

                        <div class="states-grid" id="statesGrid">
                            <!-- States will be populated here -->
                        </div>

                        <div class="import-export">
                            <button onclick="StateMultiplierManager.exportToClipboard()">Export Configuration</button>
                            <button onclick="StateMultiplierManager.showImportDialog()">Import Configuration</button>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button onclick="StateMultiplierManager.saveStateMultipliers()" class="success">Apply State Multipliers</button>
                    <button onclick="StateMultiplierManager.closeModal()" class="secondary">Cancel</button>
                </div>
            </div>

            <style>
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                }

                .modal-content {
                    background-color: #fefefe;
                    margin: 5% auto;
                    padding: 0;
                    border-radius: 8px;
                    width: 80%;
                    max-width: 800px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                }

                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-body {
                    padding: 20px;
                    overflow-y: auto;
                    flex-grow: 1;
                }

                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #ddd;
                    text-align: right;
                }

                .close {
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .close:hover {
                    color: #f44336;
                }

                .preset-groups {
                    margin-bottom: 20px;
                }

                .preset-btn {
                    margin: 5px;
                    padding: 8px 16px;
                    font-size: 14px;
                }

                .default-multiplier-section {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 4px;
                }

                .states-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 10px;
                    margin: 20px 0;
                }

                .state-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                }

                .state-item.active {
                    background: #e3f2fd;
                    border-color: #2196f3;
                }

                .state-item input[type="checkbox"] {
                    margin-right: 10px;
                }

                .state-item label {
                    flex-grow: 1;
                    cursor: pointer;
                }

                .state-item input[type="number"] {
                    width: 60px;
                    margin-left: 10px;
                }

                .import-export {
                    margin-top: 20px;
                    text-align: center;
                }
            </style>
        `;

        return modal;
    },

    // Show the modal
    showModal(campaignId, existingMultipliers = {}, defaultMultiplier = 1.0) {
        this.initializeForCampaign(campaignId, existingMultipliers, defaultMultiplier);
        
        let modal = document.getElementById('stateMultiplierModal');
        if (!modal) {
            modal = this.createModal();
            document.body.appendChild(modal);
        }

        this.populateStatesGrid();
        this.setDefaultMultiplier(this.currentDefaultMultiplier);
        modal.style.display = 'block';
    },

    // Close the modal
    closeModal() {
        const modal = document.getElementById('stateMultiplierModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    // Populate the states grid
    populateStatesGrid() {
        const grid = document.getElementById('statesGrid');
        grid.innerHTML = '';

        Object.entries(this.US_STATES).forEach(([code, name]) => {
            const isActive = code in this.currentMultipliers;
            const multiplier = this.currentMultipliers[code] || 1.0;

            const stateDiv = document.createElement('div');
            stateDiv.className = `state-item ${isActive ? 'active' : ''}`;
            stateDiv.innerHTML = `
                <input type="checkbox" id="state_${code}" ${isActive ? 'checked' : ''} 
                       onchange="StateMultiplierManager.toggleState('${code}', this.checked)">
                <label for="state_${code}">${code} - ${name}</label>
                <input type="number" id="mult_${code}" min="0.1" max="1.0" step="0.05" 
                       value="${multiplier}" ${!isActive ? 'disabled' : ''}
                       onchange="StateMultiplierManager.updateMultiplier('${code}', this.value)">
            `;

            grid.appendChild(stateDiv);
        });
    },

    // Toggle state selection
    toggleState(stateCode, isChecked) {
        const multiplierInput = document.getElementById(`mult_${stateCode}`);
        const stateItem = multiplierInput.closest('.state-item');
        
        if (isChecked) {
            this.setStateMultiplier(stateCode, parseFloat(multiplierInput.value));
            multiplierInput.disabled = false;
            stateItem.classList.add('active');
        } else {
            this.removeStateMultiplier(stateCode);
            multiplierInput.disabled = true;
            stateItem.classList.remove('active');
        }
    },

    // Update multiplier value
    updateMultiplier(stateCode, value) {
        const multiplier = parseFloat(value);
        if (multiplier >= 0.1 && multiplier <= 1.0) {
            this.setStateMultiplier(stateCode, multiplier);
        }
    },

    // Apply preset from UI
    applyPresetFromUI(groupKey) {
        this.applyPresetGroup(groupKey);
        this.populateStatesGrid();
        showMessage(`Applied ${this.STATE_GROUPS[groupKey].name} preset`, 'success');
    },

    // Clear all from UI
    clearAllFromUI() {
        this.clearAllMultipliers();
        this.populateStatesGrid();
        showMessage('Cleared all state multipliers', 'info');
    },

    // Export to clipboard
    exportToClipboard() {
        const config = this.exportConfiguration();
        navigator.clipboard.writeText(config).then(() => {
            showMessage('Configuration exported to clipboard', 'success');
        });
    },

    // Show import dialog
    showImportDialog() {
        const json = prompt('Paste your state multiplier configuration:');
        if (json) {
            if (this.importConfiguration(json)) {
                this.populateStatesGrid();
                showMessage('Configuration imported successfully', 'success');
            } else {
                showMessage('Invalid configuration format', 'error');
            }
        }
    },

    // Save state multipliers
    async saveStateMultipliers() {
        const defaultMultiplier = parseFloat(document.getElementById('defaultStateMultiplier').value);
        
        if (Object.keys(this.currentMultipliers).length === 0) {
            showMessage('Please select at least one state', 'error');
            return;
        }

        try {
            // Update the campaign with state multipliers
            const success = await updateCampaignStateMultipliers(
                this.activeCampaignId, 
                this.currentMultipliers, 
                defaultMultiplier
            );

            if (success) {
                showMessage('State multipliers applied successfully', 'success');
                this.closeModal();
                
                // Update the campaign display to show state multipliers are active
                const campaign = CampaignManager.getCampaigns().find(c => c.id === this.activeCampaignId);
                if (campaign) {
                    campaign.hasStateMultipliers = true;
                    campaign.stateMultipliers = this.currentMultipliers;
                    campaign.defaultStateMultiplier = defaultMultiplier;
                    displayCampaigns();
                }
            }
        } catch (error) {
            showMessage(`Error applying state multipliers: ${error.message}`, 'error');
        }
    }
};
