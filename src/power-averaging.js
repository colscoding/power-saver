/**
 * Power Averaging Module
 * Handles power data collection, averaging calculations, and display updates
 */

// Power averaging data structures
let powerReadings = []; // Array to store timestamped power readings
let powerAverages = {
    '10s': { current: 0, best: 0 },
    '30s': { current: 0, best: 0 },
    '1m': { current: 0, best: 0 },
    '2m': { current: 0, best: 0 },
    '4m': { current: 0, best: 0 },
    '8m': { current: 0, best: 0 },
};

// DOM elements for power averages display
let avg10sCurrentElement, avg10sBestElement;
let avg30sCurrentElement, avg30sBestElement;
let avg1mCurrentElement, avg1mBestElement;
let avg2mCurrentElement, avg2mBestElement;
let avg4mCurrentElement, avg4mBestElement;
let avg8mCurrentElement, avg8mBestElement;

/**
 * Initialize power averaging system with DOM elements
 */
export function initializePowerAveraging() {
    // Get DOM elements
    avg10sCurrentElement = document.getElementById('avg10s-current');
    avg10sBestElement = document.getElementById('avg10s-best');
    avg30sCurrentElement = document.getElementById('avg30s-current');
    avg30sBestElement = document.getElementById('avg30s-best');
    avg1mCurrentElement = document.getElementById('avg1m-current');
    avg1mBestElement = document.getElementById('avg1m-best');
    avg2mCurrentElement = document.getElementById('avg2m-current');
    avg2mBestElement = document.getElementById('avg2m-best');
    avg4mCurrentElement = document.getElementById('avg4m-current');
    avg4mBestElement = document.getElementById('avg4m-best');
    avg8mCurrentElement = document.getElementById('avg8m-current');
    avg8mBestElement = document.getElementById('avg8m-best');
}

/**
 * Add a new power reading to the averaging calculations
 * @param {number} power - The instantaneous power value
 */
export function addPowerReading(power) {
    const now = Date.now();
    powerReadings.push({ timestamp: now, power: power });

    // Keep only the last 8 minutes of readings (plus some buffer)
    const eightMinutesAgo = now - 9 * 60 * 1000; // 9 minutes to be safe
    powerReadings = powerReadings.filter((reading) => reading.timestamp > eightMinutesAgo);

    // Calculate current averages
    calculatePowerAverages();
    updatePowerAveragesDisplay();
}

/**
 * Calculate power averages for all time periods
 */
function calculatePowerAverages() {
    const now = Date.now();
    const periods = {
        '10s': 10 * 1000,
        '30s': 30 * 1000,
        '1m': 60 * 1000,
        '2m': 120 * 1000,
        '4m': 240 * 1000,
        '8m': 480 * 1000,
    };

    for (const [periodKey, periodMs] of Object.entries(periods)) {
        const cutoffTime = now - periodMs;
        const relevantReadings = powerReadings.filter((reading) => reading.timestamp >= cutoffTime);

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

/**
 * Update the power averages display in the UI
 */
function updatePowerAveragesDisplay() {
    if (!avg10sCurrentElement) return; // Elements not initialized

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

/**
 * Reset all power averages to zero
 */
export function resetPowerAverages() {
    powerReadings = [];
    for (const period of Object.keys(powerAverages)) {
        powerAverages[period].current = 0;
        powerAverages[period].best = 0;
    }
    updatePowerAveragesDisplay();
}

/**
 * Get current power averages data
 * @returns {Object} Current power averages object
 */
export function getPowerAverages() {
    return { ...powerAverages };
}

/**
 * Set power averages data (used for session restoration)
 * @param {Object} averages - Power averages object to restore
 */
export function setPowerAverages(averages) {
    Object.assign(powerAverages, averages);
    updatePowerAveragesDisplay();
}

/**
 * Get power readings data
 * @returns {Array} Current power readings array
 */
export function getPowerReadings() {
    return [...powerReadings];
}

/**
 * Set power readings data (used for session restoration)
 * @param {Array} readings - Power readings array to restore
 */
export function setPowerReadings(readings) {
    powerReadings = [...readings];
}

/**
 * Force update of power averages display
 */
export function updateDisplay() {
    updatePowerAveragesDisplay();
}