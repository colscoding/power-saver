// Strava Integration Configuration
// Client ID is now configurable from the web interface and stored in browser
// SECURITY: This uses OAuth implicit flow - secure for client-side apps
// No client secret needed (and shouldn't be in frontend code!)
// For production apps, consider using a backend proxy for enhanced security

// Get Strava Client ID from localStorage or return null if not configured
function getStravaClientId() {
    return localStorage.getItem('stravaClientId');
}

// Set Strava Client ID in localStorage
function setStravaClientId(clientId) {
    localStorage.setItem('stravaClientId', clientId);
}

// Show Strava configuration dialog
function showStravaConfigDialog() {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'modal strava-config-modal';

        modal.innerHTML = `
            <h3>🚴 Configure Strava Integration</h3>
            <div class="config-instructions">
                <p><strong>To enable Strava sync functionality:</strong></p>
                <ol>
                    <li>Go to <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener">https://www.strava.com/settings/api</a></li>
                    <li>Click "Create & Manage Your App"</li>
                    <li>Fill in the required information:
                        <ul>
                            <li><strong>Application Name:</strong> Your app name (e.g., "Power Meter")</li>
                            <li><strong>Category:</strong> Choose appropriate category</li>
                            <li><strong>Website:</strong> Your website URL</li>
                            <li><strong>Authorization Callback Domain:</strong> <code>${window.location.hostname}</code></li>
                        </ul>
                    </li>
                    <li>After creating the app, copy your <strong>Client ID</strong> and paste it below</li>
                </ol>
            </div>
            <div class="config-input">
                <label for="clientIdInput">Strava Client ID:</label>
                <input type="text" id="clientIdInput" placeholder="Enter your Strava Client ID" />
                <div class="input-hint">This will be stored securely in your browser</div>
            </div>
            <div class="modal-buttons">
                <button id="cancelConfig" class="modal-button secondary">Cancel</button>
                <button id="saveConfig" class="modal-button primary">Save & Connect</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const clientIdInput = modal.querySelector('#clientIdInput');
        const saveButton = modal.querySelector('#saveConfig');
        const cancelButton = modal.querySelector('#cancelConfig');

        // Focus on input
        clientIdInput.focus();

        // Handle save button
        saveButton.addEventListener('click', () => {
            const clientId = clientIdInput.value.trim();
            if (!clientId) {
                alert('Please enter a valid Client ID');
                return;
            }

            // Validate that it looks like a client ID (should be numeric)
            if (!/^\d+$/.test(clientId)) {
                alert('Client ID should be a numeric value');
                return;
            }

            setStravaClientId(clientId);
            document.body.removeChild(backdrop);
            resolve(clientId);
        });

        // Handle cancel button
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(backdrop);
            resolve(null);
        });

        // Handle Enter key in input
        clientIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveButton.click();
            }
        });

        // Handle Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escapeHandler);
                document.body.removeChild(backdrop);
                resolve(null);
            }
        });

        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                document.body.removeChild(backdrop);
                resolve(null);
            }
        });
    });
}

// Screen Wake Lock
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                // Wake lock was released
            });
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

// Currently unused but may be needed for future functionality
// eslint-disable-next-line no-unused-vars
async function releaseWakeLock() {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
}

// TCX Generation Functions
/**
 * Creates a trackpoint XML element for a single data point
 * @param {Object} dataPoint - Data point with time, power, heartRate, cadence
 * @returns {string} XML trackpoint string
 */
function createTrackpoint(dataPoint) {
    const translations = {
        time: time => `<Time>${new Date(time).toISOString()}</Time>`,
        heartRate: hr => `
<HeartRateBpm>
  <Value>${hr}</Value>
</HeartRateBpm>
            `.trim(),
        cadence: cad => `<Cadence>${cad}</Cadence>`,
        power: pw => `
<Extensions>
  <ns2:TPX>
    <ns2:Watts>${pw}</ns2:Watts>
  </ns2:TPX>
</Extensions>
            `.trim(),
    }
    const contents = Object.keys(translations).map(key => {
        if (dataPoint[key] === undefined) return '';
        return translations[key](dataPoint[key])
    }).filter(x => x).join('\n');

    return `
<Trackpoint>
  ${contents}
</Trackpoint>
`.trim();
}

/**
 * Generates TCX XML string from power data for cycling activities
 * @param {Array<Object>} powerData - Array of power measurement objects
 * @returns {string} Complete TCX XML string
 */
function generateTcxString(powerData) {
    // Validate input data
    if (!Array.isArray(powerData) || powerData.length === 0) {
        throw new Error("Input power data array is empty or invalid");
    }

    // Filter and normalize data
    const validDataPoints = powerData.filter(dataPoint =>
        dataPoint &&
        typeof dataPoint === 'object' &&
        dataPoint.timestamp !== undefined &&
        !isNaN(new Date(dataPoint.timestamp).getTime())
    );

    if (validDataPoints.length === 0) {
        throw new Error("No valid data points found");
    }

    // Transform data
    const normalizeDataPoint = (item) => ({
        time: item.timestamp,
        ...(item.power !== undefined && { power: item.power }),
        ...(item.heartRate !== undefined && { heartRate: item.heartRate }),
        ...(item.cadence !== undefined && { cadence: item.cadence })
    });

    // Process data
    let processedData = validDataPoints
        .map(normalizeDataPoint)
        .sort((a, b) => a.time - b.time);

    // Remove leading/trailing entries without power
    const isEmptyPower = (dataPoint) => !dataPoint.power || dataPoint.power <= 0;
    while (processedData.length > 0 && isEmptyPower(processedData[0])) {
        processedData.shift();
    }
    while (processedData.length > 0 && isEmptyPower(processedData[processedData.length - 1])) {
        processedData.pop();
    }

    if (processedData.length === 0) {
        throw new Error("No valid power data found after processing");
    }

    // Calculate exercise statistics
    const validPowerReadings = processedData.filter(d => d.power && d.power > 0).map(d => parseFloat(d.power));
    const avgPower = validPowerReadings.length > 0 ? Math.round(validPowerReadings.reduce((a, b) => a + b, 0) / validPowerReadings.length) : 0;
    const maxPower = validPowerReadings.length > 0 ? Math.max(...validPowerReadings) : 0;

    const startTime = processedData[0].time;
    const endTime = processedData[processedData.length - 1].time;
    const duration = Math.round((endTime - startTime) / 1000 / 60); // duration in minutes

    // Generate activity notes with exercise description and power averages
    const exerciseDescription = "Indoor cycling session recorded with Power Saver app.";

    let powerAveragesText = "";
    if (typeof powerAverages !== 'undefined' && powerAverages) {
        const averagesList = [];

        if (powerAverages['10s'] && powerAverages['10s'].best > 0) {
            averagesList.push(`10s: ${powerAverages['10s'].best}W`);
        }
        if (powerAverages['30s'] && powerAverages['30s'].best > 0) {
            averagesList.push(`30s: ${powerAverages['30s'].best}W`);
        }
        if (powerAverages['1m'] && powerAverages['1m'].best > 0) {
            averagesList.push(`1min: ${powerAverages['1m'].best}W`);
        }
        if (powerAverages['2m'] && powerAverages['2m'].best > 0) {
            averagesList.push(`2min: ${powerAverages['2m'].best}W`);
        }
        if (powerAverages['4m'] && powerAverages['4m'].best > 0) {
            averagesList.push(`4min: ${powerAverages['4m'].best}W`);
        }
        if (powerAverages['8m'] && powerAverages['8m'].best > 0) {
            averagesList.push(`8min: ${powerAverages['8m'].best}W`);
        }

        if (averagesList.length > 0) {
            powerAveragesText = `\n\nBest Power Averages: ${averagesList.join(', ')}`;
        }
    }

    const sessionStats = `\nSession Stats: Duration: ${duration} min, Avg Power: ${avgPower}W, Max Power: ${maxPower}W`;
    const activityNotes = exerciseDescription + sessionStats + powerAveragesText;

    // Helper function to escape XML special characters
    const escapeXml = (text) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    // Generate XML
    const trackpoints = processedData.map(createTrackpoint).join('\n');
    const startTimeISO = new Date(startTime).toISOString();

    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns2="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${startTimeISO}</Id>
      <Name>E Bike Indoor Cycling Trainer</Name>
      <Notes>${escapeXml(activityNotes)}</Notes>
      <Lap StartTime="${startTimeISO}">
        <Track>
        ${trackpoints}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

    return rawXml;
}

// Data Persistence Functions
const SESSION_STORAGE_KEY = 'powerMeterSession';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Save current session data to localStorage
 */
function saveSessionData() {
    try {
        const sessionData = {
            timestamp: Date.now(),
            powerData: powerData,
            heartData: heartData,
            cadenceData: cadenceData,
            rawPowerMeasurements: rawPowerMeasurements,
            powerReadings: powerReadings,
            powerAverages: powerAverages,
            lastPowerValue: lastPowerValue,
            lastHeartRateValue: lastHeartRateValue,
            lastCadenceValue: lastCadenceValue,
            sessionStartTime: sessionStartTime
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
        console.warn('Failed to save session data:', error);
    }
}

/**
 * Load session data from localStorage if available and recent
 * Returns the session data object if available, null if not
 */
function loadSessionData() {
    try {
        const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedData) return null;

        const sessionData = JSON.parse(savedData);
        const now = Date.now();

        // Check if session is too old (older than 24 hours)
        if (now - sessionData.timestamp > SESSION_TIMEOUT) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            return null;
        }

        return sessionData;
    } catch (error) {
        console.warn('Failed to load session data:', error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}

/**
 * Apply session data to restore the session
 */
function restoreSessionData(sessionData) {
    try {
        // Restore data arrays
        if (sessionData.powerData) powerData.length = 0, powerData.push(...sessionData.powerData);
        if (sessionData.heartData) heartData.length = 0, heartData.push(...sessionData.heartData);
        if (sessionData.cadenceData) cadenceData.length = 0, cadenceData.push(...sessionData.cadenceData);
        if (sessionData.rawPowerMeasurements) rawPowerMeasurements.length = 0, rawPowerMeasurements.push(...sessionData.rawPowerMeasurements);
        if (sessionData.powerReadings) powerReadings.length = 0, powerReadings.push(...sessionData.powerReadings);

        // Restore power averages completely
        if (sessionData.powerAverages) {
            Object.assign(powerAverages, sessionData.powerAverages);
        }

        // Restore last values
        if (sessionData.lastPowerValue !== undefined) lastPowerValue = sessionData.lastPowerValue;
        if (sessionData.lastHeartRateValue !== undefined) lastHeartRateValue = sessionData.lastHeartRateValue;
        if (sessionData.lastCadenceValue !== undefined) lastCadenceValue = sessionData.lastCadenceValue;
        if (sessionData.sessionStartTime !== undefined) sessionStartTime = sessionData.sessionStartTime;

        // Update displays with restored data
        updateDisplaysFromRestoredData();

        return true;
    } catch (error) {
        console.warn('Failed to restore session data:', error);
        return false;
    }
}

/**
 * Update displays after restoring session data
 */
function updateDisplaysFromRestoredData() {
    // Update current metric values
    powerValueElement.textContent = lastPowerValue || '--';
    hrValueElement.textContent = lastHeartRateValue || '--';
    cadenceValueElement.textContent = lastCadenceValue || '--';

    // Update power averages display
    updatePowerAveragesDisplay();

    // Show session restoration notification
    if (powerData.length > 0) {
        showSessionRestoredNotification();
    }
}

/**
 * Show notification that session was restored
 */
function showSessionRestoredNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1000;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = `Session restored! ${powerData.length} data points recovered.`;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 5000);
}

/**
 * Clear session data from localStorage
 */
function clearSessionData() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

const connectButton = document.getElementById('connectButton');
const statusText = document.getElementById('status');
const powerValueElement = document.getElementById('power-value');
const hrValueElement = document.getElementById('hr-value');
const cadenceValueElement = document.getElementById('cadence-value');
const deviceNameElement = document.getElementById('device-name');
const exportJsonButton = document.getElementById('exportJsonButton');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportTcxButton = document.getElementById('exportTcxButton');
const exportRawJsonButton = document.getElementById('exportRawJsonButton');
const exportRawCsvButton = document.getElementById('exportRawCsvButton');
const syncToStravaButton = document.getElementById('syncToStravaButton');
const clearSessionButton = document.getElementById('clearSessionButton');

// Power averages elements
const avg10sCurrentElement = document.getElementById('avg10s-current');
const avg10sBestElement = document.getElementById('avg10s-best');
const avg30sCurrentElement = document.getElementById('avg30s-current');
const avg30sBestElement = document.getElementById('avg30s-best');
const avg1mCurrentElement = document.getElementById('avg1m-current');
const avg1mBestElement = document.getElementById('avg1m-best');
const avg2mCurrentElement = document.getElementById('avg2m-current');
const avg2mBestElement = document.getElementById('avg2m-best');
const avg4mCurrentElement = document.getElementById('avg4m-current');
const avg4mBestElement = document.getElementById('avg4m-best');
const avg8mCurrentElement = document.getElementById('avg8m-current');
const avg8mBestElement = document.getElementById('avg8m-best');

// Toggle elements
const toggleConnectSection = document.getElementById('toggleConnectSection');
const toggleExportSection = document.getElementById('toggleExportSection');
const connectSection = document.getElementById('connectSection');
const exportSection = document.getElementById('exportSection');
const powerAveragesSection = document.getElementById('powerAveragesSection');
const connectToggleText = document.getElementById('connectToggleText');
const exportToggleText = document.getElementById('exportToggleText');

// Hamburger menu elements
const hamburgerBtn = document.getElementById('hamburgerButton');
const menuDropdown = document.getElementById('menuDropdown');
const powerAveragesToggle = document.getElementById('powerAveragesToggle');
const powerMetricToggle = document.getElementById('powerMetricToggle');
const heartRateMetricToggle = document.getElementById('heartRateMetricToggle');
const cadenceMetricToggle = document.getElementById('cadenceMetricToggle');
const connectSectionToggle = document.getElementById('connectSectionToggle');
const exportSectionToggle = document.getElementById('exportSectionToggle');
const stravaSettingsMenuItem = document.getElementById('stravaSettingsMenuItem');

// Metric card elements
const powerCard = document.querySelector('.power-card');
const heartRateCard = document.querySelector('.hr-card');
const cadenceCard = document.querySelector('.cadence-card');

// Status indicator elements
const powerStatusIndicator = document.getElementById('power-status-indicator');
const hrStatusIndicator = document.getElementById('hr-status-indicator');
const cadenceStatusIndicator = document.getElementById('cadence-status-indicator');

// Initialize all status indicators to disconnected state
powerStatusIndicator.className = 'status-indicator';
hrStatusIndicator.className = 'status-indicator';
cadenceStatusIndicator.className = 'status-indicator';

// Only add event listeners if elements exist
if (hamburgerBtn && menuDropdown) {
    // Hamburger menu functionality
    hamburgerBtn.addEventListener('click', function () {
        const isActive = menuDropdown.classList.contains('active');
        if (isActive) {
            menuDropdown.classList.remove('active');
        } else {
            menuDropdown.classList.add('active');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.hamburger-menu')) {
            menuDropdown.classList.remove('active');
        }
    });
} else {
    console.error('Hamburger menu elements not found:', {
        hamburgerBtn: !!hamburgerBtn,
        menuDropdown: !!menuDropdown
    });
}

if (powerAveragesToggle && powerAveragesSection) {
    // Power averages toggle via hamburger menu
    let powerAveragesVisible = false;
    powerAveragesToggle.addEventListener('click', function () {
        powerAveragesVisible = !powerAveragesVisible;

        if (powerAveragesVisible) {
            powerAveragesSection.style.display = 'block';
            powerAveragesToggle.classList.add('active');
        } else {
            powerAveragesSection.style.display = 'none';
            powerAveragesToggle.classList.remove('active');
        }
        manageCollapsedSectionsLayout();
    });
} else {
    console.error('Power averages toggle elements not found:', {
        powerAveragesToggle: !!powerAveragesToggle,
        powerAveragesSection: !!powerAveragesSection
    });
}

// Power metric toggle via hamburger menu
if (powerMetricToggle && powerCard) {
    let powerMetricVisible = true; // Start visible by default
    powerMetricToggle.classList.add('active'); // Set initial active state

    powerMetricToggle.addEventListener('click', function () {
        powerMetricVisible = !powerMetricVisible;

        if (powerMetricVisible) {
            powerCard.style.display = 'block';
            powerMetricToggle.classList.add('active');
        } else {
            powerCard.style.display = 'none';
            powerMetricToggle.classList.remove('active');
        }
    });
} else {
    console.error('Power metric toggle elements not found:', {
        powerMetricToggle: !!powerMetricToggle,
        powerCard: !!powerCard
    });
}

// Heart rate metric toggle via hamburger menu
if (heartRateMetricToggle && heartRateCard) {
    let heartRateMetricVisible = true; // Start visible by default
    heartRateMetricToggle.classList.add('active'); // Set initial active state

    heartRateMetricToggle.addEventListener('click', function () {
        heartRateMetricVisible = !heartRateMetricVisible;

        if (heartRateMetricVisible) {
            heartRateCard.style.display = 'block';
            heartRateMetricToggle.classList.add('active');
        } else {
            heartRateCard.style.display = 'none';
            heartRateMetricToggle.classList.remove('active');
        }
    });
} else {
    console.error('Heart rate metric toggle elements not found:', {
        heartRateMetricToggle: !!heartRateMetricToggle,
        heartRateCard: !!heartRateCard
    });
}

// Cadence metric toggle via hamburger menu
if (cadenceMetricToggle && cadenceCard) {
    let cadenceMetricVisible = true; // Start visible by default
    cadenceMetricToggle.classList.add('active'); // Set initial active state

    cadenceMetricToggle.addEventListener('click', function () {
        cadenceMetricVisible = !cadenceMetricVisible;

        if (cadenceMetricVisible) {
            cadenceCard.style.display = 'block';
            cadenceMetricToggle.classList.add('active');
        } else {
            cadenceCard.style.display = 'none';
            cadenceMetricToggle.classList.remove('active');
        }
    });
} else {
    console.error('Cadence metric toggle elements not found:', {
        cadenceMetricToggle: !!cadenceMetricToggle,
        cadenceCard: !!cadenceCard
    });
}

// Connect section toggle via hamburger menu
if (connectSectionToggle && connectSection) {
    let connectSectionVisible = true; // Start visible by default
    connectSectionToggle.classList.add('active'); // Set initial active state

    connectSectionToggle.addEventListener('click', function () {
        connectSectionVisible = !connectSectionVisible;

        if (connectSectionVisible) {
            connectSection.style.display = 'block';
            connectSectionToggle.classList.add('active');
        } else {
            connectSection.style.display = 'none';
            connectSectionToggle.classList.remove('active');
        }
    });
} else {
    console.error('Connect section toggle elements not found:', {
        connectSectionToggle: !!connectSectionToggle,
        connectSection: !!connectSection
    });
}

// Export section toggle via hamburger menu
if (exportSectionToggle && exportSection) {
    let exportSectionVisible = false; // Start hidden by default (as it currently is)
    // exportSectionToggle starts inactive since export section is initially hidden

    exportSectionToggle.addEventListener('click', function () {
        exportSectionVisible = !exportSectionVisible;

        if (exportSectionVisible) {
            exportSection.style.display = 'block';
            exportSectionToggle.classList.add('active');
        } else {
            exportSection.style.display = 'none';
            exportSectionToggle.classList.remove('active');
        }
    });
} else {
    console.error('Export section toggle elements not found:', {
        exportSectionToggle: !!exportSectionToggle,
        exportSection: !!exportSection
    });
}

// Toggle functionality for connect section
toggleConnectSection.addEventListener('click', () => {
    const connectButtons = connectSection.querySelectorAll('button:not(.section-toggle-button)');
    const sectionHeader = connectSection.querySelector('.section-header');
    const isHidden = connectButtons[0].style.display === 'none';
    if (isHidden) {
        connectButtons.forEach(btn => btn.style.display = 'block');
        connectToggleText.textContent = 'Hide Connect Devices';
        toggleConnectSection.classList.remove('collapsed');
        connectSection.classList.remove('collapsed');
        sectionHeader.classList.remove('collapsed');
    } else {
        connectButtons.forEach(btn => btn.style.display = 'none');
        connectToggleText.textContent = 'Show Connect Devices';
        toggleConnectSection.classList.add('collapsed');
        connectSection.classList.add('collapsed');
        sectionHeader.classList.add('collapsed');
    }
    // Don't call updateDashboardLayout for bottom controls
});

// Toggle functionality for export section
toggleExportSection.addEventListener('click', () => {
    const exportButtons = document.getElementById('export-buttons');
    const sectionHeader = exportSection.querySelector('.section-header');
    const isHidden = exportButtons.style.display === 'none';
    if (isHidden) {
        exportSection.style.display = 'block';
        exportButtons.style.display = 'flex';
        exportToggleText.textContent = 'Hide Export Data';
        toggleExportSection.classList.remove('collapsed');
        exportSection.classList.remove('collapsed');
        sectionHeader.classList.remove('collapsed');
    } else {
        exportButtons.style.display = 'none';
        exportToggleText.textContent = 'Show Export Data';
        toggleExportSection.classList.add('collapsed');
        exportSection.classList.add('collapsed');
        sectionHeader.classList.add('collapsed');
    }
    // Don't call updateDashboardLayout for bottom controls
});

// Strava Settings Menu Item
if (stravaSettingsMenuItem) {
    stravaSettingsMenuItem.addEventListener('click', async () => {
        await showStravaConfigDialog();
        // Update button status after potential configuration change
        updateStravaButtonStatus();
        // Close the menu
        menuDropdown.classList.remove('active');
    });
} else {
    console.error('Strava settings menu item not found');
}

// Function to update dashboard layout based on visible sections
function updateDashboardLayout() {
    const dashboard = document.querySelector('.dashboard');
    const powerAveragesHidden = powerAveragesSection && powerAveragesSection.style.display === 'none';

    if (powerAveragesHidden) {
        dashboard.classList.add('maximized');
    } else {
        dashboard.classList.remove('maximized');
    }

    // Manage horizontal layout for collapsed sections (excluding bottom controls)
    manageCollapsedSectionsLayout();
}

// Function to manage horizontal layout of collapsed sections
function manageCollapsedSectionsLayout() {
    const dashboard = document.querySelector('.dashboard');

    // Only manage power averages section for collapsed layout - 
    // connect and export sections are now bottom controls and stay at bottom
    // Note: collapsedSections logic simplified since only power averages section is managed now

    // Remove any existing collapsed sections row
    const existingRow = document.querySelector('.collapsed-sections-row');
    if (existingRow) {
        // Move sections back to their original positions
        const sectionsInRow = existingRow.querySelectorAll('.power-averages-section');
        sectionsInRow.forEach(section => {
            // Insert sections back after the dashboard
            dashboard.parentNode.insertBefore(section, dashboard.nextSibling);
        });
        existingRow.remove();
    }

    // Power averages section doesn't need horizontal grouping since it's the only
    // section that can be managed this way now
    dashboard.classList.remove('has-collapsed-sections');
}

// Initialize sections - connect section visible, export section hidden (controlled by hamburger menu)
const connectButtons = connectSection.querySelectorAll('button:not(.section-toggle-button)');
connectButtons.forEach(btn => btn.style.display = 'block');

// Initialize export section as hidden (controlled by hamburger menu)
exportSection.style.display = 'none';

// Initialize power averages section as hidden (controlled by hamburger menu)
powerAveragesSection.style.display = 'none';

updateDashboardLayout();


let powerData = [];
let rawPowerMeasurements = [];
let lastPowerValue = 0;
let sessionStartTime = null;

// Power averaging data structures
let powerReadings = [];  // Array to store timestamped power readings
let powerAverages = {
    '10s': { current: 0, best: 0 },
    '30s': { current: 0, best: 0 },
    '1m': { current: 0, best: 0 },
    '2m': { current: 0, best: 0 },
    '4m': { current: 0, best: 0 },
    '8m': { current: 0, best: 0 }
};

// Power averaging functions
function addPowerReading(power) {
    const now = Date.now();
    powerReadings.push({ timestamp: now, power: power });

    // Keep only the last 8 minutes of readings (plus some buffer)
    const eightMinutesAgo = now - (9 * 60 * 1000); // 9 minutes to be safe
    powerReadings = powerReadings.filter(reading => reading.timestamp > eightMinutesAgo);

    // Calculate current averages
    calculatePowerAverages();
    updatePowerAveragesDisplay();
}

function calculatePowerAverages() {
    const now = Date.now();
    const periods = {
        '10s': 10 * 1000,
        '30s': 30 * 1000,
        '1m': 60 * 1000,
        '2m': 120 * 1000,
        '4m': 240 * 1000,
        '8m': 480 * 1000
    };

    for (const [periodKey, periodMs] of Object.entries(periods)) {
        const cutoffTime = now - periodMs;
        const relevantReadings = powerReadings.filter(reading => reading.timestamp >= cutoffTime);

        if (relevantReadings.length > 0) {
            const sum = relevantReadings.reduce((total, reading) => total + reading.power, 0);
            const average = Math.round(sum / relevantReadings.length);
            powerAverages[periodKey].current = average;

            // Update best if current is better
            if (average > powerAverages[periodKey].best) {
                powerAverages[periodKey].best = average;
            }
        } else {
            powerAverages[periodKey].current = 0;
        }
    }
}

function updatePowerAveragesDisplay() {
    avg10sCurrentElement.textContent = powerAverages['10s'].current || '--';
    avg10sBestElement.textContent = powerAverages['10s'].best || '--';
    avg30sCurrentElement.textContent = powerAverages['30s'].current || '--';
    avg30sBestElement.textContent = powerAverages['30s'].best || '--';
    avg1mCurrentElement.textContent = powerAverages['1m'].current || '--';
    avg1mBestElement.textContent = powerAverages['1m'].best || '--';
    avg2mCurrentElement.textContent = powerAverages['2m'].current || '--';
    avg2mBestElement.textContent = powerAverages['2m'].best || '--';
    avg4mCurrentElement.textContent = powerAverages['4m'].current || '--';
    avg4mBestElement.textContent = powerAverages['4m'].best || '--';
    avg8mCurrentElement.textContent = powerAverages['8m'].current || '--';
    avg8mBestElement.textContent = powerAverages['8m'].best || '--';
}

function resetPowerAverages() {
    powerReadings = [];
    for (const period of Object.keys(powerAverages)) {
        powerAverages[period].current = 0;
        powerAverages[period].best = 0;
    }
    updatePowerAveragesDisplay();
}

/**
 * Reset all session data (called when all devices disconnect)
 */
function resetAllSessionData() {
    // Clear all data arrays
    powerData.length = 0;
    heartData.length = 0;
    cadenceData.length = 0;
    rawPowerMeasurements.length = 0;
    powerReadings.length = 0;

    // Reset power averages
    for (const period of Object.keys(powerAverages)) {
        powerAverages[period].current = 0;
        powerAverages[period].best = 0;
    }

    // Reset last values
    lastPowerValue = 0;
    lastHeartRateValue = 0;
    lastCadenceValue = 0;
    sessionStartTime = null;

    // Update displays
    updatePowerAveragesDisplay();
    powerValueElement.textContent = '--';
    hrValueElement.textContent = '--';
    cadenceValueElement.textContent = '--';

    // Clear localStorage
    clearSessionData();
}

let lastHeartRateValue = 0;
let lastCadenceValue = 0;
let dataLoggerInterval = null;
let powerMeterDevice = null;
const CYCLING_POWER_SERVICE_UUID = 'cycling_power';
const CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID = 'cycling_power_measurement';
const CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID = 'cycling_power_feature';
const CYCLING_CADENCE_SERVICE_UUID = 'cycling_speed_and_cadence';
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 'csc_measurement';

connectButton.addEventListener('click', async () => {
    await requestWakeLock();
    if (!navigator.bluetooth) {
        statusText.textContent = 'Web Bluetooth API is not available.';
        return;
    }

    // Reset data from previous session
    powerData = [];
    rawPowerMeasurements = [];
    lastPowerValue = 0;
    resetPowerAverages();
    if (dataLoggerInterval) {
        clearInterval(dataLoggerInterval);
    }

    try {
        statusText.textContent = 'Scanning for power meters...';
        powerStatusIndicator.className = 'status-indicator connecting';

        // Scan specifically for devices advertising the Cycling Power service
        powerMeterDevice = await navigator.bluetooth.requestDevice({
            filters: [{
                services: [CYCLING_POWER_SERVICE_UUID]
            }]
        });

        statusText.textContent = 'Connecting to device...';
        deviceNameElement.textContent = `Device: ${powerMeterDevice.name || 'Unknown Device'}`;

        powerMeterDevice.addEventListener('gattserverdisconnected', onDisconnected);

        const server = await powerMeterDevice.gatt.connect();
        const service = await server.getPrimaryService(CYCLING_POWER_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID);

        // Check for and subscribe to advanced power features if available
        try {
            const featureCharacteristic = await service.getCharacteristic(CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID);
            // eslint-disable-next-line no-unused-vars
            const features = await featureCharacteristic.readValue();
            // This value can be used to determine what the power meter supports,
            // but for now we just parse what's in the measurement characteristic.
        } catch {
            // Cycling Power Feature characteristic not found
        }

        // Subscribe to power measurement notifications
        await characteristic.startNotifications();

        characteristic.addEventListener('characteristicvaluechanged', handlePowerMeasurement);

        statusText.textContent = 'Connected and receiving data!';
        powerStatusIndicator.className = 'status-indicator connected';
        connectButton.disabled = true;

        // Start session if this is the first connection
        if (!sessionStartTime) {
            sessionStartTime = Date.now();
        }

        // exportButtons.style.display = 'block';

        dataLoggerInterval = setInterval(() => {
            powerData.push({
                timestamp: Date.now(),
                power: lastPowerValue,
                heartRate: lastHeartRateValue,
                cadence: lastCadenceValue
            });

            // Save session data every 10 seconds
            if (powerData.length % 100 === 0) { // Every 100 readings = 10 seconds
                saveSessionData();
            }
        }, 100);

    } catch (error) {
        statusText.textContent = `Error: ${error.message}`;
        powerStatusIndicator.className = 'status-indicator';
        console.error('Connection failed:', error);
        if (powerMeterDevice) {
            powerMeterDevice.removeEventListener('gattserverdisconnected', onDisconnected);
        }
    }
});

exportJsonButton.addEventListener('click', () => {
    const jsonString = JSON.stringify(powerData, null, 2);
    const blob = new Blob([jsonString], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    a.download = `power_data_${dateString}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

exportCsvButton.addEventListener('click', () => {
    let csvContent = 'timestamp,power,heartRate,cadence\n';
    powerData.forEach(row => {
        csvContent += `${row.timestamp},${row.power},${row.heartRate},${row.cadence}\n`;
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    a.download = `power_data_${dateString}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Export raw power measurements as JSON
exportRawJsonButton.addEventListener('click', () => {
    const jsonString = JSON.stringify(rawPowerMeasurements, null, 2);
    const blob = new Blob([jsonString], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    a.download = `raw_power_measurements_${dateString}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Export raw power measurements as CSV
exportRawCsvButton.addEventListener('click', () => {
    let csvContent = 'timestamp,flags,dataLength,instantaneousPower,rawBytes\n';

    rawPowerMeasurements.forEach(measurement => {
        csvContent += `${measurement.timestamp},${measurement.flags},${measurement.dataLength},${measurement.instantaneousPower},"${measurement.rawBytes}"\n`;
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    a.download = `raw_power_measurements_${dateString}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Export TCX
exportTcxButton.addEventListener('click', () => {
    try {
        if (powerData.length === 0) {
            alert('No power data available to export.');
            return;
        }

        const tcxContent = generateTcxString(powerData);

        const blob = new Blob([tcxContent], {
            type: 'application/xml;charset=utf-8;'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        a.download = `power_data_${dateString}.tcx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating TCX:', error);
        alert(`Error generating TCX file: ${error.message}`);
    }
});

// Sync to Strava
syncToStravaButton.addEventListener('click', async () => {
    try {
        if (powerData.length === 0) {
            alert('No power data available to sync to Strava.');
            return;
        }

        // Check if user is authenticated with Strava
        const stravaAuth = getStravaAuthFromStorage();
        if (!stravaAuth || !stravaAuth.access_token) {
            // Redirect to Strava OAuth
            await initiateStravaAuth();
            return;
        }

        // Show loading state
        syncToStravaButton.disabled = true;
        syncToStravaButton.textContent = 'Syncing...';

        // Generate TCX data for upload
        const tcxContent = generateTcxString(powerData);

        // Upload to Strava
        await uploadToStrava(tcxContent, stravaAuth.access_token);

        alert('Successfully synced to Strava!');

    } catch (error) {
        console.error('Error syncing to Strava:', error);
        alert(`Error syncing to Strava: ${error.message}`);
    } finally {
        // Reset button state
        syncToStravaButton.disabled = false;
        updateStravaButtonStatus();
    }
});

// Clear Session Data
clearSessionButton.addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to clear all session data? This action cannot be undone.');
    if (confirmed) {
        resetAllSessionData();
        alert('Session data cleared successfully!');
    }
});


function handlePowerMeasurement(event) {
    const value = event.target.value;
    const timestamp = Date.now();

    // Store simplified raw measurement data
    const rawMeasurement = {
        timestamp: timestamp,
        flags: value.getUint16(0, true),
        rawBytes: Array.from(new Uint8Array(value.buffer)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        dataLength: value.byteLength
    };

    // The data is a DataView object with a flags field and the power value.
    // Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
    // eslint-disable-next-line no-unused-vars
    const flags = value.getUint16(0, true);
    let offset = 2;

    // Power is always present
    const power = value.getInt16(offset, true);
    rawMeasurement.instantaneousPower = power;
    powerValueElement.textContent = power;
    lastPowerValue = power;

    // Add power reading to averaging calculations
    addPowerReading(power);

    // Store the simplified raw measurement
    rawPowerMeasurements.push(rawMeasurement);
}
/**
 * Parses the Cycling Power Measurement characteristic data.
 * The data is a DataView object with a flags field and the power value.
 * The instantaneous power is a 16-bit signed integer starting at the 3rd byte (offset 2).
 * Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
 * Currently unused but kept for potential future use.
 */
// eslint-disable-next-line no-unused-vars
function parsePowerMeasurement(value) {
    // The first 2 bytes are flags. The next 2 bytes are the instantaneous power.
    // The power value is a signed 16-bit integer (sint16)
    const instantaneousPower = value.getInt16(2, /*littleEndian=*/ true);
    return instantaneousPower;
}

function onDisconnected() {
    statusText.textContent = 'Device disconnected.';
    powerStatusIndicator.className = 'status-indicator';
    deviceNameElement.textContent = '';
    powerValueElement.textContent = '--';
    resetPowerAverages();
    connectButton.disabled = false;
    if (dataLoggerInterval) {
        clearInterval(dataLoggerInterval);
        dataLoggerInterval = null;
    }
    if (powerMeterDevice) {
        powerMeterDevice.removeEventListener('gattserverdisconnected', onDisconnected);
        powerMeterDevice = null;
    }
    lastPowerValue = 0;
}


const heartData = [];
const cadenceData = [];
// eslint-disable-next-line no-unused-vars
let hrDataLoggerInterval = null; // Reserved for future HR data logging functionality

const hrConnectButton = document.getElementById('hrConnectButton');
const hrStatusText = document.getElementById('hrStatus');
const hrValue = document.getElementById('hr-value');
const hrDeviceName = document.getElementById('hrDeviceName');

let hrBluetoothDevice = null;

hrConnectButton.addEventListener('click', async () => {
    await requestWakeLock();
    if (!navigator.bluetooth) {
        hrStatusText.textContent = 'Web Bluetooth API is not available.';
        return;
    }

    try {
        hrStatusText.textContent = 'Scanning for devices...';
        hrStatusIndicator.className = 'status-indicator connecting';

        // Filter for devices that advertise the 'heart_rate' service
        hrBluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{
                services: ['heart_rate']
            }]
        });

        hrStatusText.textContent = 'Connecting to device...';
        hrDeviceName.textContent = `Device: ${hrBluetoothDevice.name}`;

        // Add a listener for when the device gets disconnected
        hrBluetoothDevice.addEventListener('gattserverdisconnected', onDisconnectedHr);

        const hrServer = await hrBluetoothDevice.gatt.connect();
        const hrService = await hrServer.getPrimaryService('heart_rate');
        const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');

        // Start notifications to receive heart rate data
        await hrCharacteristic.startNotifications();

        hrCharacteristic.addEventListener('characteristicvaluechanged', handleHeartRateChanged);

        hrStatusText.textContent = 'Connected!';
        hrStatusIndicator.className = 'status-indicator connected';
        hrConnectButton.disabled = true;

    } catch (error) {
        hrStatusText.textContent = `Error: ${error.message}`;
        hrStatusIndicator.className = 'status-indicator';
        console.error('Connection failed:', error);
    }
});

function handleHeartRateChanged(event) {
    const value = event.target.value;
    const heartRate = parseHeartRate(value);
    hrValue.textContent = heartRate;
    lastHeartRateValue = heartRate;
}

/**
 * The heart rate measurement is a DataView object.
 * The first byte is a flag, and the subsequent byte(s) are the heart rate value.
 * We need to check the first bit of the flag to see if the value is 8-bit or 16-bit.
 */
function parseHeartRate(value) {
    const flags = value.getUint8(0);
    // Check if the heart rate value format is UINT16 (bit 0 is 1) or UINT8 (bit 0 is 0)
    const is16bit = (flags & 0x1);
    if (is16bit) {
        // If 16-bit, read 2 bytes starting from the second byte
        return value.getUint16(1, /*littleEndian=*/ true);
    } else {
        // If 8-bit, read 1 byte starting from the second byte
        return value.getUint8(1);
    }
}

function onDisconnectedHr() {
    hrStatusText.textContent = 'Device disconnected.';
    hrStatusIndicator.className = 'status-indicator';
    hrDeviceName.textContent = '';
    hrValue.textContent = '--';
    hrConnectButton.disabled = false;
    hrBluetoothDevice = null;
    lastHeartRateValue = 0;
}

const speedCadenceConnectButton = document.getElementById('speedCadenceConnectButton');
const cadenceStatusText = document.getElementById('cadenceStatus');
const cadenceDeviceName = document.getElementById('cadenceDeviceName');
let speedCadenceBluetoothDevice = null;

speedCadenceConnectButton.addEventListener('click', async () => {
    await requestWakeLock();
    if (!navigator.bluetooth) {
        cadenceStatusText.textContent = 'Web Bluetooth API is not available.';
        return;
    }

    try {
        cadenceStatusText.textContent = 'Scanning for sensors...';
        cadenceStatusIndicator.className = 'status-indicator connecting';

        speedCadenceBluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{
                services: [CYCLING_CADENCE_SERVICE_UUID]
            }]
        });

        cadenceStatusText.textContent = 'Connecting to device...';
        cadenceDeviceName.textContent = `Device: ${speedCadenceBluetoothDevice.name}`;

        speedCadenceBluetoothDevice.addEventListener('gattserverdisconnected', onDisconnectedSpeedCadence);

        const server = await speedCadenceBluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService(CYCLING_CADENCE_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CSC_MEASUREMENT_CHARACTERISTIC_UUID);

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleSpeedCadenceMeasurement);

        cadenceStatusText.textContent = 'Connected!';
        cadenceStatusIndicator.className = 'status-indicator connected';
        speedCadenceConnectButton.disabled = true;

    } catch (error) {
        cadenceStatusText.textContent = `Error: ${error.message}`;
        cadenceStatusIndicator.className = 'status-indicator';
        console.error('Speed/Cadence connection failed:', error);
    }
});

let lastCrankRevs = 0;
let lastCrankTime = 0;

function handleSpeedCadenceMeasurement(event) {
    const value = event.target.value;
    const flags = value.getUint8(0);
    let offset = 1;

    const wheelRevsPresent = (flags & 0x01);
    const crankRevsPresent = (flags & 0x02);

    // Skip wheel revolution data since we don't need speed/distance
    if (wheelRevsPresent) {
        offset += 6; // Skip wheel data
    }

    if (crankRevsPresent) {
        const cumulativeCrankRevolutions = value.getUint16(offset, true);
        const lastCrankEventTime = value.getUint16(offset + 2, true); // 1/1024 seconds

        if (lastCrankRevs > 0) {
            const revs = cumulativeCrankRevolutions - lastCrankRevs;
            const time = (lastCrankEventTime - lastCrankTime) / 1024; // in seconds
            if (time > 0) {
                const cadence = (revs / time) * 60; // RPM
                cadenceValueElement.textContent = Math.round(cadence);
                lastCadenceValue = Math.round(cadence);
            }
        }
        lastCrankRevs = cumulativeCrankRevolutions;
        lastCrankTime = lastCrankEventTime;
    }
}

function onDisconnectedSpeedCadence() {
    cadenceStatusText.textContent = 'Device disconnected.';
    cadenceStatusIndicator.className = 'status-indicator';
    cadenceDeviceName.textContent = '';
    cadenceValueElement.textContent = '--';
    speedCadenceConnectButton.disabled = false;
    speedCadenceBluetoothDevice = null;
    lastCadenceValue = 0;
}

// Initialize session on page load
/**
 * Show restoration dialog to let user choose
 */
function showRestorationDialog(sessionData) {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'modal';

        // Get session info
        const sessionAge = Math.round((Date.now() - sessionData.timestamp) / (1000 * 60)); // minutes
        const dataCount = (sessionData.powerData?.length || 0) + (sessionData.heartData?.length || 0) + (sessionData.cadenceData?.length || 0);

        modal.innerHTML = `
            <h3>Previous Session Found</h3>
            <p>
                A previous session was found from ${sessionAge} minutes ago with ${dataCount} data points.
            </p>
            <p>
                Would you like to restore this session or start fresh?
            </p>
            <div class="modal-buttons">
                <button id="startFresh" class="modal-button secondary">Start Fresh</button>
                <button id="restoreSession" class="modal-button primary">Restore Session</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Handle button clicks
        modal.querySelector('#startFresh').addEventListener('click', () => {
            document.body.removeChild(backdrop);
            localStorage.removeItem(SESSION_STORAGE_KEY);
            resolve(false);
        });

        modal.querySelector('#restoreSession').addEventListener('click', () => {
            document.body.removeChild(backdrop);
            resolve(true);
        });

        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                document.body.removeChild(backdrop);
                resolve(false);
            }
        });
    });
}

// Strava Integration Functions
function getStravaAuthFromStorage() {
    try {
        const authData = localStorage.getItem('stravaAuth');
        if (authData) {
            const parsed = JSON.parse(authData);
            // Check if token is expired (tokens typically last 6 hours)
            if (parsed.expires_at && Date.now() > parsed.expires_at * 1000) {
                localStorage.removeItem('stravaAuth');
                return null;
            }
            return parsed;
        }
    } catch (error) {
        console.error('Error reading Strava auth from storage:', error);
    }
    return null;
}

async function initiateStravaAuth() {
    const clientId = getStravaClientId();

    if (!clientId) {
        // Show configuration dialog
        const configuredClientId = await showStravaConfigDialog();
        if (!configuredClientId) {
            return; // User cancelled
        }
    }

    // Get the client ID again (might have been just configured)
    const finalClientId = getStravaClientId();

    // Strava OAuth configuration using implicit flow (no client secret needed)
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const scope = 'activity:write';

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${finalClientId}&response_type=token&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;

    // Store current state to return to after auth
    localStorage.setItem('stravaAuthPending', 'true');

    // Open Strava auth in new window
    window.location.href = authUrl;
}

async function uploadToStrava(tcxContent, accessToken) {
    try {
        // Create a form data object for the file upload
        const formData = new FormData();
        const blob = new Blob([tcxContent], { type: 'application/xml' });
        const now = new Date();
        const filename = `power_data_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.tcx`;

        formData.append('file', blob, filename);
        formData.append('data_type', 'tcx');
        formData.append('name', `Power Meter Session - ${now.toLocaleDateString()}`);
        formData.append('description', 'Cycling session data from Web Bluetooth Power Meter');

        const response = await fetch('https://www.strava.com/api/v3/uploads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload to Strava');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error uploading to Strava:', error);
        throw error;
    }
}

// Update Strava button text based on connection status
function updateStravaButtonStatus() {
    const syncToStravaButton = document.getElementById('syncToStravaButton');
    if (!syncToStravaButton) return;

    const stravaAuth = getStravaAuthFromStorage();
    if (stravaAuth && stravaAuth.access_token) {
        syncToStravaButton.textContent = '🚴 Sync to Strava';
        syncToStravaButton.title = 'Connected to Strava - Click to sync your session';
    } else {
        syncToStravaButton.textContent = '🚴 Connect to Strava';
        syncToStravaButton.title = 'Click to connect to Strava first';
    }
}

// Check for Strava OAuth callback (implicit flow)
function checkStravaCallback() {
    // For implicit flow, token is in URL hash, not query params
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const expiresIn = hashParams.get('expires_in');
    const scope = hashParams.get('scope');

    if (accessToken && localStorage.getItem('stravaAuthPending')) {
        // Store token data
        const tokenData = {
            access_token: accessToken,
            expires_at: Math.floor(Date.now() / 1000) + parseInt(expiresIn || '21600'), // Default 6 hours
            scope: scope
        };

        localStorage.setItem('stravaAuth', JSON.stringify(tokenData));
        localStorage.removeItem('stravaAuthPending');

        alert('Successfully connected to Strava!');
        // Update button status
        updateStravaButtonStatus();
        // Clean up URL hash
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Try to load previous session data
    const sessionData = loadSessionData();
    if (sessionData) {
        // Show restoration dialog
        const shouldRestore = await showRestorationDialog(sessionData);
        if (shouldRestore) {
            restoreSessionData(sessionData);
        } else {
            sessionStartTime = Date.now();
        }
    } else {
        sessionStartTime = Date.now();
    }

    // Check for Strava callback on page load
    checkStravaCallback();

    // Update button status on page load
    updateStravaButtonStatus();

    // Save session data when page is about to be closed/refreshed
    window.addEventListener('beforeunload', function () {
        if (powerData.length > 0) {
            saveSessionData();
        }
    });

    // Save session data periodically (every 30 seconds as backup)
    setInterval(() => {
        if (powerData.length > 0) {
            saveSessionData();
        }
    }, 30000);
});