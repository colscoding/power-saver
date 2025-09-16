/**
 * Tests for power measurement processing and extended power features
 */

// Mock the power meter functionality for testing
function processPowerMeasurementFlags(flags, value, offset = 2) {
    const result = {
        power: value.getInt16(offset, true),
        balance: null,
        torqueEffectiveness: null,
        pedalSmoothness: null,
        offset: offset + 2
    };

    // Check for Pedal Power Balance (Flag bit 0)
    if (flags & 0x0001) {
        result.balance = value.getUint8(result.offset);
        result.offset += 1;
    }

    // Skip Accumulated Torque (Flag bit 2)
    if (flags & 0x0004) {
        result.offset += 2;
    }

    // Skip Wheel Revolution Data (Flag bits 4 & 5)
    if (flags & 0x0010) {
        result.offset += 6;
    }

    // Skip Crank Revolution Data (Flag bit 6)
    if (flags & 0x0020) {
        result.offset += 4;
    }

    // Skip Extreme Force/Angle Magnitudes (Flag bits 7 & 8)
    if (flags & 0x0080) {
        result.offset += 6;
    }

    // Skip Top/Bottom Dead Spot Angles (Flag bits 9 & 10)
    if (flags & 0x0200) {
        result.offset += 4;
    }

    // Skip Accumulated Energy (Flag bit 11)
    if (flags & 0x0800) {
        result.offset += 2;
    }

    // Check for Torque Effectiveness and Pedal Smoothness (Flag bit 12)
    if (flags & 0x1000) {
        result.torqueEffectiveness = value.getUint8(result.offset) / 2;
        result.pedalSmoothness = value.getUint8(result.offset + 2) / 2;
        result.offset += 4;
    }

    return result;
}

function calculateSpeed(wheelRevolutions, wheelTime, lastRevolutions, lastTime, wheelCircumference = 2.105) {
    if (lastRevolutions === 0) return 0;

    const revs = wheelRevolutions - lastRevolutions;
    const time = (wheelTime - lastTime) / 1024; // Convert to seconds

    if (time <= 0) return 0;

    const distance = revs * wheelCircumference; // meters
    return (distance / time) * 3.6; // km/h
}

function calculateCadence(crankRevolutions, crankTime, lastRevolutions, lastTime) {
    if (lastRevolutions === 0) return 0;

    const revs = crankRevolutions - lastRevolutions;
    const time = (crankTime - lastTime) / 1024; // Convert to seconds

    if (time <= 0) return 0;

    return (revs / time) * 60; // RPM
}

describe('Power Measurement Processing', () => {
    describe('processPowerMeasurementFlags', () => {
        test('should process basic power measurement without optional fields', () => {
            // Flags = 0x0000 (no optional fields), Power = 200W
            const buffer = new Uint8Array([0x00, 0x00, 0xC8, 0x00]);
            const mockDataView = new DataView(buffer.buffer);

            const result = processPowerMeasurementFlags(0x0000, mockDataView);

            expect(result.power).toBe(200);
            expect(result.balance).toBeNull();
            expect(result.torqueEffectiveness).toBeNull();
            expect(result.pedalSmoothness).toBeNull();
            expect(result.offset).toBe(4);
        });

        test('should process power measurement with pedal balance', () => {
            // Flags = 0x0001 (pedal balance present), Power = 250W, Balance = 60%
            const buffer = new Uint8Array([0x01, 0x00, 0xFA, 0x00, 60]);
            const mockDataView = new DataView(buffer.buffer);

            const result = processPowerMeasurementFlags(0x0001, mockDataView);

            expect(result.power).toBe(250);
            expect(result.balance).toBe(60);
            expect(result.offset).toBe(5);
        });

        test('should process power measurement with torque effectiveness and pedal smoothness', () => {
            // Flags = 0x1000 (torque/smoothness present), Power = 300W
            // Torque effectiveness = 85% (170/2), Pedal smoothness = 90% (180/2)
            const buffer = new Uint8Array([0x00, 0x10, 0x2C, 0x01, 170, 0, 180, 0]);
            const mockDataView = new DataView(buffer.buffer);

            const result = processPowerMeasurementFlags(0x1000, mockDataView);

            expect(result.power).toBe(300);
            expect(result.torqueEffectiveness).toBe(85);
            expect(result.pedalSmoothness).toBe(90);
            expect(result.offset).toBe(8);
        });

        test('should handle multiple optional fields', () => {
            // Flags = 0x1001 (both pedal balance and torque/smoothness)
            const buffer = new Uint8Array([0x01, 0x10, 0x90, 0x01, 55, 160, 0, 170, 0]);
            const mockDataView = new DataView(buffer.buffer);

            const result = processPowerMeasurementFlags(0x1001, mockDataView);

            expect(result.power).toBe(400);
            expect(result.balance).toBe(55);
            expect(result.torqueEffectiveness).toBe(80);
            expect(result.pedalSmoothness).toBe(85);
        });

        test('should skip accumulated torque when flag is set', () => {
            // Flags = 0x0004 (accumulated torque present)
            const buffer = new Uint8Array([0x04, 0x00, 0x64, 0x00, 0xFF, 0xFF]);
            const mockDataView = new DataView(buffer.buffer);

            const result = processPowerMeasurementFlags(0x0004, mockDataView);

            expect(result.power).toBe(100);
            expect(result.offset).toBe(6); // 2 bytes power + 2 bytes torque
        });
    });

    describe('calculateSpeed', () => {
        test('should calculate speed correctly from wheel data', () => {
            const speed = calculateSpeed(100, 1024, 50, 0, 2.105);
            // 50 revolutions, 1 second, 2.105m circumference
            // Distance = 50 * 2.105 = 105.25m
            // Speed = 105.25 * 3.6 = 378.9 km/h
            expect(speed).toBeCloseTo(378.9, 1);
        });

        test('should return 0 for first measurement', () => {
            const speed = calculateSpeed(100, 1024, 0, 0);
            expect(speed).toBe(0);
        });

        test('should return 0 for zero time difference', () => {
            const speed = calculateSpeed(100, 1024, 50, 1024);
            expect(speed).toBe(0);
        });

        test('should handle realistic cycling speed', () => {
            // Simulate 30 km/h cycling speed
            // Time = 1 second, circumference = 2.105m
            // Expected revolutions for 30 km/h: (30000/3600) / 2.105 ≈ 3.96 revolutions
            const speed = calculateSpeed(104, 1024, 100, 0, 2.105);
            expect(speed).toBeCloseTo(30.31, 1);
        });
    });

    describe('calculateCadence', () => {
        test('should calculate cadence correctly from crank data', () => {
            const cadence = calculateCadence(100, 1024, 50, 0);
            // 50 revolutions in 1 second = 50 * 60 = 3000 RPM
            expect(cadence).toBe(3000);
        });

        test('should return 0 for first measurement', () => {
            const cadence = calculateCadence(100, 1024, 0, 0);
            expect(cadence).toBe(0);
        });

        test('should return 0 for zero time difference', () => {
            const cadence = calculateCadence(100, 1024, 50, 1024);
            expect(cadence).toBe(0);
        });

        test('should handle realistic cycling cadence', () => {
            // Simulate 90 RPM cadence
            // 1.5 revolutions in 1 second = 90 RPM
            const cadence = calculateCadence(152, 1024, 150, 0);
            expect(cadence).toBe(120); // 2 revolutions per second = 120 RPM
        });

        test('should handle fractional revolutions', () => {
            // 0.5 revolutions in 1 second = 30 RPM
            const cadence = calculateCadence(101, 2048, 100, 0);
            // 1 revolution in 2 seconds = 30 RPM
            expect(cadence).toBe(30);
        });
    });
});