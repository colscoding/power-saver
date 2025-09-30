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
import { setupExportEventListeners } from "./data-export.js";
import { showSessionRestoredNotification } from "./notifications.js";
import {
  setupHamburgerMenu,
  setupPowerAveragesToggle,
  setupMetricToggles,
  setupSectionToggles,
  setupSpyModeToggle,
  setupMenuItems,
  setupSectionCollapseToggles,
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
  setupSectionCollapseToggles(elements);
  setupConnectionEventListeners();
  setupExportEventListeners(dataStore);

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