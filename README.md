# Web Bluetooth Power Meter

A web-based power meter application that connects to Bluetooth power meters and provides real-time cycling data analysis.

## Features

- Connect to Bluetooth power meters, heart rate monitors, and speed/cadence sensors
- Real-time power, heart rate, and cadence display
- Power analysis with averages (10s, 30s, 1min, 5min, 20min)
- Session data export in multiple formats (JSON, CSV, TCX)
- **New:** Cloud export to Google Docs, Google Sheets, and intervals.icu
- Summary image generation


## Development

### Building the Project

```bash
npm install
npm run build
```

### Running Locally

After building, you can serve the `build` directory with any static file server.

## Browser Compatibility

This application requires a browser with Web Bluetooth support:
- Chrome 56+
- Edge 79+
- Opera 43+

## Data Export Formats

### Local Exports
- **Summary JSON/CSV**: Aggregated session data with averages
- **Raw JSON/CSV**: All individual measurements
- **TCX**: Training Center XML format compatible with most cycling platforms
- **Summary Image**: Visual chart of your session data
- Includes power, heart rate, and cadence data
- Compatible with intervals.icu's analysis tools
- Preserves all timing and measurement data


## Troubleshooting



### Development Setup

For local development, you can use a simple HTTP server:

```bash
# After building
cd build
python -m http.server 8000
# Then visit http://localhost:8000
```