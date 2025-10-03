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

### Cloud Exports (New!)
- **Google Docs**: Professional session report with formatted summary and data tables
- **Google Sheets**: Detailed spreadsheets with separate sheets for summary and raw data
- **intervals.icu**: Direct upload to intervals.icu cycling analytics platform

#### Setting Up Google Cloud Exports

To enable cloud exports, you need to configure Google API credentials:

1. Go to the [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Docs API and Google Sheets API
4. Create credentials (API Key and OAuth 2.0 Client ID)
5. In the app, click "⚙️ Configure API" in the Cloud Exports section
6. Enter your Client ID and API Key

**Required Google APIs:**
- Google Docs API
- Google Sheets API  
- Google Drive API (for file creation)

**OAuth 2.0 Scopes:**
- `https://www.googleapis.com/auth/documents`
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`

#### Setting Up intervals.icu Export

To enable intervals.icu export:

1. Sign up for an [intervals.icu](https://intervals.icu) account
2. Go to Settings → Developer in your intervals.icu account
3. Generate an API key
4. In the app, click "⚙️ Configure intervals.icu" 
5. Enter your intervals.icu username/email and API key

**Features:**
- Automatically uploads activities as TCX files
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