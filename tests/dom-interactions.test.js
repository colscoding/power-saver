/**
 * Tests for DOM interactions and UI state management
 */

// Mock DOM manipulation functions
function updatePowerDisplay(power) {
    const element = document.getElementById('power-value');
    if (element) {
        element.textContent = power;
    }
}

function updateConnectionStatus(status, deviceName = '') {
    const statusElement = document.getElementById('status');
    const deviceElement = document.getElementById('device-name');
    const connectButton = document.getElementById('connectButton');

    if (statusElement) statusElement.textContent = status;
    if (deviceElement) deviceElement.textContent = deviceName ? `Device: ${deviceName}` : '';
    if (connectButton) connectButton.disabled = status === 'Connected and receiving data!';
}

function updateHeartRateDisplay(heartRate) {
    const element = document.getElementById('hr-value');
    if (element) {
        element.textContent = heartRate;
    }
}

function updateBalanceDisplay(balance) {
    const element = document.getElementById('balance-value');
    if (element) {
        if (balance !== null && balance !== undefined) {
            element.textContent = `${100 - balance}/${balance}`;
        } else {
            element.textContent = '--';
        }
    }
}

function resetDisplayValues() {
    const displays = [
        'power-value',
        'hr-value',
        'balance-value',
        'smoothness-value',
        'torque-value',
        'cadence-value',
        'speed-value'
    ];

    displays.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '--';
        }
    });
}

describe('DOM Interactions', () => {
    let mockElements;

    beforeEach(() => {
        // Create mock DOM elements
        mockElements = {
            'power-value': { textContent: '' },
            'status': { textContent: '' },
            'device-name': { textContent: '' },
            'connectButton': { disabled: false },
            'hr-value': { textContent: '' },
            'balance-value': { textContent: '' },
            'smoothness-value': { textContent: '' },
            'torque-value': { textContent: '' },
            'cadence-value': { textContent: '' },
            'speed-value': { textContent: '' }
        };

        // Mock getElementById
        document.getElementById = jest.fn((id) => mockElements[id] || null);
    });

    describe('updatePowerDisplay', () => {
        test('should update power value display', () => {
            updatePowerDisplay(250);
            expect(mockElements['power-value'].textContent).toBe(250);
        });

        test('should handle zero power', () => {
            updatePowerDisplay(0);
            expect(mockElements['power-value'].textContent).toBe(0);
        });

        test('should handle negative power', () => {
            updatePowerDisplay(-50);
            expect(mockElements['power-value'].textContent).toBe(-50);
        });

        test('should handle missing element gracefully', () => {
            document.getElementById = jest.fn(() => null);
            expect(() => updatePowerDisplay(250)).not.toThrow();
        });
    });

    describe('updateConnectionStatus', () => {
        test('should update status text', () => {
            updateConnectionStatus('Connecting to device...');
            expect(mockElements['status'].textContent).toBe('Connecting to device...');
        });

        test('should update device name when provided', () => {
            updateConnectionStatus('Connected!', 'Power Meter Pro');
            expect(mockElements['device-name'].textContent).toBe('Device: Power Meter Pro');
        });

        test('should clear device name when not provided', () => {
            updateConnectionStatus('Disconnected');
            expect(mockElements['device-name'].textContent).toBe('');
        });

        test('should disable connect button when connected', () => {
            updateConnectionStatus('Connected and receiving data!');
            expect(mockElements['connectButton'].disabled).toBe(true);
        });

        test('should enable connect button when not connected', () => {
            updateConnectionStatus('Disconnected');
            expect(mockElements['connectButton'].disabled).toBe(false);
        });
    });

    describe('updateHeartRateDisplay', () => {
        test('should update heart rate display', () => {
            updateHeartRateDisplay(145);
            expect(mockElements['hr-value'].textContent).toBe(145);
        });

        test('should handle zero heart rate', () => {
            updateHeartRateDisplay(0);
            expect(mockElements['hr-value'].textContent).toBe(0);
        });

        test('should handle high heart rate', () => {
            updateHeartRateDisplay(200);
            expect(mockElements['hr-value'].textContent).toBe(200);
        });
    });

    describe('updateBalanceDisplay', () => {
        test('should display balance as left/right percentage', () => {
            updateBalanceDisplay(55); // 55% right, 45% left
            expect(mockElements['balance-value'].textContent).toBe('45/55');
        });

        test('should display 50/50 for equal balance', () => {
            updateBalanceDisplay(50);
            expect(mockElements['balance-value'].textContent).toBe('50/50');
        });

        test('should display -- for null balance', () => {
            updateBalanceDisplay(null);
            expect(mockElements['balance-value'].textContent).toBe('--');
        });

        test('should display -- for undefined balance', () => {
            updateBalanceDisplay(undefined);
            expect(mockElements['balance-value'].textContent).toBe('--');
        });

        test('should handle extreme balance values', () => {
            updateBalanceDisplay(0); // 100% left
            expect(mockElements['balance-value'].textContent).toBe('100/0');

            updateBalanceDisplay(100); // 100% right
            expect(mockElements['balance-value'].textContent).toBe('0/100');
        });
    });

    describe('resetDisplayValues', () => {
        test('should reset all display values to --', () => {
            // Set some initial values
            mockElements['power-value'].textContent = '250';
            mockElements['hr-value'].textContent = '145';
            mockElements['balance-value'].textContent = '45/55';

            resetDisplayValues();

            expect(mockElements['power-value'].textContent).toBe('--');
            expect(mockElements['hr-value'].textContent).toBe('--');
            expect(mockElements['balance-value'].textContent).toBe('--');
            expect(mockElements['smoothness-value'].textContent).toBe('--');
            expect(mockElements['torque-value'].textContent).toBe('--');
            expect(mockElements['cadence-value'].textContent).toBe('--');
            expect(mockElements['speed-value'].textContent).toBe('--');
        });

        test('should handle missing elements gracefully', () => {
            document.getElementById = jest.fn(() => null);
            expect(() => resetDisplayValues()).not.toThrow();
        });
    });
});