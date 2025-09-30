/**
 * Bluetooth Data Parsing Tests
 * 
 * Tests for parsing binary data from Bluetooth characteristics.
 * Covers power measurement and heart rate data parsing functionality.
 * 
 * @requires jest
 * @requires DataView mock (from setup.js)
 */

/* ==========================================================================
   Data Parsing Functions Under Test
   ========================================================================== */

/**
 * Parse power measurement data from Bluetooth characteristic
 * @param {DataView} value - DataView containing power measurement data
 * @returns {number} Instantaneous power in watts
 */
function parsePowerMeasurement(value) {
  const instantaneousPower = value.getInt16(2, true);
  return instantaneousPower;
}

/**
 * Parse heart rate data from Bluetooth characteristic
 * @param {DataView} value - DataView containing heart rate data
 * @returns {number} Heart rate in beats per minute
 */
function parseHeartRate(value) {
  const flags = value.getUint8(0);
  const is16bit = flags & 0x1;
  if (is16bit) {
    return value.getUint16(1, true);
  } else {
    return value.getUint8(1);
  }
}

/* ==========================================================================
   Test Data Constants
   ========================================================================== */

/** Test data for power measurement parsing */
const POWER_TEST_DATA = {
  NORMAL_POWER: {
    value: 250,
    buffer: new Uint8Array([0x00, 0x00, 0xfa, 0x00]), // 250W in little-endian
  },
  NEGATIVE_POWER: {
    value: -100,
    buffer: new Uint8Array([0x00, 0x00, 0x9c, 0xff]), // -100W in two's complement
  },
  ZERO_POWER: {
    value: 0,
    buffer: new Uint8Array([0x00, 0x00, 0x00, 0x00]),
  },
  MAX_POWER: {
    value: 32767,
    buffer: new Uint8Array([0x00, 0x00, 0xff, 0x7f]), // Max positive 16-bit signed
  },
};

/* ==========================================================================
   Test Suites
   ========================================================================== */

describe('Bluetooth Data Parsing', () => {
  describe('parsePowerMeasurement', () => {
    test('should parse normal power measurement correctly', () => {
      // Arrange
      const { buffer, value: expectedPower } = POWER_TEST_DATA.NORMAL_POWER;
      const mockDataView = new DataView(buffer.buffer);

      // Act
      const result = parsePowerMeasurement(mockDataView);

      // Assert
      expect(result).toBe(expectedPower);
    });

    test('should handle negative power values', () => {
      // Arrange
      const { buffer, value: expectedPower } = POWER_TEST_DATA.NEGATIVE_POWER;
      const mockDataView = new DataView(buffer.buffer);

      // Act
      const result = parsePowerMeasurement(mockDataView);

      // Assert
      expect(result).toBe(expectedPower);
    });

    test('should handle zero power', () => {
      // Arrange
      const { buffer, value: expectedPower } = POWER_TEST_DATA.ZERO_POWER;
      const mockDataView = new DataView(buffer.buffer);

      // Act
      const result = parsePowerMeasurement(mockDataView);

      // Assert
      expect(result).toBe(expectedPower);
    });

    test('should handle maximum power value', () => {
      // Maximum positive value for signed 16-bit integer (32767)
      const buffer = new Uint8Array([0x00, 0x00, 0xff, 0x7f]);
      const mockDataView = new DataView(buffer.buffer);

      const result = parsePowerMeasurement(mockDataView);
      expect(result).toBe(32767);
    });
  });

  describe('parseHeartRate', () => {
    test('should parse 8-bit heart rate value', () => {
      // Flags = 0x00 (8-bit format), HR = 75 BPM
      const buffer = new Uint8Array([0x00, 75]);
      const mockDataView = new DataView(buffer.buffer);

      const result = parseHeartRate(mockDataView);
      expect(result).toBe(75);
    });

    test('should parse 16-bit heart rate value', () => {
      // Flags = 0x01 (16-bit format), HR = 180 BPM (0x00B4 in little-endian)
      const buffer = new Uint8Array([0x01, 0xb4, 0x00]);
      const mockDataView = new DataView(buffer.buffer);

      const result = parseHeartRate(mockDataView);
      expect(result).toBe(180);
    });

    test('should handle maximum 8-bit heart rate', () => {
      const buffer = new Uint8Array([0x00, 255]);
      const mockDataView = new DataView(buffer.buffer);

      const result = parseHeartRate(mockDataView);
      expect(result).toBe(255);
    });

    test('should handle high 16-bit heart rate', () => {
      // HR = 300 BPM (0x012C in little-endian)
      const buffer = new Uint8Array([0x01, 0x2c, 0x01]);
      const mockDataView = new DataView(buffer.buffer);

      const result = parseHeartRate(mockDataView);
      expect(result).toBe(300);
    });

    test('should handle zero heart rate', () => {
      const buffer = new Uint8Array([0x00, 0]);
      const mockDataView = new DataView(buffer.buffer);

      const result = parseHeartRate(mockDataView);
      expect(result).toBe(0);
    });
  });
});
