/**
 * PWA UI Components
 * Handles PWA-specific UI elements: install prompt, update banner, offline indicator
 */

/**
 * Create and manage the custom install prompt banner
 */
export class InstallPrompt {
    constructor() {
        this.banner = null;
        this.deferredPrompt = null;
    }

    /**
     * Create the install banner HTML
     */
    createBanner() {
        const banner = document.createElement('div');
        banner.id = 'pwaInstallBanner';
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-icon">⚡</div>
                <div class="pwa-install-text">
                    <strong>Install Power Meter</strong>
                    <span>Add to home screen for quick access</span>
                </div>
                <div class="pwa-install-actions">
                    <button id="pwaInstallButton" class="pwa-btn pwa-btn-primary">Install</button>
                    <button id="pwaInstallClose" class="pwa-btn pwa-btn-secondary">×</button>
                </div>
            </div>
        `;
        return banner;
    }

    /**
     * Show the install banner
     */
    show(deferredPrompt) {
        // Don't show if already installed or if user dismissed recently
        if (this.isInstalled() || this.wasRecentlyDismissed()) {
            return;
        }

        this.deferredPrompt = deferredPrompt;

        if (!this.banner) {
            this.banner = this.createBanner();
            document.body.appendChild(this.banner);
            this.attachEventListeners();
        }

        // Animate in
        setTimeout(() => {
            this.banner.classList.add('pwa-install-banner-visible');
        }, 500);
    }

    /**
     * Hide the install banner
     */
    hide() {
        if (this.banner) {
            this.banner.classList.remove('pwa-install-banner-visible');
            setTimeout(() => {
                if (this.banner && this.banner.parentNode) {
                    this.banner.parentNode.removeChild(this.banner);
                    this.banner = null;
                }
            }, 300);
        }
    }

    /**
     * Attach event listeners to banner buttons
     */
    attachEventListeners() {
        const installBtn = this.banner.querySelector('#pwaInstallButton');
        const closeBtn = this.banner.querySelector('#pwaInstallClose');

        installBtn.addEventListener('click', () => this.handleInstallClick());
        closeBtn.addEventListener('click', () => this.handleCloseClick());
    }

    /**
     * Handle install button click
     */
    async handleInstallClick() {
        if (!this.deferredPrompt) {
            console.log('[PWA] Install prompt not available');
            return;
        }

        // Show native install prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`[PWA] Install prompt outcome: ${outcome}`);

        // Hide banner regardless of outcome
        this.hide();

        // Clear the deferred prompt
        this.deferredPrompt = null;

        // Show thank you message if accepted
        if (outcome === 'accepted') {
            this.showThankYouMessage();
        }
    }

    /**
     * Handle close button click
     */
    handleCloseClick() {
        this.hide();
        // Store dismissal timestamp
        localStorage.setItem('pwaInstallDismissed', Date.now().toString());
    }

    /**
     * Check if user dismissed recently (within 7 days)
     */
    wasRecentlyDismissed() {
        const dismissed = localStorage.getItem('pwaInstallDismissed');
        if (!dismissed) return false;

        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        return (Date.now() - parseInt(dismissed)) < sevenDaysMs;
    }

    /**
     * Check if app is installed
     */
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    /**
     * Show thank you message after installation
     */
    showThankYouMessage() {
        const message = document.createElement('div');
        message.className = 'pwa-toast pwa-toast-success';
        message.innerHTML = `
            <div class="pwa-toast-content">
                <span class="pwa-toast-icon">✓</span>
                <span>Thanks for installing! Launch from your home screen.</span>
            </div>
        `;
        document.body.appendChild(message);

        setTimeout(() => message.classList.add('pwa-toast-visible'), 100);
        setTimeout(() => {
            message.classList.remove('pwa-toast-visible');
            setTimeout(() => message.remove(), 300);
        }, 4000);
    }
}

/**
 * Create and manage the update notification banner
 */
export class UpdateBanner {
    constructor() {
        this.banner = null;
        this.waitingWorker = null;
    }

    /**
     * Create the update banner HTML
     */
    createBanner() {
        const banner = document.createElement('div');
        banner.id = 'pwaUpdateBanner';
        banner.className = 'pwa-update-banner';
        banner.innerHTML = `
            <div class="pwa-update-content">
                <div class="pwa-update-icon">🔄</div>
                <div class="pwa-update-text">
                    <strong>Update Available</strong>
                    <span>A new version is ready to install</span>
                </div>
                <div class="pwa-update-actions">
                    <button id="pwaUpdateButton" class="pwa-btn pwa-btn-primary">Update Now</button>
                    <button id="pwaUpdateLater" class="pwa-btn pwa-btn-secondary">Later</button>
                </div>
            </div>
        `;
        return banner;
    }

    /**
     * Show the update banner
     */
    show(waitingWorker) {
        this.waitingWorker = waitingWorker;

        if (!this.banner) {
            this.banner = this.createBanner();
            document.body.appendChild(this.banner);
            this.attachEventListeners();
        }

        // Animate in
        setTimeout(() => {
            this.banner.classList.add('pwa-update-banner-visible');
        }, 500);
    }

    /**
     * Hide the update banner
     */
    hide() {
        if (this.banner) {
            this.banner.classList.remove('pwa-update-banner-visible');
            setTimeout(() => {
                if (this.banner && this.banner.parentNode) {
                    this.banner.parentNode.removeChild(this.banner);
                    this.banner = null;
                }
            }, 300);
        }
    }

    /**
     * Attach event listeners to banner buttons
     */
    attachEventListeners() {
        const updateBtn = this.banner.querySelector('#pwaUpdateButton');
        const laterBtn = this.banner.querySelector('#pwaUpdateLater');

        updateBtn.addEventListener('click', () => this.handleUpdateClick());
        laterBtn.addEventListener('click', () => this.handleLaterClick());
    }

    /**
     * Handle update button click
     */
    handleUpdateClick() {
        if (!this.waitingWorker) {
            console.log('[PWA] No waiting worker to activate');
            return;
        }

        // Tell the service worker to skip waiting
        this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });

        // Show loading message
        this.showUpdatingMessage();

        // Reload the page after a brief delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    /**
     * Handle later button click
     */
    handleLaterClick() {
        this.hide();
    }

    /**
     * Show updating message
     */
    showUpdatingMessage() {
        this.hide();

        const message = document.createElement('div');
        message.className = 'pwa-toast pwa-toast-info';
        message.innerHTML = `
            <div class="pwa-toast-content">
                <span class="pwa-toast-icon">🔄</span>
                <span>Updating app...</span>
            </div>
        `;
        document.body.appendChild(message);

        setTimeout(() => message.classList.add('pwa-toast-visible'), 100);
    }
}

/**
 * Create and manage the offline indicator
 */
export class OfflineIndicator {
    constructor() {
        this.indicator = null;
        this.isOnline = navigator.onLine;
    }

    /**
     * Create the offline indicator HTML
     */
    createIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'pwaOfflineIndicator';
        indicator.className = 'pwa-offline-indicator';
        indicator.innerHTML = `
            <div class="pwa-offline-content">
                <span class="pwa-offline-icon">📴</span>
                <span class="pwa-offline-text">You're offline</span>
            </div>
        `;
        return indicator;
    }

    /**
     * Initialize the offline indicator
     */
    init() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Check initial state
        if (!navigator.onLine) {
            this.handleOffline();
        }
    }

    /**
     * Handle online event
     */
    handleOnline() {
        this.isOnline = true;
        console.log('[PWA] Connection restored');
        this.hide();
        this.showToast('✓', 'Back online', 'success');
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        this.isOnline = false;
        console.log('[PWA] Connection lost');
        this.show();
    }

    /**
     * Show the offline indicator
     */
    show() {
        if (!this.indicator) {
            this.indicator = this.createIndicator();
            document.body.appendChild(this.indicator);
        }

        setTimeout(() => {
            this.indicator.classList.add('pwa-offline-indicator-visible');
        }, 100);
    }

    /**
     * Hide the offline indicator
     */
    hide() {
        if (this.indicator) {
            this.indicator.classList.remove('pwa-offline-indicator-visible');
            setTimeout(() => {
                if (this.indicator && this.indicator.parentNode) {
                    this.indicator.parentNode.removeChild(this.indicator);
                    this.indicator = null;
                }
            }, 300);
        }
    }

    /**
     * Show a toast notification
     */
    showToast(icon, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `pwa-toast pwa-toast-${type}`;
        toast.innerHTML = `
            <div class="pwa-toast-content">
                <span class="pwa-toast-icon">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('pwa-toast-visible'), 100);
        setTimeout(() => {
            toast.classList.remove('pwa-toast-visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

/**
 * Show install instructions for iOS users
 */
export function showIOSInstallInstructions() {
    // Check if iOS Safari and not installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;

    if (isIOS && !isInStandaloneMode) {
        // Check if user dismissed recently
        const dismissed = localStorage.getItem('iosInstallDismissed');
        if (dismissed) {
            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
            if ((Date.now() - parseInt(dismissed)) < threeDaysMs) {
                return; // Don't show if dismissed within 3 days
            }
        }

        const banner = document.createElement('div');
        banner.className = 'pwa-ios-instructions';
        banner.innerHTML = `
            <div class="pwa-ios-content">
                <div class="pwa-ios-header">
                    <span class="pwa-ios-icon">📱</span>
                    <strong>Install Power Meter</strong>
                    <button class="pwa-ios-close" id="pwaIOSClose">×</button>
                </div>
                <div class="pwa-ios-steps">
                    <p>Tap <strong>Share</strong> <span style="font-size: 1.2em;">□↑</span> then <strong>Add to Home Screen</strong></p>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        setTimeout(() => banner.classList.add('pwa-ios-instructions-visible'), 500);

        // Close button handler
        const closeBtn = banner.querySelector('#pwaIOSClose');
        closeBtn.addEventListener('click', () => {
            banner.classList.remove('pwa-ios-instructions-visible');
            setTimeout(() => banner.remove(), 300);
            localStorage.setItem('iosInstallDismissed', Date.now().toString());
        });
    }
}
