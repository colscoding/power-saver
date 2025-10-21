/**
 * Data Export Module
 * Handles all data export functionality including JSON, CSV, and TCX exports
 */

import { generateTcxString } from './create-tcx.js';
import { getCurrentDateString } from './ui-management.js';

// Constants for export operations
const EXPORT_DELAY_MS = 100; // Delay between downloads to prevent browser blocking
const MIME_TYPES = {
    JSON: 'application/json;charset=utf-8;',
    CSV: 'text/csv;charset=utf-8;',
    XML: 'application/vnd.garmin.tcx+xml;charset=utf-8;', // Garmin TCX specific MIME type
};

/**
 * Validate power data array and its contents
 * @param {Array} powerData - Array to validate
 * @returns {boolean} True if valid
 * @throws {Error} If data is invalid with specific reason
 */
function validatePowerData(powerData) {
    if (!powerData) {
        throw new Error('Power data is null or undefined');
    }

    if (!Array.isArray(powerData)) {
        throw new Error('Power data must be an array');
    }

    if (powerData.length === 0) {
        throw new Error('Power data array is empty');
    }

    // Validate array contents
    const invalidItems = powerData.filter(item =>
        !item || typeof item !== 'object' || item.timestamp === undefined
    );

    if (invalidItems.length > 0) {
        throw new Error(`Power data contains ${invalidItems.length} invalid item(s)`);
    }

    return true;
}

/**
 * Export power data as JSON
 * @param {Array} powerData - Array of power data points
 * @throws {Error} If power data is invalid or empty
 */
export function exportAsJson(powerData) {
    validatePowerData(powerData);

    const exportData = {
        mainSensors: powerData
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: MIME_TYPES.JSON });
    downloadFile(blob, `power_data_${getCurrentDateString()}.json`);
}

/**
 * Export power data as CSV
 * @param {Array} powerData - Array of power data points
 * @throws {Error} If power data is invalid or empty
 */
export function exportAsCsv(powerData) {
    validatePowerData(powerData);

    // Build header with main columns
    let csvContent = 'timestamp,power,heartRate,cadence\n';

    // Add data rows - main sensor data
    powerData.forEach((row) => {
        const timestamp = row.timestamp ?? '';
        const power = row.power ?? '';
        const heartRate = row.heartRate ?? '';
        const cadence = row.cadence ?? '';
        csvContent += `${timestamp},${power},${heartRate},${cadence}\n`;
    });

    const blob = new Blob([csvContent], { type: MIME_TYPES.CSV });
    downloadFile(blob, `power_data_${getCurrentDateString()}.csv`);
}

/**
 * Export power data as TCX file
 * @param {Array} powerData - Array of power data points
 * @throws {Error} If power data is invalid, empty, or TCX generation fails
 */
export function exportAsTcx(powerData) {
    validatePowerData(powerData);

    try {
        const tcxContent = generateTcxString(powerData);

        if (!tcxContent) {
            throw new Error('Failed to generate TCX content');
        }

        const blob = new Blob([tcxContent], { type: MIME_TYPES.XML });
        downloadFile(blob, `power_data_${getCurrentDateString()}.tcx`);
    } catch (error) {
        console.error('Error generating TCX:', error);
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

/**
 * Helper function to delay execution (used to prevent browser blocking on multiple downloads)
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Export all data formats at once
 * @param {Object} data - Object containing powerData
 * @param {Array} data.powerData - Array of power data points
 * @throws {Error} If power data is invalid or if any exports fail
 */
export async function exportAll(data) {
    const { powerData } = data;

    validatePowerData(powerData);

    const errors = [];
    const exports = [
        { name: 'Summary JSON', fn: () => exportAsJson(powerData) },
        { name: 'Summary CSV', fn: () => exportAsCsv(powerData) },
        { name: 'TCX', fn: () => exportAsTcx(powerData) },
    ];


    // Execute exports with delays between them
    for (const { name, fn } of exports) {
        try {
            fn();
            console.log(`✓ ${name} exported`);
        } catch (error) {
            errors.push(`${name}: ${error.message}`);
        }

        await delay(EXPORT_DELAY_MS);
    }

    // Report any errors
    if (errors.length > 0) {
        const errorMessage = `Some exports failed:\n${errors.join('\n')}`;
        console.warn('Export errors:', errors);
        throw new Error(errorMessage);
    }

    console.log('✅ All exports completed successfully!');
}