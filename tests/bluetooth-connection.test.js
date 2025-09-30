/**
 * Bluetooth Connection Management Tests
 * 
 * Tests for Bluetooth device connection, disconnection, and error handling.
 * Covers Web Bluetooth API interactions and device state management.
 * 
 * @requires jest
 * @requires Web Bluetooth API mocks (from setup.js)
 */

/* ==========================================================================
   Test Utilities and Mock Functions
   ========================================================================== */

/**
 * Connect to a Bluetooth device with specified service and characteristic
 * @param {string} serviceUuid - The Bluetooth service UUID
 * @param {string} characteristicUuid - The characteristic UUID
 * @returns {Promise<Object>} Connection object with device, server, service, and characteristic
 * @throws {Error} When Web Bluetooth API is not available or connection fails
 */
async function connectToDevice(serviceUuid, characteristicUuid) {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth API is not available.');
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [serviceUuid] }],
  });

  device.addEventListener('gattserverdisconnected', () => {
    console.log('Device disconnected');
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(serviceUuid);
  const characteristic = await service.getCharacteristic(characteristicUuid);

  await characteristic.startNotifications();

  return { device, server, service, characteristic };
}

/**
 * Handle device disconnection and cleanup
 * @param {BluetoothDevice} device - The Bluetooth device to disconnect
 * @param {Function} resetCallback - Callback to reset application state
 */
function handleDisconnection(device, resetCallback) {
  if (device) {
    device.removeEventListener('gattserverdisconnected', handleDisconnection);
  }
  if (resetCallback) {
    resetCallback();
  }
}

/**
 * Validate if Web Bluetooth API is supported
 * @returns {boolean} True if Bluetooth is supported
 */
function validateBluetoothSupport() {
  return navigator.bluetooth != null;
}

/**
 * Get Bluetooth availability status
 * @returns {Promise<boolean>} True if Bluetooth is available
 */
async function getBluetoothAvailability() {
  if (!navigator.bluetooth) {
    return false;
  }
  try {
    return await navigator.bluetooth.getAvailability();
  } catch {
    return false;
  }
}

/* ==========================================================================
   Test Constants
   ========================================================================== */

/** Bluetooth service and characteristic UUIDs for testing */
const TEST_CONSTANTS = {
  CYCLING_POWER_SERVICE_UUID: 'cycling_power',
  CYCLING_POWER_MEASUREMENT_UUID: 'cycling_power_measurement',
  HEART_RATE_SERVICE_UUID: 'heart_rate',
  HEART_RATE_MEASUREMENT_UUID: 'heart_rate_measurement',
};

/* ==========================================================================
   Test Suites
   ========================================================================== */

/* ==========================================================================
   Mock Factory Functions
   ========================================================================== */

/**
 * Create a mock Bluetooth characteristic
 * @param {Object} overrides - Properties to override in the mock
 * @returns {Object} Mock characteristic object
 */
function createMockCharacteristic(overrides = {}) {
  return {
    startNotifications: jest.fn().mockResolvedValue(undefined),
    stopNotifications: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    ...overrides,
  };
}

/**
 * Create a mock Bluetooth service
 * @param {Object} characteristic - Mock characteristic to return
 * @param {Object} overrides - Properties to override in the mock
 * @returns {Object} Mock service object
 */
function createMockService(characteristic, overrides = {}) {
  return {
    getCharacteristic: jest.fn().mockResolvedValue(characteristic),
    ...overrides,
  };
}

/**
 * Create a mock GATT server
 * @param {Object} service - Mock service to return
 * @param {Object} overrides - Properties to override in the mock
 * @returns {Object} Mock server object
 */
function createMockServer(service, overrides = {}) {
  return {
    getPrimaryService: jest.fn().mockResolvedValue(service),
    connected: true,
    ...overrides,
  };
}

/**
 * Create a mock Bluetooth device
 * @param {Object} server - Mock GATT server
 * @param {Object} overrides - Properties to override in the mock
 * @returns {Object} Mock device object
 */
function createMockDevice(server, overrides = {}) {
  return {
    gatt: { connect: jest.fn().mockResolvedValue(server) },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    name: 'Test Device',
    id: 'test-device-id',
    ...overrides,
  };
}

describe('Bluetooth Connection Management', () => {
  const { CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID } = TEST_CONSTANTS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectToDevice', () => {
    test('should connect to device successfully', async () => {
      // Arrange
      const mockCharacteristic = createMockCharacteristic();
      const mockService = createMockService(mockCharacteristic);
      const mockServer = createMockServer(mockService);
      const mockDevice = createMockDevice(mockServer);

      navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

      // Act
      const result = await connectToDevice(
        CYCLING_POWER_SERVICE_UUID,
        CYCLING_POWER_MEASUREMENT_UUID
      );

      // Assert
      expect(navigator.bluetooth.requestDevice).toHaveBeenCalledWith({
        filters: [{ services: [CYCLING_POWER_SERVICE_UUID] }],
      });
      expect(mockDevice.gatt.connect).toHaveBeenCalled();
      expect(mockServer.getPrimaryService).toHaveBeenCalledWith(CYCLING_POWER_SERVICE_UUID);
      expect(mockService.getCharacteristic).toHaveBeenCalledWith(CYCLING_POWER_MEASUREMENT_UUID);
      expect(mockCharacteristic.startNotifications).toHaveBeenCalled();
      expect(mockDevice.addEventListener).toHaveBeenCalledWith(
        'gattserverdisconnected',
        expect.any(Function)
      );

      expect(result.device).toBe(mockDevice);
      expect(result.characteristic).toBe(mockCharacteristic);
    });

    test('should throw error when Bluetooth API is not available', async () => {
      // Mock navigator.bluetooth to be falsy
      Object.defineProperty(navigator, 'bluetooth', {
        value: null,
        writable: true,
        configurable: true,
      });

      await expect(
        connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID)
      ).rejects.toThrow('Web Bluetooth API is not available.');

      // Restore the original mock
      Object.defineProperty(navigator, 'bluetooth', {
        value: {
          requestDevice: jest.fn(),
          getAvailability: jest.fn(() => Promise.resolve(true)),
        },
        writable: true,
        configurable: true,
      });
    });

    test('should handle device request failure', async () => {
      navigator.bluetooth.requestDevice.mockRejectedValue(
        new Error('User cancelled device selection')
      );

      await expect(
        connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID)
      ).rejects.toThrow('User cancelled device selection');
    });

    test('should handle GATT connection failure', async () => {
      const mockDevice = {
        gatt: {
          connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        },
        addEventListener: jest.fn(),
      };

      navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

      await expect(
        connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID)
      ).rejects.toThrow('Connection failed');
    });

    test('should handle service not found', async () => {
      const mockServer = {
        getPrimaryService: jest.fn().mockRejectedValue(new Error('Service not found')),
      };

      const mockDevice = {
        gatt: { connect: jest.fn().mockResolvedValue(mockServer) },
        addEventListener: jest.fn(),
      };

      navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

      await expect(
        connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID)
      ).rejects.toThrow('Service not found');
    });

    test('should handle characteristic not found', async () => {
      const mockService = {
        getCharacteristic: jest.fn().mockRejectedValue(new Error('Characteristic not found')),
      };

      const mockServer = {
        getPrimaryService: jest.fn().mockResolvedValue(mockService),
      };

      const mockDevice = {
        gatt: { connect: jest.fn().mockResolvedValue(mockServer) },
        addEventListener: jest.fn(),
      };

      navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

      await expect(
        connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID)
      ).rejects.toThrow('Characteristic not found');
    });

    test('should handle notification start failure', async () => {
      const mockCharacteristic = {
        startNotifications: jest.fn().mockRejectedValue(new Error('Notifications not supported')),
      };

      const mockService = {
        getCharacteristic: jest.fn().mockResolvedValue(mockCharacteristic),
      };

      const mockServer = {
        getPrimaryService: jest.fn().mockResolvedValue(mockService),
      };

      const mockDevice = {
        gatt: { connect: jest.fn().mockResolvedValue(mockServer) },
        addEventListener: jest.fn(),
      };

      navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

      await expect(
        connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID)
      ).rejects.toThrow('Notifications not supported');
    });
  });

  describe('handleDisconnection', () => {
    test('should remove event listener and call reset callback', () => {
      const mockDevice = {
        removeEventListener: jest.fn(),
      };
      const mockResetCallback = jest.fn();

      handleDisconnection(mockDevice, mockResetCallback);

      expect(mockDevice.removeEventListener).toHaveBeenCalledWith(
        'gattserverdisconnected',
        handleDisconnection
      );
      expect(mockResetCallback).toHaveBeenCalled();
    });

    test('should handle null device gracefully', () => {
      const mockResetCallback = jest.fn();

      expect(() => handleDisconnection(null, mockResetCallback)).not.toThrow();
      expect(mockResetCallback).toHaveBeenCalled();
    });

    test('should handle missing reset callback', () => {
      const mockDevice = {
        removeEventListener: jest.fn(),
      };

      expect(() => handleDisconnection(mockDevice, null)).not.toThrow();
      expect(mockDevice.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('validateBluetoothSupport', () => {
    test('should return true when Bluetooth is supported', () => {
      expect(validateBluetoothSupport()).toBe(true);
    });

    test('should return false when Bluetooth is not supported', () => {
      // Mock navigator.bluetooth to be falsy
      Object.defineProperty(navigator, 'bluetooth', {
        value: null,
        writable: true,
        configurable: true,
      });

      expect(validateBluetoothSupport()).toBe(false);

      // Restore the original mock
      Object.defineProperty(navigator, 'bluetooth', {
        value: {
          requestDevice: jest.fn(),
          getAvailability: jest.fn(() => Promise.resolve(true)),
        },
        writable: true,
        configurable: true,
      });
    });
  });

  describe('getBluetoothAvailability', () => {
    beforeEach(() => {
      // Ensure bluetooth mock is properly set up
      Object.defineProperty(navigator, 'bluetooth', {
        value: {
          requestDevice: jest.fn(),
          getAvailability: jest.fn(() => Promise.resolve(true)),
        },
        writable: true,
        configurable: true,
      });
    });

    test('should return availability status', async () => {
      navigator.bluetooth.getAvailability.mockResolvedValue(true);

      const result = await getBluetoothAvailability();

      expect(result).toBe(true);
      expect(navigator.bluetooth.getAvailability).toHaveBeenCalled();
    });

    test('should return false when Bluetooth API is not available', async () => {
      // Mock navigator.bluetooth to be falsy
      Object.defineProperty(navigator, 'bluetooth', {
        value: null,
        writable: true,
        configurable: true,
      });

      const result = await getBluetoothAvailability();

      expect(result).toBe(false);

      // Restore the original mock
      Object.defineProperty(navigator, 'bluetooth', {
        value: {
          requestDevice: jest.fn(),
          getAvailability: jest.fn(() => Promise.resolve(true)),
        },
        writable: true,
        configurable: true,
      });
    });

    test('should return false when availability check fails', async () => {
      // Restore proper mock first
      Object.defineProperty(navigator, 'bluetooth', {
        value: {
          requestDevice: jest.fn(),
          getAvailability: jest.fn().mockRejectedValue(new Error('Availability check failed')),
        },
        writable: true,
        configurable: true,
      });

      const result = await getBluetoothAvailability();

      expect(result).toBe(false);
    });
  });
});
