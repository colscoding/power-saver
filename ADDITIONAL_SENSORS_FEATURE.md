# Additional Sensors Feature - Implementation Summary

## Overview
This document describes the implementation of the additional sensors feature, which replaced the previous "spy mode" functionality.

## Changes Made

### 1. Removed Spy Mode
- **Removed from HTML** (`index.html`): Removed spy mode menu toggle and spy mode section
- **Removed from CSS** (`styles.css`): Removed all spy-mode-specific styles
- **Removed from JavaScript**: Removed spy mode functions and references from:
  - `bluetooth-connections.js`
  - `script.js`
  - `ui-management.js`
  - `ui-event-handlers.js`

### 2. Added Additional Sensors Feature

#### New Menu Options
Added four new menu items for connecting additional sensors:
- ⚡ Connect Additional Power Meter
- ❤️ Connect Additional Heart Rate Monitor
- 🚴 Connect Additional Cadence Sensor
- 🏃 Connect Additional Speed Sensor

#### New UI Components
- **Additional Sensors Section**: A new collapsible section that displays cards for each connected additional sensor
- **Sensor Cards**: Dynamic cards showing real-time data from each additional sensor with:
  - Sensor type icon and name
  - Current value display
  - Unit label
  - Disconnect button
  - Color-coded accent based on sensor type

#### Data Storage
- Additional sensor data is stored separately from main sensor data
- Each sensor maintains a timestamped history of readings (up to 10,000 readings per sensor)
- Data structure: `additionalSensorsData[type][sensorId]`
  - `type`: power, heartRate, cadence, or speed
  - `sensorId`: Unique identifier for each sensor
  - Contains: sensor name and array of timestamped readings

#### Bluetooth Implementation (`bluetooth-connections.js`)
New functions for connecting to additional sensors:
- `connectAdditionalPowerMeter(callback)`: Connects to additional power meters
- `connectAdditionalHeartRateMonitor(callback)`: Connects to additional heart rate monitors
- `connectAdditionalCadenceSensor(callback)`: Connects to additional cadence sensors
- `connectAdditionalSpeedSensor(callback)`: Connects to additional speed sensors
- `disconnectAdditionalSensor(sensorId)`: Disconnects a specific additional sensor
- `getAdditionalSensors()`: Returns all connected additional sensors

Each sensor connection:
- Uses the same Bluetooth GATT services as main sensors
- Generates unique sensor IDs for tracking
- Handles automatic disconnection cleanup
- Provides measurement callbacks for real-time updates

#### UI Module (`additional-sensors-ui.js`)
New dedicated module for managing additional sensor UI:
- `setupAdditionalSensorMenuItems()`: Sets up menu item click handlers
- `addAdditionalSensorCard()`: Creates UI cards for connected sensors
- `updateAdditionalSensorValue()`: Updates sensor values in real-time
- Handles error messages with user-friendly descriptions
- Manages sensor card lifecycle (creation and removal)

### 3. Data Export Integration

#### CSV Export
- Additional sensor data is included as extra columns in CSV exports
- Each additional sensor gets its own column: `{type}_{deviceName}`
- Values are matched to main session timestamps using closest-match algorithm
- Only includes values within 1 second of main timestamp for accuracy

#### JSON Export
- JSON exports now include two sections:
  - `mainSensors`: Original power data array with power, heart rate, and cadence
  - `additionalSensors`: Object containing all additional sensor data organized by type

#### TCX Export
- TCX export remains unchanged (only includes main power sensor data)
- Additional sensors are excluded as per requirements

### 4. Session Persistence
- Session data now includes `additionalSensorsData` field
- Additional sensor data is saved and restored across browser sessions
- Works with existing 24-hour session timeout mechanism

## Code Quality Improvements

### Modularity
- Created dedicated `additional-sensors-ui.js` module for sensor UI management
- Separated concerns between connection logic and UI management
- Centralized sensor configuration in `SENSOR_CONFIGS` object

### Error Handling
- Comprehensive error handling for Bluetooth connection failures
- User-friendly error messages for common scenarios:
  - Device not selected
  - Bluetooth not supported
  - Permission denied
  - Connection failures

### Data Management
- Efficient data storage with automatic pruning (10,000 readings max per sensor)
- Timestamped readings for accurate data correlation
- Clean disconnection handling to prevent memory leaks

### Maintainability
- Clear function documentation with JSDoc comments
- Consistent naming conventions
- Reusable components and utilities
- Type-specific configurations reduce code duplication

## Usage

### Connecting Additional Sensors
1. Open the hamburger menu
2. Click on the desired sensor type menu item (e.g., "⚡ Connect Additional Power Meter")
3. Select the Bluetooth device from the browser dialog
4. The sensor card appears in the Additional Sensors section

### Viewing Multiple Sensors
- Multiple sensors of the same type can be connected simultaneously
- Each sensor displays real-time data in its own card
- Cards are organized in a responsive grid layout

### Disconnecting Sensors
- Click the "Disconnect" button on any sensor card
- The sensor card is removed from the UI
- The Additional Sensors section hides when no sensors are connected

### Exporting Data
- Additional sensor data is automatically included in JSON and CSV exports
- Use the existing export menu to download data
- TCX exports exclude additional sensor data (main power only)

## Technical Notes

### Bluetooth Services Used
- **Power Meters**: `cycling_power` service
- **Heart Rate Monitors**: `heart_rate` service  
- **Cadence/Speed Sensors**: `cycling_speed_and_cadence` service

### Data Update Frequency
- Additional sensors update at their native Bluetooth notification rate (typically 1-10 Hz)
- UI updates are immediate for responsive user experience
- Data is stored with millisecond-precision timestamps

### Browser Compatibility
- Requires Web Bluetooth API support
- Works in Chrome, Edge, and other Chromium-based browsers
- Not supported in Firefox or Safari (Web Bluetooth limitation)

## Future Enhancements (Optional)
- Add graphs for additional sensor data
- Export additional sensor data to separate files
- Configure wheel circumference for speed sensors
- Add sensor-specific settings and calibration options
- Support for more sensor types (temperature, altitude, etc.)
