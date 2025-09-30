
/**
 * Show QR code modal with link to the app
 */
function showQrCodeModal() {
    const appUrl = 'https://colscoding.github.io/power-saver/';

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
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-align: center;
    `;

    // Create QR code canvas
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 256;
    qrCanvas.height = 256;
    qrCanvas.style.cssText = `
        background: white;
        border-radius: 8px;
        margin: 1rem 0;
        max-width: 100%;
        height: auto;
    `;

    // Generate QR code
    generateQRCode(qrCanvas, appUrl);

    modalContent.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h2 style="color: #9b59b6; margin: 0 0 0.5rem 0; font-size: 1.8rem;">📱 Share Power Meter App</h2>
            <p style="color: #cccccc; margin: 0; font-size: 1rem;">Scan to access the app on any device</p>
        </div>
        
        <div id="qr-container" style="margin: 1.5rem 0;"></div>
        
        <div style="margin: 1.5rem 0;">
            <p style="color: #ffffff; margin: 0 0 0.5rem 0; font-weight: 600;">Or visit directly:</p>
            <a href="${appUrl}" target="_blank" style="
                color: #9b59b6; 
                text-decoration: none; 
                font-size: 0.9rem;
                word-break: break-all;
                line-height: 1.4;
            ">${appUrl}</a>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
            <button id="closeQrModal" style="
                background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Close</button>
        </div>
    `;

    // Insert QR code canvas
    const qrContainer = modalContent.querySelector('#qr-container');
    qrContainer.appendChild(qrCanvas);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal event listeners
    const closeButton = modalContent.querySelector('#closeQrModal');
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
        closeButton.style.boxShadow = '0 8px 24px rgba(155, 89, 182, 0.4)';
    });

    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.transform = 'translateY(0)';
        closeButton.style.boxShadow = 'none';
    });
}

/**
 * Generate QR code on canvas using a simple QR code generation algorithm
 */
function generateQRCode(canvas, text) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Simple QR code generation using an online QR code API as fallback
    // For a production app, you'd want to include a proper QR code library
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = function () {
        ctx.drawImage(img, 0, 0, size, size);
    };

    img.onerror = function () {
        // Fallback: draw a simple pattern if QR API fails
        drawFallbackQR(ctx, size);
    };

    img.src = qrApiUrl;
}

/**
 * Fallback QR code representation when API is unavailable
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

export { showQrCodeModal };