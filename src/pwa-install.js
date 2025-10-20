/**
 * PWA Installation Handler
 * Manages service worker registration and install prompts
 */

import { InstallPrompt, UpdateBanner, OfflineIndicator, showIOSInstallInstructions } from './pwa-ui.js';

let deferredPrompt = null;
let installPrompt = null;
let updateBanner = null;
let offlineIndicator = null;

/**
 * Register the service worker
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register(
                    new URL('./service-worker.js', import.meta.url),
                    { type: 'module' }
                );
                console.log('[PWA] Service Worker registered:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New service worker available');
                            // Optionally show a notification to user about update
                            showUpdateNotification(newWorker);
                        }
                    });
                });

            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        });
    } else {
        console.warn('[PWA] Service Workers are not supported in this browser');
    }
}

/**
 * Show update notification and allow user to update
 */
function showUpdateNotification(worker) {
    console.log('[PWA] Update available. New version can be activated.');

    // Show the custom update banner
    if (!updateBanner) {
        updateBanner = new UpdateBanner();
    }
    updateBanner.show(worker);
}

/**
 * Setup install prompt handler
 */
export function setupInstallPrompt() {
    // Initialize install prompt UI
    if (!installPrompt) {
        installPrompt = new InstallPrompt();
    }

    // Capture the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[PWA] Install prompt available');

        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();

        // Store the event so it can be triggered later
        deferredPrompt = e;

        // Show custom install banner
        installPrompt.show(e);
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App successfully installed');
        deferredPrompt = null;
        if (installPrompt) {
            installPrompt.hide();
        }
    });

    // Show iOS-specific instructions
    setTimeout(() => {
        showIOSInstallInstructions();
    }, 2000);
}



/**
 * Trigger install prompt programmatically
 */
export async function promptInstall() {
    if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available');
        return false;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // Clear the deferred prompt
    deferredPrompt = null;

    return outcome === 'accepted';
}

/**
 * Check if app is running as installed PWA
 */
export function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}

/**
 * Initialize PWA features
 */
export function initializePWA() {
    registerServiceWorker();
    setupInstallPrompt();

    // Initialize offline indicator
    if (!offlineIndicator) {
        offlineIndicator = new OfflineIndicator();
    }
    offlineIndicator.init();

    // Log installation status
    if (isInstalled()) {
        console.log('[PWA] Running as installed app');
    } else {
        console.log('[PWA] Running in browser');
    }
}
