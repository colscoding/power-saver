/**
 * Power Saver Main Application
 * Coordinates all modules and manages the application state
 */

// Import all required modules
import { initializePWA } from "./pwa-install.js";
import { loadSessionData, saveSessionData, clearSessionData } from "./session-data.js";
import {
  initializePowerAveraging,
  addPowerReading,
  resetPowerAverages,
  updatePowerAveragesDisplay,
  recalculatePowerAveragesFromData
} from "./power-averaging.js";
import {
  elements,
  initializeElements,
  updatePowerValue,
  updateMetricDisplays,
  resetMetricDisplays,
  updateConnectButtonVisibility
} from "./ui-management.js";
import {
  connectPowerMeter,
  connectHeartRateMonitor,
  connectSpeedCadenceSensor,
  isPowerMeterConnected,
  isHeartRateConnected,
  isSpeedCadenceConnected,
  disconnectPowerMeter,
  disconnectHeartRate,
  disconnectSpeedCadence
} from "./bluetooth-connections.js";
import { setupExportMenuListeners } from "./export-modals.js";
import { showSessionRestoredNotification } from "./notifications.js";
import {
  setupHamburgerMenu,
  setupMenuItems,
  initializeSections
} from "./ui-event-handlers.js";
import { initializeMetricIcons } from "./metric-icons.js";

// Application state variables
let powerData = [];
let lastPowerValue = 0;
let lastHeartRateValue = 0;
let lastCadenceValue = 0;
let sessionStartTime = null;
let dataLoggerInterval = null;
let periodicSaveInterval = null;
let sessionRestored = false; // Track if session was restored

// Constants for data logging
const DATA_LOGGER_INTERVAL_MS = 100; // Log data every 100ms
const SESSION_SAVE_INTERVAL = 100; // Save session every 100 readings (10 seconds)
const PERIODIC_SAVE_INTERVAL_MS = 30000; // Save session every 30 seconds as backup

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

  // Reset power averages
  resetPowerAverages();

  // Reset last values
  lastPowerValue = 0;
  lastHeartRateValue = 0;
  lastCadenceValue = 0;
  sessionStartTime = null;
  sessionRestored = false;

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
  get lastPowerValue() { return lastPowerValue; },
  get lastHeartRateValue() { return lastHeartRateValue; },
  get lastCadenceValue() { return lastCadenceValue; },
  get sessionStartTime() { return sessionStartTime; },
  resetAllSessionData,
  elements
};

// Bluetooth connection callbacks
const powerMeterCallbacks = {
  onPowerMeasurement: (power) => {
    updatePowerValue(power);
    lastPowerValue = power;

    // Add power reading to averaging calculations
    addPowerReading(power);
  },
  onDisconnected: () => {
    resetMetricDisplays();
    // Only reset power averages if we don't have historical data
    if (powerData.length === 0) {
      resetPowerAverages();
    }
    if (dataLoggerInterval) {
      clearInterval(dataLoggerInterval);
      dataLoggerInterval = null;
    }
    lastPowerValue = 0;
    updateAllConnectButtonVisibility();
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
  },
  onDisconnected: () => {
    updateAllConnectButtonVisibility();
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
  },
  onDisconnected: () => {
    updateAllConnectButtonVisibility();
  }
};

/**
 * Update all connect button visibility based on current connection states
 */
function updateAllConnectButtonVisibility() {
  updateConnectButtonVisibility({
    powerMeter: isPowerMeterConnected(),
    heartRate: isHeartRateConnected(),
    speedCadence: isSpeedCadenceConnected()
  });
}

/**
 * Setup connection button event listeners
 */
function setupConnectionEventListeners() {
  // Power meter connection
  if (elements.powerMeterConnectButton) {
    elements.powerMeterConnectButton.addEventListener('click', async () => {
      // Check if already connected - if so, show disconnect confirmation
      if (isPowerMeterConnected()) {
        const shouldDisconnect = confirm('Disconnect power meter?');
        if (shouldDisconnect) {
          disconnectPowerMeter();
        }
        return;
      }

      // Only reset data if session was not restored
      if (!sessionRestored) {
        powerData.length = 0;
        lastPowerValue = 0;
        resetPowerAverages();
      }

      if (dataLoggerInterval) {
        clearInterval(dataLoggerInterval);
      }

      const connected = await connectPowerMeter(powerMeterCallbacks, elements);

      if (connected) {
        // Start session if this is the first connection and no session was restored
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

          // Save session data periodically (every 100 readings = 10 seconds)
          if (powerData.length % SESSION_SAVE_INTERVAL === 0) {
            saveSessionData(dataStore);
          }
        }, DATA_LOGGER_INTERVAL_MS);

        // Clear the sessionRestored flag after first connection
        sessionRestored = false;

        // Update button visibility
        updateAllConnectButtonVisibility();
      }
    });
  }

  // Heart rate monitor connection
  if (elements.hrConnectButton) {
    elements.hrConnectButton.addEventListener('click', async () => {
      // Check if already connected - if so, show disconnect confirmation
      if (isHeartRateConnected()) {
        const shouldDisconnect = confirm('Disconnect heart rate monitor?');
        if (shouldDisconnect) {
          disconnectHeartRate();
        }
        return;
      }

      const connected = await connectHeartRateMonitor(heartRateCallbacks, elements);
      if (connected) {
        updateAllConnectButtonVisibility();
      }
    });
  }

  // Speed/cadence sensor connection
  if (elements.speedCadenceConnectButton) {
    elements.speedCadenceConnectButton.addEventListener('click', async () => {
      // Check if already connected - if so, show disconnect confirmation
      if (isSpeedCadenceConnected()) {
        const shouldDisconnect = confirm('Disconnect cadence sensor?');
        if (shouldDisconnect) {
          disconnectSpeedCadence();
        }
        return;
      }

      const connected = await connectSpeedCadenceSensor(cadenceCallbacks, elements);
      if (connected) {
        updateAllConnectButtonVisibility();
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
    const dataCount = sessionData.powerData?.length || 0;

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
      sessionRestored = false;
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
        sessionRestored = false;
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

    // Restore last values
    if (sessionData.lastPowerValue !== undefined) lastPowerValue = sessionData.lastPowerValue;
    if (sessionData.lastHeartRateValue !== undefined) lastHeartRateValue = sessionData.lastHeartRateValue;
    if (sessionData.lastCadenceValue !== undefined) lastCadenceValue = sessionData.lastCadenceValue;
    if (sessionData.sessionStartTime !== undefined) sessionStartTime = sessionData.sessionStartTime;

    // Mark that session was restored
    sessionRestored = true;

    // Recalculate power averages from restored data
    if (powerData.length > 0) {
      recalculatePowerAveragesFromData(powerData);
    }

    // Update displays with restored data
    updateDisplaysFromRestoredData();

    console.log(`Session restored: ${powerData.length} data points from ${new Date(sessionStartTime).toLocaleString()}`);

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
  try {
    // Initialize all modules and DOM elements
    initializeElements();
    initializePowerAveraging();
    initializeSections(elements);
    initializeMetricIcons();

    // Setup all event listeners
    setupHamburgerMenu(elements);
    setupMenuItems(elements);
    setupConnectionEventListeners();
    setupExportMenuListeners(dataStore);

    // Initialize connect button visibility based on current connection states
    updateAllConnectButtonVisibility();    // Try to load previous session data
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
    window.addEventListener('beforeunload', handleAppCleanup);

    // Save session data periodically (every 30 seconds as backup)
    periodicSaveInterval = setInterval(() => {
      if (powerData.length > 0) {
        saveSessionData(dataStore);
      }
    }, PERIODIC_SAVE_INTERVAL_MS);

  } catch (error) {
    console.error('Failed to initialize application:', error);
    alert('Failed to initialize application. Please refresh the page.');
  }
}

/**
 * Clean up resources when app is closing
 */
function handleAppCleanup() {
  // Save session data
  if (powerData.length > 0) {
    saveSessionData(dataStore);
  }

  // Clear intervals
  if (dataLoggerInterval) {
    clearInterval(dataLoggerInterval);
    dataLoggerInterval = null;
  }

  if (periodicSaveInterval) {
    clearInterval(periodicSaveInterval);
    periodicSaveInterval = null;
  }
}

/**
 * Prevent accidental pull-to-refresh
 * Ask user for confirmation before refreshing the page
 */
function preventAccidentalRefresh() {
  let startY = 0;
  let isPulling = false;

  // Prevent pull-to-refresh gesture on mobile
  document.body.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].pageY;
      isPulling = true;
    }
  }, { passive: true });

  document.body.addEventListener('touchmove', (e) => {
    if (isPulling && window.scrollY === 0) {
      const currentY = e.touches[0].pageY;
      const pullDistance = currentY - startY;

      // If pulling down more than 10px, prevent default
      if (pullDistance > 10) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  document.body.addEventListener('touchend', () => {
    isPulling = false;
  });

  // Prevent default browser refresh behavior
  window.addEventListener('beforeunload', (e) => {
    // Only ask for confirmation if there's active data
    if (powerData.length > 0 || isPowerMeterConnected() || isHeartRateConnected() || isSpeedCadenceConnected()) {
      const message = 'You have active data or connections. Are you sure you want to refresh?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  });

  // Add CSS to prevent overscroll on body
  document.body.style.overscrollBehavior = 'contain';
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  preventAccidentalRefresh();
});

// Initialize PWA features (service worker, install prompt)
initializePWA();