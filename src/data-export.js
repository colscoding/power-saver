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
        const power = row.power || '';
        const heartRate = row.heartRate || '';
        const cadence = row.cadence || '';
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

/**
 * Export all data formats at once
 * @param {Object} data - Object containing powerData, rawPowerMeasurements, and powerAverages
 */
export async function exportAll(data) {
    const { powerData, rawPowerMeasurements, powerAverages } = data;

    if (!powerData || !Array.isArray(powerData) || powerData.length === 0) {
        throw new Error('No valid power data available for export');
    }

    const errors = [];

    try {
        // Export Summary JSON
        exportAsJson(powerData);
        console.log('✓ Summary JSON exported');
    } catch (error) {
        errors.push(`Summary JSON: ${error.message}`);
    }

    // Small delay between downloads to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // Export Summary CSV
        exportAsCsv(powerData);
        console.log('✓ Summary CSV exported');
    } catch (error) {
        errors.push(`Summary CSV: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // Export TCX
        exportAsTcx(powerData);
        console.log('✓ TCX exported');
    } catch (error) {
        errors.push(`TCX: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // Export Raw JSON (if available)
        if (rawPowerMeasurements && rawPowerMeasurements.length > 0) {
            exportRawAsJson(rawPowerMeasurements);
            console.log('✓ Raw JSON exported');
        }
    } catch (error) {
        errors.push(`Raw JSON: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // Export Raw CSV (if available)
        if (rawPowerMeasurements && rawPowerMeasurements.length > 0) {
            exportRawAsCsv(rawPowerMeasurements);
            console.log('✓ Raw CSV exported');
        }
    } catch (error) {
        errors.push(`Raw CSV: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    try {
        // Export Summary Image
        await exportSummaryImage({
            dataPoints: powerData,
            powerAverages: powerAverages || {}
        });
        console.log('✓ Summary Image exported');
    } catch (error) {
        errors.push(`Summary Image: ${error.message}`);
    }

    // Report any errors
    if (errors.length > 0) {
        console.warn('Some exports failed:', errors);
        throw new Error(`Some exports failed:\n${errors.join('\n')}`);
    }

    console.log('✅ All exports completed successfully!');
}