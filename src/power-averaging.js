/**
 * Power Averaging Module
 * Handles power data collection, averaging calculations, and display updates
 */

// Constants for time periods
const TIME_PERIODS_MS = {
    '10s': 10 * 1000,
    '20s': 20 * 1000,
    '30s': 30 * 1000,
    '40s': 40 * 1000,
    '50s': 50 * 1000,
    '1m': 60 * 1000,
    '2m': 120 * 1000,
    '3m': 180 * 1000,
    '4m': 240 * 1000,
    '5m': 300 * 1000,
};

const RETENTION_BUFFER_MS = 6 * 60 * 1000; // Keep 6 minutes of data (5 min max period + buffer)

// Power averaging data structures
let powerReadings = []; // Array to store timestamped power readings
const currentTenSecondReadings = [];
const tenSecondAverages = [];
let powerAverages = {
    '10s': { current: 0, best: 0 },
    '20s': { current: 0, best: 0 },
    '30s': { current: 0, best: 0 },
    '40s': { current: 0, best: 0 },
    '50s': { current: 0, best: 0 },
    '1m': { current: 0, best: 0 },
    '2m': { current: 0, best: 0 },
    '3m': { current: 0, best: 0 },
    '4m': { current: 0, best: 0 },
    '5m': { current: 0, best: 0 },
};

// DOM elements for power averages display
let avg10sCurrentElement, avg10sBestElement;
let avg20sCurrentElement, avg20sBestElement;
let avg30sCurrentElement, avg30sBestElement;
let avg40sCurrentElement, avg40sBestElement;
let avg50sCurrentElement, avg50sBestElement;
let avg1mCurrentElement, avg1mBestElement;
let avg2mCurrentElement, avg2mBestElement;
let avg3mCurrentElement, avg3mBestElement;
let avg4mCurrentElement, avg4mBestElement;
let avg5mCurrentElement, avg5mBestElement;

/**
 * Initialize power averaging system with DOM elements
 */
export function initializePowerAveraging() {
    // Get DOM elements
    avg10sCurrentElement = document.getElementById('avg10s-current');
    avg10sBestElement = document.getElementById('avg10s-best');
    avg20sCurrentElement = document.getElementById('avg20s-current');
    avg20sBestElement = document.getElementById('avg20s-best');
    avg30sCurrentElement = document.getElementById('avg30s-current');
    avg30sBestElement = document.getElementById('avg30s-best');
    avg40sCurrentElement = document.getElementById('avg40s-current');
    avg40sBestElement = document.getElementById('avg40s-best');
    avg50sCurrentElement = document.getElementById('avg50s-current');
    avg50sBestElement = document.getElementById('avg50s-best');
    avg1mCurrentElement = document.getElementById('avg1m-current');
    avg1mBestElement = document.getElementById('avg1m-best');
    avg2mCurrentElement = document.getElementById('avg2m-current');
    avg2mBestElement = document.getElementById('avg2m-best');
    avg3mCurrentElement = document.getElementById('avg3m-current');
    avg3mBestElement = document.getElementById('avg3m-best');
    avg4mCurrentElement = document.getElementById('avg4m-current');
    avg4mBestElement = document.getElementById('avg4m-best');
    avg5mCurrentElement = document.getElementById('avg5m-current');
    avg5mBestElement = document.getElementById('avg5m-best');
}

/**
 * Add a new power reading to the averaging calculations
 * @param {number} power - The instantaneous power value
 */
export function addPowerReading(power) {
    // Validate input
    if (typeof power !== 'number' || isNaN(power)) {
        console.error('Invalid power reading: must be a number', power);
        return;
    }

    // Warn about unusual values but still process them
    if (power > 3000) {
        console.warn(`Unusually high power reading: ${power}W`);
    } else if (power < -500) {
        console.warn(`Unusually low power reading: ${power}W`);
    }

    const now = Date.now();
    powerReadings.push({ timestamp: now, power: power });

    // Keep only the last 5 minutes of readings (plus buffer to ensure we have enough data)
    const retentionCutoff = now - RETENTION_BUFFER_MS;
    powerReadings = powerReadings.filter((reading) => reading.timestamp > retentionCutoff);

    // Maintain current ten second readings for 10s average calculation
    currentTenSecondReadings.push({ timestamp: now, power: power });
    if (currentTenSecondReadings.length > 0 && currentTenSecondReadings[0].timestamp <= (now - 10 * 1000)) {
        // current 10s windows is filled
        const currPowerAverage = Math.round(currentTenSecondReadings.reduce((sum, r) => sum + r.power, 0) / currentTenSecondReadings.length);
        tenSecondAverages.push(currPowerAverage);
        // clear currentTenSecondReadings completely
        currentTenSecondReadings.splice(0, currentTenSecondReadings.length);
        while (tenSecondAverages.length > 30) { // keep last 5 minutes of 10s averages
            tenSecondAverages.shift();
        }

        for (const [periodKey, periodMs] of Object.entries(TIME_PERIODS_MS)) {
            const nWindows = Math.ceil(periodMs / (10 * 1000));
            if (tenSecondAverages.length >= nWindows) {
                const avgWindows = tenSecondAverages.slice(-nWindows);
                const sum = avgWindows.reduce((total, reading) => total + reading, 0);
                const average = Math.round(sum / nWindows);
                powerAverages[periodKey].current = average;

                // Update best if current is better
                if (average > powerAverages[periodKey].best) {
                    powerAverages[periodKey].best = average;
                }
            } else {
                powerAverages[periodKey].current = 0;
            }
        }
        updatePowerAveragesDisplay();
    }
}

/**
 * Update the power averages display in the UI
 */
export function updatePowerAveragesDisplay() {
    if (!avg10sCurrentElement) return; // Elements not initialized

    try {
        avg10sCurrentElement.textContent = powerAverages['10s'].current || '--';
        avg10sBestElement.textContent = powerAverages['10s'].best || '--';
        avg20sCurrentElement.textContent = powerAverages['20s'].current || '--';
        avg20sBestElement.textContent = powerAverages['20s'].best || '--';
        avg30sCurrentElement.textContent = powerAverages['30s'].current || '--';
        avg30sBestElement.textContent = powerAverages['30s'].best || '--';
        avg40sCurrentElement.textContent = powerAverages['40s'].current || '--';
        avg40sBestElement.textContent = powerAverages['40s'].best || '--';
        avg50sCurrentElement.textContent = powerAverages['50s'].current || '--';
        avg50sBestElement.textContent = powerAverages['50s'].best || '--';
        avg1mCurrentElement.textContent = powerAverages['1m'].current || '--';
        avg1mBestElement.textContent = powerAverages['1m'].best || '--';
        avg2mCurrentElement.textContent = powerAverages['2m'].current || '--';
        avg2mBestElement.textContent = powerAverages['2m'].best || '--';
        avg3mCurrentElement.textContent = powerAverages['3m'].current || '--';
        avg3mBestElement.textContent = powerAverages['3m'].best || '--';
        avg4mCurrentElement.textContent = powerAverages['4m'].current || '--';
        avg4mBestElement.textContent = powerAverages['4m'].best || '--';
        avg5mCurrentElement.textContent = powerAverages['5m'].current || '--';
        avg5mBestElement.textContent = powerAverages['5m'].best || '--';
    } catch (error) {
        console.error('Error updating power averages display:', error.message);
    }
}

/**
 * Recalculate power averages from restored data
 * @param {Array} restoredPowerData - Array of power data points with timestamp and power
 */
export function recalculatePowerAveragesFromData(restoredPowerData) {
    if (!Array.isArray(restoredPowerData) || restoredPowerData.length === 0) {
        return;
    }

    console.log(`Recalculating power averages from ${restoredPowerData.length} data points...`);

    // Reset current averages
    powerReadings = [];
    for (const period of Object.keys(powerAverages)) {
        powerAverages[period].current = 0;
        powerAverages[period].best = 0;
    }

    // Re-add all power readings to recalculate averages
    restoredPowerData.forEach(dataPoint => {
        if (dataPoint.power !== undefined && dataPoint.power !== null) {
            // Temporarily store as timestamped reading
            powerReadings.push({
                timestamp: dataPoint.timestamp,
                power: dataPoint.power
            });
        }
    });

    // Calculate best averages from the restored data
    calculateBestAveragesFromHistory();

    // Update the display
    updatePowerAveragesDisplay();

    console.log('Power averages recalculated');
}

/**
 * Calculate best averages from historical data
 */
function calculateBestAveragesFromHistory() {
    if (powerReadings.length === 0) return;

    // For each time period, scan through the data to find the best average
    for (const [period, durationMs] of Object.entries(TIME_PERIODS_MS)) {
        let bestAvg = 0;

        // Scan through the data with a sliding window
        for (let i = 0; i < powerReadings.length; i++) {
            const startTime = powerReadings[i].timestamp;
            const endTime = startTime + durationMs;

            // Collect all readings within this window
            const windowReadings = powerReadings.filter(r =>
                r.timestamp >= startTime && r.timestamp < endTime
            );

            if (windowReadings.length > 0) {
                // Calculate average for this window
                const sum = windowReadings.reduce((acc, r) => acc + r.power, 0);
                const avg = Math.round(sum / windowReadings.length);

                if (avg > bestAvg) {
                    bestAvg = avg;
                }
            }
        }

        powerAverages[period].best = bestAvg;
    }
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

