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
    hrDeviceName: null,
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
    exportButtons: {
        json: null,
        csv: null,
        tcx: null,
        rawJson: null,
        rawCsv: null,
        image: null,
        clearSession: null
    },

    // Toggle elements
    powerAveragesSection: null,

    // Hamburger menu elements
    hamburgerBtn: null,
    menuDropdown: null,
    powerAveragesToggle: null,
    powerMetricToggle: null,
    heartRateMetricToggle: null,
    cadenceMetricToggle: null,
    showInfoMenuItem: null,
    spyModeToggle: null,

    // Metric card elements
    powerCard: null,
    heartRateCard: null,
    cadenceCard: null,
    spyCard: null,
    spyModeSection: null,

    // Spy mode elements
    spyValueElement: null,
    spyStatusElement: null,
    spyInstructionsElement: null
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
    elements.hrDeviceName = document.getElementById('hrDeviceName');
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
    elements.powerAveragesToggle = document.getElementById('powerAveragesToggle');
    elements.powerMetricToggle = document.getElementById('powerMetricToggle');
    elements.heartRateMetricToggle = document.getElementById('heartRateMetricToggle');
    elements.cadenceMetricToggle = document.getElementById('cadenceMetricToggle');
    elements.showInfoMenuItem = document.getElementById('showInfoMenuItem');
    elements.spyModeToggle = document.getElementById('spyModeToggle');

    // Metric card elements
    elements.powerCard = document.querySelector('.power-card');
    elements.heartRateCard = document.querySelector('.hr-card');
    elements.cadenceCard = document.querySelector('.cadence-card');
    elements.spyCard = document.querySelector('.spy-card');
    elements.spyModeSection = document.getElementById('spyModeSection');

    // Spy mode elements
    elements.spyValueElement = document.getElementById('spy-value');
    elements.spyStatusElement = document.getElementById('spyStatus');
    elements.spyInstructionsElement = document.getElementById('spyInstructions');

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
    if (values.power !== undefined) {
        updatePowerValue(values.power);
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
    updatePowerValue('--');
    if (elements.hrValueElement) elements.hrValueElement.textContent = '--';
    if (elements.cadenceValueElement) elements.cadenceValueElement.textContent = '--';
}

/**
 * Update connect button visibility based on device connection status
 * @param {Object} connectionStates - Object containing connection states for each device type
 * @param {boolean} connectionStates.powerMeter - Power meter connection state
 * @param {boolean} connectionStates.heartRate - Heart rate monitor connection state
 * @param {boolean} connectionStates.speedCadence - Speed/cadence sensor connection state
 */
export function updateConnectButtonVisibility(connectionStates) {
    // Hide/show power meter connect button
    if (elements.powerMeterConnectButton) {
        elements.powerMeterConnectButton.style.display = connectionStates.powerMeter ? 'none' : 'block';
    }

    // Hide/show heart rate connect button
    if (elements.hrConnectButton) {
        elements.hrConnectButton.style.display = connectionStates.heartRate ? 'none' : 'block';
    }

    // Hide/show speed/cadence connect button
    if (elements.speedCadenceConnectButton) {
        elements.speedCadenceConnectButton.style.display = connectionStates.speedCadence ? 'none' : 'block';
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