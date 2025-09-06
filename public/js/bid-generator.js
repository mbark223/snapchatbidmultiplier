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
    
    // Gender multipliers
    const genderMultipliers = {};
    ['male', 'female', 'unknown'].forEach(gender => {
        const value = parseFloat(document.getElementById(`gender-${gender}`).value);
        if (value && value !== 1.0) {
            genderMultipliers[gender] = value;
        }
    });
    if (Object.keys(genderMultipliers).length > 0) {
        multipliers.gender = genderMultipliers;
    }

    // Age multipliers
    const ageMultipliers = {};
    const ageRanges = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    ageRanges.forEach(age => {
        const value = parseFloat(document.getElementById(`age-${age}`).value);
        if (value && value !== 1.0) {
            ageMultipliers[age] = value;
        }
    });
    if (Object.keys(ageMultipliers).length > 0) {
        multipliers.age = ageMultipliers;
    }

    // State multipliers
    const stateInput = document.getElementById('stateMultipliers').value;
    if (stateInput) {
        const stateMultipliers = {};
        stateInput.split(',').forEach(pair => {
            const [state, value] = pair.trim().split(':');
            if (state && value) {
                stateMultipliers[state.toUpperCase()] = parseFloat(value);
            }
        });
        if (Object.keys(stateMultipliers).length > 0) {
            multipliers.us_state = stateMultipliers;
        }
    }

    // DMA multipliers
    const dmaInput = document.getElementById('dmaMultipliers').value;
    if (dmaInput) {
        const dmaMultipliers = {};
        dmaInput.split(',').forEach(pair => {
            const [dma, value] = pair.trim().split(':');
            if (dma && value) {
                dmaMultipliers[dma] = parseFloat(value);
            }
        });
        if (Object.keys(dmaMultipliers).length > 0) {
            multipliers.dma = dmaMultipliers;
        }
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
        } else {
            input.value = '';
        }
    });
    
    // Hide output section
    document.getElementById('outputSection').style.display = 'none';
}

// Add Enter key support for generating code
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        generateCode();
    }
});