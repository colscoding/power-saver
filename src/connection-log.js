/**
 * Connection Log Module
 * Manages the connection log UI for displaying Bluetooth connection activity
 */

let logContainer = null;
let logSection = null;

/**
 * Initialize the connection log
 */
export function initializeConnectionLog() {
    logContainer = document.getElementById('connectionLogContent');
    logSection = document.getElementById('connectionLogSection');

    const clearButton = document.getElementById('clearLogButton');
    if (clearButton) {
        clearButton.addEventListener('click', clearLog);
    }
}

/**
 * Add a log entry
 * @param {string} message - The log message
 * @param {string} type - The type of log entry ('info', 'success', 'error', 'warning')
 */
export function addLogEntry(message, type = 'info') {
    if (!logContainer) {
        console.warn('Log container not initialized');
        return;
    }

    // Remove empty message if it exists
    const emptyMessage = logContainer.querySelector('.log-empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    // Create log entry
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;

    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    entry.innerHTML = `
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-message">${escapeHtml(message)}</span>
    `;

    // Add to top of log
    logContainer.insertBefore(entry, logContainer.firstChild);

    // Limit log entries to 100
    const entries = logContainer.querySelectorAll('.log-entry');
    if (entries.length > 100) {
        entries[entries.length - 1].remove();
    }
}

/**
 * Clear all log entries
 */
export function clearLog() {
    if (!logContainer) return;

    logContainer.innerHTML = '<div class="log-empty-message">No connection activity yet</div>';
}

/**
 * Toggle log visibility
 */
export function toggleLog() {
    if (!logSection) return;

    const isHidden = logSection.style.display === 'none';
    logSection.style.display = isHidden ? 'block' : 'none';

    return !isHidden; // Return true if now hidden, false if now visible
}

/**
 * Check if log is visible
 */
export function isLogVisible() {
    if (!logSection) return false;
    return logSection.style.display !== 'none';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
