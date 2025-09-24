# Web Bluetooth Power Meter

A web-based power meter application that connects to Bluetooth power meters and provides real-time cycling data analysis.

## Features

- Connect to Bluetooth power meters, heart rate monitors, and speed/cadence sensors
- Real-time power, heart rate, and cadence display
- Power analysis with averages (10s, 30s, 1min, 5min, 20min)
- Session data export in multiple formats (JSON, CSV, TCX)
- **Strava integration** - sync your rides directly to Strava

## Strava Integration Setup

To enable the Strava sync functionality, you need to create a Strava application and configure the credentials:

### Step 1: Create a Strava App

1. Go to https://www.strava.com/settings/api
2. Click "Create & Manage Your App"
3. Fill in the required information:
   - **Application Name**: Your app name (e.g., "Web Power Meter")
   - **Category**: Choose appropriate category
   - **Club**: Leave blank if not applicable
   - **Website**: Your website URL
   - **Authorization Callback Domain**: Your domain (e.g., `localhost` for local development or your production domain)

### Step 2: Configure Client ID (In-App)

1. After creating your Strava app, note down your **Client ID** (Client Secret is not needed)
2. In the Power Meter app:
   - Click the hamburger menu (☰) in the top-right corner
   - Select "🚴 Strava Settings"
   - Enter your Client ID in the configuration dialog
   - Click "Save & Connect"

**OR** when you first try to sync to Strava:
- Click the "🚴 Connect to Strava" button in the Export section
- The configuration dialog will appear automatically
- Follow the instructions and enter your Client ID

Your Client ID will be stored securely in your browser and remembered for future sessions.

**Security Note**: This implementation uses Strava's implicit OAuth flow, which is secure for client-side applications and doesn't require exposing a client secret.

### Step 3: Test the Integration

1. Build and run your application
2. Record some power data
3. Click the "🚴 Connect to Strava" button in the Export section
4. If not configured, the setup dialog will appear
5. You'll be redirected to Strava for authorization
6. After approval, your ride will be uploaded to Strava

### Reconfiguring Strava

To change your Strava Client ID or reconfigure the integration:
1. Open the hamburger menu (☰)
2. Click "🚴 Strava Settings"
3. Enter your new Client ID
4. Click "Save & Connect"

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

- **Summary JSON/CSV**: Aggregated session data with averages
- **Raw JSON/CSV**: All individual measurements
- **TCX**: Training Center XML format compatible with most cycling platforms
- **Strava Sync**: Direct upload to Strava (requires setup)

## Security Note

This implementation uses Strava's **implicit OAuth flow**, which is designed for client-side applications and doesn't require a client secret. This is much more secure than exposing credentials in frontend code.

**Alternative Approaches for Enhanced Security:**

1. **Backend Proxy** (Most Secure): Implement a backend service to handle all Strava API interactions
2. **Serverless Functions**: Use services like Netlify Functions, Vercel Functions, or AWS Lambda for API proxying
3. **PKCE Flow**: For even better security, consider implementing OAuth 2.0 with PKCE (Proof Key for Code Exchange)

## Troubleshooting

### Strava Integration Issues

1. **CORS Errors**: The Strava API supports CORS for file uploads, but if you encounter issues, consider implementing a backend proxy.
2. **Token Expiration**: Strava tokens expire after 6 hours. The app will prompt for re-authentication when needed.
3. **Upload Limits**: Strava has rate limits on file uploads. The app handles basic error cases.

### Development Setup

For local development, you can use a simple HTTP server:

```bash
# After building
cd build
python -m http.server 8000
# Then visit http://localhost:8000
```