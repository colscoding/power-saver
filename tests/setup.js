/**
 * Jest Test Setup Configuration
 * 
 * This file configures the testing environment with necessary mocks
 * for Web APIs that are not available in the Node.js/Jest environment.
 * 
 * Includes mocks for:
 * - Web Bluetooth API
 * - Wake Lock API
 * - DOM manipulation methods
 * - File and URL APIs
 */

/* ==========================================================================
   Web Bluetooth API Mock
   ========================================================================== */

/**
 * Mock Web Bluetooth API for testing Bluetooth functionality
 */
Object.defineProperty(global.navigator, 'bluetooth', {
  value: {
    requestDevice: jest.fn(),
    getAvailability: jest.fn(() => Promise.resolve(true)),
  },
  writable: true,
  configurable: true,
});

/* ==========================================================================
   Wake Lock API Mock
   ========================================================================== */

/**
 * Mock Wake Lock API for testing screen wake lock functionality
 */
Object.defineProperty(global.navigator, 'wakeLock', {
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

/* ==========================================================================
   DataView Mock for Bluetooth Data Parsing
   ========================================================================== */

/**
 * Mock DataView class for testing Bluetooth characteristic data parsing
 * Provides methods for reading binary data in various formats
 */
global.DataView =
  global.DataView ||
  class DataView {
    /**
     * Create a DataView instance
     * @param {ArrayBuffer} buffer - The buffer to view
     * @param {number} byteOffset - Starting byte offset
     * @param {number} byteLength - Number of bytes to view
     */
    constructor(buffer, byteOffset, byteLength) {
      this.buffer = buffer;
      this.byteOffset = byteOffset || 0;
      this.byteLength = byteLength || buffer.byteLength;
    }

    /**
     * Read an 8-bit unsigned integer
     * @param {number} byteOffset - Byte offset from start of buffer
     * @returns {number} 8-bit unsigned integer
     */
    getUint8(byteOffset) {
      return this.buffer[this.byteOffset + byteOffset];
    }

    /**
     * Read a 16-bit unsigned integer
     * @param {number} byteOffset - Byte offset from start of buffer
     * @param {boolean} littleEndian - Whether to use little-endian byte order
     * @returns {number} 16-bit unsigned integer
     */
    getUint16(byteOffset, littleEndian) {
      const offset = this.byteOffset + byteOffset;
      if (littleEndian) {
        return this.buffer[offset] | (this.buffer[offset + 1] << 8);
      }
      return (this.buffer[offset] << 8) | this.buffer[offset + 1];
    }

    /**
     * Read a 32-bit unsigned integer
     * @param {number} byteOffset - Byte offset from start of buffer
     * @param {boolean} littleEndian - Whether to use little-endian byte order
     * @returns {number} 32-bit unsigned integer
     */
    getUint32(byteOffset, littleEndian) {
      const offset = this.byteOffset + byteOffset;
      if (littleEndian) {
        return (
          this.buffer[offset] |
          (this.buffer[offset + 1] << 8) |
          (this.buffer[offset + 2] << 16) |
          (this.buffer[offset + 3] << 24)
        );
      }
      return (
        (this.buffer[offset] << 24) |
        (this.buffer[offset + 1] << 16) |
        (this.buffer[offset + 2] << 8) |
        this.buffer[offset + 3]
      );
    }

    /**
     * Read a 16-bit signed integer
     * @param {number} byteOffset - Byte offset from start of buffer
     * @param {boolean} littleEndian - Whether to use little-endian byte order
     * @returns {number} 16-bit signed integer
     */
    getInt16(byteOffset, littleEndian) {
      const value = this.getUint16(byteOffset, littleEndian);
      return value > 32767 ? value - 65536 : value;
    }
  };

/* ==========================================================================
   File and URL API Mocks
   ========================================================================== */

/**
 * Mock Blob constructor for file creation testing
 */
global.Blob = jest.fn(() => ({
  size: 1024,
  type: 'application/json',
}));

/**
 * Mock URL API for object URL creation/revocation
 */
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
};

/* ==========================================================================
   Console and DOM API Mocks
   ========================================================================== */

/**
 * Mock console methods to avoid noise in test output
 */
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

/**
 * Mock DOM element creation for download functionality
 */
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

/**
 * Mock DOM body manipulation methods
 */
Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
});
