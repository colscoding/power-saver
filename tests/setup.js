// Jest setup file for DOM testing
// Mock the Web Bluetooth API since it's not available in Jest environment
Object.defineProperty(global.navigator, 'bluetooth', {
  value: {
    requestDevice: jest.fn(),
    getAvailability: jest.fn(() => Promise.resolve(true)),
  },
  writable: true,
  configurable: true,
});

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

// Mock DataView for Bluetooth characteristic parsing
global.DataView =
  global.DataView ||
  class DataView {
    constructor(buffer, byteOffset, byteLength) {
      this.buffer = buffer;
      this.byteOffset = byteOffset || 0;
      this.byteLength = byteLength || buffer.byteLength;
    }

    getUint8(byteOffset) {
      return this.buffer[this.byteOffset + byteOffset];
    }

    getUint16(byteOffset, littleEndian) {
      const offset = this.byteOffset + byteOffset;
      if (littleEndian) {
        return this.buffer[offset] | (this.buffer[offset + 1] << 8);
      }
      return (this.buffer[offset] << 8) | this.buffer[offset + 1];
    }

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

    getInt16(byteOffset, littleEndian) {
      const value = this.getUint16(byteOffset, littleEndian);
      return value > 32767 ? value - 65536 : value;
    }
  };

// Mock Blob and URL for file exports
global.Blob = jest.fn(() => ({
  size: 1024,
  type: 'application/json',
}));

global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
});
