/**
 * Export Modals Module
 * Handles modal-based export functionality with user-friendly dialogs
 */

// Import required functions from data-export module
import {
    exportAsJson,
    exportAsCsv,
    exportAsTcx,
    exportAll,
    uploadToIntervalsIcu
} from './data-export.js';

// Constants for modal animations
const MODAL_ANIMATION_DELAY_MS = 300;

/**
 * Handle export error with user-friendly message
 * @param {Error} error - The error that occurred
 * @param {string} exportType - Type of export that failed
 */
function handleExportError(error, exportType) {
    const message = `Error during ${exportType} export: ${error.message}`;
    console.error(message, error);
    alert(message);
}

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
                        powerData: dataStore.powerData
                    });
                    closeModal(modal);
                    alert('All export files downloaded successfully!');
                } catch (error) {
                    handleExportError(error, 'all files');
                }
            }
        },
        {
            text: '📊 Export JSON',
            description: 'JavaScript Object Notation format',
            onClick: () => {
                try {
                    exportAsJson(dataStore.powerData);
                    closeModal(modal);
                } catch (error) {
                    handleExportError(error, 'JSON');
                }
            }
        },
        {
            text: '📊 Export CSV',
            description: 'Comma-Separated Values format',
            onClick: () => {
                try {
                    exportAsCsv(dataStore.powerData);
                    closeModal(modal);
                } catch (error) {
                    handleExportError(error, 'CSV');
                }
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
                    handleExportError(error, 'TCX');
                }
            }
        },
        {
            text: '☁️ Upload to intervals.icu',
            description: 'Upload workout directly to intervals.icu',
            onClick: async (event) => {
                const apiKey = prompt(
                    'Enter your intervals.icu API key:\n\n' +
                    'Format: athleteId:apiKey or just apiKey\n' +
                    'Find it at: intervals.icu → Settings → Developer Settings\n\n' +
                    'Note: API key is not stored and only used for this upload.'
                );

                if (!apiKey) {
                    return; // User cancelled
                }

                const button = event.target.closest('button');
                if (!button) {
                    return;
                }

                try {
                    // Show loading state
                    button.innerHTML = '<span>⏳ Uploading...</span><small style="opacity: 0.7; font-size: 0.8em;">Please wait</small>';
                    button.disabled = true;

                    await uploadToIntervalsIcu(dataStore.powerData, apiKey);

                    closeModal(modal);
                    alert('✅ Successfully uploaded workout to intervals.icu!');
                } catch (error) {
                    // Restore button state
                    button.innerHTML = '<span>☁️ Upload to intervals.icu</span><small style="opacity: 0.7; font-size: 0.8em;">Upload workout directly to intervals.icu</small>';
                    button.disabled = false;
                    handleExportError(error, 'intervals.icu upload');
                }
            }
        },
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
            text: '� Clear App Cache',
            description: 'Clear cached files and force reload (ensures fresh version)',
            className: 'primary',
            onClick: async () => {
                const confirmed = confirm(
                    'This will clear the app cache and reload to get the latest version. Continue?'
                );
                if (confirmed) {
                    await clearAppCache();
                    alert('Cache cleared! The page will now reload.');
                    window.location.reload(true);
                }
            }
        },
        {
            text: '�🗑️ Clear Session Data',
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
 * Clear app cache and service worker cache
 */
async function clearAppCache() {
    try {
        // Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
            console.log('All caches cleared');
        }

        // Tell service worker to clear its cache
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CLEAR_CACHE'
            });
        }

        // Unregister service worker to ensure clean reload
        if (navigator.serviceWorker) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
                console.log('Service worker unregistered');
            }
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
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
    }, MODAL_ANIMATION_DELAY_MS);
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