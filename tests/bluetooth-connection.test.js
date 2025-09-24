/**
 * Tests for Bluetooth connection management and error handling
 */

// Mock Bluetooth connection functions
async function connectToDevice(serviceUuid, characteristicUuid) {
    if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available.');
    }

    const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [serviceUuid] }]
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

function handleDisconnection(device, resetCallback) {
    if (device) {
        device.removeEventListener('gattserverdisconnected', handleDisconnection);
    }
    if (resetCallback) {
        resetCallback();
    }
}

function validateBluetoothSupport() {
    return navigator.bluetooth != null;
}

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

describe('Bluetooth Connection Management', () => {
    const CYCLING_POWER_SERVICE_UUID = 'cycling_power';
    const CYCLING_POWER_MEASUREMENT_UUID = 'cycling_power_measurement';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('connectToDevice', () => {
        test('should connect to device successfully', async () => {
            const mockCharacteristic = {
                startNotifications: jest.fn().mockResolvedValue(undefined)
            };

            const mockService = {
                getCharacteristic: jest.fn().mockResolvedValue(mockCharacteristic)
            };

            const mockServer = {
                getPrimaryService: jest.fn().mockResolvedValue(mockService)
            };

            const mockDevice = {
                gatt: { connect: jest.fn().mockResolvedValue(mockServer) },
                addEventListener: jest.fn()
            };

            navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

            const result = await connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID);

            expect(navigator.bluetooth.requestDevice).toHaveBeenCalledWith({
                filters: [{ services: [CYCLING_POWER_SERVICE_UUID] }]
            });
            expect(mockDevice.gatt.connect).toHaveBeenCalled();
            expect(mockServer.getPrimaryService).toHaveBeenCalledWith(CYCLING_POWER_SERVICE_UUID);
            expect(mockService.getCharacteristic).toHaveBeenCalledWith(CYCLING_POWER_MEASUREMENT_UUID);
            expect(mockCharacteristic.startNotifications).toHaveBeenCalled();
            expect(mockDevice.addEventListener).toHaveBeenCalledWith('gattserverdisconnected', expect.any(Function));

            expect(result.device).toBe(mockDevice);
            expect(result.characteristic).toBe(mockCharacteristic);
        });

        test('should throw error when Bluetooth API is not available', async () => {
            // Mock navigator.bluetooth to be falsy
            Object.defineProperty(navigator, 'bluetooth', {
                value: null,
                writable: true,
                configurable: true
            });

            await expect(connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID))
                .rejects.toThrow('Web Bluetooth API is not available.');

            // Restore the original mock
            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: jest.fn(),
                    getAvailability: jest.fn(() => Promise.resolve(true))
                },
                writable: true,
                configurable: true
            });
        });

        test('should handle device request failure', async () => {
            navigator.bluetooth.requestDevice.mockRejectedValue(new Error('User cancelled device selection'));

            await expect(connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID))
                .rejects.toThrow('User cancelled device selection');
        });

        test('should handle GATT connection failure', async () => {
            const mockDevice = {
                gatt: {
                    connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
                },
                addEventListener: jest.fn()
            };

            navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

            await expect(connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID))
                .rejects.toThrow('Connection failed');
        });

        test('should handle service not found', async () => {
            const mockServer = {
                getPrimaryService: jest.fn().mockRejectedValue(new Error('Service not found'))
            };

            const mockDevice = {
                gatt: { connect: jest.fn().mockResolvedValue(mockServer) },
                addEventListener: jest.fn()
            };

            navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

            await expect(connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID))
                .rejects.toThrow('Service not found');
        });

        test('should handle characteristic not found', async () => {
            const mockService = {
                getCharacteristic: jest.fn().mockRejectedValue(new Error('Characteristic not found'))
            };

            const mockServer = {
                getPrimaryService: jest.fn().mockResolvedValue(mockService)
            };

            const mockDevice = {
                gatt: { connect: jest.fn().mockResolvedValue(mockServer) },
                addEventListener: jest.fn()
            };

            navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

            await expect(connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID))
                .rejects.toThrow('Characteristic not found');
        });

        test('should handle notification start failure', async () => {
            const mockCharacteristic = {
                startNotifications: jest.fn().mockRejectedValue(new Error('Notifications not supported'))
            };

            const mockService = {
                getCharacteristic: jest.fn().mockResolvedValue(mockCharacteristic)
            };

            const mockServer = {
                getPrimaryService: jest.fn().mockResolvedValue(mockService)
            };

            const mockDevice = {
                gatt: { connect: jest.fn().mockResolvedValue(mockServer) },
                addEventListener: jest.fn()
            };

            navigator.bluetooth.requestDevice.mockResolvedValue(mockDevice);

            await expect(connectToDevice(CYCLING_POWER_SERVICE_UUID, CYCLING_POWER_MEASUREMENT_UUID))
                .rejects.toThrow('Notifications not supported');
        });
    });

    describe('handleDisconnection', () => {
        test('should remove event listener and call reset callback', () => {
            const mockDevice = {
                removeEventListener: jest.fn()
            };
            const mockResetCallback = jest.fn();

            handleDisconnection(mockDevice, mockResetCallback);

            expect(mockDevice.removeEventListener).toHaveBeenCalledWith('gattserverdisconnected', handleDisconnection);
            expect(mockResetCallback).toHaveBeenCalled();
        });

        test('should handle null device gracefully', () => {
            const mockResetCallback = jest.fn();

            expect(() => handleDisconnection(null, mockResetCallback)).not.toThrow();
            expect(mockResetCallback).toHaveBeenCalled();
        });

        test('should handle missing reset callback', () => {
            const mockDevice = {
                removeEventListener: jest.fn()
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
                configurable: true
            });

            expect(validateBluetoothSupport()).toBe(false);

            // Restore the original mock
            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: jest.fn(),
                    getAvailability: jest.fn(() => Promise.resolve(true))
                },
                writable: true,
                configurable: true
            });
        });
    });

    describe('getBluetoothAvailability', () => {
        beforeEach(() => {
            // Ensure bluetooth mock is properly set up
            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: jest.fn(),
                    getAvailability: jest.fn(() => Promise.resolve(true))
                },
                writable: true,
                configurable: true
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
                configurable: true
            });

            const result = await getBluetoothAvailability();

            expect(result).toBe(false);

            // Restore the original mock
            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: jest.fn(),
                    getAvailability: jest.fn(() => Promise.resolve(true))
                },
                writable: true,
                configurable: true
            });
        });

        test('should return false when availability check fails', async () => {
            // Restore proper mock first
            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: jest.fn(),
                    getAvailability: jest.fn().mockRejectedValue(new Error('Availability check failed'))
                },
                writable: true,
                configurable: true
            });

            const result = await getBluetoothAvailability();

            expect(result).toBe(false);
        });
    });
});