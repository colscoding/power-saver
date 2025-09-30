/**
 * Wake Lock API Functionality Tests
 * 
 * Tests for screen wake lock management to prevent device sleep during sessions.
 * Covers wake lock request, release, and error handling scenarios.
 * 
 * @requires jest
 * @requires Wake Lock API mocks (from setup.js)
 */

/* ==========================================================================
   Wake Lock Functions Under Test
   ========================================================================== */

/** Global wake lock reference */
let mockWakeLock = null;

/**
 * Request a screen wake lock to prevent device sleep
 * @returns {Promise<WakeLockSentinel>} Wake lock sentinel object
 * @throws {Error} When Wake Lock API is not available or request fails
 */
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

/**
 * Release the current wake lock if active
 * @returns {Promise<void>}
 */
async function releaseWakeLock() {
  if (mockWakeLock !== null) {
    await mockWakeLock.release();
    mockWakeLock = null;
  }
}

/* ==========================================================================
   Test Constants and Helpers
   ========================================================================== */

/** Expected wake lock type */
const WAKE_LOCK_TYPE = 'screen';

/**
 * Create a mock wake lock sentinel
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock wake lock sentinel
 */
function createMockWakeLockSentinel(overrides = {}) {
  return {
    release: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    type: WAKE_LOCK_TYPE,
    released: false,
    ...overrides,
  };
}

/* ==========================================================================
   Test Suites
   ========================================================================== */

describe('Wake Lock Functionality', () => {
  beforeEach(() => {
    // Reset wake lock state
    mockWakeLock = null;
    jest.clearAllMocks();

    // Ensure wakeLock mock is properly set up
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: jest.fn(() => Promise.resolve(createMockWakeLockSentinel())),
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
