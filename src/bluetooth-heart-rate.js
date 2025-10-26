/**
 * Bluetooth Heart Rate Monitor Module
 * Handles Bluetooth connections for heart rate monitors
 */

import { parseHeartRate } from './heart-rate.js';
import { requestWakeLock } from './wake-lock.js';

// Device connection state
let hrBluetoothDevice = null;
let hrDisconnectHandler = null;

// Store characteristics for proper cleanup and persistent connections
let hrCharacteristic = null;
let hrCharacteristicHandler = null;

/**
 * Connect to a heart rate monitor
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
export async function connectHeartRateMonitor(callbacks, elements) {
    await requestWakeLock();
    console.log('[HR] Connect heart rate monitor requested');

    if (!navigator.bluetooth) {
        const message = 'Web Bluetooth API is not available.';
        console.error('[HR]', message);
        callbacks.onStatusUpdate(message);
        return false;
    }

    try {
        callbacks.onStatusUpdate('Scanning for devices...');
        console.log('[HR] Requesting device...');
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Connecting...';
        }

        // Clean up any existing connection before creating a new one
        if (hrBluetoothDevice) {
            console.log('[HR] Cleaning up existing connection');
            // Clean up characteristic handler
            if (hrCharacteristic && hrCharacteristicHandler) {
                try {
                    hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
                } catch (e) {
                    console.warn('[HR] Error removing HR characteristic listener:', e);
                }
                hrCharacteristicHandler = null;
                hrCharacteristic = null;
            }

            if (hrDisconnectHandler) {
                hrBluetoothDevice.removeEventListener('gattserverdisconnected', hrDisconnectHandler);
                hrDisconnectHandler = null;
            }
            if (hrBluetoothDevice.gatt.connected) {
                hrBluetoothDevice.gatt.disconnect();
            }
            hrBluetoothDevice = null;
        }

        // Show device selection with name prefix filter to help distinguish devices
        // This allows users to see device names in the selection dialog
        console.log('[HR] Opening device picker...');
        hrBluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: ['heart_rate'],
                },
            ],
            optionalServices: ['device_information', 'battery_service'] // Get additional info if available
        });

        // Validate that we got a device
        if (!hrBluetoothDevice) {
            throw new Error('No device selected');
        }

        console.log('[HR] Device selected:', hrBluetoothDevice.name || 'Unknown');
        await connectToHRDevice(hrBluetoothDevice, callbacks, elements);
        return true;

    } catch (error) {
        // Handle user cancellation separately from actual errors
        if (error.name === 'NotFoundError') {
            const message = 'No device selected.';
            console.log('[HR]', message);
            callbacks.onStatusUpdate(message);
            if (elements.hrConnectionStatus) {
                elements.hrConnectionStatus.textContent = 'Disconnected';
            }
        } else {
            const message = `Error: ${error.message}`;
            console.error('[HR] Connection failed:', error);
            callbacks.onStatusUpdate(message);
            if (elements.hrConnectionStatus) {
                elements.hrConnectionStatus.textContent = 'Connection Failed';
            }
        }

        // Clean up on error
        if (hrCharacteristic && hrCharacteristicHandler) {
            try {
                hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
            } catch {
                // Ignore cleanup errors
            }
            hrCharacteristicHandler = null;
            hrCharacteristic = null;
        }

        if (hrBluetoothDevice && hrDisconnectHandler) {
            hrBluetoothDevice.removeEventListener('gattserverdisconnected', hrDisconnectHandler);
            hrDisconnectHandler = null;
        }
        hrBluetoothDevice = null;

        return false;
    }
}

/**
 * Connect to HR device with enhanced device information
 * @param {BluetoothDevice} device - The Bluetooth device to connect to
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
async function connectToHRDevice(device, callbacks, elements) {
    callbacks.onStatusUpdate('Connecting to device...');
    console.log('[HR] Starting connection to:', device.name || 'Unknown Device');

    // Add disconnect listener BEFORE connecting
    hrDisconnectHandler = () => {
        onHeartRateDisconnected(callbacks, elements);
    };
    device.addEventListener('gattserverdisconnected', hrDisconnectHandler);

    try {
        // Connect to GATT server
        console.log('[HR] Connecting to GATT server...');
        const hrServer = await device.gatt.connect();
        console.log('[HR] GATT server connected');

        console.log('[HR] Getting heart rate service...');
        const hrService = await hrServer.getPrimaryService('heart_rate');
        console.log('[HR] Getting heart rate characteristic...');
        hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');

        // Clean up any existing handler before adding a new one
        if (hrCharacteristicHandler) {
            try {
                hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
            } catch (e) {
                console.warn('[HR] Error removing old characteristic listener:', e);
            }
        }

        // Start notifications to receive heart rate data
        console.log('[HR] Starting notifications...');
        await hrCharacteristic.startNotifications();

        // Store the handler reference for proper cleanup
        hrCharacteristicHandler = (event) => {
            handleHeartRateChanged(event, callbacks);
        };

        hrCharacteristic.addEventListener('characteristicvaluechanged', hrCharacteristicHandler);

        console.log('[HR] Connection complete!');
        callbacks.onStatusUpdate('Connected!');
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Connected';
        }
    } catch (error) {
        console.error('[HR] Connection error:', error);
        // Clean up characteristic handler on connection failure
        if (hrCharacteristic && hrCharacteristicHandler) {
            try {
                hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
            } catch {
                // Ignore cleanup errors
            }
            hrCharacteristicHandler = null;
            hrCharacteristic = null;
        }

        // Clean up event listener on connection failure
        device.removeEventListener('gattserverdisconnected', hrDisconnectHandler);
        hrDisconnectHandler = null;
        throw error; // Re-throw to be caught by parent function
    }
}

/**
 * Check if heart rate monitor is connected
 * @returns {boolean}
 */
export function isHeartRateConnected() {
    return hrBluetoothDevice && hrBluetoothDevice.gatt.connected;
}

/**
 * Disconnect heart rate monitor
 */
export function disconnectHeartRate() {
    if (hrBluetoothDevice && hrBluetoothDevice.gatt.connected) {
        hrBluetoothDevice.gatt.disconnect();
    }
}

/**
 * Handle heart rate measurement data
 * @param {Event} event - The characteristic value changed event
 * @param {Object} callbacks - Object containing callback functions
 */
function handleHeartRateChanged(event, callbacks) {
    try {
        const value = event.target.value;
        const heartRate = parseHeartRate(value);

        // Validate the heart rate is a reasonable number
        if (isNaN(heartRate) || heartRate < 0) {
            console.error('Invalid heart rate value:', heartRate);
            return;
        }

        callbacks.onHeartRateChange(heartRate);
    } catch (error) {
        console.error('Error parsing heart rate data:', error.message);
        // Don't update the UI with invalid data, just log the error
    }
}

/**
 * Handle heart rate monitor disconnection
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
function onHeartRateDisconnected(callbacks, elements) {
    callbacks.onStatusUpdate('Heart rate monitor disconnected.');
    if (elements.hrConnectionStatus) {
        elements.hrConnectionStatus.textContent = 'Disconnected';
    }

    // Clean up characteristic handler
    if (hrCharacteristic && hrCharacteristicHandler) {
        try {
            hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
        } catch (e) {
            console.warn('Error removing HR characteristic listener on disconnect:', e);
        }
        hrCharacteristicHandler = null;
        hrCharacteristic = null;
    }

    // Clean up event listener
    if (hrBluetoothDevice && hrDisconnectHandler) {
        hrBluetoothDevice.removeEventListener('gattserverdisconnected', hrDisconnectHandler);
        hrDisconnectHandler = null;
    }
    hrBluetoothDevice = null;

    callbacks.onHeartRateChange(0);
    if (callbacks.onDisconnected) {
        callbacks.onDisconnected();
    }
}

/**
 * Clean up heart rate Bluetooth event listeners
 * Call this function when the app is closing or resetting connections
 */
export function cleanupHeartRateEventListeners() {
    if (hrBluetoothDevice && hrDisconnectHandler) {
        hrBluetoothDevice.removeEventListener('gattserverdisconnected', hrDisconnectHandler);
        hrDisconnectHandler = null;
    }
}
