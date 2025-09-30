

/**
 * The heart rate measurement is a DataView object.
 * The first byte is a flag, and the subsequent byte(s) are the heart rate value.
 * We need to check the first bit of the flag to see if the value is 8-bit or 16-bit.
 */
function parseHeartRate(value) {
    const flags = value.getUint8(0);
    // Check if the heart rate value format is UINT16 (bit 0 is 1) or UINT8 (bit 0 is 0)
    const is16bit = flags & 0x1;
    if (is16bit) {
        // If 16-bit, read 2 bytes starting from the second byte
        return value.getUint16(1, /*littleEndian=*/ true);
    } else {
        // If 8-bit, read 1 byte starting from the second byte
        return value.getUint8(1);
    }
}

export { parseHeartRate };