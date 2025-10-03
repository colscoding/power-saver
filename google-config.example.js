/**
 * Google API Configuration Example
 * 
 * To enable cloud exports, you can either:
 * 1. Use the in-app configuration modal (recommended)
 * 2. Set up this configuration file
 * 3. Use localStorage directly in browser console
 */

// Option 1: Global configuration (rename this file to google-config.js and include in HTML)
window.GOOGLE_CONFIG = {
    CLIENT_ID: 'your-google-client-id.googleusercontent.com',
    API_KEY: 'your-google-api-key'
};

// Option 2: Set in browser console or developer tools
// localStorage.setItem('google_client_id', 'your-google-client-id.googleusercontent.com');
// localStorage.setItem('google_api_key', 'your-google-api-key');

/**
 * Getting Google API Credentials:
 * 
 * 1. Go to https://console.developers.google.com/
 * 2. Create a new project or select existing
 * 3. Enable these APIs:
 *    - Google Docs API
 *    - Google Sheets API
 *    - Google Drive API
 * 
 * 4. Create Credentials:
 *    - API Key (for Docs/Sheets APIs)
 *    - OAuth 2.0 Client ID (for user authentication)
 * 
 * 5. Configure OAuth consent screen with your domain
 * 
 * 6. Add authorized JavaScript origins:
 *    - http://localhost:8000 (for development)
 *    - https://yourdomain.com (for production)
 */