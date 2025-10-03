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

    modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <h2 style="color: #3498db; margin: 0 0 0.5rem 0; font-size: 1.8rem;">🚴 Web Bluetooth Power Meter</h2>
            <p style="color: #cccccc; margin: 0; font-size: 1rem;">Real-time cycling data analysis</p>
        </div>

        <div style="color: #ffffff; line-height: 1.6;">
            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">📱 What is this app?</h3>
            <p style="margin-bottom: 1rem;">
                This is a web-based power meter application that connects to Bluetooth cycling devices 
                to provide real-time power, heart rate, and cadence data analysis. Perfect for indoor 
                training, data logging, and performance tracking.
            </p>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">🔗 How to connect devices:</h3>
            <ol style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Power Meter:</strong> Click "Connect Power Meter" and select your cycling power device</li>
                <li><strong>Heart Rate:</strong> Click "Connect Heart Rate" to pair your HR monitor</li>
                <li><strong>Cadence:</strong> Click "Connect Cadence" for speed/cadence sensors</li>
            </ol>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">📊 Features:</h3>
            <ul style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Real-time Metrics:</strong> Live power, heart rate, and cadence display</li>
                <li><strong>Power Averages:</strong> 10s, 20s, 30s, 40s, 50s, 1m, 2m, 3m, 4m, and 5m rolling averages</li>
                <li><strong>Data Export:</strong> JSON, CSV, TCX, and visual summary image formats</li>
                <li><strong>Session Persistence:</strong> Data automatically saved and restored</li>
                <li><strong>Custom Dashboard:</strong> Toggle metrics and sections via hamburger menu</li>
            </ul>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">⚙️ Using the hamburger menu:</h3>
            <ul style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Toggle Sections:</strong> Show/hide different parts of the interface</li>
                <li><strong>Load Debug Data:</strong> Generate 1000 test data points for testing</li>
                <li><strong>Customize View:</strong> Control which metrics are visible</li>
            </ul>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">🌐 Browser Support:</h3>
            <p style="margin-bottom: 1rem;">
                Requires a browser with Web Bluetooth support:
                <br>• Chrome 56+ • Edge 79+ • Opera 43+
            </p>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">💡 Tips:</h3>
            <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
                <li>Make sure your devices are in pairing mode before connecting</li>
                <li>Data is automatically saved to your browser's local storage</li>
                <li>Use the export functions to save your workout data</li>
                <li>The app works offline once loaded</li>
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

export { showAppInfo };