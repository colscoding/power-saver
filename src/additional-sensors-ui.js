/**
 * Additional Sensors UI Module
 * Handles UI for managing multiple additional sensors
 */

import {
    connectAdditionalPowerMeter,
    connectAdditionalHeartRateMonitor,
    connectAdditionalCadenceSensor,
    connectAdditionalSpeedSensor,
    disconnectAdditionalSensor
} from './bluetooth-connections.js';

/**
 * Sensor type configuration
 */
const SENSOR_CONFIGS = {
    power: {
        icon: '⚡',
        unit: 'W',
        accentColor: '#f39c12',
        menuItemId: 'connectAdditionalPowerMenuItem',
        connectFunction: connectAdditionalPowerMeter
    },
    heartRate: {
        icon: '❤️',
        unit: 'bpm',
        accentColor: '#e74c3c',
        menuItemId: 'connectAdditionalHeartRateMenuItem',
        connectFunction: connectAdditionalHeartRateMonitor
    },
    cadence: {
        icon: '🚴',
        unit: 'rpm',
        accentColor: '#3498db',
        menuItemId: 'connectAdditionalCadenceMenuItem',
        connectFunction: connectAdditionalCadenceSensor
    },
    speed: {
        icon: '🏃',
        unit: 'km/h',
        accentColor: '#2ecc71',
        menuItemId: 'connectAdditionalSpeedMenuItem',
        connectFunction: connectAdditionalSpeedSensor
    }
};

/**
 * Add a card for an additional sensor
 * @param {Object} sensor - Sensor data object
 * @param {string} type - Sensor type (power, heartRate, cadence, speed)
 * @param {Function} onDisconnect - Callback when sensor is disconnected
 */
export function addAdditionalSensorCard(sensor, type, onDisconnect) {
    const section = document.getElementById('additionalSensorsSection');
    const grid = document.getElementById('additionalSensorsGrid');

    if (!section || !grid) {
        console.error('Additional sensors section not found');
        return;
    }

    const config = SENSOR_CONFIGS[type];
    if (!config) {
        console.error(`Unknown sensor type: ${type}`);
        return;
    }

    // Show the section if it's hidden
    section.style.display = 'block';

    // Create the card
    const card = document.createElement('div');
    card.className = 'additional-sensor-card';
    card.id = `sensor-card-${sensor.id}`;
    card.style.setProperty('--sensor-accent-color', config.accentColor);

    card.innerHTML = `
    <div class="additional-sensor-header">
      <span class="additional-sensor-type">${config.icon}</span>
      <span class="additional-sensor-name" title="${sensor.name}">${sensor.name}</span>
    </div>
    <div class="additional-sensor-value">${sensor.lastValue || 0}</div>
    <div class="additional-sensor-unit">${config.unit}</div>
    <button class="disconnect-sensor-button" data-sensor-id="${sensor.id}">
      Disconnect
    </button>
  `;

    // Add disconnect handler
    const disconnectBtn = card.querySelector('.disconnect-sensor-button');
    disconnectBtn.addEventListener('click', () => {
        disconnectAdditionalSensor(sensor.id);
        card.remove();

        // Hide section if no more sensors
        if (grid.children.length === 0) {
            section.style.display = 'none';
        }

        // Notify parent about disconnection
        if (onDisconnect) {
            onDisconnect(sensor.id, type);
        }
    });

    grid.appendChild(card);
}

/**
 * Update additional sensor card value
 * @param {string} sensorId - Sensor ID
 * @param {number} value - New value to display
 */
export function updateAdditionalSensorValue(sensorId, value) {
    const card = document.getElementById(`sensor-card-${sensorId}`);
    if (card) {
        const valueElement = card.querySelector('.additional-sensor-value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }
}

/**
 * Setup menu items for connecting additional sensors
 * @param {Object} elements - UI elements object
 * @param {Function} onMeasurementCallback - Callback for sensor measurements
 */
export function setupAdditionalSensorMenuItems(elements, onMeasurementCallback) {
    for (const [type, config] of Object.entries(SENSOR_CONFIGS)) {
        const menuItem = document.getElementById(config.menuItemId);

        if (menuItem) {
            menuItem.addEventListener('click', async () => {
                try {
                    const sensor = await config.connectFunction((id, value, name) => {
                        onMeasurementCallback(id, value, name, type);
                    });

                    addAdditionalSensorCard(sensor, type, (sensorId, sensorType) => {
                        // Handle disconnection in parent
                        onMeasurementCallback(sensorId, null, null, sensorType, true);
                    });

                    // Close the menu
                    if (elements.menuDropdown) {
                        elements.menuDropdown.classList.remove('active');
                    }
                } catch (error) {
                    console.error(`Failed to connect additional ${type} sensor:`, error);

                    // User-friendly error messages
                    let errorMessage = error.message;
                    if (error.name === 'NotFoundError') {
                        errorMessage = 'No device selected or device not found.';
                    } else if (error.name === 'NotSupportedError') {
                        errorMessage = 'Web Bluetooth is not supported on this device or browser.';
                    } else if (error.name === 'SecurityError') {
                        errorMessage = 'Bluetooth access denied. Please check permissions.';
                    }

                    alert(`Failed to connect additional ${type} sensor:\n${errorMessage}`);
                }
            });
        } else {
            console.warn(`Menu item not found: ${config.menuItemId}`);
        }
    }
}
