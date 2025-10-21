# Additional Sensors - Quick Reference Guide

## What's New?

The **Spy Mode** has been replaced with a more flexible **Additional Sensors** feature that allows you to connect multiple sensors of any type simultaneously.

## How to Use

### Connecting Additional Sensors

1. **Open the Menu**
   - Click the hamburger menu (☰) in the top-left corner

2. **Select Sensor Type**
   - Choose from:
     - ⚡ Connect Additional Power Meter
     - ❤️ Connect Additional Heart Rate Monitor  
     - 🚴 Connect Additional Cadence Sensor
     - 🏃 Connect Additional Speed Sensor

3. **Pair Your Device**
   - Your browser will show a Bluetooth device selection dialog
   - Select your sensor from the list
   - Click "Pair" or "Connect"

4. **View Your Data**
   - A new card appears in the "Additional Sensors" section
   - Real-time data updates automatically
   - Each sensor shows its current value and unit

### Managing Multiple Sensors

- **Connect multiple sensors** of the same type (e.g., 2 power meters, 3 heart rate monitors)
- **Each sensor gets its own card** with live data
- **Cards are color-coded** by sensor type for easy identification

### Disconnecting Sensors

- Click the **"Disconnect"** button on any sensor card
- The card disappears and the sensor is released
- The section auto-hides when all additional sensors are disconnected

## Data Export

### What Gets Exported?

**JSON Export:**
- Main sensor data (primary power, HR, cadence)
- All additional sensor data with full history
- Organized by sensor type and device

**CSV Export:**
- Main sensor data in the first columns
- Additional sensors as extra columns
- Values matched to main session timestamps
- Column names: `{type}_{deviceName}`

**TCX Export:**
- Only includes main power sensor data
- Additional sensors are excluded (TCX is for primary workout data)

### Export Tips

- Use **"Export All Files"** to get all formats at once
- Additional sensor data is automatically included in JSON/CSV
- Data is timestamped for precise analysis

## Benefits

### vs. Old Spy Mode

| Feature | Spy Mode | Additional Sensors |
|---------|----------|-------------------|
| Sensor types | Power only | Power, HR, Cadence, Speed |
| Number of sensors | 1 | Unlimited |
| Data export | Not included | Included in JSON/CSV |
| Ease of use | Manual toggle | One-click connect |
| Flexibility | Fixed layout | Dynamic cards |

### Real-World Use Cases

1. **Compare Multiple Power Meters**
   - Connect your left/right power meters separately
   - Compare readings between different brands
   - Validate power meter accuracy

2. **Monitor Training Partners**
   - Connect multiple heart rate monitors
   - Track group training sessions
   - Compare effort levels in real-time

3. **Dual Bike Setup**
   - Connect sensors from a smart trainer AND your bike
   - Compare indoor vs. outdoor power data
   - Verify trainer accuracy

4. **Speed Tracking**
   - Connect wheel speed sensors
   - Monitor actual speed alongside cadence
   - Track distance covered

## Troubleshooting

### "No device found"
- Make sure your sensor is powered on and in pairing mode
- Check that Bluetooth is enabled on your device
- Move closer to the sensor

### "Connection failed"
- Try turning the sensor off and on again
- Disconnect from other apps that might be using the sensor
- Refresh the page and try again

### "Not supported" error
- Web Bluetooth requires Chrome, Edge, or another Chromium-based browser
- Not available in Firefox or Safari
- Check that you're using HTTPS (required for Bluetooth API)

### Data not showing in exports
- Make sure sensors are connected before starting your workout
- Data is only captured while sensors are actively connected
- Check that you have data in the main session (requires primary power meter)

## Technical Details

### Data Storage
- Up to 10,000 readings per sensor (about 16 minutes at 10Hz)
- Automatic cleanup of old data to save memory
- Survives page refreshes for 24 hours

### Update Rates
- Sensors update at their native Bluetooth rate (1-10 Hz)
- UI updates are immediate
- No performance impact with multiple sensors

### Privacy & Security
- All data stays on your device (no cloud uploads)
- Bluetooth connections are secure and local
- You control which sensors to connect

## Tips & Best Practices

1. **Connect sensors in order**: Connect your primary power meter first, then add additional sensors
2. **Use descriptive names**: If possible, rename your sensors to easily identify them
3. **Test before rides**: Verify connections before starting your workout
4. **Export regularly**: Download your data after each session as backup
5. **Disconnect when done**: Release sensors to save battery and allow other apps to connect

## Need Help?

If you encounter issues:
1. Check the browser console for error messages (F12 → Console tab)
2. Verify your browser supports Web Bluetooth
3. Make sure you're on a secure connection (HTTPS)
4. Try refreshing the page and reconnecting

---

**Enjoy tracking with multiple sensors! 🚴‍♂️⚡📊**
