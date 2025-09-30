/**
 * Data Export Functionality Tests
 * 
 * Tests for data export functions including JSON, CSV, and filename generation.
 * Covers various data formats and edge cases for export functionality.
 * 
 * @requires jest
 */

/* ==========================================================================
   Export Functions Under Test
   ========================================================================== */

/**
 * Generate JSON export from power data
 * @param {Array<Object>} powerData - Array of power measurement objects
 * @returns {string} JSON string representation of the data
 */
function generateJsonExport(powerData) {
  return JSON.stringify(powerData, null, 2);
}

/**
 * Generate CSV export from power data
 * @param {Array<Object>} powerData - Array of power measurement objects
 * @returns {string} CSV string representation of the data
 */
function generateCsvExport(powerData) {
  let csvContent = 'timestamp,power,heartRate,cadence,speed,distance,balance,smoothness,torque\n';
  powerData.forEach((row) => {
    csvContent += `${row.timestamp},${row.power},${row.heartRate},${row.cadence},${row.speed},${row.distance},${row.balance || ''},${row.smoothness || ''},${row.torque || ''}\n`;
  });
  return csvContent;
}

/**
 * Generate filename with date stamp
 * @param {string} extension - File extension (without dot)
 * @returns {string} Generated filename with current date
 */
function generateFileName(extension) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  return `power_data_${dateString}.${extension}`;
}

/* ==========================================================================
   Test Data Constants
   ========================================================================== */

/** Mock power data for testing export functions */
const MOCK_POWER_DATA = {
  COMPLETE_RECORD: {
    timestamp: 1631875200000,
    power: 250,
    heartRate: 145,
    cadence: 90,
    speed: 35,
    distance: 10.5,
    balance: 52,
    smoothness: 85,
    torque: 88,
  },
  PARTIAL_RECORD: {
    timestamp: 1631875200100,
    power: 260,
    heartRate: 148,
    cadence: 92,
    speed: 36,
    distance: 10.6,
    balance: 53,
    smoothness: 86,
    torque: 89,
  },
  MINIMAL_RECORD: {
    timestamp: 1631875200200,
    power: 245,
    heartRate: 142,
    cadence: 88,
    speed: 34,
    distance: 10.7,
    balance: null,
    smoothness: null,
    torque: null,
  },
};

/** Expected CSV header */


/* ==========================================================================
   Test Suites
   ========================================================================== */

describe('Data Export Functions', () => {
  const mockPowerData = [
    MOCK_POWER_DATA.COMPLETE_RECORD,
    MOCK_POWER_DATA.PARTIAL_RECORD,
    MOCK_POWER_DATA.MINIMAL_RECORD,
  ];

  describe('generateJsonExport', () => {
    test('should generate valid JSON from power data', () => {
      // Arrange
      const testData = mockPowerData;

      // Act
      const result = generateJsonExport(testData);

      // Assert
      expect(result).toBeDefined();
      expect(() => JSON.parse(result)).not.toThrow();

      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].power).toBe(MOCK_POWER_DATA.COMPLETE_RECORD.power);
      expect(parsed[1].heartRate).toBe(MOCK_POWER_DATA.PARTIAL_RECORD.heartRate);
    });

    test('should handle empty data array', () => {
      // Arrange
      const emptyData = [];

      // Act
      const result = generateJsonExport(emptyData);

      // Assert
      expect(result).toBe('[]');
    });

    test('should preserve all data fields', () => {
      // Arrange
      const singleRecord = [MOCK_POWER_DATA.COMPLETE_RECORD];

      // Act
      const result = generateJsonExport(singleRecord);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed[0]).toMatchObject(MOCK_POWER_DATA.COMPLETE_RECORD);
    });

    test('should handle null values correctly', () => {
      // Arrange
      const recordWithNulls = [MOCK_POWER_DATA.MINIMAL_RECORD];

      // Act
      const result = generateJsonExport(recordWithNulls);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed[0].balance).toBeNull();
      expect(parsed[0].smoothness).toBeNull();
      expect(parsed[0].torque).toBeNull();
    });
  });

  describe('generateCsvExport', () => {
    test('should generate valid CSV with headers', () => {
      const result = generateCsvExport(mockPowerData);

      const lines = result.trim().split('\n');
      expect(lines[0]).toBe(
        'timestamp,power,heartRate,cadence,speed,distance,balance,smoothness,torque'
      );
      expect(lines).toHaveLength(4); // Header + 3 data rows
    });

    test('should format data rows correctly', () => {
      const result = generateCsvExport([mockPowerData[0]]);
      const lines = result.trim().split('\n');

      expect(lines[1]).toBe('1631875200000,250,145,90,35,10.5,52,85,88');
    });

    test('should handle null values correctly', () => {
      const result = generateCsvExport([mockPowerData[2]]);
      const lines = result.trim().split('\n');

      expect(lines[1]).toBe('1631875200200,245,142,88,34,10.7,,,');
    });

    test('should handle empty data array', () => {
      const result = generateCsvExport([]);

      expect(result).toBe(
        'timestamp,power,heartRate,cadence,speed,distance,balance,smoothness,torque\n'
      );
    });

    test('should handle missing optional fields', () => {
      const minimalData = [
        {
          timestamp: 1631875200000,
          power: 200,
          heartRate: 140,
          cadence: 85,
          speed: 30,
          distance: 5.0,
        },
      ];

      const result = generateCsvExport(minimalData);
      const lines = result.trim().split('\n');

      expect(lines[1]).toBe('1631875200000,200,140,85,30,5,,,');
    });
  });

  describe('generateFileName', () => {
    test('should generate filename with current date', () => {
      // Mock Date to ensure consistent testing
      const mockDate = new Date('2023-09-16');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const jsonFileName = generateFileName('json');
      const csvFileName = generateFileName('csv');

      expect(jsonFileName).toBe('power_data_2023-09-16.json');
      expect(csvFileName).toBe('power_data_2023-09-16.csv');

      global.Date.mockRestore();
    });

    test('should pad single digit months and days', () => {
      const mockDate = new Date('2023-03-05');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const fileName = generateFileName('json');
      expect(fileName).toBe('power_data_2023-03-05.json');

      global.Date.mockRestore();
    });
  });
});
