/**
 * Tests for Bluetooth data parsing functions
 */

// Import the functions we want to test
// Since the original script.js doesn't export functions, we'll copy them here for testing
function parsePowerMeasurement(value) {
  const instantaneousPower = value.getInt16(2, true);
  return instantaneousPower;
}

function parseHeartRate(value) {
  const flags = value.getUint8(0);
  const is16bit = flags & 0x1;
  if (is16bit) {
    return value.getUint16(1, true);
  } else {
    return value.getUint8(1);
  }
}

describe('Bluetooth Data Parsing', () => {
  describe('parsePowerMeasurement', () => {
    test('should parse power measurement correctly', () => {
      // Create a mock DataView with power value of 250W
      const buffer = new Uint8Array([0x00, 0x00, 0xfa, 0x00]); // 250 in little-endian
      const mockDataView = new DataView(buffer.buffer);

      const result = parsePowerMeasurement(mockDataView);
      expect(result).toBe(250);
    });

    test('should handle negative power values', () => {
      // Create a mock DataView with negative power value
      const buffer = new Uint8Array([0x00, 0x00, 0x9c, 0xff]); // -100 in little-endian two's complement
      const mockDataView = new DataView(buffer.buffer);

      const result = parsePowerMeasurement(mockDataView);
      expect(result).toBe(-100);
    });

    test('should handle zero power', () => {
      const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const mockDataView = new DataView(buffer.buffer);

      const result = parsePowerMeasurement(mockDataView);
      expect(result).toBe(0);
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
