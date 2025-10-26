/**
 * Bluetooth Connection Orchestration Module
 * Coordinates Bluetooth connections for all sensor types
 */

import {
    connectHeartRateMonitor,
    isHeartRateConnected,
    disconnectHeartRate,
    cleanupHeartRateEventListeners
} from './bluetooth-heart-rate.js';

import {
    connectPowerMeter,
    connectSpeedCadenceSensor,
    isPowerMeterConnected,
    isSpeedCadenceConnected,
    disconnectPowerMeter,
    disconnectSpeedCadence,
    cleanupCyclingSensorsEventListeners
} from './bluetooth-cycling.js';

// Re-export heart rate functions for backward compatibility
export {
    connectHeartRateMonitor,
    isHeartRateConnected,
    disconnectHeartRate
};

// Re-export cycling sensor functions for backward compatibility
export {
    connectPowerMeter,
    connectSpeedCadenceSensor,
    isPowerMeterConnected,
    isSpeedCadenceConnected,
    disconnectPowerMeter,
    disconnectSpeedCadence
};

/**
 * Clean up all Bluetooth event listeners
 * Call this function when the app is closing or resetting connections
 */
export function cleanupBluetoothEventListeners() {
    // Clean up heart rate listeners
    cleanupHeartRateEventListeners();

    // Clean up cycling sensors listeners
    cleanupCyclingSensorsEventListeners();
}