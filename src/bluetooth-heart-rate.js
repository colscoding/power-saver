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
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Scanning...';
        }

        // Clean up any existing connection before creating a new one
        if (hrBluetoothDevice) {
            callbacks.onStatusUpdate('Cleaning up previous connection...');
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
        callbacks.onStatusUpdate('Opening device picker...');

        // CRITICAL: requestDevice must be called directly in user gesture context on mobile
        // Cannot be deferred or wrapped in Promise on mobile browsers
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

        const deviceName = hrBluetoothDevice.name || 'Unknown';
        callbacks.onStatusUpdate(`Device selected: ${deviceName}`);
        console.log('[HR] Device selected:', deviceName);

        // Mobile compatibility: Ensure we're still in a valid execution context
        // Some mobile browsers are strict about timing after user gesture
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
        } else if (error.name === 'NetworkError') {
            // Network errors are common on mobile when Bluetooth is off or device out of range
            const message = 'Connection failed. Check Bluetooth is enabled and device is nearby.';
            console.error('[HR] Network error (mobile Bluetooth issue):', error);
            callbacks.onStatusUpdate(message);
            if (elements.hrConnectionStatus) {
                elements.hrConnectionStatus.textContent = 'Connection Failed';
            }
        } else if (error.name === 'NotSupportedError') {
            // Mobile browser may not support all Bluetooth features
            const message = 'Heart rate monitor not supported on this device.';
            console.error('[HR] Not supported error:', error);
            callbacks.onStatusUpdate(message);
            if (elements.hrConnectionStatus) {
                elements.hrConnectionStatus.textContent = 'Not Supported';
            }
        } else if (error.name === 'SecurityError') {
            // Security errors can happen if not in secure context or user gesture missing
            const message = 'Connection blocked. Ensure HTTPS and try again.';
            console.error('[HR] Security error (HTTPS or user gesture required):', error);
            callbacks.onStatusUpdate(message);
            if (elements.hrConnectionStatus) {
                elements.hrConnectionStatus.textContent = 'Security Error';
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
    const deviceName = device.name || 'Unknown Device';
    callbacks.onStatusUpdate(`Connecting to ${deviceName}...`);
    console.log('[HR] Starting connection to:', deviceName);

    // Add disconnect listener BEFORE connecting
    // CRITICAL: Use async function to prevent blocking on mobile
    hrDisconnectHandler = async () => {
        // Add small delay to allow GATT state to settle on mobile
        await new Promise(resolve => setTimeout(resolve, 100));
        onHeartRateDisconnected(callbacks, elements);
    };
    device.addEventListener('gattserverdisconnected', hrDisconnectHandler);

    try {
        // Validate device is not already connected (mobile compatibility)
        if (device.gatt.connected) {
            callbacks.onStatusUpdate('Resetting existing connection...');
            device.gatt.disconnect();
            // Wait for disconnect to complete on mobile
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Connect to GATT server
        callbacks.onStatusUpdate('Establishing GATT connection...');
        const hrServer = await device.gatt.connect();

        // Validate connection was successful (mobile compatibility check)
        if (!hrServer || !device.gatt.connected) {
            throw new Error('GATT server connection failed - device not connected');
        }

        callbacks.onStatusUpdate('Getting heart rate service...');
        const hrService = await hrServer.getPrimaryService('heart_rate');

        callbacks.onStatusUpdate('Configuring notifications...');
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
        callbacks.onStatusUpdate('Starting heart rate notifications...');
        await hrCharacteristic.startNotifications();

        // Validate notifications started successfully (mobile compatibility)
        if (!hrCharacteristic || !hrCharacteristic.value) {
            callbacks.onStatusUpdate('Waiting for heart rate data...');
        }

        // Store the handler reference for proper cleanup
        hrCharacteristicHandler = (event) => {
            handleHeartRateChanged(event, callbacks);
        };

        hrCharacteristic.addEventListener('characteristicvaluechanged', hrCharacteristicHandler);

        console.log('[HR] Connection complete!');
        callbacks.onStatusUpdate(`Connected to ${deviceName}!`);
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Connected';
        }
    } catch (error) {
        console.error('[HR] Connection error:', error);

        // Mobile-specific error messages
        if (error.message && error.message.includes('GATT')) {
            callbacks.onStatusUpdate('GATT connection failed (check device is on and nearby)');
            console.error('[HR] GATT connection issue - common on mobile devices');
        } else {
            callbacks.onStatusUpdate(`Connection failed: ${error.message}`);
        }

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
    // Enhanced check for mobile compatibility - verify both device and GATT state
    return hrBluetoothDevice &&
        hrBluetoothDevice.gatt &&
        hrBluetoothDevice.gatt.connected === true;
}

/**
 * Disconnect heart rate monitor
 */
export function disconnectHeartRate() {
    // Enhanced disconnect for mobile compatibility
    if (hrBluetoothDevice) {
        // Clean up characteristic listener first
        if (hrCharacteristic && hrCharacteristicHandler) {
            try {
                hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
                hrCharacteristicHandler = null;
            } catch (e) {
                console.warn('[HR] Error cleaning up characteristic listener:', e);
            }
        }

        // Stop notifications if possible
        if (hrCharacteristic && hrBluetoothDevice.gatt && hrBluetoothDevice.gatt.connected) {
            try {
                hrCharacteristic.stopNotifications().catch(() => {
                    // Ignore stopNotifications errors
                });
            } catch (e) {
                console.warn('[HR] Error stopping notifications:', e);
            }
        }

        hrCharacteristic = null;

        // Disconnect GATT
        if (hrBluetoothDevice.gatt && hrBluetoothDevice.gatt.connected) {
            try {
                hrBluetoothDevice.gatt.disconnect();
            } catch (e) {
                console.warn('[HR] Error disconnecting GATT:', e);
            }
        }
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
    console.log('[HR] Device disconnected event triggered');

    callbacks.onStatusUpdate('Heart rate monitor disconnected.');
    if (elements.hrConnectionStatus) {
        elements.hrConnectionStatus.textContent = 'Disconnected';
    }

    // Clean up characteristic handler
    if (hrCharacteristic && hrCharacteristicHandler) {
        try {
            hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
        } catch (e) {
            console.warn('[HR] Error removing HR characteristic listener on disconnect:', e);
        }
        hrCharacteristicHandler = null;
        hrCharacteristic = null;
    }

    // Clean up event listener
    if (hrBluetoothDevice && hrDisconnectHandler) {
        try {
            hrBluetoothDevice.removeEventListener('gattserverdisconnected', hrDisconnectHandler);
        } catch (e) {
            console.warn('[HR] Error removing disconnect listener:', e);
        }
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
