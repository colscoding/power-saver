/**
 * Screen Wake Lock Management Module
 * Handles requesting and releasing screen wake locks to prevent device sleep during sessions
 */

let wakeLock = null;

/**
 * Request a screen wake lock to prevent the device from sleeping
 * @returns {Promise<boolean>} True if wake lock was acquired, false otherwise
 */
export async function requestWakeLock() {
    // Check if Wake Lock API is supported
    if (!('wakeLock' in navigator)) {
        console.warn('Wake Lock API is not supported in this browser');
        return false;
    }

    try {
        wakeLock = await navigator.wakeLock.request('screen');

        wakeLock.addEventListener('release', () => {
            console.log('Screen wake lock was released');
        });

        console.log('Screen wake lock acquired');
        return true;
    } catch (error) {
        console.error('Failed to acquire wake lock:', error.name, error.message);
        return false;
    }
}

/**
 * Release the current wake lock
 * @returns {Promise<boolean>} True if wake lock was released, false if none was active
 */
export async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('Screen wake lock released');
            return true;
        } catch (error) {
            console.error('Failed to release wake lock:', error.name, error.message);
            return false;
        }
    }
    return false;
}

/**
 * Check if wake lock is currently active
 * @returns {boolean} True if wake lock is active
 */
export function isWakeLockActive() {
    return wakeLock !== null;
}