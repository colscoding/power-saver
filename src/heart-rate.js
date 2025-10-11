

// Bluetooth Heart Rate Format Constants
const HR_VALUE_FORMAT_FLAG = 0x01; // Bit 0: Heart Rate Value Format (0 = UINT8, 1 = UINT16)
const HR_FLAGS_OFFSET = 0;
const HR_VALUE_OFFSET = 1;

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
 */
function parseHeartRate(value) {
    const flags = value.getUint8(HR_FLAGS_OFFSET);
    const isUint16Format = (flags & HR_VALUE_FORMAT_FLAG) !== 0;

    if (isUint16Format) {
        return value.getUint16(HR_VALUE_OFFSET, /* littleEndian= */ true);
    }

    return value.getUint8(HR_VALUE_OFFSET);
}

export { parseHeartRate };