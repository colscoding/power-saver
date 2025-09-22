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
const exportRawJsonButton = document.getElementById('exportRawJsonButton');
const exportRawCsvButton = document.getElementById('exportRawCsvButton');

// Power averages elements
const avg10sCurrentElement = document.getElementById('avg10s-current');
const avg10sBestElement = document.getElementById('avg10s-best');
const avg30sCurrentElement = document.getElementById('avg30s-current');
const avg30sBestElement = document.getElementById('avg30s-best');
const avg1mCurrentElement = document.getElementById('avg1m-current');
const avg1mBestElement = document.getElementById('avg1m-best');
const avg2mCurrentElement = document.getElementById('avg2m-current');
const avg2mBestElement = document.getElementById('avg2m-best');
const avg4mCurrentElement = document.getElementById('avg4m-current');
const avg4mBestElement = document.getElementById('avg4m-best');

// Toggle elements
const toggleConnectSection = document.getElementById('toggleConnectSection');
const toggleExportSection = document.getElementById('toggleExportSection');
const connectSection = document.getElementById('connectSection');
const exportSection = document.getElementById('exportSection');
const powerAveragesSection = document.getElementById('powerAveragesSection');
const connectToggleText = document.getElementById('connectToggleText');
const exportToggleText = document.getElementById('exportToggleText');

// Hamburger menu elements
const hamburgerBtn = document.getElementById('hamburgerButton');
const menuDropdown = document.getElementById('menuDropdown');
const powerAveragesToggle = document.getElementById('powerAveragesToggle');
const powerMetricToggle = document.getElementById('powerMetricToggle');
const heartRateMetricToggle = document.getElementById('heartRateMetricToggle');
const cadenceMetricToggle = document.getElementById('cadenceMetricToggle');

// Metric card elements
const powerCard = document.querySelector('.power-card');
const heartRateCard = document.querySelector('.hr-card');
const cadenceCard = document.querySelector('.cadence-card');

// Debug: Check if elements exist
console.log('Hamburger elements:', {
    hamburgerBtn: hamburgerBtn,
    menuDropdown: menuDropdown,
    powerAveragesToggle: powerAveragesToggle,
    powerMetricToggle: powerMetricToggle,
    heartRateMetricToggle: heartRateMetricToggle,
    cadenceMetricToggle: cadenceMetricToggle
});

console.log('Metric card elements:', {
    powerCard: powerCard,
    heartRateCard: heartRateCard,
    cadenceCard: cadenceCard
});

const balanceValueElement = document.getElementById('balance-value');
const smoothnessValueElement = document.getElementById('smoothness-value');
const torqueValueElement = document.getElementById('torque-value');

// Status indicator elements
const powerStatusIndicator = document.getElementById('power-status-indicator');
const hrStatusIndicator = document.getElementById('hr-status-indicator');
const cadenceStatusIndicator = document.getElementById('cadence-status-indicator');
const speedStatusIndicator = document.getElementById('speed-status-indicator');
const distanceStatusIndicator = document.getElementById('distance-status-indicator');

// Initialize all status indicators to disconnected state
powerStatusIndicator.className = 'status-indicator';
hrStatusIndicator.className = 'status-indicator';
cadenceStatusIndicator.className = 'status-indicator';
speedStatusIndicator.className = 'status-indicator';
distanceStatusIndicator.className = 'status-indicator';

// Only add event listeners if elements exist
if (hamburgerBtn && menuDropdown) {
    // Hamburger menu functionality
    hamburgerBtn.addEventListener('click', function () {
        console.log('Hamburger button clicked');
        const isActive = menuDropdown.classList.contains('active');
        if (isActive) {
            menuDropdown.classList.remove('active');
            console.log('Menu dropdown hidden');
        } else {
            menuDropdown.classList.add('active');
            console.log('Menu dropdown shown');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.hamburger-menu')) {
            menuDropdown.classList.remove('active');
        }
    });
} else {
    console.error('Hamburger menu elements not found:', {
        hamburgerBtn: !!hamburgerBtn,
        menuDropdown: !!menuDropdown
    });
}

if (powerAveragesToggle && powerAveragesSection) {
    // Power averages toggle via hamburger menu
    let powerAveragesVisible = false;
    powerAveragesToggle.addEventListener('click', function () {
        console.log('Power averages toggle clicked');
        powerAveragesVisible = !powerAveragesVisible;

        if (powerAveragesVisible) {
            powerAveragesSection.style.display = 'block';
            powerAveragesToggle.classList.add('active');
            console.log('Power averages shown');
        } else {
            powerAveragesSection.style.display = 'none';
            powerAveragesToggle.classList.remove('active');
            console.log('Power averages hidden');
        }
        manageCollapsedSectionsLayout();
    });
} else {
    console.error('Power averages toggle elements not found:', {
        powerAveragesToggle: !!powerAveragesToggle,
        powerAveragesSection: !!powerAveragesSection
    });
}

// Power metric toggle via hamburger menu
if (powerMetricToggle && powerCard) {
    let powerMetricVisible = true; // Start visible by default
    powerMetricToggle.classList.add('active'); // Set initial active state

    powerMetricToggle.addEventListener('click', function () {
        console.log('Power metric toggle clicked');
        powerMetricVisible = !powerMetricVisible;

        if (powerMetricVisible) {
            powerCard.style.display = 'block';
            powerMetricToggle.classList.add('active');
            console.log('Power metric shown');
        } else {
            powerCard.style.display = 'none';
            powerMetricToggle.classList.remove('active');
            console.log('Power metric hidden');
        }
    });
} else {
    console.error('Power metric toggle elements not found:', {
        powerMetricToggle: !!powerMetricToggle,
        powerCard: !!powerCard
    });
}

// Heart rate metric toggle via hamburger menu
if (heartRateMetricToggle && heartRateCard) {
    let heartRateMetricVisible = true; // Start visible by default
    heartRateMetricToggle.classList.add('active'); // Set initial active state

    heartRateMetricToggle.addEventListener('click', function () {
        console.log('Heart rate metric toggle clicked');
        heartRateMetricVisible = !heartRateMetricVisible;

        if (heartRateMetricVisible) {
            heartRateCard.style.display = 'block';
            heartRateMetricToggle.classList.add('active');
            console.log('Heart rate metric shown');
        } else {
            heartRateCard.style.display = 'none';
            heartRateMetricToggle.classList.remove('active');
            console.log('Heart rate metric hidden');
        }
    });
} else {
    console.error('Heart rate metric toggle elements not found:', {
        heartRateMetricToggle: !!heartRateMetricToggle,
        heartRateCard: !!heartRateCard
    });
}

// Cadence metric toggle via hamburger menu
if (cadenceMetricToggle && cadenceCard) {
    let cadenceMetricVisible = true; // Start visible by default
    cadenceMetricToggle.classList.add('active'); // Set initial active state

    cadenceMetricToggle.addEventListener('click', function () {
        console.log('Cadence metric toggle clicked');
        cadenceMetricVisible = !cadenceMetricVisible;

        if (cadenceMetricVisible) {
            cadenceCard.style.display = 'block';
            cadenceMetricToggle.classList.add('active');
            console.log('Cadence metric shown');
        } else {
            cadenceCard.style.display = 'none';
            cadenceMetricToggle.classList.remove('active');
            console.log('Cadence metric hidden');
        }
    });
} else {
    console.error('Cadence metric toggle elements not found:', {
        cadenceMetricToggle: !!cadenceMetricToggle,
        cadenceCard: !!cadenceCard
    });
}

// Toggle functionality for connect section
toggleConnectSection.addEventListener('click', () => {
    const connectButtons = connectSection.querySelectorAll('button:not(.section-toggle-button)');
    const sectionHeader = connectSection.querySelector('.section-header');
    const isHidden = connectButtons[0].style.display === 'none';
    if (isHidden) {
        connectButtons.forEach(btn => btn.style.display = 'block');
        connectToggleText.textContent = 'Hide Connect Devices';
        toggleConnectSection.classList.remove('collapsed');
        connectSection.classList.remove('collapsed');
        sectionHeader.classList.remove('collapsed');
    } else {
        connectButtons.forEach(btn => btn.style.display = 'none');
        connectToggleText.textContent = 'Show Connect Devices';
        toggleConnectSection.classList.add('collapsed');
        connectSection.classList.add('collapsed');
        sectionHeader.classList.add('collapsed');
    }
    // Don't call updateDashboardLayout for bottom controls
});

// Toggle functionality for export section
toggleExportSection.addEventListener('click', () => {
    const exportButtons = document.getElementById('export-buttons');
    const sectionHeader = exportSection.querySelector('.section-header');
    const isHidden = exportButtons.style.display === 'none';
    if (isHidden) {
        exportSection.style.display = 'block';
        exportButtons.style.display = 'flex';
        exportToggleText.textContent = 'Hide Export Data';
        toggleExportSection.classList.remove('collapsed');
        exportSection.classList.remove('collapsed');
        sectionHeader.classList.remove('collapsed');
    } else {
        exportButtons.style.display = 'none';
        exportToggleText.textContent = 'Show Export Data';
        toggleExportSection.classList.add('collapsed');
        exportSection.classList.add('collapsed');
        sectionHeader.classList.add('collapsed');
    }
    // Don't call updateDashboardLayout for bottom controls
});

// Function to update dashboard layout based on visible sections
function updateDashboardLayout() {
    const dashboard = document.querySelector('.dashboard');
    const powerAveragesHidden = powerAveragesSection && powerAveragesSection.style.display === 'none';

    if (powerAveragesHidden) {
        dashboard.classList.add('maximized');
    } else {
        dashboard.classList.remove('maximized');
    }

    // Manage horizontal layout for collapsed sections (excluding bottom controls)
    manageCollapsedSectionsLayout();
}

// Function to manage horizontal layout of collapsed sections
function manageCollapsedSectionsLayout() {
    const dashboard = document.querySelector('.dashboard');

    // Only manage power averages section for collapsed layout - 
    // connect and export sections are now bottom controls and stay at bottom
    const collapsedSections = [
        powerAveragesSection.classList.contains('collapsed') ? powerAveragesSection : null
    ].filter(section => section !== null);

    // Remove any existing collapsed sections row
    const existingRow = document.querySelector('.collapsed-sections-row');
    if (existingRow) {
        // Move sections back to their original positions
        const sectionsInRow = existingRow.querySelectorAll('.power-averages-section');
        sectionsInRow.forEach(section => {
            // Insert sections back after the dashboard
            dashboard.parentNode.insertBefore(section, dashboard.nextSibling);
        });
        existingRow.remove();
    }

    // Power averages section doesn't need horizontal grouping since it's the only
    // section that can be managed this way now
    dashboard.classList.remove('has-collapsed-sections');
}

// Initialize sections - bottom controls are always visible
// Power averages section is controlled by hamburger menu
const connectButtons = connectSection.querySelectorAll('button:not(.section-toggle-button)');
connectButtons.forEach(btn => btn.style.display = 'block');

const exportButtonsContainer = document.getElementById('export-buttons');

// Initialize export section as collapsed
exportSection.style.display = 'block';
exportButtonsContainer.style.display = 'none';
toggleExportSection.classList.add('collapsed');
exportSection.classList.add('collapsed');
exportSection.querySelector('.section-header').classList.add('collapsed');

// Initialize power averages section as hidden (controlled by hamburger menu)
powerAveragesSection.style.display = 'none';

updateDashboardLayout();


let powerData = [];
let rawPowerMeasurements = [];
let lastPowerValue = 0;

// Power averaging data structures
let powerReadings = [];  // Array to store timestamped power readings
let powerAverages = {
    '10s': { current: 0, best: 0 },
    '30s': { current: 0, best: 0 },
    '1m': { current: 0, best: 0 },
    '2m': { current: 0, best: 0 },
    '4m': { current: 0, best: 0 }
};

// Power averaging functions
function addPowerReading(power) {
    const now = Date.now();
    powerReadings.push({ timestamp: now, power: power });

    // Keep only the last 4 minutes of readings (plus some buffer)
    const fourMinutesAgo = now - (5 * 60 * 1000); // 5 minutes to be safe
    powerReadings = powerReadings.filter(reading => reading.timestamp > fourMinutesAgo);

    // Calculate current averages
    calculatePowerAverages();
    updatePowerAveragesDisplay();
}

function calculatePowerAverages() {
    const now = Date.now();
    const periods = {
        '10s': 10 * 1000,
        '30s': 30 * 1000,
        '1m': 60 * 1000,
        '2m': 120 * 1000,
        '4m': 240 * 1000
    };

    for (const [periodKey, periodMs] of Object.entries(periods)) {
        const cutoffTime = now - periodMs;
        const relevantReadings = powerReadings.filter(reading => reading.timestamp >= cutoffTime);

        if (relevantReadings.length > 0) {
            const sum = relevantReadings.reduce((total, reading) => total + reading.power, 0);
            const average = Math.round(sum / relevantReadings.length);
            powerAverages[periodKey].current = average;

            // Update best if current is better
            if (average > powerAverages[periodKey].best) {
                powerAverages[periodKey].best = average;
            }
        } else {
            powerAverages[periodKey].current = 0;
        }
    }
}

function updatePowerAveragesDisplay() {
    avg10sCurrentElement.textContent = powerAverages['10s'].current || '--';
    avg10sBestElement.textContent = powerAverages['10s'].best || '--';
    avg30sCurrentElement.textContent = powerAverages['30s'].current || '--';
    avg30sBestElement.textContent = powerAverages['30s'].best || '--';
    avg1mCurrentElement.textContent = powerAverages['1m'].current || '--';
    avg1mBestElement.textContent = powerAverages['1m'].best || '--';
    avg2mCurrentElement.textContent = powerAverages['2m'].current || '--';
    avg2mBestElement.textContent = powerAverages['2m'].best || '--';
    avg4mCurrentElement.textContent = powerAverages['4m'].current || '--';
    avg4mBestElement.textContent = powerAverages['4m'].best || '--';
}

function resetPowerAverages() {
    powerReadings = [];
    for (const period of Object.keys(powerAverages)) {
        powerAverages[period].current = 0;
        powerAverages[period].best = 0;
    }
    updatePowerAveragesDisplay();
}

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
    rawPowerMeasurements = [];
    lastPowerValue = 0;
    resetPowerAverages();
    if (dataLoggerInterval) {
        clearInterval(dataLoggerInterval);
    }

    try {
        statusText.textContent = 'Scanning for power meters...';
        powerStatusIndicator.className = 'status-indicator connecting';

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
        powerStatusIndicator.className = 'status-indicator connected';
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
        powerStatusIndicator.className = 'status-indicator';
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

// Export raw power measurements as JSON
exportRawJsonButton.addEventListener('click', () => {
    const jsonString = JSON.stringify(rawPowerMeasurements, null, 2);
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
    a.download = `raw_power_measurements_${dateString}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Export raw power measurements as CSV
exportRawCsvButton.addEventListener('click', () => {
    let csvContent = 'timestamp,flags,dataLength,instantaneousPower,pedalPowerBalance,accumulatedTorque,wheelRevolutions,wheelEventTime,crankRevolutions,crankEventTime,maxForceMagnitude,minForceMagnitude,maxTorqueMagnitude,topDeadSpotAngle,bottomDeadSpotAngle,accumulatedEnergy,torqueEffectiveness,pedalSmoothness,rawBytes\n';

    rawPowerMeasurements.forEach(measurement => {
        const wheelRevs = measurement.wheelRevolutionData ? measurement.wheelRevolutionData.cumulativeWheelRevolutions : '';
        const wheelTime = measurement.wheelRevolutionData ? measurement.wheelRevolutionData.lastWheelEventTime : '';
        const crankRevs = measurement.crankRevolutionData ? measurement.crankRevolutionData.cumulativeCrankRevolutions : '';
        const crankTime = measurement.crankRevolutionData ? measurement.crankRevolutionData.lastCrankEventTime : '';
        const maxForce = measurement.extremeForceAngles ? measurement.extremeForceAngles.maximumForceMagnitude : '';
        const minForce = measurement.extremeForceAngles ? measurement.extremeForceAngles.minimumForceMagnitude : '';
        const maxTorque = measurement.extremeForceAngles ? measurement.extremeForceAngles.maximumTorqueMagnitude : '';
        const topAngle = measurement.topBottomDeadSpotAngles ? measurement.topBottomDeadSpotAngles.topDeadSpotAngle : '';
        const bottomAngle = measurement.topBottomDeadSpotAngles ? measurement.topBottomDeadSpotAngles.bottomDeadSpotAngle : '';

        csvContent += `${measurement.timestamp},${measurement.flags},${measurement.dataLength},${measurement.instantaneousPower},${measurement.pedalPowerBalance || ''},${measurement.accumulatedTorque || ''},${wheelRevs},${wheelTime},${crankRevs},${crankTime},${maxForce},${minForce},${maxTorque},${topAngle},${bottomAngle},${measurement.accumulatedEnergy || ''},${measurement.torqueEffectiveness || ''},${measurement.pedalSmoothness || ''},"${measurement.rawBytes}"\n`;
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
    a.download = `raw_power_measurements_${dateString}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});


function handlePowerMeasurement(event) {
    const value = event.target.value;
    const timestamp = Date.now();

    // Store raw measurement data for detailed analysis
    const rawMeasurement = {
        timestamp: timestamp,
        flags: value.getUint16(0, true),
        rawBytes: Array.from(new Uint8Array(value.buffer)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        dataLength: value.byteLength
    };

    // The data is a DataView object with a flags field and the power value.
    // Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
    const flags = value.getUint16(0, true);
    let offset = 2;

    // Power is always present
    const power = value.getInt16(offset, true);
    rawMeasurement.instantaneousPower = power;
    powerValueElement.textContent = power;
    lastPowerValue = power;

    // Add power reading to averaging calculations
    addPowerReading(power);

    offset += 2;

    // Reset optional values
    balanceValueElement.textContent = '--';
    lastBalanceValue = 0;
    smoothnessValueElement.textContent = '--';
    lastSmoothnessValue = 0;
    torqueValueElement.textContent = '--';
    lastTorqueValue = 0;

    // Initialize all optional fields
    rawMeasurement.pedalPowerBalance = null;
    rawMeasurement.accumulatedTorque = null;
    rawMeasurement.wheelRevolutionData = null;
    rawMeasurement.crankRevolutionData = null;
    rawMeasurement.extremeForceAngles = null;
    rawMeasurement.topBottomDeadSpotAngles = null;
    rawMeasurement.accumulatedEnergy = null;
    rawMeasurement.torqueEffectiveness = null;
    rawMeasurement.pedalSmoothness = null;

    // Check for Pedal Power Balance (Flag bit 0)
    if (flags & 0x0001) {
        const balance = value.getUint8(offset);
        rawMeasurement.pedalPowerBalance = balance;
        // Balance is percentage of power from the right pedal
        balanceValueElement.textContent = `${100 - balance}/${balance}`;
        lastBalanceValue = balance;
        offset += 1;
    }

    // Accumulated Torque (Flag bit 2)
    if (flags & 0x0004) {
        rawMeasurement.accumulatedTorque = value.getUint16(offset, true);
        offset += 2;
    }

    // Wheel Revolution Data (Flag bits 4 & 5)
    if (flags & 0x0010) {
        rawMeasurement.wheelRevolutionData = {
            cumulativeWheelRevolutions: value.getUint32(offset, true),
            lastWheelEventTime: value.getUint16(offset + 4, true)
        };
        offset += 6;
    }

    // Crank Revolution Data (Flag bit 6)
    if (flags & 0x0020) {
        rawMeasurement.crankRevolutionData = {
            cumulativeCrankRevolutions: value.getUint16(offset, true),
            lastCrankEventTime: value.getUint16(offset + 2, true)
        };
        offset += 4;
    }

    // Extreme Force/Angle Magnitudes (Flag bits 7 & 8)
    if (flags & 0x0080) {
        rawMeasurement.extremeForceAngles = {
            maximumForceMagnitude: value.getInt16(offset, true),
            minimumForceMagnitude: value.getInt16(offset + 2, true),
            maximumTorqueMagnitude: value.getInt16(offset + 4, true)
        };
        offset += 6;
    }

    // Top/Bottom Dead Spot Angles (Flag bits 9 & 10)
    if (flags & 0x0200) {
        rawMeasurement.topBottomDeadSpotAngles = {
            topDeadSpotAngle: value.getUint16(offset, true),
            bottomDeadSpotAngle: value.getUint16(offset + 2, true)
        };
        offset += 4;
    }

    // Accumulated Energy (Flag bit 11)
    if (flags & 0x0800) {
        rawMeasurement.accumulatedEnergy = value.getUint16(offset, true);
        offset += 2;
    }

    // Check for Torque Effectiveness and Pedal Smoothness (Flag bit 12)
    if (flags & 0x1000) {
        const torqueEffectiveness = value.getUint8(offset) / 2; // In percent
        const pedalSmoothness = value.getUint8(offset + 2) / 2; // In percent
        rawMeasurement.torqueEffectiveness = torqueEffectiveness;
        rawMeasurement.pedalSmoothness = pedalSmoothness;
        torqueValueElement.textContent = torqueEffectiveness.toFixed(1);
        smoothnessValueElement.textContent = pedalSmoothness.toFixed(1);
        lastTorqueValue = torqueEffectiveness;
        lastSmoothnessValue = pedalSmoothness;
        offset += 4; // 2 bytes for TE, 2 bytes for PS
    }

    // Store the complete raw measurement
    rawPowerMeasurements.push(rawMeasurement);
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
    powerStatusIndicator.className = 'status-indicator';
    deviceNameElement.textContent = '';
    powerValueElement.textContent = '--';
    balanceValueElement.textContent = '--';
    smoothnessValueElement.textContent = '--';
    torqueValueElement.textContent = '--';
    resetPowerAverages();
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
        hrStatusIndicator.className = 'status-indicator connecting';

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
        hrStatusIndicator.className = 'status-indicator connected';
        hrConnectButton.disabled = true;

    } catch (error) {
        hrStatusText.textContent = `Error: ${error.message}`;
        hrStatusIndicator.className = 'status-indicator';
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
    hrStatusIndicator.className = 'status-indicator';
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
        cadenceStatusIndicator.className = 'status-indicator connecting';
        speedStatusIndicator.className = 'status-indicator connecting';

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
        cadenceStatusIndicator.className = 'status-indicator connected';
        speedStatusIndicator.className = 'status-indicator connected';
        speedCadenceConnectButton.disabled = true;

    } catch (error) {
        cadenceStatusText.textContent = `Error: ${error.message}`;
        cadenceStatusIndicator.className = 'status-indicator';
        speedStatusIndicator.className = 'status-indicator';
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
    cadenceStatusIndicator.className = 'status-indicator';
    speedStatusIndicator.className = 'status-indicator';
    cadenceDeviceName.textContent = '';
    cadenceValueElement.textContent = '--';
    speedValueElement.textContent = '--';
    speedCadenceConnectButton.disabled = false;
    speedCadenceBluetoothDevice = null;
    lastCadenceValue = 0;
    lastSpeedValue = 0;
}