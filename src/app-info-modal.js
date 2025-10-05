/**
 * Show application information and usage instructions
 */
function showAppInfo() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal';
    modalContent.style.cssText = `
        background: #1a1a2e;
        border-radius: 12px;
        padding: 2rem;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Create QR code canvas
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 200;
    qrCanvas.height = 200;
    qrCanvas.style.cssText = `
        background: white;
        border-radius: 8px;
        margin: 1rem auto;
        max-width: 100%;
        height: auto;
        display: block;
    `;

    modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <h2 style="color: #3498db; margin: 0 0 0.5rem 0; font-size: 1.8rem;">🚴 Web Bluetooth Power Meter</h2>
            <p style="color: #cccccc; margin: 0; font-size: 1rem;">Real-time cycling data analysis</p>
        </div>

        <div style="color: #ffffff; line-height: 1.6;">
            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">📱 Share This App</h3>
            <div style="text-align: center; margin-bottom: 1rem;">
                <div id="qr-container" style="margin: 1rem 0;"></div>
                <p style="color: #ffffff; margin: 0.5rem 0; font-weight: 600;">Scan to access on any device</p>
                <a href="https://colscoding.github.io/power-saver/" target="_blank" style="
                    color: #9b59b6; 
                    text-decoration: none; 
                    font-size: 0.9rem;
                    word-break: break-all;
                    line-height: 1.4;
                ">https://colscoding.github.io/power-saver/</a>
            </div>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">📱 What is this app?</h3>
            <p style="margin-bottom: 1rem;">
                This is a web-based power meter application that connects to Bluetooth devices:
            </p>
            <ul style="margin: 0 0 1rem 1rem; padding-left: 1rem;">
                <li>cycling power meter</li>
                <li>cadence sensor</li>
                <li>heart rate sensor</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
            <button id="closeInfoModal" style="
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Got it!</button>
        </div>
    `;

    // Insert QR code canvas
    const qrContainer = modalContent.querySelector('#qr-container');
    qrContainer.appendChild(qrCanvas);

    // Generate QR code
    generateQRCode(qrCanvas);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal event listeners
    const closeButton = modalContent.querySelector('#closeInfoModal');
    const closeModal = () => {
        document.body.removeChild(modal);
    };

    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Add hover effect to button
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.transform = 'translateY(-2px)';
        closeButton.style.boxShadow = '0 8px 24px rgba(52, 152, 219, 0.4)';
    });

    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.transform = 'translateY(0)';
        closeButton.style.boxShadow = 'none';
    });
}

/**
 * Generate QR code on canvas using inline base64 data
 */
function generateQRCode(canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Base64 encoded QR code data
    const qrBase64 = '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';

    // Load base64 encoded QR code
    const img = new Image();

    img.onload = function () {
        ctx.drawImage(img, 0, 0, size, size);
    };

    img.onerror = function () {
        // Fallback: draw a simple pattern if base64 data fails to load
        drawFallbackQR(ctx, size);
    };

    img.src = 'data:image/png;base64,' + qrBase64;
}

/**
 * Fallback QR code representation when local image is unavailable
 */
function drawFallbackQR(ctx, size) {
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Draw a simple grid pattern
    const cellSize = size / 25;
    for (let i = 0; i < 25; i++) {
        for (let j = 0; j < 25; j++) {
            if ((i + j) % 3 === 0 || i === 0 || i === 24 || j === 0 || j === 24) {
                ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }

    // Add text in center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size * 0.2, size * 0.4, size * 0.6, size * 0.2);
    ctx.fillStyle = '#000000';
    ctx.fillText('QR Code', size / 2, size / 2 - 10);
    ctx.fillText('Unavailable', size / 2, size / 2 + 10);
}

export { showAppInfo };