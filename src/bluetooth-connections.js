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
        return;
    }

    try {
        callbacks.onStatusUpdate('Scanning for power meters...');

        // Scan specifically for devices advertising the Cycling Power service
        powerMeterDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: [CYCLING_POWER_SERVICE_UUID],
                },
            ],
        });

        callbacks.onStatusUpdate('Connecting to device...');
        if (elements.deviceNameElement) {
            elements.deviceNameElement.textContent = `Device: ${powerMeterDevice.name || 'Unknown Device'}`;
        }

        powerMeterDevice.addEventListener('gattserverdisconnected', () => {
            onPowerMeterDisconnected(callbacks, elements);
        });

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
        callbacks.onStatusUpdate(`Error: ${error.message}`);
        console.error('Connection failed:', error);
        if (powerMeterDevice) {
            powerMeterDevice.removeEventListener('gattserverdisconnected', () => {
                onPowerMeterDisconnected(callbacks, elements);
            });
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
        return;
    }

    try {
        callbacks.onStatusUpdate('Scanning for devices...');
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Connecting...';
        }

        // Show device selection
        hrBluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: ['heart_rate'],
                },
            ],
            optionalServices: ['device_information', 'battery_service'] // Get additional info if available
        });

        await connectToHRDevice(hrBluetoothDevice, callbacks, elements);
        return true;

    } catch (error) {
        callbacks.onStatusUpdate(`Error: ${error.message}`);
        if (elements.hrConnectionStatus) {
            elements.hrConnectionStatus.textContent = 'Connection Failed';
        }
        console.error('Connection failed:', error);
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

    // Get enhanced device information
    const deviceInfo = await getEnhancedDeviceInfo(device);
    if (elements.hrDeviceName) {
        elements.hrDeviceName.textContent = `Device: ${deviceInfo}`;
    }

    // Add disconnect listener
    hrDisconnectHandler = () => {
        onHeartRateDisconnected(callbacks, elements);
    };
    device.addEventListener('gattserverdisconnected', hrDisconnectHandler);

    const hrServer = await device.gatt.connect();
    const hrService = await hrServer.getPrimaryService('heart_rate');
    const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');

    // Start notifications to receive heart rate data
    await hrCharacteristic.startNotifications();
    hrCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        handleHeartRateChanged(event, callbacks);
    });

    callbacks.onStatusUpdate('Connected!');
    if (elements.hrConnectionStatus) {
        elements.hrConnectionStatus.textContent = 'Connected';
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
        const server = await device.gatt.connect();

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
        return;
    }

    try {
        if (elements.spyInstructionsElement) {
            elements.spyInstructionsElement.style.display = 'none';
        }
        if (elements.spyStatusElement) {
            elements.spyStatusElement.textContent = 'Scanning for spy power meter...';
            elements.spyStatusElement.style.display = 'block';
        }

        // Scan for devices advertising the Cycling Power service
        spyMeterDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: [CYCLING_POWER_SERVICE_UUID],
                },
            ],
        });

        if (elements.spyStatusElement) {
            elements.spyStatusElement.textContent = 'Connecting to spy device...';
        }

        spyMeterDevice.addEventListener('gattserverdisconnected', () => {
            onSpyDisconnected(elements);
        });

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
        if (elements.spyStatusElement) {
            elements.spyStatusElement.textContent = `Spy Error: ${error.message}`;
        }
        console.error('Spy connection failed:', error);
        if (spyMeterDevice) {
            spyMeterDevice.removeEventListener('gattserverdisconnected', () => {
                onSpyDisconnected(elements);
            });
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
    const value = event.target.value;

    // The data is a DataView object with a flags field and the power value.
    // Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
    const offset = 2;
    const power = value.getInt16(offset, true);

    callbacks.onPowerMeasurement(power);
}

function handleHeartRateChanged(event, callbacks) {
    const value = event.target.value;
    const heartRate = parseHeartRate(value);
    callbacks.onHeartRateChange(heartRate);
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
    const value = event.target.value;
    const data = new Uint8Array(value.buffer);

    // Parse cycling power measurement data (same format as main power meter)
    let instantaneousPower = 0;

    if (data.length >= 4) {
        // Read instantaneous power (16-bit unsigned integer, little endian)
        instantaneousPower = data[2] + (data[3] << 8);
    }

    if (elements.spyValueElement) {
        elements.spyValueElement.textContent = instantaneousPower;
    }
}

// Disconnection handlers
function onPowerMeterDisconnected(callbacks, elements) {
    callbacks.onStatusUpdate('Device disconnected.');
    if (elements.deviceNameElement) {
        elements.deviceNameElement.textContent = '';
    }
    if (powerMeterDevice) {
        powerMeterDevice.removeEventListener('gattserverdisconnected', () => {
            onPowerMeterDisconnected(callbacks, elements);
        });
        powerMeterDevice = null;
    }
    callbacks.onDisconnected();
}

function onHeartRateDisconnected(callbacks, elements) {
    callbacks.onStatusUpdate('Device disconnected.');
    if (elements.hrConnectionStatus) {
        elements.hrConnectionStatus.textContent = 'Disconnected';
    }
    if (elements.hrDeviceName) {
        elements.hrDeviceName.textContent = '';
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