/**
 * UI Management Module
 * Handles DOM element references, event listeners, and UI state management
 */

// DOM element references
export const elements = {
    // Main metric displays
    powerValueElement: null,
    hrValueElement: null,
    cadenceValueElement: null,

    // Device info displays
    deviceNameElement: null,
    cadenceDeviceName: null,

    // Status displays
    statusText: null,
    hrStatusText: null,
    cadenceStatusText: null,
    hrConnectionStatus: null,
    cadenceConnectionStatus: null,

    // Buttons
    powerMeterConnectButton: null,
    hrConnectButton: null,
    speedCadenceConnectButton: null,

    // Toggle elements
    powerAveragesSection: null,

    // Hamburger menu elements
    hamburgerBtn: null,
    menuDropdown: null,
    showInfoMenuItem: null
};

/**
 * Initialize all DOM element references
 */
export function initializeElements() {
    // Main metric displays
    elements.powerValueElement = document.getElementById('power-value');
    elements.hrValueElement = document.getElementById('hr-value');
    elements.cadenceValueElement = document.getElementById('cadence-value');

    // Device info displays
    elements.deviceNameElement = document.getElementById('device-name');
    elements.cadenceDeviceName = document.getElementById('cadenceDeviceName');

    // Status displays
    elements.statusText = document.getElementById('status');
    elements.hrStatusText = document.getElementById('hrStatus');
    elements.cadenceStatusText = document.getElementById('cadenceStatus');
    elements.hrConnectionStatus = document.getElementById('hrConnectionStatus');
    elements.cadenceConnectionStatus = document.getElementById('cadenceConnectionStatus');

    // Buttons
    elements.powerMeterConnectButton = document.getElementById('connectButton');
    elements.hrConnectButton = document.getElementById('hrConnectButton');
    elements.speedCadenceConnectButton = document.getElementById('speedCadenceConnectButton');

    // Toggle elements
    elements.powerAveragesSection = document.getElementById('powerAveragesSection');

    // Hamburger menu elements
    elements.hamburgerBtn = document.getElementById('hamburgerButton');
    elements.menuDropdown = document.getElementById('menuDropdown');
    elements.showInfoMenuItem = document.getElementById('showInfoMenuItem');

    // Initialize connection status to disconnected state
    if (elements.hrConnectionStatus) elements.hrConnectionStatus.textContent = 'Disconnected';
    if (elements.cadenceConnectionStatus) elements.cadenceConnectionStatus.textContent = 'Disconnected';
}

/**
 * Helper function to update power value with enhanced styling
 * @param {number|string} value - The power value to display
 */
export function updatePowerValue(value) {
    if (!elements.powerValueElement) return;

    const displayValue = value || '--';
    elements.powerValueElement.textContent = displayValue;
    elements.powerValueElement.setAttribute('data-value', displayValue);
}

/**
 * Update metric displays with current values
 * @param {Object} values - Object containing power, heartRate, and cadence values
 */
export function updateMetricDisplays(values) {
    if (values.power !== undefined && elements.powerValueElement) {
        elements.powerValueElement.textContent = values.power || '--';
    }

    if (values.heartRate !== undefined && elements.hrValueElement) {
        elements.hrValueElement.textContent = values.heartRate || '--';
    }

    if (values.cadence !== undefined && elements.cadenceValueElement) {
        elements.cadenceValueElement.textContent = values.cadence || '--';
    }
}

/**
 * Reset all metric displays to default values
 */
export function resetMetricDisplays() {
    if (elements.powerValueElement) elements.powerValueElement.textContent = '--';
    if (elements.hrValueElement) elements.hrValueElement.textContent = '--';
    if (elements.cadenceValueElement) elements.cadenceValueElement.textContent = '--';
}

/**
 * Update connect button visibility based on connection states
 * @param {Object} connectionStates - Object containing connection states
 * @param {boolean} connectionStates.powerMeter - Power meter connection state
 * @param {boolean} connectionStates.heartRate - Heart rate monitor connection state
 * @param {boolean} connectionStates.speedCadence - Speed/cadence sensor connection state
 */
export function updateConnectButtonVisibility(connectionStates) {
    // Update power meter connect button state
    if (elements.powerMeterConnectButton) {
        elements.powerMeterConnectButton.setAttribute('data-connected', connectionStates.powerMeter ? 'true' : 'false');
    }

    // Update heart rate connect button state
    if (elements.hrConnectButton) {
        elements.hrConnectButton.setAttribute('data-connected', connectionStates.heartRate ? 'true' : 'false');
    }

    // Update speed/cadence connect button state
    if (elements.speedCadenceConnectButton) {
        elements.speedCadenceConnectButton.setAttribute('data-connected', connectionStates.speedCadence ? 'true' : 'false');
    }

    // Update power averages section visibility based on power meter connection
    if (elements.powerAveragesSection) {
        elements.powerAveragesSection.setAttribute('data-connected', connectionStates.powerMeter ? 'true' : 'false');
    }
}

/**
 * Set a button to connecting state
 * @param {HTMLElement} button - The button element to update
 * @param {boolean} isConnecting - Whether the button is in connecting state
 */
export function setButtonConnectingState(button, isConnecting) {
    if (button) {
        button.setAttribute('data-connecting', isConnecting ? 'true' : 'false');
    }
}

/**
 * Get current date string for file naming
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}