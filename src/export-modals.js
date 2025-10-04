/**
 * Export Modals Module
 * Handles modal-based export functionality
 */

// Import required functions from data-export module
import {
    exportAsJson,
    exportAsCsv,
    exportAsTcx,
    exportRawAsJson,
    exportRawAsCsv,
    exportSummaryImage,
    exportToGoogleDocs,
    exportToGoogleSheets,
    exportToIntervals,
    isSignedInToGoogle,
    authenticateWithGoogle,
    signOutFromGoogle,
    showGoogleApiConfigModal,
    showIntervalsConfigModal,
    isIntervalsConfigured
} from './data-export.js';

/**
 * Create and show basic export modal
 * @param {Object} dataStore - Data store object containing export data
 */
export function showBasicExportModal(dataStore) {
    const modal = createExportModal('📄 Basic Exports', 'Export your session data in various formats');

    const buttons = [
        {
            text: '📋 Export Summary JSON',
            description: 'Session summary with averages',
            onClick: () => {
                exportAsJson(dataStore.powerData);
                closeModal(modal);
            }
        },
        {
            text: '📊 Export Summary CSV',
            description: 'Session summary for spreadsheets',
            onClick: () => {
                exportAsCsv(dataStore.powerData);
                closeModal(modal);
            }
        },
        {
            text: '🏃 Export TCX',
            description: 'Training Center XML format',
            onClick: () => {
                try {
                    exportAsTcx(dataStore.powerData);
                    closeModal(modal);
                } catch (error) {
                    alert(`Error generating TCX file: ${error.message}`);
                }
            }
        },
        {
            text: '🔍 Export Raw JSON',
            description: 'Complete measurement data',
            onClick: () => {
                exportRawAsJson(dataStore.rawPowerMeasurements);
                closeModal(modal);
            }
        },
        {
            text: '📈 Export Raw CSV',
            description: 'Raw measurements for analysis',
            onClick: () => {
                exportRawAsCsv(dataStore.rawPowerMeasurements);
                closeModal(modal);
            }
        },
        {
            text: '🖼️ Export Summary Image',
            description: 'Visual summary of your session',
            className: 'primary',
            onClick: async () => {
                try {
                    await exportSummaryImage({
                        dataPoints: dataStore.powerData,
                        powerAverages: dataStore.getPowerAverages()
                    });
                    closeModal(modal);
                } catch (error) {
                    alert(`Error generating summary image: ${error.message}`);
                }
            }
        }
    ];

    addButtonsToModal(modal, buttons);
    showModal(modal);
}

/**
 * Create and show cloud export modal
 * @param {Object} dataStore - Data store object containing export data
 */
export function showCloudExportModal(dataStore) {
    const modal = createExportModal('☁️ Cloud Exports', 'Export to cloud services and platforms');

    const isSignedIn = isSignedInToGoogle();

    const buttons = [
        {
            text: isSignedIn ? '🔓 Sign Out from Google' : '🔗 Sign In to Google',
            description: isSignedIn ? 'Sign out from Google account' : 'Sign in to enable Google exports',
            className: isSignedIn ? 'danger' : 'success',
            onClick: async () => {
                try {
                    if (isSignedIn) {
                        await signOutFromGoogle();
                        alert('Signed out successfully!');
                    } else {
                        const success = await authenticateWithGoogle();
                        if (success) {
                            alert('Signed in successfully!');
                        }
                    }
                    closeModal(modal);
                    // Re-open modal to reflect new state
                    setTimeout(() => showCloudExportModal(dataStore), 100);
                } catch (error) {
                    alert(`Google authentication error: ${error.message}`);
                }
            }
        },
        {
            text: '📄 Export to Google Docs',
            description: 'Create a formatted session report',
            disabled: !isSignedIn,
            onClick: async () => {
                if (!isSignedIn) return;
                try {
                    await exportToGoogleDocs({
                        powerData: dataStore.powerData,
                        powerAverages: dataStore.getPowerAverages(),
                        sessionStartTime: dataStore.sessionStartTime
                    });
                    alert('Successfully exported to Google Docs!');
                    closeModal(modal);
                } catch (error) {
                    alert(`Error exporting to Google Docs: ${error.message}`);
                }
            }
        },
        {
            text: '📊 Export to Google Sheets',
            description: 'Create a detailed data spreadsheet',
            disabled: !isSignedIn,
            onClick: async () => {
                if (!isSignedIn) return;
                try {
                    await exportToGoogleSheets({
                        powerData: dataStore.powerData,
                        powerAverages: dataStore.getPowerAverages(),
                        rawMeasurements: dataStore.rawPowerMeasurements,
                        sessionStartTime: dataStore.sessionStartTime
                    });
                    alert('Successfully exported to Google Sheets!');
                    closeModal(modal);
                } catch (error) {
                    alert(`Error exporting to Google Sheets: ${error.message}`);
                }
            }
        },
        {
            text: '⚙️ Configure Google API',
            description: 'Set up Google API credentials',
            onClick: () => {
                closeModal(modal);
                showGoogleApiConfigModal();
            }
        }
    ];

    addButtonsToModal(modal, buttons);
    showModal(modal);
}

/**
 * Create and show training platforms export modal
 * @param {Object} dataStore - Data store object containing export data
 */
export function showTrainingPlatformsModal(dataStore) {
    const modal = createExportModal('🏃 Training Platforms', 'Export to training analysis platforms');

    const isConfigured = isIntervalsConfigured();

    const buttons = [
        {
            text: '🚴 Export to intervals.icu',
            description: 'Upload activity to intervals.icu',
            disabled: !isConfigured,
            onClick: async () => {
                if (!isConfigured) return;
                try {
                    await exportToIntervals({
                        powerData: dataStore.powerData,
                        powerAverages: dataStore.getPowerAverages(),
                        sessionStartTime: dataStore.sessionStartTime
                    });
                    alert('Successfully exported to intervals.icu!');
                    closeModal(modal);
                } catch (error) {
                    alert(`Error exporting to intervals.icu: ${error.message}`);
                }
            }
        },
        {
            text: '⚙️ Configure intervals.icu',
            description: 'Set up intervals.icu credentials',
            onClick: () => {
                closeModal(modal);
                showIntervalsConfigModal();
            }
        }
    ];

    addButtonsToModal(modal, buttons);
    showModal(modal);
}

/**
 * Create and show utilities modal
 * @param {Object} dataStore - Data store object containing export data
 */
export function showUtilitiesModal(dataStore) {
    const modal = createExportModal('🛠️ Utilities', 'Session management and utilities');

    const buttons = [
        {
            text: '🗑️ Clear Session Data',
            description: 'Clear all session data (cannot be undone)',
            className: 'danger',
            onClick: () => {
                const confirmed = confirm(
                    'Are you sure you want to clear all session data? This action cannot be undone.'
                );
                if (confirmed) {
                    dataStore.resetAllSessionData();
                    alert('Session data cleared successfully!');
                    closeModal(modal);
                }
            }
        }
    ];

    addButtonsToModal(modal, buttons);
    showModal(modal);
}

/**
 * Create export modal with header
 * @param {string} title - Modal title
 * @param {string} description - Modal description
 * @returns {HTMLElement} Modal element
 */
function createExportModal(title, description) {
    const modal = document.createElement('div');
    modal.className = 'export-modal';

    modal.innerHTML = `
        <div class="export-modal-content">
            <div class="export-modal-header">
                <h3 class="export-modal-title">${title}</h3>
                <button class="export-modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="export-modal-description">${description}</div>
            <div class="export-modal-buttons"></div>
        </div>
    `;

    // Add close functionality
    const closeBtn = modal.querySelector('.export-modal-close');
    closeBtn.addEventListener('click', () => closeModal(modal));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    return modal;
}

/**
 * Add buttons to modal
 * @param {HTMLElement} modal - Modal element
 * @param {Array} buttons - Array of button configurations
 */
function addButtonsToModal(modal, buttons) {
    const buttonsContainer = modal.querySelector('.export-modal-buttons');

    buttons.forEach(buttonConfig => {
        const button = document.createElement('button');
        button.className = `export-modal-button ${buttonConfig.className || ''}`;
        button.disabled = buttonConfig.disabled || false;

        button.innerHTML = `
            <span>${buttonConfig.text}</span>
            ${buttonConfig.description ? `<small style="opacity: 0.7; font-size: 0.8em;">${buttonConfig.description}</small>` : ''}
        `;

        button.addEventListener('click', buttonConfig.onClick);
        buttonsContainer.appendChild(button);
    });
}

/**
 * Show modal with animation
 * @param {HTMLElement} modal - Modal element
 */
function showModal(modal) {
    document.body.appendChild(modal);
    // Trigger animation
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

/**
 * Close modal with animation
 * @param {HTMLElement} modal - Modal element
 */
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            document.body.removeChild(modal);
        }
    }, 300);
}

/**
 * Setup export menu event listeners
 * @param {Object} dataStore - Data store object
 */
export function setupExportMenuListeners(dataStore) {
    // Initialize export section as collapsed by default
    initializeExportSection();

    // Setup export section toggle
    setupExportSectionToggle();

    // Basic exports
    const basicMenuItem = document.getElementById('exportBasicMenuItem');
    if (basicMenuItem) {
        basicMenuItem.addEventListener('click', () => {
            showBasicExportModal(dataStore);
        });
    }

    // Cloud exports
    const cloudMenuItem = document.getElementById('exportCloudMenuItem');
    if (cloudMenuItem) {
        cloudMenuItem.addEventListener('click', () => {
            showCloudExportModal(dataStore);
        });
    }

    // Training platforms
    const servicesMenuItem = document.getElementById('exportServicesMenuItem');
    if (servicesMenuItem) {
        servicesMenuItem.addEventListener('click', () => {
            showTrainingPlatformsModal(dataStore);
        });
    }

    // Utilities
    const utilsMenuItem = document.getElementById('exportUtilsMenuItem');
    if (utilsMenuItem) {
        utilsMenuItem.addEventListener('click', () => {
            showUtilitiesModal(dataStore);
        });
    }
}

/**
 * Initialize export section to be collapsed by default
 */
function initializeExportSection() {
    const exportSection = document.getElementById('exportMenuSection');
    if (exportSection) {
        exportSection.classList.add('collapsed');
    }
}

/**
 * Setup export section toggle functionality
 */
function setupExportSectionToggle() {
    const toggleHeader = document.getElementById('exportSectionToggleHeader');
    const exportSection = document.getElementById('exportMenuSection');

    if (toggleHeader && exportSection) {
        toggleHeader.addEventListener('click', () => {
            exportSection.classList.toggle('collapsed');
        });
    }
}