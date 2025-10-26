/**
 * Bluetooth Cycling Sensors Module
 * Handles Bluetooth connections for power meters and cadence sensors
 */

import { requestWakeLock } from './wake-lock.js';

// Bluetooth service UUIDs (using standard Bluetooth GATT service names)
const CYCLING_POWER_SERVICE_UUID = 'cycling_power';
const CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID = 'cycling_power_measurement';
const CYCLING_CADENCE_SERVICE_UUID = 'cycling_speed_and_cadence';
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 'csc_measurement';

// Constants for cadence calculation
const CADENCE_RESET_TIMEOUT_MS = 3000; // Reset cadence after 3 seconds of no data

// Device connection state
let powerMeterDevice = null;
let speedCadenceBluetoothDevice = null;

// Store event listener references for proper cleanup
let powerMeterDisconnectHandler = null;
let speedCadenceDisconnectHandler = null;

// Cadence calculation variables
let lastCrankRevs = 0;
let lastCrankTime = 0;
let cadenceResetTimer = null;

/**
 * Generic Bluetooth device connection function
 * @param {Object} config - Configuration object
 * @param {string} config.serviceUuid - Bluetooth service UUID
 * @param {string} config.characteristicUuid - Bluetooth characteristic UUID
 * @param {string} config.scanningMessage - Message to display while scanning
 * @param {string} config.connectedMessage - Message to display when connected
 * @param {string} config.errorPrefix - Prefix for error messages
 * @param {Object} config.deviceRef - Object containing device and handler references
 * @param {Function} config.onDisconnected - Disconnection handler function
 * @param {Function} config.onCharacteristicChange - Characteristic value change handler
 * @param {Function} config.preConnect - Optional function to run before connection (e.g., reset variables)
 * @param {Object} config.elements - UI elements configuration
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 * @returns {Promise<boolean>} - True if connection successful
 */
async function connectBluetoothDevice(config, callbacks, elements) {
    await requestWakeLock();

    if (!navigator.bluetooth) {
        callbacks.onStatusUpdate('Web Bluetooth API is not available.');
        return false;
    }

    try {
        callbacks.onStatusUpdate(config.scanningMessage);

        // Update status if element exists
        if (config.elements.statusElement && elements[config.elements.statusElement]) {
            elements[config.elements.statusElement].textContent = 'Connecting...';
        }

        // Run pre-connection setup if provided
        if (config.preConnect) {
            config.preConnect();
        }

        // Clean up any existing connection before creating a new one
        if (config.deviceRef.device) {
            if (config.deviceRef.handler) {
                config.deviceRef.device.removeEventListener('gattserverdisconnected', config.deviceRef.handler);
                config.deviceRef.handler = null;
            }
            if (config.deviceRef.device.gatt.connected) {
                config.deviceRef.device.gatt.disconnect();
            }
            config.deviceRef.device = null;
        }

        // Scan for device
        config.deviceRef.device = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: [config.serviceUuid],
                },
            ],
        });

        // Validate that we got a device
        if (!config.deviceRef.device) {
            throw new Error('No device selected');
        }

        callbacks.onStatusUpdate('Connecting to device...');

        // Update device name if element exists
        if (config.elements.nameElement && elements[config.elements.nameElement]) {
            elements[config.elements.nameElement].textContent = `Device: ${config.deviceRef.device.name || 'Unknown Device'}`;
        }

        // Add disconnect listener BEFORE connecting
        config.deviceRef.handler = () => {
            config.onDisconnected(callbacks, elements);
        };
        config.deviceRef.device.addEventListener('gattserverdisconnected', config.deviceRef.handler);

        const server = await config.deviceRef.device.gatt.connect();
        const service = await server.getPrimaryService(config.serviceUuid);
        const characteristic = await service.getCharacteristic(config.characteristicUuid);

        // Subscribe to notifications
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            config.onCharacteristicChange(event, callbacks);
        });

        callbacks.onStatusUpdate(config.connectedMessage);

        // Update status if element exists
        if (config.elements.statusElement && elements[config.elements.statusElement]) {
            elements[config.elements.statusElement].textContent = 'Connected';
        }

        return true;
    } catch (error) {
        // Handle user cancellation separately from actual errors
        if (error.name === 'NotFoundError') {
            callbacks.onStatusUpdate('No device selected.');
        } else {
            callbacks.onStatusUpdate(`Error: ${error.message}`);
            console.error(`${config.errorPrefix} connection failed:`, error);
        }

        // Update error status if element exists
        if (config.elements.statusElement && elements[config.elements.statusElement]) {
            elements[config.elements.statusElement].textContent = 'Connection Failed';
        }

        // Clean up on error
        if (config.deviceRef.device) {
            if (config.deviceRef.handler) {
                config.deviceRef.device.removeEventListener('gattserverdisconnected', config.deviceRef.handler);
                config.deviceRef.handler = null;
            }
            config.deviceRef.device = null;
        }

        return false;
    }
}

/**
 * Connect to a power meter device
 * @param {Object} callbacks - Object containing callback functions
 * @param {Function} callbacks.onPowerMeasurement - Callback for power measurements
 * @param {Function} callbacks.onDisconnected - Callback for disconnection
 * @param {Function} callbacks.onStatusUpdate - Callback for status updates
 * @param {Object} elements - UI elements object
 */
export async function connectPowerMeter(callbacks, elements) {
    const config = {
        serviceUuid: CYCLING_POWER_SERVICE_UUID,
        characteristicUuid: CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID,
        scanningMessage: 'Scanning for power meters...',
        connectedMessage: 'Connected and receiving data!',
        errorPrefix: 'Power meter',
        deviceRef: {
            device: powerMeterDevice,
            handler: powerMeterDisconnectHandler
        },
        onDisconnected: onPowerMeterDisconnected,
        onCharacteristicChange: handlePowerMeasurement,
        elements: {
            nameElement: 'deviceNameElement',
            statusElement: null
        }
    };

    const result = await connectBluetoothDevice(config, callbacks, elements);

    // Update module-level variables after connection
    powerMeterDevice = config.deviceRef.device;
    powerMeterDisconnectHandler = config.deviceRef.handler;

    return result;
}

/**
 * Connect to a speed/cadence sensor
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
export async function connectSpeedCadenceSensor(callbacks, elements) {
    const config = {
        serviceUuid: CYCLING_CADENCE_SERVICE_UUID,
        characteristicUuid: CSC_MEASUREMENT_CHARACTERISTIC_UUID,
        scanningMessage: 'Scanning for sensors...',
        connectedMessage: 'Connected!',
        errorPrefix: 'Speed/Cadence',
        deviceRef: {
            device: speedCadenceBluetoothDevice,
            handler: speedCadenceDisconnectHandler
        },
        onDisconnected: onCadenceDisconnected,
        onCharacteristicChange: handleSpeedCadenceMeasurement,
        preConnect: () => {
            // Reset cadence variables for clean start
            if (cadenceResetTimer) {
                clearTimeout(cadenceResetTimer);
                cadenceResetTimer = null;
            }
            lastCrankRevs = 0;
            lastCrankTime = 0;
        },
        elements: {
            nameElement: 'cadenceDeviceName',
            statusElement: 'cadenceConnectionStatus'
        }
    };

    const result = await connectBluetoothDevice(config, callbacks, elements);

    // Update module-level variables after connection
    speedCadenceBluetoothDevice = config.deviceRef.device;
    speedCadenceDisconnectHandler = config.deviceRef.handler;

    return result;
}

/**
 * Check if power meter is connected
 * @returns {boolean}
 */
export function isPowerMeterConnected() {
    return powerMeterDevice && powerMeterDevice.gatt.connected;
}

/**
 * Check if speed/cadence sensor is connected
 * @returns {boolean}
 */
export function isSpeedCadenceConnected() {
    return speedCadenceBluetoothDevice && speedCadenceBluetoothDevice.gatt.connected;
}

/**
 * Disconnect power meter
 */
export function disconnectPowerMeter() {
    if (powerMeterDevice && powerMeterDevice.gatt.connected) {
        powerMeterDevice.gatt.disconnect();
    }
}

/**
 * Disconnect speed/cadence sensor
 */
export function disconnectSpeedCadence() {
    if (speedCadenceBluetoothDevice && speedCadenceBluetoothDevice.gatt.connected) {
        speedCadenceBluetoothDevice.gatt.disconnect();
    }
}

/**
 * Handle power measurement data
 * @param {Event} event - The characteristic value changed event
 * @param {Object} callbacks - Object containing callback functions
 */
function handlePowerMeasurement(event, callbacks) {
    try {
        const value = event.target.value;

        // Validate input
        if (!value || !(value instanceof DataView)) {
            console.error('Invalid power measurement data: value must be a DataView');
            return;
        }

        // Need at least 4 bytes (2 bytes flags + 2 bytes power)
        if (value.byteLength < 4) {
            console.error(`Invalid power measurement data: insufficient data (${value.byteLength} bytes)`);
            return;
        }

        // The data is a DataView object with a flags field and the power value.
        // Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
        const offset = 2;
        const power = value.getInt16(offset, true);

        // Validate power is a reasonable value
        // Negative power can occur (e.g., when coasting with resistance)
        // but extremely negative values are likely errors
        if (isNaN(power)) {
            console.error('Invalid power value: NaN');
            return;
        }

        // Warn about unusual values (professional cyclists max ~2000W, errors often show up as very high values)
        if (power > 3000) {
            console.warn(`Unusually high power detected: ${power}W`);
        } else if (power < -500) {
            console.warn(`Unusually low power detected: ${power}W`);
        }

        callbacks.onPowerMeasurement(power);
    } catch (error) {
        console.error('Error parsing power measurement data:', error.message);
        // Don't update the UI with invalid data, just log the error
    }
}

/**
 * Handle speed/cadence measurement data
 * @param {Event} event - The characteristic value changed event
 * @param {Object} callbacks - Object containing callback functions
 */
function handleSpeedCadenceMeasurement(event, callbacks) {
    const value = event.target.value;
    const flags = value.getUint8(0);
    let offset = 1;

    const wheelRevsPresent = flags & 0x01;
    const crankRevsPresent = flags & 0x02;

    // Skip wheel revolution data since we don't need speed/distance
    if (wheelRevsPresent) {
        offset += 6; // Skip wheel data
    }

    if (crankRevsPresent) {
        const cumulativeCrankRevolutions = value.getUint16(offset, true);
        const lastCrankEventTime = value.getUint16(offset + 2, true); // 1/1024 seconds

        if (lastCrankRevs > 0) {
            const revs = cumulativeCrankRevolutions - lastCrankRevs;
            const time = (lastCrankEventTime - lastCrankTime) / 1024; // in seconds
            if (time > 0) {
                const cadence = (revs / time) * 60; // RPM
                const roundedCadence = Math.round(cadence);

                callbacks.onCadenceChange(roundedCadence);

                // Clear any existing reset timer
                if (cadenceResetTimer) {
                    clearTimeout(cadenceResetTimer);
                }

                // Set timer to reset cadence to 0 if no new data comes in
                cadenceResetTimer = setTimeout(() => {
                    callbacks.onCadenceChange(0);
                    cadenceResetTimer = null;
                }, CADENCE_RESET_TIMEOUT_MS);
            }
        }
        lastCrankRevs = cumulativeCrankRevolutions;
        lastCrankTime = lastCrankEventTime;
    }
}

/**
 * Handle power meter disconnection
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
function onPowerMeterDisconnected(callbacks, elements) {
    callbacks.onStatusUpdate('Power meter disconnected.');
    if (elements.deviceNameElement) {
        elements.deviceNameElement.textContent = '';
    }

    // Clean up event listener
    if (powerMeterDevice && powerMeterDisconnectHandler) {
        powerMeterDevice.removeEventListener('gattserverdisconnected', powerMeterDisconnectHandler);
        powerMeterDisconnectHandler = null;
    }
    powerMeterDevice = null;

    callbacks.onDisconnected();
}

/**
 * Handle cadence sensor disconnection
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
function onCadenceDisconnected(callbacks, elements) {
    callbacks.onStatusUpdate('Device disconnected.');
    if (elements.cadenceConnectionStatus) {
        elements.cadenceConnectionStatus.textContent = 'Disconnected';
    }
    if (elements.cadenceDeviceName) {
        elements.cadenceDeviceName.textContent = '';
    }
    speedCadenceBluetoothDevice = null;
    callbacks.onCadenceChange(0);
    if (callbacks.onDisconnected) {
        callbacks.onDisconnected();
    }

    // Clear cadence reset timer and reset variables
    if (cadenceResetTimer) {
        clearTimeout(cadenceResetTimer);
        cadenceResetTimer = null;
    }
    lastCrankRevs = 0;
    lastCrankTime = 0;
}

/**
 * Clean up cycling sensors Bluetooth event listeners
 * Call this function when the app is closing or resetting connections
 */
export function cleanupCyclingSensorsEventListeners() {
    if (powerMeterDevice && powerMeterDisconnectHandler) {
        powerMeterDevice.removeEventListener('gattserverdisconnected', powerMeterDisconnectHandler);
        powerMeterDisconnectHandler = null;
    }

    if (speedCadenceBluetoothDevice && speedCadenceDisconnectHandler) {
        speedCadenceBluetoothDevice.removeEventListener('gattserverdisconnected', speedCadenceDisconnectHandler);
        speedCadenceDisconnectHandler = null;
    }
}
