/**
 * UI Event Handlers Module
 * Handles all UI event listeners for toggles, menus, and interactions
 */

import { showAppInfo } from './app-info-modal.js';
import { toggleLog } from './connection-log.js';

/**
 * Set up hamburger menu functionality

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

    // Toggle log functionality
    if (elements.toggleLogMenuItem) {
        elements.toggleLogMenuItem.addEventListener('click', function () {
            toggleLog();
            // Close the menu after toggling log
            if (elements.menuDropdown) {
                elements.menuDropdown.classList.remove('active');
            }
        });
    } else {
        console.error('Toggle log menu item not found');
    }
}

/**
 * Function to update dashboard layout based on visible sections
 */
function updateDashboardLayout() {
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