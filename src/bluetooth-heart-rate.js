/**
 * Bluetooth Heart Rate Monitor Module
 * Handles Bluetooth connections for heart rate monitors
 */

import { parseHeartRate } from './heart-rate.js';
import { requestWakeLock } from './wake-lock.js';

// Constants for device identification
const DEVICE_ID_SUFFIX_LENGTH = 6; // Characters to show from device ID

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

    if (!navigator.bluetooth) {
        callbacks.onStatusUpdate('Web Bluetooth API is not available.');
        return false;
    }

    try {
        callbacks.onStatusUpdate('Scanning for devices...');
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Connecting...';
        }

        // Clean up any existing connection before creating a new one
        if (hrBluetoothDevice) {
            // Clean up characteristic handler
            if (hrCharacteristic && hrCharacteristicHandler) {
                try {
                    hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
                } catch (e) {
                    console.warn('Error removing HR characteristic listener:', e);
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

        await connectToHRDevice(hrBluetoothDevice, callbacks, elements);
        return true;

    } catch (error) {
        // Handle user cancellation separately from actual errors
        if (error.name === 'NotFoundError') {
            callbacks.onStatusUpdate('No device selected.');
            if (elements.hrConnectionStatus) {
                elements.hrConnectionStatus.textContent = 'Disconnected';
            }
        } else {
            callbacks.onStatusUpdate(`Error: ${error.message}`);
            if (elements.hrConnectionStatus) {
                elements.hrConnectionStatus.textContent = 'Connection Failed';
            }
            console.error('Heart rate monitor connection failed:', error);
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
 * @param {hrBluetoothDevice} device - The Bluetooth device to connect to
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
async function connectToHRDevice(device, callbacks, elements) {
    callbacks.onStatusUpdate('Connecting to device...');

    // Add disconnect listener BEFORE connecting
    hrDisconnectHandler = () => {
        onHeartRateDisconnected(callbacks, elements);
    };
    device.addEventListener('gattserverdisconnected', hrDisconnectHandler);

    try {
        // Check if already connected, if not, connect
        const hrServer = device.gatt.connected ? device.gatt : await device.gatt.connect();

        // Get enhanced device information AFTER successful connection
        const deviceInfo = await getEnhancedDeviceInfo(device);
        if (elements.hrDeviceName) {
            elements.hrDeviceName.textContent = `Device: ${deviceInfo}`;
        }

        const hrService = await hrServer.getPrimaryService('heart_rate');
        hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');

        // Clean up any existing handler before adding a new one
        if (hrCharacteristicHandler) {
            try {
                hrCharacteristic.removeEventListener('characteristicvaluechanged', hrCharacteristicHandler);
            } catch (e) {
                console.warn('Error removing old HR characteristic listener:', e);
            }
        }

        // Start notifications to receive heart rate data
        await hrCharacteristic.startNotifications();

        // Store the handler reference for proper cleanup
        hrCharacteristicHandler = (event) => {
            handleHeartRateChanged(event, callbacks);
        };

        hrCharacteristic.addEventListener('characteristicvaluechanged', hrCharacteristicHandler);

        callbacks.onStatusUpdate('Connected!');
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Connected';
        }
    } catch (error) {
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
 * Get enhanced device information for better identification
 * @param {BluetoothDevice} device - The Bluetooth device
 * @returns {Promise<string>} Enhanced device information string
 */
async function getEnhancedDeviceInfo(device) {
    let deviceInfo = device.name || 'Unknown Device';

    try {
        // Don't reconnect if already connected - use existing connection
        const server = device.gatt.connected ? device.gatt : await device.gatt.connect();

        // Try to get device information service for more details
        try {
            const deviceInfoService = await server.getPrimaryService('device_information');

            // Try to get manufacturer name
            const manufacturer = await readDeviceCharacteristic(deviceInfoService, 'manufacturer_name_string');
            if (manufacturer) {
                deviceInfo += ` (${manufacturer})`;
            }

            // Try to get model number
            const model = await readDeviceCharacteristic(deviceInfoService, 'model_number_string');
            if (model) {
                deviceInfo += ` ${model}`;
            }

        } catch (e) { //eslint-disable-line no-unused-vars
            // Device information service not available
        }

    } catch (e) { //eslint-disable-line no-unused-vars
        // Connection failed or server not available, use basic info
    }

    // Add device ID as fallback identifier to distinguish identical names
    if (device.id) {
        deviceInfo += ` [${device.id.slice(-DEVICE_ID_SUFFIX_LENGTH)}]`;
    }

    return deviceInfo;
}

/**
 * Read a string characteristic from a Bluetooth service
 * @param {BluetoothRemoteGATTService} service - The Bluetooth GATT service
 * @param {string} characteristicName - Name of the characteristic to read
 * @returns {Promise<string|null>} Decoded string value or null if not available
 */
async function readDeviceCharacteristic(service, characteristicName) {
    try {
        const characteristic = await service.getCharacteristic(characteristicName);
        const value = await characteristic.readValue();
        return new TextDecoder().decode(value);
    } catch (e) { //eslint-disable-line no-unused-vars
        // Characteristic not available
        return null;
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
    if (elements.hrDeviceName) {
        elements.hrDeviceName.textContent = '';
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
