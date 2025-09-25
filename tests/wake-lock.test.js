/**
 * Tests for Wake Lock API functionality
 */

// Mock wake lock functions
let mockWakeLock = null;

async function requestWakeLock() {
  if (navigator.wakeLock) {
    try {
      mockWakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock is active.');
      mockWakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock was released.');
      });
      return mockWakeLock;
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
      throw err;
    }
  } else {
    throw new Error('Wake Lock API not available');
  }
}

async function releaseWakeLock() {
  if (mockWakeLock !== null) {
    await mockWakeLock.release();
    mockWakeLock = null;
  }
}

describe('Wake Lock Functionality', () => {
  beforeEach(() => {
    mockWakeLock = null;
    jest.clearAllMocks();

    // Ensure wakeLock mock is properly set up
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: jest.fn(() =>
          Promise.resolve({
            release: jest.fn(),
            addEventListener: jest.fn(),
          })
        ),
      },
      writable: true,
      configurable: true,
    });
  });

  describe('requestWakeLock', () => {
    test('should request wake lock successfully', async () => {
      const mockWakeLockObj = {
        release: jest.fn(),
        addEventListener: jest.fn(),
      };

      navigator.wakeLock.request.mockResolvedValue(mockWakeLockObj);

      const result = await requestWakeLock();

      expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
      expect(result).toBe(mockWakeLockObj);
      expect(mockWakeLockObj.addEventListener).toHaveBeenCalledWith(
        'release',
        expect.any(Function)
      );
      expect(console.log).toHaveBeenCalledWith('Screen Wake Lock is active.');
    });

    test('should handle wake lock request failure', async () => {
      const error = new Error('Permission denied');
      navigator.wakeLock.request.mockRejectedValue(error);

      await expect(requestWakeLock()).rejects.toThrow('Permission denied');
      expect(console.error).toHaveBeenCalledWith('Error, Permission denied');
    });

    test('should throw error when Wake Lock API is not available', async () => {
      // Mock navigator.wakeLock to be falsy
      Object.defineProperty(navigator, 'wakeLock', {
        value: null,
        writable: true,
        configurable: true,
      });

      await expect(requestWakeLock()).rejects.toThrow('Wake Lock API not available');

      // Restore the original mock
      Object.defineProperty(navigator, 'wakeLock', {
        value: {
          request: jest.fn(() =>
            Promise.resolve({
              release: jest.fn(),
              addEventListener: jest.fn(),
            })
          ),
        },
        writable: true,
        configurable: true,
      });
    });

    test('should handle DOMException errors', async () => {
      const domException = new DOMException('Document is not active', 'InvalidStateError');
      navigator.wakeLock.request.mockRejectedValue(domException);

      await expect(requestWakeLock()).rejects.toThrow('Document is not active');
      expect(console.error).toHaveBeenCalledWith('InvalidStateError, Document is not active');
    });
  });

  describe('releaseWakeLock', () => {
    test('should release active wake lock', async () => {
      const mockWakeLockObj = {
        release: jest.fn().mockResolvedValue(undefined),
      };

      mockWakeLock = mockWakeLockObj;

      await releaseWakeLock();

      expect(mockWakeLockObj.release).toHaveBeenCalled();
      expect(mockWakeLock).toBeNull();
    });

    test('should handle null wake lock gracefully', async () => {
      mockWakeLock = null;

      await expect(releaseWakeLock()).resolves.not.toThrow();
    });

    test('should handle wake lock release errors', async () => {
      const mockWakeLockObj = {
        release: jest.fn().mockRejectedValue(new Error('Release failed')),
      };

      mockWakeLock = mockWakeLockObj;

      await expect(releaseWakeLock()).rejects.toThrow('Release failed');
    });
  });

  describe('wake lock lifecycle', () => {
    test('should handle complete wake lock lifecycle', async () => {
      const mockWakeLockObj = {
        release: jest.fn().mockResolvedValue(undefined),
        addEventListener: jest.fn(),
      };

      navigator.wakeLock.request.mockResolvedValue(mockWakeLockObj);

      // Request wake lock
      await requestWakeLock();
      expect(mockWakeLock).toBe(mockWakeLockObj);

      // Release wake lock
      await releaseWakeLock();
      expect(mockWakeLock).toBeNull();
      expect(mockWakeLockObj.release).toHaveBeenCalled();
    });

    test('should handle wake lock release event', async () => {
      const mockWakeLockObj = {
        release: jest.fn(),
        addEventListener: jest.fn(),
      };

      navigator.wakeLock.request.mockResolvedValue(mockWakeLockObj);

      await requestWakeLock();

      // Simulate the release event callback
      const releaseCallback = mockWakeLockObj.addEventListener.mock.calls[0][1];
      releaseCallback();

      expect(console.log).toHaveBeenCalledWith('Screen Wake Lock was released.');
    });
  });
});
