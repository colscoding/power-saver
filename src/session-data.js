/**
 * Session Data Persistence Module
 * Manages localStorage operations for session data persistence
 */

// Constants for session management
const SESSION_STORAGE_KEY = 'powerMeterSession';
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Save current session data to localStorage
 * @param {Object} dataStore - Object containing all session data
 */
function saveSessionData(dataStore) {
    try {
        const sessionData = {
            timestamp: Date.now(),
            powerData: dataStore.powerData,
            lastPowerValue: dataStore.lastPowerValue,
            lastHeartRateValue: dataStore.lastHeartRateValue,
            lastCadenceValue: dataStore.lastCadenceValue,
            sessionStartTime: dataStore.sessionStartTime
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
        console.warn('Failed to save session data:', error);
    }
}

/**
 * Validate session data object
 * @param {Object} sessionData - Session data to validate
 * @returns {boolean} True if valid
 */
function validateSessionData(sessionData) {
    if (!sessionData || typeof sessionData !== 'object') {
        return false;
    }

    // Check required properties
    if (!sessionData.timestamp || !sessionData.powerData) {
        return false;
    }

    // Validate powerData is an array
    if (!Array.isArray(sessionData.powerData)) {
        return false;
    }

    return true;
}

/**
 * Load session data from localStorage if available and recent
 * @returns {Object|null} Session data object if available and valid, null otherwise
 */
function loadSessionData() {
    try {
        const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedData) {
            return null;
        }

        const sessionData = JSON.parse(savedData);

        // Validate session data structure
        if (!validateSessionData(sessionData)) {
            console.warn('Invalid session data structure, clearing...');
            localStorage.removeItem(SESSION_STORAGE_KEY);
            return null;
        }

        const now = Date.now();
        const sessionAge = now - sessionData.timestamp;

        // Check if session has expired (older than 24 hours)
        if (sessionAge > SESSION_TIMEOUT_MS) {
            console.log('Session expired, clearing...');
            localStorage.removeItem(SESSION_STORAGE_KEY);
            return null;
        }

        return sessionData;
    } catch (error) {
        console.warn('Failed to load session data:', error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}


/**
 * Clear session data from localStorage
 */
function clearSessionData() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

export { loadSessionData, saveSessionData, clearSessionData };