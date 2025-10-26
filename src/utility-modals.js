/**
 * Utility Modals Module
 * Handles utility-related modal functionality
 */

// Constants for modal animations
const MODAL_ANIMATION_DELAY_MS = 300;

/**
 * Create and show utilities modal
 * @param {Object} dataStore - Data store object containing export data
 */
export function showUtilitiesModal(dataStore) {
    const modal = createUtilityModal('🛠️ Utilities', 'Session management and utilities');

    const buttons = [
        {
            text: '⚡ Disconnect Power Meter',
            description: 'Disconnect the connected power meter sensor',
            className: 'secondary',
            onClick: () => {
                const connectButton = document.getElementById('connectButton');
                if (connectButton && connectButton.dataset.connected === 'true') {
                    const confirmed = confirm('Disconnect power meter?');
                    if (confirmed) {
                        connectButton.click();
                        alert('Power meter disconnected');
                        closeModal(modal);
                    }
                } else {
                    alert('No power meter connected');
                }
            }
        },
        {
            text: '❤️ Disconnect Heart Rate',
            description: 'Disconnect the connected heart rate monitor',
            className: 'secondary',
            onClick: () => {
                const hrButton = document.getElementById('hrConnectButton');
                if (hrButton && hrButton.dataset.connected === 'true') {
                    const confirmed = confirm('Disconnect heart rate monitor?');
                    if (confirmed) {
                        hrButton.click();
                        alert('Heart rate monitor disconnected');
                        closeModal(modal);
                    }
                } else {
                    alert('No heart rate monitor connected');
                }
            }
        },
        {
            text: '🚴 Disconnect Cadence Sensor',
            description: 'Disconnect the connected cadence/speed sensor',
            className: 'secondary',
            onClick: () => {
                const cadenceButton = document.getElementById('speedCadenceConnectButton');
                if (cadenceButton && cadenceButton.dataset.connected === 'true') {
                    const confirmed = confirm('Disconnect cadence sensor?');
                    if (confirmed) {
                        cadenceButton.click();
                        alert('Cadence sensor disconnected');
                        closeModal(modal);
                    }
                } else {
                    alert('No cadence sensor connected');
                }
            }
        },
        {
            text: '🔄 Clear App Cache',
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
 * Create utility modal with header
 * @param {string} title - Modal title
 * @param {string} description - Modal description
 * @returns {HTMLElement} Modal element
 */
function createUtilityModal(title, description) {
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
 * Setup utility menu event listeners
 * @param {Object} dataStore - Data store object
 */
export function setupUtilityMenuListeners(dataStore) {
    const utilsMenuItem = document.getElementById('exportUtilsMenuItem');
    if (utilsMenuItem) {
        utilsMenuItem.addEventListener('click', () => {
            showUtilitiesModal(dataStore);
        });
    }
}
