/**
 * Data Export Module
 * Handles all data export functionality including JSON, CSV, TCX, and image exports
 */

import { generateTcxString } from './create-tcx.js';
import { generateSummaryImage } from './create-image.js';
import { getCurrentDateString } from './ui-management.js';

/**
 * Export power data as JSON
 * @param {Array} powerData - Array of power data points
 */
export function exportAsJson(powerData) {
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
    let csvContent = 'timestamp,power,heartRate,cadence\n';
    powerData.forEach((row) => {
        csvContent += `${row.timestamp},${row.power},${row.heartRate},${row.cadence}\n`;
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
}