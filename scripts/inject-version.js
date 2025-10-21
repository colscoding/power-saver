#!/usr/bin/env node

/**
 * Build script to inject version/timestamp into service worker
 * This ensures each build has a unique cache version
 */

const fs = require('fs');
const path = require('path');

// Generate version from timestamp
const version = Date.now().toString();

// Path to the built service worker
const serviceWorkerPath = path.join(__dirname, '../build/service-worker.js');

// Check if file exists
if (fs.existsSync(serviceWorkerPath)) {
    // Read the service worker file
    let content = fs.readFileSync(serviceWorkerPath, 'utf8');

    // Replace the placeholder with actual version
    content = content.replace('__BUILD_VERSION__', version);

    // Write back
    fs.writeFileSync(serviceWorkerPath, content, 'utf8');

    console.log(`✅ Injected build version: ${version} into service-worker.js`);
} else {
    console.warn('⚠️  Service worker file not found at:', serviceWorkerPath);
    console.warn('   Build may not have completed yet.');
}
