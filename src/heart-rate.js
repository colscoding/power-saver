/**
 * Parse heart rate measurement from Bluetooth characteristic value
 * 
 * The heart rate measurement is a DataView object following the Bluetooth
 * Heart Rate Measurement characteristic format (org.bluetooth.characteristic.heart_rate_measurement).
 * 
 * Format:
 * - Byte 0: Flags (bit 0 indicates value format)
 * - Byte 1+: Heart rate value (UINT8 or UINT16 based on flags)
 * 
 * @param {DataView} value - The Bluetooth characteristic value
 * @returns {number} Heart rate in beats per minute (BPM)
 * @throws {Error} If the value is invalid or malformed
 */
function parseHeartRate(value) {
    // Bluetooth Heart Rate Format Constants
    const HR_VALUE_FORMAT_FLAG = 0x01; // Bit 0: Heart Rate Value Format (0 = UINT8, 1 = UINT16)
    const HR_FLAGS_OFFSET = 0;
    const HR_VALUE_OFFSET = 1;

    // Validate input
    if (!value || !(value instanceof DataView)) {
        throw new Error('Invalid heart rate data: value must be a DataView');
    }

    // Need at least 2 bytes (flags + value)
    if (value.byteLength < 2) {
        throw new Error(`Invalid heart rate data: insufficient data (${value.byteLength} bytes)`);
    }

    const flags = value.getUint8(HR_FLAGS_OFFSET);
    const isUint16Format = (flags & HR_VALUE_FORMAT_FLAG) !== 0;
    // Need at least 3 bytes for 16-bit format (flags + 2-byte value)
    if (isUint16Format && value.byteLength < 3) {
        throw new Error(`Invalid heart rate data: insufficient data for UINT16 format (${value.byteLength} bytes)`);
    }

    const heartRate = isUint16Format
        ? value.getUint16(HR_VALUE_OFFSET, /* littleEndian= */ true)
        : value.getUint8(HR_VALUE_OFFSET);

    if (typeof heartRate !== 'number' || heartRate < 0 || heartRate > 300) {
        throw new Error(`Invalid heart rate value: ${heartRate}`);
    }

    return heartRate;
}

export { parseHeartRate };