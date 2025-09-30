/**
 * Screen Wake Lock Management Module
 * Handles requesting and releasing screen wake locks to prevent device sleep during sessions
 */

let wakeLock = null;

/**
 * Request a screen wake lock to prevent the device from sleeping
 * @returns {Promise<void>}
 */
export async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                // Wake lock was released
                console.log('Wake lock was released');
            });
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

/**
 * Release the current wake lock
 * @returns {Promise<void>}
 */
export async function releaseWakeLock() {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
}

/**
 * Check if wake lock is currently active
 * @returns {boolean}
 */
export function isWakeLockActive() {
    return wakeLock !== null;
}