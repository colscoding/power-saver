/**
 * Power Saver Main Application
 * Coordinates all modules and manages the application state
 */

// Import all required modules
import { loadSessionData, saveSessionData, clearSessionData } from "./session-data.js";
import {
  initializePowerAveraging,
  addPowerReading,
  resetPowerAverages,
  getPowerAverages,
  setPowerAverages,
  getPowerReadings,
  setPowerReadings,
  updateDisplay as updatePowerAveragesDisplay
} from "./power-averaging.js";
import {
  elements,
  initializeElements,
  updatePowerValue,
  updateMetricDisplays,
  resetMetricDisplays
} from "./ui-management.js";
import {
  connectPowerMeter,
  connectHeartRateMonitor,
  connectSpeedCadenceSensor,
  connectSpyMeter,
  disconnectSpyMeter,
  isSpyMeterConnected
} from "./bluetooth-connections.js";
import { setupExportEventListeners, initializeGoogleAPI, initializeIntervalsConfig, isIntervalsConfigured } from "./data-export.js";
import { showSessionRestoredNotification } from "./notifications.js";
import {
  setupHamburgerMenu,
  setupPowerAveragesToggle,
  setupMetricToggles,
  setupSectionToggles,
  setupSpyModeToggle,
  setupMenuItems,
  initializeSections
} from "./ui-event-handlers.js";

// Application state variables
let powerData = [];
let rawPowerMeasurements = [];
let heartData = [];
let cadenceData = [];
let lastPowerValue = 0;
let lastHeartRateValue = 0;
let lastCadenceValue = 0;
let sessionStartTime = null;
let dataLoggerInterval = null;

/**
 * Update displays after restoring session data
 */
function updateDisplaysFromRestoredData() {
  // Update current metric values
  updateMetricDisplays({
    power: lastPowerValue,
    heartRate: lastHeartRateValue,
    cadence: lastCadenceValue
  });

  // Update power averages display
  updatePowerAveragesDisplay();

  // Show session restoration notification
  if (powerData.length > 0) {
    showSessionRestoredNotification(powerData.length);
  }
}

/**
 * Reset all session data
 */
function resetAllSessionData() {
  // Clear all data arrays
  powerData.length = 0;
  heartData.length = 0;
  cadenceData.length = 0;
  rawPowerMeasurements.length = 0;

  // Reset power averages
  resetPowerAverages();

  // Reset last values
  lastPowerValue = 0;
  lastHeartRateValue = 0;
  lastCadenceValue = 0;
  sessionStartTime = null;

  // Update displays
  resetMetricDisplays();

  // Clear localStorage
  clearSessionData();
}

/**
 * Data store object to pass to modules that need access to application data
 */
const dataStore = {
  get powerData() { return powerData; },
  get rawPowerMeasurements() { return rawPowerMeasurements; },
  get heartData() { return heartData; },
  get cadenceData() { return cadenceData; },
  get lastPowerValue() { return lastPowerValue; },
  get lastHeartRateValue() { return lastHeartRateValue; },
  get lastCadenceValue() { return lastCadenceValue; },
  get sessionStartTime() { return sessionStartTime; },
  getPowerAverages,
  getPowerReadings,
  resetAllSessionData,
  elements
};

// Bluetooth connection callbacks
const powerMeterCallbacks = {
  onPowerMeasurement: (power, rawMeasurement) => {
    updatePowerValue(power);
    lastPowerValue = power;

    // Store raw measurement data
    rawPowerMeasurements.push(rawMeasurement);

    // Add power reading to averaging calculations
    addPowerReading(power);
  },
  onDisconnected: () => {
    resetMetricDisplays();
    resetPowerAverages();
    if (dataLoggerInterval) {
      clearInterval(dataLoggerInterval);
      dataLoggerInterval = null;
    }
    lastPowerValue = 0;
  },
  onStatusUpdate: (message) => {
    if (elements.statusText) {
      elements.statusText.textContent = message;
    }
  }
};

const heartRateCallbacks = {
  onHeartRateChange: (heartRate) => {
    if (elements.hrValueElement) {
      elements.hrValueElement.textContent = heartRate;
    }
    lastHeartRateValue = heartRate;
  },
  onStatusUpdate: (message) => {
    if (elements.hrStatusText) {
      elements.hrStatusText.textContent = message;
    }
  }
};

const cadenceCallbacks = {
  onCadenceChange: (cadence) => {
    if (elements.cadenceValueElement) {
      elements.cadenceValueElement.textContent = cadence;
    }
    lastCadenceValue = cadence;
  },
  onStatusUpdate: (message) => {
    if (elements.cadenceStatusText) {
      elements.cadenceStatusText.textContent = message;
    }
  }
};

/**
 * Setup connection button event listeners
 */
function setupConnectionEventListeners() {
  // Power meter connection
  if (elements.powerMeterConnectButton) {
    elements.powerMeterConnectButton.addEventListener('click', async () => {
      // Reset data from previous session
      powerData.length = 0;
      rawPowerMeasurements.length = 0;
      lastPowerValue = 0;
      resetPowerAverages();

      if (dataLoggerInterval) {
        clearInterval(dataLoggerInterval);
      }

      const connected = await connectPowerMeter(powerMeterCallbacks, elements);

      if (connected) {
        // Start session if this is the first connection
        if (!sessionStartTime) {
          sessionStartTime = Date.now();
        }

        // Start data logging
        dataLoggerInterval = setInterval(() => {
          powerData.push({
            timestamp: Date.now(),
            power: lastPowerValue,
            heartRate: lastHeartRateValue,
            cadence: lastCadenceValue,
          });

          // Save session data every 10 seconds
          if (powerData.length % 100 === 0) {
            // Every 100 readings = 10 seconds
            saveSessionData(dataStore);
          }
        }, 100);
      }
    });
  }

  // Heart rate monitor connection
  if (elements.hrConnectButton) {
    elements.hrConnectButton.addEventListener('click', async () => {
      await connectHeartRateMonitor(heartRateCallbacks, elements);
    });
  }

  // Speed/cadence sensor connection
  if (elements.speedCadenceConnectButton) {
    elements.speedCadenceConnectButton.addEventListener('click', async () => {
      await connectSpeedCadenceSensor(cadenceCallbacks, elements);
    });
  }

  // Spy mode connection
  if (elements.spyCard) {
    elements.spyCard.addEventListener('click', async () => {
      if (!isSpyMeterConnected()) {
        await connectSpyMeter({}, elements);
      } else {
        disconnectSpyMeter(elements);
      }
    });
  }
}

/**
 * Initialize cloud export functionality
 * @async
 * @returns {Promise<void>}
 */
async function initializeCloudExports() {
  try {
    // Initialize Google API
    const googleClientId = getGoogleClientId();
    const googleApiKey = getGoogleApiKey();

    if (googleClientId && googleApiKey) {
      console.log('Initializing Google API for cloud exports...');
      const success = await initializeGoogleAPI(googleClientId, googleApiKey);

      if (success) {
        console.log('Google API initialized successfully');
        enableCloudExportButtons();
      } else {
        console.warn('Failed to initialize Google API');
        disableCloudExportButtons('Failed to initialize Google API');
      }
    } else {
      console.info('Google API credentials not configured. Cloud exports disabled.');
      disableCloudExportButtons('Google API credentials not configured');
      showConfigurationHelp();
    }

    // Initialize intervals.icu
    const intervalsApiKey = getIntervalsApiKey();
    const intervalsAthleteId = getIntervalsAthleteId();

    if (intervalsApiKey && intervalsAthleteId) {
      console.log('Initializing intervals.icu configuration...');
      const success = initializeIntervalsConfig(intervalsApiKey, intervalsAthleteId);

      if (success) {
        console.log('intervals.icu configured successfully');
        enableIntervalsExportButtons();
      } else {
        console.warn('Failed to initialize intervals.icu configuration');
        disableIntervalsExportButtons('Failed to initialize intervals.icu');
      }
    } else {
      console.info('intervals.icu credentials not configured.');
      disableIntervalsExportButtons('intervals.icu credentials not configured');
    }
  } catch (error) {
    console.error('Error initializing cloud exports:', error);
    disableCloudExportButtons(`Error: ${error.message}`);
  }
}/**
 * Get Google Client ID from environment or configuration
 * @returns {string|null} Google Client ID
 */
function getGoogleClientId() {
  // Check localStorage and window configuration
  const clientId = localStorage.getItem('google_client_id') ||
    (typeof window !== 'undefined' && window.GOOGLE_CONFIG && window.GOOGLE_CONFIG.CLIENT_ID) ||
    null;

  // Clear sensitive data from global scope for security
  if (typeof window !== 'undefined' && window.GOOGLE_CONFIG) {
    delete window.GOOGLE_CONFIG.CLIENT_ID;
  }

  return clientId;
}

/**
 * Get Google API Key from environment or configuration
 * @returns {string|null} Google API Key
 */
function getGoogleApiKey() {
  // Check localStorage and window configuration
  const apiKey = localStorage.getItem('google_api_key') ||
    (typeof window !== 'undefined' && window.GOOGLE_CONFIG && window.GOOGLE_CONFIG.API_KEY) ||
    null;

  // Clear sensitive data from global scope for security
  if (typeof window !== 'undefined' && window.GOOGLE_CONFIG) {
    delete window.GOOGLE_CONFIG.API_KEY;
  }

  return apiKey;
}

/**
 * Get intervals.icu API Key from configuration
 * @returns {string|null} intervals.icu API Key
 */
function getIntervalsApiKey() {
  return localStorage.getItem('intervals_api_key') ||
    (typeof window !== 'undefined' && window.INTERVALS_CONFIG && window.INTERVALS_CONFIG.API_KEY) ||
    null;
}

/**
 * Get intervals.icu Athlete ID from configuration
 * @returns {string|null} intervals.icu Athlete ID
 */
function getIntervalsAthleteId() {
  return localStorage.getItem('intervals_athlete_id') ||
    (typeof window !== 'undefined' && window.INTERVALS_CONFIG && window.INTERVALS_CONFIG.ATHLETE_ID) ||
    null;
}

/**
 * Enable cloud export buttons
 */
function enableCloudExportButtons() {
  if (elements.exportButtons.googleDocs) {
    elements.exportButtons.googleDocs.disabled = false;
    elements.exportButtons.googleDocs.title = 'Export session report to Google Docs';
  }
  if (elements.exportButtons.googleSheets) {
    elements.exportButtons.googleSheets.disabled = false;
    elements.exportButtons.googleSheets.title = 'Export detailed data to Google Sheets';
  }
  if (elements.exportButtons.googleAuth) {
    elements.exportButtons.googleAuth.disabled = false;
  }
  if (elements.exportButtons.configureGoogleApi) {
    elements.exportButtons.configureGoogleApi.disabled = false;
  }
  // Enable intervals.icu buttons if configured
  if (isIntervalsConfigured()) {
    enableIntervalsExportButtons();
  }
}

/**
 * Disable cloud export buttons with reason
 * @param {string} reason - Reason for disabling
 */
function disableCloudExportButtons(reason) {
  if (elements.exportButtons.googleDocs) {
    elements.exportButtons.googleDocs.disabled = true;
    elements.exportButtons.googleDocs.title = `Disabled: ${reason}`;
  }
  if (elements.exportButtons.googleSheets) {
    elements.exportButtons.googleSheets.disabled = true;
    elements.exportButtons.googleSheets.title = `Disabled: ${reason}`;
  }
  if (elements.exportButtons.googleAuth) {
    elements.exportButtons.googleAuth.disabled = true;
    elements.exportButtons.googleAuth.title = `Disabled: ${reason}`;
  }
  // Keep config button enabled so users can configure
  if (elements.exportButtons.configureGoogleApi) {
    elements.exportButtons.configureGoogleApi.disabled = false;
    elements.exportButtons.configureGoogleApi.title = 'Configure Google API credentials';
  }
}

/**
 * Enable intervals.icu export buttons
 */
function enableIntervalsExportButtons() {
  if (elements.exportButtons.intervals) {
    elements.exportButtons.intervals.disabled = false;
    elements.exportButtons.intervals.title = 'Export activity to intervals.icu';
  }
  if (elements.exportButtons.configureIntervals) {
    elements.exportButtons.configureIntervals.disabled = false;
    elements.exportButtons.configureIntervals.title = 'Configure intervals.icu credentials';
  }
}

/**
 * Disable intervals.icu export buttons with reason
 * @param {string} reason - Reason for disabling
 */
function disableIntervalsExportButtons(reason) {
  if (elements.exportButtons.intervals) {
    elements.exportButtons.intervals.disabled = true;
    elements.exportButtons.intervals.title = `Disabled: ${reason}`;
  }
  // Keep config button enabled so users can configure
  if (elements.exportButtons.configureIntervals) {
    elements.exportButtons.configureIntervals.disabled = false;
    elements.exportButtons.configureIntervals.title = 'Configure intervals.icu credentials';
  }
}

/**
 * Show configuration help for Google API setup
 */
function showConfigurationHelp() {
  // Add a subtle notice about configuration
  const cloudSection = document.querySelector('.cloud-export-section');
  if (cloudSection && !cloudSection.querySelector('.config-notice')) {
    const notice = document.createElement('div');
    notice.className = 'config-notice';
    notice.innerHTML = `
      <p style="font-size: 0.9rem; color: #FFB74D; margin: 0.5rem 0; text-align: center;">
        💡 To enable cloud exports, configure Google API credentials in the browser console:<br>
        <code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 3px;">
          localStorage.setItem('google_client_id', 'your-client-id');<br>
          localStorage.setItem('google_api_key', 'your-api-key');
        </code>
      </p>
    `;
    cloudSection.appendChild(notice);
  }
}
/**
 * Session restoration functionality
 */

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
    const dataCount =
      (sessionData.powerData?.length || 0) +
      (sessionData.heartData?.length || 0) +
      (sessionData.cadenceData?.length || 0);

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
      clearSessionData();
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

/**
 * Apply session data to restore the session
 */
function restoreSessionData(sessionData) {
  try {
    // Restore data arrays
    if (sessionData.powerData) {
      powerData.length = 0;
      powerData.push(...sessionData.powerData);
    }
    if (sessionData.heartData) {
      heartData.length = 0;
      heartData.push(...sessionData.heartData);
    }
    if (sessionData.cadenceData) {
      cadenceData.length = 0;
      cadenceData.push(...sessionData.cadenceData);
    }
    if (sessionData.rawPowerMeasurements) {
      rawPowerMeasurements.length = 0;
      rawPowerMeasurements.push(...sessionData.rawPowerMeasurements);
    }
    if (sessionData.powerReadings) {
      setPowerReadings(sessionData.powerReadings);
    }

    // Restore power averages completely
    if (sessionData.powerAverages) {
      setPowerAverages(sessionData.powerAverages);
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
 * Initialize the application
 */
async function initializeApp() {
  // Initialize all modules and DOM elements
  initializeElements();
  initializePowerAveraging();
  initializeSections(elements);

  // Setup all event listeners
  setupHamburgerMenu(elements);
  setupPowerAveragesToggle(elements);
  setupMetricToggles(elements);
  setupSectionToggles(elements);
  setupSpyModeToggle(elements, () => disconnectSpyMeter(elements));
  setupMenuItems(elements);
  setupConnectionEventListeners();
  setupExportEventListeners(dataStore);

  // Initialize Google API for cloud exports (optional)
  await initializeCloudExports();

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

  // Save session data when page is about to be closed/refreshed
  window.addEventListener('beforeunload', function () {
    if (powerData.length > 0) {
      saveSessionData(dataStore);
    }
  });

  // Save session data periodically (every 30 seconds as backup)
  setInterval(() => {
    if (powerData.length > 0) {
      saveSessionData(dataStore);
    }
  }, 30000);
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);