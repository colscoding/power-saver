// Data Persistence Functions
const SESSION_STORAGE_KEY = 'powerMeterSession';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Save current session data to localStorage
 * @param {Object} dataStore - Object containing all session data
 */
function saveSessionData(dataStore) {
    try {
        const sessionData = {
            timestamp: Date.now(),
            powerData: dataStore.powerData,
            heartData: dataStore.heartData,
            cadenceData: dataStore.cadenceData,
            rawPowerMeasurements: dataStore.rawPowerMeasurements,
            powerReadings: dataStore.getPowerReadings(),
            powerAverages: dataStore.getPowerAverages(),
            lastPowerValue: dataStore.lastPowerValue,
            lastHeartRateValue: dataStore.lastHeartRateValue,
            lastCadenceValue: dataStore.lastCadenceValue,
            sessionStartTime: dataStore.sessionStartTime,
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
        console.warn('Failed to save session data:', error);
    }
}

/**
 * Load session data from localStorage if available and recent
 * Returns the session data object if available, null if not
 */
function loadSessionData() {
    try {
        const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedData) return null;

        const sessionData = JSON.parse(savedData);
        const now = Date.now();

        // Check if session is too old (older than 24 hours)
        if (now - sessionData.timestamp > SESSION_TIMEOUT) {
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