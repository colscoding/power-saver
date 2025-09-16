// Screen Wake Lock
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Screen Wake Lock is active.');
            wakeLock.addEventListener('release', () => {
                console.log('Screen Wake Lock was released.');
            });
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

async function releaseWakeLock() {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
}

const connectButton = document.getElementById('connectButton');
const statusText = document.getElementById('status');
const powerValueElement = document.getElementById('power-value');
const deviceNameElement = document.getElementById('device-name');
const exportButtons = document.getElementById('export-buttons');
const exportJsonButton = document.getElementById('exportJsonButton');
const exportCsvButton = document.getElementById('exportCsvButton');
exportButtons.style.display = 'block';

const balanceValueElement = document.getElementById('balance-value');
const smoothnessValueElement = document.getElementById('smoothness-value');
const torqueValueElement = document.getElementById('torque-value');


let powerData = [];
let lastPowerValue = 0;
let lastHeartRateValue = 0;
let lastCadenceValue = 0;
let lastSpeedValue = 0;
let lastBalanceValue = 0;
let lastSmoothnessValue = 0;
let lastTorqueValue = 0;
let totalDistance = 0;
let dataLoggerInterval = null;
let powerMeterDevice = null;
const CYCLING_POWER_SERVICE_UUID = 'cycling_power';
const CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID = 'cycling_power_measurement';
const CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID = 'cycling_power_feature';
const CYCLING_CADENCE_SERVICE_UUID = 'cycling_speed_and_cadence';
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 'csc_measurement';

connectButton.addEventListener('click', async () => {
    await requestWakeLock();
    if (!navigator.bluetooth) {
        statusText.textContent = 'Web Bluetooth API is not available.';
        return;
    }

    // Reset data from previous session
    powerData = [];
    lastPowerValue = 0;
    if (dataLoggerInterval) {
        clearInterval(dataLoggerInterval);
    }

    try {
        statusText.textContent = 'Scanning for power meters...';

        // Scan specifically for devices advertising the Cycling Power service
        powerMeterDevice = await navigator.bluetooth.requestDevice({
            filters: [{
                services: [CYCLING_POWER_SERVICE_UUID]
            }]
        });

        statusText.textContent = 'Connecting to device...';
        deviceNameElement.textContent = `Device: ${powerMeterDevice.name || 'Unknown Device'}`;

        powerMeterDevice.addEventListener('gattserverdisconnected', onDisconnected);

        const server = await powerMeterDevice.gatt.connect();
        const service = await server.getPrimaryService(CYCLING_POWER_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID);

        // Check for and subscribe to advanced power features if available
        try {
            const featureCharacteristic = await service.getCharacteristic(CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID);
            const features = await featureCharacteristic.readValue();
            console.log(`Power Features: ${features.getUint32(0, true)}`);
            // This value can be used to determine what the power meter supports,
            // but for now we just parse what's in the measurement characteristic.
        } catch (e) {
            console.log('Cycling Power Feature characteristic not found.');
        }

        // Subscribe to power measurement notifications
        await characteristic.startNotifications();

        characteristic.addEventListener('characteristicvaluechanged', handlePowerMeasurement);

        statusText.textContent = 'Connected and receiving data!';
        connectButton.disabled = true;
        // exportButtons.style.display = 'block';

        dataLoggerInterval = setInterval(() => {
            powerData.push({
                timestamp: Date.now(),
                power: lastPowerValue,
                heartRate: lastHeartRateValue,
                cadence: lastCadenceValue,
                speed: lastSpeedValue,
                distance: totalDistance,
                balance: lastBalanceValue,
                smoothness: lastSmoothnessValue,
                torque: lastTorqueValue
            });
        }, 100);

    } catch (error) {
        statusText.textContent = `Error: ${error.message}`;
        console.error('Connection failed:', error);
        if (powerMeterDevice) {
            powerMeterDevice.removeEventListener('gattserverdisconnected', onDisconnected);
        }
    }
});

exportJsonButton.addEventListener('click', () => {
    const jsonString = JSON.stringify(powerData, null, 2);
    const blob = new Blob([jsonString], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    a.download = `power_data_${dateString}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

exportCsvButton.addEventListener('click', () => {
    let csvContent = 'timestamp,power,heartRate,cadence,speed,distance,balance,smoothness,torque\n';
    powerData.forEach(row => {
        csvContent += `${row.timestamp},${row.power},${row.heartRate},${row.cadence},${row.speed},${row.distance},${row.balance || ''},${row.smoothness || ''},${row.torque || ''}\n`;
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    a.download = `power_data_${dateString}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});


function handlePowerMeasurement(event) {
    const value = event.target.value;
    // The data is a DataView object with a flags field and the power value.
    // Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
    const flags = value.getUint16(0, true);
    let offset = 2;

    // Power is always present
    const power = value.getInt16(offset, true);
    powerValueElement.textContent = power;
    lastPowerValue = power;
    offset += 2;

    // Reset optional values
    balanceValueElement.textContent = '--';
    lastBalanceValue = 0;
    smoothnessValueElement.textContent = '--';
    lastSmoothnessValue = 0;
    torqueValueElement.textContent = '--';
    lastTorqueValue = 0;


    // Check for Pedal Power Balance (Flag bit 0)
    if (flags & 0x0001) {
        const balance = value.getUint8(offset);
        // Balance is percentage of power from the right pedal
        balanceValueElement.textContent = `${100 - balance}/${balance}`;
        lastBalanceValue = balance;
        offset += 1;
    }

    // Skip Accumulated Torque (Flag bit 2)
    if (flags & 0x0004) {
        offset += 2;
    }

    // Skip Wheel Revolution Data (Flag bits 4 & 5)
    if (flags & 0x0010) {
        offset += 6;
    }

    // Skip Crank Revolution Data (Flag bit 6)
    if (flags & 0x0020) {
        offset += 4;
    }

    // Skip Extreme Force/Angle Magnitudes (Flag bits 7 & 8)
    if (flags & 0x0080) {
        offset += 6;
    }

    // Skip Top/Bottom Dead Spot Angles (Flag bits 9 & 10)
    if (flags & 0x0200) {
        offset += 4;
    }

    // Skip Accumulated Energy (Flag bit 11)
    if (flags & 0x0800) {
        offset += 2;
    }

    // Check for Torque Effectiveness and Pedal Smoothness (Flag bit 12)
    if (flags & 0x1000) {
        const torqueEffectiveness = value.getUint8(offset) / 2; // In percent
        const pedalSmoothness = value.getUint8(offset + 2) / 2; // In percent
        torqueValueElement.textContent = torqueEffectiveness.toFixed(1);
        smoothnessValueElement.textContent = pedalSmoothness.toFixed(1);
        lastTorqueValue = torqueEffectiveness;
        lastSmoothnessValue = pedalSmoothness;
        offset += 4; // 2 bytes for TE, 2 bytes for PS
    }
}
/**
 * Parses the Cycling Power Measurement characteristic data.
 * The data is a DataView object with a flags field and the power value.
 * The instantaneous power is a 16-bit signed integer starting at the 3rd byte (offset 2).
 * Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
 */
function parsePowerMeasurement(value) {
    // The first 2 bytes are flags. The next 2 bytes are the instantaneous power.
    // The power value is a signed 16-bit integer (sint16)
    const instantaneousPower = value.getInt16(2, /*littleEndian=*/ true);
    return instantaneousPower;
}

function onDisconnected() {
    statusText.textContent = 'Device disconnected.';
    deviceNameElement.textContent = '';
    powerValueElement.textContent = '--';
    balanceValueElement.textContent = '--';
    smoothnessValueElement.textContent = '--';
    torqueValueElement.textContent = '--';
    connectButton.disabled = false;
    if (dataLoggerInterval) {
        clearInterval(dataLoggerInterval);
        dataLoggerInterval = null;
    }
    if (powerMeterDevice) {
        powerMeterDevice.removeEventListener('gattserverdisconnected', onDisconnected);
        powerMeterDevice = null;
    }
    lastPowerValue = 0;
    lastBalanceValue = 0;
    lastSmoothnessValue = 0;
    lastTorqueValue = 0;
}


const heartData = [];
let hrDataLoggerInterval = null;

const hrConnectButton = document.getElementById('hrConnectButton');
const hrStatusText = document.getElementById('hrStatus');
const hrValue = document.getElementById('hr-value');
const hrDeviceName = document.getElementById('hrDeviceName');

let hrBluetoothDevice = null;

hrConnectButton.addEventListener('click', async () => {
    await requestWakeLock();
    if (!navigator.bluetooth) {
        hrStatusText.textContent = 'Web Bluetooth API is not available.';
        return;
    }

    try {
        hrStatusText.textContent = 'Scanning for devices...';

        // Filter for devices that advertise the 'heart_rate' service
        hrBluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{
                services: ['heart_rate']
            }]
        });

        hrStatusText.textContent = 'Connecting to device...';
        hrDeviceName.textContent = `Device: ${hrBluetoothDevice.name}`;

        // Add a listener for when the device gets disconnected
        hrBluetoothDevice.addEventListener('gattserverdisconnected', onDisconnectedHr);

        const hrServer = await hrBluetoothDevice.gatt.connect();
        const hrService = await hrServer.getPrimaryService('heart_rate');
        const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');

        // Start notifications to receive heart rate data
        await hrCharacteristic.startNotifications();

        hrCharacteristic.addEventListener('characteristicvaluechanged', handleHeartRateChanged);

        hrStatusText.textContent = 'Connected!';
        hrConnectButton.disabled = true;

    } catch (error) {
        hrStatusText.textContent = `Error: ${error.message}`;
        console.error('Connection failed:', error);
    }
});

function handleHeartRateChanged(event) {
    const value = event.target.value;
    const heartRate = parseHeartRate(value);
    hrValue.textContent = heartRate;
    lastHeartRateValue = heartRate;
}

/**
 * The heart rate measurement is a DataView object.
 * The first byte is a flag, and the subsequent byte(s) are the heart rate value.
 * We need to check the first bit of the flag to see if the value is 8-bit or 16-bit.
 */
function parseHeartRate(value) {
    const flags = value.getUint8(0);
    // Check if the heart rate value format is UINT16 (bit 0 is 1) or UINT8 (bit 0 is 0)
    const is16bit = (flags & 0x1);
    if (is16bit) {
        // If 16-bit, read 2 bytes starting from the second byte
        return value.getUint16(1, /*littleEndian=*/ true);
    } else {
        // If 8-bit, read 1 byte starting from the second byte
        return value.getUint8(1);
    }
}

function onDisconnectedHr() {
    hrStatusText.textContent = 'Device disconnected.';
    hrDeviceName.textContent = '';
    hrValue.textContent = '--';
    hrConnectButton.disabled = false;
    hrBluetoothDevice = null;
    lastHeartRateValue = 0;
}

const speedCadenceConnectButton = document.getElementById('speedCadenceConnectButton');
const cadenceValueElement = document.getElementById('cadence-value');
const speedValueElement = document.getElementById('speed-value');
const distanceValueElement = document.getElementById('distance-value');
const cadenceStatusText = document.getElementById('cadenceStatus');
const cadenceDeviceName = document.getElementById('cadenceDeviceName');
let speedCadenceBluetoothDevice = null;
const WHEEL_CIRCUMFERENCE = 2.105; // meters, for a 700x25c tire

speedCadenceConnectButton.addEventListener('click', async () => {
    await requestWakeLock();
    if (!navigator.bluetooth) {
        cadenceStatusText.textContent = 'Web Bluetooth API is not available.';
        return;
    }

    try {
        cadenceStatusText.textContent = 'Scanning for sensors...';

        speedCadenceBluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{
                services: [CYCLING_CADENCE_SERVICE_UUID]
            }]
        });

        cadenceStatusText.textContent = 'Connecting to device...';
        cadenceDeviceName.textContent = `Device: ${speedCadenceBluetoothDevice.name}`;

        speedCadenceBluetoothDevice.addEventListener('gattserverdisconnected', onDisconnectedSpeedCadence);

        const server = await speedCadenceBluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService(CYCLING_CADENCE_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CSC_MEASUREMENT_CHARACTERISTIC_UUID);

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleSpeedCadenceMeasurement);

        cadenceStatusText.textContent = 'Connected!';
        speedCadenceConnectButton.disabled = true;

    } catch (error) {
        cadenceStatusText.textContent = `Error: ${error.message}`;
        console.error('Speed/Cadence connection failed:', error);
    }
});

let lastWheelRevs = 0;
let lastWheelTime = 0;
let lastCrankRevs = 0;
let lastCrankTime = 0;

function handleSpeedCadenceMeasurement(event) {
    const value = event.target.value;
    const flags = value.getUint8(0);
    let offset = 1;

    const wheelRevsPresent = (flags & 0x01);
    const crankRevsPresent = (flags & 0x02);

    if (wheelRevsPresent) {
        const cumulativeWheelRevolutions = value.getUint32(offset, true);
        const lastWheelEventTime = value.getUint16(offset + 4, true); // 1/1024 seconds
        offset += 6;

        if (lastWheelRevs > 0) {
            const revs = cumulativeWheelRevolutions - lastWheelRevs;
            const time = (lastWheelEventTime - lastWheelTime) / 1024; // in seconds
            if (time > 0) {
                const distance = revs * WHEEL_CIRCUMFERENCE; // meters
                totalDistance += distance / 1000; // km
                const speed = (distance / time) * 3.6; // km/h
                speedValueElement.textContent = Math.round(speed);
                lastSpeedValue = Math.round(speed);
                distanceValueElement.textContent = totalDistance.toFixed(2);
            }
        }
        lastWheelRevs = cumulativeWheelRevolutions;
        lastWheelTime = lastWheelEventTime;
    }

    if (crankRevsPresent) {
        const cumulativeCrankRevolutions = value.getUint16(offset, true);
        const lastCrankEventTime = value.getUint16(offset + 2, true); // 1/1024 seconds

        if (lastCrankRevs > 0) {
            const revs = cumulativeCrankRevolutions - lastCrankRevs;
            const time = (lastCrankEventTime - lastCrankTime) / 1024; // in seconds
            if (time > 0) {
                const cadence = (revs / time) * 60; // RPM
                cadenceValueElement.textContent = Math.round(cadence);
                lastCadenceValue = Math.round(cadence);
            }
        }
        lastCrankRevs = cumulativeCrankRevolutions;
        lastCrankTime = lastCrankEventTime;
    }
}

function onDisconnectedSpeedCadence() {
    cadenceStatusText.textContent = 'Device disconnected.';
    cadenceDeviceName.textContent = '';
    cadenceValueElement.textContent = '--';
    speedValueElement.textContent = '--';
    speedCadenceConnectButton.disabled = false;
    speedCadenceBluetoothDevice = null;
    lastCadenceValue = 0;
    lastSpeedValue = 0;
}