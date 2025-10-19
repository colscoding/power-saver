/**
 * Metric Icon Handlers
 * Handles click events on metric icons to show information
 */

/**
 * Show a modal with metric information
 * @param {string} title - The title of the modal
 * @param {string} description - The description text
 */
function showMetricInfo(title, description) {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'metric-info-modal';
    modal.innerHTML = `
        <div class="metric-info-content">
            <div class="metric-info-header">
                <h3>${title}</h3>
                <button class="metric-info-close" aria-label="Close">×</button>
            </div>
            <div class="metric-info-body">
                <p>${description}</p>
            </div>
        </div>
    `;

    // Add to DOM
    document.body.appendChild(modal);

    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);

    // Close handlers
    const closeBtn = modal.querySelector('.metric-info-close');
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ESC key to close
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

/**
 * Initialize metric icon event listeners
 */
export function initializeMetricIcons() {
    // Power icon
    const powerIcon = document.getElementById('powerIcon');
    if (powerIcon) {
        powerIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showMetricInfo(
                '⚡ Power Output',
                'Power output is measured in Watts and represents the amount of work you are doing on the bike. ' +
                'It is calculated by measuring the force applied to the pedals and the speed of pedaling. ' +
                'Higher power output means you are working harder. This metric is the most accurate way to measure cycling effort.'
            );
        });
    }

    // Heart Rate icon
    const hrIcon = document.getElementById('hrIcon');
    if (hrIcon) {
        hrIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showMetricInfo(
                '❤️ Heart Rate',
                'Heart rate is measured in beats per minute (BPM) and indicates how hard your cardiovascular system is working. ' +
                'Your heart rate increases as exercise intensity increases. Monitoring heart rate helps you train in specific zones ' +
                'for different fitness goals. Connect a Bluetooth heart rate monitor to track this metric.'
            );
        });
    }

    // Cadence icon
    const cadenceIcon = document.getElementById('cadenceIcon');
    if (cadenceIcon) {
        cadenceIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showMetricInfo(
                '🚴 Cadence',
                'Cadence is measured in revolutions per minute (RPM) and represents how fast you are pedaling. ' +
                'Most cyclists aim for a cadence between 80-100 RPM for optimal efficiency. ' +
                'Higher cadence with lower resistance can reduce muscle fatigue, while lower cadence with higher resistance builds strength. ' +
                'Connect a speed & cadence sensor to track this metric.'
            );
        });
    }
}
