/**
 * UI Event Handlers Module
 * Handles all UI event listeners for toggles, menus, and interactions
 */

import { showAppInfo } from './app-info-modal.js';
import { showQrCodeModal } from './qr-code-modal.js';

/**
 * Setup hamburger menu functionality
 * @param {Object} elements - UI elements object
 */
export function setupHamburgerMenu(elements) {
    if (!elements.hamburgerBtn || !elements.menuDropdown) {
        console.error('Hamburger menu elements not found:', {
            hamburgerBtn: !!elements.hamburgerBtn,
            menuDropdown: !!elements.menuDropdown,
        });
        return;
    }

    // Hamburger menu functionality
    elements.hamburgerBtn.addEventListener('click', function () {
        const isActive = elements.menuDropdown.classList.contains('active');
        if (isActive) {
            elements.menuDropdown.classList.remove('active');
        } else {
            elements.menuDropdown.classList.add('active');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.hamburger-menu')) {
            elements.menuDropdown.classList.remove('active');
        }
    });
}

/**
 * Setup power averages toggle functionality
 * @param {Object} elements - UI elements object
 */
export function setupPowerAveragesToggle(elements) {
    if (!elements.powerAveragesToggle || !elements.powerAveragesSection) {
        console.error('Power averages toggle elements not found:', {
            powerAveragesToggle: !!elements.powerAveragesToggle,
            powerAveragesSection: !!elements.powerAveragesSection,
        });
        return;
    }

    let powerAveragesVisible = true; // Start visible by default
    elements.powerAveragesToggle.classList.add('active'); // Set initial active state
    elements.powerAveragesToggle.addEventListener('click', function () {
        powerAveragesVisible = !powerAveragesVisible;

        if (powerAveragesVisible) {
            elements.powerAveragesSection.style.display = 'block';
            elements.powerAveragesToggle.classList.add('active');
        } else {
            elements.powerAveragesSection.style.display = 'none';
            elements.powerAveragesToggle.classList.remove('active');
        }
        manageCollapsedSectionsLayout();
    });
}

/**
 * Setup metric toggle functionality
 * @param {Object} elements - UI elements object
 */
export function setupMetricToggles(elements) {
    // Power metric toggle
    if (elements.powerMetricToggle && elements.powerCard) {
        let powerMetricVisible = true; // Start visible by default
        elements.powerMetricToggle.classList.add('active'); // Set initial active state

        elements.powerMetricToggle.addEventListener('click', function () {
            powerMetricVisible = !powerMetricVisible;

            if (powerMetricVisible) {
                elements.powerCard.style.display = 'block';
                elements.powerMetricToggle.classList.add('active');
            } else {
                elements.powerCard.style.display = 'none';
                elements.powerMetricToggle.classList.remove('active');
            }
        });
    } else {
        console.error('Power metric toggle elements not found');
    }

    // Heart rate metric toggle
    if (elements.heartRateMetricToggle && elements.heartRateCard) {
        let heartRateMetricVisible = true; // Start visible by default
        elements.heartRateMetricToggle.classList.add('active'); // Set initial active state

        elements.heartRateMetricToggle.addEventListener('click', function () {
            heartRateMetricVisible = !heartRateMetricVisible;

            if (heartRateMetricVisible) {
                elements.heartRateCard.style.display = 'block';
                elements.heartRateMetricToggle.classList.add('active');
            } else {
                elements.heartRateCard.style.display = 'none';
                elements.heartRateMetricToggle.classList.remove('active');
            }
        });
    } else {
        console.error('Heart rate metric toggle elements not found');
    }

    // Cadence metric toggle
    if (elements.cadenceMetricToggle && elements.cadenceCard) {
        let cadenceMetricVisible = true; // Start visible by default
        elements.cadenceMetricToggle.classList.add('active'); // Set initial active state

        elements.cadenceMetricToggle.addEventListener('click', function () {
            cadenceMetricVisible = !cadenceMetricVisible;

            if (cadenceMetricVisible) {
                elements.cadenceCard.style.display = 'block';
                elements.cadenceMetricToggle.classList.add('active');
            } else {
                elements.cadenceCard.style.display = 'none';
                elements.cadenceMetricToggle.classList.remove('active');
            }
        });
    } else {
        console.error('Cadence metric toggle elements not found');
    }
}



/**
 * Setup spy mode toggle functionality
 * @param {Object} elements - UI elements object
 * @param {Function} disconnectSpyCallback - Callback to disconnect spy meter
 */
export function setupSpyModeToggle(elements, disconnectSpyCallback) {
    if (!elements.spyModeToggle || !elements.spyModeSection) {
        console.error('Spy mode toggle elements not found');
        return;
    }

    let spyModeVisible = false; // Start hidden by default

    elements.spyModeToggle.addEventListener('click', function () {
        spyModeVisible = !spyModeVisible;

        if (spyModeVisible) {
            elements.spyModeSection.style.display = 'block';
            elements.spyModeToggle.classList.add('active');
            // Make sure instructions are visible when first enabling spy mode
            if (elements.spyInstructionsElement) {
                elements.spyInstructionsElement.style.display = 'block';
            }
        } else {
            elements.spyModeSection.style.display = 'none';
            elements.spyModeToggle.classList.remove('active');
            // Disconnect spy device if connected
            disconnectSpyCallback();
            // Reset spy display elements
            if (elements.spyValueElement) elements.spyValueElement.textContent = '--';
            if (elements.spyStatusElement) elements.spyStatusElement.style.display = 'none';
            if (elements.spyInstructionsElement) elements.spyInstructionsElement.style.display = 'block';
        }
    });
}

/**
 * Setup menu item functionality
 * @param {Object} elements - UI elements object
 */
export function setupMenuItems(elements) {
    // Info functionality
    if (elements.showInfoMenuItem) {
        elements.showInfoMenuItem.addEventListener('click', function () {
            showAppInfo();
            // Close the menu after showing info
            if (elements.menuDropdown) {
                elements.menuDropdown.classList.remove('active');
            }
        });
    } else {
        console.error('Show info menu item not found');
    }

    // QR Code functionality
    if (elements.showQrCodeMenuItem) {
        elements.showQrCodeMenuItem.addEventListener('click', function () {
            showQrCodeModal();
            // Close the menu after showing QR code
            if (elements.menuDropdown) {
                elements.menuDropdown.classList.remove('active');
            }
        });
    } else {
        console.error('Show QR code menu item not found');
    }
}

/**
 * Function to update dashboard layout based on visible sections
 */
export function updateDashboardLayout() {
    const dashboard = document.querySelector('.dashboard');
    const powerAveragesSection = document.getElementById('powerAveragesSection');
    const powerAveragesHidden = powerAveragesSection && powerAveragesSection.style.display === 'none';

    if (dashboard) {
        if (powerAveragesHidden) {
            dashboard.classList.add('maximized');
        } else {
            dashboard.classList.remove('maximized');
        }
    }

    // Manage horizontal layout for collapsed sections (excluding bottom controls)
    manageCollapsedSectionsLayout();
}

/**
 * Function to manage horizontal layout of collapsed sections
 */
function manageCollapsedSectionsLayout() {
    const dashboard = document.querySelector('.dashboard');

    if (!dashboard) return;

    // Only manage power averages section for collapsed layout -
    // connect and export sections are now bottom controls and stay at bottom
    // Note: collapsedSections logic simplified since only power averages section is managed now

    // Remove any existing collapsed sections row
    const existingRow = document.querySelector('.collapsed-sections-row');
    if (existingRow) {
        // Move sections back to their original positions
        const sectionsInRow = existingRow.querySelectorAll('.power-averages-section');
        sectionsInRow.forEach((section) => {
            // Insert sections back after the dashboard
            dashboard.parentNode.insertBefore(section, dashboard.nextSibling);
        });
        existingRow.remove();
    }

    // Power averages section doesn't need horizontal grouping since it's the only
    // section that can be managed this way now
    dashboard.classList.remove('has-collapsed-sections');
}

/**
 * Initialize all UI sections
 * @param {Object} elements - UI elements object
 */
export function initializeSections(elements) {
    // Initialize power averages section as visible by default
    if (elements.powerAveragesSection) {
        elements.powerAveragesSection.style.display = 'block';
    }

    updateDashboardLayout();
}