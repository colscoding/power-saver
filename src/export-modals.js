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
    exportAll
} from './data-export.js';

/**
 * Create and show basic export modal
 * @param {Object} dataStore - Data store object containing export data
 */
export function showBasicExportModal(dataStore) {
    const modal = createExportModal('📄 Exports', 'Export your session data in various formats');

    const buttons = [
        {
            text: '📥 Export All Files',
            description: 'Download all export formats at once',
            className: 'export-all primary',
            onClick: async () => {
                try {
                    await exportAll({
                        powerData: dataStore.powerData,
                        rawPowerMeasurements: dataStore.rawPowerMeasurements,
                        powerAverages: dataStore.getPowerAverages()
                    });
                    closeModal(modal);
                    alert('All export files downloaded successfully!');
                } catch (error) {
                    alert(`Error during export all: ${error.message}`);
                }
            }
        },
        {
            text: '📊 Export JSON',
            description: 'JavaScript Object Notation format',
            onClick: () => {
                exportAsJson(dataStore.powerData);
                closeModal(modal);
            }
        },
        {
            text: '📊 Export CSV',
            description: 'Comma-Separated Values format',
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
            description: 'Complete measurement data in JSON format',
            onClick: () => {
                exportRawAsJson(dataStore.rawPowerMeasurements);
                closeModal(modal);
            }
        },
        {
            text: '📈 Export Raw CSV',
            description: 'Complete measurement data in CSV format',
            onClick: () => {
                exportRawAsCsv(dataStore.rawPowerMeasurements);
                closeModal(modal);
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

    buttons.forEach((buttonConfig) => {
        const button = document.createElement('button');
        button.className = `export-modal-button ${buttonConfig.className || ''}`;
        button.disabled = buttonConfig.disabled || false;

        button.innerHTML = `
            <span>${buttonConfig.text}</span>
            ${buttonConfig.description ? `<small style="opacity: 0.7; font-size: 0.8em;">${buttonConfig.description}</small>` : ''}
        `;

        button.addEventListener('click', buttonConfig.onClick);
        buttonsContainer.appendChild(button);

        // Add separator after "Export All" button
        if (buttonConfig.className && buttonConfig.className.includes('export-all')) {
            const separator = document.createElement('div');
            separator.className = 'export-modal-separator';
            separator.innerHTML = '<span>Individual Exports</span>';
            buttonsContainer.appendChild(separator);
        }
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
    // Basic exports
    const basicMenuItem = document.getElementById('exportMenuItem');
    if (basicMenuItem) {
        basicMenuItem.addEventListener('click', () => {
            showBasicExportModal(dataStore);
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