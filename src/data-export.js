/**
 * Data Export Module
 * Handles all data export functionality including JSON, CSV, TCX, image, and cloud exports
 * 
 * Cloud Export Features:
 * - Google Docs: Creates formatted documents with session summaries
 * - Google Sheets: Creates spreadsheets with detailed data analysis
 * - More cloud services can be added following the established patterns
 * 
 * @global gapi - Google API client (loaded dynamically)
 */

import { generateTcxString } from './create-tcx.js';
import { generateSummaryImage } from './create-image.js';
import { getCurrentDateString } from './ui-management.js';

/* ==========================================================================
   Cloud Export Configuration
   ========================================================================== */

/**
 * Google API configuration for cloud exports
 * @constant {Object}
 */
const GOOGLE_API_CONFIG = {
    CLIENT_ID: '', // Will be set by user or environment
    API_KEY: '', // Will be set by user or environment
    DISCOVERY_DOCS: [
        'https://docs.googleapis.com/$discovery/rest?version=v1',
        'https://sheets.googleapis.com/$discovery/rest?version=v4'
    ],
    SCOPES: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
    ]
};

/**
 * intervals.icu API configuration for cycling analytics export
 * @constant {Object}
 */
const INTERVALS_CONFIG = {
    BASE_URL: 'https://intervals.icu/api/v1',
    API_KEY: '', // Will be set by user
    ATHLETE_ID: '', // Will be set by user
    SUPPORTED_FORMATS: ['fit', 'tcx', 'gpx'],
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB limit
    UPLOAD_ENDPOINTS: {
        activities: '/activities',
        wellness: '/wellness'
    }
};

/**
 * Cloud export state management
 * @type {Object}
 */
const cloudExportState = {
    isGoogleApiLoaded: false,
    isUserSignedIn: false,
    authInstance: null,
    lastError: null,
    intervals: {
        isConfigured: false,
        apiKey: null,
        athleteId: null,
        lastUpload: null
    }
};

/**
 * Export power data as JSON
 * @param {Array} powerData - Array of power data points
 */
export function exportAsJson(powerData) {
    if (!powerData || !Array.isArray(powerData) || powerData.length === 0) {
        throw new Error('No valid power data available to export as JSON');
    }

    const jsonString = JSON.stringify(powerData, null, 2);
    const blob = new Blob([jsonString], {
        type: 'application/json',
    });
    downloadFile(blob, `power_data_${getCurrentDateString()}.json`);
}

/**
 * Export power data as CSV
 * @param {Array} powerData - Array of power data points
 */
export function exportAsCsv(powerData) {
    if (!powerData || !Array.isArray(powerData) || powerData.length === 0) {
        throw new Error('No valid power data available to export as CSV');
    }

    let csvContent = 'timestamp,power,heartRate,cadence\n';
    powerData.forEach((row) => {
        // Safely handle missing properties
        const timestamp = row.timestamp || '';
        const power = row.power || 0;
        const heartRate = row.heartRate || 0;
        const cadence = row.cadence || 0;
        csvContent += `${timestamp},${power},${heartRate},${cadence}\n`;
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
    });
    downloadFile(blob, `power_data_${getCurrentDateString()}.csv`);
}

/**
 * Export raw power measurements as JSON
 * @param {Array} rawPowerMeasurements - Array of raw power measurement data
 */
export function exportRawAsJson(rawPowerMeasurements) {
    const jsonString = JSON.stringify(rawPowerMeasurements, null, 2);
    const blob = new Blob([jsonString], {
        type: 'application/json',
    });
    downloadFile(blob, `raw_power_measurements_${getCurrentDateString()}.json`);
}

/**
 * Export raw power measurements as CSV
 * @param {Array} rawPowerMeasurements - Array of raw power measurement data
 */
export function exportRawAsCsv(rawPowerMeasurements) {
    let csvContent = 'timestamp,flags,dataLength,instantaneousPower,rawBytes\n';

    rawPowerMeasurements.forEach((measurement) => {
        csvContent += `${measurement.timestamp},${measurement.flags},${measurement.dataLength},${measurement.instantaneousPower},"${measurement.rawBytes}"\n`;
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
    });
    downloadFile(blob, `raw_power_measurements_${getCurrentDateString()}.csv`);
}

/**
 * Export power data as TCX file
 * @param {Array} powerData - Array of power data points
 */
export function exportAsTcx(powerData) {
    try {
        if (powerData.length === 0) {
            throw new Error('No power data available to export.');
        }

        const tcxContent = generateTcxString(powerData);

        const blob = new Blob([tcxContent], {
            type: 'application/xml;charset=utf-8;',
        });
        downloadFile(blob, `power_data_${getCurrentDateString()}.tcx`);
    } catch (error) {
        console.error('Error generating TCX:', error);
        throw error;
    }
}

/**
 * Export summary image
 * @param {Object} data - Object containing dataPoints and powerAverages
 */
export async function exportSummaryImage(data) {
    try {
        if (data.dataPoints.length === 0) {
            throw new Error('No data available to export. Please record some activity first.');
        }

        const canvas = await generateSummaryImage({
            dataPoints: data.dataPoints,
            powerAverages: data.powerAverages
        });

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    downloadFile(blob, `power_meter_summary_${getCurrentDateString()}.png`);
                    resolve();
                } else {
                    reject(new Error('Failed to generate image blob'));
                }
            }, 'image/png');
        });
    } catch (error) {
        console.error('Error generating summary image:', error);
        throw error;
    }
}

/**
 * Helper function to trigger file download
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
function downloadFile(blob, filename) {
    try {
        if (!blob || !(blob instanceof Blob)) {
            throw new Error('Invalid blob provided for download');
        }

        if (!filename || typeof filename !== 'string') {
            throw new Error('Invalid filename provided for download');
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error during file download:', error);
        throw error;
    }
}

/* ==========================================================================
   Cloud Export Functions - Google API Integration
   ========================================================================== */

/**
 * Initialize Google API for cloud exports
 * @async
 * @param {string} clientId - Google OAuth2 client ID
 * @param {string} apiKey - Google API key
 * @returns {Promise<boolean>} True if initialization successful
 */
export async function initializeGoogleAPI(clientId, apiKey) {
    try {
        // Set configuration
        GOOGLE_API_CONFIG.CLIENT_ID = clientId;
        GOOGLE_API_CONFIG.API_KEY = apiKey;

        // Load Google API if not already loaded
        if (!window.gapi) {
            await loadGoogleAPIScript();
        }

        // Initialize the API
        await new Promise((resolve, reject) => {
            window.gapi.load('auth2:client', {
                callback: resolve,
                onerror: reject
            });
        });

        // Initialize auth and client
        await window.gapi.client.init({
            apiKey: GOOGLE_API_CONFIG.API_KEY,
            clientId: GOOGLE_API_CONFIG.CLIENT_ID,
            discoveryDocs: GOOGLE_API_CONFIG.DISCOVERY_DOCS,
            scope: GOOGLE_API_CONFIG.SCOPES.join(' ')
        });

        cloudExportState.authInstance = window.gapi.auth2.getAuthInstance();
        cloudExportState.isGoogleApiLoaded = true;
        cloudExportState.isUserSignedIn = cloudExportState.authInstance.isSignedIn.get();

        console.log('Google API initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Google API:', error);
        cloudExportState.lastError = error.message;
        return false;
    }
}

/**
 * Load Google API script dynamically
 * @async
 * @returns {Promise<void>}
 */
function loadGoogleAPIScript() {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="apis.google.com"]')) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.head.appendChild(script);
    });
}

/**
 * Authenticate user with Google
 * @async
 * @returns {Promise<boolean>} True if authentication successful
 */
export async function authenticateWithGoogle() {
    try {
        if (!cloudExportState.isGoogleApiLoaded) {
            throw new Error('Google API not initialized. Please configure API credentials first.');
        }

        if (!cloudExportState.isUserSignedIn) {
            await cloudExportState.authInstance.signIn();
            cloudExportState.isUserSignedIn = cloudExportState.authInstance.isSignedIn.get();
        }

        return cloudExportState.isUserSignedIn;
    } catch (error) {
        console.error('Google authentication failed:', error);
        cloudExportState.lastError = error.message;
        return false;
    }
}

/**
 * Sign out from Google
 * @async
 * @returns {Promise<void>}
 */
export async function signOutFromGoogle() {
    try {
        if (cloudExportState.authInstance && cloudExportState.isUserSignedIn) {
            await cloudExportState.authInstance.signOut();
            cloudExportState.isUserSignedIn = false;
        }
    } catch (error) {
        console.error('Google sign out failed:', error);
    }
}

/**
 * Check if user is currently signed in to Google
 * @returns {boolean} True if user is signed in
 */
export function isSignedInToGoogle() {
    return cloudExportState.isUserSignedIn;
}

/**
 * Get the last error that occurred during cloud operations
 * @returns {string|null} Error message or null if no error
 */
export function getLastCloudError() {
    return cloudExportState.lastError;
}

/* ==========================================================================
   intervals.icu Export Functions
   ========================================================================== */

/**
 * Initialize intervals.icu configuration
 * @param {string} apiKey - intervals.icu API key
 * @param {string} athleteId - intervals.icu athlete ID
 * @returns {boolean} True if initialization successful
 */
export function initializeIntervalsConfig(apiKey, athleteId) {
    try {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
            throw new Error('Valid API key is required');
        }

        if (!athleteId || typeof athleteId !== 'string' || athleteId.trim().length === 0) {
            throw new Error('Valid athlete ID is required');
        }

        // Sanitize inputs
        const cleanApiKey = apiKey.trim();
        const cleanAthleteId = athleteId.trim();

        INTERVALS_CONFIG.API_KEY = cleanApiKey;
        INTERVALS_CONFIG.ATHLETE_ID = cleanAthleteId;

        cloudExportState.intervals.isConfigured = true;
        cloudExportState.intervals.apiKey = cleanApiKey;
        cloudExportState.intervals.athleteId = cleanAthleteId;

        console.log('intervals.icu configuration initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize intervals.icu configuration:', error);
        cloudExportState.lastError = error.message;
        return false;
    }
}

/**
 * Check if intervals.icu is properly configured
 * @returns {boolean} True if configured
 */
export function isIntervalsConfigured() {
    return cloudExportState.intervals.isConfigured &&
        cloudExportState.intervals.apiKey &&
        cloudExportState.intervals.athleteId;
}

/**
 * Export power data to intervals.icu as an activity
 * @async
 * @param {Object} data - Export data object
 * @param {Array} data.powerData - Array of power data points
 * @param {Date} data.sessionStartTime - Session start time
 * @param {Object} data.powerAverages - Power averages object
 * @param {string} [data.activityName] - Custom activity name
 * @param {string} [data.description] - Activity description
 * @returns {Promise<string>} Activity ID of created activity
 */
export async function exportToIntervals(data) {
    try {
        // Ensure configuration
        if (!isIntervalsConfigured()) {
            throw new Error('intervals.icu not configured. Please set up API credentials first.');
        }

        const { powerData, sessionStartTime, powerAverages, activityName, description } = data;

        if (!powerData || powerData.length === 0) {
            throw new Error('No power data available to export');
        }

        // Generate TCX content for intervals.icu
        const tcxContent = generateIntervalsCompatibleTCX({
            powerData,
            sessionStartTime,
            powerAverages,
            activityName: activityName || `Power Meter Session - ${new Date(sessionStartTime).toLocaleDateString()}`,
            description: description || 'Exported from Power Saver Web App'
        });

        // Upload to intervals.icu
        const activityId = await uploadToIntervals(tcxContent, {
            name: activityName || `Power Meter Session - ${new Date(sessionStartTime).toLocaleDateString()}`,
            description: description || 'Exported from Power Saver Web App',
            type: 'Ride'
        });

        console.log('Successfully exported to intervals.icu:', activityId);
        cloudExportState.intervals.lastUpload = new Date().toISOString();

        return activityId;
    } catch (error) {
        console.error('Error exporting to intervals.icu:', error);
        cloudExportState.lastError = error.message;
        throw new Error(`Failed to export to intervals.icu: ${error.message}`);
    }
}

/**
 * Upload TCX content to intervals.icu
 * @async
 * @param {string} tcxContent - TCX file content
 * @param {Object} metadata - Activity metadata
 * @returns {Promise<string>} Activity ID
 */
async function uploadToIntervals(tcxContent, metadata) {
    try {
        // Create form data for file upload
        const formData = new FormData();
        const tcxBlob = new Blob([tcxContent], { type: 'application/xml' });

        formData.append('file', tcxBlob, `power-session-${Date.now()}.tcx`);
        formData.append('name', metadata.name);
        formData.append('description', metadata.description);
        formData.append('type', metadata.type);

        // Upload to intervals.icu
        const response = await fetch(`${INTERVALS_CONFIG.BASE_URL}/athlete/${INTERVALS_CONFIG.ATHLETE_ID}/activities`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${INTERVALS_CONFIG.API_KEY}:`)}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`intervals.icu API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return result.id || result.activity_id || 'uploaded';
    } catch (error) {
        console.error('Upload to intervals.icu failed:', error);
        throw error;
    }
}

/**
 * Generate intervals.icu compatible TCX content
 * @param {Object} data - Activity data
 * @returns {string} TCX content
 */
function generateIntervalsCompatibleTCX(data) {
    const { powerData, sessionStartTime, description } = data;

    const startTime = new Date(sessionStartTime).toISOString();

    let tcxContent = `<?xml version="1.0" encoding="UTF-8"?>
`;
    tcxContent += `<TrainingCenterDatabase xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd" xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2" xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2" xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns4="http://www.garmin.com/xmlschemas/ProfileExtension/v1">\n`;
    tcxContent += `  <Activities>\n`;
    tcxContent += `    <Activity Sport="Biking">\n`;
    tcxContent += `      <Id>${startTime}</Id>\n`;
    tcxContent += `      <Notes>${description}</Notes>\n`;
    tcxContent += `      <Lap StartTime="${startTime}">\n`;

    // Calculate lap statistics
    const lapStats = calculateLapStatistics(powerData);
    tcxContent += `        <TotalTimeSeconds>${lapStats.totalTime}</TotalTimeSeconds>\n`;
    tcxContent += `        <DistanceMeters>${lapStats.distance}</DistanceMeters>\n`;
    tcxContent += `        <MaximumSpeed>${lapStats.maxSpeed}</MaximumSpeed>\n`;
    tcxContent += `        <Calories>${lapStats.calories}</Calories>\n`;

    if (lapStats.avgHeartRate > 0) {
        tcxContent += `        <AverageHeartRateBpm><Value>${Math.round(lapStats.avgHeartRate)}</Value></AverageHeartRateBpm>\n`;
        tcxContent += `        <MaximumHeartRateBpm><Value>${lapStats.maxHeartRate}</Value></MaximumHeartRateBpm>\n`;
    }

    tcxContent += `        <Intensity>Active</Intensity>\n`;
    tcxContent += `        <TriggerMethod>Manual</TriggerMethod>\n`;
    tcxContent += `        <Track>\n`;

    // Add trackpoints
    powerData.forEach((point) => {
        const timestamp = new Date(point.timestamp).toISOString();
        tcxContent += `          <Trackpoint>\n`;
        tcxContent += `            <Time>${timestamp}</Time>\n`;

        if (point.heartRate && point.heartRate > 0) {
            tcxContent += `            <HeartRateBpm><Value>${point.heartRate}</Value></HeartRateBpm>\n`;
        }

        if (point.cadence && point.cadence > 0) {
            tcxContent += `            <Cadence>${point.cadence}</Cadence>\n`;
        }

        // Add power data in extensions
        tcxContent += `            <Extensions>\n`;
        tcxContent += `              <ns3:TPX>\n`;
        if (point.power && point.power > 0) {
            tcxContent += `                <ns3:Watts>${point.power}</ns3:Watts>\n`;
        }
        tcxContent += `              </ns3:TPX>\n`;
        tcxContent += `            </Extensions>\n`;
        tcxContent += `          </Trackpoint>\n`;
    });

    tcxContent += `        </Track>\n`;

    // Add power extensions for the lap
    tcxContent += `        <Extensions>\n`;
    tcxContent += `          <ns3:LX>\n`;
    if (lapStats.avgPower > 0) {
        tcxContent += `            <ns3:AvgWatts>${Math.round(lapStats.avgPower)}</ns3:AvgWatts>\n`;
        tcxContent += `            <ns3:MaxWatts>${lapStats.maxPower}</ns3:MaxWatts>\n`;
    }
    tcxContent += `          </ns3:LX>\n`;
    tcxContent += `        </Extensions>\n`;
    tcxContent += `      </Lap>\n`;

    // Add activity-level power data
    tcxContent += `      <Extensions>\n`;
    tcxContent += `        <ns3:ActivityExtensions>\n`;
    if (lapStats.avgPower > 0) {
        tcxContent += `          <ns3:AvgWatts>${Math.round(lapStats.avgPower)}</ns3:AvgWatts>\n`;
        tcxContent += `          <ns3:MaxWatts>${lapStats.maxPower}</ns3:MaxWatts>\n`;
    }
    tcxContent += `        </ns3:ActivityExtensions>\n`;
    tcxContent += `      </Extensions>\n`;
    tcxContent += `    </Activity>\n`;
    tcxContent += `  </Activities>\n`;
    tcxContent += `</TrainingCenterDatabase>`;

    return tcxContent;
}

/**
 * Calculate lap statistics for TCX export
 * @param {Array} powerData - Array of power data points
 * @returns {Object} Lap statistics
 */
function calculateLapStatistics(powerData) {
    if (powerData.length === 0) {
        return {
            totalTime: 0,
            distance: 0,
            maxSpeed: 0,
            calories: 0,
            avgHeartRate: 0,
            maxHeartRate: 0,
            avgPower: 0,
            maxPower: 0
        };
    }

    const startTime = new Date(powerData[0].timestamp).getTime();
    const endTime = new Date(powerData[powerData.length - 1].timestamp).getTime();
    const totalTime = (endTime - startTime) / 1000; // seconds

    const powers = powerData.map(p => p.power || 0).filter(p => p > 0);
    const heartRates = powerData.map(p => p.heartRate || 0).filter(hr => hr > 0);

    // Estimate distance based on power (rough approximation)
    const avgPower = powers.length > 0 ? powers.reduce((a, b) => a + b, 0) / powers.length : 0;
    const estimatedSpeed = avgPower > 0 ? Math.sqrt(avgPower / 3.6) : 15; // km/h estimate
    const distance = (estimatedSpeed / 3.6) * totalTime; // meters

    // Estimate calories based on power and time
    const calories = avgPower > 0 ? Math.round((avgPower * totalTime * 4.18) / 1000) : Math.round(totalTime * 10);

    return {
        totalTime: Math.round(totalTime),
        distance: Math.round(distance),
        maxSpeed: Math.round(estimatedSpeed * 1.2 / 3.6 * 100) / 100, // m/s
        calories,
        avgHeartRate: heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0,
        maxHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : 0,
        avgPower: avgPower,
        maxPower: powers.length > 0 ? Math.max(...powers) : 0
    };
}

/**
 * Setup all export button event listeners
 * @param {Object} dataStore - Object containing all data arrays and functions
 */
export function setupExportEventListeners(dataStore) {
    const { elements } = dataStore;

    // JSON export
    if (elements.exportButtons.json) {
        elements.exportButtons.json.addEventListener('click', () => {
            exportAsJson(dataStore.powerData);
        });
    }

    // CSV export
    if (elements.exportButtons.csv) {
        elements.exportButtons.csv.addEventListener('click', () => {
            exportAsCsv(dataStore.powerData);
        });
    }

    // Raw JSON export
    if (elements.exportButtons.rawJson) {
        elements.exportButtons.rawJson.addEventListener('click', () => {
            exportRawAsJson(dataStore.rawPowerMeasurements);
        });
    }

    // Raw CSV export
    if (elements.exportButtons.rawCsv) {
        elements.exportButtons.rawCsv.addEventListener('click', () => {
            exportRawAsCsv(dataStore.rawPowerMeasurements);
        });
    }

    // TCX export
    if (elements.exportButtons.tcx) {
        elements.exportButtons.tcx.addEventListener('click', () => {
            try {
                exportAsTcx(dataStore.powerData);
            } catch (error) {
                alert(`Error generating TCX file: ${error.message}`);
            }
        });
    }

    // Image export
    if (elements.exportButtons.image) {
        elements.exportButtons.image.addEventListener('click', async () => {
            try {
                await exportSummaryImage({
                    dataPoints: dataStore.powerData,
                    powerAverages: dataStore.getPowerAverages()
                });
            } catch (error) {
                alert(`Error generating summary image: ${error.message}`);
            }
        });
    }

    // Clear session
    if (elements.exportButtons.clearSession) {
        elements.exportButtons.clearSession.addEventListener('click', () => {
            const confirmed = confirm(
                'Are you sure you want to clear all session data? This action cannot be undone.'
            );
            if (confirmed) {
                dataStore.resetAllSessionData();
                alert('Session data cleared successfully!');
            }
        });
    }

    // Google Docs export
    if (elements.exportButtons.googleDocs) {
        elements.exportButtons.googleDocs.addEventListener('click', async () => {
            try {
                await exportToGoogleDocs({
                    powerData: dataStore.powerData,
                    powerAverages: dataStore.getPowerAverages(),
                    sessionStartTime: dataStore.sessionStartTime
                });
            } catch (error) {
                alert(`Error exporting to Google Docs: ${error.message}`);
            }
        });
    }

    // Google Sheets export
    if (elements.exportButtons.googleSheets) {
        elements.exportButtons.googleSheets.addEventListener('click', async () => {
            try {
                await exportToGoogleSheets({
                    powerData: dataStore.powerData,
                    rawMeasurements: dataStore.rawPowerMeasurements,
                    sessionStartTime: dataStore.sessionStartTime
                });
            } catch (error) {
                alert(`Error exporting to Google Sheets: ${error.message}`);
            }
        });
    }

    // Cloud authentication
    if (elements.exportButtons.googleAuth) {
        elements.exportButtons.googleAuth.addEventListener('click', async () => {
            try {
                if (isSignedInToGoogle()) {
                    await signOutFromGoogle();
                    updateCloudAuthButton(elements.exportButtons.googleAuth, false);
                } else {
                    const success = await authenticateWithGoogle();
                    updateCloudAuthButton(elements.exportButtons.googleAuth, success);
                }
            } catch (error) {
                alert(`Google authentication error: ${error.message}`);
            }
        });
    }

    // Google API configuration
    if (elements.exportButtons.configureGoogleApi) {
        elements.exportButtons.configureGoogleApi.addEventListener('click', () => {
            showGoogleApiConfigModal();
        });
    }

    // intervals.icu export
    if (elements.exportButtons.intervals) {
        elements.exportButtons.intervals.addEventListener('click', async () => {
            try {
                await exportToIntervals({
                    powerData: dataStore.powerData,
                    powerAverages: dataStore.getPowerAverages(),
                    sessionStartTime: dataStore.sessionStartTime
                });
                alert('Successfully exported to intervals.icu!');
            } catch (error) {
                alert(`Error exporting to intervals.icu: ${error.message}`);
            }
        });
    }

    // intervals.icu configuration
    if (elements.exportButtons.configureIntervals) {
        elements.exportButtons.configureIntervals.addEventListener('click', () => {
            showIntervalsConfigModal();
        });
    }
}

/**
 * Export power data to Google Docs as a formatted document
 * @async
 * @param {Object} data - Export data object
 * @param {Array} data.powerData - Array of power data points
 * @param {Object} data.powerAverages - Power averages object
 * @param {Date} data.sessionStartTime - Session start time
 * @returns {Promise<string>} Document ID of created Google Doc
 */
export async function exportToGoogleDocs(data) {
    try {
        // Ensure authentication
        if (!await authenticateWithGoogle()) {
            throw new Error('Google authentication required');
        }

        const { powerData, powerAverages, sessionStartTime } = data;
        const sessionDate = sessionStartTime ? new Date(sessionStartTime) : new Date();
        const documentTitle = `Power Meter Session - ${sessionDate.toLocaleDateString()}`;

        // Create document structure
        const documentContent = generateGoogleDocsContent(powerData, powerAverages, sessionDate);

        // Create the document
        const response = await window.gapi.client.docs.documents.create({
            resource: {
                title: documentTitle
            }
        });

        const documentId = response.result.documentId;

        // Add content to the document
        await window.gapi.client.docs.documents.batchUpdate({
            documentId: documentId,
            resource: {
                requests: documentContent
            }
        });

        // Open the document in a new tab
        const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
        window.open(documentUrl, '_blank');

        console.log('Successfully exported to Google Docs:', documentId);
        return documentId;
    } catch (error) {
        console.error('Error exporting to Google Docs:', error);
        throw new Error(`Failed to export to Google Docs: ${error.message}`);
    }
}

/**
 * Export power data to Google Sheets as a detailed spreadsheet
 * @async
 * @param {Object} data - Export data object
 * @param {Array} data.powerData - Array of power data points
 * @param {Array} data.rawMeasurements - Array of raw measurements
 * @param {Date} data.sessionStartTime - Session start time
 * @returns {Promise<string>} Spreadsheet ID of created Google Sheet
 */
export async function exportToGoogleSheets(data) {
    try {
        // Ensure authentication
        if (!await authenticateWithGoogle()) {
            throw new Error('Google authentication required');
        }

        const { powerData, rawMeasurements, sessionStartTime } = data;
        const sessionDate = sessionStartTime ? new Date(sessionStartTime) : new Date();
        const spreadsheetTitle = `Power Meter Data - ${sessionDate.toLocaleDateString()}`;

        // Create the spreadsheet
        const response = await window.gapi.client.sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: spreadsheetTitle
                },
                sheets: [
                    {
                        properties: {
                            title: 'Summary Data',
                            gridProperties: {
                                rowCount: Math.max(1000, powerData.length + 10),
                                columnCount: 10
                            }
                        }
                    },
                    {
                        properties: {
                            title: 'Raw Measurements',
                            gridProperties: {
                                rowCount: Math.max(1000, rawMeasurements.length + 10),
                                columnCount: 8
                            }
                        }
                    }
                ]
            }
        });

        const spreadsheetId = response.result.spreadsheetId;

        // Prepare data for sheets
        const summaryData = generateSheetsData(powerData, 'summary');
        const rawData = generateSheetsData(rawMeasurements, 'raw');

        // Update the sheets with data
        await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: [
                    {
                        range: 'Summary Data!A1',
                        values: summaryData
                    },
                    {
                        range: 'Raw Measurements!A1',
                        values: rawData
                    }
                ]
            }
        });

        // Apply formatting
        await formatGoogleSheet(spreadsheetId);

        // Open the spreadsheet in a new tab
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        window.open(spreadsheetUrl, '_blank');

        console.log('Successfully exported to Google Sheets:', spreadsheetId);
        return spreadsheetId;
    } catch (error) {
        console.error('Error exporting to Google Sheets:', error);
        throw new Error(`Failed to export to Google Sheets: ${error.message}`);
    }
}

/* ==========================================================================
   Google Docs Content Generation
   ========================================================================== */

/**
 * Generate Google Docs document content with rich formatting
 * @param {Array} powerData - Array of power data points
 * @param {Object} powerAverages - Power averages object
 * @param {Date} sessionDate - Session date
 * @returns {Array} Array of Google Docs API requests
 */
function generateGoogleDocsContent(powerData, powerAverages, sessionDate) {
    const requests = [];
    let insertIndex = 1;

    // Document title and header
    const headerText = `Power Meter Session Report\n${sessionDate.toLocaleDateString()} ${sessionDate.toLocaleTimeString()}\n\n`;
    requests.push({
        insertText: {
            location: { index: insertIndex },
            text: headerText
        }
    });
    insertIndex += headerText.length;

    // Format header
    requests.push({
        updateTextStyle: {
            range: {
                startIndex: 1,
                endIndex: headerText.indexOf('\n')
            },
            textStyle: {
                bold: true,
                fontSize: { magnitude: 18, unit: 'PT' }
            },
            fields: 'bold,fontSize'
        }
    });

    // Session Summary
    const summaryText = generateSessionSummary(powerData, powerAverages);
    requests.push({
        insertText: {
            location: { index: insertIndex },
            text: summaryText
        }
    });
    insertIndex += summaryText.length;

    // Data table
    if (powerData.length > 0) {
        const tableData = generateDocumentTable(powerData);
        requests.push({
            insertTable: {
                location: { index: insertIndex },
                rows: tableData.length,
                columns: tableData[0].length
            }
        });

        // Fill table with data (simplified for document formatting)
        // Note: Actual table insertion would require more complex API calls
        insertIndex += 50; // Approximate offset for table content
    }

    return requests;
}

/**
 * Generate session summary text for Google Docs
 * @param {Array} powerData - Array of power data points
 * @param {Object} powerAverages - Power averages object
 * @returns {string} Formatted summary text
 */
function generateSessionSummary(powerData, powerAverages) {
    if (powerData.length === 0) {
        return "Session Summary\n\nNo data recorded during this session.\n\n";
    }

    const duration = calculateSessionDuration(powerData);
    const stats = calculateSessionStats(powerData);

    let summary = "Session Summary\n\n";
    summary += `Duration: ${formatDuration(duration)}\n`;
    summary += `Total Data Points: ${powerData.length}\n`;
    summary += `Average Power: ${stats.avgPower.toFixed(1)} W\n`;
    summary += `Maximum Power: ${stats.maxPower} W\n`;
    summary += `Minimum Power: ${stats.minPower} W\n`;

    if (stats.avgHeartRate > 0) {
        summary += `Average Heart Rate: ${stats.avgHeartRate.toFixed(0)} BPM\n`;
        summary += `Maximum Heart Rate: ${stats.maxHeartRate} BPM\n`;
    }

    if (stats.avgCadence > 0) {
        summary += `Average Cadence: ${stats.avgCadence.toFixed(0)} RPM\n`;
        summary += `Maximum Cadence: ${stats.maxCadence} RPM\n`;
    }

    if (powerAverages) {
        summary += "\nPower Averages:\n";
        if (powerAverages.fiveSecond) summary += `5-second: ${powerAverages.fiveSecond.toFixed(1)} W\n`;
        if (powerAverages.thirtySecond) summary += `30-second: ${powerAverages.thirtySecond.toFixed(1)} W\n`;
        if (powerAverages.oneMinute) summary += `1-minute: ${powerAverages.oneMinute.toFixed(1)} W\n`;
        if (powerAverages.fiveMinute) summary += `5-minute: ${powerAverages.fiveMinute.toFixed(1)} W\n`;
    }

    return summary + "\n\nDetailed Data\n\n";
}

/**
 * Generate table data for Google Docs
 * @param {Array} powerData - Array of power data points
 * @returns {Array<Array>} 2D array representing table data
 */
function generateDocumentTable(powerData) {
    const table = [
        ['Time', 'Power (W)', 'Heart Rate (BPM)', 'Cadence (RPM)']
    ];

    powerData.slice(0, 50).forEach(point => { // Limit to first 50 points for document
        const time = new Date(point.timestamp).toLocaleTimeString();
        table.push([
            time,
            point.power || '--',
            point.heartRate || '--',
            point.cadence || '--'
        ]);
    });

    if (powerData.length > 50) {
        table.push(['...', '...', '...', '...']);
        table.push([`${powerData.length} total data points`, '', '', '']);
    }

    return table;
}

/* ==========================================================================
   Google Sheets Content Generation
   ========================================================================== */

/**
 * Generate data for Google Sheets
 * @param {Array} data - Array of data points
 * @param {string} type - Type of data ('summary' or 'raw')
 * @returns {Array<Array>} 2D array for Google Sheets
 */
function generateSheetsData(data, type) {
    if (type === 'summary') {
        return generateSummarySheetData(data);
    } else if (type === 'raw') {
        return generateRawSheetData(data);
    }
    return [];
}

/**
 * Generate summary sheet data
 * @param {Array} powerData - Array of power data points
 * @returns {Array<Array>} 2D array for summary sheet
 */
function generateSummarySheetData(powerData) {
    const headers = ['Timestamp', 'Power (W)', 'Heart Rate (BPM)', 'Cadence (RPM)', 'Time (s)'];
    const rows = [headers];

    powerData.forEach((point, index) => {
        const timestamp = new Date(point.timestamp).toISOString();
        const timeSeconds = index; // Approximate time in seconds

        rows.push([
            timestamp,
            point.power || '',
            point.heartRate || '',
            point.cadence || '',
            timeSeconds
        ]);
    });

    return rows;
}

/**
 * Generate raw measurements sheet data
 * @param {Array} rawMeasurements - Array of raw measurement data
 * @returns {Array<Array>} 2D array for raw measurements sheet
 */
function generateRawSheetData(rawMeasurements) {
    const headers = ['Timestamp', 'Flags', 'Data Length', 'Instantaneous Power', 'Raw Bytes'];
    const rows = [headers];

    rawMeasurements.forEach(measurement => {
        const timestamp = new Date(measurement.timestamp).toISOString();

        rows.push([
            timestamp,
            measurement.flags || '',
            measurement.dataLength || '',
            measurement.instantaneousPower || '',
            measurement.rawBytes || ''
        ]);
    });

    return rows;
}

/**
 * Apply formatting to Google Sheets
 * @async
 * @param {string} spreadsheetId - Spreadsheet ID
 * @returns {Promise<void>}
 */
async function formatGoogleSheet(spreadsheetId) {
    try {
        const requests = [
            // Format headers
            {
                repeatCell: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 0,
                        endRowIndex: 1
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                            textFormat: { bold: true }
                        }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)'
                }
            },
            // Format headers for second sheet
            {
                repeatCell: {
                    range: {
                        sheetId: 1,
                        startRowIndex: 0,
                        endRowIndex: 1
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                            textFormat: { bold: true }
                        }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)'
                }
            },
            // Auto-resize columns
            {
                autoResizeDimensions: {
                    dimensions: {
                        sheetId: 0,
                        dimension: 'COLUMNS',
                        startIndex: 0,
                        endIndex: 5
                    }
                }
            },
            {
                autoResizeDimensions: {
                    dimensions: {
                        sheetId: 1,
                        dimension: 'COLUMNS',
                        startIndex: 0,
                        endIndex: 5
                    }
                }
            }
        ];

        await window.gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: { requests }
        });
    } catch (error) {
        console.warn('Failed to apply formatting to Google Sheet:', error);
    }
}

/* ==========================================================================
   Utility Functions for Cloud Exports
   ========================================================================== */

/**
 * Calculate session duration from power data
 * @param {Array} powerData - Array of power data points
 * @returns {number} Duration in milliseconds
 */
function calculateSessionDuration(powerData) {
    if (powerData.length < 2) return 0;

    const firstTimestamp = new Date(powerData[0].timestamp).getTime();
    const lastTimestamp = new Date(powerData[powerData.length - 1].timestamp).getTime();

    return lastTimestamp - firstTimestamp;
}

/**
 * Calculate session statistics
 * @param {Array} powerData - Array of power data points
 * @returns {Object} Statistics object
 */
function calculateSessionStats(powerData) {
    if (powerData.length === 0) {
        return {
            avgPower: 0, maxPower: 0, minPower: 0,
            avgHeartRate: 0, maxHeartRate: 0,
            avgCadence: 0, maxCadence: 0
        };
    }

    const powers = powerData.map(p => p.power || 0).filter(p => p > 0);
    const heartRates = powerData.map(p => p.heartRate || 0).filter(hr => hr > 0);
    const cadences = powerData.map(p => p.cadence || 0).filter(c => c > 0);

    return {
        avgPower: powers.length > 0 ? powers.reduce((a, b) => a + b, 0) / powers.length : 0,
        maxPower: powers.length > 0 ? Math.max(...powers) : 0,
        minPower: powers.length > 0 ? Math.min(...powers) : 0,
        avgHeartRate: heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0,
        maxHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : 0,
        avgCadence: cadences.length > 0 ? cadences.reduce((a, b) => a + b, 0) / cadences.length : 0,
        maxCadence: cadences.length > 0 ? Math.max(...cadences) : 0
    };
}

/**
 * Format duration in a human-readable format
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(duration) {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Update cloud authentication button state
 * @param {HTMLElement} button - The authentication button element
 * @param {boolean} isSignedIn - Whether user is signed in
 */
function updateCloudAuthButton(button, isSignedIn) {
    if (!button) return;

    if (isSignedIn) {
        button.textContent = '🔗 Sign Out from Google';
        button.classList.add('signed-in');
        button.setAttribute('aria-label', 'Sign out from Google account');
    } else {
        button.textContent = '🔗 Sign In to Google';
        button.classList.remove('signed-in');
        button.setAttribute('aria-label', 'Sign in to Google account for cloud exports');
    }
}

/**
 * Show Google API configuration modal
 */
function showGoogleApiConfigModal() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'config-modal';
    modal.style.cssText = `
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        color: white;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    // Get current values
    const currentClientId = localStorage.getItem('google_client_id') || '';
    const currentApiKey = localStorage.getItem('google_api_key') || '';

    modal.innerHTML = `
        <h3 style="margin: 0 0 1.5rem 0; color: #4CAF50;">Google API Configuration</h3>
        <p style="margin-bottom: 1.5rem; color: #ccc; line-height: 1.5;">
            To enable cloud exports, you need to configure Google API credentials. 
            <a href="https://console.developers.google.com/" target="_blank" style="color: #4CAF50;">
                Get credentials from Google Cloud Console
            </a>
        </p>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                Google Client ID:
            </label>
            <input type="text" id="clientIdInput" value="${currentClientId}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="your-client-id.googleusercontent.com">
        </div>
        
        <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                Google API Key:
            </label>
            <input type="text" id="apiKeyInput" value="${currentApiKey}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="your-api-key">
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancelConfig" style="padding: 0.75rem 1.5rem; border: 1px solid #666; 
                                           background: transparent; color: white; border-radius: 6px; 
                                           cursor: pointer; transition: all 0.3s ease;">
                Cancel
            </button>
            <button id="saveConfig" style="padding: 0.75rem 1.5rem; border: none; 
                                         background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); 
                                         color: white; border-radius: 6px; cursor: pointer; 
                                         transition: all 0.3s ease; font-weight: 500;">
                Save & Reload
            </button>
        </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Handle button clicks
    modal.querySelector('#cancelConfig').addEventListener('click', () => {
        document.body.removeChild(backdrop);
    });

    modal.querySelector('#saveConfig').addEventListener('click', () => {
        const clientId = modal.querySelector('#clientIdInput').value.trim();
        const apiKey = modal.querySelector('#apiKeyInput').value.trim();

        if (clientId && apiKey) {
            localStorage.setItem('google_client_id', clientId);
            localStorage.setItem('google_api_key', apiKey);
            document.body.removeChild(backdrop);

            // Show success message and reload
            alert('Google API credentials saved successfully! The page will reload to apply changes.');
            window.location.reload();
        } else {
            alert('Please enter both Client ID and API Key.');
        }
    });

    // Handle backdrop click
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    });

    // Focus on first input
    setTimeout(() => {
        modal.querySelector('#clientIdInput').focus();
    }, 100);
}

/**
 * Show intervals.icu configuration modal
 */
function showIntervalsConfigModal() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'config-modal';
    modal.style.cssText = `
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        color: white;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    // Get current values
    const currentApiKey = localStorage.getItem('intervals_api_key') || '';
    const currentAthleteId = localStorage.getItem('intervals_athlete_id') || '';

    modal.innerHTML = `
        <h3 style="margin: 0 0 1.5rem 0; color: #FF6B35;">intervals.icu Configuration</h3>
        <p style="margin-bottom: 1.5rem; color: #ccc; line-height: 1.5;">
            Configure your intervals.icu credentials to export activities directly. 
            <a href="https://intervals.icu/settings" target="_blank" style="color: #FF6B35;">
                Get your API key from intervals.icu settings
            </a>
        </p>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                API Key:
            </label>
            <input type="text" id="intervalsApiKeyInput" value="${currentApiKey}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="your-intervals-api-key">
            <small style="color: #aaa; font-size: 0.8rem;">
                Found in intervals.icu → Settings → Developer
            </small>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                Athlete ID:
            </label>
            <input type="text" id="intervalsAthleteIdInput" value="${currentAthleteId}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="i123456">
            <small style="color: #aaa; font-size: 0.8rem;">
                Your athlete ID (usually starts with 'i' followed by numbers)
            </small>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancelIntervalsConfig" style="padding: 0.75rem 1.5rem; border: 1px solid #666; 
                                                    background: transparent; color: white; border-radius: 6px; 
                                                    cursor: pointer; transition: all 0.3s ease;">
                Cancel
            </button>
            <button id="saveIntervalsConfig" style="padding: 0.75rem 1.5rem; border: none; 
                                                   background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%); 
                                                   color: white; border-radius: 6px; cursor: pointer; 
                                                   transition: all 0.3s ease; font-weight: 500;">
                Save & Test
            </button>
        </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Handle button clicks
    modal.querySelector('#cancelIntervalsConfig').addEventListener('click', () => {
        document.body.removeChild(backdrop);
    });

    modal.querySelector('#saveIntervalsConfig').addEventListener('click', async () => {
        const apiKey = modal.querySelector('#intervalsApiKeyInput').value.trim();
        const athleteId = modal.querySelector('#intervalsAthleteIdInput').value.trim();

        if (apiKey && athleteId) {
            try {
                // Test the configuration
                const testResult = await testIntervalsConnection(apiKey, athleteId);

                if (testResult.success) {
                    localStorage.setItem('intervals_api_key', apiKey);
                    localStorage.setItem('intervals_athlete_id', athleteId);
                    initializeIntervalsConfig(apiKey, athleteId);

                    document.body.removeChild(backdrop);
                    alert(`intervals.icu configured successfully!\\nAthlete: ${testResult.athleteName || athleteId}`);
                } else {
                    alert(`Configuration test failed: ${testResult.error}`);
                }
            } catch (error) {
                alert(`Error testing configuration: ${error.message}`);
            }
        } else {
            alert('Please enter both API Key and Athlete ID.');
        }
    });

    // Handle backdrop click
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    });

    // Focus on first input
    setTimeout(() => {
        modal.querySelector('#intervalsApiKeyInput').focus();
    }, 100);
}

/**
 * Test intervals.icu connection with provided credentials
 * @async
 * @param {string} apiKey - intervals.icu API key
 * @param {string} athleteId - intervals.icu athlete ID
 * @returns {Promise<Object>} Test result object
 */
async function testIntervalsConnection(apiKey, athleteId) {
    try {
        const response = await fetch(`${INTERVALS_CONFIG.BASE_URL}/athlete/${athleteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: `API error: ${response.status} - ${errorText}`
            };
        }

        const athleteData = await response.json();
        return {
            success: true,
            athleteName: athleteData.name || athleteData.username,
            athleteData
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}