// Initialize selectedItems immediately
var selectedItems = {
    state: {},
    dma: {}
};

// OAuth token management
const TokenManager = {
    TOKEN_KEY: 'snapchat_jwt_token',
    TOKEN_EXPIRY_KEY: 'snapchat_jwt_expiry',
    
    saveToken(token, expiresIn) {
        localStorage.setItem(this.TOKEN_KEY, token);
        // Calculate expiry time (subtract 5 minutes for safety)
        const expiryTime = Date.now() + ((expiresIn - 300) * 1000);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    },
    
    getToken() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        
        if (!token || !expiry) return null;
        
        // Check if token is expired
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
    }
};

// US States data - defined early for global functions
const usStates = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia'
};
window.usStates = usStates;

// DMAs data will be loaded later
window.dmas = [];

// Immediately expose functions to global scope to support inline handlers
// This ensures compatibility while the HTML updates propagate
window.toggleDropdown = function(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('active');
    
    // Close other dropdowns
    document.querySelectorAll('.multiselect-dropdown').forEach(dd => {
        if (dd.id !== dropdownId) {
            dd.classList.remove('active');
        }
    });
};

window.toggleSelection = function(type, code, isChecked) {
    const multiplierInput = document.getElementById(`${type}-${code}-multiplier`);
    const multiplier = parseFloat(multiplierInput.value) || 1.0;
    
    if (isChecked) {
        selectedItems[type][code] = multiplier;
    } else {
        delete selectedItems[type][code];
    }
    
    updateSelectedDisplay(type);
};

window.filterOptions = function(type) {
    const searchInput = document.querySelector(`#${type}-dropdown .search-input`);
    const searchTerm = searchInput.value.toLowerCase();
    const options = document.querySelectorAll(`#${type}-options .option-item`);
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
};

window.selectAll = function(type) {
    const checkboxes = document.querySelectorAll(`#${type}-options input[type="checkbox"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        window.toggleSelection(type, checkbox.value, true);
    });
};

window.deselectAll = function(type) {
    const checkboxes = document.querySelectorAll(`#${type}-options input[type="checkbox"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        window.toggleSelection(type, checkbox.value, false);
    });
};

window.updateMultiplier = function(type, code, value) {
    const checkbox = document.querySelector(`input[type="checkbox"][value="${code}"]`);
    if (checkbox && checkbox.checked) {
        selectedItems[type][code] = parseFloat(value) || 1.0;
        updateSelectedDisplay(type);
    }
};

window.removeSelection = function(type, code) {
    delete selectedItems[type][code];
    const checkbox = document.querySelector(`#${type}-options input[type="checkbox"][value="${code}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    updateSelectedDisplay(type);
};

// Helper function needed by the above functions
function updateSelectedDisplay(type) {
    const container = document.getElementById(`selected-${type}s`);
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(selectedItems[type]).forEach(([code, multiplier]) => {
        const item = document.createElement('div');
        item.className = 'selected-item';
        
        let displayName = code;
        if (type === 'state') {
            const usStates = window.usStates || {};
            displayName = `${usStates[code] || code} (${code}): ${multiplier}`;
        } else {
            const dmas = window.dmas || [];
            const dma = dmas.find(d => d.code === code);
            displayName = `${dma ? dma.name : code}: ${multiplier}`;
        }
        
        item.textContent = displayName;
        const removeSpan = document.createElement('span');
        removeSpan.className = 'remove';
        removeSpan.textContent = '×';
        removeSpan.onclick = function() {
            window.removeSelection(type, code);
        };
        item.appendChild(removeSpan);
        container.appendChild(item);
    });
}

function generateCode() {
    try {
        const adSquadId = document.getElementById('adSquadId').value;
        const accessToken = document.getElementById('accessToken').value;
        const defaultMultiplier = parseFloat(document.getElementById('defaultMultiplier').value) || 1.0;

        if (!adSquadId || !accessToken) {
            alert('Please enter both Ad Squad ID and Access Token');
            return;
        }

    // Build multipliers object
    const multipliers = {};

    // State multipliers from multiselect
    if (Object.keys(selectedItems.state).length > 0) {
        multipliers.us_state = { ...selectedItems.state };
    }

    // DMA multipliers from multiselect
    if (Object.keys(selectedItems.dma).length > 0) {
        multipliers.dma = { ...selectedItems.dma };
    }

    // Generate request body
    const requestBody = {
        multipliers: multipliers,
        default_multiplier: defaultMultiplier
    };

    // Generate different code formats
    generateCurlCode(adSquadId, accessToken, requestBody);
    generateJavaScriptCode(adSquadId, accessToken, requestBody);
    generatePythonCode(adSquadId, accessToken, requestBody);
    generateRawJSON(requestBody);

    // Show output section
    document.getElementById('outputSection').style.display = 'block';
    } catch (error) {
        console.error('Error generating code:', error);
        alert('Error generating code. Check console for details.');
    }
}

function generateCurlCode(adSquadId, accessToken, requestBody) {
    const apiUrl = window.location.origin;
    const curl = `curl -X PUT '${apiUrl}/api/adsquads/${adSquadId}/bid-multipliers' \\
  -H 'Authorization: Bearer ${accessToken}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(requestBody, null, 2)}'`;
    
    document.getElementById('curlCode').textContent = curl;
}

function generateJavaScriptCode(adSquadId, accessToken, requestBody) {
    const apiUrl = window.location.origin;
    const jsCode = `// Using Fetch API
const updateBidMultipliers = async () => {
  const response = await fetch('${apiUrl}/api/adsquads/${adSquadId}/bid-multipliers', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ${accessToken}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(${JSON.stringify(requestBody, null, 2).split('\n').join('\n  ')})
  });
  
  const result = await response.json();
  console.log('Bid multipliers updated:', result);
};

// Call the function
updateBidMultipliers();`;
    
    document.getElementById('javascriptCode').textContent = jsCode;
}

function generatePythonCode(adSquadId, accessToken, requestBody) {
    const apiUrl = window.location.origin;
    const pythonCode = `import requests
import json

# API endpoint
url = f"${apiUrl}/api/adsquads/${adSquadId}/bid-multipliers"

# Headers
headers = {
    "Authorization": f"Bearer ${accessToken}",
    "Content-Type": "application/json"
}

# Request body
data = ${JSON.stringify(requestBody, null, 2).split('\n').join('\n    ')}

# Make the request
response = requests.put(url, headers=headers, json=data)

# Check response
if response.status_code == 200:
    print("Bid multipliers updated successfully")
    print(response.json())
else:
    print(f"Error: {response.status_code}")
    print(response.text)`;
    
    document.getElementById('pythonCode').textContent = pythonCode;
}

function generateRawJSON(requestBody) {
    document.getElementById('rawCode').textContent = JSON.stringify(requestBody, null, 2);
}

function showTab(tabName) {
    // Hide all outputs
    const outputs = ['curlOutput', 'javascriptOutput', 'pythonOutput', 'rawOutput'];
    outputs.forEach(output => {
        document.getElementById(output).style.display = 'none';
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected output and mark tab as active
    document.getElementById(tabName + 'Output').style.display = 'block';
    event.target.classList.add('active');
}

function copyCode(outputId) {
    const codeElement = document.getElementById(outputId).querySelector('pre');
    const textArea = document.createElement('textarea');
    textArea.value = codeElement.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // Show feedback
    const copyBtn = document.getElementById(outputId).querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

function clearAll() {
    // Clear all input fields
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        if (input.id === 'defaultMultiplier') {
            input.value = '1.0';
        } else if (!input.id.includes('-multiplier')) {
            input.value = '';
        }
    });
    
    // Clear multiselect selections
    selectedItems.state = {};
    selectedItems.dma = {};
    
    // Uncheck all checkboxes
    document.querySelectorAll('.multiselect-dropdown input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset all multiplier inputs to 1.0
    document.querySelectorAll('.multiselect-dropdown input[type="number"]').forEach(input => {
        input.value = '1.0';
    });
    
    // Update displays
    updateSelectedDisplay('state');
    updateSelectedDisplay('dma');
    
    // Hide output section
    document.getElementById('outputSection').style.display = 'none';
}

// Add Enter key support for generating code
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        generateCode();
    }
});

// DMAs data (usStates already defined above)
const dmas = [
    { code: 'DMA_501', name: 'New York', state: 'NY' },
    { code: 'DMA_803', name: 'Los Angeles', state: 'CA' },
    { code: 'DMA_602', name: 'Chicago', state: 'IL' },
    { code: 'DMA_504', name: 'Philadelphia', state: 'PA' },
    { code: 'DMA_623', name: 'Dallas-Ft. Worth', state: 'TX' },
    { code: 'DMA_807', name: 'San Francisco-Oak-San Jose', state: 'CA' },
    { code: 'DMA_511', name: 'Washington DC (Hagerstown)', state: 'DC' },
    { code: 'DMA_618', name: 'Houston', state: 'TX' },
    { code: 'DMA_506', name: 'Boston (Manchester)', state: 'MA' },
    { code: 'DMA_524', name: 'Atlanta', state: 'GA' },
    { code: 'DMA_753', name: 'Phoenix (Prescott)', state: 'AZ' },
    { code: 'DMA_505', name: 'Detroit', state: 'MI' },
    { code: 'DMA_613', name: 'Minneapolis-St. Paul', state: 'MN' },
    { code: 'DMA_528', name: 'Miami-Ft. Lauderdale', state: 'FL' },
    { code: 'DMA_534', name: 'Orlando-Daytona Beach-Melbourne', state: 'FL' },
    { code: 'DMA_539', name: 'Tampa-St Petersburg (Sarasota)', state: 'FL' },
    { code: 'DMA_510', name: 'Cleveland-Akron (Canton)', state: 'OH' },
    { code: 'DMA_819', name: 'Seattle-Tacoma', state: 'WA' },
    { code: 'DMA_820', name: 'Portland', state: 'OR' },
    { code: 'DMA_508', name: 'Pittsburgh', state: 'PA' },
    { code: 'DMA_527', name: 'Charlotte', state: 'NC' },
    { code: 'DMA_641', name: 'St. Louis', state: 'MO' },
    { code: 'DMA_609', name: 'Sacramento-Stockton-Modesto', state: 'CA' },
    { code: 'DMA_517', name: 'Baltimore', state: 'MD' },
    { code: 'DMA_560', name: 'Raleigh-Durham (Fayetteville)', state: 'NC' },
    { code: 'DMA_512', name: 'Cincinnati', state: 'OH' },
    { code: 'DMA_635', name: 'Austin', state: 'TX' },
    { code: 'DMA_616', name: 'Kansas City', state: 'MO' },
    { code: 'DMA_770', name: 'Salt Lake City', state: 'UT' },
    { code: 'DMA_853', name: 'San Diego', state: 'CA' },
    { code: 'DMA_839', name: 'Las Vegas', state: 'NV' }
];
// Make dmas globally available
window.dmas = dmas;

// Initialize dropdowns when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded - Initializing dropdowns');
        initializeDropdowns();
    });
} else {
    // DOM is already loaded
    console.log('DOM already loaded - Initializing dropdowns immediately');
    initializeDropdowns();
}

function initializeDropdowns() {
    try {
        console.log('Starting initializeDropdowns function');
        
        // Debug: Check if buttons exist
        const stateButton = document.querySelector('.multiselect-toggle[data-dropdown="state-dropdown"]');
        const dmaButton = document.querySelector('.multiselect-toggle[data-dropdown="dma-dropdown"]');
        console.log('State button found:', !!stateButton);
        console.log('DMA button found:', !!dmaButton);
        
        // Populate states
        const stateOptionsContainer = document.getElementById('state-options');
        if (!stateOptionsContainer) {
            console.error('State options container not found');
            return;
        }
        
        Object.entries(usStates).forEach(([code, name]) => {
            const optionDiv = createOptionItem('state', code, `${name} (${code})`);
            stateOptionsContainer.appendChild(optionDiv);
        });

        // Populate DMAs
        const dmaOptionsContainer = document.getElementById('dma-options');
        if (!dmaOptionsContainer) {
            console.error('DMA options container not found');
            return;
        }
        
        dmas.forEach(dma => {
            const optionDiv = createOptionItem('dma', dma.code, `${dma.name}, ${dma.state}`);
            dmaOptionsContainer.appendChild(optionDiv);
        });
        
        // Add event listeners for dropdown toggles
        document.querySelectorAll('.multiselect-toggle').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdownId = this.getAttribute('data-dropdown');
                toggleDropdown(dropdownId);
            });
        });
        
        // Add event listeners for search inputs
        document.querySelectorAll('.search-input').forEach(input => {
            input.addEventListener('keyup', function() {
                const type = this.getAttribute('data-type');
                filterOptions(type);
            });
        });
        
        // Add event listeners for select all/clear all buttons
        document.querySelectorAll('.select-all-container button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const type = this.getAttribute('data-type');
                const action = this.getAttribute('data-action');
                if (action === 'selectAll') {
                    selectAll(type);
                } else if (action === 'deselectAll') {
                    deselectAll(type);
                }
            });
        });
        
        // Add event listeners for main buttons
        const generateBtn = document.getElementById('generateCodeBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', generateCode);
        }
        
        const clearBtn = document.getElementById('clearAllBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAll);
        }
        
        const executeBtn = document.getElementById('executeApiBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', executeAPICall);
        }
        
        const testAuthBtn = document.getElementById('testAuthBtn');
        if (testAuthBtn) {
            testAuthBtn.addEventListener('click', testAuthentication);
        }
        
        // Add event listeners for tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                showTab(tabName);
            });
        });
        
        // Add event listeners for copy buttons
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                copyCode(targetId);
            });
        });
        
        // Initialize OAuth
        initializeOAuth();
        
        console.log('Dropdowns initialized successfully');
    } catch (error) {
        console.error('Error initializing dropdowns:', error);
    }
}

function createOptionItem(type, code, displayName) {
    const div = document.createElement('div');
    div.className = 'option-item';
    
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = code;
    checkbox.addEventListener('change', function() {
        window.toggleSelection(type, code, this.checked);
    });
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + displayName));
    
    const multiplierInput = document.createElement('input');
    multiplierInput.type = 'number';
    multiplierInput.id = `${type}-${code}-multiplier`;
    multiplierInput.min = '0.5';
    multiplierInput.max = '10';
    multiplierInput.step = '0.1';
    multiplierInput.value = '1.0';
    multiplierInput.addEventListener('change', function() {
        window.updateMultiplier(type, code, this.value);
    });
    
    div.appendChild(label);
    div.appendChild(multiplierInput);
    
    return div;
}

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('active');
    
    // Close other dropdowns
    document.querySelectorAll('.multiselect-dropdown').forEach(dd => {
        if (dd.id !== dropdownId) {
            dd.classList.remove('active');
        }
    });
}

function toggleSelection(type, code, isChecked) {
    const multiplierInput = document.getElementById(`${type}-${code}-multiplier`);
    const multiplier = parseFloat(multiplierInput.value) || 1.0;
    
    if (isChecked) {
        selectedItems[type][code] = multiplier;
    } else {
        delete selectedItems[type][code];
    }
    
    updateSelectedDisplay(type);
}

function updateMultiplier(type, code, value) {
    const checkbox = document.querySelector(`input[type="checkbox"][value="${code}"]`);
    if (checkbox && checkbox.checked) {
        selectedItems[type][code] = parseFloat(value) || 1.0;
        updateSelectedDisplay(type);
    }
}

function updateSelectedDisplay(type) {
    const container = document.getElementById(`selected-${type}s`);
    container.innerHTML = '';
    
    Object.entries(selectedItems[type]).forEach(([code, multiplier]) => {
        const item = document.createElement('div');
        item.className = 'selected-item';
        
        let displayName = code;
        if (type === 'state') {
            displayName = `${usStates[code]} (${code}): ${multiplier}`;
        } else {
            const dma = dmas.find(d => d.code === code);
            displayName = `${dma ? dma.name : code}: ${multiplier}`;
        }
        
        item.textContent = displayName;
        const removeSpan = document.createElement('span');
        removeSpan.className = 'remove';
        removeSpan.textContent = '×';
        removeSpan.addEventListener('click', function() {
            removeSelection(type, code);
        });
        item.appendChild(removeSpan);
        container.appendChild(item);
    });
}

function removeSelection(type, code) {
    delete selectedItems[type][code];
    const checkbox = document.querySelector(`#${type}-options input[type="checkbox"][value="${code}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    updateSelectedDisplay(type);
}

function filterOptions(type) {
    const searchInput = document.querySelector(`#${type}-dropdown .search-input`);
    const searchTerm = searchInput.value.toLowerCase();
    const options = document.querySelectorAll(`#${type}-options .option-item`);
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

function selectAll(type) {
    const checkboxes = document.querySelectorAll(`#${type}-options input[type="checkbox"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        toggleSelection(type, checkbox.value, true);
    });
}

function deselectAll(type) {
    const checkboxes = document.querySelectorAll(`#${type}-options input[type="checkbox"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        toggleSelection(type, checkbox.value, false);
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.multiselect-container')) {
        document.querySelectorAll('.multiselect-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Make functions available globally for onclick handlers
window.toggleDropdown = toggleDropdown;
window.toggleSelection = toggleSelection;
window.updateMultiplier = updateMultiplier;
window.removeSelection = removeSelection;
window.filterOptions = filterOptions;
window.selectAll = selectAll;
window.deselectAll = deselectAll;
window.generateCode = generateCode;
window.clearAll = clearAll;
window.showTab = showTab;
window.copyCode = copyCode;

// Store the last generated request data
let lastGeneratedRequest = null;

// Function to execute the API call
function executeAPICall() {
    if (!lastGeneratedRequest) {
        alert('Please generate API code first');
        return;
    }

    const { adSquadId, accessToken, requestBody } = lastGeneratedRequest;
    const apiUrl = window.location.origin;
    const responseDiv = document.getElementById('apiResponse');
    
    // Show loading state
    responseDiv.style.display = 'block';
    responseDiv.style.background = '#e3f2fd';
    responseDiv.style.border = '1px solid #2196f3';
    responseDiv.style.color = '#1565c0';
    responseDiv.innerHTML = '⏳ Executing API call...';
    
    fetch(`${apiUrl}/api/adsquads/${adSquadId}/bid-multipliers`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(async response => {
        const data = await response.json();
        
        if (response.ok) {
            // Success
            responseDiv.style.background = '#e8f5e9';
            responseDiv.style.border = '1px solid #4caf50';
            responseDiv.style.color = '#2e7d32';
            responseDiv.innerHTML = `
                ✅ <strong>Success!</strong> Bid multipliers updated successfully.<br><br>
                <strong>Response:</strong><br>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
            `;
        } else {
            // Error
            responseDiv.style.background = '#ffebee';
            responseDiv.style.border = '1px solid #f44336';
            responseDiv.style.color = '#c62828';
            
            let errorMessage = `❌ <strong>Error!</strong> Failed to update bid multipliers.<br><br>`;
            
            if (response.status === 401 || response.status === 500) {
                errorMessage += `
                    <strong>OAuth Not Configured</strong><br>
                    The "Execute API Call" feature requires OAuth setup which is not currently configured.<br><br>
                    <strong>Recommended Solution:</strong><br>
                    1. Copy the generated cURL, JavaScript, or Python code above<br>
                    2. Run it directly with your Snapchat API access token<br>
                    3. This will update your bid multipliers successfully<br><br>
                    <em>Note: The Execute API Call button is for convenience only - the generated code works perfectly!</em><br><br>
                `;
            }
            
            errorMessage += `<strong>Status:</strong> ${response.status}<br>
                <strong>Message:</strong> ${data.error || 'Unknown error'}<br>
                ${data.errors ? `<strong>Validation Errors:</strong><br><pre style="background: #f5f5f5; padding: 10px; border-radius: 3px;">${JSON.stringify(data.errors, null, 2)}</pre>` : ''}
            `;
            
            responseDiv.innerHTML = errorMessage;
        }
    })
    .catch(error => {
        // Network error
        responseDiv.style.background = '#ffebee';
        responseDiv.style.border = '1px solid #f44336';
        responseDiv.style.color = '#c62828';
        responseDiv.innerHTML = `
            ❌ <strong>Network Error!</strong><br><br>
            <strong>Message:</strong> ${error.message}<br>
            Please check your connection and try again.
        `;
    });
}

// Update the generateCode function to store the request data
const originalGenerateCode = window.generateCode;
window.generateCode = function() {
    try {
        const adSquadId = document.getElementById('adSquadId').value;
        const accessToken = document.getElementById('accessToken').value;
        const defaultMultiplier = parseFloat(document.getElementById('defaultMultiplier').value) || 1.0;

        if (!adSquadId || !accessToken) {
            alert('Please enter both Ad Squad ID and Access Token');
            return;
        }

        // Build multipliers object
        const multipliers = {};

        // State multipliers from multiselect
        if (Object.keys(selectedItems.state).length > 0) {
            multipliers.us_state = { ...selectedItems.state };
        }

        // DMA multipliers from multiselect
        if (Object.keys(selectedItems.dma).length > 0) {
            multipliers.dma = { ...selectedItems.dma };
        }

        // Generate request body
        const requestBody = {
            multipliers: multipliers,
            default_multiplier: defaultMultiplier
        };

        // Store the request data
        lastGeneratedRequest = { adSquadId, accessToken, requestBody };

        // Call the original generateCode function
        originalGenerateCode();
        
        // Reset the API response display
        const responseDiv = document.getElementById('apiResponse');
        responseDiv.style.display = 'none';
    } catch (error) {
        console.error('Error in custom generateCode:', error);
        alert('Error generating code. Check console for details.');
    }
};

window.executeAPICall = executeAPICall;
window.initiateOAuthFlow = initiateOAuthFlow;

// Test authentication function
function testAuthentication() {
    const accessToken = document.getElementById('accessToken').value;
    
    if (!accessToken) {
        alert('Please enter an access token first');
        return;
    }
    
    const apiUrl = window.location.origin;
    console.log('Testing authentication...');
    
    // First test without auth
    fetch(`${apiUrl}/debug/auth`)
        .then(response => response.json())
        .then(data => {
            console.log('Debug endpoint (no auth):', data);
        });
    
    // Then test with auth header
    fetch(`${apiUrl}/debug/auth`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Debug endpoint (with auth):', data);
        alert(`Auth Header Debug:\n\nReceived: ${data.hasAuthHeader ? 'Yes' : 'No'}\nStarts with Bearer: ${data.startsWithBearer}\nToken Length: ${data.tokenLength}\nHas JWT_SECRET: ${data.hasJwtSecret}\nToken starts with: ${data.tokenStartsWith}`);
        
        // Now test actual auth middleware
        return fetch(`${apiUrl}/debug/test-auth`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    })
    .then(response => {
        console.log('Auth test response:', response);
        if (!response.ok) {
            throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Auth test success:', data);
        alert('Authentication successful! User: ' + JSON.stringify(data.user));
        
        // Test Snapchat API connection
        return fetch(`${apiUrl}/debug/test-snapchat`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    })
    .then(response => response.json())
    .then(data => {
        console.log('Snapchat API test:', data);
        if (data.success) {
            alert(`Snapchat API Test Success!\n\nConnected successfully\nAd Accounts found: ${data.adAccountsCount}`);
        } else {
            alert(`Snapchat API Test Failed!\n\nError: ${JSON.stringify(data.error)}\nStatus: ${data.status}\n\nThis indicates your token might be expired or invalid.`);
        }
    })
    .catch(error => {
        console.error('Auth test error:', error);
        alert('Auth middleware test failed: ' + error.message);
    });
}

window.testAuthentication = testAuthentication;

// OAuth Functions
function initializeOAuth() {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expiresIn = urlParams.get('expires_in');
    
    if (token && expiresIn) {
        // Save token and redirect to clean URL
        TokenManager.saveToken(token, parseInt(expiresIn));
        window.history.replaceState({}, document.title, window.location.pathname);
        showAuthSuccess();
    }
    
    // Update UI based on auth status
    updateAuthUI();
    
    // Set up login link
    const loginLink = document.getElementById('oauthLoginLink');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            initiateOAuthFlow();
        });
    }
    
    // Set up logout link
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Check token validity periodically
    setInterval(updateAuthUI, 30000); // Every 30 seconds
}

function updateAuthUI() {
    const authStatus = document.getElementById('authStatus');
    const accessTokenInput = document.getElementById('accessToken');
    const executeBtn = document.getElementById('executeApiBtn');
    
    if (TokenManager.isAuthenticated()) {
        if (authStatus) authStatus.style.display = 'inline';
        if (accessTokenInput) {
            accessTokenInput.placeholder = 'Using OAuth authentication';
            accessTokenInput.disabled = true;
        }
        if (executeBtn) {
            executeBtn.textContent = 'Execute API Call (Authenticated)';
            executeBtn.style.background = '#4caf50';
        }
    } else {
        if (authStatus) authStatus.style.display = 'none';
        if (accessTokenInput) {
            accessTokenInput.placeholder = 'Enter your Snapchat API Access Token';
            accessTokenInput.disabled = false;
        }
        if (executeBtn) {
            executeBtn.textContent = 'Execute API Call';
            executeBtn.style.background = '#27ae60';
        }
    }
}

function initiateOAuthFlow() {
    // First, check if OAuth is configured
    fetch('/api/auth/login')
        .then(response => response.json())
        .then(data => {
            if (data.auth_url) {
                // Redirect to Snapchat OAuth
                window.location.href = data.auth_url;
            } else {
                alert('OAuth is not configured on this server. Please use Option 1 with your access token.');
            }
        })
        .catch(error => {
            console.error('OAuth error:', error);
            alert('Unable to start OAuth flow. Please use Option 1 with your access token.');
        });
}

function showAuthSuccess() {
    const responseDiv = document.getElementById('apiResponse');
    if (responseDiv) {
        responseDiv.style.display = 'block';
        responseDiv.style.background = '#e8f5e9';
        responseDiv.style.border = '1px solid #4caf50';
        responseDiv.style.color = '#2e7d32';
        responseDiv.innerHTML = '✅ <strong>Successfully authenticated with Snapchat!</strong> You can now use the Execute API Call button.';
        
        // Hide after 5 seconds
        setTimeout(() => {
            responseDiv.style.display = 'none';
        }, 5000);
    }
}

function logout() {
    TokenManager.clearToken();
    updateAuthUI();
    
    const responseDiv = document.getElementById('apiResponse');
    if (responseDiv) {
        responseDiv.style.display = 'block';
        responseDiv.style.background = '#fff3cd';
        responseDiv.style.border = '1px solid #ffc107';
        responseDiv.style.color = '#856404';
        responseDiv.innerHTML = '👋 <strong>Logged out successfully.</strong> You can still generate code or login again to use Execute API Call.';
        
        // Hide after 3 seconds
        setTimeout(() => {
            responseDiv.style.display = 'none';
        }, 3000);
    }
}

// Update executeAPICall to use OAuth token if available
const originalExecuteAPICall = executeAPICall;
executeAPICall = function() {
    if (!lastGeneratedRequest) {
        alert('Please generate API code first');
        return;
    }

    const { adSquadId, accessToken, requestBody } = lastGeneratedRequest;
    const apiUrl = window.location.origin;
    const responseDiv = document.getElementById('apiResponse');
    
    // Check if we have an OAuth token
    const jwtToken = TokenManager.getToken();
    const authToken = jwtToken || accessToken;
    const isOAuth = !!jwtToken;
    
    if (!authToken) {
        alert('Please either login with Snapchat or enter an access token');
        return;
    }
    
    // Show loading state
    responseDiv.style.display = 'block';
    responseDiv.style.background = '#e3f2fd';
    responseDiv.style.border = '1px solid #2196f3';
    responseDiv.style.color = '#1565c0';
    responseDiv.innerHTML = '⏳ Executing API call' + (isOAuth ? ' with OAuth authentication' : '') + '...';
    
    fetch(`${apiUrl}/api/adsquads/${adSquadId}/bid-multipliers`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(async response => {
        const data = await response.json();
        
        if (response.ok) {
            // Success
            responseDiv.style.background = '#e8f5e9';
            responseDiv.style.border = '1px solid #4caf50';
            responseDiv.style.color = '#2e7d32';
            responseDiv.innerHTML = `
                ✅ <strong>Success!</strong> Bid multipliers updated successfully.<br><br>
                <strong>Response:</strong><br>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
            `;
        } else {
            // Error
            responseDiv.style.background = '#ffebee';
            responseDiv.style.border = '1px solid #f44336';
            responseDiv.style.color = '#c62828';
            
            let errorMessage = `❌ <strong>Error!</strong> Failed to update bid multipliers.<br><br>`;
            
            if (response.status === 401 && !isOAuth) {
                errorMessage += `
                    <strong>Authentication Failed</strong><br>
                    Your access token may be invalid or expired.<br><br>
                    <strong>Options:</strong><br>
                    1. <a href="#" onclick="initiateOAuthFlow(); return false;" style="color: #c62828; text-decoration: underline;">Login with Snapchat</a> for automatic authentication<br>
                    2. Get a fresh access token from Snapchat and try again<br><br>
                `;
            } else if (response.status === 401 && isOAuth) {
                // OAuth token expired
                TokenManager.clearToken();
                updateAuthUI();
                errorMessage += `
                    <strong>Session Expired</strong><br>
                    Your authentication session has expired.<br>
                    <a href="#" onclick="initiateOAuthFlow(); return false;" style="color: #c62828; text-decoration: underline;">Login again</a><br><br>
                `;
            }
            
            errorMessage += `<strong>Status:</strong> ${response.status}<br>
                <strong>Message:</strong> ${data.error || 'Unknown error'}<br>
                ${data.errors ? `<strong>Validation Errors:</strong><br><pre style="background: #f5f5f5; padding: 10px; border-radius: 3px;">${JSON.stringify(data.errors, null, 2)}</pre>` : ''}
            `;
            
            responseDiv.innerHTML = errorMessage;
        }
    })
    .catch(error => {
        // Network error
        responseDiv.style.background = '#ffebee';
        responseDiv.style.border = '1px solid #f44336';
        responseDiv.style.color = '#c62828';
        responseDiv.innerHTML = `
            ❌ <strong>Network Error!</strong><br><br>
            Failed to connect to the API server.<br>
            <strong>Error:</strong> ${error.message}
        `;
    });
};