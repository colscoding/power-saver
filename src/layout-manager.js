/**
 * Layout Manager
 * Manages different layout configurations for the power meter application
 */

const layouts = {
    classic: {
        name: "Classic",
        description: "Large power display with smaller side metrics",
        icon: "📊",
        gridTemplate: "2fr 1fr 1fr",
        cardSizes: {
            power: { fontSize: "6rem", padding: "2rem" },
            hr: { fontSize: "3rem", padding: "1rem" },
            cadence: { fontSize: "3rem", padding: "1rem" }
        }
    },
    balanced: {
        name: "Balanced",
        description: "Equal size cards for all metrics",
        icon: "⚖️",
        gridTemplate: "1fr 1fr 1fr",
        cardSizes: {
            power: { fontSize: "4.5rem", padding: "1.5rem" },
            hr: { fontSize: "4.5rem", padding: "1.5rem" },
            cadence: { fontSize: "4.5rem", padding: "1.5rem" }
        }
    },
    vertical: {
        name: "Vertical Stack",
        description: "Single column with full-width cards",
        icon: "📱",
        gridTemplate: "1fr",
        cardSizes: {
            power: { fontSize: "5rem", padding: "1.5rem" },
            hr: { fontSize: "4rem", padding: "1.5rem" },
            cadence: { fontSize: "4rem", padding: "1.5rem" }
        },
        responsive: true
    },
    compact: {
        name: "Compact",
        description: "Dense layout for more screen space",
        icon: "📦",
        gridTemplate: "1fr 1fr 1fr",
        cardSizes: {
            power: { fontSize: "3.5rem", padding: "0.75rem" },
            hr: { fontSize: "2.5rem", padding: "0.75rem" },
            cadence: { fontSize: "2.5rem", padding: "0.75rem" }
        },
        compact: true
    },
    powerFocus: {
        name: "Power Focus",
        description: "Maximize power display, minimize others",
        icon: "⚡",
        gridTemplate: "3fr 1fr",
        cardSizes: {
            power: { fontSize: "8rem", padding: "2.5rem" },
            hr: { fontSize: "2rem", padding: "0.5rem" },
            cadence: { fontSize: "2rem", padding: "0.5rem" }
        },
        hideSecondary: true
    },
    minimal: {
        name: "Minimal",
        description: "Clean minimal design with subtle cards",
        icon: "✨",
        gridTemplate: "1fr 1fr 1fr",
        cardSizes: {
            power: { fontSize: "5rem", padding: "1.5rem" },
            hr: { fontSize: "3.5rem", padding: "1.5rem" },
            cadence: { fontSize: "3.5rem", padding: "1.5rem" }
        },
        minimal: true
    }
};

/**
 * Apply a layout to the application
 * @param {string} layoutName - Name of the layout to apply
 */
export function applyLayout(layoutName) {
    const layout = layouts[layoutName];
    if (!layout) {
        console.error(`Layout "${layoutName}" not found`);
        return;
    }

    const metricsGrid = document.querySelector('.metrics-grid');
    const powerCard = document.querySelector('.power-card');
    const hrCard = document.querySelector('.hr-card');
    const cadenceCard = document.querySelector('.cadence-card');
    const powerValue = document.getElementById('power-value');
    const hrValue = document.getElementById('hr-value');
    const cadenceValue = document.getElementById('cadence-value');

    if (!metricsGrid) return;

    // Remove all layout classes
    document.body.classList.remove(
        'layout-classic',
        'layout-balanced',
        'layout-vertical',
        'layout-compact',
        'layout-power-focus',
        'layout-minimal'
    );

    // Add new layout class
    document.body.classList.add(`layout-${layoutName.replace(/([A-Z])/g, '-$1').toLowerCase()}`);

    // Apply grid template
    metricsGrid.style.gridTemplateColumns = layout.gridTemplate;

    // Apply card sizes
    if (powerCard && layout.cardSizes.power) {
        powerCard.style.padding = layout.cardSizes.power.padding;
    }
    if (hrCard && layout.cardSizes.hr) {
        hrCard.style.padding = layout.cardSizes.hr.padding;
    }
    if (cadenceCard && layout.cardSizes.cadence) {
        cadenceCard.style.padding = layout.cardSizes.cadence.padding;
    }

    // Apply font sizes
    if (powerValue && layout.cardSizes.power) {
        powerValue.style.fontSize = layout.cardSizes.power.fontSize;
    }
    if (hrValue && layout.cardSizes.hr) {
        hrValue.style.fontSize = layout.cardSizes.hr.fontSize;
    }
    if (cadenceValue && layout.cardSizes.cadence) {
        cadenceValue.style.fontSize = layout.cardSizes.cadence.fontSize;
    }

    // Handle special layout modes
    if (layout.hideSecondary) {
        // For power focus, stack HR and Cadence vertically
        if (hrCard && cadenceCard) {
            metricsGrid.style.gridTemplateColumns = '3fr 1fr';
            const secondaryContainer = document.createElement('div');
            secondaryContainer.className = 'secondary-metrics-stack';
            secondaryContainer.style.display = 'grid';
            secondaryContainer.style.gap = '4px';

            // Move HR and Cadence into secondary container if not already done
            if (!hrCard.parentElement.classList.contains('secondary-metrics-stack')) {
                const parent = metricsGrid;
                parent.appendChild(secondaryContainer);
                secondaryContainer.appendChild(hrCard);
                secondaryContainer.appendChild(cadenceCard);
            }
        }
    } else {
        // Restore normal structure if it was previously in power focus mode
        const secondaryStack = document.querySelector('.secondary-metrics-stack');
        if (secondaryStack) {
            const parent = metricsGrid;
            const hr = secondaryStack.querySelector('.hr-card');
            const cadence = secondaryStack.querySelector('.cadence-card');
            if (hr) parent.appendChild(hr);
            if (cadence) parent.appendChild(cadence);
            secondaryStack.remove();
        }
    }

    // Save preference
    localStorage.setItem('powerSaverLayout', layoutName);

    console.log(`Layout changed to: ${layout.name}`);
}

/**
 * Initialize layout on page load
 */
export function initializeLayout() {
    const savedLayout = localStorage.getItem('powerSaverLayout') || 'classic';
    applyLayout(savedLayout);
}

/**
 * Show layout selector modal
 */
export function showLayoutSelector() {
    const currentLayout = localStorage.getItem('powerSaverLayout') || 'classic';

    const modal = document.createElement('div');
    modal.className = 'layout-selector-modal';
    modal.innerHTML = `
        <div class="layout-selector-content">
            <div class="layout-selector-header">
                <h2>Choose Layout</h2>
                <button class="layout-selector-close" aria-label="Close">&times;</button>
            </div>
            <div class="layout-selector-grid">
                ${Object.entries(layouts).map(([key, layout]) => `
                    <button class="layout-option ${key === currentLayout ? 'active' : ''}" data-layout="${key}">
                        <div class="layout-option-icon">${layout.icon}</div>
                        <div class="layout-option-name">${layout.name}</div>
                        <div class="layout-option-description">${layout.description}</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Close button
    const closeButton = modal.querySelector('.layout-selector-close');
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    // Layout selection
    const layoutOptions = modal.querySelectorAll('.layout-option');
    layoutOptions.forEach(option => {
        option.addEventListener('click', () => {
            const layoutName = option.getAttribute('data-layout');
            applyLayout(layoutName);

            // Update active state
            layoutOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Close modal after a short delay
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

/**
 * Get all available layouts
 * @returns {Object} All layout configurations
 */
export function getAllLayouts() {
    return layouts;
}
