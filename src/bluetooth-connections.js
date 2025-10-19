/**
 * Bluetooth Power Meter Connection Module
 * Handles Bluetooth connections for power meters, heart rate monitors, and cadence sensors
 */

import { parseHeartRate } from './heart-rate.js';
import { requestWakeLock } from './wake-lock.js';

// Bluetooth service UUIDs (using standard Bluetooth GATT service names)
const CYCLING_POWER_SERVICE_UUID = 'cycling_power';
const CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID = 'cycling_power_measurement';
const CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID = 'cycling_power_feature';
const CYCLING_CADENCE_SERVICE_UUID = 'cycling_speed_and_cadence';
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 'csc_measurement';

// Constants for device identification
const DEVICE_ID_SUFFIX_LENGTH = 6; // Characters to show from device ID

// Constants for cadence calculation
const CADENCE_RESET_TIMEOUT_MS = 3000; // Reset cadence after 3 seconds of no data

// Device connection state
let powerMeterDevice = null;
let hrBluetoothDevice = null;
let speedCadenceBluetoothDevice = null;
let spyMeterDevice = null;

// Store event listener references for proper cleanup
let powerMeterDisconnectHandler = null;
let hrDisconnectHandler = null;
let speedCadenceDisconnectHandler = null;
let spyMeterDisconnectHandler = null;

// Store characteristics for proper cleanup and persistent connections
let hrCharacteristic = null;
let hrCharacteristicHandler = null;

// Cadence calculation variables
let lastCrankRevs = 0;
let lastCrankTime = 0;
let cadenceResetTimer = null;

/**
 * Connect to a power meter device
 * @param {Object} callbacks - Object containing callback functions
 * @param {Function} callbacks.onPowerMeasurement - Callback for power measurements
 * @param {Function} callbacks.onDisconnected - Callback for disconnection
 * @param {Function} callbacks.onStatusUpdate - Callback for status updates
 * @param {Object} elements - UI elements object
 */
export async function connectPowerMeter(callbacks, elements) {
    await requestWakeLock();

    if (!navigator.bluetooth) {
        callbacks.onStatusUpdate('Web Bluetooth API is not available.');
        return false;
    }

    try {
        callbacks.onStatusUpdate('Scanning for power meters...');

        // Clean up any existing connection before creating a new one
        if (powerMeterDevice) {
            if (powerMeterDisconnectHandler) {
                powerMeterDevice.removeEventListener('gattserverdisconnected', powerMeterDisconnectHandler);
                powerMeterDisconnectHandler = null;
            }
            if (powerMeterDevice.gatt.connected) {
                powerMeterDevice.gatt.disconnect();
            }
            powerMeterDevice = null;
        }

        // Scan specifically for devices advertising the Cycling Power service
        powerMeterDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: [CYCLING_POWER_SERVICE_UUID],
                },
            ],
        });

        // Validate that we got a device
        if (!powerMeterDevice) {
            throw new Error('No device selected');
        }

        callbacks.onStatusUpdate('Connecting to device...');
        if (elements.deviceNameElement) {
            elements.deviceNameElement.textContent = `Device: ${powerMeterDevice.name || 'Unknown Device'}`;
        }

        // Add disconnect listener BEFORE connecting
        powerMeterDisconnectHandler = () => {
            onPowerMeterDisconnected(callbacks, elements);
        };
        powerMeterDevice.addEventListener('gattserverdisconnected', powerMeterDisconnectHandler);

        const server = await powerMeterDevice.gatt.connect();
        const service = await server.getPrimaryService(CYCLING_POWER_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(
            CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID
        );

        // Check for and subscribe to advanced power features if available
        try {
            const featureCharacteristic = await service.getCharacteristic(
                CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID
            );
            // eslint-disable-next-line no-unused-vars
            const features = await featureCharacteristic.readValue();
            // This value can be used to determine what the power meter supports,
            // but for now we just parse what's in the measurement characteristic.
        } catch {
            // Cycling Power Feature characteristic not found
        }

        // Subscribe to power measurement notifications
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            handlePowerMeasurement(event, callbacks);
        });

        callbacks.onStatusUpdate('Connected and receiving data!');

        return true;
    } catch (error) {
        // Handle user cancellation separately from actual errors
        if (error.name === 'NotFoundError') {
            callbacks.onStatusUpdate('No device selected.');
        } else {
            callbacks.onStatusUpdate(`Error: ${error.message}`);
            console.error('Power meter connection failed:', error);
        }

        // Clean up on error
        if (powerMeterDevice) {
            if (powerMeterDisconnectHandler) {
                powerMeterDevice.removeEventListener('gattserverdisconnected', powerMeterDisconnectHandler);
                powerMeterDisconnectHandler = null;
            }
            powerMeterDevice = null;
        }

        return false;
    }
}

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
            } catch (e) {
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
            } catch (e) {
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
 * Connect to a speed/cadence sensor
 * @param {Object} callbacks - Object containing callback functions
 * @param {Object} elements - UI elements object
 */
export async function connectSpeedCadenceSensor(callbacks, elements) {
    await requestWakeLock();

    if (!navigator.bluetooth) {
        callbacks.onStatusUpdate('Web Bluetooth API is not available.');
        return;
    }

    try {
        callbacks.onStatusUpdate('Scanning for sensors...');
        if (elements.cadenceConnectionStatus) {
            elements.cadenceConnectionStatus.textContent = 'Connecting...';
        }

        // Reset cadence variables for clean start
        if (cadenceResetTimer) {
            clearTimeout(cadenceResetTimer);
            cadenceResetTimer = null;
        }
        lastCrankRevs = 0;
        lastCrankTime = 0;

        speedCadenceBluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: [CYCLING_CADENCE_SERVICE_UUID],
                },
            ],
        });

        callbacks.onStatusUpdate('Connecting to device...');
        if (elements.cadenceDeviceName) {
            elements.cadenceDeviceName.textContent = `Device: ${speedCadenceBluetoothDevice.name}`;
        }

        speedCadenceBluetoothDevice.addEventListener('gattserverdisconnected', () => {
            onCadenceDisconnected(callbacks, elements);
        });

        const server = await speedCadenceBluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService(CYCLING_CADENCE_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CSC_MEASUREMENT_CHARACTERISTIC_UUID);

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            handleSpeedCadenceMeasurement(event, callbacks);
        });

        callbacks.onStatusUpdate('Connected!');
        if (elements.cadenceConnectionStatus) {
            elements.cadenceConnectionStatus.textContent = 'Connected';
        }

        return true;
    } catch (error) {
        callbacks.onStatusUpdate(`Error: ${error.message}`);
        if (elements.cadenceConnectionStatus) {
            elements.cadenceConnectionStatus.textContent = 'Connection Failed';
        }
        console.error('Speed/Cadence connection failed:', error);
        return false;
    }
}

/**
 * Connect to a spy power meter
 * @param {Object} elements - UI elements object
 */
export async function connectSpyMeter(elements) {
    if (!navigator.bluetooth) {
        console.error('Web Bluetooth API is not available.');
        return false;
    }

    try {
        if (elements.spyInstructionsElement) {
            elements.spyInstructionsElement.style.display = 'none';
        }
        if (elements.spyStatusElement) {
            elements.spyStatusElement.textContent = 'Scanning for spy power meter...';
            elements.spyStatusElement.style.display = 'block';
        }

        // Clean up any existing spy meter connection
        if (spyMeterDevice) {
            if (spyMeterDisconnectHandler) {
                spyMeterDevice.removeEventListener('gattserverdisconnected', spyMeterDisconnectHandler);
                spyMeterDisconnectHandler = null;
            }
            if (spyMeterDevice.gatt.connected) {
                spyMeterDevice.gatt.disconnect();
            }
            spyMeterDevice = null;
        }

        // Scan for devices advertising the Cycling Power service
        spyMeterDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: [CYCLING_POWER_SERVICE_UUID],
                },
            ],
        });

        // Validate that we got a device
        if (!spyMeterDevice) {
            throw new Error('No device selected');
        }

        if (elements.spyStatusElement) {
            elements.spyStatusElement.textContent = 'Connecting to spy device...';
        }

        // Add disconnect listener BEFORE connecting
        spyMeterDisconnectHandler = () => {
            onSpyDisconnected(elements);
        };
        spyMeterDevice.addEventListener('gattserverdisconnected', spyMeterDisconnectHandler);

        const server = await spyMeterDevice.gatt.connect();
        const service = await server.getPrimaryService(CYCLING_POWER_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(
            CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID
        );

        // Subscribe to power measurement notifications
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            handleSpyPowerMeasurement(event, elements);
        });

        if (elements.spyStatusElement) {
            elements.spyStatusElement.textContent = 'Spy connected!';
            elements.spyStatusElement.style.display = 'none';
        }

        return true;
    } catch (error) {
        // Handle user cancellation separately
        if (error.name === 'NotFoundError') {
            if (elements.spyStatusElement) {
                elements.spyStatusElement.textContent = 'No device selected';
            }
        } else {
            if (elements.spyStatusElement) {
                elements.spyStatusElement.textContent = `Spy Error: ${error.message}`;
            }
            console.error('Spy connection failed:', error);
        }

        // Clean up on error
        if (spyMeterDevice) {
            if (spyMeterDisconnectHandler) {
                spyMeterDevice.removeEventListener('gattserverdisconnected', spyMeterDisconnectHandler);
                spyMeterDisconnectHandler = null;
            }
            spyMeterDevice = null;
        }

        // Show instructions again if connection failed
        setTimeout(() => {
            if (elements.spyStatusElement) {
                elements.spyStatusElement.style.display = 'none';
            }
            if (elements.spyInstructionsElement) {
                elements.spyInstructionsElement.style.display = 'block';
            }
        }, 3000);

        return false;
    }
}

/**
 * Disconnect spy meter
 * @param {Object} elements - UI elements object
 */
export function disconnectSpyMeter(elements) {
    if (spyMeterDevice && spyMeterDevice.gatt.connected) {
        spyMeterDevice.gatt.disconnect();
    }
    spyMeterDevice = null;
    if (elements.spyValueElement) {
        elements.spyValueElement.textContent = '--';
    }
    if (elements.spyStatusElement) {
        elements.spyStatusElement.style.display = 'none';
    }
    if (elements.spyInstructionsElement) {
        elements.spyInstructionsElement.style.display = 'block';
    }
}

/**
 * Check if power meter is connected
 * @returns {boolean}
 */
export function isPowerMeterConnected() {
    return powerMeterDevice && powerMeterDevice.gatt.connected;
}

/**
 * Check if spy meter is connected
 * @returns {boolean}
 */
export function isSpyMeterConnected() {
    return spyMeterDevice && spyMeterDevice.gatt.connected;
}

/**
 * Check if heart rate monitor is connected
 * @returns {boolean}
 */
export function isHeartRateConnected() {
    return hrBluetoothDevice && hrBluetoothDevice.gatt.connected;
}

/**
 * Check if speed/cadence sensor is connected
 * @returns {boolean}
 */
export function isSpeedCadenceConnected() {
    return speedCadenceBluetoothDevice && speedCadenceBluetoothDevice.gatt.connected;
}

// Event handlers
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

function handleSpyPowerMeasurement(event, elements) {
    try {
        const value = event.target.value;

        // Validate input
        if (!value || !(value instanceof DataView)) {
            console.error('Invalid spy power measurement data: value must be a DataView');
            return;
        }

        // Need at least 4 bytes for power data
        if (value.byteLength < 4) {
            console.error(`Invalid spy power measurement data: insufficient data (${value.byteLength} bytes)`);
            return;
        }

        // Parse cycling power measurement data (same format as main power meter)
        // Read instantaneous power (16-bit signed integer, little endian)
        const instantaneousPower = value.getInt16(2, true);

        // Validate power value
        if (isNaN(instantaneousPower)) {
            console.error('Invalid spy power value: NaN');
            return;
        }

        // Warn about unusual values
        if (instantaneousPower > 3000) {
            console.warn(`Unusually high spy power detected: ${instantaneousPower}W`);
        } else if (instantaneousPower < -500) {
            console.warn(`Unusually low spy power detected: ${instantaneousPower}W`);
        }

        if (elements.spyValueElement) {
            elements.spyValueElement.textContent = instantaneousPower;
        }
    } catch (error) {
        console.error('Error parsing spy power measurement data:', error.message);
        // Don't update the UI with invalid data, just log the error
    }
}

// Disconnection handlers
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

function onSpyDisconnected(elements) {
    // Clean up event listener
    if (spyMeterDevice && spyMeterDisconnectHandler) {
        spyMeterDevice.removeEventListener('gattserverdisconnected', spyMeterDisconnectHandler);
        spyMeterDisconnectHandler = null;
    }
    spyMeterDevice = null;

    if (elements.spyValueElement) {
        elements.spyValueElement.textContent = '--';
    }
    if (elements.spyStatusElement) {
        elements.spyStatusElement.textContent = 'Spy disconnected';
        elements.spyStatusElement.style.display = 'block';
    }
    setTimeout(() => {
        if (elements.spyStatusElement) {
            elements.spyStatusElement.style.display = 'none';
        }
        if (elements.spyInstructionsElement) {
            elements.spyInstructionsElement.style.display = 'block';
        }
    }, 3000);
}

/**
 * Clean up all Bluetooth event listeners
 * Call this function when the app is closing or resetting connections
 */
export function cleanupBluetoothEventListeners() {
    if (powerMeterDevice && powerMeterDisconnectHandler) {
        powerMeterDevice.removeEventListener('gattserverdisconnected', powerMeterDisconnectHandler);
        powerMeterDisconnectHandler = null;
    }

    if (hrBluetoothDevice && hrDisconnectHandler) {
        hrBluetoothDevice.removeEventListener('gattserverdisconnected', hrDisconnectHandler);
        hrDisconnectHandler = null;
    }

    if (speedCadenceBluetoothDevice && speedCadenceDisconnectHandler) {
        speedCadenceBluetoothDevice.removeEventListener('gattserverdisconnected', speedCadenceDisconnectHandler);
        speedCadenceDisconnectHandler = null;
    }

    if (spyMeterDevice && spyMeterDisconnectHandler) {
        spyMeterDevice.removeEventListener('gattserverdisconnected', spyMeterDisconnectHandler);
        spyMeterDisconnectHandler = null;
    }
}