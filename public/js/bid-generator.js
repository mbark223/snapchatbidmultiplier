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

// US States data
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

// DMAs data
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

// Store selected items
const selectedItems = {
    state: {},
    dma: {}
};

// Initialize dropdowns on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDropdowns();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDropdowns);
} else {
    // DOM is already loaded
    initializeDropdowns();
}

function initializeDropdowns() {
    try {
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
        
        console.log('Dropdowns initialized successfully');
    } catch (error) {
        console.error('Error initializing dropdowns:', error);
    }
}

function createOptionItem(type, code, displayName) {
    const div = document.createElement('div');
    div.className = 'option-item';
    div.innerHTML = `
        <label>
            <input type="checkbox" value="${code}" onchange="toggleSelection('${type}', '${code}', this.checked)">
            ${displayName}
        </label>
        <input type="number" id="${type}-${code}-multiplier" min="0.5" max="10" step="0.1" value="1.0" onchange="updateMultiplier('${type}', '${code}', this.value)">
    `;
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
        
        item.innerHTML = `
            ${displayName}
            <span class="remove" onclick="removeSelection('${type}', '${code}')">×</span>
        `;
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
            responseDiv.innerHTML = `
                ❌ <strong>Error!</strong> Failed to update bid multipliers.<br><br>
                <strong>Status:</strong> ${response.status}<br>
                <strong>Message:</strong> ${data.error || 'Unknown error'}<br>
                ${data.errors ? `<strong>Validation Errors:</strong><br><pre style="background: #f5f5f5; padding: 10px; border-radius: 3px;">${JSON.stringify(data.errors, null, 2)}</pre>` : ''}
            `;
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